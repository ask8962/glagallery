import { eventSchema } from "@/lib/validations/events"

describe("Event Validation Schema", () => {
    it("should validate a correct event object", () => {
        const validEvent = {
            title: "Valid Event Title",
            description: "This is a long enough description for the event validation to pass.",
            shortDescription: "Short summary",
            bannerURL: "https://example.com/image.jpg",
            startDate: "2024-01-01",
            endDate: "2024-01-02",
            venueType: "on-campus",
            category: "tech",
            tags: ["AI", "Tech"],
            isFree: true,
            capacity: 100
        }

        const result = eventSchema.safeParse(validEvent)
        expect(result.success).toBe(true)
    })

    it("should fail validation if title is too short", () => {
        const invalidEvent = {
            title: "Hi", // Too short
            description: "Valid description but title is too short",
            // ... missing fields
        }

        const result = eventSchema.safeParse(invalidEvent)
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error.flatten().fieldErrors.title).toBeDefined()
        }
    })
})
