import { describe, it, expect } from 'vitest'
import { signInSchema, signUpSchema, createFarmSchema, createProductionSchema } from '../validations'

describe('Validation Schemas', () => {
  describe('signInSchema', () => {
    it('should validate correct sign-in data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      }

      const result = signInSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
      }

      const result = signInSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject empty password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '',
      }

      const result = signInSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('signUpSchema', () => {
    it('should validate correct sign-up data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
        organizationName: 'Test Farm',
      }

      const result = signUpSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject weak password', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'weak',
        organizationName: 'Test Farm',
      }

      const result = signUpSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject short organization name', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
        organizationName: 'A',
      }

      const result = signUpSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('createFarmSchema', () => {
    it('should validate correct farm data', () => {
      const validData = {
        name: 'North Farm',
        location: 'North Valley',
        description: 'Main production facility',
      }

      const result = createFarmSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject short farm name', () => {
      const invalidData = {
        name: 'A',
        location: 'North Valley',
      }

      const result = createFarmSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('createProductionSchema', () => {
    it('should validate correct production data', () => {
      const validData = {
        date: '2024-01-15',
        totalEggs: 100,
        brokenEggs: 5,
        damagedEggs: 3,
        shedId: 'shed-1',
      }

      const result = createProductionSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject negative egg counts', () => {
      const invalidData = {
        date: '2024-01-15',
        totalEggs: -10,
        brokenEggs: 5,
        damagedEggs: 3,
        shedId: 'shed-1',
      }

      const result = createProductionSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject when broken + damaged > total', () => {
      const invalidData = {
        date: '2024-01-15',
        totalEggs: 100,
        brokenEggs: 60,
        damagedEggs: 50,
        shedId: 'shed-1',
      }

      const result = createProductionSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})