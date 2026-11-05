
import type { Types } from 'mongoose';
import type { LeadStatus } from '../../constants';
import { AppError } from '../../utils/app-error';
import type { RequestMeta } from '../../utils/request-meta';
import { runUnitOfWork } from '../../utils/transaction';
import { Activity } from '../activities/activity.model';
import { recordActivity } from '../activities/activity.service';
import { recordAudit } from '../audit/audit.service';
import { OrganizationMember } from '../members/member.model';
import type { TenantContext } from '../members/member.service';
import { User } from '../users/user.model';
import { Lead } from './lead.model';
import { checkTransition, isTerminalStatus } from './lead.lifecycle';
import { buildSearchFilter, deriveFields } from './lead.search';
import { toLeadDto, type UserBrief } from './lead.serializer';
import type {
  ActivitiesQuery,
  CreateLeadInput,
  ListLeadsQuery,
  StatusInput,
  UpdateLeadInput,
} from './lead.validation';

type LeadFilter = Record<string, unknown>;
type Id = string | Types.ObjectId;

const MAX_SKIP = 50_000;

const FIELD_LABELS: Record<string, string> = {
  firstName: 'first name',
  lastName: 'last name',
  email: 'email',
  phone: 'phone',
  alternatePhone: 'alternate phone',
  leadSource: 'lead source',
  leadType: 'lead type',
  priority: 'priority',
  budget: 'budget',
  preferredLocation: 'preferred locations',
  interestedPropertyType: 'property types',
  notes: 'notes',
  nextFollowUpAt: 'follow-up',
};

// Audit logs never hold PII (phone, email, names, notes).
// Only approved values and changed field names are recorded.
const AUDIT_SAFE_KEYS = [
  'priority',
  'leadType',
  'leadSource',
  'nextFollowUpAt',
  'interestedPropertyType',
];

const canSeeAll = (t: TenantContext) =>
  t.permissions.includes('leads:read_all');

const can = (t: TenantContext, permission: string) =>
  t.permissions.includes(permission);

const same = (a: unknown, b: unknown) =>
  JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/**
 * Every lead query starts from the verified tenant ID.
 * Agents without leads:read_all only see their own leads.
 */
function scope(
  tenant: TenantContext,
  userId: string,
  view: 'active' | 'archived' = 'active',
): LeadFilter {
  const filter: LeadFilter = {
    organizationId: tenant.organizationId,
    deletedAt: view === 'archived' ? { $ne: null } : null,
  };

  if (!canSeeAll(tenant)) {
    filter.assignedTo = userId;
  }

  return filter;
}

async function findLead(
  tenant: TenantContext,
  userId: string,
  id: string,
  opts: { archived?: boolean; any?: boolean } = {},
) {
  const filter = scope(
    tenant,
    userId,
    opts.archived ? 'archived' : 'active',
  );

  if (opts.any) {
    delete filter.deletedAt;
  }

  const lead = await Lead.findOne({
    ...filter,
    _id: id,
  });

  if (!lead) {
    throw AppError.notFound('Lead not found');
  }

  // Identical for missing, other tenant and unauthorized records.
  return lead;
}

async function loadUsers(
  ids: Array<Id | null | undefined>,
): Promise<Map<string, UserBrief>> {
  const unique = [...new Set(ids.filter(Boolean).map(String))];

  if (unique.length === 0) {
    return new Map();
  }

  const users = await User.find({
    _id: { $in: unique },
  })
    .select('name email avatar')
    .lean();

  return new Map(
    users.map((u) => [String(u._id), u]),
  );
}

async function serialize(lead: Parameters<typeof toLeadDto>[0]) {
  const users = await loadUsers([lead.assignedTo]);

  return toLeadDto(
    lead,
    lead.assignedTo
      ? (users.get(String(lead.assignedTo)) ?? null)
      : null,
  );
}

/** Assignee must be an active, accepted member of THIS organization. */
async function assertAssignable(
  organizationId: string,
  userId: string,
) {
  const member = await OrganizationMember.exists({
    organizationId,
    userId,
    status: 'ACTIVE',
    invitationStatus: 'ACCEPTED',
  });

  if (!member) {
    throw AppError.validation([
      {
        path: 'assignedTo',
        message:
          'The selected member does not belong to this organization',
      },
    ]);
  }
}

