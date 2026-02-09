import { collection, query, where, getDocs, Timestamp } from "firebase/firestore"
import { getFirebase } from "./firebase"
import type { Post } from "./types"

// Get posts from this day in previous years
export async function getMemoriesFromThisDay(years: number = 5): Promise<Post[]> {
  const { db } = getFirebase()
  
  try {
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentDay = today.getDate()
    
    const memories: Post[] = []
    
    // Check each year going back
    for (let i = 1; i <= years; i++) {
      const yearAgo = new Date(today)
      yearAgo.setFullYear(today.getFullYear() - i)
      
      // Get start and end of that day
      const startOfDay = new Date(yearAgo.setHours(0, 0, 0, 0))
      const endOfDay = new Date(yearAgo.setHours(23, 59, 59, 999))
      
      const q = query(
        collection(db, "posts"),
        where("createdAt", ">=", Timestamp.fromDate(startOfDay)),
        where("createdAt", "<=", Timestamp.fromDate(endOfDay))
      )
      
      const snapshot = await getDocs(q)
      snapshot.forEach((doc) => {
        memories.push({ id: doc.id, ...(doc.data() as any) })
      })
    }
    
    // Sort by most recent first
    memories.sort((a, b) => {
      const aDate = a.createdAt?.toDate?.() || new Date(0)
      const bDate = b.createdAt?.toDate?.() || new Date(0)
      return bDate.getTime() - aDate.getTime()
    })
    
    return memories
  } catch (error) {
    console.error("Error fetching memories from this day:", error)
    return []
  }
}

// Get formatted date for display
export function getTimelineDate(post: Post): string {
  const date = post.createdAt?.toDate?.() || new Date()
  const now = new Date()
  const yearsAgo = now.getFullYear() - date.getFullYear()
  
  if (yearsAgo === 1) {
    return "1 year ago"
  } else if (yearsAgo > 1) {
    return `${yearsAgo} years ago`
  }
  
  return "Today"
}

// Get posts from specific date range
export async function getMemoriesFromDateRange(
  startDate: Date,
  endDate: Date
): Promise<Post[]> {
  const { db } = getFirebase()
  
  try {
    const q = query(
      collection(db, "posts"),
      where("createdAt", ">=", Timestamp.fromDate(startDate)),
      where("createdAt", "<=", Timestamp.fromDate(endDate))
    )
    
    const snapshot = await getDocs(q)
    const posts: Post[] = []
    
    snapshot.forEach((doc) => {
      posts.push({ id: doc.id, ...(doc.data() as any) })
    })
    
    return posts
  } catch (error) {
    console.error("Error fetching memories from date range:", error)
    return []
  }
}

// Check if there are memories for today
export async function hasMemoriesForToday(): Promise<boolean> {
  const memories = await getMemoriesFromThisDay(5)
  return memories.length > 0
}
