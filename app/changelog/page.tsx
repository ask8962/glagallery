import { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Sparkles, Bug, Zap, Gift, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = {
    title: "Changelog | CampusHub",
    description: "See what's new in CampusHub - Latest updates, features, and improvements.",
}

type ChangeType = "feature" | "fix" | "improvement" | "security"

interface Change {
    type: ChangeType
    title: string
    description?: string
}

interface Release {
    version: string
    date: string
    changes: Change[]
}

const typeConfig = {
    feature: { icon: Sparkles, label: "New Feature", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
    fix: { icon: Bug, label: "Bug Fix", color: "text-rose-400 bg-rose-400/10 border-rose-400/20" },
    improvement: { icon: Zap, label: "Improvement", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
    security: { icon: Shield, label: "Security", color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
}

export default function ChangelogPage() {
    const releases: Release[] = [
        {
            version: "2.33.0",
            date: "April 24, 2026",
            changes: [
                { type: "feature", title: "Welcome Email System", description: "Beautiful dark-themed welcome emails automatically sent to every new user on first sign-up." },
                { type: "fix", title: "User Search Fix", description: "Search Users page now correctly shows college-scoped and global users based on organization context." },
                { type: "fix", title: "About Section Image", description: "Replaced broken campus hero image with a high-quality working alternative." },
                { type: "improvement", title: "Onboard API Stability", description: "Fixed Firebase Admin import in the self-serve onboarding API route for reliable deployments." },
            ],
        },
        {
            version: "2.32.0",
            date: "April 24, 2026",
            changes: [
                { type: "feature", title: "NAAC/NBA Report Generator", description: "One-click PDF export of accreditation-ready reports covering events, hackathons, clubs, and student engagement metrics." },
                { type: "feature", title: "Self-Serve College Onboarding", description: "New institutions can now sign up directly from the landing page and get a live subdomain in under 2 minutes." },
                { type: "feature", title: "SaaS Landing Page", description: "Complete redesign with onboarding form, feature showcase, social proof badges, and FAQ section." },
                { type: "improvement", title: "Super Admin Global Data", description: "Admin dashboard stats, user management, events, and broadcasts now correctly show cross-tenant data for super admins." },
            ],
        },
        {
            version: "2.30.0",
            date: "February 2, 2026",
            changes: [
                { type: "improvement", title: "Resilience & Error Handling", description: "Implemented global error boundaries and descriptive fallbacks for critical UI components." },
                { type: "security", title: "Chat Rate Limiting", description: "Intelligent sliding-window rate limiting (50 req/hr) to manage AI API usage." },
            ],
        },
        {
            version: "2.29.0",
            date: "January 21, 2026",
            changes: [
                { type: "feature", title: "Admin Analytics Dashboard", description: "New dashboard for admins to track user engagement, event growth, and post trends." },
            ],
        },
        {
            version: "2.28.0",
            date: "January 9, 2026",
            changes: [
                { type: "feature", title: "Club Verification System", description: "Structured workflow for club verification with document uploads and admin approval." },
            ],
        },
        {
            version: "2.27.0",
            date: "December 28, 2025",
            changes: [
                { type: "security", title: "Enhanced Data Validation", description: "Integrated Zod schemas and server-side sanitization across the entire data layer." },
            ],
        },
        {
            version: "2.26.0",
            date: "December 16, 2025",
            changes: [
                { type: "fix", title: "Middleware Redirect Logic", description: "Fixed infinite redirect loops in protected admin routes." },
            ],
        },
        {
            version: "2.25.0",
            date: "December 4, 2025",
            changes: [
                { type: "feature", title: "Command Menu (⌘K)", description: "Global search and quick actions accessible from anywhere with Ctrl+K." },
            ],
        },
        {
            version: "2.24.0",
            date: "November 22, 2025",
            changes: [
                { type: "feature", title: "Visual Skeleton System", description: "Added high-fidelity skeleton loaders for Events, Clubs, and Profile pages." },
            ],
        },
        {
            version: "2.23.0",
            date: "November 10, 2025",
            changes: [
                { type: "improvement", title: "Image Compression Engine", description: "Smart client-side pre-processing to reduce upload sizes by up to 80%." },
            ],
        },
        {
            version: "2.22.0",
            date: "October 29, 2025",
            changes: [
                { type: "feature", title: "Empty States", description: "Custom illustrations and help guides for empty lists and search results." },
            ],
        },
        {
            version: "2.21.0",
            date: "October 17, 2025",
            changes: [
                { type: "feature", title: "Points Wallet", description: "Unified view for point earnings, spendings, and gamification status." },
            ],
        },
        {
            version: "2.20.0",
            date: "October 5, 2025",
            changes: [
                { type: "feature", title: "Automated Email Alerts", description: "Improved notification engine for reward redemptions and event updates." },
            ],
        },
        {
            version: "2.19.0",
            date: "September 23, 2025",
            changes: [
                { type: "fix", title: "Points Deduction Fix", description: "Resolved race condition in point deduction during high-concurrency redemptions." },
            ],
        },
        {
            version: "2.18.0",
            date: "September 11, 2025",
            changes: [
                { type: "improvement", title: "Navigation Redesign", description: "Cleaner sidebar navigation with logical grouping for Explore and Community." },
            ],
        },
        {
            version: "2.17.0",
            date: "August 30, 2025",
            changes: [
                { type: "feature", title: "Admin Rewards Manager", description: "Complete CRUD interface for managing terminal-wide rewards." },
            ],
        },
        {
            version: "2.16.0",
            date: "August 18, 2025",
            changes: [
                { type: "feature", title: "Academic Calendar", description: "Digitized university calendar managed directly from the dashboard." },
            ],
        },
        {
            version: "2.15.0",
            date: "August 6, 2025",
            changes: [
                { type: "feature", title: "Rewards Store (Beta)", description: "Experimental release of the campus point redemption system." },
            ],
        },
        {
            version: "2.14.0",
            date: "July 25, 2025",
            changes: [
                { type: "feature", title: "Rewards Store", description: "Redeem points for merch, skip-the-line passes, and more." },
            ],
        },
        {
            version: "2.13.0",
            date: "July 13, 2025",
            changes: [
                { type: "feature", title: "Redemption History", description: "Track fulfillment status of all your rewards." },
            ],
        },
        {
            version: "2.12.0",
            date: "July 1, 2025",
            changes: [
                { type: "feature", title: "Interactive Campus Map", description: "Venue locations and event mapping for better campus navigation." },
            ],
        },
        {
            version: "2.11.0",
            date: "June 19, 2025",
            changes: [
                { type: "feature", title: "Clubs & Societies", description: "Full digital identity for campus organizations with logos, covers, and member lists." },
            ],
        },
        {
            version: "2.10.0",
            date: "June 7, 2025",
            changes: [
                { type: "feature", title: "Club Recruitment", description: "Integrated recruitment management system for campus leaders." },
            ],
        },
        {
            version: "2.0.9",
            date: "May 26, 2025",
            changes: [
                { type: "feature", title: "Election Engine", description: "Secure digital voting for club office-bearer elections." },
            ],
        },
        {
            version: "2.0.8",
            date: "May 14, 2025",
            changes: [
                { type: "feature", title: "PWA Support", description: "Install CampusHub on home screen with offline caching support." },
            ],
        },
        {
            version: "2.0.7",
            date: "May 2, 2025",
            changes: [
                { type: "feature", title: "Notification Center", description: "Centralized inbox for likes, follows, and system alerts." },
            ],
        },
        {
            version: "2.0.6",
            date: "April 20, 2025",
            changes: [
                { type: "feature", title: "Smart In-App Banners", description: "Floating notifications for important campus announcements." },
            ],
        },
        {
            version: "2.0.5",
            date: "April 8, 2025",
            changes: [
                { type: "feature", title: "Performance Polishing", description: "Optimized server-side rendering for complex list views." },
            ],
        },
        {
            version: "2.0.4",
            date: "March 27, 2025",
            changes: [
                { type: "improvement", title: "Performance Boost", description: "3x faster page transitions and optimized image delivery." },
            ],
        },
        {
            version: "2.0.3",
            date: "March 15, 2025",
            changes: [
                { type: "feature", title: "Glassmorphism UI Phase 2", description: "Extended premium aesthetics to admin and profile sections." },
            ],
        },
        {
            version: "2.0.2",
            date: "March 3, 2025",
            changes: [
                { type: "feature", title: "Glassmorphism UI", description: "Complete visual redesign with premium aesthetics and dark mode." },
            ],
        },
        {
            version: "2.0.1",
            date: "February 19, 2025",
            changes: [
                { type: "feature", title: "Next.js 15 Migration", description: "Project migrated to latest Next.js with App Router and Turbopack." },
            ],
        },
        {
            version: "2.0.0",
            date: "January 1, 2025",
            changes: [
                { type: "feature", title: "Core Platform Reboot", description: "Modernizing the foundational Event and Profile systems." },
            ],
        },
        {
            version: "1.0.0",
            date: "August 1, 2023",
            changes: [
                { type: "feature", title: "Initial Release", description: "Core platform launch with Event listings and User Profiles." },
                { type: "feature", title: "Google Sign-in", description: "Secure authentication restricted to CampusHub email domains." },
            ],
        },
    ]

    return (
        <div className="min-h-screen bg-[#0a0a0c] selection:bg-primary/30 relative">
            {/* Ambient Background Effects */}
            <div className="fixed top-0 inset-x-0 h-[500px] bg-gradient-to-b from-primary/10 via-primary/5 to-transparent pointer-events-none" />
            <div className="fixed -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
            <div className="fixed -bottom-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

            {/* Header */}
            <div className="border-b border-white/5 bg-background/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <Link href="/">
                        <Button variant="ghost" size="sm" className="hover:bg-white/5 text-muted-foreground hover:text-white transition-colors">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Home
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-20 relative z-10">
                {/* Hero */}
                <div className="text-center mb-24 relative">
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-full mb-8 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                        <Gift className="h-4 w-4" />
                        <span className="text-sm font-semibold tracking-wide">WHAT'S NEW</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
                        Changelog
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Track the evolution of CampusHub. New features, improvements, and fixes driving the ultimate campus experience.
                    </p>
                </div>

                {/* Glowing Timeline */}
                <div className="relative">
                    {/* Continuous glowing line */}
                    <div className="absolute left-6 md:left-8 top-4 bottom-4 w-[2px] bg-gradient-to-b from-primary via-primary/50 to-transparent hidden md:block" />

                    <div className="space-y-16 md:space-y-24">
                        {releases.map((release, index) => (
                            <div key={release.version} className="relative group">
                                {/* Timeline glow dot */}
                                <div className="absolute left-4 md:left-[23px] top-6 w-5 h-5 hidden md:flex items-center justify-center">
                                    <div className="absolute w-3 h-3 bg-primary rounded-full group-hover:scale-150 transition-transform duration-500" />
                                    <div className="absolute w-5 h-5 bg-primary/40 rounded-full animate-ping" />
                                </div>

                                <div className="md:ml-20">
                                    {/* Version Header Box */}
                                    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8 sticky top-24 z-20 backdrop-blur-md bg-[#0a0a0c]/80 py-4 -mx-4 px-4 md:mx-0 md:px-0 rounded-xl">
                                        <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                                            v{release.version}
                                        </h2>
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline" className="text-muted-foreground border-white/10 bg-white/5 backdrop-blur-sm px-3 py-1 text-sm">
                                                {release.date}
                                            </Badge>
                                            {index === 0 && (
                                                <Badge className="bg-primary text-primary-foreground shadow-[0_0_15px_rgba(59,130,246,0.5)] border-none">
                                                    Latest Release
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Glassmorphism Changes Cards */}
                                    <div className="space-y-4">
                                        {release.changes.map((change, i) => {
                                            const config = typeConfig[change.type]
                                            const Icon = config.icon

                                            return (
                                                <div
                                                    key={i}
                                                    className="flex items-start gap-4 p-5 md:p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.07] hover:border-white/20 transition-all duration-300 backdrop-blur-sm group/card"
                                                >
                                                    <div className={\`p-2.5 rounded-xl border \${config.color} shadow-lg shrink-0 group-hover/card:scale-110 transition-transform duration-300\`}>
                                                        <Icon className="h-5 w-5" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-3">
                                                            <h3 className="font-semibold text-lg text-white/90">{change.title}</h3>
                                                        </div>
                                                        {change.description && (
                                                            <p className="text-base text-muted-foreground leading-relaxed">
                                                                {change.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
