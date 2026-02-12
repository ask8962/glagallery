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
            version: "2.16.0",
            date: "February 12, 2026",
            changes: [
                { type: "feature", title: "Club Verification System", description: "Clubs can now request official verification with document uploads and admin approval workflow" },
                { type: "feature", title: "Verified Badge", description: "Verified clubs display a blue ✅ badge next to their name on all pages" },
                { type: "feature", title: "Club Verification Dashboard", description: "Admins can view, approve, or reject club verification requests from the admin panel" },
                { type: "fix", title: "Admin Panel Access Fix", description: "Fixed middleware redirect loop that prevented admin panel access" },
                { type: "improvement", title: "Admin Email Validation", description: "Admin access check now uses case-insensitive email comparison" },
            ],
        },
        {
            version: "2.15.0",
            date: "February 9, 2026",
            changes: [
                { type: "feature", title: "Command Menu (⌘K)", description: "Quick search and navigation with Ctrl+K — find pages, features, and settings instantly" },
                { type: "feature", title: "Skeleton Loaders", description: "Beautiful loading states for Events, Clubs, Gallery, and Admin pages" },
                { type: "feature", title: "Empty State Components", description: "Helpful illustrations and CTAs when sections have no data" },
                { type: "improvement", title: "UX Polish — Phase 14", description: "Smoother transitions, consistent loading patterns, and improved visual feedback across the app" },
            ],
        },
        {
            version: "2.14.0",
            date: "February 1, 2026",
            changes: [
                { type: "feature", title: "Points Wallet", description: "Track all your point earnings and spendings in one place" },
                { type: "feature", title: "Email Notifications", description: "Get notified when your reward redemption is fulfilled or cancelled" },
                { type: "improvement", title: "Points Deduction Fix", description: "Points are now correctly deducted when redeeming rewards" },
            ],
        },
        {
            version: "2.13.0",
            date: "January 20, 2026",
            changes: [
                { type: "improvement", title: "Navigation Redesign", description: "Cleaner navigation with grouped 'Explore' and 'Community' menus" },
                { type: "feature", title: "Rewards Management", description: "Admins can now create, edit, and delete rewards from the dashboard" },
                { type: "feature", title: "Academic Calendar", description: "University academic dates managed from the admin panel" },
                { type: "feature", title: "Faculty Verification", description: "Admin tool to verify faculty accounts" },
            ],
        },
        {
            version: "2.12.0",
            date: "January 10, 2026",
            changes: [
                { type: "feature", title: "Rewards Store", description: "Redeem your points for exclusive rewards, merchandise, and privileges" },
                { type: "feature", title: "Redemption History", description: "Track your redeemed rewards and their fulfillment status" },
                { type: "feature", title: "Campus Map", description: "Interactive campus map to find venues and event locations" },
            ],
        },
        {
            version: "2.11.0",
            date: "December 20, 2025",
            changes: [
                { type: "feature", title: "Clubs & Societies", description: "Create and join campus clubs with dedicated profile pages, logos, and cover images" },
                { type: "feature", title: "Club Events", description: "Clubs can now host their own events with dedicated event listings" },
                { type: "feature", title: "Club Recruitment", description: "Open and close recruitment periods for campus clubs" },
                { type: "feature", title: "Club Elections", description: "Organize and manage digital club elections" },
            ],
        },
        {
            version: "2.10.0",
            date: "December 1, 2025",
            changes: [
                { type: "feature", title: "Progressive Web App", description: "Install GLA Gallery on your phone or desktop for quick access" },
                { type: "improvement", title: "Faster Loading", description: "Added smooth loading animations and skeleton loaders" },
                { type: "feature", title: "Notification Center", description: "Centralized inbox for all notifications with read/unread state" },
                { type: "feature", title: "Notification Permission Banner", description: "Smart banner prompting users to enable push notifications" },
            ],
        },
        {
            version: "2.9.0",
            date: "November 10, 2025",
            changes: [
                { type: "feature", title: "Event Attendance", description: "Track your event attendance and earn reliability badges" },
                { type: "feature", title: "Attendee Export", description: "Event organizers can export attendee lists as CSV" },
                { type: "feature", title: "No-Show Processing", description: "Automated penalties for users who book but don't attend events" },
                { type: "security", title: "Security Logging", description: "Comprehensive audit trail for admin actions and critical events" },
            ],
        },
        {
            version: "2.8.0",
            date: "October 20, 2025",
            changes: [
                { type: "feature", title: "Campus Events", description: "Browse, register, and attend campus events with QR-coded tickets" },
                { type: "feature", title: "Event Calendar", description: "View all upcoming events in a monthly calendar view" },
                { type: "feature", title: "Waitlist System", description: "Auto-promote from waitlist when attendees cancel" },
                { type: "feature", title: "Calendar Export", description: "Download .ics files for events to add to your calendar" },
            ],
        },
        {
            version: "2.7.0",
            date: "September 25, 2025",
            changes: [
                { type: "feature", title: "Broadcast Emails", description: "Admins can send targeted announcements to all users or selected groups" },
                { type: "improvement", title: "Email Templates", description: "Beautiful email designs for all notification types" },
                { type: "feature", title: "Resume Builder", description: "Generate professional PDF resumes from your profile data" },
            ],
        },
        {
            version: "2.6.0",
            date: "August 15, 2025",
            changes: [
                { type: "feature", title: "User Profiles", description: "View any user's profile, followers, and badge collection" },
                { type: "feature", title: "Badge Tiers", description: "Earn Bronze, Silver, and Gold badges based on your activity" },
                { type: "feature", title: "Online Presence", description: "See who's online with real-time presence indicators" },
            ],
        },
        {
            version: "2.5.0",
            date: "July 10, 2025",
            changes: [
                { type: "feature", title: "Stories", description: "Share photos and videos that disappear after 24 hours" },
                { type: "feature", title: "Share & Download", description: "Share posts to social media or download with watermark" },
                { type: "feature", title: "Report System", description: "Flag inappropriate content for admin review" },
            ],
        },
        {
            version: "2.4.0",
            date: "June 5, 2025",
            changes: [
                { type: "feature", title: "Push Notifications", description: "Get instant alerts for likes, comments, and follows via Firebase Cloud Messaging" },
                { type: "feature", title: "Two-Factor Auth", description: "Added extra security with email verification codes (OTP)" },
                { type: "security", title: "Rate Limiting", description: "Per-IP rate limiting on all sensitive endpoints via Upstash Redis" },
            ],
        },
        {
            version: "2.3.0",
            date: "May 1, 2025",
            changes: [
                { type: "feature", title: "Gamification", description: "Earn points, level up, maintain login streaks, and compete on the leaderboard" },
                { type: "feature", title: "Hackathon Check-in", description: "Teams get unique QR codes for venue entry with sound effects on successful scan" },
                { type: "improvement", title: "Image Compression", description: "Automatic client-side image compression before upload for faster loading" },
            ],
        },
        {
            version: "2.2.0",
            date: "March 20, 2025",
            changes: [
                { type: "feature", title: "Hackathons", description: "Create teams, submit projects, and compete in hackathons" },
                { type: "feature", title: "Live Leaderboard", description: "Real-time ranking and scoring during hackathon events" },
                { type: "feature", title: "Judging System", description: "Multi-criteria scoring with customizable rubrics" },
                { type: "feature", title: "Mentorship", description: "Assign mentors to hackathon teams for guidance" },
            ],
        },
        {
            version: "2.1.0",
            date: "February 10, 2025",
            changes: [
                { type: "feature", title: "Notifications", description: "In-app and email notifications for all social activity" },
                { type: "feature", title: "Bookmarks", description: "Save posts for later viewing" },
                { type: "feature", title: "Follow System", description: "Follow friends and see their posts in your feed" },
                { type: "feature", title: "Comments & Replies", description: "Nested comment threads with reply functionality" },
            ],
        },
        {
            version: "2.0.0",
            date: "January 1, 2025",
            changes: [
                { type: "feature", title: "Complete Redesign", description: "Fresh new look with dark mode support and glassmorphism effects" },
                { type: "feature", title: "Video Support", description: "Upload and share video memories alongside photos" },
                { type: "improvement", title: "Performance Boost", description: "3x faster page loads with Turbopack and optimized bundle splitting" },
                { type: "security", title: "Security Headers", description: "Added CSP, X-Frame-Options, HSTS, and other security headers" },
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
