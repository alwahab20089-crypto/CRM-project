import type { Priority, Task, TaskStatus, TaskType } from '@/types';
import { daysAgo, daysFromNow, ORG_ID } from './helpers';

type Row = [string, TaskType, string, string | undefined, string | undefined, number, Priority, TaskStatus];

const rows: Row[] = [
  ['Call Olivia about 2-bed apartment viewing', 'CALL', 'usr_002', 'lead_001', 'prop_001', 0, 'HIGH', 'OPEN'],
  ['Send listing brochure to Liam', 'EMAIL', 'usr_003', 'lead_002', 'prop_003', 1, 'MEDIUM', 'OPEN'],
  ['Follow up on investment shortlist', 'FOLLOW_UP', 'usr_004', 'lead_003', 'prop_005', 1, 'HIGH', 'IN_PROGRESS'],
  ['Property viewing: Harbor View Loft', 'VIEWING', 'usr_002', 'lead_004', 'prop_001', 2, 'MEDIUM', 'OPEN'],
  ['Negotiation call with Emma', 'MEETING', 'usr_003', 'lead_005', 'prop_003', 0, 'URGENT', 'OPEN'],
  ['Prepare sale agreement for Lucas', 'DOCUMENT', 'usr_001', 'lead_006', 'prop_004', -2, 'MEDIUM', 'DONE'],
  ['Re-engage Mason about office lease', 'FOLLOW_UP', 'usr_002', 'lead_008', undefined, 3, 'LOW', 'OPEN'],
  ['Update photos for Maple Grove Villa', 'OTHER', 'usr_004', undefined, 'prop_003', 5, 'LOW', 'OPEN'],
];

export const tasks: Task[] = rows.map(
  ([title, taskType, assignedTo, relatedLeadId, relatedPropertyId, dueIn, priority, status], i) => ({
    _id: `task_${String(i + 1).padStart(3, '0')}`,
    organizationId: ORG_ID,
    title,
    taskType,
    assignedTo,
    relatedLeadId,
    relatedPropertyId,
    dueDate: dueIn >= 0 ? daysFromNow(dueIn, 9 + i) : daysAgo(-dueIn, 9),
    priority,
    status,
    createdAt: daysAgo(i + 1),
  }),
);