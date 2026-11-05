import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { env } from '../src/config/env';
import { OrganizationMember } from '../src/modules/members/member.model';
import { PasswordResetToken } from '../src/modules/auth/password-reset-token.model';
import { RefreshToken } from '../src/modules/refresh-tokens/refresh-token.model';
import { User } from '../src/modules/users/user.model';
import { mailer } from '../src/utils/mailer';
import { API, app, bearer, CSRF, extractRefreshCookie, registerUser } from './helpers';

describe('POST /auth/register', () => {
  it('creates a user, an organization and an OWNER membership', async () => {
    const { res, body } = await registerUser();
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.body.data.user.email).toBe(body.email);
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.body.data.membership.role).toBe('OWNER');
    const cookie = (res.headers['set-cookie'] as unknown as string[])[0]!;
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Strict/i);
    expect(cookie).toMatch(/Path=\/api\/v1\/auth/);
    expect(await User.countDocuments()).toBe(1);
    expect(await OrganizationMember.countDocuments({ role: 'OWNER' })).toBe(1);
  });

  it('hashes the password with Argon2id', async () => {
    const { body } = await registerUser();
    const user = await User.findOne({ email: body.email }).select('+passwordHash');
    expect(user?.passwordHash).toMatch(/^\$argon2id\$/);
  });

  it('rejects a duplicate email (case-insensitive)', async () => {
    const { body } = await registerUser({ email: 'dupe@example.com' });
    const res = await request(app).post(`${API}/auth/register`).send({ ...body, email: 'DUPE@example.com' });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('EMAIL_IN_USE');
    expect(await User.countDocuments()).toBe(1);
  });

  it('rejects missing fields and invalid email with 422', async () => {
    const missing = await request(app).post(`${API}/auth/register`).send({ email: 'a@b.com' });
    expect(missing.status).toBe(422);
    expect(missing.body.errors.length).toBeGreaterThan(0);
    const invalid = await request(app)
      .post(`${API}/auth/register`)
      .send({ name: 'Test', email: 'not-an-email', password: 'long-enough-pw', organizationName: 'Org' });
    expect(invalid.status).toBe(422);
    expect(await User.countDocuments()).toBe(0);
  });

  it('is closed after first-run in SELF_HOSTED mode', async () => {
    await registerUser();
    const original = env.DEPLOYMENT_MODE;
    Object.assign(env, { DEPLOYMENT_MODE: 'SELF_HOSTED' });
    try {
      const res = await request(app)
        .post(`${API}/auth/register`)
        .send({ name: 'Second', email: 'second@example.com', password: 'long-enough-pw', organizationName: 'Org' });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('REGISTRATION_CLOSED');
    } finally {
      Object.assign(env, { DEPLOYMENT_MODE: original });
    }
  });
});

