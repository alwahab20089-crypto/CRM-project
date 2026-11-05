import type { Request } from 'express';

export interface RequestMeta {
  ip?: string;
  userAgent?: string;
  requestId?: string;
}

export const getRequestMeta = (req: Request): RequestMeta => ({
  ip: req.ip,
  userAgent: (req.get('user-agent') ?? '').slice(0, 255),
  requestId: req.id,
});