export const DEPLOYMENT_MODES = ['SAAS', 'SELF_HOSTED'] as const;
export const USER_STATUSES = ['ACTIVE', 'SUSPENDED', 'DELETED'] as const;
export const PLATFORM_ROLES = ['NONE', 'PLATFORM_ADMIN'] as const;
export const ORGANIZATION_STATUSES = ['ACTIVE', 'SUSPENDED', 'DELETED'] as const;
export const MEMBER_ROLES = ['OWNER', 'ADMIN', 'MANAGER', 'AGENT'] as const;
export const MEMBER_STATUSES = ['ACTIVE', 'SUSPENDED'] as const;
export const MEMBERSHIP_INVITATION_STATUSES = ['PENDING', 'ACCEPTED', 'DECLINED', 'REVOKED'] as const;
export const INVITATION_STATUSES = ['PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED'] as const;

export type MemberRole = (typeof MEMBER_ROLES)[number];
export const LEAD_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'MEETING_SCHEDULED', 'NEGOTIATION', 'WON', 'LOST'] as const;
export const OPEN_LEAD_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'MEETING_SCHEDULED', 'NEGOTIATION'] as const;
export const LEAD_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
export const LEAD_TYPES = ['BUYER', 'SELLER', 'TENANT', 'LANDLORD', 'INVESTOR'] as const;
export const LEAD_SOURCES = [
  'WEBSITE', 'FACEBOOK', 'INSTAGRAM', 'WHATSAPP', 'REFERRAL', 'WALK_IN', 'PROPERTY_PORTAL', 'PHONE_CALL', 'OTHER',
] as const;
export const PROPERTY_TYPES = ['HOUSE', 'APARTMENT', 'PLOT', 'COMMERCIAL', 'OFFICE', 'FARMHOUSE', 'OTHER'] as const;
export const ACTIVITY_ENTITY_TYPES = ['LEAD', 'CONTACT', 'PROPERTY', 'TASK'] as const;
export const ACTIVITY_TYPES = [
  'CALL', 'EMAIL', 'MEETING', 'NOTE', 'STATUS_CHANGE', 'FOLLOW_UP', 'PROPERTY_VIEWING', 'OTHER',
  'CREATED', 'ASSIGNMENT', 'UPDATE',
] as const;

/** Money is stored as integer minor units. 1e13 minor units is far below 2^53, so doubles stay exact. */
export const MAX_MINOR_UNITS = 10_000_000_000_000;

export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type LeadPriority = (typeof LEAD_PRIORITIES)[number];