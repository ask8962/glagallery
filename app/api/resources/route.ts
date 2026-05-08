import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { getClientIP, checkServerRateLimit } from "@/lib/server-auth"
import type { AcademicResource, ResourceType } from "@/lib/types"

// GET: Paginated resources feed
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const type = searchParams.get("type") as ResourceType | "all" | null
        const department = searchParams.get("department")
        const semester = searchParams.get("semester")
        const cursor = searchParams.get("cursor")
        const limitCount = Math.min(parseInt(searchParams.get("limit") || "15"), 50)

        let query = adminDb
            .collection("academicResources")
            .where("status", "==", "active")
            .orderBy("createdAt", "desc")
            .limit(limitCount)

        if (type && type !== "all") {
            query = adminDb
                .collection("academicResources")
                .where("status", "==", "active")
                .where("type", "==", type)
                .orderBy("createdAt", "desc")
                .limit(limitCount)
        }

        // Note: Firestore requires composite indexes for multiple where clauses with orderBy.
        // If we add department and semester filtering here, we might hit index errors unless created.
        // For MVP, we can fetch and filter on the client or server if data is small, but let's try direct queries.
        // Better approach for MVP without forcing user to build indexes: filter post-fetch if needed, or just rely on simple queries.
        // Actually, we'll just return all active sorted by date, and let the client do the fine filtering for now to avoid complex index requirements.
        
        if (cursor) {
            const cursorDoc = await adminDb.collection("academicResources").doc(cursor).get()
            if (cursorDoc.exists) {
                query = query.startAfter(cursorDoc)
            }
        }

        const snapshot = await query.get()
        let resources: Partial<AcademicResource>[] = []

        snapshot.forEach((doc) => {
            const data = doc.data()
            resources.push({
                id: doc.id,
                title: data.title,
                description: data.description,
                type: data.type,
                department: data.department,
                semester: data.semester,
                subject: data.subject,
                driveLink: data.driveLink,
                authorUid: data.authorUid,
                authorName: data.authorName,
                upvotes: data.upvotes || 0,
                createdAt: data.createdAt,
            })
        })

        // Client-side filtering for department/semester to avoid complex index requirements initially
        if (department && department !== "all") {
            resources = resources.filter(r => r.department === department)
        }
        if (semester && semester !== "all") {
            resources = resources.filter(r => r.semester === semester)
        }

        const nextCursor =
            snapshot.docs.length === limitCount
                ? snapshot.docs[snapshot.docs.length - 1].id
                : null

        return NextResponse.json({
            resources,
            nextCursor,
            hasMore: nextCursor !== null,
        })
    } catch (error: any) {
        console.error("Resources GET error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST: Create a new resource
export async function POST(request: NextRequest) {
    try {
        // Rate limit: 10 uploads per hour per IP
        const clientIp = getClientIP(request)
        const rateLimitCheck = await checkServerRateLimit(clientIp, "RESOURCE_UPLOAD", 60 * 60 * 1000)

        if (!rateLimitCheck.allowed) {
            return NextResponse.json(
                { error: "You're uploading too fast. Try again later." },
                { status: 429 }
            )
        }

        const body = await request.json()
        const {
            title,
            description,
            type,
            department,
            semester,
            subject,
            driveLink,
            authorUid,
            authorName,
            organizationId,
        } = body

        // Validate
        if (!title || !type || !department || !semester || !subject || !driveLink) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }
        if (!driveLink.includes("drive.google.com")) {
            return NextResponse.json({ error: "Only Google Drive links are allowed" }, { status: 400 })
        }
        if (!authorUid || !authorName) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 })
        }

        const validTypes: ResourceType[] = ["notes", "pyq", "book", "other"]
        const selectedType = validTypes.includes(type) ? type : "other"

        // Build resource document
        const resourceData: Omit<AcademicResource, "id"> = {
            title: title.trim(),
            description: description ? description.trim() : "",
            type: selectedType,
            department: department.trim(),
            semester: semester.trim(),
            subject: subject.trim(),
            driveLink: driveLink.trim(),
            authorUid,
            authorName,
            upvotes: 0,
            status: "active",
            organizationId: organizationId || "",
            createdAt: new Date().toISOString(),
        }

        const docRef = await adminDb.collection("academicResources").add(resourceData)

        // Award points for uploading resources (gamification)
        try {
            const userRef = adminDb.collection("users").doc(authorUid)
            const userDoc = await userRef.get()
            
            if (userDoc.exists) {
                const currentPoints = userDoc.data()?.points || 0
                // Award 20 points for an upload
                await userRef.update({
                    points: currentPoints + 20
                })

                // Log transaction
                await adminDb.collection("pointTransactions").add({
                    userId: authorUid,
                    amount: 20,
                    type: "resource_upload",
                    description: `Uploaded ${selectedType}: ${title}`,
                    referenceId: docRef.id,
                    createdAt: new Date().toISOString()
                })
            }
        } catch (pointErr) {
            console.error("Failed to award points for resource upload:", pointErr)
            // Don't fail the request if gamification fails
        }

        return NextResponse.json({
            success: true,
            id: docRef.id,
            pointsAwarded: 20
        })
    } catch (error: any) {
        console.error("Resources POST error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// DELETE: Remove a resource (Admin/Super Admin only or original author)
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get("id")
        
        // Basic authorization check via headers (MVP approach)
        const uid = request.headers.get("x-user-id")
        const role = request.headers.get("x-user-role")

        if (!id) return NextResponse.json({ error: "Missing resource ID" }, { status: 400 })

        const docRef = adminDb.collection("academicResources").doc(id)
        const doc = await docRef.get()

        if (!doc.exists) return NextResponse.json({ error: "Resource not found" }, { status: 404 })
        
        const data = doc.data()
        
        // Check if user is admin, super_admin, or the original author
        if (data?.authorUid !== uid && role !== "admin" && role !== "super_admin") {
             return NextResponse.json({ error: "Unauthorized to delete this resource" }, { status: 403 })
        }

        await docRef.delete()

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error("Resources DELETE error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
