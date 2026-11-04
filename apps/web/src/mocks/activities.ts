import type { Activity, ActivityType } from '@/types';
import { hoursAgo, ORG_ID } from './helpers';

type Row = [ActivityType, Activity['entityType'], string, string, string, number];

const rows: Row[] = [
  ['STATUS_CHANGE', 'LEAD', 'lead_005', 'usr_003', 'Moved Emma Rossi to Negotiation', 1],
  ['CALL', 'LEAD', 'lead_002', 'usr_003', 'Called Liam Carter about the Bellevue listings', 3],
  ['NOTE', 'LEAD', 'lead_003', 'usr_004', 'Sophia Nguyen shortlisted two commercial units', 5],
  ['PROPERTY_VIEWING', 'PROPERTY', 'prop_001', 'usr_002', 'Hosted a viewing at Harbor View Loft (3 attendees)', 22],
  ['MEETING', 'CONTACT', 'contact_001', 'usr_001', 'Closed paperwork with Lucas Meyer', 28],
  ['EMAIL', 'LEAD', 'lead_001', 'usr_002', 'Sent welcome email to Olivia Bennett', 30],
  ['STATUS_CHANGE', 'PROPERTY', 'prop_003', 'usr_003', 'Marked Maple Grove Villa as Reserved', 48],
  ['FOLLOW_UP', 'LEAD', 'lead_008', 'usr_002', 'Scheduled a follow-up with Mason Clarke', 52],
];

export const activities: Activity[] = rows.map(([activityType, entityType, entityId, userId, description, ago], i) => ({
  _id: `act_${String(i + 1).padStart(3, '0')}`,
  organizationId: ORG_ID,
  userId,
  entityType,
  entityId,
  activityType,
  description,
  createdAt: hoursAgo(ago),
}));