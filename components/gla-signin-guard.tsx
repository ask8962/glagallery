"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AlertCircle, Mail, Shield } from "lucide-react"

interface GLASignInGuardProps {
  onSignIn: () => Promise<void>
  title?: string
  description?: string
}

export function GLASignInGuard({
  onSignIn,
  title = "CampusHub Access Required",
  description = "This gallery is exclusively for CampusHub students and faculty."
}: GLASignInGuardProps) {
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignIn = async () => {
    setIsSigningIn(true)
    setError(null)

    try {
      await onSignIn()
    } catch (error: any) {
      setError(error.message || 'Sign in failed. Please use your CampusHub email (@gla.ac.in)')
    } finally {
      setIsSigningIn(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8 text-center space-y-6">
        <div className="space-y-4">
          <div className="h-16 w-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8 text-accent" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-primary mb-2">{title}</h1>
            <p className="text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            <Mail className="h-5 w-5 text-accent" />
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">GLA Email Required</p>
              <p className="text-xs text-muted-foreground">Use your @gla.ac.in email address</p>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button
            onClick={handleSignIn}
            disabled={isSigningIn}
            size="lg"
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {isSigningIn ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                Signing in...
              </div>
            ) : (
              "Sign in with GLA Email"
            )}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>Only verified CampusHub email addresses are allowed.</p>
          <p>Contact IT support if you're having trouble accessing your account.</p>
        </div>
      </Card>
    </div>
  )
}
