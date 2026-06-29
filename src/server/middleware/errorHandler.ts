import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error & { statusCode?: number },
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('Error:', err.message);
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;
  res.status(statusCode).json({ success: false, error: message });
}