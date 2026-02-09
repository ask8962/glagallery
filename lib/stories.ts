import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    getDocs,
    getDoc,
    Timestamp,
    arrayUnion,
} from "firebase/firestore"
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"
import { getFirebase } from "./firebase"

// Story type definition
export type Story = {
    id: string
    userId: string
    userName: string
    userPhotoURL?: string
    mediaURL: string
    mediaType: "image" | "video"
    caption?: string
    createdAt: Timestamp
    expiresAt: Timestamp
    viewers: string[]
}

// Story expiry duration (24 hours in milliseconds)
const STORY_DURATION_MS = 24 * 60 * 60 * 1000

/**
 * Create a new story
 */
export async function createStory(
    file: File,
    userId: string,
    userName: string,
    userPhotoURL?: string,
    caption?: string
): Promise<string> {
    const { db, storage } = getFirebase()

    // Upload media to Firebase Storage
    const path = `stories/${userId}/${Date.now()}-${file.name}`
    const storageRef = ref(storage, path)

    await uploadBytesResumable(storageRef, file)
    const mediaURL = await getDownloadURL(storageRef)

    const mediaType = file.type.startsWith("video") ? "video" : "image"
    const now = Timestamp.now()
    const expiresAt = Timestamp.fromMillis(now.toMillis() + STORY_DURATION_MS)

    const storyData = {
        userId,
        userName,
        userPhotoURL: userPhotoURL || null,
        mediaURL,
        mediaType,
        caption: caption || null,
        createdAt: now,
        expiresAt,
        viewers: [],
    }

    const docRef = await addDoc(collection(db, "stories"), storyData)
    return docRef.id
}

/**
 * Get all active (non-expired) stories
 * Returns stories grouped by user
 */
export async function getActiveStories(): Promise<Map<string, Story[]>> {
    const { db } = getFirebase()
    const now = Timestamp.now()

    const storiesRef = collection(db, "stories")
    const q = query(
        storiesRef,
        where("expiresAt", ">", now),
        orderBy("expiresAt", "asc"),
        orderBy("createdAt", "desc")
    )

    const snapshot = await getDocs(q)

    // Group stories by user
    const storiesByUser = new Map<string, Story[]>()

    snapshot.docs.forEach((doc) => {
        const story = { id: doc.id, ...doc.data() } as Story
        const existing = storiesByUser.get(story.userId) || []
        existing.push(story)
        storiesByUser.set(story.userId, existing)
    })

    return storiesByUser
}

/**
 * Get stories for a specific user
 */
export async function getUserStories(userId: string): Promise<Story[]> {
    const { db } = getFirebase()
    const now = Timestamp.now()

    const storiesRef = collection(db, "stories")
    const q = query(
        storiesRef,
        where("userId", "==", userId),
        where("expiresAt", ">", now),
        orderBy("expiresAt", "asc"),
        orderBy("createdAt", "desc")
    )

    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Story))
}

/**
 * Mark a story as viewed by a user
 */
export async function markStoryViewed(
    storyId: string,
    viewerId: string
): Promise<void> {
    const { db } = getFirebase()
    const storyRef = doc(db, "stories", storyId)

    await updateDoc(storyRef, {
        viewers: arrayUnion(viewerId),
    })
}

/**
 * Delete a story (owner only)
 */
export async function deleteStory(storyId: string): Promise<void> {
    const { db } = getFirebase()
    const storyRef = doc(db, "stories", storyId)
    await deleteDoc(storyRef)
}

/**
 * Get a single story by ID
 */
export async function getStory(storyId: string): Promise<Story | null> {
    const { db } = getFirebase()
    const storyRef = doc(db, "stories", storyId)
    const storyDoc = await getDoc(storyRef)

    if (!storyDoc.exists()) return null
    return { id: storyDoc.id, ...storyDoc.data() } as Story
}

/**
 * Check if a user has active stories
 */
export async function hasActiveStories(userId: string): Promise<boolean> {
    const stories = await getUserStories(userId)
    return stories.length > 0
}

/**
 * Check if current user has viewed a story
 */
export function hasViewedStory(story: Story, viewerId: string): boolean {
    return story.viewers.includes(viewerId)
}

/**
 * Get view count for a story
 */
export function getViewCount(story: Story): number {
    return story.viewers.length
}

/**
 * Calculate time remaining for a story
 */
export function getTimeRemaining(story: Story): string {
    const now = Date.now()
    const expiresAt = story.expiresAt.toMillis()
    const remaining = expiresAt - now

    if (remaining <= 0) return "Expired"

    const hours = Math.floor(remaining / (1000 * 60 * 60))
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
}
