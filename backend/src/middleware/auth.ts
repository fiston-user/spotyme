import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';

declare module 'express-session' {
  interface SessionData {
    userId: string;
    accessToken: string;
    refreshToken: string;
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check for Bearer token first (mobile app)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Find user by access token
      const user = await User.findOne({ accessToken: token });
      
      if (user && user.tokenExpiry && user.tokenExpiry > new Date()) {
        // Token is valid, attach user info to session
        req.session.userId = (user as any)._id.toString();
        req.session.accessToken = token;
        req.session.refreshToken = user.refreshToken;
        return next();
      }
    }
    
    // Fall back to session-based auth (web)
    if (req.session.userId && req.session.accessToken) {
      return next();
    }
    
    res.status(401).json({ error: 'Unauthorized. Please login first.' });
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};