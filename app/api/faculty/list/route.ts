import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { verifyAuthToken } from "@/lib/server-auth"

// GET: List all verified faculty members
export async function GET(req: NextRequest) {
    try {
        const authResult = await verifyAuthToken(req)
        if (!authResult.authenticated || !authResult.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const department = searchParams.get("department")
        const limit = parseInt(searchParams.get("limit") || "50")

        let query = adminDb
            .collection("users")
            .where("role", "in", ["faculty", "club_advisor", "department_head", "dean"])

        if (department) {
            query = query.where("facultyProfile.department", "==", department)
        }

        const facultySnap = await query.limit(limit).get()

        const faculty = facultySnap.docs.map(doc => {
            const data = doc.data()
            return {
                uid: data.uid,
                name: data.name,
                email: data.email,
                photoURL: data.photoURL,
                role: data.role,
                department: data.facultyProfile?.department,
                designation: data.facultyProfile?.designation,
                cabinNumber: data.facultyProfile?.cabinNumber,
                officeHours: data.facultyProfile?.officeHours,
                subjects: data.facultyProfile?.subjects || [],
                advisedClubs: data.facultyProfile?.advisedClubs || [],
            }
        })

        return NextResponse.json({ faculty })
    } catch (error) {
        console.error("Error fetching faculty list:", error)
        return NextResponse.json(
            { error: "Failed to fetch faculty" },
            { status: 500 }
        )
    }
}
