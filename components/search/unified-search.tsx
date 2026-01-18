"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Search,
    Loader2,
    Users,
    Calendar,
    Image as ImageIcon,
} from "lucide-react"
import {
    searchClubs,
    searchEvents,
    type ClubSearchResult,
    type EventSearchResult,
} from "@/lib/search"

interface UnifiedSearchProps {
    initialTab?: "posts" | "events" | "clubs"
}

export function UnifiedSearch({ initialTab = "posts" }: UnifiedSearchProps) {
    const [query, setQuery] = useState("")
    const [activeTab, setActiveTab] = useState(initialTab)
    const [loading, setLoading] = useState(false)
    const [clubs, setClubs] = useState<ClubSearchResult[]>([])
    const [events, setEvents] = useState<EventSearchResult[]>([])
    const [searched, setSearched] = useState(false)

    const handleSearch = async () => {
        if (!query.trim()) return

        setLoading(true)
        setSearched(true)

        try {
            if (activeTab === "clubs") {
                const results = await searchClubs({ query })
                setClubs(results)
            } else if (activeTab === "events") {
                const results = await searchEvents({ query })
                setEvents(results)
            }
            // Posts are handled by existing SearchFiltersComponent
        } catch (error) {
            console.error("Search error:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSearch()
        }
    }

    const formatDate = (dateString: string | null) => {
        if (!dateString) return ""
        return new Date(dateString).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
        })
    }

    return (
        <div className="space-y-6">
            {/* Search Bar */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={`Search ${activeTab}...`}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="pl-10"
                    />
                </div>
                <Button onClick={handleSearch} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                </Button>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                <TabsList className="grid grid-cols-3 w-full max-w-md">
                    <TabsTrigger value="posts" className="gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Posts
                    </TabsTrigger>
                    <TabsTrigger value="events" className="gap-2">
                        <Calendar className="h-4 w-4" />
                        Events
                    </TabsTrigger>
                    <TabsTrigger value="clubs" className="gap-2">
                        <Users className="h-4 w-4" />
                        Clubs
                    </TabsTrigger>
                </TabsList>

                {/* Posts Tab - Handled by existing component */}
                <TabsContent value="posts" className="mt-6">
                    <p className="text-muted-foreground text-center py-8">
                        Use the filters above to search posts
                    </p>
                </TabsContent>

                {/* Events Tab */}
                <TabsContent value="events" className="mt-6">
                    {!searched ? (
                        <p className="text-muted-foreground text-center py-8">
                            Enter a search term to find events
                        </p>
                    ) : loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : events.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                            No events found for "{query}"
                        </p>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {events.map((event) => (
                                <Link key={event.id} href={`/events/${event.id}`}>
                                    <Card className="hover:bg-muted/50 transition-colors">
                                        <CardContent className="p-4">
                                            <div className="flex gap-4">
                                                {event.bannerURL && (
                                                    <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                                                        <Image
                                                            src={event.bannerURL}
                                                            alt={event.title}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-medium truncate">{event.title}</h3>
                                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                                        {event.shortDescription}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <Badge variant="secondary">{event.category}</Badge>
                                                        {event.startDate && (
                                                            <span className="text-xs text-muted-foreground">
                                                                {formatDate(event.startDate)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Clubs Tab */}
                <TabsContent value="clubs" className="mt-6">
                    {!searched ? (
                        <p className="text-muted-foreground text-center py-8">
                            Enter a search term to find clubs
                        </p>
                    ) : loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : clubs.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                            No clubs found for "{query}"
                        </p>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {clubs.map((club) => (
                                <Link key={club.id} href={`/clubs/${club.id}`}>
                                    <Card className="hover:bg-muted/50 transition-colors">
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-12 w-12">
                                                    <AvatarImage src={club.logoURL} />
                                                    <AvatarFallback>
                                                        {club.name?.charAt(0) || "C"}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-medium truncate">{club.name}</h3>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-xs">
                                                            {club.category}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground">
                                                            {club.memberCount} members
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
