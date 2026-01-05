import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { getTokenFromRequest, verifyIdToken } from "@/lib/auth-utils"

// GET - System health metrics
export async function GET(request: NextRequest) {
    try {
        // 1. Authenticate admin
        const token = getTokenFromRequest(request)
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const decoded = await verifyIdToken(token)
        if (!decoded) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 })
        }

        const userDoc = await adminDb.collection("users").doc(decoded.uid).get()
        const userData = userDoc.data()
        if (userData?.role !== "admin") {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 })
        }

        // 2. Gather metrics
        const [
            usersCount,
            postsCount,
            eventsCount,
            clubsCount,
            flaggedPostsCount,
        ] = await Promise.all([
            adminDb.collection("users").count().get(),
            adminDb.collection("posts").count().get(),
            adminDb.collection("events").count().get(),
            adminDb.collection("clubs").count().get(),
            adminDb.collection("posts").where("flagged", "==", true).count().get(),
        ])

        // 3. Get recent activity (last 7 days)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const recentUsersSnapshot = await adminDb
            .collection("users")
            .where("createdAt", ">=", sevenDaysAgo)
            .count()
            .get()

        const recentPostsSnapshot = await adminDb
            .collection("posts")
            .where("createdAt", ">=", sevenDaysAgo)
            .count()
            .get()

        // 4. Get storage estimate (based on posts with media)
        const postsWithMedia = await adminDb
            .collection("posts")
            .where("mediaURL", "!=", null)
            .count()
            .get()

        // Rough estimate: average 2MB per media file
        const estimatedStorageGB = ((postsWithMedia.data().count * 2) / 1024).toFixed(2)

        return NextResponse.json({
            overview: {
                totalUsers: usersCount.data().count,
                totalPosts: postsCount.data().count,
                totalEvents: eventsCount.data().count,
                totalClubs: clubsCount.data().count,
                flaggedPosts: flaggedPostsCount.data().count,
            },
            recentActivity: {
                newUsers: recentUsersSnapshot.data().count,
                newPosts: recentPostsSnapshot.data().count,
            },
            storage: {
                mediaCount: postsWithMedia.data().count,
                estimatedGB: parseFloat(estimatedStorageGB),
            },
            timestamp: new Date().toISOString(),
        })

    } catch (error: any) {
        console.error("Health Check Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
