import { z } from 'zod';
import { fromMinorUnits, toMinorUnits } from '@/lib/money';
import type { LeadSource, LeadStatus, LeadType, Priority, PropertyType } from '@/types';
import type { LeadDto, LeadPayload } from '@/types/leads';
import { LEAD_PRIORITIES, LEAD_SOURCES, LEAD_TYPES, OPEN_STATUSES, PROPERTY_TYPES } from './lead-constants';

// Same rule as the backend (src/utils/phone.ts)
export const normalizePhone = (raw: string) => {
  const value = raw.replace(/[\s\-().]/g, '');
  return value.startsWith('00') ? `+${value.slice(2)}` : value;
};
export const isValidPhone = (raw: string) => /^\+?\d{6,15}$/.test(normalizePhone(raw));

const MONEY = /^\d+(\.\d{1,4})?$/;
const parseMoney = (raw: string): number | null | 'invalid' => {
  const text = raw.replace(/,/g, '').trim();
  if (!text) return null;
  return MONEY.test(text) ? Number(text) : 'invalid';
};

export const leadFormSchema = z
  .object({
    firstName: z.string().trim().min(1, 'First name is required').max(100, 'Too long'),
    lastName: z.string().trim().max(100, 'Too long'),
    email: z.string().trim().max(254).refine((v) => v === '' || z.string().email().safeParse(v).success, 'Enter a valid email address'),
    phone: z.string().trim().min(1, 'Phone is required').refine(isValidPhone, 'Enter a valid phone number (6–15 digits)'),
    alternatePhone: z.string().trim().refine((v) => v === '' || isValidPhone(v), 'Enter a valid phone number (6–15 digits)'),
    leadType: z.enum(LEAD_TYPES as [LeadType, ...LeadType[]]),
    leadSource: z.enum(LEAD_SOURCES as [LeadSource, ...LeadSource[]]),
    status: z.enum(OPEN_STATUSES as [LeadStatus, ...LeadStatus[]]),
    priority: z.enum(LEAD_PRIORITIES as [Priority, ...Priority[]]),
    assignedTo: z.string(), // '' = unassigned
    interestedPropertyType: z.array(z.enum(PROPERTY_TYPES as [PropertyType, ...PropertyType[]])),
    preferredLocation: z.string().max(500, 'Too long'),
    budgetMin: z.string(),
    budgetMax: z.string(),
    currency: z.string().length(3),
    nextFollowUpAt: z.string(),
    notes: z.string().max(5000, 'Notes can be at most 5000 characters'),
  })
  .superRefine((v, ctx) => {
    const min = parseMoney(v.budgetMin);
    const max = parseMoney(v.budgetMax);
    if (min === 'invalid') ctx.addIssue({ code: 'custom', path: ['budgetMin'], message: 'Enter a valid amount' });
    if (max === 'invalid') ctx.addIssue({ code: 'custom', path: ['budgetMax'], message: 'Enter a valid amount' });
    if (typeof min === 'number' && typeof max === 'number' && min > max) {
      ctx.addIssue({ code: 'custom', path: ['budgetMax'], message: 'Maximum must be at least the minimum' });
    }
    if (v.nextFollowUpAt && Number.isNaN(new Date(v.nextFollowUpAt).getTime())) {
      ctx.addIssue({ code: 'custom', path: ['nextFollowUpAt'], message: 'Enter a valid date and time' });
    }
  });

export type LeadFormValues = z.infer<typeof leadFormSchema>;

const pad = (n: number) => String(n).padStart(2, '0');
export function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
export const fromLocalInput = (value: string) => (value ? new Date(value).toISOString() : null);

export function defaultLeadValues(currency: string): LeadFormValues {
  return {
    firstName: '', lastName: '', email: '', phone: '', alternatePhone: '',
    leadType: 'BUYER', leadSource: 'WEBSITE', status: 'NEW', priority: 'MEDIUM', assignedTo: '',
    interestedPropertyType: [], preferredLocation: '', budgetMin: '', budgetMax: '', currency,
    nextFollowUpAt: '', notes: '',
  };
}

export function leadToFormValues(lead: LeadDto, fallbackCurrency: string): LeadFormValues {
  const currency = lead.budget?.currency ?? fallbackCurrency;
  return {
    firstName: lead.firstName,
    lastName: lead.lastName,
    email: lead.email ?? '',
    phone: lead.phone,
    alternatePhone: lead.alternatePhone ?? '',
    leadType: lead.leadType,
    leadSource: lead.leadSource,
    status: OPEN_STATUSES.includes(lead.status) ? lead.status : 'NEW',
    priority: lead.priority,
    assignedTo: lead.assignedTo ?? '',
    interestedPropertyType: lead.interestedPropertyType,
    preferredLocation: lead.preferredLocation.join(', '),
    budgetMin: lead.budget?.min != null ? String(fromMinorUnits(lead.budget.min, currency)) : '',
    budgetMax: lead.budget?.max != null ? String(fromMinorUnits(lead.budget.max, currency)) : '',
    currency,
    nextFollowUpAt: toLocalInput(lead.nextFollowUpAt),
    notes: lead.notes ?? '',
  };
}

/** clear=true (edit) sends null for emptied fields; clear=false (create) omits them. */
export function toLeadPayload(values: LeadFormValues, clear: boolean): LeadPayload {
  const empty = clear ? null : undefined;
  const min = parseMoney(values.budgetMin);
  const max = parseMoney(values.budgetMax);
  const hasBudget = typeof min === 'number' || typeof max === 'number';
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: values.email.trim() || empty,
    phone: values.phone.trim(),
    alternatePhone: values.alternatePhone.trim() || empty,
    leadType: values.leadType,
    leadSource: values.leadSource,
    priority: values.priority,
    interestedPropertyType: values.interestedPropertyType,
    preferredLocation: values.preferredLocation.split(',').map((s) => s.trim()).filter(Boolean),
    budget: hasBudget
      ? {
          min: typeof min === 'number' ? toMinorUnits(min, values.currency) : null,
          max: typeof max === 'number' ? toMinorUnits(max, values.currency) : null,
          currency: values.currency,
        }
      : empty,
    nextFollowUpAt: fromLocalInput(values.nextFollowUpAt) ?? empty,
    notes: values.notes.trim() || empty,
  };
}

/** Maps backend field paths onto form fields. */
export const SERVER_FIELD_MAP: Record<string, keyof LeadFormValues> = {
  firstName: 'firstName', lastName: 'lastName', email: 'email', phone: 'phone', alternatePhone: 'alternatePhone',
  'budget.min': 'budgetMin', 'budget.max': 'budgetMax', 'budget.currency': 'currency',
  nextFollowUpAt: 'nextFollowUpAt', notes: 'notes', assignedTo: 'assignedTo', leadSource: 'leadSource', leadType: 'leadType',
};