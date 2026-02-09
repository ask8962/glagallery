import { Redis } from "@upstash/redis"
import { APP_CONFIG } from "./config"

// Initialize Redis client
// This will throw an error if environment variables are not set, which is good for debugging
// but we wrap it to ensure build doesn't fail if variables are missing
const getRedisClient = () => {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        return new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
        })
    }
    return null
}

export const redis = getRedisClient()

/**
 * Get data from cache
 * @param key Cache key
 */
export async function getCached<T>(key: string): Promise<T | null> {
    if (!redis) return null

    try {
        return await redis.get<T>(key)
    } catch (error) {
        console.error("Redis get error:", error)
        return null
    }
}

/**
 * Set data in cache
 * @param key Cache key
 * @param data Data to cache
 * @param ttlSeconds Time to live in seconds
 */
export async function setCached<T>(key: string, data: T, ttlSeconds: number = 300): Promise<void> {
    if (!redis) return

    try {
        await redis.set(key, data, { ex: ttlSeconds })
    } catch (error) {
        console.error("Redis set error:", error)
    }
}

/**
 * Delete data from cache
 * @param key Cache key
 */
export async function deleteCached(key: string): Promise<void> {
    if (!redis) return

    try {
        await redis.del(key)
    } catch (error) {
        console.error("Redis delete error:", error)
    }
}
