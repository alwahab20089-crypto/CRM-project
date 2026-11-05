import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import { logger } from '../config/logger';

/** Assigns a request id and logs one structured line per request. Never logs bodies, headers or query strings. */
export const requestContext: RequestHandler = (req, res, next) => {
  req.id = randomUUID();
  res.setHeader('X-Request-Id', req.id);

  const path = req.path;
  const started = process.hrtime.bigint();
  res.on('finish', () => {
    logger.info(
      {
        requestId: req.id,
        method: req.method,
        path,
        status: res.statusCode,
        durationMs: Math.round(Number(process.hrtime.bigint() - started) / 1e6),
        userId: req.auth?.userId,
      },
      'request completed',
    );
  });
  next();
};