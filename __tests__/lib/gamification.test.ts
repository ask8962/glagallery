import { describe, it, expect } from 'vitest'
import { getUserLevel, POINTS, LEVELS, BADGES } from '@/lib/gamification'

describe('Gamification System', () => {
    describe('getUserLevel', () => {
        it('should return level 1 for 0 points', () => {
            const result = getUserLevel(0)
            expect(result.level).toBe(1)
            expect(result.title).toBe('Freshman')
            expect(result.nextLevel).toBeDefined()
            expect(result.nextLevel?.level).toBe(2)
        })

        it('should return level 2 for 50 points', () => {
            const result = getUserLevel(50)
            expect(result.level).toBe(2)
            expect(result.title).toBe('Sophomore')
        })

        it('should return level 3 for 150 points', () => {
            const result = getUserLevel(150)
            expect(result.level).toBe(3)
            expect(result.title).toBe('Junior')
        })

        it('should return level 5 for 500 points', () => {
            const result = getUserLevel(500)
            expect(result.level).toBe(5)
            expect(result.title).toBe('Graduate')
        })

        it('should return max level 8 for 1500+ points', () => {
            const result = getUserLevel(1500)
            expect(result.level).toBe(8)
            expect(result.title).toBe('Hall of Fame')
            expect(result.nextLevel).toBeUndefined()
        })

        it('should return max level 8 for very high points', () => {
            const result = getUserLevel(99999)
            expect(result.level).toBe(8)
            expect(result.title).toBe('Hall of Fame')
        })

        it('should return level 1 for negative points', () => {
            const result = getUserLevel(-10)
            expect(result.level).toBe(1)
            expect(result.title).toBe('Freshman')
        })

        it('should return correct nextLevel info', () => {
            const result = getUserLevel(0)
            expect(result.nextLevel?.minPoints).toBe(50)
        })

        it('should handle boundary points exactly at level thresholds', () => {
            const result49 = getUserLevel(49)
            expect(result49.level).toBe(1)

            const result50 = getUserLevel(50)
            expect(result50.level).toBe(2)

            const result300 = getUserLevel(300)
            expect(result300.level).toBe(4)
        })
    })

    describe('POINTS config', () => {
        it('should have positive values for all point types', () => {
            expect(POINTS.UPLOAD_POST).toBeGreaterThan(0)
            expect(POINTS.RECEIVE_LIKE).toBeGreaterThan(0)
            expect(POINTS.RECEIVE_COMMENT).toBeGreaterThan(0)
            expect(POINTS.GIVE_COMMENT).toBeGreaterThan(0)
            expect(POINTS.DAILY_LOGIN).toBeGreaterThan(0)
            expect(POINTS.CHALLENGE_COMPLETE).toBeGreaterThan(0)
            expect(POINTS.FIRST_POST).toBeGreaterThan(0)
            expect(POINTS.PROFILE_COMPLETE).toBeGreaterThan(0)
        })
    })

    describe('LEVELS config', () => {
        it('should have levels in ascending order', () => {
            for (let i = 1; i < LEVELS.length; i++) {
                expect(LEVELS[i].minPoints).toBeGreaterThan(LEVELS[i - 1].minPoints)
                expect(LEVELS[i].level).toBe(LEVELS[i - 1].level + 1)
            }
        })

        it('should start at level 1 with 0 minimum points', () => {
            expect(LEVELS[0].level).toBe(1)
            expect(LEVELS[0].minPoints).toBe(0)
        })
    })

    describe('BADGES config', () => {
        it('should have unique badge IDs', () => {
            const ids = Object.values(BADGES).map(b => b.id)
            const uniqueIds = new Set(ids)
            expect(uniqueIds.size).toBe(ids.length)
        })

        it('should have name, description, and icon for all badges', () => {
            Object.values(BADGES).forEach(badge => {
                expect(badge.name).toBeTruthy()
                expect(badge.description).toBeTruthy()
                expect(badge.icon).toBeTruthy()
            })
        })

        it('should have at least 5 badges defined', () => {
            expect(Object.keys(BADGES).length).toBeGreaterThanOrEqual(5)
        })
    })
})
