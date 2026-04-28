import { doc, updateDoc, increment, getDoc, setDoc } from "firebase/firestore"
import { getFirebase } from "./firebase"
import type { Badge, UserProfile } from "./types"

// Points configuration
export const POINTS = {
  UPLOAD_POST: 10,
  RECEIVE_LIKE: 2,
  RECEIVE_COMMENT: 3,
  GIVE_COMMENT: 1,
  DAILY_LOGIN: 5,
  CHALLENGE_COMPLETE: 50,
  FIRST_POST: 20,
  PROFILE_COMPLETE: 10,
  // Confessions
  CONFESSION_POST: 5,
  CONFESSION_UPVOTE_RECEIVED: 1,
  CONFESSION_REPLY: 2,
}

// Level thresholds
export const LEVELS = [
  { level: 1, minPoints: 0, title: "Freshman" },
  { level: 2, minPoints: 50, title: "Sophomore" },
  { level: 3, minPoints: 150, title: "Junior" },
  { level: 4, minPoints: 300, title: "Senior" },
  { level: 5, minPoints: 500, title: "Graduate" },
  { level: 6, minPoints: 750, title: "Alumni" },
  { level: 7, minPoints: 1000, title: "Legend" },
  { level: 8, minPoints: 1500, title: "Hall of Fame" },
]

// Badge definitions
export const BADGES: Record<string, Omit<Badge, "unlockedAt">> = {
  FIRST_UPLOAD: {
    id: "first_upload",
    name: "First Steps",
    description: "Uploaded your first memory",
    icon: "🎯",
  },
  MEMORY_KEEPER: {
    id: "memory_keeper",
    name: "Memory Keeper",
    description: "Uploaded 10 memories",
    icon: "📸",
  },
  SOCIAL_BUTTERFLY: {
    id: "social_butterfly",
    name: "Social Butterfly",
    description: "Received 100 likes",
    icon: "🦋",
  },
  COMMENTATOR: {
    id: "commentator",
    name: "Commentator",
    description: "Made 50 comments",
    icon: "💬",
  },
  POPULAR: {
    id: "popular",
    name: "Popular",
    description: "Got 50 likes on a single post",
    icon: "⭐",
  },
  STREAK_MASTER: {
    id: "streak_master",
    name: "Streak Master",
    description: "7 day login streak",
    icon: "🔥",
  },
  CAMPUS_EXPLORER: {
    id: "campus_explorer",
    name: "Campus Explorer",
    description: "Posted memories from 5 different locations",
    icon: "🗺️",
  },
  EVENT_STAR: {
    id: "event_star",
    name: "Event Star",
    description: "Posted 20 event memories",
    icon: "🎉",
  },
  EARLY_ADOPTER: {
    id: "early_adopter",
    name: "Early Adopter",
    description: "One of the first 100 users",
    icon: "🚀",
  },
  CHALLENGE_CHAMPION: {
    id: "challenge_champion",
    name: "Challenge Champion",
    description: "Completed 5 weekly challenges",
    icon: "🏆",
  },
  // Confession badges
  CAMPUS_VOICE: {
    id: "campus_voice",
    name: "Campus Voice",
    description: "Posted 10 confessions",
    icon: "🗣️",
  },
  TRUTH_TELLER: {
    id: "truth_teller",
    name: "Truth Teller",
    description: "Got 100 upvotes on confessions",
    icon: "💯",
  },
  POLL_MASTER: {
    id: "poll_master",
    name: "Poll Master",
    description: "Created 5 polls",
    icon: "📊",
  },
}

// Get user level from points
export function getUserLevel(points: number): { level: number; title: string; nextLevel?: typeof LEVELS[0] } {
  let currentLevel = LEVELS[0]
  
  for (const level of LEVELS) {
    if (points >= level.minPoints) {
      currentLevel = level
    } else {
      return {
        level: currentLevel.level,
        title: currentLevel.title,
        nextLevel: level,
      }
    }
  }
  
  return {
    level: currentLevel.level,
    title: currentLevel.title,
  }
}

// Award points to user
export async function awardPoints(uid: string, points: number, reason: string) {
  const { db } = getFirebase()
  const userRef = doc(db, "users", uid)
  
  try {
    await updateDoc(userRef, {
      points: increment(points),
      lastActive: new Date(),
    })
    
    // Check for level up
    const userDoc = await getDoc(userRef)
    if (userDoc.exists()) {
      const userData = userDoc.data() as UserProfile
      const newLevel = getUserLevel(userData.points || 0)
      
      if (newLevel.level !== userData.level) {
        await updateDoc(userRef, {
          level: newLevel.level,
        })
        return { levelUp: true, newLevel }
      }
    }
    
    return { levelUp: false }
  } catch (error) {
    console.error("Error awarding points:", error)
    return { levelUp: false }
  }
}

