import { LEAD_PRIORITIES, LEAD_STATUSES, OPEN_LEAD_STATUSES, type LeadPriority, type LeadStatus } from '../../constants';

export const isOpenStatus = (s: LeadStatus) => (OPEN_LEAD_STATUSES as readonly string[]).includes(s);
export const isTerminalStatus = (s: LeadStatus) => !isOpenStatus(s);

export const STATUS_RANK = Object.fromEntries(LEAD_STATUSES.map((s, i) => [s, i])) as Record<LeadStatus, number>;
export const PRIORITY_RANK = Object.fromEntries(LEAD_PRIORITIES.map((p, i) => [p, i])) as Record<LeadPriority, number>;

/**
 * BR-12: moves between open statuses are free (forward or backward). WON and LOST are terminal:
 * they can only go back to an open status (a "reopen"), never straight to each other.
 * To enforce a strict linear flow later, edit this map only.
 */
export const TRANSITIONS: Record<LeadStatus, LeadStatus[]> = Object.fromEntries(
  LEAD_STATUSES.map((from) => [from, LEAD_STATUSES.filter((to) => to !== from && (isOpenStatus(from) || isOpenStatus(to)))]),
) as Record<LeadStatus, LeadStatus[]>;

export type TransitionCheck = { allowed: true; reopen: boolean } | { allowed: false; reason: string };

export function checkTransition(from: LeadStatus, to: LeadStatus): TransitionCheck {
  if (from === to) return { allowed: false, reason: `The lead is already ${to}.` };
  if (!TRANSITIONS[from].includes(to)) {
    return { allowed: false, reason: `A ${from} lead must be reopened before it can become ${to}.` };
  }
  return { allowed: true, reopen: isTerminalStatus(from) };
}