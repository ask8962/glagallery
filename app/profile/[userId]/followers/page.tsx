"use client"

import { useEffect, useState } from "react"
import { getFirebase } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import type { UserProfile } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import { Users, UserPlus } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"

interface FollowersPageProps {
    params: { userId: string }
}

interface FollowUser {
    id: string
    name: string
    photoURL?: string
    bio?: string
}

export default function FollowersPage({ params }: FollowersPageProps) {
    const { userId } = params
    const { user } = useAuth()
    const { db } = getFirebase()
    const [followers, setFollowers] = useState<FollowUser[]>([])
    const [following, setFollowing] = useState<FollowUser[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadFollowData() {
            try {
                // Load followers (users who follow this user)
                const followersQuery = query(
                    collection(db, "follows"),
                    where("followingId", "==", userId)
                )
                const followersSnap = await getDocs(followersQuery)
                const followerIds = followersSnap.docs.map((d) => d.data().followerId)

                // Load following (users this user follows)
                const followingQuery = query(
                    collection(db, "follows"),
                    where("followerId", "==", userId)
                )
                const followingSnap = await getDocs(followingQuery)
                const followingIds = followingSnap.docs.map((d) => d.data().followingId)

                // Fetch user profiles
                const fetchProfiles = async (ids: string[]): Promise<FollowUser[]> => {
                    const profiles: FollowUser[] = []
                    for (const id of ids.slice(0, 50)) {
                        const userDoc = await getDoc(doc(db, "users", id))
                        if (userDoc.exists()) {
                            const data = userDoc.data() as UserProfile
                            profiles.push({
                                id,
                                name: data.name,
                                photoURL: data.photoURL,
                                bio: data.bio,
                            })
                        }
                    }
                    return profiles
                }

                const [followersData, followingData] = await Promise.all([
                    fetchProfiles(followerIds),
                    fetchProfiles(followingIds),
                ])

                setFollowers(followersData)
                setFollowing(followingData)
            } catch (error) {
                console.error("Error loading follow data:", error)
            } finally {
                setLoading(false)
            }
        }

        loadFollowData()
    }, [db, userId])

    const UserCard = ({ user: followUser }: { user: FollowUser }) => (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 p-4 border rounded-xl hover:bg-muted/50 transition-colors"
        >
            <Link href={`/profile/${followUser.id}`}>
                <Avatar className="h-12 w-12">
                    <AvatarImage src={followUser.photoURL} />
                    <AvatarFallback>{followUser.name?.[0]}</AvatarFallback>
                </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
                <Link href={`/profile/${followUser.id}`}>
                    <h3 className="font-medium hover:underline truncate">{followUser.name}</h3>
                </Link>
                {followUser.bio && (
                    <p className="text-sm text-muted-foreground truncate">{followUser.bio}</p>
                )}
            </div>
            {user && user.uid !== followUser.id && (
                <Link href={`/profile/${followUser.id}`}>
                    <Button variant="outline" size="sm">View</Button>
                </Link>
            )}
        </motion.div>
    )

    const EmptyState = ({ type }: { type: "followers" | "following" }) => (
        <div className="text-center py-16">
            {type === "followers" ? (
                <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            ) : (
                <UserPlus className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            )}
            <h2 className="text-xl font-semibold mb-2">
                No {type === "followers" ? "Followers" : "Following"} Yet
            </h2>
            <p className="text-muted-foreground">
                {type === "followers"
                    ? "When someone follows this user, they'll appear here."
                    : "When this user follows someone, they'll appear here."}
            </p>
        </div>
    )

    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border rounded-xl">
                        <div className="h-12 w-12 bg-muted rounded-full animate-pulse" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                            <div className="h-3 w-48 bg-muted rounded animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <Tabs defaultValue="followers" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
                <TabsTrigger value="followers">
                    Followers ({followers.length})
                </TabsTrigger>
                <TabsTrigger value="following">
                    Following ({following.length})
                </TabsTrigger>
            </TabsList>

            <TabsContent value="followers" className="space-y-3">
                {followers.length > 0 ? (
                    followers.map((follower) => <UserCard key={follower.id} user={follower} />)
                ) : (
                    <EmptyState type="followers" />
                )}
            </TabsContent>

            <TabsContent value="following" className="space-y-3">
                {following.length > 0 ? (
                    following.map((followingUser) => <UserCard key={followingUser.id} user={followingUser} />)
                ) : (
                    <EmptyState type="following" />
                )}
            </TabsContent>
        </Tabs>
    )
}
