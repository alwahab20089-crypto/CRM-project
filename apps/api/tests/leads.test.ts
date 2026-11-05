import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { Activity } from '../src/modules/activities/activity.model';
import { AuditLog } from '../src/modules/audit/audit-log.model';
import { OrganizationMember } from '../src/modules/members/member.model';
import { Lead } from '../src/modules/leads/lead.model';
import { addMember, API, app, bearer, registerUser } from './helpers';

const as = (token: string, org: string) => {
  const call = (method: 'get' | 'post' | 'patch' | 'delete', url: string, body?: object) => {
    const req = request(app)[method](`${API}${url}`).set(bearer(token)).set('X-Organization-Id', org);
    return body ? req.send(body) : req;
  };
  return {
    get: (u: string) => call('get', u),
    post: (u: string, b?: object) => call('post', u, b),
    patch: (u: string, b?: object) => call('patch', u, b),
    delete: (u: string) => call('delete', u),
  };
};

const validLead = (over: object = {}) => ({
  firstName: 'Olivia', lastName: 'Bennett', phone: '+1 (555) 010-0100', email: 'Olivia@Example.com',
  leadSource: 'WEBSITE', leadType: 'BUYER', ...over,
});

async function setup() {
  const owner = await registerUser();
  const org = owner.organization._id;
  return { owner, org, api: as(owner.accessToken, org) };
}
async function memberOf(org: string, role: 'ADMIN' | 'MANAGER' | 'AGENT') {
  const u = await registerUser();
  await addMember(u.user._id, org, role);
  return { ...u, api: as(u.accessToken, org) };
}

describe('create', () => {
  it('derives tenant and author server-side, normalizes input and hides internals', async () => {
    const { owner, org, api } = await setup();
    const other = await registerUser();
    const res = await api.post('/leads', validLead({ organizationId: other.organization._id, createdBy: other.user._id, priorityRank: 99 }));
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ email: 'olivia@example.com', phone: '+15550100100', status: 'NEW', priority: 'MEDIUM' });
    expect(res.body.data.organizationId).toBeUndefined();
    expect(res.body.data.searchKeywords).toBeUndefined();
    const stored = await Lead.findById(res.body.data._id);
    expect(String(stored?.organizationId)).toBe(org);
    expect(String(stored?.createdBy)).toBe(owner.user._id);
    expect(stored?.priorityRank).toBe(1);
  });

  it('stores budget as integer minor units and rejects invalid budgets', async () => {
    const { api } = await setup();
    const ok = await api.post('/leads', validLead({ budget: { min: 10_000_000, max: 20_000_000, currency: 'usd' } }));
    expect(ok.status).toBe(201);
    expect(ok.body.data.budget).toEqual({ min: 10_000_000, max: 20_000_000, currency: 'USD' });
    for (const budget of [
      { min: 500, max: 100, currency: 'USD' },
      { min: 10.5, currency: 'USD' },
      { min: -1, currency: 'USD' },
      { min: 100, currency: 'DOLLARS' },
    ]) {
      const bad = await api.post('/leads', validLead({ budget }));
      expect(bad.status).toBe(422);
    }
  });

  it('rejects invalid data with field errors', async () => {
    const { api } = await setup();
    const res = await api.post('/leads', { firstName: '', phone: '12', email: 'nope', leadSource: 'TELEPATHY', leadType: 'BUYER' });
    expect(res.status).toBe(422);
    const paths = res.body.errors.map((e: { path: string }) => e.path);
    expect(paths).toEqual(expect.arrayContaining(['firstName', 'phone', 'email', 'leadSource']));
  });

  it('requires authentication and an organization header', async () => {
    const { owner } = await setup();
    expect((await request(app).post(`${API}/leads`).send(validLead())).status).toBe(401);
    const noHeader = await request(app).post(`${API}/leads`).set(bearer(owner.accessToken)).send(validLead());
    expect(noHeader.status).toBe(400);
    expect(noHeader.body.code).toBe('ORGANIZATION_REQUIRED');
  });

  it('writes an activity and an audit log without PII', async () => {
    const { api } = await setup();
    const res = await api.post('/leads', validLead());
    expect(await Activity.countDocuments({ entityId: res.body.data._id, activityType: 'CREATED' })).toBe(1);
    const audit = await AuditLog.findOne({ action: 'lead.created' }).lean();
    expect(audit).toBeTruthy();
    expect(JSON.stringify(audit)).not.toMatch(/olivia|555/i);
  });

  it('warns about duplicates without blocking', async () => {
    const { api } = await setup();
    await api.post('/leads', validLead());
    const dup = await api.post('/leads', validLead({ firstName: 'Olive' }));
    expect(dup.status).toBe(201);
    expect(dup.body.meta.duplicates).toHaveLength(1);
  });

  it('auto-assigns agents to themselves and forbids assigning others', async () => {
    const { org } = await setup();
    const agent = await memberOf(org, 'AGENT');
    const mine = await agent.api.post('/leads', validLead());
    expect(mine.body.data.assignedTo).toBe(agent.user._id);
    const other = await memberOf(org, 'AGENT');
    const forbidden = await agent.api.post('/leads', validLead({ assignedTo: other.user._id }));
    expect(forbidden.status).toBe(403);
  });

  it('rejects an assignee from another organization with 422', async () => {
    const { api } = await setup();
    const outsider = await registerUser();
    const res = await api.post('/leads', validLead({ assignedTo: outsider.user._id }));
    expect(res.status).toBe(422);
    expect(res.body.errors[0].path).toBe('assignedTo');
  });
});

