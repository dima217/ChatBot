import type { Request, Response, NextFunction } from 'express';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      error: err.message,
      code: err.code,
    });
  }
  console.error(err);
  return res.status(500).json({ error: 'Internal server error' });
}
