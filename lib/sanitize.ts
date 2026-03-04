/**
 * @deprecated This module is not imported by any consumer code.
 * All consumers import sanitizeText from validation.ts instead.
 */

/**
 * Input Sanitization Utility
 * 
 * Prevents XSS (Cross-Site Scripting) attacks by sanitizing user input.
 * Uses DOMPurify for HTML sanitization.
 */

import DOMPurify from "isomorphic-dompurify"

/**
 * Sanitize HTML content - removes all potentially dangerous HTML/JS
 * Use for rich text content that may contain HTML formatting
 */
export function sanitizeHtml(input: string): string {
    if (!input || typeof input !== "string") return ""

    return DOMPurify.sanitize(input, {
        ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "p", "br", "ul", "ol", "li"],
        ALLOWED_ATTR: ["href", "target", "rel"],
        ALLOW_DATA_ATTR: false,
    })
}

/**
 * Sanitize plain text - strips ALL HTML tags
 * Use for text that should have no HTML at all (names, titles, etc.)
 */
export function sanitizeText(input: string): string {
    if (!input || typeof input !== "string") return ""

    // Remove all HTML tags
    return DOMPurify.sanitize(input, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
    }).trim()
}

/**
 * Sanitize and limit text length
 * Use for constrained text fields
 */
export function sanitizeTextWithLimit(input: string, maxLength: number): string {
    const sanitized = sanitizeText(input)
    return sanitized.slice(0, maxLength)
}

/**
 * Sanitize a URL - validates it's a safe URL
 * Prevents javascript: and data: URL attacks
 */
export function sanitizeUrl(input: string): string {
    if (!input || typeof input !== "string") return ""

    const trimmed = input.trim()

    // Only allow http, https, and relative URLs
    if (
        trimmed.startsWith("http://") ||
        trimmed.startsWith("https://") ||
        trimmed.startsWith("/")
    ) {
        return trimmed
    }

    return ""
}

/**
 * Sanitize an object's string fields recursively
 * Use for sanitizing entire request bodies
 */
export function sanitizeObject<T extends Record<string, unknown>>(
    obj: T,
    fieldsToSanitize: string[]
): T {
    const sanitized: Record<string, unknown> = { ...obj }

    for (const field of fieldsToSanitize) {
        if (field in sanitized && typeof sanitized[field] === "string") {
            sanitized[field] = sanitizeText(sanitized[field] as string)
        }
    }

    return sanitized as T
}
