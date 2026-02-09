import { getFirebase } from "./firebase"
import { doc, setDoc, serverTimestamp, onSnapshot, getDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"

// Presence system for tracking online/offline status
// Uses window events and heartbeat to track online/offline status

const PRESENCE_COLLECTION = "presence"
const HEARTBEAT_INTERVAL = 30000 // 30 seconds
const OFFLINE_TIMEOUT = 60000 // 60 seconds - if no heartbeat, consider offline

let heartbeatInterval: NodeJS.Timeout | null = null
let currentUserId: string | null = null
let lastHeartbeat: number = 0
let visibilityChangeHandler: (() => void) | null = null
let beforeUnloadHandler: (() => void) | null = null

/**
 * Initialize presence system for the current user
 * Call this when user signs in
 */
export function initializePresence(userId: string) {
  const { db, auth } = getFirebase()
  const presenceRef = doc(db, PRESENCE_COLLECTION, userId)
  
  currentUserId = userId
  lastHeartbeat = Date.now()
  
  // Set user as online initially
  setDoc(presenceRef, {
    status: "online",
    lastSeen: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true }).catch((error) => {
    console.error("Failed to initialize presence:", error)
  })
  
  // Heartbeat to keep user online while active
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval)
  }
  
  heartbeatInterval = setInterval(() => {
    if (currentUserId === userId) {
      lastHeartbeat = Date.now()
      setDoc(presenceRef, {
        status: "online",
        lastSeen: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true }).catch((error) => {
        console.error("Failed to update presence:", error)
      })
    }
  }, HEARTBEAT_INTERVAL)
  
  // Handle visibility change (tab switch, minimize, etc.)
  visibilityChangeHandler = () => {
    if (document.hidden) {
      // Tab is hidden, but user is still online
      // We'll keep them online but could set to "away" if needed
    } else {
      // Tab is visible again, update presence
      if (currentUserId === userId) {
        setDoc(presenceRef, {
          status: "online",
          lastSeen: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true }).catch(console.error)
      }
    }
  }
  
  document.addEventListener("visibilitychange", visibilityChangeHandler)
  
  // Handle page unload (browser close, navigation away)
  beforeUnloadHandler = () => {
    // Set offline status when leaving
    setDoc(presenceRef, {
      status: "offline",
      lastSeen: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true }).catch(() => {
      // Ignore errors on unload - network may be unavailable
    })
  }
  
  window.addEventListener("beforeunload", beforeUnloadHandler)
  
  // Clean up on auth state change
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (!user || user.uid !== userId) {
      cleanupPresence()
      unsubscribe()
    }
  })
}

/**
 * Clean up presence system
 * Call this when user signs out
 */
export function cleanupPresence() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval)
    heartbeatInterval = null
  }
  
  // Remove event listeners
  if (visibilityChangeHandler) {
    document.removeEventListener("visibilitychange", visibilityChangeHandler)
    visibilityChangeHandler = null
  }
  
  if (beforeUnloadHandler) {
    window.removeEventListener("beforeunload", beforeUnloadHandler)
    beforeUnloadHandler = null
  }
  
  if (currentUserId) {
    const { db } = getFirebase()
    const presenceRef = doc(db, PRESENCE_COLLECTION, currentUserId)
    
    setDoc(presenceRef, {
      status: "offline",
      lastSeen: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true }).catch((error) => {
      console.error("Failed to set offline status:", error)
    })
    
    currentUserId = null
    lastHeartbeat = 0
  }
}

/**
 * Get user's online status
 */
export async function getUserPresence(userId: string): Promise<"online" | "offline" | "away" | null> {
  const { db } = getFirebase()
  const presenceRef = doc(db, PRESENCE_COLLECTION, userId)
  
  try {
    const snapshot = await getDoc(presenceRef)
    if (snapshot.exists()) {
      const data = snapshot.data()
      return data.status || "offline"
    }
    return null
  } catch (error) {
    console.error("Error getting user presence:", error)
    return null
  }
}

/**
 * Subscribe to user's presence status (real-time)
 */
export function subscribeToUserPresence(
  userId: string,
  callback: (status: "online" | "offline" | "away" | null) => void
): () => void {
  const { db } = getFirebase()
  const presenceRef = doc(db, PRESENCE_COLLECTION, userId)
  
  return onSnapshot(
    presenceRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data()
        callback(data.status || "offline")
      } else {
        callback(null)
      }
    },
    (error) => {
      console.error("Error subscribing to presence:", error)
      callback(null)
    }
  )
}

/**
 * Subscribe to multiple users' presence (for team members, etc.)
 */
export function subscribeToUsersPresence(
  userIds: string[],
  callback: (presences: Record<string, "online" | "offline" | "away" | null>) => void
): () => void {
  if (userIds.length === 0) {
    callback({})
    return () => {}
  }
  
  const { db } = getFirebase()
  const unsubscribes: (() => void)[] = []
  const presences: Record<string, "online" | "offline" | "away" | null> = {}
  
  userIds.forEach((userId) => {
    const presenceRef = doc(db, PRESENCE_COLLECTION, userId)
    const unsubscribe = onSnapshot(
      presenceRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data()
          presences[userId] = data.status || "offline"
        } else {
          presences[userId] = null
        }
        callback({ ...presences })
      },
      (error) => {
        console.error(`Error subscribing to presence for ${userId}:`, error)
        presences[userId] = null
        callback({ ...presences })
      }
    )
    unsubscribes.push(unsubscribe)
  })
  
  return () => {
    unsubscribes.forEach((unsub) => unsub())
  }
}

/**
 * Set user status (online, away, offline)
 */
export async function setUserStatus(status: "online" | "away" | "offline") {
  if (!currentUserId) return
  
  const { db } = getFirebase()
  const presenceRef = doc(db, PRESENCE_COLLECTION, currentUserId)
  
  await setDoc(presenceRef, {
    status,
    lastSeen: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true })
}
