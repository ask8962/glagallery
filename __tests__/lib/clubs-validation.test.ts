/**
 * Tests for Clubs Hub - Validation Schemas
 * Tests the Zod validation schema for club requests
 */
import { describe, it, expect } from 'vitest'
import { clubRequestSchema } from '../../lib/validations/clubs'

describe('clubRequestSchema', () => {
    // Test 1: Valid club request
    it('should accept a valid club request with all fields', () => {
        const validData = {
            clubName: 'Computer Science Association',
            category: 'Technical',
            vision: 'To foster innovation and technical excellence among students through workshops, hackathons, and industry collaboration.'
        }
        const result = clubRequestSchema.safeParse(validData)
        expect(result.success).toBe(true)
    })

    // Test 2: Valid request with optional logo URL
    it('should accept a valid club request with logo URL', () => {
        const validData = {
            clubName: 'Literary Club',
            category: 'Literary',
            vision: 'Promoting reading and creative writing among students.',
            proposedLogoURL: 'https://example.com/logo.png'
        }
        const result = clubRequestSchema.safeParse(validData)
        expect(result.success).toBe(true)
    })

    // Test 3: Reject short club name
    it('should reject club name shorter than 2 characters', () => {
        const invalidData = {
            clubName: 'A',
            category: 'Technical',
            vision: 'This is a valid vision statement for testing.'
        }
        const result = clubRequestSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
    })

    // Test 4: Reject short vision
    it('should reject vision shorter than 20 characters', () => {
        const invalidData = {
            clubName: 'Valid Club Name',
            category: 'Cultural',
            vision: 'Too short'
        }
        const result = clubRequestSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
    })

    // Test 5: Reject invalid category
    it('should reject invalid category', () => {
        const invalidData = {
            clubName: 'Valid Club Name',
            category: 'InvalidCategory',
            vision: 'This is a valid vision statement for testing.'
        }
        const result = clubRequestSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
    })

    // Test 6: Accept empty logo URL
    it('should accept empty string for optional logo URL', () => {
        const validData = {
            clubName: 'Sports Club',
            category: 'Sports',
            vision: 'Encouraging physical fitness and team sports.',
            proposedLogoURL: ''
        }
        const result = clubRequestSchema.safeParse(validData)
        expect(result.success).toBe(true)
    })

    // Test 7: Reject invalid logo URL
    it('should reject invalid URL format for logo', () => {
        const invalidData = {
            clubName: 'Valid Club',
            category: 'Social',
            vision: 'This is a valid vision statement for testing.',
            proposedLogoURL: 'not-a-valid-url'
        }
        const result = clubRequestSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
    })

    // Test 8: Accept all valid categories
    it('should accept all valid category types', () => {
        const categories = ['Technical', 'Cultural', 'Sports', 'Literary', 'Social', 'Other']
        categories.forEach(category => {
            const data = {
                clubName: 'Test Club',
                category,
                vision: 'This is a sufficiently long vision statement.'
            }
            const result = clubRequestSchema.safeParse(data)
            expect(result.success).toBe(true)
        })
    })

    // Test 9: Reject club name over 100 characters
    it('should reject club name over 100 characters', () => {
        const invalidData = {
            clubName: 'A'.repeat(101),
            category: 'Technical',
            vision: 'This is a valid vision statement for testing.'
        }
        const result = clubRequestSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
    })

    // Test 10: Reject vision over 1000 characters
    it('should reject vision over 1000 characters', () => {
        const invalidData = {
            clubName: 'Valid Club',
            category: 'Technical',
            vision: 'A'.repeat(1001)
        }
        const result = clubRequestSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
    })
})
