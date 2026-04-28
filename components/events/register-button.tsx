"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Event } from "@/lib/types"
import { useAuth } from "@/context/auth-context"
import { isRegistrationOpen } from "@/lib/events-util"
import { Loader2, Ticket, CheckCircle, XCircle, LogIn, CreditCard } from "lucide-react"
import { ReliabilityBadge } from "@/components/events/reliability-badge"
import { WaitlistButton } from "@/components/events/waitlist-button"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

declare global {
    interface Window {
        Razorpay: any
    }
}

interface RegisterButtonProps {
    event: Event
    isRegistered?: boolean
    onSuccess?: () => void
}

// Helper: dynamically load Razorpay script
function loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true)
            return
        }
        const script = document.createElement("script")
        script.src = "https://checkout.razorpay.com/v1/checkout.js"
        script.onload = () => resolve(true)
        script.onerror = () => resolve(false)
        document.body.appendChild(script)
    })
}

export function RegisterButton({ event, isRegistered = false, onSuccess }: RegisterButtonProps) {
    const { user } = useAuth()
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const canRegister = isRegistrationOpen(event)
    const isSoldOut = event.registeredCount >= event.capacity
    const isPaidEvent = !event.isFree && (event.price || 0) > 0

    // --- FREE EVENT: Standard RSVP ---
    const handleFreeRegister = async () => {
        if (!user) {
            router.push(`/login?redirect=/events/${event.id}`)
            return
        }

        setLoading(true)
        try {
            const token = await user.getIdToken()
            const res = await fetch("/api/events/rsvp", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    eventId: event.id,
                    ticketsCount: 1,
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                if (res.status === 409) {
                    toast.info("You're already registered for this event!", {
                        action: {
                            label: "View Tickets",
                            onClick: () => router.push("/events/my-tickets")
                        }
                    })
                    onSuccess?.()
                    return
                }
                throw new Error(data.error || "Registration failed")
            }

            toast.success("You're registered!", {
                description: "Your ticket has been generated.",
                action: {
                    label: "View Ticket",
                    onClick: () => router.push("/events/my-tickets")
                }
            })
            onSuccess?.()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    // --- PAID EVENT: Razorpay Checkout ---
    const handlePaidRegister = async () => {
        if (!user) {
            router.push(`/login?redirect=/events/${event.id}`)
            return
        }

        setLoading(true)
        try {
            // 1. Load Razorpay script
            const loaded = await loadRazorpayScript()
            if (!loaded) {
                throw new Error("Failed to load payment gateway. Please try again.")
            }

            // 2. Create Order on our backend
            const token = await user.getIdToken()
            const orderRes = await fetch("/api/events/payment/create-order", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    eventId: event.id,
                    ticketsCount: 1,
                }),
            })

            const orderData = await orderRes.json()

            if (!orderRes.ok) {
                if (orderRes.status === 409) {
                    toast.info("You're already registered for this event!")
                    onSuccess?.()
                    return
                }
                throw new Error(orderData.error || "Failed to create order")
            }

            // 3. Open Razorpay Checkout
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "CampusHub",
                description: `Ticket for: ${event.title}`,
                order_id: orderData.orderId,
                prefill: {
                    name: user.displayName || "",
                    email: user.email || "",
                },
                theme: {
                    color: "#1a365d",
                },
                handler: async function (response: any) {
                    // 4. Verify Payment on our backend
                    try {
                        const verifyRes = await fetch("/api/events/payment/verify", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                eventId: event.id,
                                ticketsCount: 1,
                            }),
                        })

                        const verifyData = await verifyRes.json()

                        if (!verifyRes.ok) {
                            throw new Error(verifyData.error || "Payment verification failed")
                        }

                        toast.success("Payment successful! 🎉", {
                            description: "Your ticket has been generated.",
                            action: {
                                label: "View Ticket",
                                onClick: () => router.push("/events/my-tickets")
                            }
                        })
                        onSuccess?.()
                    } catch (verifyError: any) {
                        toast.error(verifyError.message || "Payment verification failed. Contact support.")
                    } finally {
                        setLoading(false)
                    }
                },
                modal: {
                    ondismiss: function () {
                        setLoading(false)
                        toast.info("Payment cancelled")
                    }
                }
            }

            const rzp = new window.Razorpay(options)
            rzp.on("payment.failed", function (response: any) {
                toast.error("Payment failed: " + (response.error?.description || "Unknown error"))
                setLoading(false)
            })
            rzp.open()

        } catch (error: any) {
            toast.error(error.message)
            setLoading(false)
        }
    }

    const handleRegister = isPaidEvent ? handlePaidRegister : handleFreeRegister

    // Already Registered
    if (isRegistered) {
        return (
            <Button disabled className="w-full gap-2" size="lg">
                <CheckCircle className="h-5 w-5" />
                Already Registered
            </Button>
        )
    }

    // Sold Out - Show Waitlist Option
    if (isSoldOut) {
        return (
            <div className="space-y-2">
                <Button disabled variant="outline" className="w-full gap-2" size="lg">
                    <XCircle className="h-5 w-5" />
                    Sold Out
                </Button>
                <WaitlistButton eventId={event.id} />
            </div>
        )
    }

    // Registration Closed
    if (!canRegister) {
        return (
            <Button disabled variant="outline" className="w-full gap-2" size="lg">
                Registration Closed
            </Button>
        )
    }

    // Not logged in
    if (!user) {
        return (
            <Button onClick={handleRegister} className="w-full gap-2" size="lg">
                <LogIn className="h-5 w-5" />
                Login to Register
            </Button>
        )
    }

    // Can Register
    return (
        <div className="space-y-3 w-full">
            {user && (
                <div className="flex justify-center">
                    <ReliabilityBadge
                        eventStats={user.eventStats}
                        reliabilityScore={user.reliabilityScore}
                    />
                </div>
            )}
            <Button onClick={handleRegister} disabled={loading} className="w-full gap-2" size="lg">
                {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                ) : isPaidEvent ? (
                    <CreditCard className="h-5 w-5" />
                ) : (
                    <Ticket className="h-5 w-5" />
                )}
                {loading ? "Processing..." : isPaidEvent ? `Pay ₹${event.price} & Register` : "Register Now"}
            </Button>
        </div>
    )
}

