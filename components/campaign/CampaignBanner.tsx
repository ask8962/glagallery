"use client"

import Link from "next/link"
import { Gift, ArrowRight } from "lucide-react"

export default function CampaignBanner() {
    return (
        <Link href="/claim-reward">
            <div className="relative overflow-hidden rounded-xl border bg-gradient-to-r from-yellow-500/10 via-accent/10 to-purple-500/10 hover:from-yellow-500/15 hover:via-accent/15 hover:to-purple-500/15 transition-all duration-300 p-4 group cursor-pointer">
                {/* Shimmer effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent" />

                <div className="flex items-center justify-between gap-3 relative">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-yellow-500/20">
                            <Gift className="h-5 w-5 text-yellow-500" />
                        </div>
                        <div>
                            <div className="font-semibold text-sm">
                                🎁 Get ₹30 – ₹50 Reward
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Limited time • Verified GLA students only
                            </div>
                        </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                </div>
            </div>
        </Link>
    )
}
