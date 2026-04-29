"use client"

import { useAuth } from "@/context/auth-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Clock, ShieldAlert, LogIn, MonitorOff } from "lucide-react"

export function SessionExpiredModal() {
  const { sessionExpired, sessionExpiryReason, signIn } = useAuth()

  // Do not render anything if the session is not expired
  if (!sessionExpired) return null

  let icon = <Clock className="h-10 w-10 text-red-500 mb-4" />
  let title = "Your session has expired"
  let description = "For your security, we automatically log you out after a period of inactivity."

  if (sessionExpiryReason === "concurrent_login") {
    icon = <MonitorOff className="h-10 w-10 text-red-500 mb-4" />
    title = "Session Terminated"
    description = "Your account was logged in from another device or browser. To protect your data, this session has been terminated."
  } else if (sessionExpiryReason === "invalid_token") {
    icon = <ShieldAlert className="h-10 w-10 text-red-500 mb-4" />
    title = "Authentication Error"
    description = "Your login token is no longer valid. This usually happens if your password changed or the session was revoked."
  }

  return (
    <Dialog open={sessionExpired} onOpenChange={() => {}}>
      {/* 
        onOpenChange is empty to prevent closing by clicking outside or pressing ESC. 
        It forces the user to interact with the button.
      */}
      <DialogContent 
        className="sm:max-w-md border-t-4 border-t-red-500 bg-card p-8 shadow-2xl"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        showCloseButton={false}
      >
        <DialogHeader className="flex flex-col items-center text-center pb-4">
          {icon}
          <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
            {title}
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-4">
          <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground border">
            <h4 className="font-semibold text-foreground mb-2">This happens when:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>You kept the browser window idle for over 30 minutes.</li>
              <li>You are accessing a saved or static URL after logging out.</li>
              <li>You logged into another session simultaneously.</li>
            </ul>
          </div>

          <Button 
            size="lg" 
            className="w-full bg-primary hover:bg-primary/90 mt-2 font-semibold"
            onClick={async () => {
              try {
                await signIn() // This will pop up the google login. AuthContext handles resetting state on success.
              } catch (error) {
                console.error("Login failed from modal:", error)
              }
            }}
          >
            <LogIn className="mr-2 h-4 w-4" />
            Log In Again
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
