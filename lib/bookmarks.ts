import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from "firebase/firestore"
import { getFirebase } from "./firebase"

// Toggle bookmark for a post
export async function toggleBookmark(postId: string, userId: string): Promise<boolean> {
  const { db } = getFirebase()
  const postRef = doc(db, "posts", postId)
  
  try {
    const postDoc = await getDoc(postRef)
    if (!postDoc.exists()) return false
    
    const postData = postDoc.data()
    const bookmarkedBy = postData.bookmarkedBy || []
    const isBookmarked = bookmarkedBy.includes(userId)
    
    if (isBookmarked) {
      // Remove bookmark
      await updateDoc(postRef, {
        bookmarkedBy: arrayRemove(userId)
      })
      return false
    } else {
      // Add bookmark
      await updateDoc(postRef, {
        bookmarkedBy: arrayUnion(userId)
      })
      return true
    }
  } catch (error) {
    console.error("Error toggling bookmark:", error)
    throw error
  }
}

// Check if post is bookmarked by user
export function isPostBookmarked(post: any, userId?: string): boolean {
  if (!userId) return false
  const bookmarkedBy = post.bookmarkedBy || []
  return bookmarkedBy.includes(userId)
}

// Get bookmark count for post
export function getBookmarkCount(post: any): number {
  const bookmarkedBy = post.bookmarkedBy || []
  return bookmarkedBy.length
}
