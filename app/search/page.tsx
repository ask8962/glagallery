"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { useOrganization } from "@/context/organization-context"
import { getFirebase } from "@/lib/firebase"
import { collection, query, getDocs, limit, orderBy, where } from "firebase/firestore"
import { isSuperAdminEmail } from "@/lib/config"
import type { UserProfile } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { Search, Users, UserPlus, Loader2 } from "lucide-react"
import { FollowSystem } from "@/components/profile/follow-system"

export default function SearchPage() {
    const { user, profile } = useAuth()
    const { organization } = useOrganization()
    const router = useRouter()
    const { db } = getFirebase()

    const isSuperAdmin = profile?.role === "super_admin" || isSuperAdminEmail(profile?.email || "")

    const [searchQuery, setSearchQuery] = useState("")
    const [allUsers, setAllUsers] = useState<UserProfile[]>([])
    const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([])
    const [loading, setLoading] = useState(true)

    // Load users scoped to the current organization (or all for super admins)
    useEffect(() => {
        if (organization?.id || isSuperAdmin) loadUsers()
    }, [organization?.id, isSuperAdmin])

    // Filter users when search query changes
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredUsers(allUsers.filter(u => u.uid !== user?.uid))
        } else {
            const term = searchQuery.toLowerCase()
            setFilteredUsers(
                allUsers.filter(u =>
                    u.uid !== user?.uid &&
                    (u.name?.toLowerCase().includes(term) ||
                        u.email?.toLowerCase().includes(term) ||
                        u.bio?.toLowerCase().includes(term))
                )
            )
        }
    }, [searchQuery, allUsers, user?.uid])

    async function loadUsers() {
        setLoading(true)
        try {
            const usersRef = collection(db, "users")
            const orgId = organization?.id

            // Match the exact admin-stats query pattern that's confirmed working
            let usersQuery
            if (isSuperAdmin) {
                // Super Admin: use bare collection reference (same as admin-stats line 33)
                usersQuery = usersRef
            } else if (orgId && orgId !== "org_public_global") {
                // College users — filter by their organization
                usersQuery = query(usersRef, where("organizationId", "==", orgId))
            } else {
                // Public / non-institutional users — show all users they can access
                usersQuery = usersRef
            }

            const snapshot = await getDocs(usersQuery)

            const users: UserProfile[] = []
            snapshot.forEach(doc => {
                users.push({ ...doc.data(), uid: doc.id } as UserProfile)
            })

            // Sort by name client-side
            users.sort((a, b) => (a.name || "").localeCompare(b.name || ""))

            setAllUsers(users)
            setFilteredUsers(users.filter(u => u.uid !== user?.uid))
        } catch (error) {
            console.error("Error loading users:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleViewProfile = (userId: string) => {
        router.push(`/profile?user=${userId}`)
    }

    if (!user) {
        return (
            <main className="mx-auto max-w-2xl px-4 py-20 text-center">
                <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h1 className="text-2xl font-bold text-primary mb-2">Sign In Required</h1>
                <p className="text-muted-foreground">Please sign in to search for users.</p>
            </main>
        )
    }

    return (
        <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mx-auto max-w-4xl px-4 py-8 space-y-6"
        >
            {/* Header */}
            <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <div className="h-1 w-12 bg-accent" />
                    <span className="text-sm font-medium text-accent">Find Friends</span>
                    <div className="h-1 w-12 bg-accent" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">
                    Search <span className="text-accent">Users</span>
                </h1>
                <p className="text-muted-foreground">
                    Find and connect with fellow students
                </p>
            </div>

            {/* Search Bar */}
            <Card className="p-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search by name, email, or bio..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 h-12 text-lg"
                    />
                </div>
            </Card>

            {/* Results Count */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {loading ? "Loading..." : `${filteredUsers.length} users found`}
                </p>
                <Button variant="ghost" size="sm" onClick={loadUsers} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
                </Button>
            </div>

            {/* User Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <Card key={i} className="p-4 animate-pulse">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-muted" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-muted rounded w-1/2" />
                                    <div className="h-3 bg-muted rounded w-3/4" />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : filteredUsers.length === 0 ? (
                <Card className="p-12 text-center">
                    <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-xl font-semibold text-primary mb-2">No users found</h2>
                    <p className="text-muted-foreground">
                        {searchQuery ? "Try a different search term" : "No other users registered yet"}
                    </p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredUsers.map((userProfile, index) => (
                        <motion.div
                            key={userProfile.uid}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card className="p-4 hover:shadow-md transition-all duration-300 border-border/50 hover:border-accent/30">
                                <div className="flex items-start gap-4">
                                    <Avatar className="h-14 w-14 ring-2 ring-accent/20">
                                        <AvatarImage src={userProfile.photoURL} alt={userProfile.name} />
                                        <AvatarFallback className="bg-accent text-accent-foreground text-lg">
                                            {userProfile.name?.charAt(0).toUpperCase() || "U"}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-primary truncate">
                                                {userProfile.name}
                                            </h3>
                                            {userProfile.role === "admin" && (
                                                <Badge variant="secondary" className="text-xs">Admin</Badge>
                                            )}
                                        </div>

                                        {userProfile.bio && (
                                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                                {userProfile.bio}
                                            </p>
                                        )}

                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span>{userProfile.followers?.length || 0} followers</span>
                                            <span>•</span>
                                            <span>{userProfile.following?.length || 0} following</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleViewProfile(userProfile.uid)}
                                        className="flex-1"
                                    >
                                        View Profile
                                    </Button>
                                    <FollowSystem profile={userProfile} onUpdate={loadUsers} />
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </motion.main>
    )
}
