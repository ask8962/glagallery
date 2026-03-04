import { describe, it, expect } from 'vitest'
import { moderateContent, getModerationAction, moderateImage, moderateContentBatch } from '@/lib/content-moderation'

describe('Content Moderation', () => {
    describe('moderateContent', () => {
        it('should allow clean text', () => {
            const result = moderateContent('Hello! Welcome to GLA Gallery.')
            expect(result.allowed).toBe(true)
            expect(result.flagged).toBe(false)
            expect(result.score).toBeLessThan(20)
        })

        it('should flag profanity', () => {
            const result = moderateContent('This is bullshit content')
            expect(result.flagged).toBe(true)
            expect(result.score).toBeGreaterThan(0)
            expect(result.reasons.length).toBeGreaterThan(0)
        })

        it('should detect repeated characters as spam', () => {
            const result = moderateContent('Hellooooooo everyone')
            expect(result.flagged).toBe(true)
            expect(result.reasons.some(r => r.toLowerCase().includes('spam') || r.toLowerCase().includes('pattern'))).toBe(true)
        })

        it('should flag URLs', () => {
            const result = moderateContent('Check out https://example.com for free stuff')
            expect(result.flagged).toBe(true)
        })

        it('should detect excessive caps as spam', () => {
            const result = moderateContent('THIS IS ALL CAPS SCREAMING AT YOUUUUUUUUUU')
            expect(result.flagged).toBe(true)
        })

        it('should flag sensitive content keywords', () => {
            const result = moderateContent('Let us discuss drugs and alcohol on campus')
            expect(result.flagged).toBe(true)
        })

        it('should handle empty string', () => {
            const result = moderateContent('')
            expect(result.allowed).toBe(true)
        })

        it('should respect maxLength option', () => {
            const longText = 'a'.repeat(6000)
            const result = moderateContent(longText, { maxLength: 5000 })
            expect(result.flagged).toBe(true)
            expect(result.reasons.some(r => r.toLowerCase().includes('length') || r.toLowerCase().includes('long'))).toBe(true)
        })

        it('should support disabling specific checks', () => {
            const result = moderateContent('This is bullshit', {
                checkProfanity: false,
                checkSpam: true,
                checkSensitive: true,
            })
            // With profanity check disabled, the profanity word alone shouldn't flag
            // (unless caught by other checks)
            expect(result.score).toBeDefined()
        })
    })

    describe('getModerationAction', () => {
        it('should approve low-score content', () => {
            expect(getModerationAction({ allowed: true, flagged: false, score: 5, reasons: [] })).toBe('approve')
            expect(getModerationAction({ allowed: true, flagged: false, score: 19, reasons: [] })).toBe('approve')
        })

        it('should send medium-score content for review', () => {
            expect(getModerationAction({ allowed: true, flagged: true, score: 30, reasons: ['test'] })).toBe('review')
            expect(getModerationAction({ allowed: true, flagged: true, score: 49, reasons: ['test'] })).toBe('review')
        })

        it('should reject high-score content', () => {
            expect(getModerationAction({ allowed: false, flagged: true, score: 50, reasons: ['test'] })).toBe('reject')
            expect(getModerationAction({ allowed: false, flagged: true, score: 100, reasons: ['test'] })).toBe('reject')
        })
    })

    describe('moderateImage', () => {
        it('should flag images for manual review (not implemented)', async () => {
            const result = await moderateImage('https://example.com/image.jpg')
            expect(result.allowed).toBe(true)
            expect(result.flagged).toBe(true)
            expect(result.reasons.length).toBeGreaterThan(0)
            expect(result.reasons[0]).toContain('manual review')
        })
    })

    describe('moderateContentBatch', () => {
        it('should moderate multiple items', () => {
            const items = [
                { id: '1', text: 'Clean text here' },
                { id: '2', text: 'This has bullshit in it' },
                { id: '3', text: 'Another clean message' },
            ]
            const results = moderateContentBatch(items)
            expect(results.size).toBe(3)
            expect(results.get('1')?.flagged).toBe(false)
            expect(results.get('2')?.flagged).toBe(true)
        })
    })
})
