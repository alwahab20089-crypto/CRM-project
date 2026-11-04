import type { Invitation, InvitationPreview, OrganizationMember } from '@/types';
import { daysAgo, daysFromNow, ORG_ID } from './helpers';

const base = { organizationId: ORG_ID, invitationStatus: 'ACCEPTED', status: 'ACTIVE' } as const;

export const members: OrganizationMember[] = [
  { ...base, _id: 'mem_001', userId: 'usr_001', role: 'OWNER', joinedAt: daysAgo(400) },
  { ...base, _id: 'mem_002', userId: 'usr_002', role: 'ADMIN', joinedAt: daysAgo(310) },
  { ...base, _id: 'mem_003', userId: 'usr_003', role: 'MANAGER', joinedAt: daysAgo(180) },
  { ...base, _id: 'mem_004', userId: 'usr_004', role: 'AGENT', joinedAt: daysAgo(60) },
];

export const invitations: Invitation[] = [
  { _id: 'inv_001', organizationId: ORG_ID, email: 'marcus.reed@example.com', role: 'AGENT', invitedBy: 'usr_001', createdAt: daysAgo(2), expiresAt: daysFromNow(5) },
  { _id: 'inv_002', organizationId: ORG_ID, email: 'jordan.ellis@example.com', role: 'MANAGER', invitedBy: 'usr_002', createdAt: daysAgo(1), expiresAt: daysFromNow(6) },
];

export const invitationPreview: InvitationPreview = {
  organizationName: 'Northgate Realty',
  invitedByName: 'Alex Morgan',
  email: 'marcus.reed@example.com',
  role: 'AGENT',
};