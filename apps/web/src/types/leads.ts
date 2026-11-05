import type { LeadSource, LeadStatus, LeadType, MemberRole, Priority, PropertyType } from '@/types';

export interface LeadBudget {
  min: number | null; // minor units
  max: number | null;
  currency: string;
}
export interface LeadAssignee {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}
export interface LeadDto {
  _id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  alternatePhone: string | null;
  leadSource: LeadSource;
  leadType: LeadType;
  status: LeadStatus;
  priority: Priority;
  budget: LeadBudget | null;
  preferredLocation: string[];
  interestedPropertyType: PropertyType[];
  notes: string | null;
  nextFollowUpAt: string | null;
  assignedTo: string | null;
  assignee: LeadAssignee | null;
  wonAt: string | null;
  lostAt: string | null;
  lostReason: string | null;
  createdBy: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type SortField = 'createdAt' | 'name' | 'priority' | 'status' | 'nextFollowUpAt';

export interface LeadListParams {
  page: number;
  limit: number;
  search?: string;
  status?: LeadStatus;
  priority?: Priority;
  leadType?: LeadType;
  leadSource?: LeadSource;
  assignedTo?: string; // member id or 'unassigned'
  createdFrom?: string; // yyyy-mm-dd (local)
  createdTo?: string; // yyyy-mm-dd (local)
  sortBy: SortField;
  sortOrder: 'asc' | 'desc';
  view: 'active' | 'archived';
}

/** Request body for create (undefined = omit) and update (null = clear). */
export interface LeadPayload {
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string;
  alternatePhone?: string | null;
  leadSource?: LeadSource;
  leadType?: LeadType;
  status?: LeadStatus;
  priority?: Priority;
  assignedTo?: string | null;
  budget?: LeadBudget | null;
  preferredLocation?: string[];
  interestedPropertyType?: PropertyType[];
  notes?: string | null;
  nextFollowUpAt?: string | null;
}

export type LeadActivityType =
  | 'CREATED' | 'UPDATE' | 'STATUS_CHANGE' | 'ASSIGNMENT' | 'NOTE' | 'FOLLOW_UP'
  | 'CALL' | 'EMAIL' | 'MEETING' | 'PROPERTY_VIEWING' | 'OTHER';

export interface LeadActivityDto {
  _id: string;
  activityType: LeadActivityType;
  description: string;
  user: { _id: string; name: string } | null;
  createdAt: string;
}

export interface MemberOption {
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  role: MemberRole;
}

export interface DuplicateLead {
  _id: string;
  name: string;
}