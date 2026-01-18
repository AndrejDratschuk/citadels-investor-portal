/**
 * Redis Connection Configuration
 * Shared Redis connection options for BullMQ queue and worker
 */

import { ConnectionOptions } from 'bullmq';

/**
 * Get Redis connection options from REDIS_URL environment variable
 * Parses the URL and returns BullMQ-compatible connection options
 */
export function getRedisConnectionOptions(): ConnectionOptions {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error('REDIS_URL environment variable is not set');
  }

  const url = new URL(redisUrl);
  return {
    host: url.hostname,
    port: parseInt(url.port || '6379', 10),
    password: url.password || undefined,
    username: url.username || undefined,
    maxRetriesPerRequest: null, // Required by BullMQ
  };
}

/**
 * Check if Redis is configured
 */
export function isRedisConfigured(): boolean {
  return !!process.env.REDIS_URL;
}

