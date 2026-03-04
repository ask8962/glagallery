import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as claimHandler } from '@/app/api/campaign/claim/route'
import { adminDb } from '@/lib/firebase-admin'
import { verifyAuthToken, checkServerRateLimit, getClientIP } from '@/lib/server-auth'

// Mock server-auth
vi.mock('@/lib/server-auth', () => ({
    verifyAuthToken: vi.fn(),
    checkServerRateLimit: vi.fn(() => ({ allowed: true, remaining: 5 })),
    getClientIP: vi.fn(() => '127.0.0.1'),
}))

const createMockRequest = (body: any, headers?: Record<string, string>) => {
    return {
        method: 'POST',
        json: async () => body,
        headers: {
            get: (key: string) => headers?.[key] || (key === 'user-agent' ? 'test-agent' : null),
        },
        url: 'http://localhost:3000/api/campaign/claim',
    } as unknown as NextRequest
}

describe('Campaign Claim API Security', () => {
    beforeEach(() => {
        vi.clearAllMocks()
            ; (checkServerRateLimit as any).mockResolvedValue({ allowed: true, remaining: 5 })
            ; (getClientIP as any).mockReturnValue('127.0.0.1')
    })

    describe('Authentication', () => {
        it('should reject unauthenticated requests', async () => {
            ; (verifyAuthToken as any).mockResolvedValue({
                authenticated: false,
                user: null,
            })

            const req = createMockRequest({ consent: true, phoneNumber: '1234567890' })
            const res = await claimHandler(req)

            expect(res.status).toBe(401)
        })

        it('should accept authenticated GLA users', async () => {
            ; (verifyAuthToken as any).mockResolvedValue({
                authenticated: true,
                user: { uid: 'user-123', email: 'test@gla.ac.in', name: 'Test User' },
            })

            // Mock Firestore to simulate non-existing claim
            const collectionMock = adminDb.collection as any
            collectionMock.mockReturnValue({
                doc: vi.fn().mockReturnValue({
                    get: vi.fn().mockResolvedValue({ exists: false }),
                    set: vi.fn().mockResolvedValue(undefined),
                }),
                where: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        get: vi.fn().mockResolvedValue({ size: 0, empty: true }),
                    }),
                    limit: vi.fn().mockReturnValue({
                        get: vi.fn().mockResolvedValue({ empty: true }),
                    }),
                    get: vi.fn().mockResolvedValue({ size: 0, empty: true }),
                }),
                add: vi.fn().mockResolvedValue({ id: 'audit-log-1' }),
            })

            const req = createMockRequest({ consent: true, phoneNumber: '9876543210' })
            const res = await claimHandler(req)
            const data = await res.json()

            // Should succeed or return 409 if already claimed
            expect([200, 409]).toContain(res.status)
        })
    })

    describe('Validation', () => {
        beforeEach(() => {
            ; (verifyAuthToken as any).mockResolvedValue({
                authenticated: true,
                user: { uid: 'user-123', email: 'test@gla.ac.in', name: 'Test' },
            })
        })

        it('should reject without consent', async () => {
            const collectionMock = adminDb.collection as any
            collectionMock.mockReturnValue({
                doc: vi.fn().mockReturnValue({
                    get: vi.fn().mockResolvedValue({ exists: false }),
                }),
                add: vi.fn().mockResolvedValue({ id: 'log-1' }),
            })

            const req = createMockRequest({ consent: false, phoneNumber: '1234567890' })
            const res = await claimHandler(req)
            expect(res.status).toBe(400)
        })

        it('should reject invalid phone number', async () => {
            const collectionMock = adminDb.collection as any
            collectionMock.mockReturnValue({
                doc: vi.fn().mockReturnValue({
                    get: vi.fn().mockResolvedValue({ exists: false }),
                }),
                add: vi.fn().mockResolvedValue({ id: 'log-1' }),
            })

            const req = createMockRequest({ consent: true, phoneNumber: '123' })
            const res = await claimHandler(req)
            expect(res.status).toBe(400)
        })
    })

    describe('Rate Limiting', () => {
        it('should reject when UID rate limit exceeded', async () => {
            ; (verifyAuthToken as any).mockResolvedValue({
                authenticated: true,
                user: { uid: 'user-123', email: 'test@gla.ac.in' },
            })
                ; (checkServerRateLimit as any)
                    .mockResolvedValueOnce({ allowed: false, remaining: 0 })

            const collectionMock = adminDb.collection as any
            collectionMock.mockReturnValue({
                add: vi.fn().mockResolvedValue({ id: 'log-1' }),
            })

            const req = createMockRequest({ consent: true, phoneNumber: '9876543210' })
            const res = await claimHandler(req)
            expect(res.status).toBe(429)
        })
    })
})
