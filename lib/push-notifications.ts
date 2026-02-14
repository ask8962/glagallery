"use client"

import { getMessaging, getToken, onMessage, isSupported, type Messaging } from "firebase/messaging"
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore"
import { getFirebase } from "./firebase"

let messagingInstance: Messaging | null = null

/**
 * Check if push notifications are supported in this browser
 */
export async function isPushSupported(): Promise<boolean> {
    if (typeof window === "undefined") return false
    if (!("Notification" in window)) return false
    if (!("serviceWorker" in navigator)) return false

    try {
        return await isSupported()
    } catch {
        return false
    }
}

/**
 * Get the current notification permission status
 */
export function getNotificationPermission(): NotificationPermission | "unsupported" {
    if (typeof window === "undefined") return "unsupported"
    if (!("Notification" in window)) return "unsupported"
    return Notification.permission
}

/**
 * Initialize Firebase Messaging
 */
async function getMessagingInstance(): Promise<Messaging | null> {
    if (messagingInstance) return messagingInstance

    const supported = await isPushSupported()
    if (!supported) {
        console.warn("Push notifications not supported in this browser")
        return null
    }

    try {
        const { app } = getFirebase()
        messagingInstance = getMessaging(app)
        return messagingInstance
    } catch (error) {
        console.error("Failed to initialize Firebase Messaging:", error)
        return null
    }
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
    if (typeof window === "undefined") return "denied"
    if (!("Notification" in window)) return "denied"

    try {
        const permission = await Notification.requestPermission()
        console.log("Notification permission:", permission)
        return permission
    } catch (error) {
        console.error("Error requesting notification permission:", error)
        return "denied"
    }
}

/**
 * Register the service worker for push notifications
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
        return null
    }

    try {
        const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
            scope: "/",
        })
        console.log("Service Worker registered:", registration.scope)
        return registration
    } catch (error) {
        console.error("Service Worker registration failed:", error)
        return null
    }
}

/**
 * Get FCM token for the current device
 */
export async function getFCMToken(): Promise<string | null> {
    const messaging = await getMessagingInstance()
    if (!messaging) return null

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    if (!vapidKey) {
        console.error("VAPID key not configured. Set NEXT_PUBLIC_FIREBASE_VAPID_KEY in .env.local")
        return null
    }

    try {
        // Ensure service worker is registered
        const registration = await registerServiceWorker()
        if (!registration) {
            console.error("Service worker not registered")
            return null
        }

        const token = await getToken(messaging, {
            vapidKey,
            serviceWorkerRegistration: registration,
        })

        if (token) {
            console.log("FCM Token obtained:", token.substring(0, 20) + "...")
            return token
        } else {
            console.warn("No FCM token available. Permission may not be granted.")
            return null
        }
    } catch (error: any) {
        console.error("Error getting FCM token:", error.message)
        return null
    }
}

/**
 * Save FCM token to user's Firestore document
 */
export async function saveFCMToken(userId: string, token: string): Promise<boolean> {
    try {
        const { db } = getFirebase()
        const userRef = doc(db, "users", userId)

        await updateDoc(userRef, {
            fcmTokens: arrayUnion(token),
        })

        console.log("FCM token saved to Firestore")
        return true
    } catch (error) {
        console.error("Error saving FCM token:", error)
        return false
    }
}

/**
 * Remove FCM token from user's Firestore document (on logout)
 */
export async function removeFCMToken(userId: string, token: string): Promise<boolean> {
    try {
        const { db } = getFirebase()
        const userRef = doc(db, "users", userId)

        await updateDoc(userRef, {
            fcmTokens: arrayRemove(token),
        })

        console.log("FCM token removed from Firestore")
        return true
    } catch (error) {
        console.error("Error removing FCM token:", error)
        return false
    }
}

/**
 * Set up foreground message listener
 * Call this once in your app to handle notifications when app is open
 */
export async function setupForegroundListener(
    onNotification: (payload: { title: string; body: string; link?: string }) => void
): Promise<(() => void) | null> {
    const messaging = await getMessagingInstance()
    if (!messaging) return null

    const unsubscribe = onMessage(messaging, (payload) => {
        console.log("Foreground message received:", payload)

        // Extract notification data
        const title = payload.notification?.title || "GLA Gallery"
        const body = payload.notification?.body || "You have a new notification"
        const link = payload.data?.link

        // Call the callback
        onNotification({ title, body, link })

        // Optionally show a native notification even in foreground
        if (Notification.permission === "granted") {
            new Notification(title, {
                body,
                icon: "/icons/icon-192x192.png",
                tag: "gla-gallery-foreground",
            })
        }
    })

    return unsubscribe
}

/**
 * Initialize push notifications for a user
 * Call this after user signs in
 */
export async function initializePushNotifications(userId: string): Promise<boolean> {
    try {
        // Check if supported
        const supported = await isPushSupported()
        if (!supported) {
            console.log("Push notifications not supported")
            return false
        }

        // Check current permission
        const permission = getNotificationPermission()
        if (permission === "denied") {
            console.log("Notification permission denied by user")
            return false
        }

        // If permission is default, we'll wait for user to click the banner
        if (permission === "default") {
            console.log("Notification permission not yet requested")
            return false
        }

        // Permission is granted, get token
        const token = await getFCMToken()
        if (!token) {
            console.log("Failed to get FCM token")
            return false
        }

        // Save token to Firestore
        const saved = await saveFCMToken(userId, token)
        return saved
    } catch (error) {
        console.error("Error initializing push notifications:", error)
        return false
    }
}

/**
 * Request permission and initialize push notifications
 * Call this when user clicks "Enable Notifications" button
 */
export async function enablePushNotifications(userId: string): Promise<boolean> {
    try {
        // Request permission
        const permission = await requestNotificationPermission()
        if (permission !== "granted") {
            console.log("Notification permission not granted")
            return false
        }

        // Get token and save
        const token = await getFCMToken()
        if (!token) {
            console.log("Failed to get FCM token")
            return false
        }

        const saved = await saveFCMToken(userId, token)
        return saved
    } catch (error) {
        console.error("Error enabling push notifications:", error)
        return false
    }
}
