import { Router, Request, Response } from "express";
import { spotifyAuthService } from "../services/spotifyAuth";
import { userService } from "../services/userService";
import { tokenStorageService } from "../services/tokenStorage";
import { authValidation } from "../middleware/validation";
import { authLimiter, loginAttemptLimiter } from "../middleware/rateLimiter";

const router: Router = Router();

router.get("/login", (req: Request, res: Response) => {
  // Generate a new state for CSRF protection
  const state = spotifyAuthService.generateStateSync();
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
    const isValidState = await spotifyAuthService.validateState(state);
    if (!isValidState) {
      return res
        .status(400)
        .json({ error: "Invalid or expired state parameter" });
    }

    try {
      const tokens = await spotifyAuthService.handleCallback(code);
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
      // Store tokens in Redis with TTL
      const mobileSessionToken = await tokenStorageService.storeMobileToken({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        userId: user.spotifyId,
        email: user.email,
        displayName: user.displayName,
        imageUrl: user.imageUrl || '',
      });
      
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
              color: #191414;
              padding: 16px 32px;
              border-radius: 30px;
              text-decoration: none;
              font-weight: 700;
              font-size: 18px;
              display: inline-block;
              margin-top: 20px;
              box-shadow: 0 4px 15px rgba(29, 185, 84, 0.3);
            }
            a:hover {
              background: #1ed760;
            }
            .success-icon {
              font-size: 48px;
              margin-bottom: 20px;
            }
            .manual-button {
              display: none;
              animation: fadeIn 0.5s ease-in;
            }
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
          </style>
        </head>
        <body>
          <div class="success-icon">✓</div>
          <h1>Login Successful!</h1>
          <p>Redirecting to SpotYme...</p>
          <a href="${appCallbackUrl}" id="manualBtn" class="manual-button">Open SpotYme</a>
          <script>
            const appUrl = "${appCallbackUrl}";
            const isAndroid = /android/i.test(navigator.userAgent);
            
            // Function to attempt redirect
            function attemptRedirect() {
              // Try standard redirect
              window.location.href = appUrl;
              
              // For Android, also try intent-based redirect
              if (isAndroid) {
                setTimeout(() => {
                  // Try Android intent URL format
                  const intentUrl = 'intent://callback?sessionToken=${mobileSessionToken}#Intent;scheme=spotyme;package=com.anonymous.spotyme;end';
                  window.location.href = intentUrl;
                }, 200);
              }
              
              // Fallback: Try location.replace
              setTimeout(() => {
                window.location.replace(appUrl);
              }, 500);
            }
            
            // Attempt redirect immediately
            attemptRedirect();
            
            // Show manual button after 2 seconds if still on page
            setTimeout(() => {
              const btn = document.getElementById('manualBtn');
              if (btn) {
                btn.style.display = 'inline-block';
                
                // Also update the message
                const p = document.querySelector('p');
                if (p) {
                  p.textContent = 'Please click the button below to open SpotYme:';
                }
              }
            }, 2000);
            
            // For Android Chrome/WebView, try using document.location
            if (isAndroid) {
              setTimeout(() => {
                document.location = appUrl;
              }, 300);
            }
          </script>
        </body>
      </html>
    `);
    } catch (error) {
      // Log error using logger instead of console
      const logger = require('../utils/logger').createLogger('auth');
      logger.error({ error }, 'OAuth callback error');
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

    // Retrieve tokens from Redis (or fallback)
    const tokenData = await tokenStorageService.getMobileToken(sessionToken);
    
    if (!tokenData) {
      return res.status(401).json({ error: "Invalid or expired session token" });
    }
    
    // Delete token after use (one-time use)
    await tokenStorageService.deleteMobileToken(sessionToken);

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
      // Log error using logger instead of console
      const logger = require('../utils/logger').createLogger('auth');
      logger.error({ error }, 'Token refresh error');
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
