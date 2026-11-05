import type { LeadSource, MemberRole } from '@/types';

export function humanize(value: string) {
  const text = value.replace(/_/g, ' ').toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}


export const leadSourceLabels: Record<LeadSource, string> = {
  WALK_IN: 'Walk-in',
  REFERRAL: 'Referral',
  WEBSITE: 'Website',
  FACEBOOK: 'Facebook',
  INSTAGRAM: 'Instagram',
  WHATSAPP: 'WhatsApp',
  PROPERTY_PORTAL: 'Property portal',
  PHONE_CALL: 'Phone call',
  OTHER: 'Other',
};


export const roleLabels: Record<MemberRole, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  AGENT: 'Agent',
};