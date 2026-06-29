import { Request, Response, NextFunction } from 'express';

/**
 * Auth middleware - currently UNUSED.
 *
 * TODO: When this middleware is enabled, it should:
 * 1. Validate Bearer token signature/expiry against apiKeyStore
 * 2. Attach apiKeyId to req for requestLogger
 * 3. Return 401 with { success: false, error: 'Unauthorized' } format
 *
 * Current KB routes use tokenStore-based verification (verifyToken) instead.
 */
export function auth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }
  next();
}

// NOTE: This middleware is currently unused.
// KB routes use tokenStore-based verification instead of Bearer token auth.
// If Bearer token auth is needed in the future, apply this middleware to protected routes.