/**
 * Centralized Error Handling Middleware for Paylog
 */

export function errorHandler(err, req, res, next) {
  console.error('[Application Error]:', err);

  const status = err.status || err.statusCode || 500;
  const code = err.code || (status === 400 ? 'VALIDATION_ERROR' : 'INTERNAL_SERVER_ERROR');
  const message = err.message || 'An unexpected internal server error occurred.';

  res.status(status).json({
    error: {
      code,
      message,
      ...(err.details ? { details: err.details } : {}),
    },
  });
}
