import { z } from 'zod';

const timezone = z
  .string()
  .trim()
  .max(64)
  .refine((tz) => {
    try {
      new Intl.DateTimeFormat('en', { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  }, 'Invalid IANA timezone');

const currency = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, 'Use a 3-letter ISO 4217 currency code');

const address = z.object({
  line1: z.string().trim().max(200).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  country: z.string().trim().max(100).optional(),
  postalCode: z.string().trim().max(20).optional(),
});

// Unknown keys (ownerId, slug, status, organizationId...) are stripped: no mass assignment.
export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2, 'Enter at least 2 characters').max(100),
  email: z.string().trim().toLowerCase().email('Enter a valid email address').max(254).optional(),
  phone: z.string().trim().max(30).optional(),
  address: address.optional(),
  timezone: timezone.optional(),
  currency: currency.optional(),
});

export const updateOrganizationSchema = createOrganizationSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Provide at least one field to update');

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;