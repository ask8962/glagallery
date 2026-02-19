/**
 * Centralized Application Configuration
 *
 * Single source of truth for all application-wide settings.
 * NEVER use window.location, request headers, or dynamic URLs for email links.
 */

// This ensures all email links ALWAYS point to production domain

/**
 * IMPORTANT: Set this to your actual production domain
 * This is used for ALL email links and must be hardcoded
 */
export const APP_CONFIG = {
  // Production URL - MUST be set to your actual domain
  // This is the ONLY source of truth for email links
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || "https://gla-gallery.vercel.app",

  // App metadata
  APP_NAME: "GLA Gallery",
  APP_DESCRIPTION: "Campus Memories & Hackathons",

  // Email settings
  EMAIL_FROM_NAME: process.env.SMTP_FROM_NAME || "GLA Gallery",
  EMAIL_FROM_ADDRESS: process.env.SMTP_FROM_EMAIL || "noreply@gla.ac.in",

  // Feature flags
  FEATURES: {
    EMAIL_NOTIFICATIONS: true,
    GAMIFICATION: true,
    HACKATHONS: true,
    CONTENT_MODERATION: true,
  },

  // Rate limits (per hour)
  RATE_LIMITS: {
    UPLOAD: 10,
    COMMENT: 50,
    LIKE: 100,
    REPORT: 10,
    CAMPAIGN_CLAIM: 5,
  },

  // File limits
  FILE_LIMITS: {
    MAX_SIZE_MB: 10,
    MAX_IMAGE_DIMENSION: 4096,
    ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
    ALLOWED_VIDEO_TYPES: ["video/mp4", "video/mov", "video/avi", "video/webm"],
  },

  // Admin emails (role-based access) — reads from env var first, falls back to hardcoded
  ADMIN_EMAILS: (process.env.ADMIN_EMAILS || "anukalp.gupta_cs23@gla.ac.in")
    .split(",")
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean),
} as const

/**
 * Get the base URL for all application links
 * ALWAYS returns the production URL, never localhost or dynamic URLs
 */
export function getAppURL(): string {
  return APP_CONFIG.APP_URL
}

/**
 * Build a full URL for the application
 * @param path - The path to append (e.g., "/gallery", "/profile")
 */
export function buildAppURL(path: string): string {
  const baseURL = getAppURL()
  // Ensure path starts with /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  // Remove trailing slash from base URL if present
  const normalizedBase = baseURL.endsWith("/") ? baseURL.slice(0, -1) : baseURL
  return `${normalizedBase}${normalizedPath}`
}

/**
 * Check if an email belongs to an admin
 */
export function isAdminEmail(email: string): boolean {
  return APP_CONFIG.ADMIN_EMAILS.includes(email.toLowerCase())
}

/**
 * Get all admin emails
 */
export function getAdminEmails(): readonly string[] {
  return APP_CONFIG.ADMIN_EMAILS
}
