import { z } from 'zod';

const email = z.string().min(1, 'Email is required').email('Enter a valid email address');
const password = z.string().min(10, 'Use at least 10 characters');

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean(),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Enter your full name').max(100),
    email,
    organizationName: z.string().trim().min(2, 'Enter your business name').max(100),
    password,
    confirmPassword: z.string().min(1, 'Confirm your password'),
    terms: z.boolean().refine((v) => v, 'You must accept the terms to continue'),
  })
  .refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });
export type RegisterValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({ email });
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({ password, confirmPassword: z.string().min(1, 'Confirm your password') })
  .refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export const acceptInvitationSchema = z
  .object({
    name: z.string().trim().min(2, 'Enter your full name').max(100),
    password,
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });
export type AcceptInvitationValues = z.infer<typeof acceptInvitationSchema>;