describe('POST /auth/login', () => {
  it('signs in with correct credentials', async () => {
    const { body } = await registerUser();
    const res = await request(app).post(`${API}/auth/login`).send({ email: body.email, password: body.password });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(extractRefreshCookie(res)).toMatch(/^ef_rt=/);
    expect((await User.findOne({ email: body.email }))?.lastLoginAt).toBeInstanceOf(Date);
  });

  it('returns the same generic error for a wrong password and an unknown email', async () => {
    const { body } = await registerUser();
    const wrong = await request(app).post(`${API}/auth/login`).send({ email: body.email, password: 'wrong-password-123' });
    const unknown = await request(app).post(`${API}/auth/login`).send({ email: 'nobody@example.com', password: 'wrong-password-123' });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.message).toBe(unknown.body.message);
    expect(wrong.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('rejects missing fields', async () => {
    const res = await request(app).post(`${API}/auth/login`).send({});
    expect(res.status).toBe(422);
  });
});

describe('refresh tokens', () => {
  it('rotates the refresh token and issues a new access token', async () => {
    const first = await registerUser();
    const res = await request(app).post(`${API}/auth/refresh`).set('Cookie', first.cookie).set(CSRF);
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(extractRefreshCookie(res)).not.toBe(first.cookie);

    // the old token is consumed
    const old = await request(app).post(`${API}/auth/refresh`).set('Cookie', first.cookie).set(CSRF);
    expect(old.status).toBe(401);
  });

  it('tolerates a near-simultaneous replay without killing the session (race grace)', async () => {
    const first = await registerUser();
    const r1 = await request(app).post(`${API}/auth/refresh`).set('Cookie', first.cookie).set(CSRF);
    const cookie2 = extractRefreshCookie(r1);
    const replay = await request(app).post(`${API}/auth/refresh`).set('Cookie', first.cookie).set(CSRF);
    expect(replay.status).toBe(401);
    expect(replay.body.code).toBe('REFRESH_CONFLICT');
    const stillValid = await request(app).post(`${API}/auth/refresh`).set('Cookie', cookie2).set(CSRF);
    expect(stillValid.status).toBe(200);
  });

  it('detects reuse of a rotated token and revokes the whole family', async () => {
    const first = await registerUser();
    const r1 = await request(app).post(`${API}/auth/refresh`).set('Cookie', first.cookie).set(CSRF);
    const cookie2 = extractRefreshCookie(r1);

    // move the rotation outside the grace window
    await RefreshToken.updateMany({ revokedAt: { $ne: null } }, { $set: { revokedAt: new Date(Date.now() - 60_000) } });

    const reuse = await request(app).post(`${API}/auth/refresh`).set('Cookie', first.cookie).set(CSRF);
    expect(reuse.status).toBe(401);
    expect(reuse.body.code).toBe('SESSION_EXPIRED');

    const descendant = await request(app).post(`${API}/auth/refresh`).set('Cookie', cookie2).set(CSRF);
    expect(descendant.status).toBe(401);
  });

  it('requires the CSRF header', async () => {
    const { cookie } = await registerUser();
    const res = await request(app).post(`${API}/auth/refresh`).set('Cookie', cookie);
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('CSRF_HEADER_REQUIRED');
  });

  it('rejects a request without a cookie', async () => {
    const res = await request(app).post(`${API}/auth/refresh`).set(CSRF);
    expect(res.status).toBe(401);
  });
});

describe('POST /auth/logout', () => {
  it('revokes the session and clears the cookie', async () => {
    const { cookie } = await registerUser();
    const res = await request(app).post(`${API}/auth/logout`).set('Cookie', cookie).set(CSRF);
    expect(res.status).toBe(200);
    expect((res.headers['set-cookie'] as unknown as string[])[0]).toMatch(/ef_rt=;/);
    const refresh = await request(app).post(`${API}/auth/refresh`).set('Cookie', cookie).set(CSRF);
    expect(refresh.status).toBe(401);
  });

  it('logout-all invalidates existing access tokens', async () => {
    const { accessToken } = await registerUser();
    const out = await request(app).post(`${API}/auth/logout-all`).set(bearer(accessToken));
    expect(out.status).toBe(200);
    const me = await request(app).get(`${API}/auth/me`).set(bearer(accessToken));
    expect(me.status).toBe(401);
  });
});

describe('GET /auth/me', () => {
  it('requires authentication', async () => {
    expect((await request(app).get(`${API}/auth/me`)).status).toBe(401);
  });

  it('returns the user, organizations, current role and permissions', async () => {
    const { accessToken, organization } = await registerUser();
    const res = await request(app).get(`${API}/auth/me`).set(bearer(accessToken));
    expect(res.status).toBe(200);
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.body.data.organizations).toHaveLength(1);
    expect(res.body.data.current.organization._id).toBe(organization._id);
    expect(res.body.data.current.role).toBe('OWNER');
    expect(res.body.data.current.permissions).toContain('org:update');
  });
});

describe('password reset', () => {
  it('answers identically for existing and unknown emails', async () => {
    const { body } = await registerUser();
    const known = await request(app).post(`${API}/auth/forgot-password`).send({ email: body.email });
    const unknown = await request(app).post(`${API}/auth/forgot-password`).send({ email: 'ghost@example.com' });
    expect(known.status).toBe(200);
    expect(unknown.status).toBe(200);
    expect(known.body.message).toBe(unknown.body.message);
  });

  it('issues a single-use, hashed token that resets the password and revokes sessions', async () => {
    const spy = vi.spyOn(mailer, 'sendPasswordReset').mockResolvedValue();
    const { body, cookie } = await registerUser();
    await request(app).post(`${API}/auth/forgot-password`).send({ email: body.email });
    const token = spy.mock.calls[0]![0].token;

    const stored = await PasswordResetToken.find();
    expect(stored).toHaveLength(1);
    expect(JSON.stringify(stored)).not.toContain(token); // only the hash is stored

    const ok = await request(app).post(`${API}/auth/reset-password`).send({ token, password: 'a-brand-new-password' });
    expect(ok.status).toBe(200);
    const again = await request(app).post(`${API}/auth/reset-password`).send({ token, password: 'another-new-password' });
    expect(again.status).toBe(400);

    const oldLogin = await request(app).post(`${API}/auth/login`).send({ email: body.email, password: body.password });
    expect(oldLogin.status).toBe(401);
    const newLogin = await request(app).post(`${API}/auth/login`).send({ email: body.email, password: 'a-brand-new-password' });
    expect(newLogin.status).toBe(200);
    const oldSession = await request(app).post(`${API}/auth/refresh`).set('Cookie', cookie).set(CSRF);
    expect(oldSession.status).toBe(401);
    spy.mockRestore();
  });

  it('rejects an invalid token', async () => {
    const res = await request(app)
      .post(`${API}/auth/reset-password`)
      .send({ token: 'x'.repeat(43), password: 'a-brand-new-password' });
    expect(res.status).toBe(400);
  });
});
