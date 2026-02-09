"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"
import { Mail, Shield, RefreshCw, Loader2 } from "lucide-react"

export default function Verify2FAPage() {
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()
    const [otp, setOtp] = useState("")
    const [loading, setLoading] = useState(false)
    const [sending, setSending] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const [countdown, setCountdown] = useState(0)

    // Redirect if not logged in
    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/")
        }
    }, [user, authLoading, router])

    // Countdown timer for resend
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [countdown])

    // Send OTP on mount
    useEffect(() => {
        if (user && !authLoading) {
            sendOTP()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, authLoading])

    async function sendOTP() {
        if (!user || sending || countdown > 0) return

        setSending(true)
        setError("")
        setSuccess("")

        try {
            const res = await fetch("/api/auth/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.uid,
                    email: user.email,
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "Failed to send OTP")
            }

            setSuccess(`Verification code sent to ${user.email}`)
            setCountdown(60) // 60 second cooldown
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSending(false)
        }
    }

    async function verifyOTP() {
        if (!user || !otp || otp.length !== 6) {
            setError("Please enter a 6-digit code")
            return
        }

        setLoading(true)
        setError("")

        try {
            const res = await fetch("/api/auth/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.uid,
                    code: otp,
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "Verification failed")
            }

            // Force hard reload to update auth context and cookie state
            window.location.href = "/"
        } catch (err: any) {
            setError(err.message)
            setOtp("") // Clear invalid OTP
        } finally {
            setLoading(false)
        }
    }

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Card className="w-full max-w-md shadow-xl">
                    <CardHeader className="text-center space-y-2">
                        <div className="mx-auto w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4">
                            <Shield className="h-8 w-8 text-accent" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Two-Factor Authentication</CardTitle>
                        <CardDescription>
                            Enter the 6-digit code sent to your email
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {/* Email indicator */}
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                            <Mail className="h-4 w-4" />
                            <span>{user?.email}</span>
                        </div>

                        {/* OTP Input */}
                        <div className="space-y-2">
                            <Input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                placeholder="Enter 6-digit code"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                className="text-center text-2xl tracking-widest font-mono"
                                disabled={loading}
                            />
                        </div>

                        {/* Error/Success Messages */}
                        {error && (
                            <p className="text-sm text-destructive text-center">{error}</p>
                        )}
                        {success && (
                            <p className="text-sm text-green-600 dark:text-green-400 text-center">{success}</p>
                        )}

                        {/* Verify Button */}
                        <Button
                            onClick={verifyOTP}
                            disabled={loading || otp.length !== 6}
                            className="w-full"
                            size="lg"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                "Verify Code"
                            )}
                        </Button>

                        {/* Resend Button */}
                        <div className="text-center">
                            <Button
                                variant="ghost"
                                onClick={sendOTP}
                                disabled={sending || countdown > 0}
                                className="text-sm"
                            >
                                {sending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : countdown > 0 ? (
                                    `Resend code in ${countdown}s`
                                ) : (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Resend Code
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
