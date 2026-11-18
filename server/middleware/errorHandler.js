/**
 * Centralized Error Handling Middleware for Paylog
 */

export function errorHandler(err, req, res, next) {
  console.error('[Application Error]:', err);

  const status = err.status || err.statusCode || 500;
  let code = err.code || (status === 400 ? 'VALIDATION_ERROR' : 'INTERNAL_SERVER_ERROR');
  let message = err.message || 'An unexpected internal server error occurred.';

  // Provide clear actionable guidance for database DNS resolution failures (e.g., Render internal cross-region hostnames)
  if (err.code === 'ENOTFOUND' || (typeof err.message === 'string' && err.message.includes('getaddrinfo ENOTFOUND'))) {
    code = 'DATABASE_CONNECTION_ERROR';
    message = 'Database connection failed: The database host could not be reached. If you are deploying on Render, please use your External Database URL (ending in .render.com) in your environment variables.';
  }

  res.status(status).json({
    error: {
      code,
      message,
      ...(err.details ? { details: err.details } : {}),
    },
  });
}