function pickAuditable(
  source: Record<string, unknown>,
  keys: string[],
) {
  return Object.fromEntries(
    keys
      .filter((k) => AUDIT_SAFE_KEYS.includes(k))
      .map((k) => [k, source[k] ?? null]),
  );
}

/* ------------------------------------------------------------------ create */

export async function createLead(
  tenant: TenantContext,
  userId: string,
  input: CreateLeadInput,
  meta: RequestMeta,
) {
  const canAssign = can(tenant, 'leads:assign');

  let assignedTo = input.assignedTo ?? null;

  if (assignedTo && assignedTo !== userId && !canAssign) {
    throw AppError.forbidden(
      'You do not have permission to assign leads to other members',
    );
  }

  if (!assignedTo && !canAssign) {
    assignedTo = userId;
  }

  if (assignedTo) {
    await assertAssignable(tenant.organizationId, assignedTo);
  }

  // BR-17: warn (never block) about possible duplicates
  // the user is allowed to see.
  const phones = [
    input.phone,
    input.alternatePhone,
  ].filter((p): p is string => Boolean(p));

  const duplicateFilter: LeadFilter = {
    ...scope(tenant, userId),
    $or: [
      { phone: { $in: phones } },
      { alternatePhone: { $in: phones } },
      ...(input.email ? [{ email: input.email }] : []),
    ],
  };

  const duplicates = await Lead.find(duplicateFilter)
    .select('firstName lastName')
    .limit(3)
    .lean();

  const doc = {
    organizationId: tenant.organizationId,
    createdBy: userId,
    assignedTo,
    firstName: input.firstName,
    lastName: input.lastName ?? '',
    email: input.email ?? undefined,
    phone: input.phone,
    alternatePhone: input.alternatePhone ?? undefined,
    leadSource: input.leadSource,
    leadType: input.leadType,
    status: input.status ?? 'NEW',
    priority: input.priority ?? 'MEDIUM',
    budget: input.budget ?? undefined,
    preferredLocation: input.preferredLocation ?? [],
    interestedPropertyType: input.interestedPropertyType ?? [],
    notes: input.notes ?? undefined,
    nextFollowUpAt: input.nextFollowUpAt ?? undefined,
  };

  const lead = await runUnitOfWork(async (uow) => {
    const [created] = await Lead.create(
      [{ ...doc, ...deriveFields(doc) }],
      { session: uow.session },
    );

    uow.onRollback(() =>
      Lead.deleteOne({ _id: created!._id }),
    );

    await recordActivity(
      {
        organizationId: tenant.organizationId,
        userId,
        entityType: 'LEAD',
        entityId: created!._id,
        activityType: 'CREATED',
        description: 'Lead created',
      },
      uow.session,
    );

    await recordAudit(
      {
        organizationId: tenant.organizationId,
        actorId: userId,
        action: 'lead.created',
        resource: 'lead',
        resourceId: created!._id,
        after: {
          status: doc.status,
          priority: doc.priority,
          leadType: doc.leadType,
          leadSource: doc.leadSource,
          assignedTo,
        },
        meta,
      },
      uow.session,
    );

    return created!;
  });

  return {
    lead: await serialize(lead),
    duplicates: duplicates.map((d) => ({
      _id: String(d._id),
      name: `${d.firstName} ${d.lastName ?? ''}`.trim(),
    })),
  };
}

/* -------------------------------------------------------------------- read */

const SORT_FIELDS = {
  createdAt: 'createdAt',
  name: 'nameSort',
  priority: 'priorityRank',
  status: 'statusRank',
} as const;

