import { describe, it, expect } from 'vitest'
import {
    calculateReliabilityScore,
    shouldRestrictUser,
    getReliabilityBadge,
} from '@/lib/noshow-utils'

describe('No-Show Utilities', () => {
    describe('calculateReliabilityScore', () => {
        it('should return 100 for a user with perfect attendance', () => {
            const score = calculateReliabilityScore({
                registered: 10,
                attended: 10,
                noShows: 0,
            })
            expect(score).toBe(100)
        })

        it('should return lower score with no-shows', () => {
            const score = calculateReliabilityScore({
                registered: 10,
                attended: 7,
                noShows: 3,
            })
            expect(score).toBeLessThan(100)
            expect(score).toBeGreaterThan(0)
        })

        it('should return 100 for a new user with no events', () => {
            const score = calculateReliabilityScore({
                registered: 0,
                attended: 0,
                noShows: 0,
            })
            expect(score).toBe(100)
        })

        it('should return low score for all no-shows', () => {
            const score = calculateReliabilityScore({
                registered: 5,
                attended: 0,
                noShows: 5,
            })
            expect(score).toBeLessThanOrEqual(30)
        })

        it('should handle edge case with attended > registered', () => {
            // Should not crash and remain reasonable
            const score = calculateReliabilityScore({
                registered: 3,
                attended: 5,
                noShows: 0,
            })
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(100)
        })
    })

    describe('shouldRestrictUser', () => {
        it('should not restrict a user with no events', () => {
            expect(shouldRestrictUser({
                registered: 0,
                attended: 0,
                noShows: 0,
            })).toBe(false)
        })

        it('should not restrict a user with perfect attendance', () => {
            expect(shouldRestrictUser({
                registered: 10,
                attended: 10,
                noShows: 0,
            })).toBe(false)
        })

        it('should restrict a user with many no-shows', () => {
            expect(shouldRestrictUser({
                registered: 10,
                attended: 2,
                noShows: 8,
            })).toBe(true)
        })

        it('should not restrict users with only 1 no-show', () => {
            expect(shouldRestrictUser({
                registered: 5,
                attended: 4,
                noShows: 1,
            })).toBe(false)
        })
    })

    describe('getReliabilityBadge', () => {
        it('should return reliable badge for high score', () => {
            const badge = getReliabilityBadge(95)
            expect(badge).toBeDefined()
            expect(badge?.color || badge?.label).toBeDefined()
        })

        it('should return a warning badge for low score', () => {
            const badge = getReliabilityBadge(30)
            expect(badge).toBeDefined()
        })

        it('should handle edge case score of 0', () => {
            const badge = getReliabilityBadge(0)
            expect(badge).toBeDefined()
        })

        it('should handle perfect score of 100', () => {
            const badge = getReliabilityBadge(100)
            expect(badge).toBeDefined()
        })
    })
})
