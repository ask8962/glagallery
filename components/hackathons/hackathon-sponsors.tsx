"use client"

import { Sponsor, SponsorTier } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Award, Star, Medal, Trophy } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface HackathonSponsorsProps {
    sponsors: Sponsor[]
    className?: string
}

const tierOrder: SponsorTier[] = ["platinum", "gold", "silver", "bronze", "partner"]

const tierConfig: Record<SponsorTier, {
    label: string
    icon: React.ReactNode
    color: string
    bgColor: string
    size: string
}> = {
    platinum: {
        label: "Platinum",
        icon: <Trophy className="h-4 w-4" />,
        color: "text-cyan-400",
        bgColor: "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500/30",
        size: "h-24"
    },
    gold: {
        label: "Gold",
        icon: <Star className="h-4 w-4" />,
        color: "text-yellow-400",
        bgColor: "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30",
        size: "h-20"
    },
    silver: {
        label: "Silver",
        icon: <Award className="h-4 w-4" />,
        color: "text-gray-300",
        bgColor: "bg-gradient-to-r from-gray-400/20 to-slate-400/20 border-gray-400/30",
        size: "h-16"
    },
    bronze: {
        label: "Bronze",
        icon: <Medal className="h-4 w-4" />,
        color: "text-orange-400",
        bgColor: "bg-gradient-to-r from-orange-500/20 to-amber-600/20 border-orange-500/30",
        size: "h-14"
    },
    partner: {
        label: "Partner",
        icon: null,
        color: "text-muted-foreground",
        bgColor: "bg-muted/50 border-muted",
        size: "h-12"
    }
}

export function HackathonSponsors({ sponsors, className = "" }: HackathonSponsorsProps) {
    if (!sponsors || sponsors.length === 0) {
        return null
    }

    // Group sponsors by tier
    const sponsorsByTier = tierOrder.reduce((acc, tier) => {
        const tierSponsors = sponsors.filter(s => s.tier === tier)
        if (tierSponsors.length > 0) {
            acc[tier] = tierSponsors
        }
        return acc
    }, {} as Record<SponsorTier, Sponsor[]>)

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>Our Sponsors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {tierOrder.map(tier => {
                    const tierSponsors = sponsorsByTier[tier]
                    if (!tierSponsors) return null

                    const config = tierConfig[tier]

                    return (
                        <div key={tier} className="space-y-3">
                            <div className="flex items-center gap-2">
                                {config.icon && (
                                    <span className={config.color}>{config.icon}</span>
                                )}
                                <Badge variant="outline" className={`${config.color} border-current`}>
                                    {config.label} Sponsor{tierSponsors.length > 1 ? "s" : ""}
                                </Badge>
                            </div>
                            <div className={`grid gap-4 ${tier === "platinum" ? "grid-cols-1 md:grid-cols-2" :
                                    tier === "gold" ? "grid-cols-2 md:grid-cols-3" :
                                        "grid-cols-3 md:grid-cols-4"
                                }`}>
                                {tierSponsors.map(sponsor => (
                                    <SponsorCard key={sponsor.id} sponsor={sponsor} tier={tier} />
                                ))}
                            </div>
                        </div>
                    )
                })}
            </CardContent>
        </Card>
    )
}

function SponsorCard({ sponsor, tier }: { sponsor: Sponsor; tier: SponsorTier }) {
    const config = tierConfig[tier]

    const content = (
        <div className={`relative ${config.size} rounded-lg border ${config.bgColor} p-4 flex items-center justify-center transition-all hover:scale-105 hover:shadow-lg cursor-pointer group`}>
            <Image
                src={sponsor.logoURL}
                alt={sponsor.name}
                fill
                className="object-contain p-3"
            />
            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                <div className="text-center text-white text-sm">
                    <p className="font-semibold">{sponsor.name}</p>
                    {sponsor.website && (
                        <ExternalLink className="h-3 w-3 mx-auto mt-1" />
                    )}
                </div>
            </div>
        </div>
    )

    if (sponsor.website) {
        return (
            <Link href={sponsor.website} target="_blank" rel="noopener noreferrer">
                {content}
            </Link>
        )
    }

    return content
}