export async function listLeads(
  tenant: TenantContext,
  userId: string,
  q: ListLeadsQuery,
) {
  if (
    q.view === 'archived' &&
    !can(tenant, 'leads:delete')
  ) {
    throw AppError.forbidden();
  }

  const filter = scope(tenant, userId, q.view);

  if (q.status) filter.status = q.status;
  if (q.priority) filter.priority = q.priority;
  if (q.leadType) filter.leadType = q.leadType;
  if (q.leadSource) filter.leadSource = q.leadSource;

  if (q.assignedTo && canSeeAll(tenant)) {
    filter.assignedTo =
      q.assignedTo === 'unassigned' ? null : q.assignedTo;
  }

  if (q.createdFrom || q.createdTo) {
    filter.createdAt = {
      ...(q.createdFrom ? { $gte: q.createdFrom } : {}),
      ...(q.createdTo ? { $lte: q.createdTo } : {}),
    };
  }

  if (q.search) {
    Object.assign(filter, buildSearchFilter(q.search) ?? {});
  }

  const dir = q.sortOrder === 'asc' ? 1 : -1;

  // Leads without a follow-up always sort last.
  // _id is the stable tiebreaker for pagination.
  const sort =
    q.sortBy === 'nextFollowUpAt'
      ? ({ hasFollowUp: -1, nextFollowUpAt: dir, _id: dir } as const)
      : ({ [SORT_FIELDS[q.sortBy]]: dir, _id: dir } as Record<string, 1 | -1>);

  const skip = (q.page - 1) * q.limit;

  if (skip > MAX_SKIP) {
    throw AppError.validation([
      {
        path: 'page',
        message:
          'Page is too deep. Narrow your filters instead.',
      },
    ]);
  }

  const [items, total] = await Promise.all([
    Lead.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(q.limit)
      .lean(),

    Lead.countDocuments(filter),
  ]);

  const users = await loadUsers(
    items.map((l) => l.assignedTo),
  );

  return {
    items: items.map((l) =>
      toLeadDto(
        l,
        l.assignedTo
          ? (users.get(String(l.assignedTo)) ?? null)
          : null,
      ),
    ),
    meta: {
      page: q.page,
      limit: q.limit,
      total,
      totalPages: Math.max(
        1,
        Math.ceil(total / q.limit),
      ),
    },
  };
}

export async function getLead(
  tenant: TenantContext,
  userId: string,
  id: string,
) {
  // Users who may delete leads can also open archived ones.
  const lead = await findLead(
    tenant,
    userId,
    id,
    { any: can(tenant, 'leads:delete') },
  );

  return serialize(lead);
}

/* ------------------------------------------------------------------ update */

export async function updateLead(
  tenant: TenantContext,
  userId: string,
  id: string,
  input: UpdateLeadInput,
  meta: RequestMeta,
) {
  const lead = await findLead(tenant, userId, id);

  const keys = Object.keys(input) as Array<keyof UpdateLeadInput>;

  const before = lead.toObject() as Record<string, unknown>;

  for (const key of keys) {
    const value = input[key];

    // null clears the field.
    lead.set(key, value === null ? undefined : value);
  }

  lead.set(deriveFields(lead));

  const after = lead.toObject() as Record<string, unknown>;

  const changed = keys.filter(
    (k) => !same(before[k], after[k]),
  );

  if (changed.length === 0) {
    return serialize(lead);
  }

  await runUnitOfWork(async (uow) => {
    await lead.save({ session: uow.session });

    const labels = changed
      .map((k) => FIELD_LABELS[k] ?? k)
      .join(', ');

    await recordActivity(
      {
        organizationId: tenant.organizationId,
        userId,
        entityType: 'LEAD',
        entityId: lead._id,
        activityType: 'UPDATE',
        description: `Updated ${labels}`,
        metadata: { changed },
      },
      uow.session,
    );

    if (changed.includes('nextFollowUpAt')) {
      await recordActivity(
        {
          organizationId: tenant.organizationId,
          userId,
          entityType: 'LEAD',
          entityId: lead._id,
          activityType: 'FOLLOW_UP',
          description: lead.nextFollowUpAt
            ? `Follow-up scheduled for ${lead.nextFollowUpAt.toISOString()}`
            : 'Follow-up cleared',
          metadata: {
            nextFollowUpAt: lead.nextFollowUpAt ?? null,
          },
        },
        uow.session,
      );
    }

    await recordAudit(
      {
        organizationId: tenant.organizationId,
        actorId: userId,
        action: 'lead.updated',
        resource: 'lead',
        resourceId: lead._id,
        before: pickAuditable(before, changed),
        after: {
          ...pickAuditable(after, changed),
          changedFields: changed,
        },
        meta,
      },
      uow.session,
    );
  });

  return serialize(lead);
}

/* ------------------------------------------------------------------ status */

