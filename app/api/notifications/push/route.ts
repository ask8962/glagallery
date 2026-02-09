import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import * as admin from "firebase-admin"

/**
 * API Route to send push notifications
 * POST /api/notifications/push
 * 
 * Body: {
 *   userId: string,      // Target user ID
 *   title: string,       // Notification title
 *   body: string,        // Notification body
 *   link?: string,       // Optional link to open on click
 *   type?: string,       // Optional notification type
 *   data?: object        // Optional additional data
 * }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { userId, title, body: notificationBody, link, type, data } = body

        if (!userId || !title || !notificationBody) {
            return NextResponse.json(
                { error: "Missing required fields: userId, title, body" },
                { status: 400 }
            )
        }

        // Fetch user's FCM tokens from Firestore
        const userDoc = await adminDb.collection("users").doc(userId).get()

        if (!userDoc.exists) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            )
        }

        const userData = userDoc.data()
        const fcmTokens: string[] = userData?.fcmTokens || []

        if (fcmTokens.length === 0) {
            // User has no FCM tokens registered (push not enabled)
            return NextResponse.json({
                success: true,
                sent: 0,
                message: "User has no FCM tokens registered"
            })
        }

        // Prepare the notification payload
        const message: admin.messaging.MulticastMessage = {
            tokens: fcmTokens,
            notification: {
                title,
                body: notificationBody,
            },
            webpush: {
                notification: {
                    icon: "/icons/icon-192x192.png",
                    badge: "/icons/badge-72x72.png",
                    tag: type || "gla-gallery-notification",
                    requireInteraction: false,
                },
                fcmOptions: {
                    link: link || "/",
                },
            },
            data: {
                link: link || "/",
                type: type || "general",
                ...data,
            },
        }

        // Send to all tokens
        const response = await admin.messaging().sendEachForMulticast(message)

        console.log(`Push notification sent to ${userId}:`, {
            successCount: response.successCount,
            failureCount: response.failureCount,
        })

        // Handle failed tokens (remove invalid ones)
        if (response.failureCount > 0) {
            const tokensToRemove: string[] = []

            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    const errorCode = resp.error?.code
                    // Remove invalid tokens
                    if (
                        errorCode === "messaging/invalid-registration-token" ||
                        errorCode === "messaging/registration-token-not-registered"
                    ) {
                        tokensToRemove.push(fcmTokens[idx])
                    }
                }
            })

            // Remove invalid tokens from Firestore
            if (tokensToRemove.length > 0) {
                const { FieldValue } = admin.firestore
                await adminDb.collection("users").doc(userId).update({
                    fcmTokens: FieldValue.arrayRemove(...tokensToRemove),
                })
                console.log(`Removed ${tokensToRemove.length} invalid FCM tokens for user ${userId}`)
            }
        }

        return NextResponse.json({
            success: true,
            sent: response.successCount,
            failed: response.failureCount,
        })

    } catch (error: any) {
        console.error("Push notification error:", error)
        return NextResponse.json(
            { error: error.message || "Failed to send push notification" },
            { status: 500 }
        )
    }
}
