"use client"

import type React from "react"

import { useEffect, Suspense } from "react"
import { ErrorBoundary } from "./error-boundary"
import { setupGlobalErrorHandlers } from "@/lib/error-logging"

function SuspenseFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

export function ErrorBoundaryProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Set up global error handlers
    setupGlobalErrorHandlers()

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("[ErrorBoundary] Unhandled promise rejection:", event.reason)
    }

    window.addEventListener("unhandledrejection", handleUnhandledRejection)

    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection)
    }
  }, [])

  return (
    <ErrorBoundary level="page">
      <Suspense fallback={<SuspenseFallback />}>{children}</Suspense>
    </ErrorBoundary>
  )
}
