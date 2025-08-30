/**
 * Club Notifications Helper
 * 
 * Sends push notifications to club members when:
 * - A new event is created by the club
 * - A new announcement is posted
 */

import { adminDb } from "@/lib/firebase-admin"

interface NotificationPayload {
    clubId: string
    title: string
    body: string
    link: string
    type: "club_event" | "club_announcement"
}

/**
 * Notify all members of a club
 */
export async function notifyClubMembers(payload: NotificationPayload): Promise<{
    success: boolean
    notified: number
    errors: number
}> {
    const { clubId, title, body, link, type } = payload

    try {
        // 1. Fetch club to get member list
        const clubDoc = await adminDb.collection("clubs").doc(clubId).get()
        if (!clubDoc.exists) {
            console.error(`Club ${clubId} not found for notification`)
            return { success: false, notified: 0, errors: 1 }
        }

        const clubData = clubDoc.data()
        const memberIds: string[] = clubData?.members || []

        if (memberIds.length === 0) {
            console.log(`No members to notify for club ${clubId}`)
            return { success: true, notified: 0, errors: 0 }
        }

        // 2. Send notifications to each member (in batches to avoid rate limits)
        let notified = 0
        let errors = 0

        // Process in batches of 10
        const batchSize = 10
        for (let i = 0; i < memberIds.length; i += batchSize) {
            const batch = memberIds.slice(i, i + batchSize)

            const results = await Promise.allSettled(
                batch.map(async (userId) => {
                    // Call the internal push notification API
                    const response = await fetch(
                        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/push`,
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                userId,
                                title,
                                body,
                                link,
                                type,
                                data: { clubId }
                            }),
                        }
                    )
                    return response.ok
                })
            )

            results.forEach((result) => {
                if (result.status === "fulfilled" && result.value) {
                    notified++
                } else {
                    errors++
                }
            })
        }

        console.log(`Club ${clubId} notification: sent to ${notified} members, ${errors} errors`)
        return { success: true, notified, errors }

    } catch (error) {
        console.error("notifyClubMembers error:", error)
        return { success: false, notified: 0, errors: 1 }
    }
}

/**
 * Notify members about a new club event
 */
export async function notifyClubEvent(
    clubId: string,
    clubName: string,
    eventTitle: string,
    eventId: string
): Promise<void> {
    await notifyClubMembers({
        clubId,
        title: `🎉 New Event: ${eventTitle}`,
        body: `${clubName} just posted a new event!`,
        link: `/events/${eventId}`,
        type: "club_event",
    })
}

/**
 * Notify members about a new announcement
 */
export async function notifyClubAnnouncement(
    clubId: string,
    clubName: string,
    announcementTitle: string
): Promise<void> {
    await notifyClubMembers({
        clubId,
        title: `📢 ${clubName}`,
        body: announcementTitle,
        link: `/clubs/${clubId}?tab=announcements`,
        type: "club_announcement",
    })
}
