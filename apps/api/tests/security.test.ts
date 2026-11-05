import { sign } from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { RefreshToken } from '../src/modules/refresh-tokens/refresh-token.model';
import { API, app, bearer, registerUser } from './helpers';

const signToken = (userId: string, options: { expiresIn: number; secret?: string }) =>
  sign({ tv: 0 }, options.secret ?? process.env.JWT_ACCESS_SECRET!, {
    algorithm: 'HS256',
    subject: userId,
    issuer: 'estateflow-api',
    audience: 'estateflow-web',
    expiresIn: options.expiresIn,
  });

describe('JWT handling', () => {
  it('rejects garbage and wrongly signed tokens', async () => {
    const { user } = await registerUser();
    const garbage = await request(app).get(`${API}/auth/me`).set(bearer('not.a.jwt'));
    expect(garbage.status).toBe(401);
    expect(garbage.body.code).toBe('INVALID_TOKEN');
    const forged = await request(app)
      .get(`${API}/auth/me`)
      .set(bearer(signToken(user._id, { expiresIn: 60, secret: 'x'.repeat(40) })));
    expect(forged.status).toBe(401);
  });

  it('rejects an expired token with TOKEN_EXPIRED', async () => {
    const { user } = await registerUser();
    const res = await request(app).get(`${API}/auth/me`).set(bearer(signToken(user._id, { expiresIn: -10 })));
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('TOKEN_EXPIRED');
  });

  it('rejects a missing Authorization header', async () => {
    expect((await request(app).get(`${API}/auth/me`)).status).toBe(401);
  });
});

describe('secrets never leak', () => {
  it('stores only hashes of refresh tokens', async () => {
    const { cookie } = await registerUser();
    const raw = cookie.replace('ef_rt=', '');
    const stored = await RefreshToken.find().lean();
    expect(stored).toHaveLength(1);
    expect(JSON.stringify(stored)).not.toContain(raw);
    expect(stored[0]!.tokenHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('never returns passwordHash from any auth response', async () => {
    const { body } = await registerUser();
    const login = await request(app).post(`${API}/auth/login`).send({ email: body.email, password: body.password });
    expect(JSON.stringify(login.body)).not.toMatch(/passwordHash|argon2/i);
  });
});

describe('rate limiting', () => {
  it('limits repeated auth attempts with 429', async () => {
    const limited = createApp({ authRateLimitMax: 3, loginFailureLimitMax: 100 });
    const attempt = () => request(limited).post(`${API}/auth/login`).send({ email: 'a@example.com', password: 'wrong-password' });
    for (let i = 0; i < 3; i++) expect((await attempt()).status).toBe(401);
    const blocked = await attempt();
    expect(blocked.status).toBe(429);
    expect(blocked.body.code).toBe('RATE_LIMITED');
  });

  it('locks out repeated failures for one account', async () => {
    const limited = createApp({ authRateLimitMax: 100, loginFailureLimitMax: 2 });
    const attempt = () => request(limited).post(`${API}/auth/login`).send({ email: 'victim@example.com', password: 'wrong-password' });
    expect((await attempt()).status).toBe(401);
    expect((await attempt()).status).toBe(401);
    expect((await attempt()).status).toBe(429);
  });
});

describe('headers and CORS', () => {
  it('sets security headers', async () => {
    const res = await request(app).get(`${API}/health`);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('reports health without internals', async () => {
    const res = await request(app).get(`${API}/health`);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ status: 'ok', database: 'connected', environment: 'test' });
    expect(JSON.stringify(res.body)).not.toMatch(/mongodb:\/\//);
  });

  it('allows credentialed CORS only for the allowlisted origin', async () => {
    const allowed = await request(app).get(`${API}/health`).set('Origin', 'http://localhost:5173');
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(allowed.headers['access-control-allow-credentials']).toBe('true');
    const denied = await request(app).get(`${API}/health`).set('Origin', 'http://evil.example');
    expect(denied.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('returns the standard error shape for unknown routes and bad JSON', async () => {
    const notFound = await request(app).get(`${API}/nope`);
    expect(notFound.status).toBe(404);
    expect(notFound.body).toMatchObject({ success: false, errors: [] });
    const bad = await request(app).post(`${API}/auth/login`).set('Content-Type', 'application/json').send('{bad json');
    expect(bad.status).toBe(400);
  });
});