describe('tenant isolation', () => {
  it('returns 404 for every cross-tenant operation and never leaks existence', async () => {
    const a = await setup();
    const b = await setup();
    const lead = (await a.api.post('/leads', validLead())).body.data;
    const url = `/leads/${lead._id}`;
    const attempts = [
      b.api.get(url), b.api.patch(url, { firstName: 'X' }), b.api.delete(url),
      b.api.patch(`${url}/status`, { status: 'CONTACTED' }), b.api.patch(`${url}/assign`, { assignedTo: null }),
      b.api.post(`${url}/notes`, { body: 'hi' }), b.api.get(`${url}/activities`), b.api.post(`${url}/restore`),
    ];
    for (const res of await Promise.all(attempts)) expect(res.status).toBe(404);
    const missing = await b.api.get('/leads/64b7f0c2a1b2c3d4e5f60718');
    expect(missing.body.message).toBe((await b.api.get(url)).body.message);
    expect((await Lead.findById(lead._id))?.firstName).toBe('Olivia');
  });

  it('refuses an organization the user does not belong to', async () => {
    const a = await setup();
    const b = await registerUser();
    const res = await as(b.accessToken, a.org).get('/leads');
    expect(res.status).toBe(404);
  });

  it('only lists the active organization leads', async () => {
    const a = await setup();
    const b = await setup();
    await a.api.post('/leads', validLead());
    await b.api.post('/leads', validLead({ firstName: 'Zed' }));
    const list = await a.api.get('/leads');
    expect(list.body.meta.total).toBe(1);
    expect(list.body.data[0].firstName).toBe('Olivia');
  });

  it('restricts agents to their own leads (BR-18)', async () => {
    const { org, api } = await setup();
    const agent = await memberOf(org, 'AGENT');
    const unassigned = (await api.post('/leads', validLead({ firstName: 'Hidden' }))).body.data;
    const mine = (await agent.api.post('/leads', validLead({ firstName: 'Mine', phone: '03001234567' }))).body.data;
    const list = await agent.api.get('/leads');
    expect(list.body.data.map((l: { _id: string }) => l._id)).toEqual([mine._id]);
    expect((await agent.api.get(`/leads/${unassigned._id}`)).status).toBe(404);
  });
});

