import { createClient, RedisClientType } from 'redis';
import logger from '../utils/logger';

class RedisClient {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;

  async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      return;
    }

    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.client = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              logger.error('Redis: Max reconnection attempts reached');
              return new Error('Max reconnection attempts reached');
            }
            const delay = Math.min(retries * 100, 3000);
            logger.info(`Redis: Reconnecting in ${delay}ms (attempt ${retries})`);
            return delay;
          },
        },
      });

      // Error handling
      this.client.on('error', (err) => {
        logger.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis: Connected successfully');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        logger.info('Redis: Ready to accept commands');
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis: Reconnecting...');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      logger.error({ error }, 'Redis: Failed to connect');
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      this.client = null;
      logger.info('Redis: Disconnected');
    }
  }

  getClient(): RedisClientType {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client is not connected');
    }
    return this.client;
  }

  isReady(): boolean {
    return this.isConnected && this.client !== null;
  }

  // Utility method for setting values with TTL
  async setWithTTL(key: string, value: string, ttlSeconds: number): Promise<void> {
    const client = this.getClient();
    await client.setEx(key, ttlSeconds, value);
  }

  // Utility method for getting and deleting (atomic operation)
  async getAndDelete(key: string): Promise<string | null> {
    const client = this.getClient();
    
    // Use a Lua script for atomic get and delete
    const script = `
      local value = redis.call('GET', KEYS[1])
      if value then
        redis.call('DEL', KEYS[1])
      end
      return value
    `;
    
    const result = await client.eval(script, {
      keys: [key],
    }) as string | null;
    
    return result;
  }

  // Utility method for JSON storage
  async setJSON(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const client = this.getClient();
    const jsonString = JSON.stringify(value);
    
    if (ttlSeconds) {
      await client.setEx(key, ttlSeconds, jsonString);
    } else {
      await client.set(key, jsonString);
    }
  }

  async getJSON<T = any>(key: string): Promise<T | null> {
    const client = this.getClient();
    const value = await client.get(key);
    
    if (!value) {
      return null;
    }
    
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error({ error }, `Redis: Failed to parse JSON for key ${key}`);
      return null;
    }
  }

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    const client = this.getClient();
    const result = await client.exists(key);
    return result === 1;
  }

  // Delete a key
  async delete(key: string): Promise<boolean> {
    const client = this.getClient();
    const result = await client.del(key);
    return result === 1;
  }

  // Get TTL for a key
  async getTTL(key: string): Promise<number> {
    const client = this.getClient();
    return await client.ttl(key);
  }
}

// Export singleton instance
export const redisClient = new RedisClient();