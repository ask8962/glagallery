/**
 * No-Show Penalty System Utilities
 * Tracks user attendance at events and calculates reliability scores
 */

export type EventStats = {
    registered: number
    attended: number
    noShows: number
    lastNoShowAt?: Date | null
}

export type ReliabilityBadge = "Excellent" | "Good" | "Fair" | "Poor" | "New"

// Thresholds
const NO_SHOW_RESTRICTION_THRESHOLD = 3 // Number of no-shows before restriction
const DECAY_MONTHS = 6 // Months after which old no-shows are forgiven

/**
 * Calculate reliability score (0-100) based on event attendance stats
 * Score = (attended / registered) * 100, with penalties for no-shows
 */
export function calculateReliabilityScore(stats: EventStats | undefined): number {
    if (!stats || stats.registered === 0) {
        return 100 // New users start with perfect score
    }

    const { registered, attended, noShows } = stats

    // Base score from attendance rate
    const attendanceRate = registered > 0 ? (attended / registered) * 100 : 100

    // Penalty: Each no-show reduces score by 10 points
    const noShowPenalty = noShows * 10

    // Final score, clamped between 0 and 100
    const score = Math.max(0, Math.min(100, attendanceRate - noShowPenalty))

    return Math.round(score)
}

/**
 * Determine if a user should be restricted from paid events
 */
export function shouldRestrictUser(stats: EventStats | undefined): boolean {
    if (!stats) return false

    // Check if no-shows exceed threshold
    if (stats.noShows >= NO_SHOW_RESTRICTION_THRESHOLD) {
        // Check if last no-show is within decay period
        if (stats.lastNoShowAt) {
            const lastNoShow = stats.lastNoShowAt instanceof Date
                ? stats.lastNoShowAt
                : new Date(stats.lastNoShowAt)
            const monthsAgo = (Date.now() - lastNoShow.getTime()) / (1000 * 60 * 60 * 24 * 30)

            // If last no-show was more than DECAY_MONTHS ago, forgive
            if (monthsAgo > DECAY_MONTHS) {
                return false
            }
        }
        return true
    }

    return false
}

/**
 * Get reliability badge text based on score
 */
export function getReliabilityBadge(score: number, totalRegistered: number = 0): ReliabilityBadge {
    if (totalRegistered === 0) return "New"
    if (score >= 90) return "Excellent"
    if (score >= 70) return "Good"
    if (score >= 50) return "Fair"
    return "Poor"
}

/**
 * Get badge color variant for UI
 */
export function getReliabilityColor(badge: ReliabilityBadge): string {
    switch (badge) {
        case "Excellent": return "bg-green-500/20 text-green-400 border-green-500/30"
        case "Good": return "bg-blue-500/20 text-blue-400 border-blue-500/30"
        case "Fair": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
        case "Poor": return "bg-red-500/20 text-red-400 border-red-500/30"
        case "New": return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
}

/**
 * Initialize default event stats for a new user
 */
export function getDefaultEventStats(): EventStats {
    return {
        registered: 0,
        attended: 0,
        noShows: 0,
        lastNoShowAt: null
    }
}
