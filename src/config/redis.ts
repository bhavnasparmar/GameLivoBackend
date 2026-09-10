import { Redis } from 'ioredis';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

let redisClient: Redis | null = null;
const memoryStore = new Map<string, { value: string; expiresAt?: number }>();

export function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;

  try {
    const client = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      retryStrategy(times: number) {
        if (times > 3) {
          logger.warn('Redis retry limit reached. Falling back to in-memory store.');
          return null; // stop retrying
        }
        return Math.min(times * 100, 2000);
      },
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });

    client.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    client.on('error', (err: Error) => {
      logger.warn(`Redis connection failed: ${err.message}. Using in-memory fallback.`);
    });

    client.connect().catch((err: Error) => {
      logger.warn(`Could not connect to Redis: ${err.message}. Using in-memory fallback.`);
    });

    redisClient = client;
    return redisClient;
  } catch (err) {
    logger.warn('Redis initialization error. Using in-memory fallback.');
    return null;
  }
}

// Unified Cache Interface
export const cache = {
  async get(key: string): Promise<string | null> {
    try {
      const client = getRedisClient();
      if (client && client.status === 'ready') {
        return await client.get(key);
      }
    } catch {
      // fallback
    }
    const item = memoryStore.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      memoryStore.delete(key);
      return null;
    }
    return item.value;
  },

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      const client = getRedisClient();
      if (client && client.status === 'ready') {
        if (ttlSeconds) {
          await client.setex(key, ttlSeconds, value);
        } else {
          await client.set(key, value);
        }
        return;
      }
    } catch {
      // fallback
    }
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    memoryStore.set(key, { value, expiresAt });
  },

  async del(key: string): Promise<void> {
    try {
      const client = getRedisClient();
      if (client && client.status === 'ready') {
        await client.del(key);
        return;
      }
    } catch {
      // fallback
    }
    memoryStore.delete(key);
  },
};
