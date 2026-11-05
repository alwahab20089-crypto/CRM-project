export interface ErrorDetail {
  path?: string;
  message: string;
}

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly errors: ErrorDetail[];

  constructor(statusCode: number, message: string, code: string, errors: ErrorDetail[] = []) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
  }

  static badRequest(message = 'Bad request', code = 'BAD_REQUEST') {
    return new AppError(400, message, code);
  }
  static unauthorized(message = 'Authentication required', code = 'UNAUTHORIZED') {
    return new AppError(401, message, code);
  }
  static forbidden(message = 'You do not have permission to perform this action', code = 'FORBIDDEN') {
    return new AppError(403, message, code);
  }
  static notFound(message = 'Resource not found', code = 'NOT_FOUND') {
    return new AppError(404, message, code);
  }
  static conflict(message: string, code = 'CONFLICT') {
    return new AppError(409, message, code);
  }
  static validation(errors: ErrorDetail[], message = 'Validation failed') {
    return new AppError(422, message, 'VALIDATION_ERROR', errors);
  }
  static tooManyRequests(message = 'Too many requests. Please try again later.') {
    return new AppError(429, message, 'RATE_LIMITED');
  }
}