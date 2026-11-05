import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { env } from '../src/config/env';
import { AuditLog } from '../src/modules/audit/audit-log.model';
import { Organization } from '../src/modules/organizations/organization.model';
import { addMember, API, app, bearer, registerUser } from './helpers';

describe('organizations', () => {
  it('creates an additional organization with an OWNER membership (SAAS)', async () => {
    const { accessToken } = await registerUser();
    const res = await request(app).post(`${API}/organizations`).set(bearer(accessToken)).send({ name: 'Second Agency' });
    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe('OWNER');
    const list = await request(app).get(`${API}/organizations`).set(bearer(accessToken));
    expect(list.body.data).toHaveLength(2);
  });

  it('lists only organizations the user belongs to', async () => {
    const a = await registerUser();
    await registerUser();
    const list = await request(app).get(`${API}/organizations`).set(bearer(a.accessToken));
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0].organization._id).toBe(a.organization._id);
  });

  it('updates settings as OWNER and writes an audit log', async () => {
    const { accessToken, organization } = await registerUser();
    const res = await request(app)
      .patch(`${API}/organizations/${organization._id}`)
      .set(bearer(accessToken))
      .send({ name: 'Renamed Realty', address: { city: 'Lahore' }, currency: 'pkr' });
    expect(res.status).toBe(200);
    expect(res.body.data.organization.name).toBe('Renamed Realty');
    expect(res.body.data.organization.address.city).toBe('Lahore');
    expect(res.body.data.organization.currency).toBe('PKR');
    expect(await AuditLog.countDocuments({ action: 'organization.updated' })).toBe(1);
  });

  it('rejects an empty update and invalid values', async () => {
    const { accessToken, organization } = await registerUser();
    const empty = await request(app).patch(`${API}/organizations/${organization._id}`).set(bearer(accessToken)).send({});
    expect(empty.status).toBe(422);
    const bad = await request(app)
      .patch(`${API}/organizations/${organization._id}`)
      .set(bearer(accessToken))
      .send({ timezone: 'Mars/Olympus' });
    expect(bad.status).toBe(422);
  });

  it('enforces role-based authorization (AGENT can read but not update)', async () => {
    const owner = await registerUser();
    const agent = await registerUser();
    await addMember(agent.user._id, owner.organization._id, 'AGENT');

    const read = await request(app).get(`${API}/organizations/${owner.organization._id}`).set(bearer(agent.accessToken));
    expect(read.status).toBe(200);
    expect(read.body.data.role).toBe('AGENT');
    const write = await request(app)
      .patch(`${API}/organizations/${owner.organization._id}`)
      .set(bearer(agent.accessToken))
      .send({ name: 'Hacked' });
    expect(write.status).toBe(403);
    expect((await Organization.findById(owner.organization._id))?.name).toBe(owner.body.organizationName);
  });

  it('switches organization after re-verifying membership', async () => {
    const owner = await registerUser();
    const agent = await registerUser();
    await addMember(agent.user._id, owner.organization._id, 'AGENT');

    const asAgent = await request(app).post(`${API}/organizations/${owner.organization._id}/switch`).set(bearer(agent.accessToken));
    expect(asAgent.status).toBe(200);
    expect(asAgent.body.data.role).toBe('AGENT');
    expect(asAgent.body.data.permissions).not.toContain('org:update');

    const asOwner = await request(app).post(`${API}/organizations/${owner.organization._id}/switch`).set(bearer(owner.accessToken));
    expect(asOwner.body.data.permissions).toContain('org:update');
  });

  it('blocks a second organization in SELF_HOSTED mode', async () => {
    const { accessToken } = await registerUser();
    Object.assign(env, { DEPLOYMENT_MODE: 'SELF_HOSTED' });
    try {
      const res = await request(app).post(`${API}/organizations`).set(bearer(accessToken)).send({ name: 'Another' });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('SINGLE_ORGANIZATION_MODE');
    } finally {
      Object.assign(env, { DEPLOYMENT_MODE: 'SAAS' });
    }
  });
});