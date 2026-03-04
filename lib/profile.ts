import {
  doc,
  updateDoc,
  getDoc,
  arrayUnion,
  arrayRemove,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  documentId,
} from "firebase/firestore"
import { getFirebase } from "./firebase"
import type { UserProfile, SocialLinks, PrivacySettings, Activity, ActivityType } from "./types"
import { sanitizeText, validateBio, validateSocialURL } from "./validation"

// Update user profile
export async function updateProfile(
  uid: string,
  updates: {
    bio?: string
    socialLinks?: SocialLinks
    photoURL?: string
    name?: string
  },
) {
  const { db } = getFirebase()
  const userRef = doc(db, "users", uid)

  try {
    const sanitizedUpdates: any = {}

    if (updates.bio !== undefined) {
      const bioValidation = validateBio(updates.bio)
      if (!bioValidation.valid) {
        return { success: false, error: bioValidation.error }
      }
      sanitizedUpdates.bio = bioValidation.sanitized
    }

    if (updates.name !== undefined) {
      sanitizedUpdates.name = sanitizeText(updates.name.trim()).slice(0, 100)
    }

    if (updates.photoURL !== undefined) {
      // Validate photo URL
      if (updates.photoURL && !updates.photoURL.startsWith("https://")) {
        return { success: false, error: "Invalid photo URL" }
      }
      sanitizedUpdates.photoURL = updates.photoURL
    }

    if (updates.socialLinks !== undefined) {
      const sanitizedLinks: SocialLinks = {}

      if (updates.socialLinks.instagram) {
        const check = validateSocialURL(updates.socialLinks.instagram, "instagram")
        if (!check.valid) return { success: false, error: check.error }
        if (check.sanitized) sanitizedLinks.instagram = check.sanitized
      }

      if (updates.socialLinks.twitter) {
        const check = validateSocialURL(updates.socialLinks.twitter, "twitter")
        if (!check.valid) return { success: false, error: check.error }
        if (check.sanitized) sanitizedLinks.twitter = check.sanitized
      }

      if (updates.socialLinks.linkedin) {
        const check = validateSocialURL(updates.socialLinks.linkedin, "linkedin")
        if (!check.valid) return { success: false, error: check.error }
        if (check.sanitized) sanitizedLinks.linkedin = check.sanitized
      }

      if (updates.socialLinks.github) {
        const check = validateSocialURL(updates.socialLinks.github, "github")
        if (!check.valid) return { success: false, error: check.error }
        if (check.sanitized) sanitizedLinks.github = check.sanitized
      }

      if (updates.socialLinks.website) {
        const check = validateSocialURL(updates.socialLinks.website, "website")
        if (!check.valid) return { success: false, error: check.error }
        if (check.sanitized) sanitizedLinks.website = check.sanitized
      }

      if (Object.keys(sanitizedLinks).length > 0) {
        sanitizedUpdates.socialLinks = sanitizedLinks
      }
    }

    await updateDoc(userRef, {
      ...sanitizedUpdates,
      updatedAt: Timestamp.now(),
    })
    return { success: true }
  } catch (error) {
    console.error("Error updating profile:", error)
    return { success: false, error }
  }
}

// Update privacy settings
export async function updatePrivacySettings(uid: string, settings: Partial<PrivacySettings>) {
  const { db } = getFirebase()
  const userRef = doc(db, "users", uid)

  try {
    const userDoc = await getDoc(userRef)
    if (!userDoc.exists()) {
      return { success: false, error: "User not found" }
    }

    const currentData = userDoc.data() as UserProfile
    const currentPrivacy = currentData.privacySettings || {
      profileVisibility: "public",
      showEmail: false,
      showActivity: true,
      allowFollowRequests: true,
    }

    await updateDoc(userRef, {
      privacySettings: {
        ...currentPrivacy,
        ...settings,
      },
      updatedAt: Timestamp.now(),
    })

    return { success: true }
  } catch (error) {
    console.error("Error updating privacy settings:", error)
    return { success: false, error }
  }
}

