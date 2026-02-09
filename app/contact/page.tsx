"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Mail, MessageSquare, Send, Loader2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { useAuth } from "@/context/auth-context"

export default function ContactPage() {
    const { user, profile } = useAuth()
    const [sending, setSending] = useState(false)
    const [sent, setSent] = useState(false)
    const [formData, setFormData] = useState({
        name: profile?.name || "",
        email: user?.email || "",
        subject: "",
        category: "",
        message: "",
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name || !formData.email || !formData.category || !formData.message) {
            toast.error("Please fill in all required fields")
            return
        }

        setSending(true)

        // Simulate sending (in production, this would send to an API)
        await new Promise((resolve) => setTimeout(resolve, 1500))

        // For now, we'll create a mailto link as fallback
        const mailtoLink = `mailto:anukalp.gupta_cs23@gla.ac.in?subject=[${formData.category}] ${formData.subject}&body=From: ${formData.name} (${formData.email})%0D%0A%0D%0A${formData.message}`

        setSending(false)
        setSent(true)
        toast.success("Your message has been recorded!")

        // Open email client as backup
        window.open(mailtoLink, "_blank")
    }

    const categories = [
        { value: "general", label: "General Inquiry" },
        { value: "bug", label: "Bug Report" },
        { value: "feature", label: "Feature Request" },
        { value: "account", label: "Account Issue" },
        { value: "hackathon", label: "Hackathon Support" },
        { value: "other", label: "Other" },
    ]

    if (sent) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center p-8">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Message Sent!</h1>
                    <p className="text-muted-foreground mb-6">
                        Thank you for contacting us. We'll get back to you soon.
                    </p>
                    <Link href="/">
                        <Button>Back to Home</Button>
                    </Link>
                </div>
            </div>
        )
    }

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
                <div className="grid md:grid-cols-2 gap-12">
                    {/* Left - Info */}
                    <div>
                        <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full mb-6">
                            <MessageSquare className="h-4 w-4" />
                            <span className="text-sm font-medium">Contact Us</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold mb-4">
                            Get in Touch
                        </h1>
                        <p className="text-muted-foreground mb-8">
                            Have a question, suggestion, or found a bug? We'd love to hear from you!
                            Fill out the form and we'll get back to you as soon as possible.
                        </p>

                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-accent/10 rounded-lg">
                                    <Mail className="h-5 w-5 text-accent" />
                                </div>
                                <div>
                                    <h3 className="font-medium">Email</h3>
                                    <a
                                        href="mailto:anukalp.gupta_cs23@gla.ac.in"
                                        className="text-muted-foreground hover:text-accent"
                                    >
                                        anukalp.gupta_cs23@gla.ac.in
                                    </a>
                                </div>
                            </div>

                            <div className="p-4 bg-muted/50 rounded-xl">
                                <h3 className="font-medium mb-2">Response Time</h3>
                                <p className="text-sm text-muted-foreground">
                                    We typically respond within 24-48 hours during weekdays.
                                    For urgent issues, please mention "URGENT" in your subject.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right - Form */}
                    <div className="bg-card border rounded-xl p-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Your name"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="your.email@gla.ac.in"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category">Category *</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.value} value={cat.value}>
                                                {cat.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject</Label>
                                <Input
                                    id="subject"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    placeholder="Brief summary of your inquiry"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="message">Message *</Label>
                                <Textarea
                                    id="message"
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    placeholder="Describe your question or issue in detail..."
                                    rows={5}
                                    required
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={sending}>
                                {sending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4 mr-2" />
                                        Send Message
                                    </>
                                )}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
