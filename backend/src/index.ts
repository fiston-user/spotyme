import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import session from "express-session";
import MongoStore from "connect-mongo";
import { connectDB } from "./config/database";
import { errorHandler } from "./middleware/errorHandler";
import { rateLimiter } from "./middleware/rateLimiter";
import { createLogger } from "./utils/logger";
import authRoutes from "./routes/auth";
import spotifyRoutes from "./routes/spotify";
import playlistRoutes from "./routes/playlist";
import userRoutes from "./routes/user";
import assetlinksRoutes from "./routes/assetlinks";

const logger = createLogger('server');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy headers (needed for ngrok and reverse proxies)
app.set('trust proxy', true);

app.use(helmet());
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:8081",
      "http://localhost:19006", // Expo web
      "http://localhost:8081", // React Native
      "exp://localhost:8081", // Expo client
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Generate secure session secret if not provided
const getSessionSecret = (): string => {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    logger.error('SESSION_SECRET is missing or too short!');
    logger.error('Please set a secure SESSION_SECRET in your environment variables');
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET is required in production');
    }
    // Only for development - generate a temporary secret
    logger.warn('Generating temporary session secret for development');
    return require('crypto').randomBytes(32).toString('hex');
  }
  return secret;
};

app.use(
  session({
    secret: getSessionSecret(),
    name: 'spotyme.sid', // Custom session name to avoid fingerprinting
    resave: false,
    saveUninitialized: false,
    rolling: true, // Reset expiry on activity
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/spotyme',
      collectionName: 'sessions',
      ttl: 60 * 60 * 24 * 7, // 7 days in seconds
      autoRemove: 'native', // Let MongoDB handle TTL
      crypto: {
        secret: process.env.SESSION_STORE_SECRET || getSessionSecret()
      }
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      httpOnly: true, // Prevent XSS attacks
      sameSite: 'strict', // CSRF protection
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      domain: process.env.COOKIE_DOMAIN || undefined,
    },
    // Add session store configuration for production
    ...(process.env.NODE_ENV === 'production' && {
      proxy: true, // Trust proxy in production
    }),
  })
);

app.use(rateLimiter);

// Root endpoint
app.get("/", (_req, res) => {
  res.json({
    message: "SpotYme API",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/health",
      auth: "/auth/*",
      spotify: "/api/spotify/*",
      playlists: "/api/playlists/*",
      user: "/api/user/*"
    }
  });
});

// Android App Links verification (must be before other routes)
app.use(assetlinksRoutes);

app.use("/auth", authRoutes);
app.use("/api/spotify", spotifyRoutes);
app.use("/api/playlists", playlistRoutes);
app.use("/api/user", userRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404 handler for undefined routes
app.use((_req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: "The requested endpoint does not exist",
    timestamp: new Date().toISOString()
  });
});

app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      logger.info({ port: PORT }, `Server running on port ${PORT}`);
      logger.info({ env: process.env.NODE_ENV }, `Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.fatal({ error }, 'Failed to start server');
    process.exit(1);
  }
};

startServer();
