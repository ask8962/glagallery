"use client"

import { useState, useEffect } from "react"
import { Bell, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import {
    getNotificationPermission,
    isPushSupported,
    enablePushNotifications,
} from "@/lib/push-notifications"

const BANNER_DISMISSED_KEY = "gla_push_banner_dismissed"

export function NotificationPermissionBanner() {
    const { user } = useAuth()
    const [show, setShow] = useState(false)
    const [loading, setLoading] = useState(false)
    const [enabled, setEnabled] = useState(false)

    useEffect(() => {
        async function checkStatus() {
            // Don't show if not logged in
            if (!user) {
                setShow(false)
                return
            }

            // Don't show if push not supported
            const supported = await isPushSupported()
            if (!supported) {
                setShow(false)
                return
            }

            // Don't show if banner was dismissed recently
            const dismissed = localStorage.getItem(BANNER_DISMISSED_KEY)
            if (dismissed) {
                const dismissedAt = parseInt(dismissed, 10)
                // Show again after 7 days
                if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) {
                    setShow(false)
                    return
                }
            }

            // Check permission status
            const permission = getNotificationPermission()

            if (permission === "granted") {
                // Already enabled
                setShow(false)
                return
            }

            if (permission === "denied") {
                // User explicitly denied
                setShow(false)
                return
            }

            // Permission is "default" - show the banner
            setShow(true)
        }

        checkStatus()
    }, [user])

    async function handleEnable() {
        if (!user) return

        setLoading(true)
        try {
            const success = await enablePushNotifications(user.uid)
            if (success) {
                setEnabled(true)
                setTimeout(() => setShow(false), 2000)
            }
        } catch (error) {
            console.error("Error enabling notifications:", error)
        } finally {
            setLoading(false)
        }
    }

    function handleDismiss() {
        localStorage.setItem(BANNER_DISMISSED_KEY, Date.now().toString())
        setShow(false)
    }

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-md"
                >
                    <div className="bg-gradient-to-r from-accent/90 to-accent rounded-xl p-4 shadow-lg border border-accent/20 backdrop-blur-sm">
                        {enabled ? (
                            <div className="flex items-center gap-3 text-accent-foreground">
                                <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
                                    <Bell className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-semibold">Notifications Enabled! 🎉</p>
                                    <p className="text-sm opacity-90">You'll now receive real-time updates</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-start gap-3">
                                <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Bell className="h-5 w-5 text-accent-foreground" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-accent-foreground">
                                        Get Instant Notifications
                                    </p>
                                    <p className="text-sm text-accent-foreground/80 mt-0.5">
                                        Be the first to know when someone likes or comments on your posts
                                    </p>
                                    <div className="flex items-center gap-2 mt-3">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={handleEnable}
                                            disabled={loading}
                                            className="bg-white hover:bg-white/90 text-accent font-medium"
                                        >
                                            {loading ? "Enabling..." : "Enable Notifications"}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={handleDismiss}
                                            className="text-accent-foreground/70 hover:text-accent-foreground hover:bg-white/10"
                                        >
                                            Maybe Later
                                        </Button>
                                    </div>
                                </div>
                                <button
                                    onClick={handleDismiss}
                                    className="text-accent-foreground/60 hover:text-accent-foreground transition-colors"
                                    aria-label="Dismiss"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
