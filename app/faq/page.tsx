import { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, HelpCircle, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

export const metadata: Metadata = {
    title: "FAQ | GLA Gallery",
    description: "Frequently Asked Questions about GLA Gallery - Get answers to common questions.",
}

export default function FAQPage() {
    const categories = [
        {
            name: "Getting Started",
            faqs: [
                {
                    question: "How do I sign in to GLA Gallery?",
                    answer: "Click 'Sign in with Google' on the homepage and use your official GLA University email (@gla.ac.in). Only GLA emails are allowed to access the platform.",
                },
                {
                    question: "Why can't I access the platform?",
                    answer: "GLA Gallery is exclusive to GLA University members. Make sure you're using your @gla.ac.in email address. If you're still having issues, try clearing your browser cache or using an incognito window.",
                },
                {
                    question: "Is there a mobile app?",
                    answer: "GLA Gallery is a web app that works on all devices. You can add it to your home screen for an app-like experience. Go to your browser menu and select 'Add to Home Screen'.",
                },
            ],
        },
        {
            name: "Uploading Content",
            faqs: [
                {
                    question: "What types of files can I upload?",
                    answer: "You can upload images (JPEG, PNG, GIF, WebP) and videos (MP4, WebM). Images are limited to 15MB and videos to 50MB. Files are automatically compressed for optimal quality.",
                },
                {
                    question: "How long do Stories last?",
                    answer: "Stories disappear automatically after 24 hours, just like Instagram Stories. Regular posts stay permanently unless you delete them.",
                },
                {
                    question: "Can I edit a post after uploading?",
                    answer: "Currently, you cannot edit posts after uploading. You can delete and re-upload if needed. We're working on adding edit functionality.",
                },
            ],
        },
        {
            name: "Privacy & Safety",
            faqs: [
                {
                    question: "Who can see my posts?",
                    answer: "Your posts are visible to all authenticated GLA University users. We don't allow public access to ensure campus privacy.",
                },
                {
                    question: "How do I report inappropriate content?",
                    answer: "Click the flag (report) icon on any post or comment. Select the reason for reporting and submit. Our moderation team will review it within 24-48 hours.",
                },
                {
                    question: "Can I delete my account?",
                    answer: "Yes, you can request account deletion by contacting us at ganukalp70@gmail.com. Your account and all associated data will be deleted within 30 days.",
                },
            ],
        },
        {
            name: "Hackathons",
            faqs: [
                {
                    question: "How do I register for a hackathon?",
                    answer: "Go to the Hackathons page, select an active hackathon, and click 'Register'. You can create a new team or join an existing one using a team code.",
                },
                {
                    question: "How do submissions work?",
                    answer: "Team leaders can submit projects before the deadline. Include your GitHub repository, demo link, and a short video explaining your project.",
                },
                {
                    question: "How is judging done?",
                    answer: "Judges score submissions based on criteria like Innovation, Technical Complexity, Design, and Impact. Scores are averaged to determine the final ranking.",
                },
            ],
        },
        {
            name: "Gamification & Points",
            faqs: [
                {
                    question: "How do I earn points?",
                    answer: "Earn points by: Uploading posts (+10), Getting likes (+2 each), Receiving comments (+3 each), Daily login (+5), and maintaining streaks (bonus points).",
                },
                {
                    question: "What are levels and badges?",
                    answer: "As you earn points, you level up and unlock badges. These appear on your profile and show your contribution to the community.",
                },
                {
                    question: "What's the leaderboard?",
                    answer: "The leaderboard ranks users by points. You can view weekly, monthly, or all-time rankings. Top contributors get special recognition.",
                },
            ],
        },
        {
            name: "Clubs & Verification",
            faqs: [
                {
                    question: "How do I get my club verified?",
                    answer: "Club presidents can request verification from the 'Manage Club' dashboard. You'll need to submit your club's registration number and supporting documents.",
                },
                {
                    question: "How do I register as Faculty?",
                    answer: "Go to your Profile page and click 'Register as Faculty'. You'll need to provide your Employee ID and Department details. Once verified by admin, you'll get the Faculty badge.",
                },
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
                        <HelpCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Help Center</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-4">
                        Frequently Asked Questions
                    </h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Find answers to common questions about GLA Gallery. Can't find what you're looking for?
                        Contact us at the bottom of this page.
                    </p>
                </div>

                {/* FAQ Categories */}
                <div className="space-y-8">
                    {categories.map((category) => (
                        <div key={category.name}>
                            <h2 className="text-xl font-semibold mb-4">{category.name}</h2>
                            <Accordion type="single" collapsible className="w-full">
                                {category.faqs.map((faq, index) => (
                                    <AccordionItem key={index} value={`${category.name}-${index}`}>
                                        <AccordionTrigger className="text-left">
                                            {faq.question}
                                        </AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground">
                                            {faq.answer}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </div>
                    ))}
                </div>

                {/* Contact */}
                <div className="mt-12 p-6 bg-muted/50 rounded-xl text-center">
                    <h2 className="text-lg font-semibold mb-2">Still have questions?</h2>
                    <p className="text-muted-foreground mb-4">
                        We're here to help!
                    </p>
                    <Link href="/contact">
                        <Button>
                            Contact Us
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
