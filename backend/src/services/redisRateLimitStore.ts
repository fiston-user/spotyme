import RedisStore from 'rate-limit-redis';
import { Options as RateLimitOptions } from 'express-rate-limit';
import { redisClient } from './redisClient';
import { createLogger } from '../utils/logger';

const logger = createLogger('rate-limit-store');

class RedisRateLimitStore {
  private isRedisAvailable: boolean = false;
  private memoryStoreWarningShown: boolean = false;

  constructor() {
    this.checkRedisAvailability();
    
    // Check Redis availability periodically
    setInterval(() => {
      this.checkRedisAvailability();
    }, 30000); // Check every 30 seconds
  }

  private checkRedisAvailability(): void {
    const wasAvailable = this.isRedisAvailable;
    this.isRedisAvailable = redisClient.isReady();
    
    if (!wasAvailable && this.isRedisAvailable) {
      logger.info('Redis is now available for rate limiting');
      this.memoryStoreWarningShown = false;
    } else if (wasAvailable && !this.isRedisAvailable) {
      logger.warn('Redis is no longer available for rate limiting, falling back to memory store');
    }
  }

  /**
   * Creates a rate limit store configuration
   * Falls back to memory store if Redis is unavailable
   */
  createStore(prefix: string = 'rl'): Partial<RateLimitOptions> {
    // Check Redis availability
    this.checkRedisAvailability();

    if (!this.isRedisAvailable) {
      if (!this.memoryStoreWarningShown) {
        logger.warn(`Redis unavailable for rate limiting (${prefix}), using memory store`);
        this.memoryStoreWarningShown = true;
      }
      // Return empty object to use default memory store
      return {};
    }

    try {
      // Create Redis store configuration
      const store = new RedisStore({
        sendCommand: (...args: string[]) => {
          // Custom command sender that handles Redis errors gracefully
          const client = redisClient.getClient();
          return (client as any).sendCommand(args).catch((error: any) => {
            logger.error({ error, command: args }, 'Redis command failed in rate limiter');
            // Mark Redis as unavailable and return null to fall back to memory
            this.isRedisAvailable = false;
            return null;
          });
        },
        prefix: `rate_limit:${prefix}:`,
      });

      return { store };
    } catch (error) {
      logger.error({ error }, 'Failed to create Redis rate limit store');
      this.isRedisAvailable = false;
      return {};
    }
  }

  /**
   * Store failed login attempts in Redis with progressive delays
   */
  async recordFailedAttempt(identifier: string): Promise<{ count: number; resetTime: number }> {
    const key = `failed_login:${identifier}`;
    
    try {
      if (!redisClient.isReady()) {
        throw new Error('Redis not available');
      }

      const client = redisClient.getClient();
      
      // Increment attempt counter
      const count = await client.incr(key);
      
      // Calculate progressive delay based on attempt count
      const delays = [5, 30, 300, 1800]; // 5s, 30s, 5min, 30min
      const delayIndex = Math.min(count - 1, delays.length - 1);
      const delaySeconds = delays[delayIndex];
      const resetTime = Date.now() + (delaySeconds * 1000);
      
      // Set TTL for the key (max delay + 1 hour for cleanup)
      const maxDelay = Math.max(...delays);
      await client.expire(key, maxDelay + 3600);
      
      // Store reset time separately
      const resetKey = `${key}:reset`;
      await redisClient.setWithTTL(resetKey, resetTime.toString(), delaySeconds);
      
      logger.info({ identifier, count, delaySeconds }, 'Failed login attempt recorded');
      
      return { count, resetTime };
    } catch (error) {
      logger.error({ error }, 'Failed to record login attempt in Redis');
      // Fallback handled by the middleware
      throw error;
    }
  }

  /**
   * Check if user is in penalty period
   */
  async checkPenalty(identifier: string): Promise<{ inPenalty: boolean; resetTime?: number; count?: number }> {
    const key = `failed_login:${identifier}`;
    const resetKey = `${key}:reset`;
    
    try {
      if (!redisClient.isReady()) {
        throw new Error('Redis not available');
      }

      const client = redisClient.getClient();
      
      // Get current count and reset time
      const [countStr, resetTimeStr] = await Promise.all([
        client.get(key),
        client.get(resetKey)
      ]);
      
      if (!countStr || !resetTimeStr) {
        return { inPenalty: false };
      }
      
      const count = parseInt(countStr, 10);
      const resetTime = parseInt(resetTimeStr, 10);
      const now = Date.now();
      
      if (now < resetTime) {
        // Still in penalty period
        return { inPenalty: true, resetTime, count };
      } else {
        // Penalty period expired, clean up
        await Promise.all([
          client.del(key),
          client.del(resetKey)
        ]);
        return { inPenalty: false };
      }
    } catch (error) {
      logger.error({ error }, 'Failed to check penalty in Redis');
      // Fallback handled by the middleware
      throw error;
    }
  }

  /**
   * Clear failed attempts for an identifier (e.g., after successful login)
   */
  async clearFailedAttempts(identifier: string): Promise<void> {
    const key = `failed_login:${identifier}`;
    const resetKey = `${key}:reset`;
    
    try {
      if (!redisClient.isReady()) {
        throw new Error('Redis not available');
      }

      const client = redisClient.getClient();
      await Promise.all([
        client.del(key),
        client.del(resetKey)
      ]);
      
      logger.info({ identifier }, 'Failed login attempts cleared');
    } catch (error) {
      logger.error({ error }, 'Failed to clear attempts in Redis');
      // Non-critical operation, don't throw
    }
  }

  /**
   * Get rate limit stats for monitoring
   */
  async getStats(prefix: string = 'rl'): Promise<{ keys: number; redisAvailable: boolean }> {
    try {
      if (!redisClient.isReady()) {
        return { keys: 0, redisAvailable: false };
      }

      const client = redisClient.getClient();
      const pattern = `rate_limit:${prefix}:*`;
      const keys = await client.keys(pattern);
      
      return {
        keys: keys.length,
        redisAvailable: true
      };
    } catch (error) {
      logger.error({ error }, 'Failed to get rate limit stats');
      return { keys: 0, redisAvailable: false };
    }
  }
}

// Export singleton instance
export const redisRateLimitStore = new RedisRateLimitStore();