const redis = require('redis');

/**
 * Redis Configuration for Caching and Session Management
 * 
 * Redis is an in-memory data structure store used as:
 * 1. Cache - Store frequently accessed data
 * 2. Session store - Manage user sessions
 * 3. Message broker - Real-time messaging with Pub/Sub
 * 4. Rate limiting - Track API request counts
 * 
 * WHY REDIS?
 * - Extremely fast (in-memory)
 * - Supports various data structures (strings, lists, sets, hashes)
 * - Built-in expiration (TTL - Time To Live)
 * - Persistence options available
 * - Pub/Sub for real-time features
 */

// Check if Redis is enabled
const REDIS_ENABLED = process.env.REDIS_ENABLED !== 'false';

// Create Redis client only if enabled
let redisClient = null;

if (REDIS_ENABLED) {
  // Support both REDIS_URL (for cloud) and individual config (for local)
  const redisConfig = process.env.REDIS_URL 
    ? { url: process.env.REDIS_URL }
    : {
        username: process.env.REDIS_USERNAME || undefined,
        password: process.env.REDIS_PASSWORD || undefined,
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379,
        },
      };

  redisClient = redis.createClient({
    ...redisConfig,
    legacyMode: false, // Use modern promise-based API
  });

  // Redis event handlers
  redisClient.on('connect', () => {
    console.log('🔗 Redis client connecting...');
  });

  redisClient.on('ready', () => {
    console.log('✅ Redis client ready');
  });

  redisClient.on('error', (err) => {
    console.error('❌ Redis Client Error:', err);
  });

  redisClient.on('end', () => {
    console.log('⚠️  Redis client disconnected');
  });
}

// Connect to Redis
const connectRedis = async () => {
  if (!REDIS_ENABLED || !redisClient) {
    console.log('⚠️  Redis is disabled, skipping connection');
    return;
  }
  
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
  }
};

/**
 * Cache Helper Functions
 */
const cacheHelpers = {
  /**
   * Set cache with expiration
   * @param {string} key - Cache key
   * @param {any} value - Value to cache (will be JSON stringified)
   * @param {number} ttl - Time to live in seconds (default: 1 hour)
   */
  set: async (key, value, ttl = 3600) => {
    if (!REDIS_ENABLED || !redisClient) return false;
    
    try {
      await redisClient.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Redis SET error:', error);
      return false;
    }
  },

  /**
   * Get cached value
   * @param {string} key - Cache key
   * @returns {any} Parsed cached value or null
   */
  get: async (key) => {
    if (!REDIS_ENABLED || !redisClient) return null;
    
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  },

  /**
   * Delete cached value
   * @param {string} key - Cache key
   */
  del: async (key) => {
    if (!REDIS_ENABLED || !redisClient) return false;
    
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error('Redis DEL error:', error);
      return false;
    }
  },

  /**
   * Delete multiple keys matching a pattern
   * @param {string} pattern - Key pattern (e.g., 'user:*')
   */
  delPattern: async (pattern) => {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      return true;
    } catch (error) {
      console.error('Redis DEL pattern error:', error);
      return false;
    }
  },

  /**
   * Check if key exists
   * @param {string} key - Cache key
   */
  exists: async (key) => {
    try {
      return await redisClient.exists(key);
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      return false;
    }
  },

  /**
   * Increment counter (useful for rate limiting)
   * @param {string} key - Counter key
   * @param {number} ttl - Expiration time in seconds
   */
  increment: async (key, ttl = 60) => {
    try {
      const value = await redisClient.incr(key);
      if (value === 1) {
        await redisClient.expire(key, ttl);
      }
      return value;
    } catch (error) {
      console.error('Redis INCREMENT error:', error);
      return null;
    }
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await redisClient.quit();
  console.log('Redis connection closed through app termination');
});

module.exports = { redisClient, connectRedis, cacheHelpers };

/**
 * ================================================
 * REDIS CACHING STRATEGIES & BEST PRACTICES
 * ================================================
 * 
 * 1. CACHE-ASIDE PATTERN (Lazy Loading):
 * --------------------------------------
 * - Check cache first
 * - If miss, fetch from database
 * - Store in cache for next request
 * 
 * Example:
 * const user = await cacheHelpers.get(`user:${userId}`);
 * if (!user) {
 *   const dbUser = await User.findById(userId);
 *   await cacheHelpers.set(`user:${userId}`, dbUser, 3600);
 *   return dbUser;
 * }
 * return user;
 * 
 * 
 * 2. WRITE-THROUGH PATTERN:
 * -------------------------
 * - Write to cache and database simultaneously
 * - Ensures cache is always up-to-date
 * 
 * Example:
 * await User.findByIdAndUpdate(userId, updateData);
 * await cacheHelpers.set(`user:${userId}`, updatedUser);
 * 
 * 
 * 3. CACHE INVALIDATION STRATEGIES:
 * ---------------------------------
 * a) TTL (Time To Live):
 *    - Set expiration time on cache entries
 *    - Automatic cleanup
 *    - Good for: Data that changes infrequently
 * 
 * b) Manual Invalidation:
 *    - Delete cache on data update
 *    - More control but requires careful implementation
 * 
 * c) Event-based Invalidation:
 *    - Invalidate related caches on specific events
 * 
 * 
 * 4. REDIS DATA STRUCTURES FOR DIFFERENT USE CASES:
 * -------------------------------------------------
 * 
 * STRINGS: Simple key-value pairs
 * - User sessions
 * - API responses
 * - Counters (rate limiting)
 * 
 * HASHES: Field-value pairs (like objects)
 * - User profiles with multiple fields
 * - Configuration settings
 * 
 * LISTS: Ordered collections
 * - Message queues
 * - Activity feeds
 * - Recent items
 * 
 * SETS: Unordered unique collections
 * - Tags
 * - Followers/Following lists
 * - Online users
 * 
 * SORTED SETS: Sets with scores
 * - Leaderboards
 * - Priority queues
 * - Time-series data
 * 
 * 
 * 5. REDIS PUB/SUB FOR REAL-TIME FEATURES:
 * ----------------------------------------
 * Publisher:
 * await redisClient.publish('notifications', JSON.stringify(data));
 * 
 * Subscriber:
 * const subscriber = redisClient.duplicate();
 * await subscriber.connect();
 * await subscriber.subscribe('notifications', (message) => {
 *   const data = JSON.parse(message);
 *   // Handle notification
 * });
 * 
 * 
 * 6. CACHING BEST PRACTICES:
 * -------------------------
 * ✓ Cache frequently accessed data
 * ✓ Set appropriate TTL values
 * ✓ Monitor cache hit/miss ratios
 * ✓ Implement cache warming for critical data
 * ✓ Use consistent key naming conventions
 * ✓ Handle cache failures gracefully
 * ✓ Avoid caching large objects
 * ✓ Consider memory limits
 * 
 * 
 * 7. CACHE KEY NAMING CONVENTIONS:
 * -------------------------------
 * user:{userId}              -> User profile
 * user:{userId}:posts        -> User's posts
 * job:{jobId}                -> Job details
 * search:users:{query}       -> Search results
 * session:{sessionId}        -> User session
 * ratelimit:{ip}:{endpoint}  -> Rate limit counter
 */
