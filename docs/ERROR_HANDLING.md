# Error Handling & Error Boundaries

This document describes the error handling system implemented in the GLA Gallery application.

## Overview

The application uses React Error Boundaries to catch and handle errors gracefully, preventing the entire application from crashing when errors occur. All errors are logged to Firebase for monitoring and debugging.

## Components

### ErrorBoundary

The main error boundary component that wraps the application and catches React errors.

**Location**: `components/error-boundary.tsx`

**Features**:
- Catches React rendering errors
- Provides user-friendly error UI
- Logs errors to Firebase
- Supports retry mechanisms
- Different error levels (page, section, component)

**Usage**:
\`\`\`tsx
import { ErrorBoundary } from "@/components/error-boundary"

<ErrorBoundary level="page">
  <YourComponent />
</ErrorBoundary>
\`\`\`

### SectionErrorBoundary

A convenience wrapper for section-level errors (not full page crashes).

**Location**: `components/section-error-boundary.tsx`

**Usage**:
\`\`\`tsx
import { SectionErrorBoundary } from "@/components/section-error-boundary"

<SectionErrorBoundary>
  <YourSection />
</SectionErrorBoundary>
\`\`\`

### ErrorBoundaryProvider

Global error boundary provider that wraps the entire application and sets up global error handlers.

**Location**: `components/error-boundary-provider.tsx`

**Automatically**:
- Wraps the app in `app/layout.tsx`
- Sets up `window.onerror` handler
- Sets up `unhandledrejection` handler

## Error Logging

### Firebase Error Logs

All errors are automatically logged to Firestore in the `error_logs` collection with the following structure:

\`\`\`typescript
{
  message: string
  stack?: string
  name: string
  componentStack?: string
  level: "page" | "section" | "component"
  userAgent?: string
  url?: string
  userId?: string
  timestamp: Timestamp
  errorId: string
  metadata?: Record<string, any>
}
\`\`\`

### Error ID

Each error gets a unique ID (`err_<timestamp>_<random>`) that can be used for tracking and support.

## Utilities

### useErrorHandler Hook

Hook for programmatic error handling in components.

**Usage**:
\`\`\`tsx
import { useErrorHandler } from "@/components/error-boundary"

function MyComponent() {
  const handleError = useErrorHandler()
  
  async function doSomething() {
    try {
      // ... operation
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)))
    }
  }
}
\`\`\`

### retryWithBackoff

Utility function to retry failed operations with exponential backoff.

**Location**: `lib/error-logging.ts`

**Usage**:
\`\`\`tsx
import { retryWithBackoff } from "@/lib/error-logging"

const result = await retryWithBackoff(
  async () => {
    // Your async operation
    return await someOperation()
  },
  3, // max retries
  1000 // initial delay in ms
)
\`\`\`

### safeAsync

Wrapper that safely executes async functions and logs errors.

**Location**: `lib/error-logging.ts`

**Usage**:
\`\`\`tsx
import { safeAsync } from "@/lib/error-logging"

const result = await safeAsync(
  async () => {
    return await riskyOperation()
  },
  (error) => {
    // Optional custom error handler
    console.log("Custom handling:", error)
  }
)

if (result === null) {
  // Operation failed
}
\`\`\`

## Error Levels

### Page Level
- Full page error boundary
- Used in `app/layout.tsx`
- Shows full error UI with reload/home options

### Section Level
- Section-specific error boundary
- Used for independent sections (gallery grid, hackathon details, etc.)
- Shows section-specific error UI

### Component Level
- Component-specific error boundary
- Used for individual components
- Shows minimal error UI

## Implementation in Pages

### Gallery Page
- Error boundary wraps the gallery grid
- Error handlers in Firestore listeners
- Error handlers in pagination

### Upload Page
- Error handlers in upload operations
- Retry logic for Firebase operations
- Error handlers in file processing

### Hackathon Pages
- Error boundaries in hackathon detail pages
- Error handlers in registration
- Error handlers in team operations

## Global Error Handlers

The following global error handlers are automatically set up:

1. **window.onerror**: Catches unhandled JavaScript errors
2. **unhandledrejection**: Catches unhandled promise rejections

Both automatically log to Firebase.

## Best Practices

1. **Use Error Boundaries**: Wrap critical sections with error boundaries
2. **Use Error Handlers**: Use `useErrorHandler` hook for async operations
3. **Retry Logic**: Use `retryWithBackoff` for network operations
4. **User Feedback**: Always show user-friendly error messages
5. **Error Logging**: All errors are automatically logged - no need to manually log

## Error UI

The error UI provides:
- Clear error message
- Error ID for support
- Retry/reload options
- Home navigation (for page-level errors)
- Stack trace (development only)

## Monitoring

Admins can monitor errors by:
1. Checking Firebase Console → Firestore → `error_logs` collection
2. Filtering by `level`, `userId`, or `errorId`
3. Viewing error details including stack traces and metadata

## Future Enhancements

- [ ] Error reporting to external service (Sentry, LogRocket)
- [ ] Error analytics dashboard
- [ ] Automatic error notifications for admins
- [ ] Error rate monitoring and alerts
