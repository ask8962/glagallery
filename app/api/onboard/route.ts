import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { collegeName, contactName, contactEmail, contactPhone, estimatedStudents, slug } = body

    // Basic validation
    if (!collegeName || !contactName || !contactEmail) {
      return NextResponse.json(
        { error: "College name, contact name, and email are required." },
        { status: 400 }
      )
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/
    if (slug && !slugRegex.test(slug)) {
      return NextResponse.json(
        { error: "Subdomain slug can only contain lowercase letters, numbers, and hyphens." },
        { status: 400 }
      )
    }

    const orgSlug = slug || collegeName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

    // Check if slug already exists
    const existingOrgs = await adminDb.collection("organizations").where("slug", "==", orgSlug).get()
    if (!existingOrgs.empty) {
      return NextResponse.json(
        { error: `The subdomain "${orgSlug}.campushub.pro" is already taken. Please choose a different one.` },
        { status: 409 }
      )
    }

    // Create the organization document
    const orgData = {
      name: collegeName,
      domain: `${orgSlug}.campushub.pro`,
      slug: orgSlug,
      allowedDomains: [],
      branding: {
        logoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(collegeName)}&background=0D1117&color=facc15&size=512&font-size=0.33`,
        primaryColor: "#facc15",
      },
      features: ["events", "hackathons", "clubs", "gallery", "rewards"],
      status: "active",
      onboardingData: {
        contactName,
        contactEmail,
        contactPhone: contactPhone || "",
        estimatedStudents: estimatedStudents || "",
        onboardedAt: new Date().toISOString(),
        source: "self-serve",
      },
      createdAt: new Date(),
    }

    const docRef = await adminDb.collection("organizations").add(orgData)

    // Programmatically add the new domain to Firebase Auth Authorized Domains
    const { getAuth } = await import("firebase-admin/auth")
    const auth = getAuth()
    try {
      const currentConfig = await auth.projectConfigManager().getProjectConfig()
      const currentDomains = currentConfig.authorizedDomains || []
      const newDomain = `${orgSlug}.campushub.pro`

      if (!currentDomains.includes(newDomain)) {
        await auth.projectConfigManager().updateProjectConfig({
          authorizedDomains: [...currentDomains, newDomain]
        })
        console.log(`Successfully added ${newDomain} to Firebase Auth authorized domains.`)
      }
    } catch (authErr) {
      console.error("Failed to add authorized domain to Firebase Auth:", authErr)
      // We don't fail the entire onboarding process if this fails, but we log it
    }

    // Also add to billing CRM as a new lead
    await adminDb.collection("billing_crm").add({
      orgId: docRef.id,
      status: "lead",
      contractValue: 0,
      renewalDate: null,
      notes: `Self-serve onboarding: ${collegeName}. Contact: ${contactName} (${contactEmail}). Est. students: ${estimatedStudents || "N/A"}.`,
      nextFollowUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      organizationId: docRef.id,
      subdomain: `${orgSlug}.campushub.pro`,
      message: `Your campus portal is ready at https://${orgSlug}.campushub.pro`,
    })
  } catch (error: any) {
    console.error("Onboarding error:", error)
    return NextResponse.json(
      { error: "Failed to create organization. Please try again." },
      { status: 500 }
    )
  }
}
