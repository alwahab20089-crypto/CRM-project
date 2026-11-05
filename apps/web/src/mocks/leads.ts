import type { Lead, LeadSource, LeadStatus, LeadType, Priority, PropertyType } from '@/types';
import { daysAgo, daysFromNow, ORG_ID } from './helpers';

type Row = [string, string, LeadSource, LeadStatus, Priority, LeadType, PropertyType, string, number, number | null];


const rows: Row[] = [
  ['Olivia', 'Bennett', 'WEBSITE', 'NEW', 'HIGH', 'BUYER', 'APARTMENT', 'usr_002', 0, 0],
  ['Liam', 'Carter', 'FACEBOOK', 'CONTACTED', 'MEDIUM', 'BUYER', 'HOUSE', 'usr_003', 1, 1],
  ['Sophia', 'Nguyen', 'REFERRAL', 'QUALIFIED', 'HIGH', 'INVESTOR', 'COMMERCIAL', 'usr_004', 2, 2],
  ['Noah', 'Patel', 'INSTAGRAM', 'MEETING_SCHEDULED', 'MEDIUM', 'TENANT', 'APARTMENT', 'usr_002', 3, 1],
  ['Emma', 'Rossi', 'WALK_IN', 'NEGOTIATION', 'URGENT', 'BUYER', 'HOUSE', 'usr_003', 4, 0],
  ['Lucas', 'Meyer', 'WEBSITE', 'WON', 'MEDIUM', 'SELLER', 'PLOT', 'usr_001', 6, null],
  ['Ava', 'Johansson', 'PROPERTY_PORTAL', 'LOST', 'LOW', 'BUYER', 'APARTMENT', 'usr_004', 8, null],
  ['Mason', 'Clarke', 'PHONE_CALL', 'CONTACTED', 'MEDIUM', 'LANDLORD', 'OFFICE', 'usr_002', 9, 3],
  ['Isabella', 'Costa', 'FACEBOOK', 'NEW', 'HIGH', 'BUYER', 'FARMHOUSE', 'usr_003', 0, 1],
  ['Ethan', 'Walker', 'REFERRAL', 'QUALIFIED', 'MEDIUM', 'INVESTOR', 'COMMERCIAL', 'usr_001', 11, 5],
];

export const leads: Lead[] = rows.map(
  ([firstName, lastName, leadSource, status, priority, leadType, propertyType, assignedTo, age, followUp], i) => ({
    _id: `lead_${String(i + 1).padStart(3, '0')}`,
    organizationId: ORG_ID,
    assignedTo,
    firstName,
    lastName,
    email: `${firstName}.${lastName}@example.com`.toLowerCase(),
    phone: `+1 555 01${String(i + 10).padStart(2, '0')}`,
    leadSource,
    leadType,
    status,
    priority,
    preferredLocation: [],
    interestedPropertyType: [propertyType],
    nextFollowUpAt: followUp === null ? undefined : daysFromNow(followUp, 15),
    createdBy: 'usr_001',
    createdAt: daysAgo(age, 9),
    updatedAt: daysAgo(age, 9),
  }),
);