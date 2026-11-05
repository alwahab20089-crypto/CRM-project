import type { Response } from 'express';

interface SuccessOptions<T> {
  status?: number;
  message?: string;
  data?: T;
  meta?: Record<string, unknown>;
}

export function sendSuccess<T>(res: Response, options: SuccessOptions<T> = {}) {
  const { status = 200, message = 'Operation completed successfully', data, meta } = options;
  res.status(status).json({ success: true, message, data: data ?? {}, meta: meta ?? {} });
}