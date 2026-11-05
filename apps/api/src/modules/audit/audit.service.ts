import { Types, type ClientSession } from 'mongoose';
import { logger } from '../../config/logger';
import type { RequestMeta } from '../../utils/request-meta';
import { AuditLog } from './audit-log.model';

const SENSITIVE_KEY = /password|token|secret|hash|authorization|cookie/i;

function sanitize(value: unknown, depth = 0): unknown {
  if (depth > 4) return '[truncated]';
  if (value instanceof Types.ObjectId) return String(value);
  if (value instanceof Date) return value;
  if (Array.isArray(value)) return value.slice(0, 50).map((v) => sanitize(v, depth + 1));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, SENSITIVE_KEY.test(k) ? '[REDACTED]' : sanitize(v, depth + 1)]),
    );
  }
  return value;
}

type Id = string | Types.ObjectId;

export interface AuditEntry {
  organizationId?: Id | null;
  actorId?: Id | null;
  action: string;
  resource: string;
  resourceId?: Id | null;
  before?: unknown;
  after?: unknown;
  meta?: RequestMeta;
}

export async function recordAudit(entry: AuditEntry, session?: ClientSession): Promise<void> {
  try {
    await AuditLog.create(
      [
        {
          organizationId: entry.organizationId ?? null,
          actorId: entry.actorId ?? null,
          action: entry.action,
          resource: entry.resource,
          resourceId: entry.resourceId ?? null,
          metadata: {
            before: sanitize(entry.before),
            after: sanitize(entry.after),
            ip: entry.meta?.ip,
            userAgent: entry.meta?.userAgent,
            requestId: entry.meta?.requestId,
          },
        },
      ],
      { session },
    );
  } catch (err) {
    logger.error({ err, action: entry.action }, 'failed to write audit log');
    if (session) throw err; // inside a transaction the failure must abort the unit of work
  }
}