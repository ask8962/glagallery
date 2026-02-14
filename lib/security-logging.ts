/**
 * Security Logging Utility
 * 
 * Logs security-relevant events for monitoring and incident response.
 * Events are stored in Firestore for easy querying and alerting.
 */

import { adminDb } from "@/lib/firebase-admin"
import { Timestamp } from "firebase-admin/firestore"

export type SecurityEventType =
    | "login_success"
    | "login_failed"
    | "permission_denied"
    | "rate_limit_exceeded"
    | "admin_action"
    | "suspicious_activity"
    | "password_reset"
    | "account_locked"

export type SecurityEventSeverity = "info" | "warning" | "critical"

export interface SecurityEvent {
    id?: string
    type: SecurityEventType
    severity: SecurityEventSeverity
    userId?: string
    userEmail?: string
    ipAddress?: string
    userAgent?: string
    action: string
    details?: Record<string, unknown>
    createdAt: any
}

/**
 * Log a security event to Firestore
 */
export async function logSecurityEvent(
    type: SecurityEventType,
    severity: SecurityEventSeverity,
    action: string,
    options: {
        userId?: string
        userEmail?: string
        ipAddress?: string
        userAgent?: string
        details?: Record<string, unknown>
    } = {}
): Promise<void> {
    try {
        // Sanitize undefined values to prevent Firestore errors
        const sanitizeUndefined = <T>(obj: T): T => {
            return Object.entries(obj as any).reduce((acc, [key, value]) => {
                if (value !== undefined) {
                    acc[key] = value
                }
                return acc
            }, {} as any)
        }

        const eventData: Omit<SecurityEvent, "id"> = {
            type,
            severity,
            action,
            userId: options.userId ?? undefined,
            userEmail: options.userEmail ?? undefined,
            ipAddress: options.ipAddress ?? undefined,
            userAgent: options.userAgent ?? undefined,
            details: options.details ? sanitizeUndefined(options.details) : undefined,
            createdAt: Timestamp.now()
        }

        // Remove top-level undefined fields entirely just in case
        const event = sanitizeUndefined(eventData)

        await adminDb.collection("security_logs").add(event)

        // For critical events, log to console for immediate visibility
        if (severity === "critical") {
            console.error(`🚨 SECURITY ALERT: ${action}`, {
                type,
                userId: options.userId,
                ip: options.ipAddress
            })
        }
    } catch (error) {
        // Don't throw - logging should be non-blocking
        console.error("Failed to log security event:", error)
    }
}

/**
 * Helper for logging failed authentication attempts
 */
export async function logFailedAuth(
    reason: string,
    ipAddress?: string,
    userEmail?: string
): Promise<void> {
    await logSecurityEvent("login_failed", "warning", `Authentication failed: ${reason}`, {
        ipAddress,
        userEmail
    })
}

/**
 * Helper for logging permission denied errors
 */
export async function logPermissionDenied(
    action: string,
    userId?: string,
    ipAddress?: string
): Promise<void> {
    await logSecurityEvent("permission_denied", "warning", `Permission denied: ${action}`, {
        userId,
        ipAddress
    })
}

/**
 * Helper for logging admin actions
 */
export async function logAdminAction(
    action: string,
    adminUserId: string,
    details?: Record<string, unknown>
): Promise<void> {
    await logSecurityEvent("admin_action", "info", action, {
        userId: adminUserId,
        details
    })
}

/**
 * Helper for logging rate limit violations
 */
export async function logRateLimitExceeded(
    endpoint: string,
    ipAddress?: string,
    userId?: string
): Promise<void> {
    await logSecurityEvent("rate_limit_exceeded", "warning", `Rate limit exceeded: ${endpoint}`, {
        ipAddress,
        userId
    })
}
