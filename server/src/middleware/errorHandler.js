import { config } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

export function notFoundHandler(req, _res, next) {
  next(AppError.notFound(`Route not found: ${req.method} ${req.path}`, 'ROUTE_NOT_FOUND'));
}

export function errorHandler(err, req, res, _next) {
  let error = err;

  if (!(error instanceof AppError)) {
    if (err?.type === 'entity.parse.failed') {
      error = AppError.badRequest('Request body is not valid JSON', 'INVALID_JSON');
    } else if (err?.type === 'entity.too.large') {
      error = new AppError(413, 'Request body is too large', 'PAYLOAD_TOO_LARGE');
    } else if (err?.message === 'CORS_NOT_ALLOWED') {
      error = AppError.forbidden('This origin is not allowed', 'CORS_NOT_ALLOWED');
    } else {
      console.error(`[error] ${req.method} ${req.originalUrl}:`, err);
      error = new AppError(500, 'Something went wrong. Please try again.', 'INTERNAL_ERROR');
    }
  }

  if (res.headersSent) return;

  const body = { error: { message: error.message, code: error.code } };
  if (error.details && error.status < 500) body.error.details = error.details;
  if (!config.isProduction && error.status >= 500 && err?.stack && err !== error) {
    body.error.stack = err.stack;
  }

  res.status(error.status).json(body);
}
