const { createClient } = require('redis');

// Access the Redis client from index.js
let redisClient;

// Function to set the Redis client reference
function setRedisClient(client) {
  redisClient = client;
}

/**
 * Cache key format: lyrics:data:{lyricId}:{language}
 * Expiration: 1 hour (3600 seconds)
 */
const CACHE_EXPIRATION = 3600;

/**
 * Cache lyrics data with analysis
 * @param {number|string} lyricId - The ID of the lyric
 * @param {string} language - The language of the analysis
 * @param {Object} data - The data to cache
 */
async function cacheLyricsData(lyricId, language, data) {
  try {
    if (!redisClient) {
      console.warn('Redis client not set for lyricsCache');
      return;
    }

    const cacheKey = `lyrics:data:${lyricId}:${language}`;
    await redisClient.set(cacheKey, JSON.stringify(data), {
      EX: CACHE_EXPIRATION
    });
    
    console.log(`Cached lyrics data for ${lyricId} in ${language}`);
  } catch (error) {
    console.error('Error caching lyrics data:', error);
  }
}

/**
 * Get cached lyrics data
 * @param {number|string} lyricId - The ID of the lyric
 * @param {string} language - The language of the analysis
 * @returns {Promise<Object|null>} - The cached data or null if not found
 */
async function getCachedLyricsData(lyricId, language) {
  try {
    if (!redisClient) {
      console.warn('Redis client not set for lyricsCache');
      return null;
    }

    const cacheKey = `lyrics:data:${lyricId}:${language}`;
    const cachedData = await redisClient.get(cacheKey);
    
    if (cachedData) {
      console.log(`Retrieved cached lyrics data for ${lyricId} in ${language}`);
      return JSON.parse(cachedData);
    }
    
    return null;
  } catch (error) {
    console.error('Error getting cached lyrics data:', error);
    return null;
  }
}

/**
 * Invalidate cached lyrics data
 * @param {number|string} lyricId - The ID of the lyric
 * @param {string} language - The language of the analysis (optional)
 */
async function invalidateLyricsCache(lyricId, language = null) {
  try {
    if (!redisClient) {
      console.warn('Redis client not set for lyricsCache');
      return;
    }

    if (language) {
      // Invalidate specific language
      const cacheKey = `lyrics:data:${lyricId}:${language}`;
      await redisClient.del(cacheKey);
      console.log(`Invalidated lyrics cache for ${lyricId} in ${language}`);
    } else {
      // Invalidate all languages for this lyric
      const pattern = `lyrics:data:${lyricId}:*`;
      const keys = await redisClient.keys(pattern);
      
      if (keys.length > 0) {
        await redisClient.del(keys);
        console.log(`Invalidated all lyrics cache for ${lyricId}`);
      }
    }
  } catch (error) {
    console.error('Error invalidating lyrics cache:', error);
  }
}

module.exports = {
  setRedisClient,
  cacheLyricsData,
  getCachedLyricsData,
  invalidateLyricsCache
}; 