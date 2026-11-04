import type { Contact, ContactType } from '@/types';
import { daysAgo, ORG_ID } from './helpers';

type Row = [string, string, ContactType, string, string | undefined, number];

const rows: Row[] = [
  ['Lucas', 'Meyer', 'CLIENT', 'usr_001', 'lead_006', 6],
  ['Henry', 'Adams', 'OWNER', 'usr_003', undefined, 20],
  ['Grace', 'Kim', 'LANDLORD', 'usr_004', undefined, 15],
  ['Oliver', 'Stone', 'PARTNER', 'usr_002', undefined, 30],
  ['Chloe', 'Martin', 'TENANT', 'usr_002', undefined, 12],
  ['Rafael', 'Ortiz', 'OWNER', 'usr_001', undefined, 40],
];

export const contacts: Contact[] = rows.map(([firstName, lastName, contactType, assignedTo, leadId, age], i) => ({
  _id: `contact_${String(i + 1).padStart(3, '0')}`,
  organizationId: ORG_ID,
  leadId,
  firstName,
  lastName,
  email: `${firstName}.${lastName}@example.com`.toLowerCase(),
  phone: `+1 555 02${String(i + 10).padStart(2, '0')}`,
  contactType,
  assignedTo,
  createdAt: daysAgo(age),
}));