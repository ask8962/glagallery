import { getFirebase } from "./firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { APP_CONFIG } from "./config"

export interface ErrorLog {
  message: string
  stack?: string
  name: string
  componentStack?: string
  level: "page" | "section" | "component"
  userAgent?: string
  url?: string
  userId?: string | null
  timestamp: any
  errorId: string
  metadata?: Record<string, any>
}

/**
 * Generate a unique error ID
 */
function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Log error to Firebase Firestore
 * Returns the error ID for tracking
 */
export async function logErrorToFirebase(
  error: Error,
  errorInfo: { componentStack?: string },
  level: "page" | "section" | "component" = "page",
  metadata?: Record<string, any>,
): Promise<string> {
  const errorId = generateErrorId()

  try {
    const { db } = getFirebase()

    // Get user ID if available (from localStorage or context)
    let userId: string | undefined
    try {
      if (typeof window !== "undefined") {
        // Try to get user from auth context or localStorage
        const authData = localStorage.getItem("firebase:authUser")
        if (authData) {
          const parsed = JSON.parse(authData)
          userId = parsed.uid
        }
      }
    } catch {
      // Ignore errors getting user ID
    }

    const url = typeof window !== "undefined" ? `${APP_CONFIG.APP_URL}${window.location.pathname}` : undefined

    const errorLog: Omit<ErrorLog, "id"> = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      componentStack: errorInfo.componentStack,
      level,
      userAgent: typeof window !== "undefined" ? window.navigator.userAgent : undefined,
      url,
      userId: userId || null,
      timestamp: serverTimestamp(),
      errorId,
      metadata: {
        ...metadata,
        environment: process.env.NODE_ENV,
      },
    }

    await addDoc(collection(db, "error_logs"), errorLog)
  } catch (loggingError) {
    // Don't fail if logging fails - just log to console
    console.error("Failed to log error to Firebase:", loggingError)
    console.error("Original error:", error)
  }

  return errorId
}

/**
 * Log client-side error (for window.onerror, unhandledrejection, etc.)
 */
export function setupGlobalErrorHandlers() {
  if (typeof window === "undefined") return

  // Handle unhandled errors
  window.addEventListener("error", (event) => {
    const error = event.error || new Error(event.message)
    logErrorToFirebase(
      error,
      { componentStack: event.filename ? `at ${event.filename}:${event.lineno}:${event.colno}` : "" },
      "page",
      {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    )
  })

  // Handle unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason))

    logErrorToFirebase(error, { componentStack: "Unhandled Promise Rejection" }, "page", {
      reason: event.reason,
    })
  })
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3, initialDelay = 1000): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError || new Error("Retry failed")
}

/**
 * Safe async wrapper that catches errors and logs them
 */
export async function safeAsync<T>(fn: () => Promise<T>, errorHandler?: (error: Error) => void): Promise<T | null> {
  try {
    return await fn()
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))

    await logErrorToFirebase(err, { componentStack: "" }, "component")

    if (errorHandler) {
      errorHandler(err)
    }

    return null
  }
}
