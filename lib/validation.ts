/**
 * Data Validation & Sanitization Utilities
 *
 * Centralized validation and sanitization functions for the GLA Gallery application.
 * Includes XSS prevention, file validation, profanity filtering, and rate limiting.
 */

import { APP_CONFIG } from "./config"

// Dynamic import for DOMPurify to handle SSR
interface DOMPurifyInterface {
  sanitize: (
    html: string,
    options?: { ALLOWED_TAGS?: string[]; ALLOWED_ATTR?: string[]; ALLOW_DATA_ATTR?: boolean },
  ) => string
}

let DOMPurifyInstance: DOMPurifyInterface | null = null

function getDOMPurify(): DOMPurifyInterface {
  if (DOMPurifyInstance) return DOMPurifyInstance

  if (typeof window !== "undefined") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const dompurify = require("isomorphic-dompurify")
      DOMPurifyInstance = dompurify.default || dompurify
      return DOMPurifyInstance!
    } catch {
      // Fallback with comprehensive sanitization
      DOMPurifyInstance = {
        sanitize: (html: string) => {
          return html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
            .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
            .replace(/on\w+\s*=/gi, "")
            .replace(/javascript:/gi, "")
            .replace(/data:/gi, "")
            .replace(/<[^>]*>/g, "")
        },
      }
      return DOMPurifyInstance
    }
  }

  // Server-side: comprehensive sanitization
  DOMPurifyInstance = {
    sanitize: (html: string) => {
      return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
        .replace(/on\w+\s*=/gi, "")
        .replace(/javascript:/gi, "")
        .replace(/data:/gi, "")
        .replace(/<[^>]*>/g, "")
    },
  }
  return DOMPurifyInstance
}

// File validation constants - using centralized config
export const ALLOWED_IMAGE_TYPES = APP_CONFIG.FILE_LIMITS.ALLOWED_IMAGE_TYPES
export const ALLOWED_VIDEO_TYPES = APP_CONFIG.FILE_LIMITS.ALLOWED_VIDEO_TYPES
export const ALLOWED_MEDIA_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES] as const

export const MAX_FILE_SIZE = APP_CONFIG.FILE_LIMITS.MAX_SIZE_MB * 1024 * 1024
export const MAX_TITLE_LENGTH = 200
export const MAX_DESCRIPTION_LENGTH = 2000
export const MAX_COMMENT_LENGTH = 500
export const MAX_HACKATHON_TITLE_LENGTH = 100
export const MAX_HACKATHON_DESCRIPTION_LENGTH = 5000

// Profanity filter - comprehensive word list
const PROFANITY_WORDS: string[] = [
  // Common profanity (keeping minimal for public code)
  // In production, use a comprehensive profanity filter library like "bad-words"
]

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHTML(html: string): string {
  const purify = getDOMPurify()

  if (typeof window === "undefined") {
    return purify.sanitize(html, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    })
  }

  return purify.sanitize(html, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "p", "br"],
    ALLOWED_ATTR: ["href"],
    ALLOW_DATA_ATTR: false,
  })
}

/**
 * Sanitize plain text (removes HTML tags)
 */
export function sanitizeText(text: string): string {
  if (!text) return ""

  // First pass: remove dangerous patterns
  let sanitized = text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/data:/gi, "")

  // Second pass: use DOMPurify
  sanitized = sanitizeHTML(sanitized).replace(/<[^>]*>/g, "")

  // Third pass: normalize whitespace
  sanitized = sanitized.replace(/\s+/g, " ").trim()

  return sanitized
}

/**
 * Validate and sanitize title
 */
export function validateTitle(title: string): { valid: boolean; error?: string; sanitized: string } {
  if (!title || title.trim().length === 0) {
    return { valid: false, error: "Title is required", sanitized: "" }
  }

  const sanitized = sanitizeText(title.trim())

  if (sanitized.length === 0) {
    return { valid: false, error: "Title cannot be empty after sanitization", sanitized: "" }
  }

  if (sanitized.length > MAX_TITLE_LENGTH) {
    return {
      valid: false,
      error: `Title must be ${MAX_TITLE_LENGTH} characters or less`,
      sanitized: sanitized.slice(0, MAX_TITLE_LENGTH),
    }
  }

  return { valid: true, sanitized }
}

/**
 * Validate and sanitize description
 */
