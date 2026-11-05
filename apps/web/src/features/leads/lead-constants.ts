import type { LeadSource, LeadStatus, LeadType, Priority, PropertyType } from '@/types';

export const LEAD_STATUSES: LeadStatus[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'MEETING_SCHEDULED', 'NEGOTIATION', 'WON', 'LOST'];
export const OPEN_STATUSES: LeadStatus[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'MEETING_SCHEDULED', 'NEGOTIATION'];
export const LEAD_PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
export const LEAD_TYPES: LeadType[] = ['BUYER', 'SELLER', 'TENANT', 'LANDLORD', 'INVESTOR'];
export const LEAD_SOURCES: LeadSource[] = [
  'WEBSITE', 'FACEBOOK', 'INSTAGRAM', 'WHATSAPP', 'REFERRAL', 'WALK_IN', 'PROPERTY_PORTAL', 'PHONE_CALL', 'OTHER',
];
export const PROPERTY_TYPES: PropertyType[] = ['HOUSE', 'APARTMENT', 'PLOT', 'COMMERCIAL', 'OFFICE', 'FARMHOUSE', 'OTHER'];
export const CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'PKR', 'INR'];
export const PAGE_SIZES = [10, 20, 50, 100];

/** Mirrors the server rules (BR-12). The server remains the authority. */
export function allowedTargets(from: LeadStatus, canReopen: boolean): LeadStatus[] {
  const terminal = from === 'WON' || from === 'LOST';
  if (terminal) return canReopen ? OPEN_STATUSES : [];
  return LEAD_STATUSES.filter((s) => s !== from);
}