import type { RequestHandler } from 'express';
import { AppError } from './app-error';
import { isObjectId } from './object-id';

/** Malformed ids behave exactly like unknown ids: 404, nothing disclosed. */
export const requireObjectIdParam =
  (param: string, label: string): RequestHandler =>
  (req, _res, next) =>
    isObjectId(req.params[param]) ? next() : next(AppError.notFound(`${label} not found`));