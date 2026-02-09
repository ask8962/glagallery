import { collection, query, orderBy, limit, getDocs, where, Timestamp } from "firebase/firestore"
import { getFirebase } from "./firebase"
import type { Post } from "./types"

// Calculate trending score for a post
export function calculateTrendingScore(post: Post): number {
  const now = Date.now()
  const postTime = post.createdAt?.toDate?.().getTime() || now
  const ageInHours = (now - postTime) / (1000 * 60 * 60)

  // Viral posts get boosted
  const likes = post.likes?.length || 0
  const comments = post.comments?.length || 0
  const bookmarks = post.bookmarkedBy?.length || 0

  // Engagement score (weighted)
  const engagementScore = (likes * 1) + (comments * 2) + (bookmarks * 1.5)

  // Time decay factor (newer posts get higher scores)
  const decayFactor = Math.pow(0.95, ageInHours)

  // Calculate trending score
  const trendingScore = engagementScore * decayFactor

  return Math.round(trendingScore * 100) / 100
}

import { getCached, setCached } from "./redis"

// Get trending posts from last 7 days (with Redis Caching)
export async function getTrendingPosts(limitCount: number = 10): Promise<Post[]> {
  const cacheKey = `trending:posts:${limitCount}`

  // Try to get from cache
  const cached = await getCached<Post[]>(cacheKey)
  if (cached) {
    // Need to convert date strings back to objects if needed, 
    // but for simple display, JSON objects are usually fine.
    // However, if components expect Firestore Timestamps, we might need hydration.
    // For now, returning as is since components should handle standard JSON serializable dates.
    return cached
  }

  const { db } = getFirebase()

  try {
    // Get posts from last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const q = query(
      collection(db, "posts"),
      where("createdAt", ">=", Timestamp.fromDate(sevenDaysAgo)),
      orderBy("createdAt", "desc")
    )

    const snapshot = await getDocs(q)
    const posts: Post[] = []

    snapshot.forEach((doc) => {
      const postData = { id: doc.id, ...(doc.data() as any) }
      // Convert timestamps to serializable format for caching
      if (postData.createdAt?.toDate) {
        postData.createdAt = postData.createdAt.toDate().toISOString()
      }

      const trendingScore = calculateTrendingScore(postData)
      posts.push({ ...postData, trendingScore })
    })

    // Sort by trending score
    posts.sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0))

    const result = posts.slice(0, limitCount)

    // Cache for 10 minutes (600 seconds)
    await setCached(cacheKey, result, 600)

    return result
  } catch (error) {
    console.error("Error fetching trending posts:", error)
    return []
  }
}

// Get trending posts for specific time range
export async function getTrendingByTimeRange(
  range: "today" | "week" | "month",
  limitCount: number = 10
): Promise<Post[]> {
  const { db } = getFirebase()

  try {
    const now = new Date()
    let startDate: Date

    switch (range) {
      case "today":
        startDate = new Date(now.setHours(0, 0, 0, 0))
        break
      case "week":
        startDate = new Date()
        startDate.setDate(startDate.getDate() - 7)
        break
      case "month":
        startDate = new Date()
        startDate.setMonth(startDate.getMonth() - 1)
        break
    }

    const q = query(
      collection(db, "posts"),
      where("createdAt", ">=", Timestamp.fromDate(startDate)),
      orderBy("createdAt", "desc")
    )

    const snapshot = await getDocs(q)
    const posts: Post[] = []

    snapshot.forEach((doc) => {
      const postData = { id: doc.id, ...(doc.data() as any) }
      const trendingScore = calculateTrendingScore(postData)
      posts.push({ ...postData, trendingScore })
    })

    // Sort by trending score
    posts.sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0))

    return posts.slice(0, limitCount)
  } catch (error) {
    console.error("Error fetching trending posts by time range:", error)
    return []
  }
}

// Check if post is trending (top 10%)
export function isPostTrending(post: Post, allPosts: Post[]): boolean {
  if (allPosts.length === 0) return false

  const scores = allPosts.map(p => calculateTrendingScore(p)).sort((a, b) => b - a)
  const threshold = scores[Math.floor(scores.length * 0.1)] || 0
  const postScore = calculateTrendingScore(post)

  return postScore >= threshold
}
