import type { Types } from 'mongoose';

type Id = Types.ObjectId | string;

export interface UserBrief {
  _id: Id;
  name: string;
  email: string;
  avatar?: string | null;
}

export interface LeadLike {
  _id: Id;
  assignedTo?: Id | null;
  firstName: string;
  lastName?: string | null;
  email?: string | null;
  phone: string;
  alternatePhone?: string | null;
  leadSource: string;
  leadType: string;
  status: string;
  priority: string;
  budget?: { min?: number | null; max?: number | null; currency?: string | null } | null;
  preferredLocation?: string[] | null;
  interestedPropertyType?: string[] | null;
  notes?: string | null;
  nextFollowUpAt?: Date | null;
  convertedContactId?: Id | null;
  wonAt?: Date | null;
  lostAt?: Date | null;
  lostReason?: string | null;
  createdBy: Id;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const iso = (d?: Date | null) => (d ? new Date(d).toISOString() : null);

/** Explicit allow-list: organizationId, ranks, search keywords and deletedBy never leave the API. */
export function toLeadDto(lead: LeadLike, assignee: UserBrief | null) {
  const budget = lead.budget?.currency ? { min: lead.budget.min ?? null, max: lead.budget.max ?? null, currency: lead.budget.currency } : null;
  return {
    _id: String(lead._id),
    firstName: lead.firstName,
    lastName: lead.lastName ?? '',
    email: lead.email ?? null,
    phone: lead.phone,
    alternatePhone: lead.alternatePhone ?? null,
    leadSource: lead.leadSource,
    leadType: lead.leadType,
    status: lead.status,
    priority: lead.priority,
    budget,
    preferredLocation: lead.preferredLocation ? [...lead.preferredLocation] : [],
    interestedPropertyType: lead.interestedPropertyType ? [...lead.interestedPropertyType] : [],
    notes: lead.notes ?? null,
    nextFollowUpAt: iso(lead.nextFollowUpAt),
    assignedTo: lead.assignedTo ? String(lead.assignedTo) : null,
    assignee: assignee
      ? { _id: String(assignee._id), name: assignee.name, email: assignee.email, avatar: assignee.avatar ?? undefined }
      : null,
    convertedContactId: lead.convertedContactId ? String(lead.convertedContactId) : null,
    wonAt: iso(lead.wonAt),
    lostAt: iso(lead.lostAt),
    lostReason: lead.lostReason ?? null,
    createdBy: String(lead.createdBy),
    deletedAt: iso(lead.deletedAt),
    createdAt: iso(lead.createdAt)!,
    updatedAt: iso(lead.updatedAt)!,
  };
}