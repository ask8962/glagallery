import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

export async function GET(req: Request) {
    try {
        const url = new URL(req.url)
        const domain = url.searchParams.get("domain")
        if (!domain) return NextResponse.json({ orgId: "" })

        const domainLower = domain.toLowerCase()

        // Check for any organization that has this domain in allowedDomains array
        const orgsSnap = await adminDb.collection("organizations")
            .where("allowedDomains", "array-contains", domainLower)
            .limit(1)
            .get()

        if (orgsSnap.empty) {
            // For transition, we specifically hardcode gla.ac.in so the current deployment doesn't break
            // All other domains (like gmail.com) will return empty orgId, restricting their access completely!
            if (domainLower === "gla.ac.in") {
                 return NextResponse.json({ orgId: "org_gla_university_001" })
            }
            return NextResponse.json({ orgId: "" })
        }

        return NextResponse.json({ orgId: orgsSnap.docs[0].id })
    } catch (error) {
        console.error("Error resolving domain:", error)
        return NextResponse.json({ orgId: "" }) // Fail closed
    }
}
