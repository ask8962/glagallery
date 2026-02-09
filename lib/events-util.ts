import { Event, EventStatus } from "./types"
import { format, isPast, isFuture } from "date-fns"

export function getEventStatus(event: Event): EventStatus {
    if (event.status === "cancelled") return "cancelled"

    const now = new Date()
    const start = new Date(event.startDate)
    const end = new Date(event.endDate)

    if (now > end) return "completed"
    if (now >= start && now <= end) return "published" // Actually "ongoing" but we map to published

    return event.status
}

export function formatEventDate(date: any): string {
    if (!date) return ""
    // Handle Firestore timestamp
    const d = date.toDate ? date.toDate() : new Date(date)
    return format(d, "PPP p") // e.g., "April 29th, 2026 5:00 PM"
}

export function isRegistrationOpen(event: Event): boolean {
    if (event.status !== "published") return false

    const now = new Date()

    // Check capacity
    if (event.registeredCount >= event.capacity) return false

    // Check if event has started/ended (auto-close registration)
    if (event.endDate) {
        const end = event.endDate.toDate ? event.endDate.toDate() : new Date(event.endDate)
        if (now > end) return false
    } else {
        const start = event.startDate.toDate ? event.startDate.toDate() : new Date(event.startDate)
        if (now > start) return false
    }

    // Check deadline
    if (event.registrationDeadline) {
        const deadline = event.registrationDeadline.toDate ? event.registrationDeadline.toDate() : new Date(event.registrationDeadline)
        if (now > deadline) return false
    }

    return true
}
