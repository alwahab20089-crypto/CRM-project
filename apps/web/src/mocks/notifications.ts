import type { Notification } from '@/types';
import { hoursAgo, ORG_ID } from './helpers';

const base = { organizationId: ORG_ID, userId: 'usr_001' };

export const notifications: Notification[] = [
  { ...base, _id: 'ntf_001', title: 'Follow-up due today', message: 'Call Olivia Bennett about the apartment viewing.', type: 'FOLLOW_UP', readAt: null, createdAt: hoursAgo(1) },
  { ...base, _id: 'ntf_002', title: 'New lead assigned', message: 'Isabella Costa was assigned to Daniel Lee.', type: 'LEAD_ASSIGNED', readAt: null, createdAt: hoursAgo(4) },
  { ...base, _id: 'ntf_003', title: 'Task due tomorrow', message: 'Send listing brochure to Liam Carter.', type: 'TASK_DUE', readAt: null, createdAt: hoursAgo(20) },
  { ...base, _id: 'ntf_004', title: 'Usage at 80%', message: 'Your plan storage is nearing its limit.', type: 'BILLING', readAt: hoursAgo(30), createdAt: hoursAgo(40) },
];