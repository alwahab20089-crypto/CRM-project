import dns from 'node:dns';

dns.setServers(["8.8.8.8", "1.1.1.1"]);
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { corsOptions } from './config/cors';
import { env } from './config/env';
import { errorHandler } from './middleware/error-handler';
import { notFound } from './middleware/not-found';
import type { RateLimitOptions } from './middleware/rate-limit';
import { requestContext } from './middleware/request-context';
import { createApiRouter } from './routes';

export type AppOptions = RateLimitOptions;

export function createApp(options: AppOptions = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', env.TRUST_PROXY);

  app.use(requestContext);
  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  app.use('/api/v1', createApiRouter(options));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}