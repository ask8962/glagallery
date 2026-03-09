import { NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { headers } from "next/headers"

export async function POST(req: Request) {
    try {
        const headersList = await headers()
        const authHeader = headersList.get("authorization")

        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const token = authHeader.split("Bearer ")[1]
        const decodedToken = await adminAuth.verifyIdToken(token)

        // Check if user is an admin or super admin
        const userDoc = await adminDb.collection("users").doc(decodedToken.uid).get()

        if (!userDoc.exists) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const userData = userDoc.data()
        const isSuperAdmin = decodedToken.email === "anukalp.gupta_cs23@gla.ac.in"
        const isAdmin = userData?.role === "admin"

        if (!isSuperAdmin && !isAdmin) {
            return NextResponse.json({ error: "Forbidden - Requires admin access" }, { status: 403 })
        }

        const body = await req.json()
        const { name, tagline, description, logoUrl, contactAddress, contactPhone, contactEmail, officialWebsiteUrl } = body

        if (!name || typeof name !== "string") {
            return NextResponse.json({ error: "Name is required" }, { status: 400 })
        }

        // Update settings/platform document
        await adminDb.collection("settings").doc("platform").set({
            name,
            tagline: tagline || "",
            description: description || "",
            logoUrl: logoUrl || "/logo.png",
            contactAddress: contactAddress || "",
            contactPhone: contactPhone || "",
            contactEmail: contactEmail || "",
            officialWebsiteUrl: officialWebsiteUrl || "",
            updatedAt: new Date(),
            updatedBy: decodedToken.uid
        }, { merge: true })

        return NextResponse.json({ success: true, message: "Platform settings updated" })
    } catch (error: any) {
        console.error("Error updating platform settings:", error)
        return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
    }
}
