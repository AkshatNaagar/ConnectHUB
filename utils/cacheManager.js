const { redisClient } = require('../config/redis');

/**
 * Cache Manager Utility
 * Centralized caching service with Redis
 * Provides methods to cache and retrieve data with automatic logging
 */

class CacheManager {
  /**
   * Set cache with automatic logging
   * @param {string} key - Cache key
   * @param {any} value - Value to cache (will be JSON stringified)
   * @param {number} ttl - Time to live in seconds (default: 3600 = 1 hour)
   */
  static async set(key, value, ttl = 3600) {
    try {
      const serialized = JSON.stringify(value);
      await redisClient.set(key, serialized, {
        EX: ttl
      });
      console.log(`✅ Redis WRITE: Key="${key}" | Size=${serialized.length} bytes | TTL=${ttl}s`);
      return true;
    } catch (error) {
      console.error(`❌ Redis WRITE ERROR: Key="${key}"`, error.message);
      return false;
    }
  }

  /**
   * Get cache with automatic logging
   * @param {string} key - Cache key
   * @returns {any|null} Parsed cached value or null
   */
  static async get(key) {
    try {
      const data = await redisClient.get(key);
      if (data) {
        console.log(`✅ Redis READ (HIT): Key="${key}" | Size=${data.length} bytes`);
        return JSON.parse(data);
      } else {
        console.log(`⚠️  Redis READ (MISS): Key="${key}"`);
        return null;
      }
    } catch (error) {
      console.error(`❌ Redis READ ERROR: Key="${key}"`, error.message);
      return null;
    }
  }

  /**
   * Delete cache entry
   * @param {string} key - Cache key
   */
  static async delete(key) {
    try {
      await redisClient.del(key);
      console.log(`🗑️  Redis DELETE: Key="${key}"`);
      return true;
    } catch (error) {
      console.error(`❌ Redis DELETE ERROR: Key="${key}"`, error.message);
      return false;
    }
  }

  /**
   * Set hash field
   * @param {string} key - Hash key
   * @param {string} field - Field name
   * @param {any} value - Value to store
   */
  static async hset(key, field, value) {
    try {
      const serialized = JSON.stringify(value);
      await redisClient.hSet(key, field, serialized);
      console.log(`✅ Redis HSET: Key="${key}" | Field="${field}" | Size=${serialized.length} bytes`);
      return true;
    } catch (error) {
      console.error(`❌ Redis HSET ERROR: Key="${key}" Field="${field}"`, error.message);
      return false;
    }
  }

  /**
   * Get hash field
   * @param {string} key - Hash key
   * @param {string} field - Field name
   */
  static async hget(key, field) {
    try {
      const data = await redisClient.hGet(key, field);
      if (data) {
        console.log(`✅ Redis HGET (HIT): Key="${key}" | Field="${field}"`);
        return JSON.parse(data);
      } else {
        console.log(`⚠️  Redis HGET (MISS): Key="${key}" | Field="${field}"`);
        return null;
      }
    } catch (error) {
      console.error(`❌ Redis HGET ERROR: Key="${key}" Field="${field}"`, error.message);
      return null;
    }
  }

  /**
   * Get all hash fields
   * @param {string} key - Hash key
   */
  static async hgetall(key) {
    try {
      const data = await redisClient.hGetAll(key);
      if (Object.keys(data).length > 0) {
        console.log(`✅ Redis HGETALL (HIT): Key="${key}" | Fields=${Object.keys(data).length}`);
        // Parse all JSON values
        const parsed = {};
        for (const [field, value] of Object.entries(data)) {
          parsed[field] = JSON.parse(value);
        }
        return parsed;
      } else {
        console.log(`⚠️  Redis HGETALL (MISS): Key="${key}"`);
        return null;
      }
    } catch (error) {
      console.error(`❌ Redis HGETALL ERROR: Key="${key}"`, error.message);
      return null;
    }
  }

  /**
   * Cache with a wrapper function
   * Automatically caches the result of a function
   * @param {string} key - Cache key
   * @param {Function} fn - Function to execute if cache misses
   * @param {number} ttl - Time to live in seconds
   */
  static async wrap(key, fn, ttl = 3600) {
    // Try to get from cache first
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    console.log(`🔄 Cache MISS: Executing function for Key="${key}"`);
    const result = await fn();
    await this.set(key, result, ttl);
    return result;
  }

  /**
   * Invalidate multiple keys by pattern
   * @param {string} pattern - Redis key pattern (e.g., "user:*")
   */
  static async invalidatePattern(pattern) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
        console.log(`🗑️  Redis INVALIDATE: Pattern="${pattern}" | Deleted ${keys.length} keys`);
      }
      return keys.length;
    } catch (error) {
      console.error(`❌ Redis INVALIDATE ERROR: Pattern="${pattern}"`, error.message);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  static async getStats() {
    try {
      const info = await redisClient.info('stats');
      const keyspace = await redisClient.info('keyspace');
      console.log(`📊 Redis Statistics:`);
      console.log(`   ${info.split('\n').slice(0, 10).join('\n   ')}`);
      console.log(`   ${keyspace}`);
      return { info, keyspace };
    } catch (error) {
      console.error('❌ Redis STATS ERROR:', error.message);
      return null;
    }
  }
}

module.exports = CacheManager;
