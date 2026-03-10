import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { verifyAuthToken } from "@/lib/server-auth"
import { isAdminEmail } from "@/lib/config"

export async function GET(request: NextRequest) {
    try {
        // Admin-only access
        const authResult = await verifyAuthToken(request)
        if (!authResult.authenticated || !authResult.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        if (!isAdminEmail(authResult.user.email || "")) {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 })
        }

        // Run all queries in parallel for speed
        const [
            usersSnap,
            eventsSnap,
            ticketsSnap,
            clubsSnap,
            hackathonsSnap,
            redemptionsSnap,
            emailLogsSnap,
            transactionsSnap,
        ] = await Promise.all([
            adminDb.collection("users").get(),
            adminDb.collection("events").get(),
            adminDb.collection("tickets").get(),
            adminDb.collection("clubs").get(),
            adminDb.collection("hackathons").get(),
            adminDb.collection("redemptions").get(),
            adminDb.collection("email_logs").get(),
            adminDb.collection("transactions").where("status", "==", "successful").get(),
        ])

        // --- Users by role ---
        const usersByRole = { student: 0, admin: 0, faculty: 0, club: 0 }
        usersSnap.forEach((doc) => {
            const role = (doc.data().role || "student") as keyof typeof usersByRole
            if (role in usersByRole) usersByRole[role]++
            else usersByRole.student++
        })

        // --- Revenue ---
        let totalRevenue = 0
        transactionsSnap.forEach((doc) => {
            const data = doc.data()
            totalRevenue += (data.amount || 0) / 100 // paise to rupees
        })

        // --- Registrations over last 7 days ---
        const now = new Date()
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const dailyRegistrations: Record<string, number> = {}

        // Initialize all 7 days
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
            const key = d.toISOString().split("T")[0] // YYYY-MM-DD
            dailyRegistrations[key] = 0
        }

        ticketsSnap.forEach((doc) => {
            const data = doc.data()
            const bookedAt = data.bookedAt?.toDate?.() || (data.bookedAt ? new Date(data.bookedAt) : null)
            if (bookedAt && bookedAt >= sevenDaysAgo) {
                const key = bookedAt.toISOString().split("T")[0]
                if (key in dailyRegistrations) {
                    dailyRegistrations[key]++
                }
            }
        })

        // --- Top 5 events by registrations ---
        const eventsList: { title: string; registrations: number }[] = []
        eventsSnap.forEach((doc) => {
            const data = doc.data()
            eventsList.push({
                title: data.title || "Untitled",
                registrations: data.registeredCount || 0,
            })
        })
        eventsList.sort((a, b) => b.registrations - a.registrations)
        const topEvents = eventsList.slice(0, 5)

        // --- Upcoming events count ---
        let upcomingEvents = 0
        eventsSnap.forEach((doc) => {
            const data = doc.data()
            const startDate = data.startDate?.toDate?.() || (data.startDate ? new Date(data.startDate) : null)
            if (startDate && startDate > now) upcomingEvents++
        })

        // --- Email health ---
        let emailsSent = 0
        let emailsFailed = 0
        emailLogsSnap.forEach((doc) => {
            const data = doc.data()
            if (data.status === "sent") emailsSent++
            else if (data.status === "failed") emailsFailed++
        })

        // --- Build response ---
        const registrationsTrend = Object.entries(dailyRegistrations).map(([date, count]) => ({
            date,
            label: new Date(date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }),
            count,
        }))

        return NextResponse.json({
            overview: {
                totalUsers: usersSnap.size,
                totalEvents: eventsSnap.size,
                upcomingEvents,
                totalTickets: ticketsSnap.size,
                totalRevenue,
                totalClubs: clubsSnap.size,
                totalHackathons: hackathonsSnap.size,
                totalRedemptions: redemptionsSnap.size,
            },
            usersByRole,
            registrationsTrend,
            topEvents,
            emailHealth: {
                sent: emailsSent,
                failed: emailsFailed,
                total: emailLogsSnap.size,
            },
        })
    } catch (error: any) {
        console.error("Analytics API Error:", error)
        return NextResponse.json({ error: error.message || "Failed to load analytics" }, { status: 500 })
    }
}
