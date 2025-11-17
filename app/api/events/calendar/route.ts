import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const eventId = searchParams.get("eventId")

        if (!eventId) {
            return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
        }

        const eventDoc = await adminDb.collection("events").doc(eventId).get()

        if (!eventDoc.exists) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 })
        }

        const event = eventDoc.data()!

        // Convert Firestore timestamps to Date objects
        const startDate = event.startDate?.toDate ? event.startDate.toDate() : new Date(event.startDate)
        const endDate = event.endDate?.toDate ? event.endDate.toDate() : new Date(event.endDate)

        // Format dates for ICS (YYYYMMDDTHHMMSSZ)
        const formatICSDate = (date: Date) => {
            return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
        }

        // Generate unique ID for the event
        const uid = `${eventId}@glagallery.vercel.app`

        // Build location string
        let location = ""
        if (event.venueType === "online" && event.meetingLink) {
            location = event.meetingLink
        } else if (event.venueName) {
            location = event.venueName
            if (event.venueAddress) {
                location += `, ${event.venueAddress}`
            }
        }

        // Build ICS content
        const icsContent = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//GLA Gallery//Events//EN",
            "CALSCALE:GREGORIAN",
            "METHOD:PUBLISH",
            "BEGIN:VEVENT",
            `UID:${uid}`,
            `DTSTAMP:${formatICSDate(new Date())}`,
            `DTSTART:${formatICSDate(startDate)}`,
            `DTEND:${formatICSDate(endDate)}`,
            `SUMMARY:${escapeICSText(event.title)}`,
            `DESCRIPTION:${escapeICSText(event.shortDescription || event.description || "")}`,
            location ? `LOCATION:${escapeICSText(location)}` : "",
            `URL:https://glagallery.vercel.app/events/${eventId}`,
            `ORGANIZER;CN=${escapeICSText(event.organizer?.name || "GLA Gallery")}:mailto:${event.organizer?.email || "events@gla.ac.in"}`,
            "STATUS:CONFIRMED",
            "END:VEVENT",
            "END:VCALENDAR"
        ].filter(Boolean).join("\r\n")

        // Return as downloadable file
        return new NextResponse(icsContent, {
            status: 200,
            headers: {
                "Content-Type": "text/calendar; charset=utf-8",
                "Content-Disposition": `attachment; filename="${sanitizeFilename(event.title)}.ics"`,
            }
        })

    } catch (error: any) {
        console.error("Calendar export error:", error)
        return NextResponse.json({ error: error.message || "Failed to generate calendar file" }, { status: 500 })
    }
}

// Escape special characters in ICS text fields
function escapeICSText(text: string): string {
    return text
        .replace(/\\/g, "\\\\")
        .replace(/;/g, "\\;")
        .replace(/,/g, "\\,")
        .replace(/\n/g, "\\n")
}

// Sanitize filename for download
function sanitizeFilename(filename: string): string {
    return filename
        .replace(/[<>:"/\\|?*]/g, "")
        .replace(/\s+/g, "_")
        .substring(0, 50)
}
