"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/context/auth-context"
import { getFirebase } from "@/lib/firebase"
import { collection, query, where, getDocs, limit } from "firebase/firestore"
import {
    Loader2,
    Users,
    Calendar,
    Settings,
    Globe,
    Instagram,
    Linkedin,
    ExternalLink,
    Mail,
    Plus,
    Megaphone
} from "lucide-react"
import type { Club, Event, UserProfile } from "@/lib/types"
import { ClubAnnouncements } from "@/components/clubs/club-announcements"
import { JoinRequestButton } from "@/components/clubs/join-request-button"
import { VerifiedBadge } from "@/components/clubs/verified-badge"

export default function ClubProfileClient() {
    const params = useParams()
    const clubId = params.id as string
    const { user } = useAuth()
    const { db } = getFirebase()

    const [club, setClub] = useState<Club | null>(null)
    const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])
    const [members, setMembers] = useState<UserProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const isClubAdmin = user && club && (club.presidentUid === user.uid || club.admins?.includes(user.uid))

    useEffect(() => {
        if (clubId) {
            fetchClubData()
        }
    }, [clubId])

    const fetchClubData = async () => {
        try {
            // Fetch club details
            const res = await fetch(`/api/clubs/${clubId}`)
            if (!res.ok) throw new Error("Club not found")
            const data = await res.json()
            const clubData = data.club || data
            setClub(clubData)

            // Fetch upcoming events hosted by this club
            // Note: This assumes events have a hostedByClubId field
            try {
                const eventsQuery = query(
                    collection(db, "events"),
                    where("hostedByClubId", "==", clubId),
                    where("status", "==", "published"),
                    limit(5)
                )
                const eventsSnapshot = await getDocs(eventsQuery)
                setUpcomingEvents(eventsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Event)))
            } catch {
                // Events query may fail if field doesn't exist yet
                setUpcomingEvents([])
            }

            // Fetch member profiles (first 10)
            if (clubData.members?.length > 0) {
                const memberIds = clubData.members.slice(0, 10)
                // Fetch each member by document ID
                const memberPromises = memberIds.map(async (memberId: string) => {
                    const { doc, getDoc } = await import("firebase/firestore")
                    const memberDoc = await getDoc(doc(db, "users", memberId))
                    if (memberDoc.exists()) {
                        return { uid: memberDoc.id, ...memberDoc.data() } as UserProfile
                    }
                    return null
                })
                const memberResults = await Promise.all(memberPromises)
                setMembers(memberResults.filter(Boolean) as UserProfile[])
            }

        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error || !club) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <h1 className="text-2xl font-bold">Club Not Found</h1>
                <p className="text-muted-foreground mt-2">{error || "This club doesn't exist."}</p>
                <Link href="/clubs">
                    <Button className="mt-4">Back to Clubs</Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen pb-12">
            {/* Cover Image */}
            <div className="relative h-48 md:h-64 bg-gradient-to-br from-primary/30 to-accent/30">
                {club.coverImageURL && (
                    <Image
                        src={club.coverImageURL}
                        alt={`${club.name} cover`}
                        fill
                        className="object-cover"
                    />
                )}
            </div>

            {/* Club Header */}
            <div className="container max-w-5xl mx-auto px-4">
                <div className="relative -mt-16 mb-6">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
                        {/* Logo */}
                        <div className="h-32 w-32 rounded-2xl bg-background border-4 border-background shadow-lg overflow-hidden">
                            <Image
                                src={club.logoURL || "/placeholder-logo.png"}
                                alt={club.name}
                                width={128}
                                height={128}
                                className="object-cover"
                            />
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                                    {club.name}
                                    {club.verification?.status === "verified" && (
                                        <VerifiedBadge showText={false} size="lg" />
                                    )}
                                </h1>
                                <Badge variant="secondary" className="capitalize">{club.category}</Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Users className="h-4 w-4" />
                                    {club.members?.length || 0} members
                                </span>
                                {club.email && (
                                    <a href={`mailto:${club.email}`} className="flex items-center gap-1 hover:text-accent">
                                        <Mail className="h-4 w-4" />
                                        Contact
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            {isClubAdmin && (
                                <>
                                    <Link href={`/events/create?clubId=${club.id}&clubName=${encodeURIComponent(club.name)}`}>
                                        <Button className="gap-2">
                                            <Plus className="h-4 w-4" />
                                            Create Event
                                        </Button>
                                    </Link>
                                    <Link href={`/clubs/${club.id}/manage`}>
                                        <Button variant="outline" className="gap-2">
                                            <Settings className="h-4 w-4" />
                                            Manage
                                        </Button>
                                    </Link>
                                </>
                            )}
                            {!isClubAdmin && user && (
                                <JoinRequestButton
                                    clubId={clubId}
                                    isMember={club.members?.includes(user.uid) || false}
                                    isAdmin={isClubAdmin || false}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Social Links */}
                {club.socialLinks && Object.values(club.socialLinks).some(v => v) && (
                    <div className="flex gap-3 mb-6">
                        {club.socialLinks.instagram && (
                            <a href={club.socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="icon">
                                    <Instagram className="h-4 w-4" />
                                </Button>
                            </a>
                        )}
                        {club.socialLinks.linkedin && (
                            <a href={club.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="icon">
                                    <Linkedin className="h-4 w-4" />
                                </Button>
                            </a>
                        )}
                        {club.socialLinks.website && (
                            <a href={club.socialLinks.website} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="icon">
                                    <Globe className="h-4 w-4" />
                                </Button>
                            </a>
                        )}
                    </div>
                )}

                {/* Tabs */}
                <Tabs defaultValue="about" className="mt-6">
                    <TabsList className="flex-wrap">
                        <TabsTrigger value="about">About</TabsTrigger>
                        <TabsTrigger value="announcements" className="gap-1">
                            <Megaphone className="h-3 w-3" />
                            Announcements
                        </TabsTrigger>
                        <TabsTrigger value="events">Events</TabsTrigger>
                        <TabsTrigger value="members">Members</TabsTrigger>
                    </TabsList>

                    <TabsContent value="about" className="mt-6">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <h2 className="text-lg font-semibold mb-3">About Us</h2>
                            <p className="text-muted-foreground whitespace-pre-wrap">
                                {club.description}
                            </p>
                        </motion.div>
                    </TabsContent>

                    <TabsContent value="announcements" className="mt-6">
                        <ClubAnnouncements clubId={clubId} isAdmin={isClubAdmin || false} />
                    </TabsContent>

                    <TabsContent value="events" className="mt-6">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            {upcomingEvents.length === 0 ? (
                                <div className="text-center py-12">
                                    <Calendar className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                                    <p className="text-muted-foreground">No upcoming events</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {upcomingEvents.map(event => (
                                        <Link key={event.id} href={`/events/${event.id}`}>
                                            <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                                <h3 className="font-medium">{event.title}</h3>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {event.shortDescription}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </TabsContent>

                    <TabsContent value="members" className="mt-6">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid gap-4 sm:grid-cols-2 md:grid-cols-3"
                        >
                            {members.map(member => {
                                // Find member's role from team array
                                const teamMember = club.team?.find((t: any) => t.uid === member.uid)
                                const role = member.uid === club.presidentUid
                                    ? "President"
                                    : teamMember?.role

                                return (
                                    <Link key={member.uid} href={`/profile?user=${member.uid}`}>
                                        <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                            <Avatar>
                                                <AvatarImage src={member.photoURL} />
                                                <AvatarFallback>{member.name?.[0] || "U"}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium text-sm">{member.name}</p>
                                                {role && (
                                                    <p className="text-xs text-muted-foreground">{role}</p>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                )
                            })}
                        </motion.div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
