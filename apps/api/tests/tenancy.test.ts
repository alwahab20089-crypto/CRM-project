import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { Organization } from '../src/modules/organizations/organization.model';
import { User } from '../src/modules/users/user.model';
import { API, app, bearer, registerUser } from './helpers';

describe('cross-tenant isolation', () => {
  it('returns 404 (not 403) for another tenant on read, update and switch', async () => {
    const a = await registerUser();
    const b = await registerUser();
    const target = `${API}/organizations/${a.organization._id}`;

    expect((await request(app).get(target).set(bearer(b.accessToken))).status).toBe(404);
    expect((await request(app).patch(target).set(bearer(b.accessToken)).send({ name: 'Taken over' })).status).toBe(404);
    expect((await request(app).post(`${target}/switch`).set(bearer(b.accessToken))).status).toBe(404);
    expect((await Organization.findById(a.organization._id))?.name).toBe(a.body.organizationName);
  });

  it('treats a guessed or malformed id exactly like a missing organization', async () => {
    const a = await registerUser();
    const unknown = await request(app).get(`${API}/organizations/64b7f0c2a1b2c3d4e5f60718`).set(bearer(a.accessToken));
    const malformed = await request(app).get(`${API}/organizations/not-an-id`).set(bearer(a.accessToken));
    expect(unknown.status).toBe(404);
    expect(malformed.status).toBe(404);
    expect(unknown.body.message).toBe(malformed.body.message);
  });

  it('ignores a foreign X-Organization-Id on /auth/me', async () => {
    const a = await registerUser();
    const b = await registerUser();
    const res = await request(app)
      .get(`${API}/auth/me`)
      .set(bearer(b.accessToken))
      .set('X-Organization-Id', a.organization._id);
    expect(res.status).toBe(200);
    expect(res.body.data.current.organization._id).toBe(b.organization._id);
    expect(res.body.data.organizations).toHaveLength(1);
  });

  it('strips mass-assignment fields from the body', async () => {
    const a = await registerUser();
    const b = await registerUser();
    const res = await request(app)
      .patch(`${API}/organizations/${a.organization._id}`)
      .set(bearer(a.accessToken))
      .send({ name: 'Legit', ownerId: b.user._id, slug: 'stolen-slug', status: 'SUSPENDED', organizationId: b.organization._id });
    expect(res.status).toBe(200);
    const stored = await Organization.findById(a.organization._id);
    expect(String(stored?.ownerId)).toBe(a.user._id);
    expect(stored?.slug).not.toBe('stolen-slug');
    expect(stored?.status).toBe('ACTIVE');
  });

  it('gives platform admins no access to organization data', async () => {
    const owner = await registerUser();
    const admin = await registerUser();
    await User.updateOne({ _id: admin.user._id }, { $set: { platformRole: 'PLATFORM_ADMIN' } });
    const res = await request(app).get(`${API}/organizations/${owner.organization._id}`).set(bearer(admin.accessToken));
    expect(res.status).toBe(404);
  });

  it('requires authentication on every organization route', async () => {
    const a = await registerUser();
    expect((await request(app).get(`${API}/organizations`)).status).toBe(401);
    expect((await request(app).get(`${API}/organizations/${a.organization._id}`)).status).toBe(401);
  });
});