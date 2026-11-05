import type { RequestHandler } from 'express';
import { AppError } from '../utils/app-error';

export const notFound: RequestHandler = (req, _res, next) =>
  next(AppError.notFound(`Route ${req.method} ${req.path} was not found`));