// Ritual Engine API Tests

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ritualEngineAPI } from '@/services/api/ritualEngine'
import { supabase } from '@/lib/supabase'

describe('Ritual Engine API', () => {
  let testUserId: string
  let testRitualId: string

  beforeEach(async () => {
    // Setup test user and authentication
    const { data: { user } } = await supabase.auth.signUp({
      email: `test-${Date.now()}@example.com`,
      password: 'testpassword123'
    })
    testUserId = user!.id
  })

  afterEach(async () => {
    // Cleanup test data
    if (testRitualId) {
      await ritualEngineAPI.deleteRitual(testRitualId)
    }
    await supabase.auth.signOut()
  })

  describe('Ritual CRUD Operations', () => {
    it('should create a new ritual', async () => {
      const ritualData = {
        name: 'Morning Meditation',
        description: 'Daily meditation practice',
        category: 'mindfulness' as const,
        type: 'habit' as const,
        frequency: 'daily' as const,
        duration_minutes: 20,
        difficulty_level: 3 as const,
        tags: ['meditation', 'mindfulness'],
        reminder_enabled: true,
        steps: []
      }

      const response = await ritualEngineAPI.createRitual(ritualData)
      
      expect(response.success).toBe(true)
      expect(response.data).toBeDefined()
      expect(response.data!.name).toBe(ritualData.name)
      expect(response.data!.user_id).toBe(testUserId)
      
      testRitualId = response.data!.id
    })

    it('should get user rituals with pagination', async () => {
      // Create test ritual first
      const ritualData = {
        name: 'Test Ritual',
        category: 'health' as const,
        type: 'routine' as const,
        frequency: 'daily' as const,
        steps: []
      }
      
      const createResponse = await ritualEngineAPI.createRitual(ritualData)
      testRitualId = createResponse.data!.id

      const response = await ritualEngineAPI.getRituals(1, 10)
      
      expect(response.success).toBe(true)
      expect(response.data).toBeDefined()
      expect(Array.isArray(response.data)).toBe(true)
      expect(response.pagination).toBeDefined()
      expect(response.pagination.page).toBe(1)
      expect(response.pagination.limit).toBe(10)
    })

    it('should update a ritual', async () => {
      // Create test ritual first
      const ritualData = {
        name: 'Original Name',
        category: 'health' as const,
        type: 'habit' as const,
        frequency: 'daily' as const,
        steps: []
      }
      
      const createResponse = await ritualEngineAPI.createRitual(ritualData)
      testRitualId = createResponse.data!.id

      const updates = {
        name: 'Updated Name',
        description: 'Updated description'
      }

      const response = await ritualEngineAPI.updateRitual(testRitualId, updates)
      
      expect(response.success).toBe(true)
      expect(response.data!.name).toBe(updates.name)
      expect(response.data!.description).toBe(updates.description)
    })

    it('should delete a ritual', async () => {
      // Create test ritual first
      const ritualData = {
        name: 'To Be Deleted',
        category: 'custom' as const,
        type: 'sequence' as const,
        frequency: 'weekly' as const,
        steps: []
      }
      
      const createResponse = await ritualEngineAPI.createRitual(ritualData)
      const ritualId = createResponse.data!.id

      const response = await ritualEngineAPI.deleteRitual(ritualId)
      
      expect(response.success).toBe(true)

      // Verify ritual is deleted
      const getResponse = await ritualEngineAPI.getRitual(ritualId)
      expect(getResponse.success).toBe(false)
    })
  })

  describe('Ritual Steps Management', () => {
    beforeEach(async () => {
      // Create a test ritual for step operations
      const ritualData = {
        name: 'Test Ritual for Steps',
        category: 'morning' as const,
        type: 'routine' as const,
        frequency: 'daily' as const,
        steps: []
      }
      
      const response = await ritualEngineAPI.createRitual(ritualData)
      testRitualId = response.data!.id
    })

    it('should add a step to a ritual', async () => {
      const stepData = {
        name: 'Deep Breathing',
        description: 'Take 10 deep breaths',
        order: 1,
        duration_minutes: 5,
        is_required: true
      }

      const response = await ritualEngineAPI.addRitualStep(testRitualId, stepData)
      
      expect(response.success).toBe(true)
      expect(response.data!.name).toBe(stepData.name)
      expect(response.data!.ritual_id).toBe(testRitualId)
    })

    it('should update a ritual step', async () => {
      // Add step first
      const stepData = {
        name: 'Original Step',
        order: 1,
        is_required: true
      }
      
      const addResponse = await ritualEngineAPI.addRitualStep(testRitualId, stepData)
      const stepId = addResponse.data!.id

      const updates = {
        name: 'Updated Step',
        duration_minutes: 10
      }

      const response = await ritualEngineAPI.updateRitualStep(stepId, updates)
      
      expect(response.success).toBe(true)
      expect(response.data!.name).toBe(updates.name)
      expect(response.data!.duration_minutes).toBe(updates.duration_minutes)
    })
  })

  describe('Ritual Completion Tracking', () => {
    beforeEach(async () => {
      // Create a test ritual
      const ritualData = {
        name: 'Test Completion Ritual',
        category: 'health' as const,
        type: 'habit' as const,
        frequency: 'daily' as const,
        steps: []
      }
      
      const response = await ritualEngineAPI.createRitual(ritualData)
      testRitualId = response.data!.id
    })

    it('should complete a ritual', async () => {
      const completionData = {
        duration_minutes: 25,
        mood_before: 6,
        mood_after: 8,
        energy_before: 5,
        energy_after: 7,
        notes: 'Great session today',
        completed_steps: [],
        skipped_steps: []
      }

      const response = await ritualEngineAPI.completeRitual(testRitualId, completionData)
      
      expect(response.success).toBe(true)
      expect(response.data!.ritual_id).toBe(testRitualId)
      expect(response.data!.user_id).toBe(testUserId)
      expect(response.data!.mood_before).toBe(completionData.mood_before)
      expect(response.data!.mood_after).toBe(completionData.mood_after)
    })

    it('should update ritual stats after completion', async () => {
      // Complete ritual
      await ritualEngineAPI.completeRitual(testRitualId, {
        duration_minutes: 20,
        completed_steps: [],
        skipped_steps: []
      })

      // Check if ritual stats were updated
      const response = await ritualEngineAPI.getRitual(testRitualId)
      
      expect(response.success).toBe(true)
      expect(response.data!.total_completions).toBe(1)
      expect(response.data!.streak_count).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Ritual Analytics', () => {
    beforeEach(async () => {
      // Create test ritual and completions
      const ritualData = {
        name: 'Analytics Test Ritual',
        category: 'mindfulness' as const,
        type: 'habit' as const,
        frequency: 'daily' as const,
        steps: []
      }
      
      const response = await ritualEngineAPI.createRitual(ritualData)
      testRitualId = response.data!.id

      // Add some completions
      for (let i = 0; i < 5; i++) {
        await ritualEngineAPI.completeRitual(testRitualId, {
          duration_minutes: 20 + i,
          mood_before: 5 + i,
          mood_after: 7 + i,
          completed_steps: [],
          skipped_steps: []
        })
      }
    })

    it('should get ritual analytics', async () => {
      const response = await ritualEngineAPI.getRitualAnalytics(testRitualId, '30d')
      
      expect(response.success).toBe(true)
      expect(response.data).toBeDefined()
      expect(response.data.totalCompletions).toBe(5)
      expect(response.data.averages).toBeDefined()
      expect(response.data.improvements).toBeDefined()
      expect(response.data.completionsByDay).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle missing required fields', async () => {
      const invalidRitualData = {
        name: 'Test Ritual'
        // Missing required fields
      }

      const response = await ritualEngineAPI.createRitual(invalidRitualData as any)
      
      expect(response.success).toBe(false)
      expect(response.error).toBeDefined()
    })

    it('should handle unauthorized access', async () => {
      // Sign out to test unauthorized access
      await supabase.auth.signOut()

      const ritualData = {
        name: 'Unauthorized Ritual',
        category: 'custom' as const,
        type: 'habit' as const,
        frequency: 'daily' as const,
        steps: []
      }

      const response = await ritualEngineAPI.createRitual(ritualData)
      
      expect(response.success).toBe(false)
      expect(response.error).toContain('Authentication required')
    })
  })

  describe('Input Validation', () => {
    it('should sanitize input strings', async () => {
      const ritualData = {
        name: '<script>alert("xss")</script>Clean Name',
        description: 'Description with <tags>',
        category: 'custom' as const,
        type: 'habit' as const,
        frequency: 'daily' as const,
        steps: []
      }

      const response = await ritualEngineAPI.createRitual(ritualData)
      
      expect(response.success).toBe(true)
      expect(response.data!.name).not.toContain('<script>')
      expect(response.data!.name).not.toContain('<tags>')
      
      testRitualId = response.data!.id
    })

    it('should validate enum values', async () => {
      const invalidRitualData = {
        name: 'Test Ritual',
        category: 'invalid_category',
        type: 'habit' as const,
        frequency: 'daily' as const,
        steps: []
      }

      const response = await ritualEngineAPI.createRitual(invalidRitualData as any)
      
      expect(response.success).toBe(false)
      expect(response.error).toBeDefined()
    })
  })
})