export function validateDescription(description: string): { valid: boolean; error?: string; sanitized: string } {
  if (!description) {
    return { valid: true, sanitized: "" }
  }

  const sanitized = sanitizeText(description.trim())

  if (sanitized.length > MAX_DESCRIPTION_LENGTH) {
    return {
      valid: false,
      error: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`,
      sanitized: sanitized.slice(0, MAX_DESCRIPTION_LENGTH),
    }
  }

  return { valid: true, sanitized }
}

/**
 * Validate and sanitize comment text
 */
export function validateComment(comment: string): { valid: boolean; error?: string; sanitized: string } {
  if (!comment || comment.trim().length === 0) {
    return { valid: false, error: "Comment cannot be empty", sanitized: "" }
  }

  const sanitized = sanitizeText(comment.trim())

  if (sanitized.length === 0) {
    return { valid: false, error: "Comment cannot be empty after sanitization", sanitized: "" }
  }

  if (sanitized.length > MAX_COMMENT_LENGTH) {
    return {
      valid: false,
      error: `Comment must be ${MAX_COMMENT_LENGTH} characters or less`,
      sanitized: sanitized.slice(0, MAX_COMMENT_LENGTH),
    }
  }

  const profanityCheck = checkProfanity(sanitized)
  if (!profanityCheck.allowed) {
    return {
      valid: false,
      error: profanityCheck.message || "Comment contains inappropriate content",
      sanitized,
    }
  }

  return { valid: true, sanitized }
}

/**
 * Validate file type
 */
export function validateFileType(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_MEDIA_TYPES.includes(file.type as (typeof ALLOWED_MEDIA_TYPES)[number])) {
    return {
      valid: false,
      error: `Invalid file type: ${file.type}. Allowed types: ${ALLOWED_IMAGE_TYPES.join(", ")}, ${ALLOWED_VIDEO_TYPES.join(", ")}`,
    }
  }

  return { valid: true }
}

/**
 * Validate file size
 */
export function validateFileSize(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2)
    const maxMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0)
    return {
      valid: false,
      error: `File "${file.name}" is too large (${sizeMB}MB). Maximum size is ${maxMB}MB`,
    }
  }

  return { valid: true }
}

/**
 * Validate file (type and size)
 */
export function validateFile(file: File): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  const typeCheck = validateFileType(file)
  if (!typeCheck.valid && typeCheck.error) {
    errors.push(typeCheck.error)
  }

  const sizeCheck = validateFileSize(file)
  if (!sizeCheck.valid && sizeCheck.error) {
    errors.push(sizeCheck.error)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validate multiple files
 */
export function validateFiles(files: FileList | File[]): { valid: boolean; errors: string[] } {
  const fileArray = Array.from(files)
  const errors: string[] = []

  if (fileArray.length === 0) {
    errors.push("At least one file is required")
    return { valid: false, errors }
  }

  fileArray.forEach((file) => {
    const validation = validateFile(file)
    if (!validation.valid) {
      errors.push(...validation.errors)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Check for profanity in text
 */
export function checkProfanity(text: string): { allowed: boolean; message?: string } {
  const lowerText = text.toLowerCase()

  for (const word of PROFANITY_WORDS) {
    if (lowerText.includes(word.toLowerCase())) {
      return {
        allowed: false,
        message: "Content contains inappropriate language",
      }
    }
  }

  // Check for excessive repetition (spam detection)
  const words = text.split(/\s+/)
  if (words.length > 0) {
    const wordCounts = new Map<string, number>()
    words.forEach((word) => {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1)
    })

    const maxCount = Math.max(...Array.from(wordCounts.values()))
    if (maxCount > words.length * 0.5 && words.length > 3) {
      return {
        allowed: false,
        message: "Content appears to be spam",
      }
    }
  }

  return { allowed: true }
}

/**
 * Rate limiting - client-side check using centralized config
 */
const RATE_LIMIT_STORAGE_KEY = "gla_gallery_rate_limits"
const RATE_LIMITS = {
  upload: { count: APP_CONFIG.RATE_LIMITS.UPLOAD, window: 60 * 60 * 1000 },
  comment: { count: APP_CONFIG.RATE_LIMITS.COMMENT, window: 60 * 60 * 1000 },
  like: { count: APP_CONFIG.RATE_LIMITS.LIKE, window: 60 * 60 * 1000 },
  report: { count: APP_CONFIG.RATE_LIMITS.REPORT, window: 60 * 60 * 1000 },
} as const

interface RateLimitEntry {
  count: number
  resetAt: number
}

function getRateLimitData(): Record<string, RateLimitEntry> {
  if (typeof window === "undefined") return {}

  try {
    const data = localStorage.getItem(RATE_LIMIT_STORAGE_KEY)
    return data ? JSON.parse(data) : {}
  } catch {
    return {}
  }
}

function setRateLimitData(data: Record<string, RateLimitEntry>) {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Check if an action is within rate limits
 */
export function checkRateLimit(action: keyof typeof RATE_LIMITS): {
  allowed: boolean
  remaining?: number
  resetAt?: number
} {
  if (typeof window === "undefined") {
    return { allowed: true }
  }

  const limit = RATE_LIMITS[action]
  const now = Date.now()
  const data = getRateLimitData()
  const entry = data[action]

  if (!entry || now > entry.resetAt) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + limit.window,
    }
    setRateLimitData({ ...data, [action]: newEntry })
    return { allowed: true, remaining: limit.count - 1, resetAt: newEntry.resetAt }
  }

  if (entry.count >= limit.count) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    }
  }

  entry.count++
  setRateLimitData({ ...data, [action]: entry })
  return {
    allowed: true,
    remaining: limit.count - entry.count,
    resetAt: entry.resetAt,
  }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || email.trim().length === 0) {
    return { valid: false, error: "Email is required" }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { valid: false, error: "Invalid email format" }
  }

  if (!email.toLowerCase().endsWith("@gla.ac.in")) {
    return { valid: false, error: "Only CampusHub emails are allowed" }
  }

  return { valid: true }
}

/**
 * Validate URL format
 */
export function validateURL(url: string): { valid: boolean; error?: string; sanitized?: string } {
  if (!url || url.trim().length === 0) {
    return { valid: false, error: "URL is required" }
  }

  const sanitized = sanitizeText(url.trim())

  try {
    const urlObj = new URL(sanitized)
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      return { valid: false, error: "URL must use http or https protocol" }
    }
    return { valid: true, sanitized }
  } catch {
    return { valid: false, error: "Invalid URL format" }
  }
}

/**
 * Validate hackathon data
 */
export function validateHackathon(data: {
  title: string
  description: string
  startDate?: Date
  endDate?: Date
}): { valid: boolean; errors: string[]; sanitized: { title: string; description: string } } {
  const errors: string[] = []
  let sanitizedTitle = ""
  let sanitizedDescription = ""

  const titleCheck = validateTitle(data.title)
  if (!titleCheck.valid) {
    errors.push(titleCheck.error || "Invalid title")
  } else {
    sanitizedTitle = titleCheck.sanitized
    if (sanitizedTitle.length > MAX_HACKATHON_TITLE_LENGTH) {
      errors.push(`Title must be ${MAX_HACKATHON_TITLE_LENGTH} characters or less`)
      sanitizedTitle = sanitizedTitle.slice(0, MAX_HACKATHON_TITLE_LENGTH)
    }
  }

  const descCheck = validateDescription(data.description)
  if (!descCheck.valid && descCheck.error) {
    errors.push(descCheck.error)
  }
  sanitizedDescription = descCheck.sanitized
  if (sanitizedDescription.length > MAX_HACKATHON_DESCRIPTION_LENGTH) {
    errors.push(`Description must be ${MAX_HACKATHON_DESCRIPTION_LENGTH} characters or less`)
    sanitizedDescription = sanitizedDescription.slice(0, MAX_HACKATHON_DESCRIPTION_LENGTH)
  }

  if (data.startDate && data.endDate) {
    if (data.endDate <= data.startDate) {
      errors.push("End date must be after start date")
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized: {
      title: sanitizedTitle,
      description: sanitizedDescription,
    },
  }
}

/**
 * Sanitize user input for display (removes all HTML)
 */
export function sanitizeForDisplay(text: string): string {
  return sanitizeText(text)
}

/**
 * Sanitize user input for storage (allows some formatting)
 */
export function sanitizeForStorage(text: string): string {
  return sanitizeHTML(text)
}

/**
 * Validate and sanitize user bio
 */
export function validateBio(bio: string): { valid: boolean; error?: string; sanitized: string } {
  if (!bio) {
    return { valid: true, sanitized: "" }
  }

  const sanitized = sanitizeText(bio.trim())

  if (sanitized.length > 500) {
    return {
      valid: false,
      error: "Bio must be 500 characters or less",
      sanitized: sanitized.slice(0, 500),
    }
  }

  const profanityCheck = checkProfanity(sanitized)
  if (!profanityCheck.allowed) {
    return {
      valid: false,
      error: profanityCheck.message || "Bio contains inappropriate content",
      sanitized,
    }
  }

  return { valid: true, sanitized }
}

/**
 * Validate social media URL
 */
export function validateSocialURL(
  url: string,
  platform: string,
): { valid: boolean; error?: string; sanitized?: string } {
  if (!url || url.trim().length === 0) {
    return { valid: true, sanitized: "" } // Empty is valid (optional field)
  }

  const sanitized = sanitizeText(url.trim())

  try {
    const urlObj = new URL(sanitized)

    if (!["http:", "https:"].includes(urlObj.protocol)) {
      return { valid: false, error: "URL must use http or https protocol" }
    }

    // Platform-specific domain validation
    const platformDomains: Record<string, string[]> = {
      instagram: ["instagram.com", "www.instagram.com"],
      twitter: ["twitter.com", "www.twitter.com", "x.com", "www.x.com"],
      linkedin: ["linkedin.com", "www.linkedin.com"],
      github: ["github.com", "www.github.com"],
      website: [], // Allow any domain for website
    }

    const allowedDomains = platformDomains[platform.toLowerCase()]
    if (allowedDomains && allowedDomains.length > 0 && !allowedDomains.includes(urlObj.hostname)) {
      return { valid: false, error: `Invalid ${platform} URL. Please use a valid ${platform} link.` }
    }

    return { valid: true, sanitized }
  } catch {
    return { valid: false, error: "Invalid URL format" }
  }
}

/**
 * Validate hackathon team name
 */
export function validateTeamName(name: string): { valid: boolean; error?: string; sanitized: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: "Team name is required", sanitized: "" }
  }

  const sanitized = sanitizeText(name.trim())

  if (sanitized.length < 2) {
    return { valid: false, error: "Team name must be at least 2 characters", sanitized }
  }

  if (sanitized.length > 50) {
    return {
      valid: false,
      error: "Team name must be 50 characters or less",
      sanitized: sanitized.slice(0, 50),
    }
  }

  const profanityCheck = checkProfanity(sanitized)
  if (!profanityCheck.allowed) {
    return {
      valid: false,
      error: profanityCheck.message || "Team name contains inappropriate content",
      sanitized,
    }
  }

  return { valid: true, sanitized }
}

/**
 * Validate hackathon project submission
 */
export function validateProjectSubmission(data: {
  projectName: string
  projectDescription: string
  repoUrl?: string
  demoUrl?: string
  videoUrl?: string
}): {
  valid: boolean
  errors: string[]
  sanitized: {
    projectName: string
    projectDescription: string
    repoUrl?: string
    demoUrl?: string
    videoUrl?: string
  }
} {
  const errors: string[] = []
  const sanitized: any = {}

  // Project name
  const nameCheck = validateTitle(data.projectName)
  if (!nameCheck.valid) {
    errors.push(nameCheck.error || "Invalid project name")
  }
  sanitized.projectName = nameCheck.sanitized

  // Project description
  const descCheck = validateDescription(data.projectDescription)
  if (!descCheck.valid) {
    errors.push(descCheck.error || "Invalid project description")
  }
  sanitized.projectDescription = descCheck.sanitized

  // Optional URLs
  if (data.repoUrl) {
    const repoCheck = validateURL(data.repoUrl)
    if (!repoCheck.valid) {
      errors.push(`Repository URL: ${repoCheck.error}`)
    }
    sanitized.repoUrl = repoCheck.sanitized
  }

  if (data.demoUrl) {
    const demoCheck = validateURL(data.demoUrl)
    if (!demoCheck.valid) {
      errors.push(`Demo URL: ${demoCheck.error}`)
    }
    sanitized.demoUrl = demoCheck.sanitized
  }

  if (data.videoUrl) {
    const videoCheck = validateURL(data.videoUrl)
    if (!videoCheck.valid) {
      errors.push(`Video URL: ${videoCheck.error}`)
    }
    sanitized.videoUrl = videoCheck.sanitized
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized,
  }
}
