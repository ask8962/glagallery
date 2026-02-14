
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { POST as createClub } from '@/app/api/admin/clubs/create/route'
import { GET as getClub } from '@/app/api/clubs/[id]/route'
import { POST as addMember } from '@/app/api/clubs/[id]/members/route'
import { adminDb } from '@/lib/firebase-admin' // Mocked in setup.ts
import { getTokenFromRequest, verifyIdToken } from '@/lib/auth-utils' // Mocked

// Helper to create mock requests
const createMockRequest = (method: string, body?: any, headers?: Record<string, string>) => {
    return {
        method,
        json: async () => body,
        headers: {
            get: (key: string) => headers?.[key] || null,
        },
        url: 'http://localhost:3000/api/test',
    } as unknown as NextRequest
}

const mockDecodedToken = {
    uid: 'admin-123',
    email: 'admin@gla.ac.in',
    picture: 'https://example.com/avatar.jpg',
}

describe('Club Management API Tests', () => {

    beforeEach(() => {
        vi.clearAllMocks()

            // Default Auth Mock
            ; (getTokenFromRequest as any).mockReturnValue('valid-token')
            ; (verifyIdToken as any).mockResolvedValue(mockDecodedToken)
    })

    describe('Admin Create Club', () => {
        // Run test 5 times with different inputs to verify reliability
        const testCases = [
            { name: 'Coding Club', category: 'Technical' },
            { name: 'Dance Club', category: 'Cultural' },
            { name: 'Sports Club', category: 'Sports' },
            { name: 'Lit Society', category: 'Literary' },
            { name: 'Social Service', category: 'Social' }
        ]

        testCases.forEach((testCase, index) => {
            it(`should allow admin to create a club (Run ${index + 1}: ${testCase.name})`, async () => {
                const body = {
                    clubName: testCase.name,
                    description: `Description for ${testCase.name}`,
                    category: testCase.category,
                    presidentEmail: 'student@gla.ac.in',
                    presidentUid: 'student-uid',
                    presidentName: 'Student Name',
                    logoURL: 'https://example.com/logo.png',
                }
                const req = createMockRequest('POST', body)

                // Mock duplicate check (return empty = no duplicate)
                const mockDuplicateCheck = {
                    empty: true,
                    docs: []
                }
                const collectionMock = adminDb.collection as any
                collectionMock.mockReturnValue({
                    where: vi.fn().mockReturnThis(),
                    limit: vi.fn().mockReturnThis(),
                    get: vi.fn().mockResolvedValue(mockDuplicateCheck),
                    add: vi.fn().mockResolvedValue({ id: `new-club-id-${index}` }),
                    doc: vi.fn().mockReturnValue({
                        id: `new-club-id-${index}`,
                        set: vi.fn()
                    })
                })

                const res = await createClub(req)
                const data = await res.json()

                expect(res.status).toBe(200)
                expect(data.clubId).toBe(`new-club-id-${index}`)
            })
        })

        it('should fail if required fields are missing', async () => {
            const body = { clubName: 'Incomplete Club' } // Missing fields
            const req = createMockRequest('POST', body)

            const res = await createClub(req)
            expect(res.status).toBe(400)
        })
    })

    describe('Get Club Details', () => {
        it('should return club details for valid ID', async () => {
            const clubData = {
                name: 'Test Club',
                description: 'Test Desc',
                status: 'active',
                admins: ['admin-123']
            }

            const collectionMock = adminDb.collection as any
            collectionMock.mockReturnValue({
                doc: vi.fn().mockReturnValue({
                    get: vi.fn().mockResolvedValue({
                        exists: true,
                        id: 'club-123',
                        data: () => clubData
                    })
                })
            })

            const req = createMockRequest('GET')
            const context = { params: Promise.resolve({ id: 'club-123' }) }

            const res = await getClub(req, context)
            const data = await res.json()

            expect(res.status).toBe(200)
            expect(data.club.name).toBe('Test Club')
        })

        it('should return 404 if club not found', async () => {
            const collectionMock = adminDb.collection as any
            collectionMock.mockReturnValue({
                doc: vi.fn().mockReturnValue({
                    get: vi.fn().mockResolvedValue({ exists: false })
                })
            })

            const req = createMockRequest('GET')
            const context = { params: Promise.resolve({ id: 'missing-club' }) }

            const res = await getClub(req, context)
            expect(res.status).toBe(404)
        })
    })

    describe('Manage Members', () => {
        it('should allow president to add a member', async () => {
            const mockClub = {
                presidentUid: 'admin-123', // Matches current user
                admins: ['admin-123'],
                members: [],
                team: []
            }

            const updateMock = vi.fn()
            const collectionMock = adminDb.collection as any
            collectionMock.mockReturnValue({
                doc: vi.fn().mockReturnValue({
                    get: vi.fn().mockResolvedValue({
                        exists: true,
                        data: () => mockClub
                    }),
                    update: updateMock
                })
            })

            const body = {
                memberUid: 'new-member-uid',
                memberName: 'New Member',
                memberEmail: 'new@gla.ac.in',
                role: 'Vice President'
            }
            const req = createMockRequest('POST', body)
            const context = { params: Promise.resolve({ id: 'club-123' }) }

            const res = await addMember(req, context)

            expect(res.status).toBe(200)
            expect(updateMock).toHaveBeenCalled()
        })
    })
})