// Unlock badge for user
export async function unlockBadge(uid: string, badgeId: string) {
  const { db } = getFirebase()
  const userRef = doc(db, "users", uid)
  
  try {
    const userDoc = await getDoc(userRef)
    if (!userDoc.exists()) return false
    
    const userData = userDoc.data() as UserProfile
    const existingBadges = userData.badges || []
    
    // Check if badge already unlocked
    if (existingBadges.some(b => b.id === badgeId)) {
      return false
    }
    
    const badge = BADGES[badgeId]
    if (!badge) return false
    
    const newBadge: Badge = {
      ...badge,
      unlockedAt: new Date(),
    }
    
    await updateDoc(userRef, {
      badges: [...existingBadges, newBadge],
    })
    
    return true
  } catch (error) {
    console.error("Error unlocking badge:", error)
    return false
  }
}

// Check and unlock badges based on user stats
export async function checkBadgeUnlocks(uid: string, stats: {
  totalPosts?: number
  totalLikes?: number
  totalComments?: number
  streak?: number
  locations?: number
  eventPosts?: number
  challengesCompleted?: number
}) {
  const unlockedBadges: string[] = []
  
  if (stats.totalPosts === 1) {
    const unlocked = await unlockBadge(uid, "first_upload")
    if (unlocked) unlockedBadges.push("first_upload")
  }
  
  if (stats.totalPosts && stats.totalPosts >= 10) {
    const unlocked = await unlockBadge(uid, "memory_keeper")
    if (unlocked) unlockedBadges.push("memory_keeper")
  }
  
  if (stats.totalLikes && stats.totalLikes >= 100) {
    const unlocked = await unlockBadge(uid, "social_butterfly")
    if (unlocked) unlockedBadges.push("social_butterfly")
  }
  
  if (stats.totalComments && stats.totalComments >= 50) {
    const unlocked = await unlockBadge(uid, "commentator")
    if (unlocked) unlockedBadges.push("commentator")
  }
  
  if (stats.streak && stats.streak >= 7) {
    const unlocked = await unlockBadge(uid, "streak_master")
    if (unlocked) unlockedBadges.push("streak_master")
  }
  
  if (stats.locations && stats.locations >= 5) {
    const unlocked = await unlockBadge(uid, "campus_explorer")
    if (unlocked) unlockedBadges.push("campus_explorer")
  }
  
  if (stats.eventPosts && stats.eventPosts >= 20) {
    const unlocked = await unlockBadge(uid, "event_star")
    if (unlocked) unlockedBadges.push("event_star")
  }
  
  if (stats.challengesCompleted && stats.challengesCompleted >= 5) {
    const unlocked = await unlockBadge(uid, "challenge_champion")
    if (unlocked) unlockedBadges.push("challenge_champion")
  }
  
  return unlockedBadges
}

// Update daily streak
export async function updateStreak(uid: string) {
  const { db } = getFirebase()
  const userRef = doc(db, "users", uid)
  
  try {
    const userDoc = await getDoc(userRef)
    if (!userDoc.exists()) return
    
    const userData = userDoc.data() as UserProfile
    const lastActive = userData.lastActive?.toDate?.() || new Date(0)
    const now = new Date()
    
    const daysDiff = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysDiff === 1) {
      // Continue streak
      const newStreak = (userData.streak || 0) + 1
      await updateDoc(userRef, {
        streak: newStreak,
        lastActive: now,
      })
      
      // Award daily login points
      await awardPoints(uid, POINTS.DAILY_LOGIN, "Daily login")
      
      // Check for streak badge
      if (newStreak >= 7) {
        await unlockBadge(uid, "streak_master")
      }
    } else if (daysDiff > 1) {
      // Streak broken
      await updateDoc(userRef, {
        streak: 1,
        lastActive: now,
      })
      
      await awardPoints(uid, POINTS.DAILY_LOGIN, "Daily login")
    }
    // daysDiff === 0 means same day, do nothing
  } catch (error) {
    console.error("Error updating streak:", error)
  }
}

// Initialize user gamification data
export async function initializeUserGamification(uid: string) {
  const { db } = getFirebase()
  const userRef = doc(db, "users", uid)
  
  try {
    const userDoc = await getDoc(userRef)
    if (!userDoc.exists()) return
    
    const userData = userDoc.data() as UserProfile
    
    // Only initialize if not already set
    if (userData.points === undefined) {
      await updateDoc(userRef, {
        points: 0,
        level: 1,
        badges: [],
        streak: 0,
        lastActive: new Date(),
      })
    }
  } catch (error) {
    console.error("Error initializing gamification:", error)
  }
}
