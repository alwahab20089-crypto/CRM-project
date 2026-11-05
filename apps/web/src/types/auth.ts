import type { MemberRole, Organization, User } from '@/types';

export interface MembershipSummary {
  organization: Organization;
  role: MemberRole;
  permissions: string[];
}
export interface SessionResponse {
  accessToken: string;
  expiresIn: number;
  user: User;
}
export interface MeResponse {
  user: User;
  organizations: MembershipSummary[];
  current: MembershipSummary | null;
}