describe('list', () => {
  const seed = async (api: ReturnType<typeof as>) => {
    const rows = [
      { firstName: 'Charlie', priority: 'LOW', leadType: 'SELLER', leadSource: 'FACEBOOK', phone: '03001111111', email: 'charlie@mail.com' },
      { firstName: 'Alice', priority: 'URGENT', leadType: 'BUYER', leadSource: 'WEBSITE', phone: '03002222222' },
      { firstName: 'Bob', priority: 'HIGH', leadType: 'BUYER', leadSource: 'REFERRAL', phone: '+923003333333' },
      { firstName: 'Dana', priority: 'MEDIUM', leadType: 'TENANT', leadSource: 'WALK_IN', phone: '03004444444' },
      { firstName: 'Eve', priority: 'MEDIUM', leadType: 'BUYER', leadSource: 'WEBSITE', phone: '03005555555' },
    ];
    for (const row of rows) expect((await api.post('/leads', validLead({ lastName: '', ...row }))).status).toBe(201);
  };

  it('paginates with metadata', async () => {
    const { api } = await setup();
    await seed(api);
    const p2 = await api.get('/leads?limit=2&page=2');
    expect(p2.body.meta).toEqual({ page: 2, limit: 2, total: 5, totalPages: 3 });
    expect(p2.body.data).toHaveLength(2);
    expect((await api.get('/leads?limit=101')).status).toBe(422);
    expect((await api.get('/leads?bogus=1')).status).toBe(422);
  });

  it('filters', async () => {
    const { api } = await setup();
    await seed(api);
    expect((await api.get('/leads?leadType=BUYER')).body.meta.total).toBe(3);
    expect((await api.get('/leads?priority=URGENT')).body.data[0].firstName).toBe('Alice');
    expect((await api.get('/leads?leadSource=WEBSITE')).body.meta.total).toBe(2);
    expect((await api.get('/leads?assignedTo=unassigned')).body.meta.total).toBe(5);
    const future = new Date(Date.now() + 86_400_000).toISOString();
    expect((await api.get(`/leads?createdFrom=${encodeURIComponent(future)}`)).body.meta.total).toBe(0);
  });

  it('sorts by priority rank (not alphabetically) and by name', async () => {
    const { api } = await setup();
    await seed(api);
    const byPriority = await api.get('/leads?sortBy=priority&sortOrder=desc');
    expect(byPriority.body.data.map((l: { priority: string }) => l.priority).slice(0, 3)).toEqual(['URGENT', 'HIGH', 'MEDIUM']);
    const byName = await api.get('/leads?sortBy=name&sortOrder=asc');
    expect(byName.body.data.map((l: { firstName: string }) => l.firstName)).toEqual(['Alice', 'Bob', 'Charlie', 'Dana', 'Eve']);
  });

  it('searches by name prefix, email and phone', async () => {
    const { api } = await setup();
    await seed(api);
    expect((await api.get('/leads?search=ali')).body.data.map((l: { firstName: string }) => l.firstName)).toEqual(['Alice']);
    expect((await api.get('/leads?search=charlie@')).body.meta.total).toBe(1);
    expect((await api.get('/leads?search=0300222')).body.data[0].firstName).toBe('Alice');
    expect((await api.get('/leads?search=%2B92300333')).body.data[0].firstName).toBe('Bob');
    expect((await api.get('/leads?search=zzzz')).body.meta.total).toBe(0);
    expect((await api.get('/leads?search=.*')).status).toBe(200); // regex characters are neutralized
  });
});