// Follow a user
export async function followUser(currentUserId: string, targetUserId: string) {
  const { db } = getFirebase()

  if (currentUserId === targetUserId) {
    return { success: false, error: "Cannot follow yourself" }
  }

  try {
    const currentUserRef = doc(db, "users", currentUserId)
    const targetUserRef = doc(db, "users", targetUserId)

    // Check if target user exists
    const targetUserDoc = await getDoc(targetUserRef)
    if (!targetUserDoc.exists()) {
      return { success: false, error: "User not found" }
    }

    const targetUserData = targetUserDoc.data() as UserProfile
    const privacySettings = targetUserData.privacySettings || {
      profileVisibility: "public",
      allowFollowRequests: true,
    }

    // Check privacy settings
    if (privacySettings.profileVisibility === "private" && !privacySettings.allowFollowRequests) {
      return { success: false, error: "User has a private profile" }
    }

    // Add to following list
    await updateDoc(currentUserRef, {
      following: arrayUnion(targetUserId),
    })

    // Add to target user's followers list
    await updateDoc(targetUserRef, {
      followers: arrayUnion(currentUserId),
    })

    // Create activity entries
    const currentUserDoc = await getDoc(currentUserRef)
    const currentUserData = currentUserDoc.data() as UserProfile

    await createActivity(currentUserId, {
      type: "followed",
      title: "Started following",
      description: `You started following ${targetUserData.name}`,
      metadata: {
        targetUserId,
        targetUserName: targetUserData.name,
      },
    })

    await createActivity(targetUserId, {
      type: "followed_by",
      title: "New follower",
      description: `${currentUserData.name} started following you`,
      metadata: {
        targetUserId: currentUserId,
        targetUserName: currentUserData.name,
      },
    })

    return { success: true }
  } catch (error) {
    console.error("Error following user:", error)
    return { success: false, error }
  }
}

// Unfollow a user
export async function unfollowUser(currentUserId: string, targetUserId: string) {
  const { db } = getFirebase()

  try {
    const currentUserRef = doc(db, "users", currentUserId)
    const targetUserRef = doc(db, "users", targetUserId)

    // Remove from following list
    await updateDoc(currentUserRef, {
      following: arrayRemove(targetUserId),
    })

    // Remove from target user's followers list
    await updateDoc(targetUserRef, {
      followers: arrayRemove(currentUserId),
    })

    return { success: true }
  } catch (error) {
    console.error("Error unfollowing user:", error)
    return { success: false, error }
  }
}

// Check if user is following another user
export async function isFollowing(currentUserId: string, targetUserId: string): Promise<boolean> {
  const { db } = getFirebase()

  try {
    const userDoc = await getDoc(doc(db, "users", currentUserId))
    if (!userDoc.exists()) return false

    const userData = userDoc.data() as UserProfile
    return (userData.following || []).includes(targetUserId)
  } catch (error) {
    console.error("Error checking follow status:", error)
    return false
  }
}

// Get user profile (with privacy checks)
export async function getUserProfile(currentUserId: string | null, targetUserId: string): Promise<UserProfile | null> {
  const { db } = getFirebase()

  try {
    const targetUserRef = doc(db, "users", targetUserId)
    const targetUserDoc = await getDoc(targetUserRef)

    if (!targetUserDoc.exists()) {
      return null
    }

    const targetUserData = targetUserDoc.data() as UserProfile
    const privacySettings = targetUserData.privacySettings || {
      profileVisibility: "public",
      showEmail: false,
      showActivity: true,
    }

    // If viewing own profile, return all data
    if (currentUserId === targetUserId) {
      return targetUserData
    }

    // Check privacy settings
    if (privacySettings.profileVisibility === "private") {
      const isFollowingUser = currentUserId ? await isFollowing(currentUserId, targetUserId) : false
      if (!isFollowingUser) {
        // Return limited profile for private accounts
        return {
          ...targetUserData,
          email: privacySettings.showEmail ? targetUserData.email : "",
        }
      }
    }

    // Hide email if privacy setting says so
    if (!privacySettings.showEmail) {
      return {
        ...targetUserData,
        email: "",
      }
    }

    return targetUserData
  } catch (error) {
    console.error("Error getting user profile:", error)
    return null
  }
}