export async function changeStatus(
  tenant: TenantContext,
  userId: string,
  id: string,
  input: StatusInput,
  meta: RequestMeta,
) {
  const lead = await findLead(tenant, userId, id);

  const from = lead.status as LeadStatus;
  const to = input.status;

  const check = checkTransition(from, to);

  if (!check.allowed) {
    throw AppError.conflict(
      check.reason,
      'INVALID_STATUS_TRANSITION',
    );
  }

  if (check.reopen) {
    if (!can(tenant, 'leads:reopen')) {
      throw AppError.forbidden(
        'Only managers and above can reopen a closed lead',
      );
    }

    if (!input.reason) {
      throw AppError.validation([
        {
          path: 'reason',
          message: 'A reason is required to reopen a lead',
        },
      ]);
    }
  }

  const now = new Date();

  const set: Record<string, unknown> = {
    status: to,
    statusRank: deriveFields({
      ...lead.toObject(),
      status: to,
    }).statusRank,
  };

  const unset: Record<string, 1> = {};

  if (to === 'WON') {
    set.wonAt = now;
    unset.lostAt = 1;
    unset.lostReason = 1;
  } else if (to === 'LOST') {
    set.lostAt = now;
    set.lostReason = input.reason;
    unset.wonAt = 1;
  } else if (check.reopen) {
    Object.assign(unset, {
      wonAt: 1,
      lostAt: 1,
      lostReason: 1,
    });
  }

  if (isTerminalStatus(to)) {
    unset.nextFollowUpAt = 1;
    set.hasFollowUp = false;
  }

  const updated = await runUnitOfWork(async (uow) => {
    // Optimistic concurrency: only update if status
    // is still what this request originally saw.
    const result = await Lead.findOneAndUpdate(
      {
        _id: lead._id,
        organizationId: tenant.organizationId,
        status: from,
        deletedAt: null,
      },
      {
        $set: set,
        ...(Object.keys(unset).length
          ? { $unset: unset }
          : {}),
      },
      {
        new: true,
        session: uow.session,
      },
    );

    if (!result) {
      throw AppError.conflict(
        'This lead was changed by someone else. Refresh and try again.',
        'LEAD_CONFLICT',
      );
    }

    await recordActivity(
      {
        organizationId: tenant.organizationId,
        userId,
        entityType: 'LEAD',
        entityId: lead._id,
        activityType: 'STATUS_CHANGE',
        description: `Status changed from ${from} to ${to}${input.reason ? `: ${input.reason}` : ''}`,
        metadata: {
          from,
          to,
          reason: input.reason ?? null,
          reopened: check.reopen,
        },
      },
      uow.session,
    );

    await recordAudit(
      {
        organizationId: tenant.organizationId,
        actorId: userId,
        action: check.reopen
          ? 'lead.reopened'
          : 'lead.status_changed',
        resource: 'lead',
        resourceId: lead._id,
        before: { status: from },
        after: {
          status: to,
          reason: input.reason ?? null,
        },
        meta,
      },
      uow.session,
    );

    return result;
  });

  return serialize(updated);
}

/* ------------------------------------------------------------------ assign */

export async function assignLead(
  tenant: TenantContext,
  userId: string,
  id: string,
  assignedTo: string | null,
  meta: RequestMeta,
) {
  const lead = await findLead(tenant, userId, id);

  if (assignedTo) {
    await assertAssignable(tenant.organizationId, assignedTo);
  }

  const previous = lead.assignedTo
    ? String(lead.assignedTo)
    : null;

  if (previous === assignedTo) {
    return serialize(lead);
  }

  const users = await loadUsers([previous, assignedTo]);

  const name = (uid: string | null) =>
    uid
      ? (users.get(uid)?.name ?? 'a former member')
      : null;

  const description = !assignedTo
    ? `Unassigned (was ${name(previous)})`
    : previous
      ? `Reassigned from ${name(previous)} to ${name(assignedTo)}`
      : `Assigned to ${name(assignedTo)}`;

  await runUnitOfWork(async (uow) => {
    lead.assignedTo = (assignedTo ?? null) as never;

    await lead.save({ session: uow.session });

    await recordActivity(
      {
        organizationId: tenant.organizationId,
        userId,
        entityType: 'LEAD',
        entityId: lead._id,
        activityType: 'ASSIGNMENT',
        description,
        metadata: {
          from: previous,
          to: assignedTo,
          assignedBy: userId,
        },
      },
      uow.session,
    );

    await recordAudit(
      {
        organizationId: tenant.organizationId,
        actorId: userId,
        action: 'lead.assigned',
        resource: 'lead',
        resourceId: lead._id,
        before: { assignedTo: previous },
        after: { assignedTo },
        meta,
      },
      uow.session,
    );
  });

  return serialize(lead);
}

