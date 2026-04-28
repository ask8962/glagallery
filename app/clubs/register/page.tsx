"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/context/auth-context"
import { GLASignInGuard } from "@/components/gla-signin-guard"
import { toast } from "sonner"
import { Loader2, Building2, CheckCircle } from "lucide-react"
import type { ClubCategory } from "@/lib/types"

const CATEGORIES: ClubCategory[] = ["Technical", "Cultural", "Sports", "Literary", "Social", "Other"]

export default function ClubRegisterPage() {
    const { user, profile, loading: authLoading, signIn } = useAuth()
    const router = useRouter()

    const [clubName, setClubName] = useState("")
    const [category, setCategory] = useState<ClubCategory | "">("")
    const [vision, setVision] = useState("")
    const [logoURL, setLogoURL] = useState("")
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    if (!authLoading && !user) {
        return (
            <GLASignInGuard
                onSignIn={signIn}
                title="Sign in to Register a Club"
                description="Only verified GLA students can register clubs and societies."
            />
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !category) return

        setLoading(true)
        try {
            const token = await user.getIdToken()
            const res = await fetch("/api/clubs/request", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    clubName,
                    category,
                    vision,
                    proposedLogoURL: logoURL || undefined,
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "Failed to submit request")
            }

            setSubmitted(true)
            toast.success("Request Submitted!", {
                description: "An admin will review your club request soon.",
            })

        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                >
                    <div className="h-20 w-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Request Submitted!</h1>
                    <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                        Your club registration request has been submitted for admin review.
                        You will be notified once it's approved.
                    </p>
                    <Button onClick={() => router.push("/clubs")}>
                        Back to Clubs
                    </Button>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen py-12">
            <div className="container max-w-2xl mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-8"
                >
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Building2 className="h-6 w-6 text-accent" />
                        <span className="text-sm font-medium text-accent">Register Your Club</span>
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Start Your Community</h1>
                    <p className="text-muted-foreground">
                        Fill out the form below to register your club or society on CampusHub.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle>Club Details</CardTitle>
                            <CardDescription>
                                Provide information about your club. An admin will review and approve your request.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="clubName">Club Name *</Label>
                                    <Input
                                        id="clubName"
                                        placeholder="e.g., Computer Science Association"
                                        value={clubName}
                                        onChange={(e) => setClubName(e.target.value)}
                                        required
                                        minLength={2}
                                        maxLength={100}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="category">Category *</Label>
                                    <Select value={category} onValueChange={(v) => setCategory(v as ClubCategory)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CATEGORIES.map((cat) => (
                                                <SelectItem key={cat} value={cat}>
                                                    {cat}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="vision">Vision & Purpose *</Label>
                                    <Textarea
                                        id="vision"
                                        placeholder="Describe your club's mission, goals, and what activities you plan to organize..."
                                        value={vision}
                                        onChange={(e) => setVision(e.target.value)}
                                        required
                                        minLength={20}
                                        maxLength={1000}
                                        className="min-h-[120px]"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {vision.length}/1000 characters (minimum 20)
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="logoURL">Logo URL (Optional)</Label>
                                    <Input
                                        id="logoURL"
                                        type="url"
                                        placeholder="https://example.com/logo.png"
                                        value={logoURL}
                                        onChange={(e) => setLogoURL(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Direct link to your club's logo. You can upload to the gallery first.
                                    </p>
                                </div>

                                <div className="bg-muted/50 rounded-lg p-4 text-sm">
                                    <p className="font-medium mb-1">What happens next?</p>
                                    <ol className="list-decimal list-inside text-muted-foreground space-y-1">
                                        <li>An admin will review your request</li>
                                        <li>Upon approval, your club page will be created</li>
                                        <li>You'll be assigned as the Club President</li>
                                        <li>You can then add members and post events</li>
                                    </ol>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={loading || !clubName || !category || vision.length < 20}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        "Submit Request"
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}
