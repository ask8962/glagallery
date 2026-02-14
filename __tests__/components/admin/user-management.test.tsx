import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { UserManagement } from "@/components/admin/user-management"
import { vi, describe, it, expect, beforeEach } from "vitest"

// Mock Auth Context
const mockProfile = {
    uid: "admin-uid",
    email: "admin@gla.ac.in",
    role: "admin",
    name: "Admin User"
}

vi.mock("@/context/auth-context", () => ({
    useAuth: () => ({
        profile: mockProfile,
        user: { uid: "admin-uid", email: "admin@gla.ac.in" }
    })
}))

// Mock Firebase Client
const mockUpdateDoc = vi.fn()
const mockOnSnapshot = vi.fn()

vi.mock("@/lib/firebase", () => ({
    getFirebase: () => ({
        db: {} // Mock db object
    })
}))

vi.mock("firebase/firestore", () => ({
    collection: vi.fn(),
    doc: vi.fn(),
    updateDoc: (...args: any[]) => mockUpdateDoc(...args),
    onSnapshot: (...args: any[]) => mockOnSnapshot(...args)
}))

vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn()
    }
}))

vi.mock("@/components/admin/create-club-dialog", () => ({
    CreateClubDialog: () => <button>Create Club</button>
}))

describe("UserManagement", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("renders and calls firestore", () => {
        // Mock onSnapshot to invoke callback immediately with empty data to stop loading
        mockOnSnapshot.mockImplementation((_query, callback) => {
            callback({
                forEach: () => { },
                size: 0
            })
            return () => { }
        })

        render(<UserManagement />)

        // Check if onSnapshot was called
        expect(mockOnSnapshot).toHaveBeenCalled()

        // Check if title is present (loading should be false now)
        expect(screen.getByText("User Management")).toBeDefined()
    })
})
