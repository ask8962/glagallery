import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { getUserFromRequest } from "@/lib/jwt-auth"

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request)
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Check if admin
        const userDoc = await adminDb.collection("users").doc(user.userId).get()
        const userData = userDoc.data()
        if (userData?.role !== "admin") {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const limit = Math.min(Number(searchParams.get("limit")) || 100, 500)
        const severity = searchParams.get("severity") // info, warning, critical
        const type = searchParams.get("type") // login_failed, permission_denied, etc.

        let query = adminDb
            .collection("security_logs")
            .orderBy("createdAt", "desc")

        if (severity) {
            query = query.where("severity", "==", severity)
        }

        if (type) {
            query = query.where("type", "==", type)
        }

        const snapshot = await query.limit(limit).get()

        const logs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }))

        // Get summary stats
        const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
        const statsSnapshot = await adminDb
            .collection("security_logs")
            .where("createdAt", ">=", last24h)
            .get()

        const stats = {
            total24h: statsSnapshot.size,
            critical: statsSnapshot.docs.filter(d => d.data().severity === "critical").length,
            warnings: statsSnapshot.docs.filter(d => d.data().severity === "warning").length,
            failedLogins: statsSnapshot.docs.filter(d => d.data().type === "login_failed").length
        }

        return NextResponse.json({ logs, stats })
    } catch (error) {
        console.error("Error fetching security logs:", error)
        return NextResponse.json(
            { error: "Failed to fetch security logs" },
            { status: 500 }
        )
    }
}
