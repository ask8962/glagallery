"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { getFirebase } from "@/lib/firebase"
import { doc, updateDoc } from "firebase/firestore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Shield, Mail, Loader2 } from "lucide-react"
import type { UserProfile } from "@/lib/types"

interface TwoFactorSettingsProps {
    profile: UserProfile
    onUpdate?: () => void
}

export function TwoFactorSettings({ profile, onUpdate }: TwoFactorSettingsProps) {
    const { user } = useAuth()
    const { db } = getFirebase()
    const [loading, setLoading] = useState(false)
    const [enabled, setEnabled] = useState(profile.twoFactorEnabled || false)
    const [success, setSuccess] = useState("")

    async function toggle2FA(checked: boolean) {
        if (!user) return

        setLoading(true)
        setSuccess("")

        try {
            await updateDoc(doc(db, "users", user.uid), {
                twoFactorEnabled: checked,
            })

            setEnabled(checked)
            setSuccess(checked ? "2FA enabled! You'll be prompted on next login." : "2FA disabled.")
            onUpdate?.()

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(""), 3000)
        } catch (error) {
            console.error("Error updating 2FA setting:", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Shield className="h-5 w-5 text-accent" />
                    Two-Factor Authentication
                </CardTitle>
                <CardDescription>
                    Add an extra layer of security to your account
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <Label htmlFor="2fa-toggle" className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email OTP Verification
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            Receive a code via email on each login
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        <Switch
                            id="2fa-toggle"
                            checked={enabled}
                            onCheckedChange={toggle2FA}
                            disabled={loading}
                        />
                    </div>
                </div>

                {success && (
                    <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
                )}
            </CardContent>
        </Card>
    )
}
