import Redis from 'ioredis'

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

let redisClient: Redis

if (process.env.NODE_ENV === 'production') {
  redisClient = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 3) {
        console.warn('Redis: Max retries reached, proceeding without Redis cache.')
        return null 
      }
      return Math.min(times * 100, 1000)
    }
  })
} else {
  if (!globalForRedis.redis) {
    globalForRedis.redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        if (times > 3) {
          console.warn('Redis: Max retries reached, proceeding without Redis cache.')
          return null
        }
        return Math.min(times * 100, 1000)
      }
    })
  }
  redisClient = globalForRedis.redis
}

// Register error listener to prevent app crashes if connection is lost
redisClient.on('error', (err) => {
  console.warn('Redis connection issue:', err.message)
})

export const redis = redisClient

// Helper function to handle cache wrappers
export async function getCachedData<T>(key: string, fetchFn: () => Promise<T>, expireSeconds = 60): Promise<T> {
  try {
    if (redis.status === 'ready') {
      const cached = await redis.get(key)
      if (cached) {
        return JSON.parse(cached) as T
      }
    }
  } catch (err) {
    console.warn('[Redis Cache Get Error]:', err)
  }

  const data = await fetchFn()

  try {
    if (redis.status === 'ready' && data !== null && data !== undefined) {
      await redis.set(key, JSON.stringify(data), 'EX', expireSeconds)
    }
  } catch (err) {
    console.warn('[Redis Cache Set Error]:', err)
  }

  return data
}

export async function invalidateCache(key: string): Promise<void> {
  try {
    if (redis.status === 'ready') {
      await redis.del(key)
    }
  } catch (err) {
    console.warn('[Redis Cache Invalidation Error]:', err)
  }
}
