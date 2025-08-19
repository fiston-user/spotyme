import { Request, Response } from "express";
import crypto from "crypto";

interface ErrorWithStatus extends Error {
  status?: number;
  code?: string;
  isOperational?: boolean;
}

// Map of error messages to user-friendly messages
const errorMessageMap: Record<string, string> = {
  "Failed to authenticate": "Authentication failed. Please try again.",
  "Invalid authorization code": "Invalid authorization. Please login again.",
  "Token decryption failed": "Session expired. Please login again.",
  "MongoDB connection error":
    "Database connection issue. Please try again later.",
  "Failed to exchange authorization code":
    "Authorization failed. Please try again.",
  "Failed to refresh access token":
    "Session refresh failed. Please login again.",
  "User not found": "User not found.",
  "Playlist not found": "Playlist not found.",
  Unauthorized: "Please login to continue.",
};

// Sanitize error messages to prevent info disclosure
const sanitizeErrorMessage = (message: string): string => {
  // Check if we have a user-friendly version
  for (const [key, value] of Object.entries(errorMessageMap)) {
    if (message.includes(key)) {
      return value;
    }
  }

  // Remove sensitive information patterns
  const sanitized = message
    .replace(/mongodb:\/\/[^/]+/gi, "mongodb://***") // Hide MongoDB URLs
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "***@***") // Hide emails
    .replace(/Bearer\s+[^\s]+/gi, "Bearer ***") // Hide bearer tokens
    .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, "***.***.***.***") // Hide IP addresses
    .replace(/\/[^/\s]*secret[^/\s]*/gi, "/***") // Hide paths with 'secret'
    .replace(/password[=:]\s*[^\s]+/gi, "password=***"); // Hide passwords

  // If it's a generic/technical error, return a safe message
  if (sanitized.includes("ECONNREFUSED") || sanitized.includes("ETIMEDOUT")) {
    return "Service temporarily unavailable. Please try again later.";
  }

  if (sanitized.includes("Cast to ObjectId failed")) {
    return "Invalid ID format provided.";
  }

  if (sanitized.includes("ValidationError")) {
    return "Invalid input data provided.";
  }

  return sanitized;
};

export const errorHandler = (
  err: ErrorWithStatus,
  req: Request,
  res: Response
  // _next: NextFunction
): void => {
  // Generate error ID for tracking
  const errorId = crypto.randomBytes(8).toString("hex");
  const status = err.status || 500;
  const isDevelopment = process.env.NODE_ENV === "development";

  if (isDevelopment) {
    console.error(`[Error ${errorId}] Stack:`, err.stack);
  }

  // Prepare user-facing error message
  let userMessage = "An unexpected error occurred.";

  if (status < 500) {
    // Client errors can be more specific
    userMessage = sanitizeErrorMessage(err.message);
  } else {
    // Server errors should be generic
    userMessage = "Internal server error. Please try again later.";
  }

  // Send response
  res.status(status).json({
    error: {
      message: userMessage,
      status,
      errorId, // Include error ID for support
      ...(isDevelopment && {
        originalMessage: err.message,
        stack: err.stack,
        path: req.path,
      }),
    },
  });
};
