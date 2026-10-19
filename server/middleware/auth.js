/**
 * Authentication and Authorization Middleware
 */

export function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to access this resource.',
      },
    });
  }
  next();
}
