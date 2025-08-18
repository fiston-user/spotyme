import { Request, Response, NextFunction } from 'express';

declare module 'express-session' {
  interface SessionData {
    userId: string;
    accessToken: string;
    refreshToken: string;
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.session.userId || !req.session.accessToken) {
    res.status(401).json({ error: 'Unauthorized. Please login first.' });
    return;
  }
  next();
};