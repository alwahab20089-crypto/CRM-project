import { Router } from 'express';
import { isDatabaseHealthy } from '../../config/database';
import { env } from '../../config/env';
import { asyncHandler } from '../../utils/async-handler';

export const healthRouter = Router();

healthRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const databaseUp = await isDatabaseHealthy();
    res.status(databaseUp ? 200 : 503).json({
      success: databaseUp,
      message: databaseUp ? 'OK' : 'Service degraded',
      data: {
        status: databaseUp ? 'ok' : 'degraded',
        database: databaseUp ? 'connected' : 'disconnected',
        environment: env.NODE_ENV,
        timestamp: new Date().toISOString(),
      },
      meta: {},
    });
  }),
);
