/**
 * Advanced Search Utilities
 * 
 * Enhanced search functionality with filters, autocomplete, and search history.
 * Uses Firestore queries for efficient searching.
 */

import { getFirebase } from "./firebase"
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  startAfter,
  type QueryDocumentSnapshot,
} from "firebase/firestore"
import type { Post, UserProfile } from "./types"

export interface SearchFilters {
  query?: string
  tags?: string[]
  hashtags?: string[]
  mediaType?: "image" | "video" | "all"
  userId?: string
  dateFrom?: Date
  dateTo?: Date
  sortBy?: "newest" | "oldest" | "popular"
}

export interface SearchResult {
  posts: Post[]
  totalCount: number
  hasMore: boolean
  lastDoc?: QueryDocumentSnapshot
}

/**
 * Search posts with advanced filters
 */
export async function searchPosts(
  filters: SearchFilters,
  pageSize: number = 12,
  lastDoc?: QueryDocumentSnapshot
): Promise<SearchResult> {
  const { db } = getFirebase()
  const postsRef = collection(db, "posts")

  try {
    // Build query constraints
    const constraints: any[] = []

    // Filter by tags
    if (filters.tags && filters.tags.length > 0) {
      constraints.push(where("tags", "array-contains-any", filters.tags))
    }

    // Filter by hashtags
    if (filters.hashtags && filters.hashtags.length > 0) {
      constraints.push(where("hashtags", "array-contains-any", filters.hashtags))
    }

    // Filter by media type
    if (filters.mediaType && filters.mediaType !== "all") {
      constraints.push(where("mediaType", "==", filters.mediaType))
    }

    // Filter by user
    if (filters.userId) {
      constraints.push(where("uploaderUid", "==", filters.userId))
    }

    // Filter by date range
    if (filters.dateFrom) {
      constraints.push(where("createdAt", ">=", Timestamp.fromDate(filters.dateFrom)))
    }
    if (filters.dateTo) {
      constraints.push(where("createdAt", "<=", Timestamp.fromDate(filters.dateTo)))
    }

    // Sort order
    const sortField = filters.sortBy === "popular" ? "trendingScore" : "createdAt"
    const sortOrder = filters.sortBy === "oldest" ? "asc" : "desc"
    constraints.push(orderBy(sortField, sortOrder))

    // Limit
    constraints.push(limit(pageSize))

    // Start after last document for pagination
    if (lastDoc) {
      constraints.push(startAfter(lastDoc))
    }

    // Build and execute query
    const q = query(postsRef, ...constraints)
    const snapshot = await getDocs(q)

    const posts: Post[] = []
    snapshot.forEach((doc) => {
      posts.push({ id: doc.id, ...(doc.data() as any) })
    })

    // Client-side text search if query provided
    let filteredPosts = posts
    if (filters.query && filters.query.trim()) {
      const searchTerm = filters.query.toLowerCase().trim()
      filteredPosts = posts.filter((post) => {
        const title = post.title?.toLowerCase() || ""
        const description = post.description?.toLowerCase() || ""
        const uploaderName = post.uploaderName?.toLowerCase() || ""
        const tags = post.tags?.join(" ").toLowerCase() || ""
        const hashtags = post.hashtags?.join(" ").toLowerCase() || ""

        return (
          title.includes(searchTerm) ||
          description.includes(searchTerm) ||
          uploaderName.includes(searchTerm) ||
          tags.includes(searchTerm) ||
          hashtags.includes(searchTerm)
        )
      })
    }

    return {
      posts: filteredPosts,
      totalCount: filteredPosts.length,
      hasMore: snapshot.size === pageSize,
      lastDoc: snapshot.docs[snapshot.docs.length - 1],
    }
  } catch (error) {
    console.error("Error searching posts:", error)
    return {
      posts: [],
      totalCount: 0,
      hasMore: false,
    }
  }
}

/**
 * Get hashtag suggestions for autocomplete
 */
