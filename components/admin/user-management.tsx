"use client"

import { useEffect, useState } from "react"
import { getFirebase } from "@/lib/firebase"
import { collection, doc, onSnapshot, updateDoc, query, where } from "firebase/firestore"
import type { UserProfile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AdminTableSkeleton } from "@/components/skeletons/admin-skeleton"
import { CreateClubDialog } from "@/components/admin/create-club-dialog"
import { useAuth } from "@/context/auth-context"
import { useOrganization } from "@/context/organization-context"
import { isAdminEmail, isSuperAdminEmail } from "@/lib/config"
import { toast } from "sonner"

export function UserManagement() {
    const { profile } = useAuth()
    const { organization } = useOrganization()
    const { db } = getFirebase()
    const isSuperAdmin = profile?.role === "super_admin" || isSuperAdminEmail(profile?.email || "")
    
    const [users, setUsers] = useState<UserProfile[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!organization?.id && !isSuperAdmin) return;
        
        const q = isSuperAdmin
            ? collection(db, "users")
            : query(collection(db, "users"), where("organizationId", "==", organization?.id));

        const unsub = onSnapshot(
            q,
            (snap) => {
                const list: UserProfile[] = []
                snap.forEach((d) => list.push({ uid: d.id, ...d.data() } as UserProfile))
                setUsers(list)
                setLoading(false)
            },
            (error) => {
                console.error("Error loading users:", error)
                toast.error("Failed to load users")
                setLoading(false)
            }
        )

        return () => unsub()
    }, [db, isSuperAdmin, organization?.id])

    async function toggleRole(u: UserProfile) {
        // Prevent demoting the super admin
        if (isAdminEmail(u.email || "") && u.role === "admin") {
            toast.error("Cannot demote the super admin")
            return
        }

        try {
            const newRole = u.role === "admin" ? "student" : "admin"
            await updateDoc(doc(db, "users", u.uid), { role: newRole })
            toast.success(`User role updated to ${newRole}`)
        } catch (error) {
            console.error("Failed to update user role:", error)
            toast.error("Failed to update user role")
        }
    }

    if (loading) {
        return <AdminTableSkeleton rows={5} />
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-primary">User Management</h2>
                {profile && <CreateClubDialog user={profile} students={users} />}
            </div>

            <Card className="overflow-hidden shadow-sm border border-border/50">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="p-4 text-left font-medium text-foreground">Name</th>
                                <th className="p-4 text-left font-medium text-foreground">Email</th>
                                <th className="p-4 text-left font-medium text-foreground">Role</th>
                                <th className="p-4 text-left font-medium text-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user, index) => (
                                <tr
                                    key={user.uid}
                                    className={`border-b border-border/50 ${index % 2 === 0 ? "bg-background" : "bg-muted/20"}`}
                                >
                                    <td className="p-4 font-medium text-foreground">{user.name}</td>
                                    <td className="p-4 text-muted-foreground">{user.email}</td>
                                    <td className="p-4">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === "admin" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
                                                }`}
                                        >
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => toggleRole(user)}
                                            className="hover:bg-accent/10 hover:text-accent hover:border-accent/30 transition-all duration-300"
                                        >
                                            {user.role === "admin" ? "Demote" : "Promote"}
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    )
}
