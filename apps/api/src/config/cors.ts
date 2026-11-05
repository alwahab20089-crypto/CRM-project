import type { CorsOptions } from 'cors';
import { env } from './env';

export const allowedOrigins = env.FRONTEND_URL.split(',').map((s) => new URL(s.trim()).origin);

// Credentialed CORS: never a wildcard. Requests without an Origin (curl, server-to-server) pass,
// but browsers from other origins get no CORS headers and are blocked.
export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    callback(null, !origin || allowedOrigins.includes(origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Organization-Id'],
  exposedHeaders: ['X-Request-Id'],
  maxAge: 600,
};