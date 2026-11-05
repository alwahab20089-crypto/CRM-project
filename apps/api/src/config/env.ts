import 'dotenv/config';
import { z } from 'zod';

const secret = z.string().min(32, 'must be at least 32 characters');
const duration = z.string().regex(/^\d+(s|m|h|d)$/, 'use a duration like 15m, 12h or 7d');

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    MONGODB_URI: z.string().regex(/^mongodb(\+srv)?:\/\//, 'must be a MongoDB connection string'),
    JWT_ACCESS_SECRET: secret,
    JWT_REFRESH_SECRET: secret,
    JWT_ACCESS_EXPIRES_IN: duration.default('15m'),
    JWT_REFRESH_EXPIRES_IN: duration.default('7d'),
    FRONTEND_URL: z
      .string()
      .min(1)
      .refine((v) => v.split(',').every((s) => URL.canParse(s.trim())), 'must be one or more comma-separated URLs'),
    COOKIE_DOMAIN: z
      .string()
      .optional()
      .transform((v) => (v && v.trim() ? v.trim() : undefined)),
    DEPLOYMENT_MODE: z.enum(['SAAS', 'SELF_HOSTED']),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
    TRUST_PROXY: z.coerce.number().int().min(0).default(0),
    AUTH_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(20),
    LOGIN_FAILURE_LIMIT_MAX: z.coerce.number().int().min(1).default(5),
  })
  .refine((v) => v.JWT_ACCESS_SECRET !== v.JWT_REFRESH_SECRET, {
    message: 'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different',
    path: ['JWT_REFRESH_SECRET'],
  });

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  // Only variable names and rules are printed, never values.
  const lines = parsed.error.issues.map((i) => `  - ${i.path.join('.') || 'env'}: ${i.message}`);
  console.error(`Invalid environment configuration:\n${lines.join('\n')}`);
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';