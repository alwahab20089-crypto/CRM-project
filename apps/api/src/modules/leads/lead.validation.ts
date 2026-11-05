import { z } from 'zod';
import { LEAD_PRIORITIES, LEAD_SOURCES, LEAD_STATUSES, LEAD_TYPES, MAX_MINOR_UNITS, OPEN_LEAD_STATUSES, PROPERTY_TYPES } from '../../constants';
import { objectIdSchema } from '../../utils/object-id';
import { isValidPhone, normalizePhone } from '../../utils/phone';

const isoDate = z
  .string()
  .datetime({ offset: true, message: 'Use an ISO 8601 date-time' })
  .transform((s) => new Date(s));

const phone = z
  .string()
  .trim()
  .transform(normalizePhone)
  .refine(isValidPhone, 'Enter a valid phone number (6-15 digits, optional +)');

// '' and null both mean "no value" (null clears the field on update)
const optionalPhone = z
  .union([z.literal('').transform(() => null), z.null(), phone])
  .optional();
const optionalEmail = z
  .union([z.literal('').transform(() => null), z.null(), z.string().trim().toLowerCase().email('Enter a valid email address').max(254)])
  .optional();
const optionalText = (max: number) =>
  z.union([z.literal('').transform(() => null), z.null(), z.string().trim().max(max)]).optional();

const minor = z
  .number({ message: 'Budget must be a number' })
  .int('Budget must be a whole number of minor units')
  .min(0, 'Budget cannot be negative')
  .max(MAX_MINOR_UNITS, 'Budget is too large');

const budget = z
  .object({
    min: minor.nullable().optional(),
    max: minor.nullable().optional(),
    currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, 'Use a 3-letter ISO 4217 currency code'),
  })
  .refine((b) => b.min == null || b.max == null || b.min <= b.max, {
    message: 'Maximum budget must be at least the minimum budget',
    path: ['max'],
  });

const firstName = z.string().trim().min(1, 'First name is required').max(100);
const leadSource = z.enum(LEAD_SOURCES);
const leadType = z.enum(LEAD_TYPES);

// No .default() anywhere: defaults are applied in the service, so PATCH can never overwrite fields by accident.
const optionalFields = {
  lastName: z.string().trim().max(100).optional(),
  email: optionalEmail,
  alternatePhone: optionalPhone,
  priority: z.enum(LEAD_PRIORITIES).optional(),
  budget: budget.nullable().optional(),
  preferredLocation: z.array(z.string().trim().min(1).max(100)).max(20).optional(),
  interestedPropertyType: z.array(z.enum(PROPERTY_TYPES)).max(7).optional(),
  notes: optionalText(5000),
  nextFollowUpAt: isoDate.nullable().optional(),
};

// Unknown keys (organizationId, createdBy, priorityRank...) are stripped: no mass assignment.
export const createLeadSchema = z.object({
  firstName,
  phone,
  leadSource,
  leadType,
  status: z.enum(OPEN_LEAD_STATUSES).optional(),
  assignedTo: objectIdSchema.nullable().optional(),
  ...optionalFields,
});

// Status and assignment have dedicated endpoints.
export const updateLeadSchema = z
  .object({
    firstName: firstName.optional(),
    phone: phone.optional(),
    leadSource: leadSource.optional(),
    leadType: leadType.optional(),
    ...optionalFields,
  })
  .refine((v) => Object.keys(v).length > 0, 'Provide at least one field to update');

export const statusSchema = z
  .object({
    status: z.enum(LEAD_STATUSES),
    reason: z.string().trim().min(3, 'Please add a short reason (3+ characters)').max(500).optional(),
  })
  .refine((v) => v.status !== 'LOST' || Boolean(v.reason), { message: 'A reason is required when marking a lead as lost', path: ['reason'] });

export const assignSchema = z.object({ assignedTo: objectIdSchema.nullable() });
export const noteSchema = z.object({ body: z.string().trim().min(1, 'Note cannot be empty').max(2000, 'Note is too long (max 2000 characters)') });

// strict(): unknown filters are rejected with 422
export const listLeadsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(100).optional(),
    status: z.enum(LEAD_STATUSES).optional(),
    priority: z.enum(LEAD_PRIORITIES).optional(),
    leadType: leadType.optional(),
    leadSource: leadSource.optional(),
    assignedTo: z.union([objectIdSchema, z.literal('unassigned')]).optional(),
    createdFrom: isoDate.optional(),
    createdTo: isoDate.optional(),
    sortBy: z.enum(['createdAt', 'name', 'priority', 'status', 'nextFollowUpAt']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    view: z.enum(['active', 'archived']).default('active'),
  })
  .strict();

export const activitiesQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    type: z.enum(['NOTE', 'STATUS_CHANGE', 'ASSIGNMENT', 'FOLLOW_UP', 'UPDATE', 'CREATED']).optional(),
  })
  .strict();

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type StatusInput = z.infer<typeof statusSchema>;
export type ListLeadsQuery = z.infer<typeof listLeadsQuerySchema>;
export type ActivitiesQuery = z.infer<typeof activitiesQuerySchema>;