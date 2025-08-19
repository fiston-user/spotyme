import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';

declare module 'express-session' {
  interface SessionData {
    userId: string;
    accessToken: string;
    refreshToken: string;
    oauthState?: string;
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
      
      // Since tokens are encrypted in the database, we need to search differently
      // We'll need to find all users and check their decrypted tokens
      // In production, you'd want to use a cache or JWT for better performance
      const users = await User.find({ tokenExpiry: { $gt: new Date() } });
      
      for (const user of users) {
        try {
          const decryptedToken = user.getAccessToken();
          if (decryptedToken === token) {
            // Token is valid, attach user info to session
            req.session.userId = (user as any)._id.toString();
            req.session.accessToken = token;
            req.session.refreshToken = user.getRefreshToken();
            return next();
          }
        } catch (error) {
          // Continue to next user if decryption fails
          continue;
        }
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