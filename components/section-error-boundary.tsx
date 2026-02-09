"use client"

import { ErrorBoundary } from "./error-boundary"

/**
 * Error boundary for section-level errors (not full page)
 * Use this to wrap specific sections that might fail independently
 */
export function SectionErrorBoundary({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  return (
    <ErrorBoundary level="section" fallback={fallback}>
      {children}
    </ErrorBoundary>
  )
}
