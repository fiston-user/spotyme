import { Router } from 'express';
import { spotifyAuthService } from '../services/spotifyAuth';
import { userService } from '../services/userService';

const router = Router();

router.get('/login', (_req, res) => {
  const authUrl = spotifyAuthService.getAuthorizationUrl();
  res.json({ authUrl });
});

router.get('/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.status(400).json({ error: 'Authorization failed' });
  }

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Invalid authorization code' });
  }

  try {
    const tokens = await spotifyAuthService.handleCallback(code);
    const spotifyUser = await spotifyAuthService.getUserProfile(tokens.access_token);
    
    const user = await userService.findOrCreateUser({
      spotifyId: spotifyUser.id,
      email: spotifyUser.email,
      displayName: spotifyUser.display_name,
      imageUrl: spotifyUser.images?.[0]?.url,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiry: new Date(Date.now() + tokens.expires_in * 1000)
    });

    req.session.userId = (user._id as any).toString();
    req.session.accessToken = tokens.access_token;
    req.session.refreshToken = tokens.refresh_token;

    // Create a deep link URL back to the app with the tokens
    // Using the app's custom scheme for proper deep linking
    const callbackUrl = `spotyme://callback?` + 
      `accessToken=${encodeURIComponent(tokens.access_token)}&` +
      `refreshToken=${encodeURIComponent(tokens.refresh_token)}&` +
      `userId=${encodeURIComponent(user.spotifyId)}&` +
      `email=${encodeURIComponent(user.email || '')}&` +
      `displayName=${encodeURIComponent(user.displayName || '')}&` +
      `imageUrl=${encodeURIComponent(user.imageUrl || '')}`;

    // Try to redirect to the app
    // If the redirect doesn't work, show a success page with a manual redirect link
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Login Successful</title>
          <meta http-equiv="refresh" content="0;url=${callbackUrl}">
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
          <p>You should be redirected to SpotYme automatically.</p>
          <a href="${callbackUrl}">Open SpotYme</a>
          <script>
            // Try multiple redirect methods
            window.location.href = "${callbackUrl}";
            setTimeout(() => {
              window.location.replace("${callbackUrl}");
            }, 100);
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Callback error:', error);
    return res.status(500).json({ error: 'Failed to authenticate' });
  }
});

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' });
  }

  try {
    const tokens = await spotifyAuthService.refreshAccessToken(refreshToken);
    return res.json({
      accessToken: tokens.access_token,
      expiresIn: tokens.expires_in
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(401).json({ error: 'Failed to refresh token' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    return res.json({ message: 'Logged out successfully' });
  });
});

export default router;