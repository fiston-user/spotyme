import SpotifyWebApi from "spotify-web-api-node";
import crypto from "crypto";
import { tokenStorageService } from "./tokenStorage";

class SpotifyAuthService {
  private spotifyApi: SpotifyWebApi;
  private stateStore: Map<string, { timestamp: number; used: boolean }> =
    new Map();
  private readonly STATE_EXPIRY = 10 * 60 * 1000; // 10 minutes

  constructor() {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const redirectUri =
      process.env.SPOTIFY_REDIRECT_URI || "http://localhost:3000/auth/callback";

    if (!clientId || !clientSecret) {
      console.error("Spotify credentials not found in environment variables!");
      console.error("SPOTIFY_CLIENT_ID:", clientId ? "Set" : "Missing");
      console.error("SPOTIFY_CLIENT_SECRET:", clientSecret ? "Set" : "Missing");
    }

    this.spotifyApi = new SpotifyWebApi({
      clientId: clientId,
      clientSecret: clientSecret,
      redirectUri: redirectUri,
    });

    // Clean up expired states every 5 minutes
    setInterval(() => this.cleanupExpiredStates(), 5 * 60 * 1000);
  }

  private cleanupExpiredStates(): void {
    const now = Date.now();
    for (const [state, data] of this.stateStore.entries()) {
      if (now - data.timestamp > this.STATE_EXPIRY) {
        this.stateStore.delete(state);
      }
    }
  }

  async generateState(): Promise<string> {
    const state = crypto.randomBytes(32).toString("hex");

    // Store in Redis with TTL
    await tokenStorageService.storeOAuthState(state);

    // Also keep in memory as fallback
    this.stateStore.set(state, { timestamp: Date.now(), used: false });

    return state;
  }

  generateStateSync(): string {
    // Synchronous version for backward compatibility
    const state = crypto.randomBytes(32).toString("hex");

    // Store in Redis asynchronously (fire and forget)
    tokenStorageService.storeOAuthState(state).catch((err) => {
      console.error("Failed to store OAuth state in Redis:", err);
    });

    // Also keep in memory as fallback
    this.stateStore.set(state, { timestamp: Date.now(), used: false });

    return state;
  }

  async validateState(state: string): Promise<boolean> {
    // Try Redis first
    const isValidInRedis = await tokenStorageService.validateOAuthState(state);

    if (isValidInRedis) {
      // Clean up from memory store if it exists
      this.stateStore.delete(state);
      return true;
    }

    // Fallback to in-memory validation
    const stateData = this.stateStore.get(state);
    if (!stateData) {
      console.error("State not found in store");
      return false;
    }

    if (stateData.used) {
      console.error("State has already been used");
      return false;
    }

    if (Date.now() - stateData.timestamp > this.STATE_EXPIRY) {
      console.error("State has expired");
      this.stateStore.delete(state);
      return false;
    }

    // Mark state as used
    stateData.used = true;
    this.stateStore.set(state, stateData);

    // Delete state after validation to prevent reuse
    setTimeout(() => this.stateStore.delete(state), 1000);

    return true;
  }

  validateStateSync(state: string): boolean {
    // Synchronous version for backward compatibility - only uses in-memory store
    const stateData = this.stateStore.get(state);
    if (!stateData) {
      console.error("State not found in store");
      return false;
    }

    if (stateData.used) {
      console.error("State has already been used");
      return false;
    }

    if (Date.now() - stateData.timestamp > this.STATE_EXPIRY) {
      console.error("State has expired");
      this.stateStore.delete(state);
      return false;
    }

    // Mark state as used
    stateData.used = true;
    this.stateStore.set(state, stateData);

    // Delete state after validation to prevent reuse
    setTimeout(() => this.stateStore.delete(state), 1000);

    // Also try to delete from Redis asynchronously
    tokenStorageService.validateOAuthState(state).catch(() => {
      // Ignore errors - already validated in memory
    });

    return true;
  }

  getAuthorizationUrl(state?: string): string {
    const scopes = [
      "user-read-private",
      "user-read-email",
      "user-top-read",
      "playlist-read-private",
      "playlist-read-collaborative",
      "playlist-modify-public",
      "playlist-modify-private",
      "user-library-read",
      "user-library-modify",
    ];

    const authState = state || this.generateStateSync();
    const authUrl = this.spotifyApi.createAuthorizeURL(scopes, authState);
    console.log("Generated auth URL with state:", authState);
    return authUrl;
  }

  async handleCallback(code: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }> {
    try {
      const data = await this.spotifyApi.authorizationCodeGrant(code);

      this.spotifyApi.setAccessToken(data.body["access_token"]);
      this.spotifyApi.setRefreshToken(data.body["refresh_token"]);

      return {
        access_token: data.body["access_token"],
        refresh_token: data.body["refresh_token"],
        expires_in: data.body["expires_in"],
      };
    } catch (error) {
      console.error("Error handling callback:", error);
      throw new Error("Failed to exchange authorization code");
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<{
    access_token: string;
    expires_in: number;
  }> {
    try {
      this.spotifyApi.setRefreshToken(refreshToken);
      const data = await this.spotifyApi.refreshAccessToken();

      return {
        access_token: data.body["access_token"],
        expires_in: data.body["expires_in"],
      };
    } catch (error) {
      console.error("Error refreshing token:", error);
      throw new Error("Failed to refresh access token");
    }
  }

  async getUserProfile(accessToken: string): Promise<any> {
    try {
      this.spotifyApi.setAccessToken(accessToken);
      const data = await this.spotifyApi.getMe();
      return data.body;
    } catch (error) {
      console.error("Error getting user profile:", error);
      throw new Error("Failed to get user profile");
    }
  }
}

export const spotifyAuthService = new SpotifyAuthService();