describe('read and update', () => {
  it('returns a lead with its assignee', async () => {
    const { org, api } = await setup();
    const member = await memberOf(org, 'MANAGER');
    const lead = (await api.post('/leads', validLead({ assignedTo: member.user._id }))).body.data;
    const res = await api.get(`/leads/${lead._id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.assignee).toMatchObject({ _id: member.user._id });
  });

  it('updates fields, clears values with null and records an activity', async () => {
    const { api } = await setup();
    const lead = (await api.post('/leads', validLead())).body.data;
    const res = await api.patch(`/leads/${lead._id}`, { firstName: 'Olivia B', email: null, priority: 'HIGH', status: 'WON' });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ firstName: 'Olivia B', email: null, priority: 'HIGH', status: 'NEW' }); // status ignored here
    expect(await Activity.countDocuments({ entityId: lead._id, activityType: 'UPDATE' })).toBe(1);
  });

  it('records a follow-up activity and rejects empty bodies', async () => {
    const { api } = await setup();
    const lead = (await api.post('/leads', validLead())).body.data;
    const when = new Date(Date.now() + 86_400_000).toISOString();
    const res = await api.patch(`/leads/${lead._id}`, { nextFollowUpAt: when });
    expect(res.body.data.nextFollowUpAt).toBe(when);
    expect(await Activity.countDocuments({ entityId: lead._id, activityType: 'FOLLOW_UP' })).toBe(1);
    expect((await api.patch(`/leads/${lead._id}`, {})).status).toBe(422);
  });

  it('rejects malformed ids with 404', async () => {
    const { api } = await setup();
    expect((await api.get('/leads/not-an-id')).status).toBe(404);
  });
});

describe('status lifecycle', () => {
  it('changes status and records from/to', async () => {
    const { api } = await setup();
    const lead = (await api.post('/leads', validLead())).body.data;
    const res = await api.patch(`/leads/${lead._id}/status`, { status: 'CONTACTED' });
    expect(res.body.data.status).toBe('CONTACTED');
    const activity = await Activity.findOne({ entityId: lead._id, activityType: 'STATUS_CHANGE' }).lean();
    expect(activity?.metadata).toMatchObject({ from: 'NEW', to: 'CONTACTED' });
    expect(await AuditLog.countDocuments({ action: 'lead.status_changed' })).toBe(1);
  });

  it('sets wonAt, requires a reason for LOST and sets lostAt', async () => {
    const { api } = await setup();
    const won = (await api.post('/leads', validLead())).body.data;
    const wonRes = await api.patch(`/leads/${won._id}/status`, { status: 'WON' });
    expect(wonRes.body.data.wonAt).toEqual(expect.any(String));

    const lost = (await api.post('/leads', validLead({ phone: '03009999999' }))).body.data;
    expect((await api.patch(`/leads/${lost._id}/status`, { status: 'LOST' })).status).toBe(422);
    const lostRes = await api.patch(`/leads/${lost._id}/status`, { status: 'LOST', reason: 'Bought elsewhere' });
    expect(lostRes.body.data).toMatchObject({ status: 'LOST', lostReason: 'Bought elsewhere' });
    expect(lostRes.body.data.lostAt).toEqual(expect.any(String));
  });

  it('rejects no-op and terminal-to-terminal transitions with 409', async () => {
    const { api } = await setup();
    const lead = (await api.post('/leads', validLead())).body.data;
    expect((await api.patch(`/leads/${lead._id}/status`, { status: 'NEW' })).status).toBe(409);
    await api.patch(`/leads/${lead._id}/status`, { status: 'WON' });
    const res = await api.patch(`/leads/${lead._id}/status`, { status: 'LOST', reason: 'changed mind' });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('INVALID_STATUS_TRANSITION');
  });

  it('lets managers reopen with a reason and keeps the history', async () => {
    const { org, api } = await setup();
    const manager = await memberOf(org, 'MANAGER');
    const lead = (await api.post('/leads', validLead())).body.data;
    await api.patch(`/leads/${lead._id}/status`, { status: 'LOST', reason: 'No budget' });
    expect((await manager.api.patch(`/leads/${lead._id}/status`, { status: 'NEW' })).status).toBe(422); // reason required
    const res = await manager.api.patch(`/leads/${lead._id}/status`, { status: 'CONTACTED', reason: 'Client came back' });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ status: 'CONTACTED', lostAt: null, lostReason: null });
    expect(await AuditLog.countDocuments({ action: 'lead.reopened' })).toBe(1);
    expect(await Activity.countDocuments({ entityId: lead._id, activityType: 'STATUS_CHANGE' })).toBe(2);
  });

  it('forbids agents from reopening', async () => {
    const { org, api } = await setup();
    const agent = await memberOf(org, 'AGENT');
    const lead = (await api.post('/leads', validLead({ assignedTo: agent.user._id }))).body.data;
    await api.patch(`/leads/${lead._id}/status`, { status: 'WON' });
    const res = await agent.api.patch(`/leads/${lead._id}/status`, { status: 'NEW', reason: 'please' });
    expect(res.status).toBe(403);
  });
});

describe('assignment', () => {
  it('assigns, reassigns and unassigns with activity history', async () => {
    const { org, api } = await setup();
    const a = await memberOf(org, 'AGENT');
    const b = await memberOf(org, 'AGENT');
    const lead = (await api.post('/leads', validLead())).body.data;
    expect((await api.patch(`/leads/${lead._id}/assign`, { assignedTo: a.user._id })).body.data.assignee._id).toBe(a.user._id);
    await api.patch(`/leads/${lead._id}/assign`, { assignedTo: b.user._id });
    const cleared = await api.patch(`/leads/${lead._id}/assign`, { assignedTo: null });
    expect(cleared.body.data.assignedTo).toBeNull();
    expect(await Activity.countDocuments({ entityId: lead._id, activityType: 'ASSIGNMENT' })).toBe(3);
  });

  it('rejects non-members and suspended members', async () => {
    const { org, api } = await setup();
    const lead = (await api.post('/leads', validLead())).body.data;
    const outsider = await registerUser();
    expect((await api.patch(`/leads/${lead._id}/assign`, { assignedTo: outsider.user._id })).status).toBe(422);
    const suspended = await memberOf(org, 'AGENT');
    await OrganizationMember.updateOne({ userId: suspended.user._id, organizationId: org }, { $set: { status: 'SUSPENDED' } });
    expect((await api.patch(`/leads/${lead._id}/assign`, { assignedTo: suspended.user._id })).status).toBe(422);
  });

  it('forbids agents from assigning', async () => {
    const { org, api } = await setup();
    const agent = await memberOf(org, 'AGENT');
    const lead = (await api.post('/leads', validLead({ assignedTo: agent.user._id }))).body.data;
    expect((await agent.api.patch(`/leads/${lead._id}/assign`, { assignedTo: null })).status).toBe(403);
  });
});

describe('soft delete and restore', () => {
  it('forbids agents and managers, archives for admins and keeps history', async () => {
    const { org, api } = await setup();
    const agent = await memberOf(org, 'AGENT');
    const admin = await memberOf(org, 'ADMIN');
    const lead = (await api.post('/leads', validLead({ assignedTo: agent.user._id }))).body.data;
    expect((await agent.api.delete(`/leads/${lead._id}`)).status).toBe(403);

    expect((await admin.api.delete(`/leads/${lead._id}`)).status).toBe(200);
    expect((await api.get('/leads')).body.meta.total).toBe(0);
    expect((await api.get('/leads?view=archived')).body.meta.total).toBe(1);
    expect((await agent.api.get('/leads?view=archived')).status).toBe(403);
    expect(await Lead.countDocuments({ _id: lead._id })).toBe(1); // never hard-deleted
    expect(await Activity.countDocuments({ entityId: lead._id })).toBeGreaterThanOrEqual(2);

    const restored = await admin.api.post(`/leads/${lead._id}/restore`);
    expect(restored.body.data.deletedAt).toBeNull();
    expect((await api.get('/leads')).body.meta.total).toBe(1);
    expect((await admin.api.post(`/leads/${lead._id}/restore`)).status).toBe(404); // not archived
  });
});

describe('notes and activities', () => {
  it('adds notes and lists activities newest first, filterable by type', async () => {
    const { api } = await setup();
    const lead = (await api.post('/leads', validLead())).body.data;
    const note = await api.post(`/leads/${lead._id}/notes`, { body: 'Called, wants a 3-bed.' });
    expect(note.status).toBe(201);
    expect(note.body.data.user.name).toBe('Test User');
    const all = await api.get(`/leads/${lead._id}/activities`);
    expect(all.body.data[0].activityType).toBe('NOTE');
    expect(all.body.data.at(-1).activityType).toBe('CREATED');
    expect((await api.get(`/leads/${lead._id}/activities?type=NOTE`)).body.meta.total).toBe(1);
  });

  it('validates note length', async () => {
    const { api } = await setup();
    const lead = (await api.post('/leads', validLead())).body.data;
    expect((await api.post(`/leads/${lead._id}/notes`, { body: '   ' })).status).toBe(422);
    expect((await api.post(`/leads/${lead._id}/notes`, { body: 'x'.repeat(2001) })).status).toBe(422);
  });
});

describe('members endpoint', () => {
  it('lists active members for managers and above only', async () => {
    const { org, api } = await setup();
    const manager = await memberOf(org, 'MANAGER');
    const agent = await memberOf(org, 'AGENT');
    expect((await manager.api.get('/members')).body.data).toHaveLength(3);
    expect((await agent.api.get('/members')).status).toBe(403);
    expect((await api.get('/members')).status).toBe(200);
  });
});