import { Router, Request, Response } from "express";
import { spotifyAuthService } from "../services/spotifyAuth";
import { userService } from "../services/userService";
import { authValidation } from "../middleware/validation";
import { authLimiter, loginAttemptLimiter } from "../middleware/rateLimiter";

// Declare global type for mobile tokens storage
declare global {
  var mobileTokens: Record<string, {
    accessToken: string;
    refreshToken: string;
    userId: string;
    email: string;
    displayName: string;
    imageUrl?: string;
    timestamp: number;
  }> | undefined;
}

const router = Router();

router.get("/login", (req: Request, res: Response) => {
  // Generate a new state for CSRF protection
  const state = spotifyAuthService.generateState();
  const authUrl = spotifyAuthService.getAuthorizationUrl(state);

  // Store state in session for web clients
  req.session.oauthState = state;

  res.json({ authUrl, state });
});

router.get(
  "/callback",
  authLimiter,
  loginAttemptLimiter,
  authValidation.callback,
  async (req: Request, res: Response) => {
    const { code, error, state } = req.query;

    if (error) {
      return res.status(400).json({ error: "Authorization failed" });
    }

    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "Invalid authorization code" });
    }

    if (!state || typeof state !== "string") {
      return res.status(400).json({ error: "State parameter missing" });
    }

    // Validate state to prevent CSRF attacks
    if (!spotifyAuthService.validateState(state)) {
      return res
        .status(400)
        .json({ error: "Invalid or expired state parameter" });
    }

    try {
      const tokens = await spotifyAuthService.handleCallback(code, state);
      const spotifyUser = await spotifyAuthService.getUserProfile(
        tokens.access_token
      );

      const user = await userService.findOrCreateUser({
        spotifyId: spotifyUser.id,
        email: spotifyUser.email,
        displayName: spotifyUser.display_name,
        imageUrl: spotifyUser.images?.[0]?.url,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
      });

      req.session.userId = (user._id as any).toString();
      req.session.accessToken = tokens.access_token;
      req.session.refreshToken = tokens.refresh_token;

      // Always redirect to mobile app after OAuth
      // Create a temporary session token for mobile
      const mobileSessionToken = require('crypto').randomBytes(32).toString('hex');
      
      // Store tokens temporarily in memory (in production, use Redis)
      if (!global.mobileTokens) {
        global.mobileTokens = {};
      }
      global.mobileTokens[mobileSessionToken] = {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        userId: user.spotifyId,
        email: user.email,
        displayName: user.displayName,
        imageUrl: user.imageUrl || '',
        timestamp: Date.now()
      };
      
      // Clean up old tokens after 5 minutes
      setTimeout(() => {
        if (global.mobileTokens) {
          delete global.mobileTokens[mobileSessionToken];
        }
      }, 5 * 60 * 1000);
      
      // Create HTML page that will redirect to the app
      // This ensures the redirect works from the OAuth browser
      const appCallbackUrl = `spotyme://callback?sessionToken=${mobileSessionToken}`;
      
      return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Login Successful</title>
          <meta http-equiv="refresh" content="0;url=${appCallbackUrl}">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #1DB954 0%, #191414 100%);
              color: white;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              padding: 20px;
              text-align: center;
            }
            h1 { margin-bottom: 20px; }
            p { margin-bottom: 30px; opacity: 0.9; }
            a {
              background: #1DB954;
              color: white;
              padding: 12px 24px;
              border-radius: 24px;
              text-decoration: none;
              font-weight: 600;
              display: inline-block;
              margin-top: 20px;
            }
            .success-icon {
              font-size: 48px;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="success-icon">✓</div>
          <h1>Login Successful!</h1>
          <p>Redirecting to SpotYme...</p>
          <a href="${appCallbackUrl}">Open SpotYme</a>
          <script>
            // Try multiple methods to redirect to the app
            window.location.href = "${appCallbackUrl}";
            
            // Fallback methods
            setTimeout(() => {
              window.location.replace("${appCallbackUrl}");
            }, 100);
            
            // If still on page after 2 seconds, show manual link
            setTimeout(() => {
              document.querySelector('a').style.display = 'inline-block';
            }, 2000);
          </script>
        </body>
      </html>
    `);
    } catch (error) {
      console.error("Callback error:", error);
      return res.status(500).json({ error: "Failed to authenticate" });
    }
  }
);

// Secure token exchange endpoint for mobile apps
router.post(
  "/exchange",
  authValidation.exchange,
  async (req: Request, res: Response) => {
    const { sessionToken } = req.body;

    if (!sessionToken) {
      return res.status(401).json({ error: "Session token required" });
    }

    // Retrieve tokens from temporary storage
    const tokenData = global.mobileTokens?.[sessionToken];
    
    if (!tokenData) {
      return res.status(401).json({ error: "Invalid or expired session token" });
    }
    
    // Check if token is not too old (5 minutes)
    if (Date.now() - tokenData.timestamp > 5 * 60 * 1000) {
      if (global.mobileTokens) {
        delete global.mobileTokens[sessionToken];
      }
      return res.status(401).json({ error: "Session token expired" });
    }

    // Delete token after use (one-time use)
    if (global.mobileTokens) {
      delete global.mobileTokens[sessionToken];
    }

    // Return tokens securely via POST response body
    return res.json({
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      user: {
        userId: tokenData.userId,
        email: tokenData.email,
        displayName: tokenData.displayName,
        imageUrl: tokenData.imageUrl,
      }
    });
  }
);

router.post(
  "/refresh",
  authValidation.refresh,
  async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token required" });
    }

    try {
      const tokens = await spotifyAuthService.refreshAccessToken(refreshToken);
      return res.json({
        accessToken: tokens.access_token,
        expiresIn: tokens.expires_in,
      });
    } catch (error) {
      console.error("Token refresh error:", error);
      return res.status(401).json({ error: "Failed to refresh token" });
    }
  }
);

router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Failed to logout" });
    }
    return res.json({ message: "Logged out successfully" });
  });
});

export default router;
