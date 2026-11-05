import request, { type Response } from 'supertest';
import { expect } from 'vitest';
import { createApp } from '../src/app';
import { OrganizationMember } from '../src/modules/members/member.model';
import type { MemberRole } from '../src/constants';

export const app = createApp();
export const API = '/api/v1';
export const CSRF = { 'X-Requested-With': 'EstateFlow' };
export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

export function extractRefreshCookie(res: Response): string {
  const cookies = res.headers['set-cookie'] as unknown as string[] | undefined;
  const raw = cookies?.find((c) => c.startsWith('ef_rt='));
  if (!raw) throw new Error('refresh cookie not set');
  return raw.split(';')[0]!;
}

let counter = 0;

export async function registerUser(overrides: Partial<{ name: string; email: string; password: string; organizationName: string }> = {}) {
  counter += 1;
  const body = {
    name: 'Test User',
    email: `user${counter}-${Date.now()}@example.com`,
    password: 'correct-horse-battery',
    organizationName: `Org ${counter}`,
    ...overrides,
  };
  const res = await request(app).post(`${API}/auth/register`).send(body);
  expect(res.status).toBe(201);
  return {
    body,
    res,
    accessToken: res.body.data.accessToken as string,
    cookie: extractRefreshCookie(res),
    user: res.body.data.user as { _id: string; email: string },
    organization: res.body.data.organization as { _id: string },
  };
}

export const addMember = (userId: string, organizationId: string, role: MemberRole) =>
  OrganizationMember.create({
    userId,
    organizationId,
    role,
    invitationStatus: 'ACCEPTED',
    status: 'ACTIVE',
    joinedAt: new Date(),
  });