export async function getHashtagSuggestions(
  searchTerm: string,
  limitCount: number = 10
): Promise<string[]> {
  const { db } = getFirebase()

  try {
    const hashtagsRef = collection(db, "trending_hashtags")
    const q = query(
      hashtagsRef,
      orderBy("count", "desc"),
      limit(50) // Get more to filter client-side
    )

    const snapshot = await getDocs(q)
    const hashtags: string[] = []
    const term = searchTerm.toLowerCase().replace("#", "")

    snapshot.forEach((doc) => {
      const data = doc.data()
      const tag = data.tag?.toLowerCase() || ""
      if (tag.includes(term)) {
        hashtags.push(data.tag)
      }
    })

    return hashtags.slice(0, limitCount)
  } catch (error) {
    console.error("Error getting hashtag suggestions:", error)
    return []
  }
}

/**
 * Get user suggestions for autocomplete
 */
export async function getUserSuggestions(
  searchTerm: string,
  limitCount: number = 10
): Promise<UserProfile[]> {
  const { db } = getFirebase()

  try {
    const usersRef = collection(db, "users")
    const q = query(usersRef, limit(100)) // Get more to filter client-side

    const snapshot = await getDocs(q)
    const users: UserProfile[] = []
    const term = searchTerm.toLowerCase()

    snapshot.forEach((doc) => {
      const userData = doc.data() as UserProfile
      const name = userData.name?.toLowerCase() || ""
      const email = userData.email?.toLowerCase() || ""

      if (name.includes(term) || email.includes(term)) {
        users.push({ ...userData, uid: doc.id })
      }
    })

    return users.slice(0, limitCount)
  } catch (error) {
    console.error("Error getting user suggestions:", error)
    return []
  }
}

/**
 * Search clubs by name or category
 */
export interface ClubSearchFilters {
  query?: string
  category?: string
}

export interface ClubSearchResult {
  id: string
  name: string
  description: string
  category: string
  logoURL?: string
  memberCount: number
}

export async function searchClubs(
  filters: ClubSearchFilters,
  limitCount: number = 20
): Promise<ClubSearchResult[]> {
  const { db } = getFirebase()

  try {
    const clubsRef = collection(db, "clubs")
    const constraints: any[] = []

    if (filters.category) {
      constraints.push(where("category", "==", filters.category))
    }

    constraints.push(where("status", "==", "active"))
    constraints.push(limit(100)) // Get more to filter client-side

    const q = query(clubsRef, ...constraints)
    const snapshot = await getDocs(q)

    const clubs: ClubSearchResult[] = []
    const searchTerm = filters.query?.toLowerCase().trim() || ""

    snapshot.forEach((doc) => {
      const data = doc.data()
      const name = data.name?.toLowerCase() || ""
      const description = data.description?.toLowerCase() || ""

      // Client-side text search
      if (!searchTerm || name.includes(searchTerm) || description.includes(searchTerm)) {
        clubs.push({
          id: doc.id,
          name: data.name,
          description: data.description,
          category: data.category,
          logoURL: data.logoURL,
          memberCount: data.members?.length || 0,
        })
      }
    })

    return clubs.slice(0, limitCount)
  } catch (error) {
    console.error("Error searching clubs:", error)
    return []
  }
}

/**
 * Search events by title or category
 */
export interface EventSearchFilters {
  query?: string
  category?: string
  upcoming?: boolean
}

export interface EventSearchResult {
  id: string
  title: string
  shortDescription: string
  category: string
  bannerURL?: string
  startDate: string | null
  hostedByClubName?: string
}

