import { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Users, Camera, Trophy, Heart, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
    title: "About Us | CampusHub",
    description: "Learn about CampusHub - the campus memories and hackathon management platform for CampusHub students.",
}

export default function AboutPage() {
    const features = [
        {
            icon: Camera,
            title: "Campus Memories",
            description: "Share and preserve your favorite moments from campus life - from fests to farewells.",
        },
        {
            icon: Users,
            title: "Student Community",
            description: "Connect with fellow students, follow friends, and engage with shared memories.",
        },
        {
            icon: Trophy,
            title: "Hackathon Hub",
            description: "Organize, participate, and showcase your projects in campus hackathons.",
        },
        {
            icon: Heart,
            title: "Social Features",
            description: "Like, comment, share, and bookmark your favorite posts from the community.",
        },
        {
            icon: Sparkles,
            title: "Academic Calendar",
            description: "Stay updated with university events, holidays, and exam schedules.",
        },
    ]

    const stats = [
        { value: "2000+", label: "Students" },
        { value: "10K+", label: "Memories Shared" },
        { value: "50+", label: "Hackathons" },
        { value: "100K+", label: "Interactions" },
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
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full mb-6">
                        <Sparkles className="h-4 w-4" />
                        <span className="text-sm font-medium">About CampusHub</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-6">
                        Preserving Campus
                        <span className="text-accent block">Memories Forever</span>
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        CampusHub is the official platform for CampusHub students to share,
                        discover, and cherish campus moments. Built by students, for students.
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
                    {stats.map((stat) => (
                        <div key={stat.label} className="text-center p-6 rounded-xl bg-muted/50">
                            <div className="text-3xl font-bold text-accent mb-1">{stat.value}</div>
                            <div className="text-sm text-muted-foreground">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Features */}
                <div className="mb-16">
                    <h2 className="text-2xl font-bold text-center mb-8">What We Offer</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {features.map((feature) => (
                            <div key={feature.title} className="p-6 rounded-xl border bg-card">
                                <feature.icon className="h-10 w-10 text-accent mb-4" />
                                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                                <p className="text-muted-foreground">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mission */}
                <div className="bg-accent/5 rounded-2xl p-8 mb-16">
                    <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        We believe every moment at CampusHub deserves to be remembered.
                        From the first day of orientation to the final goodbye at farewell,
                        CampusHub serves as a digital yearbook where every student can contribute
                        and relive the memories that make college life special.
                    </p>
                </div>

                {/* Team */}
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Created By</h2>
                    <p className="text-muted-foreground mb-2">
                        <strong>Anukalp Gupta</strong>
                    </p>
                    <p className="text-sm text-muted-foreground">
                        B.Tech Computer Science, CampusHub (Batch 2023-27)
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                        <a href="mailto:ganukalp70@gmail.com" className="text-accent hover:underline">
                            ganukalp70@gmail.com
                        </a>
                    </p>
                </div>
            </div>
        </div>
    )
}
