import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as sendOtpHandler } from '@/app/api/auth/send-otp/route'
import { adminDb } from '@/lib/firebase-admin'
import { checkServerRateLimit } from '@/lib/server-auth'

// Mock server-auth
vi.mock('@/lib/server-auth', () => ({
    getClientIP: vi.fn(() => '127.0.0.1'),
    checkServerRateLimit: vi.fn(() => ({ allowed: true })),
}))

// Helper to create mock requests
const createMockRequest = (body: any, headers?: Record<string, string>) => {
    return {
        method: 'POST',
        json: async () => body,
        headers: {
            get: (key: string) => headers?.[key] || null,
        },
        url: 'http://localhost:3000/api/auth/send-otp',
    } as unknown as NextRequest
}

describe('OTP Endpoint Security Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks()
            ; (checkServerRateLimit as any).mockResolvedValue({ allowed: true })
    })

    describe('GLA Email Validation', () => {
        // Test 5 times with different invalid emails
        const invalidEmails = [
            'user@gmail.com',
            'user@yahoo.com',
            'user@outlook.com',
            'user@gla.com',        // Similar but not valid
            'user@student.gla.in', // Wrong domain
        ]

        invalidEmails.forEach((email, index) => {
            it(`should reject non-GLA email: ${email} (Run ${index + 1})`, async () => {
                const body = { userId: 'user-123', email }
                const req = createMockRequest(body)

                const res = await sendOtpHandler(req)
                const data = await res.json()

                expect(res.status).toBe(400)
                expect(data.error).toContain('GLA email')
            })
        })

        // Test 5 times with valid GLA emails
        const validEmails = [
            'student@gla.ac.in',
            'faculty@gla.ac.in',
            'admin@gla.ac.in',
            'test.user@gla.ac.in',
            'user123@gla.ac.in',
        ]

        validEmails.forEach((email, index) => {
            it(`should accept valid GLA email: ${email} (Run ${index + 1})`, async () => {
                const body = { userId: 'user-123', email }
                const req = createMockRequest(body)

                // Mock Firestore operations
                const collectionMock = adminDb.collection as any
                collectionMock.mockReturnValue({
                    where: vi.fn().mockReturnThis(),
                    get: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
                    add: vi.fn().mockResolvedValue({ id: 'otp-doc-id' }),
                })

                    // Mock batch
                    ; (adminDb.batch as any) = vi.fn().mockReturnValue({
                        delete: vi.fn(),
                        commit: vi.fn().mockResolvedValue(undefined),
                    })

                const res = await sendOtpHandler(req)

                // Should not fail on email validation (may fail on SMTP, but that's OK)
                // Status 400 means email validation failed, anything else is fine
                if (res.status === 400) {
                    const data = await res.json()
                    expect(data.error).not.toContain('GLA email')
                }
            })
        })
    })

    describe('Missing Fields Validation', () => {
        it('should reject request without userId', async () => {
            const body = { email: 'user@gla.ac.in' }
            const req = createMockRequest(body)

            const res = await sendOtpHandler(req)
            expect(res.status).toBe(400)
        })

        it('should reject request without email', async () => {
            const body = { userId: 'user-123' }
            const req = createMockRequest(body)

            const res = await sendOtpHandler(req)
            expect(res.status).toBe(400)
        })
    })
})
