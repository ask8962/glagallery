
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as createEvent } from '@/app/api/events/route' // This export needs to be verified/added if default export
import { adminDb } from '@/lib/firebase-admin'

// Helper to create mock requests
const createMockRequest = (method: string, body?: any) => {
    return {
        method,
        json: async () => body,
        headers: { get: () => null },
        url: 'http://localhost:3000/api/events',
    } as unknown as NextRequest
}

describe('Event API Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Create Event with Club Hosting', () => {
        // Run test 5 times
        for (let i = 1; i <= 5; i++) {
            it(`should create an event with hostedByClubId (Run ${i})`, async () => {
                const body = {
                    title: `Club Event ${i}`,
                    description: 'Hosted by Coding Club',
                    shortDescription: 'Short desc',
                    startDate: new Date().toISOString(),
                    endDate: new Date().toISOString(),
                    category: 'tech',
                    venueType: 'on-campus',
                    venueName: 'Room 101',
                    tags: ['general', 'club-event'],
                    bannerURL: 'https://example.com/banner.jpg',
                    capacity: 100,
                    // Club fields
                    hostedByClubId: 'club-123',
                    hostedByClubName: 'Coding Club'
                }
                const req = createMockRequest('POST', body)

                const addMock = vi.fn().mockResolvedValue({ id: `new-event-id-${i}` })
                    ; (adminDb.collection as any).mockReturnValue({
                        add: addMock
                    })

                const res = await createEvent(req)
                const data = await res.json()

                expect(res.status).toBe(200)
                expect(data.eventId).toBe(`new-event-id-${i}`)

                // Verify DB call included club info
                expect(addMock).toHaveBeenCalledWith(expect.objectContaining({
                    title: `Club Event ${i}`,
                    hostedByClubId: 'club-123',
                    hostedByClubName: 'Coding Club',
                    slug: `club-event-${i}`
                }))
            })
        }
    })
})
