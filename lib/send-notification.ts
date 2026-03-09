/**
 * Server-side Notification Utility
 * 
 * Sends push notifications and creates in-app notification records.
 * Call this from API routes when events occur (likes, comments, etc.)
 */

import { adminDb } from "@/lib/firebase-admin"
import * as admin from "firebase-admin"
import { FieldValue } from "firebase-admin/firestore"

export type NotificationType =
    | "like"
    | "comment"
    | "follow"
    | "mention"
    | "hackathon"
    | "hackathon_update"
    | "club"
    | "club_event"
    | "club_announcement"
    | "event"
    | "reward"
    | "system"
    | "team_invite"
    | "badge"
    | "welcome"
    | "event_ticket"

interface SendNotificationOptions {
    userId: string
    type: NotificationType
    title: string
    body: string
    link?: string
    fromUserId?: string
    fromUserName?: string
    fromUserPhoto?: string
    data?: Record<string, string>
}

/**
 * Send a notification to a user (push + in-app)
 */
export async function sendNotification(options: SendNotificationOptions): Promise<{
    pushSent: number
    notificationId: string | null
}> {
    const { userId, type, title, body, link, fromUserId, fromUserName, fromUserPhoto, data } = options

    // Don't send notification to yourself
    if (fromUserId && fromUserId === userId) {
        return { pushSent: 0, notificationId: null }
    }

    let notificationId: string | null = null
    let pushSent = 0

    try {
        // 1. Create in-app notification in Firestore
        const notificationData = {
            userId,
            type,
            title,
            body,
            link: link || "/",
            fromUserId: fromUserId || null,
            fromUserName: fromUserName || null,
            fromUserPhoto: fromUserPhoto || null,
            read: false,
            createdAt: FieldValue.serverTimestamp()
        }

        const notificationRef = await adminDb.collection("notifications").add(notificationData)
        notificationId = notificationRef.id

        // 2. Send push notification
        const userDoc = await adminDb.collection("users").doc(userId).get()
        if (!userDoc.exists) {
            return { pushSent: 0, notificationId }
        }

        const userData = userDoc.data()
        const fcmTokens: string[] = userData?.fcmTokens || []

        if (fcmTokens.length === 0) {
            // User has no FCM tokens (push not enabled)
            return { pushSent: 0, notificationId }
        }

        // Prepare push message
        const message: admin.messaging.MulticastMessage = {
            tokens: fcmTokens,
            notification: {
                title,
                body,
            },
            webpush: {
                notification: {
                    icon: "/icons/icon-192x192.png",
                    badge: "/icons/badge-72x72.png",
                    tag: `${type}-${notificationId}`,
                    requireInteraction: false,
                },
                fcmOptions: {
                    link: link || "/",
                },
            },
            data: {
                link: link || "/",
                type,
                notificationId: notificationId || "",
                ...data,
            },
        }

        // Send push
        const response = await admin.messaging().sendEachForMulticast(message)
        pushSent = response.successCount

        // Clean up invalid tokens
        if (response.failureCount > 0) {
            const tokensToRemove: string[] = []
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    const errorCode = resp.error?.code
                    if (
                        errorCode === "messaging/invalid-registration-token" ||
                        errorCode === "messaging/registration-token-not-registered"
                    ) {
                        tokensToRemove.push(fcmTokens[idx])
                    }
                }
            })

            if (tokensToRemove.length > 0) {
                await adminDb.collection("users").doc(userId).update({
                    fcmTokens: FieldValue.arrayRemove(...tokensToRemove),
                })
            }
        }

        return { pushSent, notificationId }
    } catch (error) {
        console.error("Error sending notification:", error)
        return { pushSent, notificationId }
    }
}

/**
 * Send notification to multiple users (e.g., club members)
 */
export async function sendBulkNotification(
    userIds: string[],
    type: NotificationType,
    title: string,
    body: string,
    link?: string,
    fromUserId?: string
): Promise<{ totalSent: number }> {
    let totalSent = 0

    // Send in parallel, max 10 concurrent
    const chunks = chunkArray(userIds, 10)

    for (const chunk of chunks) {
        const promises = chunk.map(userId =>
            sendNotification({
                userId,
                type,
                title,
                body,
                link,
                fromUserId
            })
        )

        const results = await Promise.all(promises)
        totalSent += results.reduce((sum, r) => sum + r.pushSent, 0)
    }

    return { totalSent }
}

// Helper to chunk array
function chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size))
    }
    return chunks
}
