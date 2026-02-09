/**
 * Real-time Updates Optimization
 * 
 * Utilities for optimizing Firestore listeners and reducing unnecessary reads.
 */

import { getFirebase } from "./firebase"
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  type Query,
  type Unsubscribe,
} from "firebase/firestore"

/**
 * Optimized listener with automatic cleanup and error handling
 */
export function createOptimizedListener<T>(
  query: Query,
  onUpdate: (data: T[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    query,
    (snapshot) => {
      const data: T[] = []
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...(doc.data() as any) } as T)
      })
      onUpdate(data)
    },
    (error) => {
      console.error("Listener error:", error)
      if (onError) {
        onError(error instanceof Error ? error : new Error(String(error)))
      }
    }
  )
}

/**
 * Debounced listener - only updates after a delay
 */
export function createDebouncedListener<T>(
  query: Query,
  onUpdate: (data: T[]) => void,
  delay: number = 500
): Unsubscribe {
  let timeoutId: NodeJS.Timeout | null = null
  let lastData: T[] = []

  return onSnapshot(
    query,
    (snapshot) => {
      const data: T[] = []
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...(doc.data() as any) } as T)
      })

      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      timeoutId = setTimeout(() => {
        // Only update if data actually changed
        if (JSON.stringify(data) !== JSON.stringify(lastData)) {
          lastData = data
          onUpdate(data)
        }
      }, delay)
    }
  )
}

/**
 * Paginated listener - loads data in chunks
 */
export function createPaginatedListener<T>(
  baseQuery: Query,
  pageSize: number = 20,
  onUpdate: (data: T[], hasMore: boolean) => void,
  onError?: (error: Error) => void
): {
  unsubscribe: Unsubscribe
  loadMore: () => void
} {
  let currentLimit = pageSize
  let unsubscribe: Unsubscribe | null = null

  const setupListener = () => {
    if (unsubscribe) {
      unsubscribe()
    }

    const q = query(baseQuery, limit(currentLimit))
    unsubscribe = createOptimizedListener<T>(
      q,
      (data) => {
        onUpdate(data, data.length === currentLimit)
      },
      onError
    )
  }

  setupListener()

  return {
    unsubscribe: () => {
      if (unsubscribe) {
        unsubscribe()
      }
    },
    loadMore: () => {
      currentLimit += pageSize
      setupListener()
    },
  }
}

/**
 * Conditional listener - only listens when condition is met
 */
export function createConditionalListener<T>(
  condition: () => boolean,
  queryFactory: () => Query | null,
  onUpdate: (data: T[]) => void,
  onError?: (error: Error) => void
): {
  unsubscribe: () => void
  check: () => void
} {
  let unsubscribe: Unsubscribe | null = null

  const check = () => {
    if (!condition()) {
      if (unsubscribe) {
        unsubscribe()
        unsubscribe = null
      }
      return
    }

    if (unsubscribe) {
      return // Already listening
    }

    const q = queryFactory()
    if (!q) {
      return
    }

    unsubscribe = createOptimizedListener<T>(q, onUpdate, onError)
  }

  // Initial check
  check()

  return {
    unsubscribe: () => {
      if (unsubscribe) {
        unsubscribe()
        unsubscribe = null
      }
    },
    check,
  }
}

/**
 * Batch multiple queries into a single update
 */
export function createBatchedListener<T>(
  queries: Query[],
  onUpdate: (results: T[][]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const results: T[][] = Array(queries.length).fill([])
  const unsubscribes: Unsubscribe[] = []
  let updateCount = 0

  queries.forEach((q, index) => {
    const unsubscribe = createOptimizedListener<T>(
      q,
      (data) => {
        results[index] = data
        updateCount++
        if (updateCount === queries.length) {
          onUpdate([...results])
          updateCount = 0
        }
      },
      onError
    )
    unsubscribes.push(unsubscribe)
  })

  return () => {
    unsubscribes.forEach((unsub) => unsub())
  }
}

/**
 * Cache listener results to reduce reads
 */
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 30 * 1000 // 30 seconds

export function createCachedListener<T>(
  cacheKey: string,
  query: Query,
  onUpdate: (data: T[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  // Check cache first
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    onUpdate(cached.data)
  }

  const unsubscribe = createOptimizedListener<T>(
    query,
    (data) => {
      cache.set(cacheKey, { data, timestamp: Date.now() })
      onUpdate(data)
    },
    onError
  )

  return unsubscribe
}

/**
 * Clean up old cache entries
 */
export function cleanupCache() {
  const now = Date.now()
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      cache.delete(key)
    }
  }
}

// Cleanup cache every minute
if (typeof window !== "undefined") {
  setInterval(cleanupCache, 60 * 1000)
}
