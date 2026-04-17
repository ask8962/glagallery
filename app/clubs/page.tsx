"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/context/auth-context"
import { useOrganization } from "@/context/organization-context"
import { Loader2, Search, Users, Plus, Building2 } from "lucide-react"
import type { Club, ClubCategory } from "@/lib/types"
import { VerifiedBadge } from "@/components/clubs/verified-badge"
import { ClubsSkeleton } from "@/components/skeletons/clubs-skeleton"
import { EmptyState } from "@/components/empty-state"

const CATEGORIES: (ClubCategory | "all")[] = ["all", "Technical", "Cultural", "Sports", "Literary", "Social", "Other"]

export default function ClubsPage() {
    const { user } = useAuth()
    const { organization } = useOrganization()
    const [clubs, setClubs] = useState<Club[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState<ClubCategory | "all">("all")

    useEffect(() => {
        fetchClubs()
    }, [selectedCategory, organization])

    const fetchClubs = async () => {
        if (!organization?.id) return
        
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (selectedCategory !== "all") {
                params.set("category", selectedCategory)
            }
            params.set("orgId", organization.id)
            
            const res = await fetch(`/api/clubs?${params.toString()}`)
            const data = await res.json()
            setClubs(data.clubs || [])
        } catch (error) {
            console.error("Failed to fetch clubs:", error)
        } finally {
            setLoading(false)
        }
    }

    const filteredClubs = clubs.filter(club =>
        club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        club.description.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="min-h-screen pb-12">
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-primary/10 via-accent/5 to-background py-16">
                <div className="container max-w-6xl mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center"
                    >
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <Building2 className="h-6 w-6 text-accent" />
                            <span className="text-sm font-medium text-accent">Campus Communities</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
                            Clubs & Societies
                        </h1>
                        <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
                            Discover the vibrant communities at GLA University. Join clubs, participate in events,
                            and connect with like-minded students.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Filters */}
            <section className="container max-w-6xl mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
                    {/* Search */}
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search clubs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Category Filter */}
                    <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as ClubCategory | "all")}>
                        <TabsList className="flex-wrap h-auto gap-1">
                            {CATEGORIES.map((cat) => (
                                <TabsTrigger key={cat} value={cat} className="capitalize">
                                    {cat === "all" ? "All Clubs" : cat}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                </div>

                {/* Clubs Grid */}
                {loading ? (
                    <ClubsSkeleton />
                ) : filteredClubs.length === 0 ? (
                    <EmptyState
                        icon={Building2}
                        title="No Clubs Found"
                        description={searchQuery ? "Try a different search term" : "Be the first to register a club!"}
                        action={{
                            label: "Register a Club",
                            href: "/clubs/register"
                        }}
                    />
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4 }}
                        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                    >
                        {filteredClubs.map((club, index) => (
                            <motion.div
                                key={club.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.05 }}
                            >
                                <Link href={`/clubs/${club.id}`}>
                                    <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden">
                                        {/* Cover Image */}
                                        <div className="relative h-32 bg-gradient-to-br from-primary/20 to-accent/20">
                                            {club.coverImageURL && (
                                                <Image
                                                    src={club.coverImageURL}
                                                    alt={club.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            )}
                                            {/* Logo */}
                                            <div className="absolute -bottom-8 left-4">
                                                <div className="h-16 w-16 rounded-xl bg-background border-4 border-background shadow-md overflow-hidden">
                                                    <Image
                                                        src={club.logoURL || "/placeholder-logo.png"}
                                                        alt={club.name}
                                                        width={64}
                                                        height={64}
                                                        className="object-cover"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <CardHeader className="pt-10 pb-2">
                                            <div className="flex items-start justify-between">
                                                <h3 className="font-semibold text-lg line-clamp-1 flex items-center gap-1">
                                                    {club.name}
                                                    {club.verification?.status === "verified" && (
                                                        <VerifiedBadge showText={false} size="sm" />
                                                    )}
                                                </h3>
                                                <Badge variant="secondary" className="capitalize text-xs">
                                                    {club.category}
                                                </Badge>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="pb-2">
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {club.description}
                                            </p>
                                        </CardContent>

                                        <CardFooter className="pt-2">
                                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                <Users className="h-4 w-4" />
                                                <span>{club.members?.length || 0} members</span>
                                            </div>
                                        </CardFooter>
                                    </Card>
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </section>
        </div>
    )
}
