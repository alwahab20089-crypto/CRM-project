import { apiRequest } from '@/lib/api-client';
import type { MembershipSummary, MeResponse, SessionResponse } from '@/types/auth';

export interface OrganizationUpdate {
  name?: string;
  email?: string;
  phone?: string;
  currency?: string;
  timezone?: string;
  address?: { line1?: string; city?: string; state?: string; country?: string; postalCode?: string };
}

export const authService = {
  login: (body: { email: string; password: string; remember: boolean }) =>
    apiRequest<SessionResponse>('/auth/login', { method: 'POST', body, auth: false }),
  register: (body: { name: string; email: string; password: string; organizationName: string }) =>
    apiRequest<SessionResponse>('/auth/register', { method: 'POST', body, auth: false }),
  logout: () => apiRequest<null>('/auth/logout', { method: 'POST', auth: false }),
  me: () => apiRequest<MeResponse>('/auth/me'),
  forgotPassword: (email: string) => apiRequest<null>('/auth/forgot-password', { method: 'POST', body: { email }, auth: false }),
  resetPassword: (token: string, password: string) =>
    apiRequest<null>('/auth/reset-password', { method: 'POST', body: { token, password }, auth: false }),
  switchOrganization: (organizationId: string) =>
    apiRequest<MembershipSummary>(`/organizations/${organizationId}/switch`, { method: 'POST' }),
  updateOrganization: (organizationId: string, body: OrganizationUpdate) =>
    apiRequest<MembershipSummary>(`/organizations/${organizationId}`, { method: 'PATCH', body }),
};