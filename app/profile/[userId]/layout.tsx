"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { getFirebase } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import type { UserProfile } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { LevelBadge } from "@/components/gamification/level-badge"
import { FollowSystem } from "@/components/profile/follow-system"
import { ArrowLeft, Grid3X3, Users, Award, Settings } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface ProfileLayoutProps {
    children: React.ReactNode
    params: { userId: string }
}

export default function ProfileLayout({ children, params }: ProfileLayoutProps) {
    const { userId } = params
    const { user } = useAuth()
    const { db } = getFirebase()
    const pathname = usePathname()

    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const isOwnProfile = user?.uid === userId

    useEffect(() => {
        async function loadProfile() {
            try {
                const userDoc = await getDoc(doc(db, "users", userId))
                if (userDoc.exists()) {
                    setProfile(userDoc.data() as UserProfile)
                }
            } catch (error) {
                console.error("Error loading profile:", error)
            } finally {
                setLoading(false)
            }
        }
        loadProfile()
    }, [db, userId])

    const tabs = [
        { href: `/profile/${userId}`, label: "Posts", icon: Grid3X3 },
        { href: `/profile/${userId}/followers`, label: "Followers", icon: Users },
        { href: `/profile/${userId}/badges`, label: "Badges", icon: Award },
    ]

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <Skeleton className="h-32 w-full rounded-xl mb-6" />
                    <div className="flex items-center gap-4 mb-8">
                        <Skeleton className="h-24 w-24 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-40" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Profile Not Found</h1>
                    <p className="text-muted-foreground mb-4">This user doesn't exist or has been removed.</p>
                    <Link href="/">
                        <Button>Go Home</Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <Link href="/gallery">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Gallery
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Profile Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
                    <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background shadow-xl">
                        <AvatarImage src={profile.photoURL} alt={profile.name} />
                        <AvatarFallback className="text-2xl">{profile.name?.[0]}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl sm:text-3xl font-bold">{profile.name}</h1>
                            <LevelBadge points={profile.points || 0} />
                        </div>

                        {profile.bio && (
                            <p className="text-muted-foreground mb-3">{profile.bio}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-sm">
                            <div>
                                <span className="font-semibold">{profile.points || 0}</span>
                                <span className="text-muted-foreground ml-1">points</span>
                            </div>
                            <div>
                                <span className="font-semibold">{profile.followers?.length || 0}</span>
                                <span className="text-muted-foreground ml-1">followers</span>
                            </div>
                            <div>
                                <span className="font-semibold">{profile.following?.length || 0}</span>
                                <span className="text-muted-foreground ml-1">following</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {isOwnProfile ? (
                            <Link href="/profile">
                                <Button variant="outline">
                                    <Settings className="h-4 w-4 mr-2" />
                                    Edit Profile
                                </Button>
                            </Link>
                        ) : (
                            <FollowSystem profile={profile} onUpdate={() => { }} />
                        )}
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex border-b mb-6 overflow-x-auto">
                    {tabs.map((tab) => {
                        const isActive = pathname === tab.href ||
                            (tab.href === `/profile/${userId}` && pathname === `/profile/${userId}/posts`)

                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap",
                                    isActive
                                        ? "border-accent text-accent"
                                        : "border-transparent text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                            </Link>
                        )
                    })}
                </div>

                {/* Page Content */}
                {children}
            </div>
        </div>
    )
}
