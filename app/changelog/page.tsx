import { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Sparkles, Bug, Zap, Gift, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = {
    title: "Changelog | GLA Gallery",
    description: "See what's new in GLA Gallery - Latest updates, features, and improvements.",
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
    feature: { icon: Sparkles, label: "New Feature", color: "bg-green-500/10 text-green-500" },
    fix: { icon: Bug, label: "Bug Fix", color: "bg-red-500/10 text-red-500" },
    improvement: { icon: Zap, label: "Improvement", color: "bg-blue-500/10 text-blue-500" },
    security: { icon: Shield, label: "Security", color: "bg-yellow-500/10 text-yellow-500" },
}

export default function ChangelogPage() {
    const releases: Release[] = [
        {
            version: "2.17.0",
            date: "February 14, 2026",
            changes: [
                { type: "feature", title: "GLA Bot (AI Assistant)", description: "Resilient campus guide with multi-provider fallback (Claude/Gemini/Groq) and Redis caching." },
                { type: "improvement", title: "Resilience & Error Handling", description: "Implemented global error boundaries and descriptive fallbacks for critical UI components." },
                { type: "improvement", title: "Documentation Overhaul", description: "Added comprehensive architecture guides, workflow diagrams, and implementation summaries." },
                { type: "security", title: "Chat Rate Limiting", description: "Intelligent sliding-window rate limiting (50 req/hr) to manage AI API usage." },
            ],
        },
        {
            version: "2.16.0",
            date: "February 12, 2026",
            changes: [
                { type: "feature", title: "Admin Analytics Dashboard", description: "New dashboard for admins to track user engagement, event growth, and post trends." },
                { type: "feature", title: "Club Verification System", description: "Structured workflow for club verification with document uploads and admin approval." },
                { type: "security", title: "Enhanced Data Validation", description: "Integrated Zod schemas and server-side sanitization across the entire data layer." },
                { type: "fix", title: "Middleware Redirect Logic", description: "Fixed infinite redirect loops in protected admin routes." },
            ],
        },
        {
            version: "2.15.0",
            date: "February 9, 2026",
            changes: [
                { type: "feature", title: "Command Menu (⌘K)", description: "Global search and quick actions accessible from anywhere with Ctrl+K." },
                { type: "feature", title: "Visual Skeleton System", description: "Added high-fidelity skeleton loaders for Events, Clubs, and Profile pages." },
                { type: "improvement", title: "Image Compression Engine", description: "Smart client-side pre-processing to reduce upload sizes by up to 80%." },
                { type: "feature", title: "Empty States", description: "Custom illustrations and help guides for empty lists and search results." },
            ],
        },
        {
            version: "2.14.0",
            date: "February 1, 2026",
            changes: [
                { type: "feature", title: "Points Wallet", description: "Unified view for point earnings, spendings, and gamification status." },
                { type: "feature", title: "Automated Email Alerts", description: "Improved notification engine for reward redemptions and event updates." },
                { type: "fix", title: "Points Deduction Fix", description: "Resolved race condition in point deduction during high-concurrency redemptions." },
            ],
        },
        {
            version: "2.13.0",
            date: "January 20, 2026",
            changes: [
                { type: "improvement", title: "Navigation Redesign", description: "Cleaner sidebar navigation with logical grouping for Explore and Community." },
                { type: "feature", title: "Admin Rewards Manager", description: "Complete CRUD interface for managing terminal-wide rewards." },
                { type: "feature", title: "Academic Calendar", description: "Digitized university calendar managed directly from the dashboard." },
            ],
        },
        {
            version: "2.12.0",
            date: "January 10, 2026",
            changes: [
                { type: "feature", title: "Rewards Store", description: "Redeem points for merch, skip-the-line passes, and more." },
                { type: "feature", title: "Redemption History", description: "Track fulfillment status of all your rewards." },
                { type: "feature", title: "Interactive Campus Map", description: "Venue locations and event mapping for better campus navigation." },
            ],
        },
        {
            version: "2.11.0",
            date: "December 20, 2025",
            changes: [
                { type: "feature", title: "Clubs & Societies", description: "Full digital identity for campus organizations with logos, covers, and member lists." },
                { type: "feature", title: "Club Recruitment", description: "Integrated recruitment management system for campus leaders." },
                { type: "feature", title: "Election Engine", description: "Secure digital voting for club office-bearer elections." },
            ],
        },
        {
            version: "2.10.0",
            date: "December 1, 2025",
            changes: [
                { type: "feature", title: "PWA Support", description: "Install GLA Gallery on home screen with offline caching support." },
                { type: "feature", title: "Notification Center", description: "Centralized inbox for likes, follows, and system alerts." },
                { type: "feature", title: "Smart In-App Banners", description: "Floating notifications for important campus announcements." },
            ],
        },
        {
            version: "2.0.0",
            date: "January 1, 2025",
            changes: [
                { type: "feature", title: "Next.js 15 Migration", description: "Project migrated to latest Next.js with App Router and Turbopack." },
                { type: "feature", title: "Glassmorphism UI", description: "Complete visual redesign with premium aesthetics and dark mode." },
                { type: "improvement", title: "Performance Boost", description: "3x faster page transitions and optimized image delivery." },
            ],
        },
        {
            version: "1.8.0",
            date: "November 15, 2024",
            changes: [
                { type: "feature", title: "Advanced Search", description: "Filter by date, user, and content type" },
                { type: "improvement", title: "Gallery Layout", description: "New masonry grid for better photo display" },
            ],
        },
        {
            version: "1.7.0",
            date: "September 20, 2024",
            changes: [
                { type: "feature", title: "Photo Albums", description: "Organize your photos into custom albums" },
                { type: "feature", title: "Bulk Upload", description: "Upload multiple photos at once" },
            ],
        },
        {
            version: "1.6.0",
            date: "July 25, 2024",
            changes: [
                { type: "feature", title: "Direct Messages", description: "Send private messages to other users" },
                { type: "improvement", title: "Privacy Controls", description: "Control who can see your posts and profile" },
            ],
        },
        {
            version: "1.5.0",
            date: "May 30, 2024",
            changes: [
                { type: "feature", title: "Search", description: "Find posts, users, and tags across the platform" },
                { type: "improvement", title: "Performance", description: "Faster image loading and smoother scrolling" },
            ],
        },
        {
            version: "1.4.0",
            date: "March 15, 2024",
            changes: [
                { type: "feature", title: "Hashtags", description: "Add hashtags to posts for better discoverability" },
                { type: "feature", title: "Trending", description: "Browse trending posts and popular hashtags" },
            ],
        },
        {
            version: "1.3.0",
            date: "January 10, 2024",
            changes: [
                { type: "feature", title: "Profile Editing", description: "Update your bio, profile picture, and social links" },
                { type: "improvement", title: "Mobile Experience", description: "Better touch gestures and responsive design" },
            ],
        },
        {
            version: "1.2.0",
            date: "November 5, 2023",
            changes: [
                { type: "feature", title: "Image Filters", description: "Apply filters before uploading your photos" },
                { type: "fix", title: "Upload Stability", description: "Fixed issues with large file uploads" },
            ],
        },
        {
            version: "1.1.0",
            date: "September 20, 2023",
            changes: [
                { type: "feature", title: "Comment Replies", description: "Reply to comments and have conversations" },
                { type: "improvement", title: "Notifications", description: "Get notified when someone likes or comments" },
            ],
        },
        {
            version: "1.0.0",
            date: "August 1, 2023",
            changes: [
                { type: "feature", title: "Initial Release", description: "Photo gallery with likes, comments, and user profiles" },
                { type: "feature", title: "Google Sign-in", description: "Quick and secure authentication with GLA email restriction" },
            ],
        },
    ]

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <Link href="/">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Home
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-12">
                {/* Hero */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full mb-6">
                        <Gift className="h-4 w-4" />
                        <span className="text-sm font-medium">What&apos;s New</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-4">Changelog</h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Stay up to date with all the latest features, improvements, and fixes in GLA Gallery.
                    </p>
                </div>

                {/* Timeline */}
                <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-border hidden md:block" />

                    <div className="space-y-12">
                        {releases.map((release, index) => (
                            <div key={release.version} className="relative">
                                {/* Timeline dot */}
                                <div className="absolute left-2 w-5 h-5 bg-accent rounded-full border-4 border-background hidden md:block" />

                                <div className="md:ml-12">
                                    {/* Version header */}
                                    <div className="flex flex-wrap items-center gap-3 mb-4">
                                        <h2 className="text-2xl font-bold">v{release.version}</h2>
                                        <Badge variant="outline" className="text-muted-foreground">
                                            {release.date}
                                        </Badge>
                                        {index === 0 && (
                                            <Badge className="bg-accent text-accent-foreground">Latest</Badge>
                                        )}
                                    </div>

                                    {/* Changes */}
                                    <div className="space-y-3">
                                        {release.changes.map((change, i) => {
                                            const config = typeConfig[change.type]
                                            const Icon = config.icon

                                            return (
                                                <div
                                                    key={i}
                                                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                                                >
                                                    <div className={`p-1.5 rounded-md ${config.color}`}>
                                                        <Icon className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{change.title}</div>
                                                        {change.description && (
                                                            <div className="text-sm text-muted-foreground">
                                                                {change.description}
                                                            </div>
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
