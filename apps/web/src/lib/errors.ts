import { ApiError } from '@/lib/api-client';

export const errorMessage = (err: unknown, fallback = 'Something went wrong. Please try again.') =>
  err instanceof ApiError ? err.message : fallback;