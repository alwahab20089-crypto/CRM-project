import type {
  ActivityListItem,
  Contact,
  DashboardData,
  FollowUp,
  Invitation,
  InvitationPreview,
  Lead,
  Notification,
  Organization,
  Plan,
  Property,
  SubscriptionOverview,
  Task,
  TeamMember,
  User,
  WithAssignee,
} from '@/types';

/**
 * Contract between the UI and the data source.
 * Phase 2 implements it with mocks. Phase 3 will swap in HTTP calls to /api/v1.
 */
export interface CrmService {
  getCurrentUser(): Promise<User>;
  getOrganizations(): Promise<Organization[]>;
  getDashboard(): Promise<DashboardData>;
  getLeads(): Promise<WithAssignee<Lead>[]>;
  getContacts(): Promise<WithAssignee<Contact>[]>;
  getProperties(): Promise<WithAssignee<Property>[]>;
  getTasks(): Promise<WithAssignee<Task>[]>;
  getFollowUps(): Promise<FollowUp[]>;
  getActivities(): Promise<ActivityListItem[]>;
  getNotifications(): Promise<Notification[]>;
  getTeam(): Promise<{ members: TeamMember[]; invitations: Invitation[] }>;
  getPlans(): Promise<Plan[]>;
  getSubscriptionOverview(): Promise<SubscriptionOverview>;
  getInvitationPreview(token: string): Promise<InvitationPreview>;
}