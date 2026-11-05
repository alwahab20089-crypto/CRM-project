import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { AppError, type ErrorDetail } from '../utils/app-error';

interface Schemas {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}

/** Validates with Zod. Parsed (stripped) bodies replace req.body, so unknown fields never reach services. */
export const validate =
  (schemas: Schemas): RequestHandler =>
  (req, _res, next) => {
    const errors: ErrorDetail[] = [];
    for (const part of ['params', 'query', 'body'] as const) {
      const schema = schemas[part];
      if (!schema) continue;
      const result = schema.safeParse(req[part]);
      if (!result.success) {
        errors.push(...result.error.issues.map((i) => ({ path: i.path.map(String).join('.'), message: i.message })));
      } else if (part === 'body') {
        req.body = result.data;
      }
    }
    if (errors.length > 0) return next(AppError.validation(errors));
    next();
  };