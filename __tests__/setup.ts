
import { vi } from 'vitest'

// Mock next/navigation
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
    }),
    useParams: () => ({}),
    useSearchParams: () => ({
        get: vi.fn(),
    }),
}))

// Mock Firebase Admin
vi.mock('@/lib/firebase-admin', () => ({
    adminDb: {
        collection: vi.fn(() => ({
            doc: vi.fn(() => ({
                get: vi.fn(),
                set: vi.fn(),
                update: vi.fn(),
                delete: vi.fn(),
            })),
            add: vi.fn(),
            where: vi.fn(() => ({
                where: vi.fn(() => ({
                    orderBy: vi.fn(() => ({
                        limit: vi.fn(() => ({
                            get: vi.fn()
                        }))
                    }))
                })),
                get: vi.fn()
            })),
            limit: vi.fn(),
        })),
    },
    adminAuth: {
        verifyIdToken: vi.fn(),
        getUser: vi.fn(),
    },
}))

// Mock Auth Utils
vi.mock('@/lib/auth-utils', () => ({
    getTokenFromRequest: vi.fn(),
    verifyIdToken: vi.fn(),
}))

// Mock Config
vi.mock('@/lib/config', () => ({
    getAdminEmails: vi.fn(() => ['admin@gla.ac.in']),
}))
