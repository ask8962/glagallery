"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/firebase"
import {
    Gift,
    PartyPopper,
    Shield,
    ArrowLeft,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    Upload,
    Calendar,
    Users,
    ExternalLink,
    Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface ClaimStatus {
    claimed: boolean
    amount?: number
    status?: string
    claimedAt?: string
    referralBonus?: number
}

export default function ClaimRewardPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [authLoading, setAuthLoading] = useState(true)
    const [status, setStatus] = useState<ClaimStatus | null>(null)
    const [statusLoading, setStatusLoading] = useState(true)
    const [claiming, setClaiming] = useState(false)
    const [claimResult, setClaimResult] = useState<{
        success: boolean
        amount?: number
        message?: string
        error?: string
    } | null>(null)
    const [consent, setConsent] = useState(false)
    const [phoneNumber, setPhoneNumber] = useState("")
    const [error, setError] = useState<string | null>(null)

    // Listen for auth state
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((u) => {
            setUser(u)
            setAuthLoading(false)
        })
        return () => unsubscribe()
    }, [])

    // Fetch claim status once authenticated
    const fetchStatus = useCallback(async () => {
        if (!user) return
        setStatusLoading(true)
        try {
            const token = await user.getIdToken()
            const res = await fetch("/api/campaign/status", {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (res.ok) {
                const data = await res.json()
                setStatus(data)
            }
        } catch (err) {
            console.error("Failed to fetch status:", err)
        } finally {
            setStatusLoading(false)
        }
    }, [user])

    useEffect(() => {
        if (user) fetchStatus()
    }, [user, fetchStatus])

    // Handle claim
    const handleClaim = async () => {
        if (!user || !consent) return

        // Validate Phone
        const cleanPhone = phoneNumber.replace(/\D/g, "")
        if (cleanPhone.length !== 10) {
            setError("Please enter a valid 10-digit phone number.")
            return
        }

        setClaiming(true)
        setError(null)

        try {
            const token = await user.getIdToken()

            // Check for referrer UID from URL params
            const urlParams = new URLSearchParams(window.location.search)
            const referrerUid = urlParams.get("ref") || undefined

            const res = await fetch("/api/campaign/claim", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    consent: true,
                    referrerUid,
                    phoneNumber: cleanPhone
                }),
            })

            const data = await res.json()

            if (res.ok && data.success) {
                setClaimResult({
                    success: true,
                    amount: data.amount,
                    message: data.message,
                })
                setStatus({ claimed: true, amount: data.amount, status: data.status })
            } else if (res.status === 409) {
                // Already claimed
                setStatus({ claimed: true, amount: data.amount, status: data.status })
                setClaimResult({
                    success: false,
                    error: data.error || "Already claimed.",
                })
            } else if (res.status === 429) {
                setError("Too many attempts. Please wait and try again later.")
            } else {
                setError(data.error || "Something went wrong. Please try again.")
            }
        } catch (err) {
            setError("Network error. Please check your connection.")
        } finally {
            setClaiming(false)
        }
    }

    // ── Auth Loading ────────────────────────────────────────────────
    if (authLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    // ── Not Logged In ───────────────────────────────────────────────
    if (!user) {
        return (
            <div className="min-h-screen bg-background">
                <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
                    <div className="max-w-2xl mx-auto px-4 py-4">
                        <Link href="/">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Home
                            </Button>
                        </Link>
                    </div>
                </div>
                <div className="max-w-md mx-auto px-4 py-20 text-center">
                    <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
                    <h1 className="text-2xl font-bold mb-3">Sign In Required</h1>
                    <p className="text-muted-foreground mb-6">
                        Please sign in with your GLA University account to claim your reward.
                    </p>
                    <Button onClick={() => router.push("/")} size="lg">
                        Go to Login
                    </Button>
                </div>
            </div>
        )
    }

    // ── Already Claimed ─────────────────────────────────────────────
    if (status?.claimed) {
        return (
            <div className="min-h-screen bg-background">
                <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
                    <div className="max-w-2xl mx-auto px-4 py-4">
                        <Link href="/">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Home
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="max-w-lg mx-auto px-4 py-12">
                    {/* Success Card */}
                    <div className="bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-background border border-green-500/20 rounded-2xl p-8 text-center mb-8">
                        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold mb-2">Reward Claimed!</h1>
                        <div className="text-5xl font-bold text-green-500 mb-3">
                            ₹{status.amount}
                        </div>
                        <Badge
                            variant="outline"
                            className={
                                status.status === "flagged"
                                    ? "text-yellow-500 border-yellow-500/30"
                                    : "text-green-500 border-green-500/30"
                            }
                        >
                            {status.status === "flagged" ? "Under Review" : "Claimed"}
                        </Badge>
                        {(status.referralBonus ?? 0) > 0 && (
                            <p className="text-sm text-muted-foreground mt-3">
                                + ₹{status.referralBonus} referral bonus earned
                            </p>
                        )}
                    </div>

                    {/* Referral Link */}
                    <div className="bg-muted/30 border rounded-xl p-5 mb-6">
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-accent" />
                            Share & Earn ₹10
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                            Share your referral link. You earn ₹10 for each friend who claims.
                        </p>
                        <div className="bg-background border rounded-lg px-3 py-2 text-sm break-all font-mono">
                            {typeof window !== "undefined"
                                ? `${window.location.origin}/claim-reward?ref=${user.uid}`
                                : ""}
                        </div>
                    </div>

                    {/* Next Actions */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                            Continue Exploring
                        </h3>
                        <Link href="/profile" className="block">
                            <div className="flex items-center gap-3 p-4 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors">
                                <Upload className="h-5 w-5 text-blue-500" />
                                <div>
                                    <div className="font-medium">Upload Profile Photo</div>
                                    <div className="text-sm text-muted-foreground">
                                        Complete your profile to stand out
                                    </div>
                                </div>
                                <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
                            </div>
                        </Link>
                        <Link href="/events" className="block">
                            <div className="flex items-center gap-3 p-4 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors">
                                <Calendar className="h-5 w-5 text-purple-500" />
                                <div>
                                    <div className="font-medium">Browse Events</div>
                                    <div className="text-sm text-muted-foreground">
                                        Find upcoming campus events
                                    </div>
                                </div>
                                <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
                            </div>
                        </Link>
                        <Link href="/clubs" className="block">
                            <div className="flex items-center gap-3 p-4 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors">
                                <Users className="h-5 w-5 text-orange-500" />
                                <div>
                                    <div className="font-medium">Join a Club</div>
                                    <div className="text-sm text-muted-foreground">
                                        Connect with campus communities
                                    </div>
                                </div>
                                <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    // ── Claim Success (just claimed) ────────────────────────────────
    if (claimResult?.success) {
        return (
            <div className="min-h-screen bg-background">
                <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
                    <div className="max-w-2xl mx-auto px-4 py-4">
                        <Link href="/">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Home
                            </Button>
                        </Link>
                    </div>
                </div>
                <div className="max-w-md mx-auto px-4 py-16 text-center">
                    <div className="relative mb-8">
                        <PartyPopper className="h-20 w-20 text-yellow-500 mx-auto animate-bounce" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Congratulations! 🎉</h1>
                    <p className="text-muted-foreground mb-6">{claimResult.message}</p>
                    <div className="text-6xl font-bold text-green-500 mb-8">
                        ₹{claimResult.amount}
                    </div>
                    <Button onClick={() => fetchStatus()} size="lg" className="w-full">
                        View Your Reward Status
                    </Button>
                </div>
            </div>
        )
    }

    // ── Main Claim Form ─────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-2xl mx-auto px-4 py-4">
                    <Link href="/">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Home
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 py-12">
                {/* Hero */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-4 py-2 rounded-full mb-6">
                        <Gift className="h-4 w-4" />
                        <span className="text-sm font-medium">Limited Time Offer</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-3">
                        Claim Your Reward
                    </h1>
                    <p className="text-muted-foreground">
                        Get ₹30 – ₹50 instantly! Available for verified GLA students only.
                    </p>
                </div>

                {/* Reward Range Card */}
                <div className="bg-gradient-to-br from-accent/10 via-purple-500/5 to-background border border-accent/20 rounded-2xl p-6 mb-6 text-center">
                    <div className="text-sm text-muted-foreground mb-2">
                        Your reward will be between
                    </div>
                    <div className="text-4xl font-bold">
                        <span className="text-accent">₹30</span>
                        <span className="text-muted-foreground mx-2">–</span>
                        <span className="text-accent">₹50</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                        Amount is randomly generated on our servers
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="flex items-start gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/5 mb-6">
                        <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-red-500">{error}</p>
                    </div>
                )}

                {/* Phone Number Input */}
                <div className="space-y-2 mb-6 text-left">
                    <label className="text-sm font-medium">Phone Number (UPI Linked)</label>
                    <input
                        type="tel"
                        placeholder="Enter 10-digit number"
                        value={phoneNumber}
                        onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "").slice(0, 10)
                            setPhoneNumber(val)
                        }}
                        className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <p className="text-xs text-muted-foreground">
                        Required for reward verification.
                    </p>
                </div>

                {/* Consent & Disclaimer */}
                <div className="space-y-4 mb-6">
                    <label className="flex items-start gap-3 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={consent}
                            onChange={(e) => setConsent(e.target.checked)}
                            className="mt-1 h-4 w-4 rounded border-muted-foreground/30 accent-accent"
                        />
                        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                            I agree to the{" "}
                            <Link
                                href="/terms"
                                className="text-accent hover:underline"
                                target="_blank"
                            >
                                Terms of Service
                            </Link>{" "}
                            and{" "}
                            <Link
                                href="/privacy"
                                className="text-accent hover:underline"
                                target="_blank"
                            >
                                Privacy Policy
                            </Link>
                            . I understand my phone number and IP address are logged for security purposes.
                        </span>
                    </label>

                    <div className="text-xs text-muted-foreground/70 bg-muted/30 rounded-lg p-3">
                        ⚠️ This is a personal project and is not affiliated with or
                        endorsed by GLA University. Rewards are subject to verification and
                        approval.
                    </div>
                </div>

                {/* Claim Button */}
                <Button
                    onClick={handleClaim}
                    disabled={!consent || phoneNumber.length !== 10 || claiming || statusLoading}
                    size="lg"
                    className="w-full text-lg h-14"
                >
                    {statusLoading ? (
                        <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Checking status...
                        </>
                    ) : claiming ? (
                        <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Claiming your reward...
                        </>
                    ) : (
                        <>
                            <Gift className="h-5 w-5 mr-2" />
                            Claim My Reward
                        </>
                    )}
                </Button>

                {/* Info */}
                <div className="mt-8 space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                        <Shield className="h-4 w-4 shrink-0 mt-0.5" />
                        <p>One reward per GLA student account. No exceptions.</p>
                    </div>
                    <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                        <p>Reward amount is generated securely on our servers.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
