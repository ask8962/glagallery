/**
 * Content Moderation Utilities
 *
 * Automated content filtering for posts, comments, and user-generated content.
 * Includes profanity filtering, spam detection, and content scoring.
 */

// Extended profanity word list (basic - in production use a comprehensive library)
const PROFANITY_LIST: string[] = [
  // Add common profanity words here
  // This is a minimal list for demonstration
]

// Spam patterns
const SPAM_PATTERNS = [
  /(.)\1{4,}/i, // Repeated characters (5+ times)
  /\b(buy|sell|click|free|winner|prize|lottery|earn money)\b/i,
  /(http|https):\/\/[^\s]+/i, // URLs (flag for review)
  /([A-Z]){10,}/i, // Excessive caps
  /(.+)\1{3,}/i, // Repeated phrases
]

// Sensitive content patterns
const SENSITIVE_PATTERNS = [/\b(hate|kill|die|attack)\b/i, /\b(drugs?|alcohol|smoking)\b/i]

export interface ModerationResult {
  allowed: boolean
  flagged: boolean
  score: number // 0-100, higher = more concerning
  reasons: string[]
  sanitizedText?: string
}

export interface ModerationOptions {
  checkProfanity?: boolean
  checkSpam?: boolean
  checkSensitive?: boolean
  strictMode?: boolean
  maxLength?: number
}

const DEFAULT_OPTIONS: ModerationOptions = {
  checkProfanity: true,
  checkSpam: true,
  checkSensitive: true,
  strictMode: false,
  maxLength: 5000,
}

/**
 * Moderate text content
 */
export function moderateContent(text: string, options: ModerationOptions = {}): ModerationResult {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const reasons: string[] = []
  let score = 0
  let flagged = false

  // Empty text check
  if (!text || text.trim().length === 0) {
    return {
      allowed: false,
      flagged: false,
      score: 0,
      reasons: ["Content is empty"],
    }
  }

  const lowerText = text.toLowerCase()

  // Length check
  if (opts.maxLength && text.length > opts.maxLength) {
    reasons.push(`Content exceeds maximum length of ${opts.maxLength} characters`)
    score += 10
    flagged = true
  }

  // Profanity check
  if (opts.checkProfanity) {
    const profanityResult = checkProfanity(lowerText)
    if (profanityResult.found) {
      reasons.push("Contains potentially inappropriate language")
      score += profanityResult.severity * 20
      flagged = true
    }
  }

  // Spam check
  if (opts.checkSpam) {
    const spamResult = checkSpam(text)
    if (spamResult.isSpam) {
      reasons.push(...spamResult.reasons)
      score += spamResult.score
      flagged = true
    }
  }

  // Sensitive content check
  if (opts.checkSensitive) {
    const sensitiveResult = checkSensitiveContent(lowerText)
    if (sensitiveResult.found) {
      reasons.push("May contain sensitive content")
      score += sensitiveResult.severity * 15
      flagged = true
    }
  }

  // Determine if content is allowed
  const threshold = opts.strictMode ? 30 : 50
  const allowed = score < threshold

  return {
    allowed,
    flagged,
    score: Math.min(score, 100),
    reasons,
    sanitizedText: sanitizeContent(text),
  }
}

/**
 * Check for profanity
 */
function checkProfanity(text: string): { found: boolean; severity: number } {
  let severity = 0

  for (const word of PROFANITY_LIST) {
    if (text.includes(word.toLowerCase())) {
      severity++
    }
  }

  return {
    found: severity > 0,
    severity: Math.min(severity, 5),
  }
}

/**
 * Check for spam patterns
 */
function checkSpam(text: string): { isSpam: boolean; score: number; reasons: string[] } {
  const reasons: string[] = []
  let score = 0

  // Check for spam patterns
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(text)) {
      score += 15
      reasons.push("Matches spam pattern")
    }
  }

  // Check for excessive repetition
  const words = text.split(/\s+/)
  if (words.length > 3) {
    const wordCounts = new Map<string, number>()
    words.forEach((word) => {
      const lower = word.toLowerCase()
      wordCounts.set(lower, (wordCounts.get(lower) || 0) + 1)
    })

    const maxCount = Math.max(...Array.from(wordCounts.values()))
    if (maxCount > words.length * 0.5) {
      score += 25
      reasons.push("Excessive word repetition detected")
    }
  }

  // Check for excessive punctuation
  const punctuationCount = (text.match(/[!?]{2,}/g) || []).length
  if (punctuationCount > 3) {
    score += 10
    reasons.push("Excessive punctuation")
  }

  // Check for all caps
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length
  if (capsRatio > 0.7 && text.length > 10) {
    score += 15
    reasons.push("Excessive capitalization")
  }

  return {
    isSpam: score > 20,
    score,
    reasons,
  }
}

/**
 * Check for sensitive content
 */
function checkSensitiveContent(text: string): { found: boolean; severity: number } {
  let severity = 0

  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(text)) {
      severity++
    }
  }

  return {
    found: severity > 0,
    severity: Math.min(severity, 3),
  }
}

/**
 * Sanitize content by removing or replacing problematic text
 */
export function sanitizeContent(text: string): string {
  let sanitized = text

  // Replace profanity with asterisks
  for (const word of PROFANITY_LIST) {
    const regex = new RegExp(`\\b${word}\\b`, "gi")
    sanitized = sanitized.replace(regex, "*".repeat(word.length))
  }

  // Remove excessive whitespace
  sanitized = sanitized.replace(/\s{3,}/g, "  ")

  // Remove excessive punctuation
  sanitized = sanitized.replace(/([!?.]){4,}/g, "$1$1$1")

  return sanitized.trim()
}

/**
 * Auto-hide content based on moderation result
 */
export function shouldAutoHide(result: ModerationResult): boolean {
  return result.score >= 70 || !result.allowed
}

/**
 * Get moderation action recommendation
 */
export function getModerationAction(result: ModerationResult): "approve" | "review" | "reject" {
  if (result.score < 20) return "approve"
  if (result.score < 50) return "review"
  return "reject"
}

/**
 * Moderate image content (placeholder for future AI integration)
 * In production, this would integrate with Google Vision API, AWS Rekognition, etc.
 */
export async function moderateImage(imageUrl: string): Promise<ModerationResult> {
  // Placeholder - in production, integrate with image moderation API
  return {
    allowed: true,
    flagged: false,
    score: 0,
    reasons: [],
  }
}

/**
 * Batch moderate content
 */
export function moderateContentBatch(
  items: { id: string; text: string }[],
  options?: ModerationOptions,
): Map<string, ModerationResult> {
  const results = new Map<string, ModerationResult>()

  for (const item of items) {
    results.set(item.id, moderateContent(item.text, options))
  }

  return results
}

/**
 * Check if user should be flagged based on history
 */
export function checkUserModerationHistory(
  violations: number,
  timeframeDays = 30,
): {
  action: "none" | "warn" | "restrict" | "ban"
  reason: string
} {
  if (violations === 0) {
    return { action: "none", reason: "No violations" }
  }

  if (violations <= 2) {
    return { action: "warn", reason: `${violations} violation(s) in the last ${timeframeDays} days` }
  }

  if (violations <= 5) {
    return {
      action: "restrict",
      reason: `${violations} violations - posting restricted`,
    }
  }

  return {
    action: "ban",
    reason: `${violations} violations - account suspended`,
  }
}