/* ------------------------------------------------------ delete and restore */

export async function deleteLead(
  tenant: TenantContext,
  userId: string,
  id: string,
  meta: RequestMeta,
) {
  const lead = await findLead(tenant, userId, id);

  await runUnitOfWork(async (uow) => {
    lead.deletedAt = new Date();
    lead.deletedBy = userId as never;

    await lead.save({ session: uow.session });

    await recordActivity(
      {
        organizationId: tenant.organizationId,
        userId,
        entityType: 'LEAD',
        entityId: lead._id,
        activityType: 'UPDATE',
        description: 'Lead archived',
      },
      uow.session,
    );

    await recordAudit(
      {
        organizationId: tenant.organizationId,
        actorId: userId,
        action: 'lead.deleted',
        resource: 'lead',
        resourceId: lead._id,
        meta,
      },
      uow.session,
    );
  });

  // History (activities, audit) is preserved.
  // Nothing is hard-deleted.
  return serialize(lead);
}

export async function restoreLead(
  tenant: TenantContext,
  userId: string,
  id: string,
  meta: RequestMeta,
) {
  const lead = await findLead(
    tenant,
    userId,
    id,
    { archived: true },
  );

  await runUnitOfWork(async (uow) => {
    lead.deletedAt = null;
    lead.set('deletedBy', undefined);

    await lead.save({ session: uow.session });

    await recordActivity(
      {
        organizationId: tenant.organizationId,
        userId,
        entityType: 'LEAD',
        entityId: lead._id,
        activityType: 'UPDATE',
        description: 'Lead restored',
      },
      uow.session,
    );

    await recordAudit(
      {
        organizationId: tenant.organizationId,
        actorId: userId,
        action: 'lead.restored',
        resource: 'lead',
        resourceId: lead._id,
        meta,
      },
      uow.session,
    );
  });

  return serialize(lead);
}

/* ------------------------------------------------------ notes & activities */

export async function addNote(
  tenant: TenantContext,
  userId: string,
  id: string,
  body: string,
) {
  const lead = await findLead(tenant, userId, id);

  const note = await recordActivity({
    organizationId: tenant.organizationId,
    userId,
    entityType: 'LEAD',
    entityId: lead._id,
    activityType: 'NOTE',
    description: body,
  });

  return toActivityDto(
    note.toObject(),
    await loadUsers([userId]),
  );
}

export async function listActivities(
  tenant: TenantContext,
  userId: string,
  id: string,
  q: ActivitiesQuery,
) {
  const lead = await findLead(
    tenant,
    userId,
    id,
    { any: can(tenant, 'leads:delete') },
  );

  const filter = {
    organizationId: tenant.organizationId,
    entityType: 'LEAD' as const,
    entityId: lead._id,
    ...(q.type ? { activityType: q.type } : {}),
  };

  const [items, total] = await Promise.all([
    Activity.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((q.page - 1) * q.limit)
      .limit(q.limit)
      .lean(),

    Activity.countDocuments(filter),
  ]);

  const users = await loadUsers(
    items.map((a) => a.userId),
  );

  return {
    items: items.map((a) => toActivityDto(a, users)),
    meta: {
      page: q.page,
      limit: q.limit,
      total,
      totalPages: Math.max(
        1,
        Math.ceil(total / q.limit),
      ),
    },
  };
}

function toActivityDto(
  a: {
    _id: Id;
    userId: Id;
    entityType: string;
    entityId: Id;
    activityType: string;
    description: string;
    metadata?: unknown;
    createdAt: Date;
  },
  users: Map<string, UserBrief>,
) {
  const user = users.get(String(a.userId));

  return {
    _id: String(a._id),
    entityType: a.entityType,
    entityId: String(a.entityId),
    activityType: a.activityType,
    description: a.description,
    metadata: a.metadata ?? null,
    user: user
      ? {
          _id: String(user._id),
          name: user.name,
        }
      : null,
    createdAt: new Date(a.createdAt).toISOString(),
  };
}
