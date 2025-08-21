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

const router: Router = Router();

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
          <meta name="viewport" content="width=device-width, initial-scale=1">
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
            h1 { 
              margin-bottom: 20px;
              font-size: 28px;
            }
            p { 
              margin-bottom: 30px; 
              opacity: 0.9;
              font-size: 16px;
            }
            .button-container {
              display: none;
            }
            .open-app-btn {
              background: #1DB954;
              color: #191414;
              padding: 16px 32px;
              border-radius: 30px;
              text-decoration: none;
              font-weight: 700;
              font-size: 18px;
              display: inline-block;
              margin: 10px;
              border: 3px solid #1DB954;
              transition: all 0.3s;
              box-shadow: 0 4px 15px rgba(29, 185, 84, 0.3);
            }
            .open-app-btn:hover {
              background: #1ed760;
              border-color: #1ed760;
              box-shadow: 0 6px 20px rgba(29, 185, 84, 0.4);
              transform: translateY(-2px);
            }
            .open-app-btn:active {
              transform: translateY(0);
            }
            .success-icon {
              font-size: 64px;
              margin-bottom: 20px;
              animation: checkmark 0.8s ease;
            }
            @keyframes checkmark {
              0% { transform: scale(0) rotate(-45deg); opacity: 0; }
              50% { transform: scale(1.2) rotate(10deg); }
              100% { transform: scale(1) rotate(0deg); opacity: 1; }
            }
            .spinner {
              border: 3px solid rgba(255, 255, 255, 0.3);
              border-top: 3px solid white;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin: 20px auto;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            .android-note {
              font-size: 14px;
              opacity: 0.8;
              margin-top: 20px;
              display: none;
            }
          </style>
        </head>
        <body>
          <div class="success-icon">✓</div>
          <h1>Login Successful!</h1>
          <p>Redirecting to SpotYme...</p>
          <div class="spinner"></div>
          
          <div class="button-container">
            <a href="${appCallbackUrl}" class="open-app-btn">Continue to SpotYme</a>
            <p class="android-note">Tap the button above to return to the app</p>
          </div>
          
          <script>
            // Detect if Android
            const isAndroid = /Android/i.test(navigator.userAgent);
            let redirectAttempted = false;
            
            // Function to attempt redirect
            function attemptRedirect() {
              if (redirectAttempted) return;
              redirectAttempted = true;
              
              // For Android, try multiple redirect methods
              if (isAndroid) {
                // Method 1: Direct location change
                window.location.href = "${appCallbackUrl}";
                
                // Method 2: Using location.replace after small delay
                setTimeout(() => {
                  window.location.replace("${appCallbackUrl}");
                }, 100);
                
                // Method 3: Create and click invisible link
                setTimeout(() => {
                  const link = document.createElement('a');
                  link.href = "${appCallbackUrl}";
                  link.style.display = 'none';
                  document.body.appendChild(link);
                  link.click();
                }, 200);
              } else {
                // For iOS, simple redirect usually works
                window.location.href = "${appCallbackUrl}";
              }
            }
            
            // Attempt redirect immediately
            attemptRedirect();
            
            // Show manual button after delay (especially for Android)
            setTimeout(() => {
              document.querySelector('.spinner').style.display = 'none';
              document.querySelector('.button-container').style.display = 'block';
              
              // Update message for Android users
              if (isAndroid) {
                document.querySelector('p').textContent = 'Almost there!';
                document.querySelector('.android-note').style.display = 'block';
              }
            }, isAndroid ? 1500 : 3000);
            
            // Additional attempt on page visibility change (when user returns to browser)
            document.addEventListener('visibilitychange', () => {
              if (!document.hidden) {
                attemptRedirect();
              }
            });
            
            // Attempt redirect on any user interaction
            document.addEventListener('click', attemptRedirect);
            document.addEventListener('touchstart', attemptRedirect);
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
