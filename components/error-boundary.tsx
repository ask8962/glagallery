"use client"

import type React from "react"
import { Component, type ReactNode, type ErrorInfo } from "react"
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { logErrorToFirebase } from "@/lib/error-logging"

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  resetKeys?: Array<string | number>
  onReset?: () => void
  level?: "page" | "section" | "component"
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to Firebase
    const errorId = logErrorToFirebase(error, errorInfo as any, this.props.level || "page")

    this.setState({
      error,
      errorInfo,
      errorId,
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught an error:", error, errorInfo)
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // Reset error state when resetKeys change
    if (
      this.state.hasError &&
      prevProps.resetKeys &&
      this.props.resetKeys &&
      prevProps.resetKeys.some((key, index) => key !== this.props.resetKeys?.[index])
    ) {
      this.resetErrorBoundary()
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
  }

  resetErrorBoundary = () => {
    if (this.props.onReset) {
      this.props.onReset()
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    })
  }

  handleRetry = () => {
    this.resetErrorBoundary()
    // Force a re-render by reloading the page
    if (typeof window !== "undefined") {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId}
          onRetry={this.handleRetry}
          onReset={this.resetErrorBoundary}
          level={this.props.level || "page"}
        />
      )
    }

    return this.props.children
  }
}

interface ErrorFallbackProps {
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
  onRetry: () => void
  onReset: () => void
  level: "page" | "section" | "component"
}

function ErrorFallback({ error, errorInfo, errorId, onRetry, onReset, level }: ErrorFallbackProps) {
  const isPageLevel = level === "page"
  const isComponentLevel = level === "component"

  if (isComponentLevel) {
    // Minimal error UI for component-level errors
    return (
      <Card className="p-4 border-destructive/50 bg-destructive/5">
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" />
          <span>Something went wrong. Please refresh.</span>
          <Button size="sm" variant="ghost" onClick={onReset} className="h-6 px-2 text-xs">
            Dismiss
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 ${isPageLevel ? "bg-background" : "bg-muted/30"}`}
    >
      <Card className="max-w-2xl w-full p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isPageLevel ? "Oops! Something went wrong" : "An error occurred"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isPageLevel ? "We're sorry, but something unexpected happened." : "This section encountered an error."}
            </p>
          </div>
        </div>

        {error && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Bug className="h-4 w-4" />
              <span>Error Details</span>
            </div>
            <div className="bg-muted rounded-lg p-4 font-mono text-sm">
              <div className="text-destructive font-semibold mb-2">
                {error.name}: {error.message}
              </div>
              {error.stack && process.env.NODE_ENV === "development" && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground text-xs">
                    Stack Trace
                  </summary>
                  <pre className="mt-2 text-xs overflow-auto max-h-48 text-muted-foreground">{error.stack}</pre>
                </details>
              )}
            </div>
          </div>
        )}

        {errorId && (
          <div className="text-xs text-muted-foreground">
            Error ID: <code className="bg-muted px-1 py-0.5 rounded">{errorId}</code>
            <span className="ml-2">(Please include this when reporting the issue)</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={onRetry} className="flex-1">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reload Page
          </Button>
          {!isPageLevel && (
            <Button onClick={onReset} variant="outline" className="flex-1 bg-transparent">
              Try Again
            </Button>
          )}
          {isPageLevel && (
            <Button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.href = "/"
                }
              }}
              variant="outline"
              className="flex-1"
            >
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          )}
        </div>

        {process.env.NODE_ENV === "development" && errorInfo && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              Component Stack (Development Only)
            </summary>
            <pre className="mt-2 text-xs overflow-auto max-h-48 bg-muted p-4 rounded-lg">
              {errorInfo.componentStack}
            </pre>
          </details>
        )}
      </Card>
    </div>
  )
}

// Hook for programmatic error handling
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    const errorId = logErrorToFirebase(error, errorInfo || { componentStack: "" }, "component")

    if (process.env.NODE_ENV === "development") {
      console.error("Error caught by useErrorHandler:", error, errorInfo)
    }

    return errorId
  }
}

// Higher-order component for error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">,
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}
