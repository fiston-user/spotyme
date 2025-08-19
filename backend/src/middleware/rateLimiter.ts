import rateLimit from "express-rate-limit";
import { Request, Response } from "express";

// Store for tracking failed login attempts
const failedLoginAttempts = new Map<
  string,
  { count: number; resetTime: number }
>();

// Helper to get identifier from request
const getIdentifier = (req: Request): string => {
  // Use a combination of IP and user ID if available
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const userId = req.session?.userId || "anonymous";
  return `${ip}:${userId}`;
};

// General rate limiter
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    return req.path === "/health";
  },
  keyGenerator: getIdentifier,
});

// Strict rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 auth attempts per window
  message: "Too many authentication attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful auth
  keyGenerator: getIdentifier,
});

// Progressive delay for failed login attempts
export const loginAttemptLimiter = (
  req: Request,
  res: Response,
  next: Function
): any => {
  const identifier = getIdentifier(req);
  const now = Date.now();

  const attempts = failedLoginAttempts.get(identifier);
  if (attempts) {
    if (now < attempts.resetTime) {
      // Still in penalty period
      const waitTime = Math.ceil((attempts.resetTime - now) / 1000);
      return res.status(429).json({
        error: `Too many failed attempts. Please wait ${waitTime} seconds.`,
      });
    } else if (attempts.count >= 3) {
      // Reset after penalty period
      failedLoginAttempts.delete(identifier);
    }
  }

  // Store original res.status to intercept auth failures
  const originalStatus = res.status.bind(res);
  res.status = function (code: number) {
    if (code === 401 || code === 403) {
      // Auth failure - track it
      const current = failedLoginAttempts.get(identifier) || {
        count: 0,
        resetTime: 0,
      };
      current.count++;

      // Progressive delays: 5s, 30s, 5min, 30min
      const delays = [5000, 30000, 300000, 1800000];
      const delayIndex = Math.min(current.count - 1, delays.length - 1);
      current.resetTime = now + delays[delayIndex];

      failedLoginAttempts.set(identifier, current);
    }
    return originalStatus(code);
  };

  next();
};

// Spotify API rate limiter
export const spotifyApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Reduced to be more conservative with Spotify API
  message: "Too many Spotify API requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getIdentifier,
});

// Playlist creation rate limiter
export const playlistCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Max 10 playlists per hour per user
  message: "Playlist creation limit reached. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.session?.userId || getIdentifier(req),
});

// API key rate limiter (if using API keys in future)
export const apiKeyLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute for API key holders
  message: "API rate limit exceeded.",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use API key if present, otherwise fall back to IP
    const apiKey = req.headers["x-api-key"] as string;
    return apiKey || getIdentifier(req);
  },
});

// Clean up old failed attempts periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, attempts] of failedLoginAttempts.entries()) {
    if (now > attempts.resetTime + 3600000) {
      // 1 hour after reset time
      failedLoginAttempts.delete(key);
    }
  }
}, 600000); // Clean up every 10 minutes