// Create activity entry
export async function createActivity(
  userId: string,
  activity: {
    type: ActivityType
    title: string
    description: string
    icon?: string
    link?: string
    metadata?: Activity["metadata"]
  },
) {
  const { db } = getFirebase()

  try {
    await addDoc(collection(db, "activities"), {
      userId,
      type: activity.type,
      title: activity.title,
      description: activity.description,
      icon: activity.icon,
      link: activity.link,
      metadata: activity.metadata || {},
      createdAt: Timestamp.now(),
    })
    return { success: true }
  } catch (error) {
    console.error("Error creating activity:", error)
    return { success: false, error }
  }
}

// Get user activity feed
export async function getUserActivityFeed(userId: string, limitCount = 20): Promise<Activity[]> {
  const { db } = getFirebase()

  try {
    const activitiesRef = collection(db, "activities")
    const q = query(activitiesRef, where("userId", "==", userId), orderBy("createdAt", "desc"), limit(limitCount))

    const snapshot = await getDocs(q)
    const activities: Activity[] = []

    snapshot.forEach((doc) => {
      activities.push({
        id: doc.id,
        ...(doc.data() as Omit<Activity, "id">),
      })
    })

    return activities
  } catch (error) {
    console.error("Error getting activity feed:", error)
    return []
  }
}

// Get user statistics
export async function getUserStatistics(userId: string) {
  const { db } = getFirebase()

  try {
    const userDoc = await getDoc(doc(db, "users", userId))
    if (!userDoc.exists()) {
      return null
    }

    const userData = userDoc.data() as UserProfile

    return {
      posts: 0,
      likes: 0,
      comments: 0,
      followers: (userData.followers || []).length,
      following: (userData.following || []).length,
      badges: (userData.badges || []).length,
      points: userData.points || 0,
      level: userData.level || 1,
      streak: userData.streak || 0,
    }
  } catch (error) {
    console.error("Error getting user statistics:", error)
    return null
  }
}

// Get followers list (batched query to avoid N+1)
export async function getFollowers(userId: string): Promise<UserProfile[]> {
  const { db } = getFirebase()

  try {
    const userDoc = await getDoc(doc(db, "users", userId))
    if (!userDoc.exists()) {
      return []
    }

    const userData = userDoc.data() as UserProfile
    const followers = userData.followers || []

    if (followers.length === 0) {
      return []
    }

    // Batch fetch using 'in' query (max 30 IDs per query)
    const followerProfiles: UserProfile[] = []
    const BATCH_SIZE = 30

    for (let i = 0; i < followers.length; i += BATCH_SIZE) {
      const batch = followers.slice(i, i + BATCH_SIZE)
      const q = query(
        collection(db, "users"),
        where(documentId(), "in", batch)
      )
      const snapshot = await getDocs(q)
      snapshot.forEach((doc) => {
        followerProfiles.push(doc.data() as UserProfile)
      })
    }

    return followerProfiles
  } catch (error) {
    console.error("Error getting followers:", error)
    return []
  }
}

// Get following list (batched query to avoid N+1)
export async function getFollowing(userId: string): Promise<UserProfile[]> {
  const { db } = getFirebase()

  try {
    const userDoc = await getDoc(doc(db, "users", userId))
    if (!userDoc.exists()) {
      return []
    }

    const userData = userDoc.data() as UserProfile
    const following = userData.following || []

    if (following.length === 0) {
      return []
    }

    // Batch fetch using 'in' query (max 30 IDs per query)
    const followingProfiles: UserProfile[] = []
    const BATCH_SIZE = 30

    for (let i = 0; i < following.length; i += BATCH_SIZE) {
      const batch = following.slice(i, i + BATCH_SIZE)
      const q = query(
        collection(db, "users"),
        where(documentId(), "in", batch)
      )
      const snapshot = await getDocs(q)
      snapshot.forEach((doc) => {
        followingProfiles.push(doc.data() as UserProfile)
      })
    }

    return followingProfiles
  } catch (error) {
    console.error("Error getting following:", error)
    return []
  }
}