export async function searchEvents(
  filters: EventSearchFilters,
  limitCount: number = 20
): Promise<EventSearchResult[]> {
  const { db } = getFirebase()

  try {
    const eventsRef = collection(db, "events")
    const constraints: any[] = []

    if (filters.category) {
      constraints.push(where("category", "==", filters.category))
    }

    constraints.push(where("status", "==", "published"))

    if (filters.upcoming) {
      constraints.push(where("startDate", ">=", Timestamp.now()))
    }

    constraints.push(orderBy("startDate", "desc"))
    constraints.push(limit(100)) // Get more to filter client-side

    const q = query(eventsRef, ...constraints)
    const snapshot = await getDocs(q)

    const events: EventSearchResult[] = []
    const searchTerm = filters.query?.toLowerCase().trim() || ""

    snapshot.forEach((doc) => {
      const data = doc.data()
      const title = data.title?.toLowerCase() || ""
      const description = data.shortDescription?.toLowerCase() || ""

      // Client-side text search
      if (!searchTerm || title.includes(searchTerm) || description.includes(searchTerm)) {
        events.push({
          id: doc.id,
          title: data.title,
          shortDescription: data.shortDescription,
          category: data.category,
          bannerURL: data.bannerURL,
          startDate: data.startDate?.toDate?.()?.toISOString() || null,
          hostedByClubName: data.hostedByClubName,
        })
      }
    })

    return events.slice(0, limitCount)
  } catch (error) {
    console.error("Error searching events:", error)
    return []
  }
}

/**
 * Search history management
 */
const SEARCH_HISTORY_KEY = "gla_gallery_search_history"
const MAX_HISTORY_ITEMS = 10

export interface SearchHistoryItem {
  query: string
  timestamp: number
  filters?: SearchFilters
}

/**
 * Get search history
 */
export function getSearchHistory(): SearchHistoryItem[] {
  if (typeof window === "undefined") return []

  try {
    const history = localStorage.getItem(SEARCH_HISTORY_KEY)
    if (!history) return []

    const items: SearchHistoryItem[] = JSON.parse(history)
    // Sort by timestamp (newest first) and limit
    return items.sort((a, b) => b.timestamp - a.timestamp).slice(0, MAX_HISTORY_ITEMS)
  } catch {
    return []
  }
}

/**
 * Add to search history
 */
export function addToSearchHistory(query: string, filters?: SearchFilters) {
  if (typeof window === "undefined" || !query.trim()) return

  try {
    const history = getSearchHistory()

    // Remove duplicate
    const filtered = history.filter((item) => item.query !== query)

    // Add new item
    const newItem: SearchHistoryItem = {
      query: query.trim(),
      timestamp: Date.now(),
      filters,
    }

    const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS)
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated))
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Clear search history
 */
export function clearSearchHistory() {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY)
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Track popular searches (for analytics)
 */
const POPULAR_SEARCHES_KEY = "gla_gallery_popular_searches"

export interface PopularSearch {
  query: string
  count: number
  lastSearched: number
}

/**
 * Track a search query
 */
export function trackSearch(query: string) {
  if (typeof window === "undefined" || !query.trim()) return

  try {
    const popular = localStorage.getItem(POPULAR_SEARCHES_KEY)
    const searches: Record<string, PopularSearch> = popular ? JSON.parse(popular) : {}

    const key = query.trim().toLowerCase()
    if (searches[key]) {
      searches[key].count++
      searches[key].lastSearched = Date.now()
    } else {
      searches[key] = {
        query: query.trim(),
        count: 1,
        lastSearched: Date.now(),
      }
    }

    localStorage.setItem(POPULAR_SEARCHES_KEY, JSON.stringify(searches))
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Get popular searches
 */
export function getPopularSearches(limitCount: number = 10): PopularSearch[] {
  if (typeof window === "undefined") return []

  try {
    const popular = localStorage.getItem(POPULAR_SEARCHES_KEY)
    if (!popular) return []

    const searches: Record<string, PopularSearch> = JSON.parse(popular)
    const items = Object.values(searches)

    // Sort by count (descending) and limit
    return items.sort((a, b) => b.count - a.count).slice(0, limitCount)
  } catch {
    return []
  }
}
