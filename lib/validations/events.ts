import { z } from "zod"

export const eventSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters").max(100),
    description: z.string().min(20, "Description must be at least 20 characters"),
    shortDescription: z.string().max(200, "Short description must be under 200 characters"),
    bannerURL: z.string().url("Banner must be a valid URL"),

    startDate: z.string(),
    endDate: z.string(),
    registrationDeadline: z.string().optional(),

    venueType: z.enum(["on-campus", "online", "hybrid"]),
    venueName: z.string().optional(),
    venueAddress: z.string().optional(),
    meetingLink: z.string().url().optional(),

    category: z.enum(["tech", "cultural", "sports", "workshop", "seminar", "other"]),
    tags: z.array(z.string()).min(1, "At least one tag is required"),

    isFree: z.boolean().default(true),
    price: z.number().min(0).optional(),
    capacity: z.number().min(1, "Capacity must be at least 1"),
})

export const rsvpSchema = z.object({
    eventId: z.string(),
    ticketsCount: z.number().min(1).max(5).default(1),
})

export type EventFormData = z.infer<typeof eventSchema>
export type RsvpFormData = z.infer<typeof rsvpSchema>
