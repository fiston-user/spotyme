import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import session from "express-session";
import { connectDB } from "./config/database";
import { errorHandler } from "./middleware/errorHandler";
import { rateLimiter } from "./middleware/rateLimiter";
import authRoutes from "./routes/auth";
import spotifyRoutes from "./routes/spotify";
import playlistRoutes from "./routes/playlist";
import userRoutes from "./routes/user";

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

app.use(
  session({
    secret: process.env.SESSION_SECRET || "default-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

app.use(rateLimiter);

app.use("/auth", authRoutes);
app.use("/api/spotify", spotifyRoutes);
app.use("/api/playlists", playlistRoutes);
app.use("/api/user", userRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
