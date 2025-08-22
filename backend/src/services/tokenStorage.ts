import { redisClient } from './redisClient';
import logger from '../utils/logger';
import crypto from 'crypto';

interface MobileTokenData {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
  displayName: string;
  imageUrl?: string;
  timestamp: number;
}

interface OAuthState {
  state: string;
  timestamp: number;
  metadata?: any;
}

class TokenStorageService {
  private readonly MOBILE_TOKEN_PREFIX = 'mobile_token:';
  private readonly OAUTH_STATE_PREFIX = 'oauth_state:';
  private readonly MOBILE_TOKEN_TTL = 300; // 5 minutes in seconds
  private readonly OAUTH_STATE_TTL = 600; // 10 minutes in seconds

  // Fallback to in-memory storage if Redis is unavailable
  private inMemoryTokens: Map<string, MobileTokenData> = new Map();
  private inMemoryStates: Map<string, OAuthState> = new Map();

  constructor() {
    // Clean up expired in-memory tokens periodically
    setInterval(() => {
      this.cleanupInMemoryStorage();
    }, 60000); // Every minute
  }

  private cleanupInMemoryStorage(): void {
    const now = Date.now();
    
    // Clean expired tokens
    for (const [key, data] of this.inMemoryTokens.entries()) {
      if (now - data.timestamp > this.MOBILE_TOKEN_TTL * 1000) {
        this.inMemoryTokens.delete(key);
      }
    }
    
    // Clean expired states
    for (const [key, data] of this.inMemoryStates.entries()) {
      if (now - data.timestamp > this.OAUTH_STATE_TTL * 1000) {
        this.inMemoryStates.delete(key);
      }
    }
  }

  // Mobile Token Management
  async storeMobileToken(tokenData: Omit<MobileTokenData, 'timestamp'>): Promise<string> {
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const key = `${this.MOBILE_TOKEN_PREFIX}${sessionToken}`;
    
    const dataWithTimestamp: MobileTokenData = {
      ...tokenData,
      timestamp: Date.now(),
    };

    try {
      if (redisClient.isReady()) {
        await redisClient.setJSON(key, dataWithTimestamp, this.MOBILE_TOKEN_TTL);
        logger.info(`Stored mobile token in Redis: ${sessionToken.substring(0, 8)}...`);
      } else {
        // Fallback to in-memory storage
        this.inMemoryTokens.set(sessionToken, dataWithTimestamp);
        logger.warn('Redis unavailable, using in-memory storage for mobile token');
        
        // Set timeout for cleanup
        setTimeout(() => {
          this.inMemoryTokens.delete(sessionToken);
        }, this.MOBILE_TOKEN_TTL * 1000);
      }
    } catch (error) {
      logger.error({ error }, 'Failed to store mobile token in Redis, using fallback');
      
      // Fallback to in-memory storage
      this.inMemoryTokens.set(sessionToken, dataWithTimestamp);
      
      setTimeout(() => {
        this.inMemoryTokens.delete(sessionToken);
      }, this.MOBILE_TOKEN_TTL * 1000);
    }

    return sessionToken;
  }

  async getMobileToken(sessionToken: string): Promise<MobileTokenData | null> {
    const key = `${this.MOBILE_TOKEN_PREFIX}${sessionToken}`;

    try {
      if (redisClient.isReady()) {
        const data = await redisClient.getJSON<MobileTokenData>(key);
        
        if (data) {
          logger.info(`Retrieved mobile token from Redis: ${sessionToken.substring(0, 8)}...`);
          
          // Check if token is expired
          if (Date.now() - data.timestamp > this.MOBILE_TOKEN_TTL * 1000) {
            await redisClient.delete(key);
            logger.warn('Mobile token expired');
            return null;
          }
        }
        
        return data;
      } else {
        // Fallback to in-memory storage
        const data = this.inMemoryTokens.get(sessionToken);
        
        if (data) {
          // Check if token is expired
          if (Date.now() - data.timestamp > this.MOBILE_TOKEN_TTL * 1000) {
            this.inMemoryTokens.delete(sessionToken);
            logger.warn('Mobile token expired (in-memory)');
            return null;
          }
          
          logger.info(`Retrieved mobile token from memory: ${sessionToken.substring(0, 8)}...`);
        }
        
        return data || null;
      }
    } catch (error) {
      logger.error({ error }, 'Failed to get mobile token from Redis, using fallback');
      
      // Fallback to in-memory storage
      const data = this.inMemoryTokens.get(sessionToken);
      
      if (data && Date.now() - data.timestamp > this.MOBILE_TOKEN_TTL * 1000) {
        this.inMemoryTokens.delete(sessionToken);
        return null;
      }
      
      return data || null;
    }
  }

