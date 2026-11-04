export type ID = string;
export type ISODate = string;

export type PlatformRole = 'NONE' | 'PLATFORM_ADMIN';
export type MemberRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'AGENT';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface User {
  _id: ID;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  emailVerified: boolean;
  platformRole: PlatformRole;
}

export interface Organization {
  _id: ID;
  name: string;
  slug: string;
  logo?: string;
  email: string;
  phone: string;
  address: { line1: string; city: string; state: string; country: string; postalCode: string };
  ownerId: ID;
  timezone: string;
  currency: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
}

export interface OrganizationMember {
  _id: ID;
  organizationId: ID;
  userId: ID;
  role: MemberRole;
  invitationStatus: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'REVOKED';
  status: 'ACTIVE' | 'SUSPENDED';
  joinedAt?: ISODate;
}
export interface TeamMember extends OrganizationMember {
  user: User;
}

export interface Invitation {
  _id: ID;
  organizationId: ID;
  email: string;
  role: MemberRole;
  invitedBy: ID;
  expiresAt: ISODate;
  createdAt: ISODate;
}

export interface InvitationPreview {
  organizationName: string;
  invitedByName: string;
  email: string;
  role: MemberRole;
}

export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'MEETING_SCHEDULED'
  | 'NEGOTIATION'
  | 'WON'
  | 'LOST';
export type LeadSource =
  | 'WALK_IN'
  | 'REFERRAL'
  | 'WEBSITE'
  | 'FACEBOOK'
  | 'INSTAGRAM'
  | 'WHATSAPP'
  | 'PORTAL'
  | 'CALL'
  | 'OTHER';
export type LeadType = 'BUYER' | 'SELLER' | 'TENANT' | 'LANDLORD' | 'INVESTOR';
export type PropertyType =
  | 'HOUSE'
  | 'APARTMENT'
  | 'PLOT'
  | 'COMMERCIAL'
  | 'OFFICE'
  | 'FARMHOUSE'
  | 'OTHER';

export interface Lead {
  _id: ID;
  organizationId: ID;
  assignedTo?: ID;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  leadSource: LeadSource;
  leadType: LeadType;
  status: LeadStatus;
  priority: Priority;
  preferredLocation: string[];
  interestedPropertyType: PropertyType[];
  nextFollowUpAt?: ISODate;
  createdBy: ID;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export type ContactType = 'CLIENT' | 'OWNER' | 'TENANT' | 'LANDLORD' | 'PARTNER' | 'OTHER';
export interface Contact {
  _id: ID;
  organizationId: ID;
  leadId?: ID;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  contactType: ContactType;
  assignedTo?: ID;
  createdAt: ISODate;
}

export type ListingType = 'SALE' | 'RENT';
export type ListingStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'RENTED' | 'INACTIVE';
export interface Property {
  _id: ID;
  organizationId: ID;
  title: string;
  propertyType: PropertyType;
  listingType: ListingType;
  /** Mock stores whole major units. Real storage (minor units vs Decimal128) is an open Phase 1 decision. */
  price: number;
  currency: string;
  city: string;
  area: string;
  bedrooms?: number;
  bathrooms?: number;
  areaSize: number;
  areaUnit: 'SQFT' | 'SQM' | 'MARLA' | 'KANAL' | 'ACRE';
  listingStatus: ListingStatus;
  ownerContactId?: ID;
  assignedTo?: ID;
  createdAt: ISODate;
}

export type TaskType = 'CALL' | 'EMAIL' | 'MEETING' | 'VIEWING' | 'FOLLOW_UP' | 'DOCUMENT' | 'OTHER';
export type TaskStatus = 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
export interface Task {
  _id: ID;
  organizationId: ID;
  title: string;
  taskType: TaskType;
  assignedTo: ID;
  relatedLeadId?: ID;
  relatedContactId?: ID;
  relatedPropertyId?: ID;
  dueDate: ISODate;
  priority: Priority;
  status: TaskStatus;
  createdAt: ISODate;
}

export type ActivityType =
  | 'CALL'
  | 'EMAIL'
  | 'MEETING'
  | 'NOTE'
  | 'STATUS_CHANGE'
  | 'FOLLOW_UP'
  | 'PROPERTY_VIEWING'
  | 'OTHER';
export interface Activity {
  _id: ID;
  organizationId: ID;
  userId: ID;
  entityType: 'LEAD' | 'CONTACT' | 'PROPERTY' | 'TASK';
  entityId: ID;
  activityType: ActivityType;
  description: string;
  createdAt: ISODate;
}
export type ActivityListItem = Activity & { user: User | null };

export interface Notification {
  _id: ID;
  organizationId: ID;
  userId: ID;
  title: string;
  message: string;
  type: 'TASK_DUE' | 'LEAD_ASSIGNED' | 'FOLLOW_UP' | 'SYSTEM' | 'BILLING';
  readAt: ISODate | null;
  createdAt: ISODate;
}

export interface Plan {
  _id: ID;
  name: string;
  slug: string;
  /** minor units (cents) */
  price: number;
  currency: string;
  billingInterval: 'MONTH' | 'YEAR';
  trialDays: number;
  limits: { users: number | null; leads: number | null; properties: number | null; storageMb: number | null };
}
export interface Subscription {
  _id: ID;
  organizationId: ID;
  planId: ID;
  status: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED';
  currentPeriodStart: ISODate;
  currentPeriodEnd: ISODate;
  cancelAtPeriodEnd: boolean;
}
export interface SubscriptionOverview {
  plan: Plan;
  subscription: Subscription;
  usage: { users: number; leads: number; properties: number; storageMb: number };
}

export type WithAssignee<T> = T & { assignee: User | null };

export interface Kpi {
  key: 'totalLeads' | 'activeProperties' | 'convertedCustomers' | 'pendingFollowUps';
  label: string;
  value: number;
  previousValue: number;
  changePct: number;
  helper: string;
  positiveIsGood: boolean;
}
export interface SeriesPoint {
  label: string;
  value: number;
}
export interface DashboardData {
  kpis: Kpi[];
  leadsOverTime: { monthly: SeriesPoint[]; weekly: SeriesPoint[] };
  leadSources: { source: LeadSource; count: number }[];
  pipeline: { status: LeadStatus; count: number }[];
}
export interface FollowUp {
  _id: ID;
  contactName: string;
  description: string;
  dueDate: ISODate;
  assignee: User | null;
  priority: Priority;
}