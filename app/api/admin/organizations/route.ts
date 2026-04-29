import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { verifyAdminAccess } from "@/lib/server-auth"
import { Timestamp } from "firebase-admin/firestore"

export async function POST(request: NextRequest) {
    try {
        // 1. Verify Super Admin Access
        const authCheck = await verifyAdminAccess(request)
        if (!authCheck.authorized || !authCheck.user || authCheck.user.role !== "super_admin") {
            return NextResponse.json({ error: "Access Denied: Super Admin privileges required." }, { status: 403 })
        }

        // 2. Parse payload
        const body = await request.json()
        const { name, domain, slug, primaryColor, logoUrl } = body

        if (!name || !domain || !slug) {
            return NextResponse.json({ error: "Missing required fields: name, slug, domain" }, { status: 400 })
        }

        const orgData = {
            name,
            domain,
            slug,
            allowedDomains: [domain],
            branding: {
                logoUrl: logoUrl || "",
                primaryColor: primaryColor || "#000000"
            },
            features: ["events", "clubs", "hackathons", "analytics"], // default features
            createdAt: Timestamp.now(),
        }

        // 3. Save to Firestore
        const docRef = await adminDb.collection("organizations").add(orgData)

        return NextResponse.json({
            success: true,
            organizationId: docRef.id,
            message: "Tenant Organization created successfully"
        })

    } catch (error: any) {
        console.error("Create Organization Error:", error)
        return NextResponse.json(
            { error: error.message || "Failed to create organization" },
            { status: 500 }
        )
    }
}
