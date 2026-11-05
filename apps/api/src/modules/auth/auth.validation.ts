import { z } from 'zod';

const email = z.string().trim().toLowerCase().email('Enter a valid email address').max(254);
// Max length bounds hashing cost (DoS protection).
const newPassword = z.string().min(10, 'Use at least 10 characters').max(128, 'Use at most 128 characters');

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name').max(100),
  email,
  password: newPassword,
  organizationName: z.string().trim().min(2, 'Enter your business name').max(100),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required').max(128),
  remember: z.boolean().optional().default(false),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z.object({
  token: z.string().min(20).max(200),
  password: newPassword,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;