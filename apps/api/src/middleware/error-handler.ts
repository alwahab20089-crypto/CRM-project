import type { ErrorRequestHandler } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { logger } from '../config/logger';
import { AppError, type ErrorDetail } from '../utils/app-error';

const isDuplicateKey = (err: unknown) => typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000;

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  let status = 500;
  let message = 'Something went wrong';
  let code = 'INTERNAL_ERROR';
  let errors: ErrorDetail[] = [];

  if (err instanceof AppError) {
    ({ message, code, errors } = err);
    status = err.statusCode;
  } else if (err instanceof ZodError) {
    status = 422;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';
    errors = err.issues.map((i) => ({ path: i.path.map(String).join('.'), message: i.message }));
  } else if (isDuplicateKey(err)) {
    status = 409;
    message = 'A record with these details already exists';
    code = 'DUPLICATE';
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 422;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';
    errors = Object.entries(err.errors).map(([path, e]) => ({ path, message: e.message }));
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = 'Invalid identifier';
    code = 'BAD_REQUEST';
  } else if (typeof err?.status === 'number' && err.status >= 400 && err.status < 500) {
    // body-parser errors (malformed JSON, payload too large...)
    status = err.status;
    code = err.type === 'entity.too.large' ? 'PAYLOAD_TOO_LARGE' : 'BAD_REQUEST';
    message = err.type === 'entity.parse.failed' ? 'Malformed JSON body' : 'Invalid request';
  }

  if (status >= 500) logger.error({ err, requestId: req.id }, 'unhandled error');

  res.status(status).json({ success: false, message, code, errors, requestId: req.id });
};