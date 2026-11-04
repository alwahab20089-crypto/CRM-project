import { activities } from '@/mocks/activities';
import { contacts } from '@/mocks/contacts';
import { dashboardData } from '@/mocks/dashboard';
import { leads } from '@/mocks/leads';
import { notifications } from '@/mocks/notifications';
import { organizations } from '@/mocks/organizations';
import { plans, subscriptionOverview } from '@/mocks/plans';
import { properties } from '@/mocks/properties';
import { tasks } from '@/mocks/tasks';
import { invitationPreview, invitations, members } from '@/mocks/team';
import { CURRENT_USER_ID, userById } from '@/mocks/users';
import { sleep } from '@/lib/utils';
import { fullName } from '@/lib/format';
import type { TaskType, WithAssignee } from '@/types';
import type { CrmService } from './crm-service';

async function respond<T>(value: T, ms = 450): Promise<T> {
  await sleep(ms);
  return structuredClone(value);
}

function withAssignee<T extends { assignedTo?: string }>(items: T[]): WithAssignee<T>[] {
  return items.map((item) => ({ ...item, assignee: item.assignedTo ? (userById.get(item.assignedTo) ?? null) : null }));
}

const FOLLOW_UP_TYPES: TaskType[] = ['CALL', 'MEETING', 'FOLLOW_UP', 'VIEWING'];

export const mockCrmService: CrmService = {
  getCurrentUser: () => respond(userById.get(CURRENT_USER_ID)!, 150),
  getOrganizations: () => respond(organizations, 150),
  getDashboard: () => respond(dashboardData),
  getLeads: () => respond(withAssignee(leads)),
  getContacts: () => respond(withAssignee(contacts)),
  getProperties: () => respond(withAssignee(properties)),
  getTasks: () => respond(withAssignee(tasks)),
  getFollowUps: () => {
    const items = tasks
      .filter((t) => t.status !== 'DONE' && t.status !== 'CANCELLED' && FOLLOW_UP_TYPES.includes(t.taskType))
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 5)
      .map((t) => {
        const lead = leads.find((l) => l._id === t.relatedLeadId);
        return {
          _id: t._id,
          contactName: lead ? fullName(lead) : 'General',
          description: t.title,
          dueDate: t.dueDate,
          assignee: userById.get(t.assignedTo) ?? null,
          priority: t.priority,
        };
      });
    return respond(items);
  },
  getActivities: () =>
    respond(activities.map((a) => ({ ...a, user: userById.get(a.userId) ?? null }))),
  getNotifications: () => respond(notifications, 150),
  getTeam: () =>
    respond({
      members: members.map((m) => ({ ...m, user: userById.get(m.userId)! })),
      invitations,
    }),
  getPlans: () => respond(plans, 200),
  getSubscriptionOverview: () => respond(subscriptionOverview),
  getInvitationPreview: () => respond(invitationPreview, 300),
};