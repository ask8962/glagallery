import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as rsvpHandler } from '@/app/api/events/rsvp/route'
import { adminDb } from '@/lib/firebase-admin'
import { getTokenFromRequest, verifyIdToken } from '@/lib/auth-utils'

// Helper to create mock requests
const createMockRequest = (body: any, headers?: Record<string, string>) => {
    return {
        method: 'POST',
        json: async () => body,
        headers: {
            get: (key: string) => headers?.[key] || null,
        },
        url: 'http://localhost:3000/api/events/rsvp',
    } as unknown as NextRequest
}

const mockDecodedToken = {
    uid: 'user-123',
    email: 'student@gla.ac.in',
    name: 'Test Student',
}

describe('RSVP Security Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks()
            ; (getTokenFromRequest as any).mockReturnValue('valid-token')
            ; (verifyIdToken as any).mockResolvedValue(mockDecodedToken)
    })

    describe('Transaction-based RSVP (Race Condition Fix)', () => {
        // Test 5 times for reliability
        for (let i = 1; i <= 5; i++) {
            it(`should use transaction to prevent overbooking (Run ${i})`, async () => {
                const body = { eventId: `event-${i}`, ticketsCount: 1 }
                const req = createMockRequest(body)

                // Mock event with capacity of 1
                const mockEvent = {
                    title: 'Test Event',
                    capacity: 1,
                    registeredCount: 0,
                    isFree: true,
                }

                // Track if runTransaction was called
                const transactionMock = vi.fn().mockImplementation(async (callback) => {
                    // Simulate transaction callback
                    const mockTx = {
                        get: vi.fn().mockResolvedValue({
                            exists: true,
                            data: () => mockEvent,
                        }),
                        set: vi.fn(),
                        update: vi.fn(),
                    }
                    return callback(mockTx)
                })

                const collectionMock = adminDb.collection as any
                collectionMock.mockReturnValue({
                    doc: vi.fn().mockReturnValue({
                        get: vi.fn().mockResolvedValue({
                            exists: true,
                            data: () => mockEvent,
                        }),
                    }),
                    where: vi.fn().mockReturnThis(),
                    limit: vi.fn().mockReturnThis(),
                    get: vi.fn().mockResolvedValue({ empty: true }), // No existing ticket
                })

                    ; (adminDb.runTransaction as any) = transactionMock

                const res = await rsvpHandler(req)
                const data = await res.json()

                // Should succeed
                expect(res.status).toBe(200)
                expect(data.success).toBe(true)

                // Transaction should have been called
                expect(transactionMock).toHaveBeenCalled()
            })
        }

        it('should reject when capacity is exceeded inside transaction', async () => {
            const body = { eventId: 'full-event', ticketsCount: 1 }
            const req = createMockRequest(body)

            // Mock event that's already full
            const mockFullEvent = {
                title: 'Full Event',
                capacity: 10,
                registeredCount: 10, // FULL
                isFree: true,
            }

            const transactionMock = vi.fn().mockImplementation(async (callback) => {
                const mockTx = {
                    get: vi.fn().mockResolvedValue({
                        exists: true,
                        data: () => mockFullEvent,
                    }),
                    set: vi.fn(),
                    update: vi.fn(),
                }
                return callback(mockTx)
            })

            const collectionMock = adminDb.collection as any
            collectionMock.mockReturnValue({
                doc: vi.fn().mockReturnValue({
                    get: vi.fn().mockResolvedValue({
                        exists: true,
                        data: () => mockFullEvent,
                    }),
                }),
                where: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                get: vi.fn().mockResolvedValue({ empty: true }),
            })

                ; (adminDb.runTransaction as any) = transactionMock

            const res = await rsvpHandler(req)

            // Should fail with 400 (capacity exceeded)
            expect(res.status).toBe(400)
        })
    })
})
