import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as redeemHandler } from '@/app/api/rewards/redeem/route'
import { adminDb } from '@/lib/firebase-admin'
import { getUserFromRequest } from '@/lib/jwt-auth'

// Mock jwt-auth
vi.mock('@/lib/jwt-auth', () => ({
    getUserFromRequest: vi.fn(),
}))

const createMockRequest = (body: any) => {
    return {
        method: 'POST',
        json: async () => body,
        headers: {
            get: (key: string) => null,
        },
        url: 'http://localhost:3000/api/rewards/redeem',
    } as unknown as NextRequest
}

describe('Rewards Redeem API', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Authentication', () => {
        it('should reject unauthenticated requests', async () => {
            ; (getUserFromRequest as any).mockResolvedValue(null)

            const req = createMockRequest({ rewardId: 'reward-1' })
            const res = await redeemHandler(req)
            expect(res.status).toBe(401)
        })
    })

    describe('Validation', () => {
        it('should reject missing reward ID', async () => {
            ; (getUserFromRequest as any).mockResolvedValue({
                userId: 'user-123',
                email: 'test@gla.ac.in',
            })

            const req = createMockRequest({})
            const res = await redeemHandler(req)
            expect(res.status).toBe(400)
        })
    })

    describe('Reward Checks', () => {
        it('should reject if reward not found', async () => {
            ; (getUserFromRequest as any).mockResolvedValue({
                userId: 'user-123',
                email: 'test@gla.ac.in',
            })

            const collectionMock = adminDb.collection as any
            collectionMock.mockReturnValue({
                doc: vi.fn().mockReturnValue({
                    get: vi.fn().mockResolvedValue({ exists: false }),
                }),
            })

            const req = createMockRequest({ rewardId: 'nonexistent' })
            const res = await redeemHandler(req)
            expect(res.status).toBe(404)
        })

        it('should reject if reward is inactive', async () => {
            ; (getUserFromRequest as any).mockResolvedValue({
                userId: 'user-123',
                email: 'test@gla.ac.in',
            })

            const collectionMock = adminDb.collection as any
            collectionMock.mockReturnValue({
                doc: vi.fn().mockReturnValue({
                    get: vi.fn().mockResolvedValue({
                        exists: true,
                        data: () => ({ isActive: false, pointsCost: 100, stock: 5 }),
                    }),
                }),
            })

            const req = createMockRequest({ rewardId: 'reward-1' })
            const res = await redeemHandler(req)
            expect(res.status).toBe(400)
        })

        it('should reject if reward is out of stock', async () => {
            ; (getUserFromRequest as any).mockResolvedValue({
                userId: 'user-123',
                email: 'test@gla.ac.in',
            })

            const collectionMock = adminDb.collection as any
            collectionMock.mockReturnValue({
                doc: vi.fn().mockReturnValue({
                    get: vi.fn().mockResolvedValue({
                        exists: true,
                        data: () => ({ isActive: true, pointsCost: 100, stock: 0 }),
                    }),
                }),
            })

            const req = createMockRequest({ rewardId: 'reward-1' })
            const res = await redeemHandler(req)
            expect(res.status).toBe(400)
        })

        it('should reject if user has insufficient points', async () => {
            ; (getUserFromRequest as any).mockResolvedValue({
                userId: 'user-123',
                email: 'test@gla.ac.in',
            })

            const rewardData = { isActive: true, pointsCost: 500, stock: 5, category: 'digital', name: 'Test Reward' }
            const userData = { points: 100, name: 'Test', email: 'test@gla.ac.in' }

            const collectionMock = adminDb.collection as any
            collectionMock.mockImplementation((name: string) => {
                if (name === 'rewards') {
                    return {
                        doc: vi.fn().mockReturnValue({
                            get: vi.fn().mockResolvedValue({
                                exists: true,
                                data: () => rewardData,
                            }),
                        }),
                    }
                }
                if (name === 'users') {
                    return {
                        doc: vi.fn().mockReturnValue({
                            get: vi.fn().mockResolvedValue({
                                exists: true,
                                data: () => userData,
                            }),
                        }),
                    }
                }
                return {
                    doc: vi.fn().mockReturnValue({
                        get: vi.fn().mockResolvedValue({ exists: false }),
                    }),
                }
            })

            const req = createMockRequest({ rewardId: 'reward-1' })
            const res = await redeemHandler(req)
            const data = await res.json()
            expect(res.status).toBe(400)
            expect(data.error).toContain('Insufficient points')
        })

        it('should require shipping address for physical rewards', async () => {
            ; (getUserFromRequest as any).mockResolvedValue({
                userId: 'user-123',
                email: 'test@gla.ac.in',
            })

            const rewardData = { isActive: true, pointsCost: 100, stock: 5, category: 'physical', name: 'T-Shirt' }
            const userData = { points: 500, name: 'Test', email: 'test@gla.ac.in' }

            const collectionMock = adminDb.collection as any
            collectionMock.mockImplementation((name: string) => {
                if (name === 'rewards') {
                    return {
                        doc: vi.fn().mockReturnValue({
                            get: vi.fn().mockResolvedValue({
                                exists: true,
                                data: () => rewardData,
                            }),
                        }),
                    }
                }
                if (name === 'users') {
                    return {
                        doc: vi.fn().mockReturnValue({
                            get: vi.fn().mockResolvedValue({
                                exists: true,
                                data: () => userData,
                            }),
                        }),
                    }
                }
                return {
                    doc: vi.fn().mockReturnValue({
                        get: vi.fn().mockResolvedValue({ exists: false }),
                    }),
                }
            })

            const req = createMockRequest({ rewardId: 'reward-1' })
            const res = await redeemHandler(req)
            expect(res.status).toBe(400)
            const data = await res.json()
            expect(data.error).toContain('Shipping address')
        })
    })
})
