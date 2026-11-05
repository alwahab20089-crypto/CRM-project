import type { LeadPriority, LeadStatus } from '../../constants';
import { PRIORITY_RANK, STATUS_RANK } from './lead.lifecycle';

interface DerivableLead {
  firstName: string;
  lastName?: string | null;
  email?: string | null;
  phone: string;
  alternatePhone?: string | null;
  status: string;
  priority: string;
  nextFollowUpAt?: Date | null;
}

/**
 * Internal fields used for fast search and correct sorting. They never leave the API.
 * searchKeywords: lowercase tokens (name parts, email, email local part, phone digits) matched by anchored prefix.
 */
export function deriveFields(lead: DerivableLead) {
  const keywords = new Set<string>();
  for (const part of `${lead.firstName} ${lead.lastName ?? ''}`.toLowerCase().split(/\s+/)) if (part) keywords.add(part);
  if (lead.email) {
    const email = lead.email.toLowerCase();
    keywords.add(email);
    keywords.add(email.split('@')[0]!);
  }
  for (const phone of [lead.phone, lead.alternatePhone]) if (phone) keywords.add(phone.replace(/^\+/, ''));

  return {
    searchKeywords: [...keywords].slice(0, 20),
    nameSort: `${lead.firstName} ${lead.lastName ?? ''}`.trim().toLowerCase(),
    statusRank: STATUS_RANK[lead.status as LeadStatus],
    priorityRank: PRIORITY_RANK[lead.priority as LeadPriority],
    hasFollowUp: Boolean(lead.nextFollowUpAt),
  };
}

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** AND of anchored prefixes (index-friendly). Returns null if the term has nothing searchable. */
export function buildSearchFilter(term: string): Record<string, unknown> | null {
  const tokens = term
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.replace(/^\++/, '').replace(/[^\p{L}\p{N}@._-]/gu, ''))
    .filter(Boolean)
    .slice(0, 5);
  if (tokens.length === 0) return null;
  return { $and: tokens.map((t) => ({ searchKeywords: { $regex: `^${escapeRegex(t)}` } })) };
}