  async deleteMobileToken(sessionToken: string): Promise<boolean> {
    const key = `${this.MOBILE_TOKEN_PREFIX}${sessionToken}`;

    try {
      if (redisClient.isReady()) {
        const deleted = await redisClient.delete(key);
        logger.info(`Deleted mobile token from Redis: ${sessionToken.substring(0, 8)}...`);
        return deleted;
      } else {
        // Fallback to in-memory storage
        const deleted = this.inMemoryTokens.delete(sessionToken);
        logger.info(`Deleted mobile token from memory: ${sessionToken.substring(0, 8)}...`);
        return deleted;
      }
    } catch (error) {
      logger.error({ error }, 'Failed to delete mobile token from Redis, using fallback');
      
      // Fallback to in-memory storage
      return this.inMemoryTokens.delete(sessionToken);
    }
  }

  // OAuth State Management
  async storeOAuthState(state: string, metadata?: any): Promise<void> {
    const key = `${this.OAUTH_STATE_PREFIX}${state}`;
    
    const stateData: OAuthState = {
      state,
      timestamp: Date.now(),
      metadata,
    };

    try {
      if (redisClient.isReady()) {
        await redisClient.setJSON(key, stateData, this.OAUTH_STATE_TTL);
        logger.info(`Stored OAuth state in Redis: ${state.substring(0, 8)}...`);
      } else {
        // Fallback to in-memory storage
        this.inMemoryStates.set(state, stateData);
        logger.warn('Redis unavailable, using in-memory storage for OAuth state');
        
        // Set timeout for cleanup
        setTimeout(() => {
          this.inMemoryStates.delete(state);
        }, this.OAUTH_STATE_TTL * 1000);
      }
    } catch (error) {
      logger.error({ error }, 'Failed to store OAuth state in Redis, using fallback');
      
      // Fallback to in-memory storage
      this.inMemoryStates.set(state, stateData);
      
      setTimeout(() => {
        this.inMemoryStates.delete(state);
      }, this.OAUTH_STATE_TTL * 1000);
    }
  }

  async validateOAuthState(state: string): Promise<boolean> {
    const key = `${this.OAUTH_STATE_PREFIX}${state}`;

    try {
      if (redisClient.isReady()) {
        const data = await redisClient.getJSON<OAuthState>(key);
        
        if (data) {
          // Check if state is expired
          if (Date.now() - data.timestamp > this.OAUTH_STATE_TTL * 1000) {
            await redisClient.delete(key);
            logger.warn('OAuth state expired');
            return false;
          }
          
          // Delete after successful validation (one-time use)
          await redisClient.delete(key);
          logger.info(`Validated and removed OAuth state from Redis: ${state.substring(0, 8)}...`);
          return true;
        }
        
        return false;
      } else {
        // Fallback to in-memory storage
        const data = this.inMemoryStates.get(state);
        
        if (data) {
          // Check if state is expired
          if (Date.now() - data.timestamp > this.OAUTH_STATE_TTL * 1000) {
            this.inMemoryStates.delete(state);
            logger.warn('OAuth state expired (in-memory)');
            return false;
          }
          
          // Delete after successful validation (one-time use)
          this.inMemoryStates.delete(state);
          logger.info(`Validated and removed OAuth state from memory: ${state.substring(0, 8)}...`);
          return true;
        }
        
        return false;
      }
    } catch (error) {
      logger.error({ error }, 'Failed to validate OAuth state from Redis, using fallback');
      
      // Fallback to in-memory storage
      const data = this.inMemoryStates.get(state);
      
      if (data) {
        if (Date.now() - data.timestamp > this.OAUTH_STATE_TTL * 1000) {
          this.inMemoryStates.delete(state);
          return false;
        }
        
        this.inMemoryStates.delete(state);
        return true;
      }
      
      return false;
    }
  }

  // Get stats for monitoring
  async getStats(): Promise<{
    redis: boolean;
    inMemoryTokens: number;
    inMemoryStates: number;
  }> {
    return {
      redis: redisClient.isReady(),
      inMemoryTokens: this.inMemoryTokens.size,
      inMemoryStates: this.inMemoryStates.size,
    };
  }
}

// Export singleton instance
export const tokenStorageService = new TokenStorageService();