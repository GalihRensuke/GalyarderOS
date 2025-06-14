// Flow State API Tests

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { flowStateAPI } from '@/services/api/flowState'
import { supabase } from '@/lib/supabase'

describe('Flow State API', () => {
  let testUserId: string
  let testSessionId: string

  beforeEach(async () => {
    // Setup test user and authentication
    const { data: { user } } = await supabase.auth.signUp({
      email: `test-flow-${Date.now()}@example.com`,
      password: 'testpassword123'
    })
    testUserId = user!.id
  })

  afterEach(async () => {
    // Cleanup test data
    if (testSessionId) {
      await flowStateAPI.completeFlowSession(testSessionId, {})
    }
    await supabase.auth.signOut()
  })

  describe('Flow Session Management', () => {
    it('should create a new flow session', async () => {
      const sessionData = {
        name: 'Deep Work Session',
        type: 'deep_work' as const,
        planned_duration: 90,
        environment_settings: {
          noise_level: 'ambient' as const,
          lighting: 'natural' as const,
          temperature_preference: 'comfortable' as const,
          music_enabled: true,
          music_type: 'instrumental',
          notifications_blocked: true,
          website_blocking_enabled: true,
          blocked_websites: ['facebook.com', 'twitter.com']
        },
        metrics: {
          focus_intervals: [],
          screen_time_distribution: {},
          app_usage: {}
        },
        tags: ['work', 'coding']
      }

      const response = await flowStateAPI.createFlowSession(sessionData)
      
      expect(response.success).toBe(true)
      expect(response.data).toBeDefined()
      expect(response.data!.name).toBe(sessionData.name)
      expect(response.data!.user_id).toBe(testUserId)
      expect(response.data!.status).toBe('planned')
      
      testSessionId = response.data!.id
    })

    it('should start a flow session', async () => {
      // Create session first
      const sessionData = {
        name: 'Test Session',
        type: 'creative' as const,
        planned_duration: 60,
        environment_settings: {
          noise_level: 'silent' as const,
          lighting: 'dim' as const,
          temperature_preference: 'cool' as const,
          music_enabled: false,
          notifications_blocked: true,
          website_blocking_enabled: false,
          blocked_websites: []
        },
        metrics: { focus_intervals: [], screen_time_distribution: {}, app_usage: {} },
        tags: []
      }
      
      const createResponse = await flowStateAPI.createFlowSession(sessionData)
      testSessionId = createResponse.data!.id

      const response = await flowStateAPI.startFlowSession(testSessionId)
      
      expect(response.success).toBe(true)
      expect(response.data!.status).toBe('active')
      expect(response.data!.start_time).toBeDefined()
    })

    it('should pause a flow session', async () => {
      // Create and start session
      const sessionData = {
        name: 'Pause Test Session',
        type: 'learning' as const,
        planned_duration: 45,
        environment_settings: {
          noise_level: 'moderate' as const,
          lighting: 'bright' as const,
          temperature_preference: 'warm' as const,
          music_enabled: true,
          notifications_blocked: false,
          website_blocking_enabled: false,
          blocked_websites: []
        },
        metrics: { focus_intervals: [], screen_time_distribution: {}, app_usage: {} },
        tags: []
      }
      
      const createResponse = await flowStateAPI.createFlowSession(sessionData)
      testSessionId = createResponse.data!.id
      
      await flowStateAPI.startFlowSession(testSessionId)
      
      const response = await flowStateAPI.pauseFlowSession(testSessionId)
      
      expect(response.success).toBe(true)
      expect(response.data!.status).toBe('paused')
    })

    it('should complete a flow session with metrics', async () => {
      // Create and start session
      const sessionData = {
        name: 'Complete Test Session',
        type: 'problem_solving' as const,
        planned_duration: 30,
        environment_settings: {
          noise_level: 'ambient' as const,
          lighting: 'natural' as const,
          temperature_preference: 'comfortable' as const,
          music_enabled: false,
          notifications_blocked: true,
          website_blocking_enabled: true,
          blocked_websites: ['reddit.com']
        },
        metrics: { focus_intervals: [], screen_time_distribution: {}, app_usage: {} },
        tags: []
      }
      
      const createResponse = await flowStateAPI.createFlowSession(sessionData)
      testSessionId = createResponse.data!.id
      
      await flowStateAPI.startFlowSession(testSessionId)

      const completionData = {
        focus_score: 8,
        productivity_score: 9,
        notes: 'Excellent focus session',
        final_metrics: {
          heart_rate_avg: 72,
          keystroke_dynamics: { wpm: 65 },
          focus_intervals: [
            {
              start_time: new Date().toISOString(),
              end_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
              focus_level: 8,
              activity_type: 'coding',
              interruptions: 1
            }
          ]
        }
      }

      const response = await flowStateAPI.completeFlowSession(testSessionId, completionData)
      
      expect(response.success).toBe(true)
      expect(response.data!.status).toBe('completed')
      expect(response.data!.focus_score).toBe(completionData.focus_score)
      expect(response.data!.productivity_score).toBe(completionData.productivity_score)
      expect(response.data!.actual_duration).toBeGreaterThan(0)
    })
  })

  describe('Distraction Management', () => {
    beforeEach(async () => {
      // Create and start a test session
      const sessionData = {
        name: 'Distraction Test Session',
        type: 'deep_work' as const,
        planned_duration: 60,
        environment_settings: {
          noise_level: 'silent' as const,
          lighting: 'natural' as const,
          temperature_preference: 'comfortable' as const,
          music_enabled: false,
          notifications_blocked: true,
          website_blocking_enabled: true,
          blocked_websites: ['social-media.com']
        },
        metrics: { focus_intervals: [], screen_time_distribution: {}, app_usage: {} },
        tags: []
      }
      
      const response = await flowStateAPI.createFlowSession(sessionData)
      testSessionId = response.data!.id
      await flowStateAPI.startFlowSession(testSessionId)
    })

    it('should record a distraction', async () => {
      const distractionData = {
        type: 'notification',
        source: 'email',
        duration_seconds: 30,
        timestamp: new Date().toISOString()
      }

      const response = await flowStateAPI.recordDistraction(testSessionId, distractionData)
      
      expect(response.success).toBe(true)
    })

    it('should enable distraction blocking', async () => {
      const blockedWebsites = ['facebook.com', 'twitter.com', 'youtube.com']

      const response = await flowStateAPI.enableDistractionBlocking(testSessionId, blockedWebsites)
      
      expect(response.success).toBe(true)
    })
  })

  describe('Focus Tracking', () => {
    beforeEach(async () => {
      // Create and start a test session
      const sessionData = {
        name: 'Focus Tracking Session',
        type: 'creative' as const,
        planned_duration: 90,
        environment_settings: {
          noise_level: 'ambient' as const,
          lighting: 'dim' as const,
          temperature_preference: 'cool' as const,
          music_enabled: true,
          music_type: 'ambient',
          notifications_blocked: true,
          website_blocking_enabled: false,
          blocked_websites: []
        },
        metrics: { focus_intervals: [], screen_time_distribution: {}, app_usage: {} },
        tags: []
      }
      
      const response = await flowStateAPI.createFlowSession(sessionData)
      testSessionId = response.data!.id
      await flowStateAPI.startFlowSession(testSessionId)
    })

    it('should record focus intervals', async () => {
      const focusInterval = {
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        focus_level: 9,
        activity_type: 'writing',
        interruptions: 0
      }

      const response = await flowStateAPI.recordFocusInterval(testSessionId, focusInterval)
      
      expect(response.success).toBe(true)
    })

    it('should update flow metrics', async () => {
      const metricsUpdate = {
        heart_rate_avg: 68,
        heart_rate_variability: 45,
        keystroke_dynamics: { wpm: 72, accuracy: 0.96 },
        screen_time_distribution: { 
          'code-editor': 0.8, 
          'browser': 0.15, 
          'other': 0.05 
        }
      }

      const response = await flowStateAPI.updateFlowMetrics(testSessionId, metricsUpdate)
      
      expect(response.success).toBe(true)
      expect(response.data!.metrics.heart_rate_avg).toBe(metricsUpdate.heart_rate_avg)
    })
  })

  describe('Flow Analytics', () => {
    beforeEach(async () => {
      // Create multiple completed sessions for analytics
      for (let i = 0; i < 3; i++) {
        const sessionData = {
          name: `Analytics Session ${i + 1}`,
          type: 'deep_work' as const,
          planned_duration: 60,
          environment_settings: {
            noise_level: 'ambient' as const,
            lighting: 'natural' as const,
            temperature_preference: 'comfortable' as const,
            music_enabled: i % 2 === 0,
            notifications_blocked: true,
            website_blocking_enabled: true,
            blocked_websites: []
          },
          metrics: { focus_intervals: [], screen_time_distribution: {}, app_usage: {} },
          tags: []
        }
        
        const createResponse = await flowStateAPI.createFlowSession(sessionData)
        const sessionId = createResponse.data!.id
        
        await flowStateAPI.startFlowSession(sessionId)
        await flowStateAPI.completeFlowSession(sessionId, {
          focus_score: 7 + i,
          productivity_score: 8 + i,
          notes: `Session ${i + 1} completed`
        })
      }
    })

    it('should get flow analytics', async () => {
      const response = await flowStateAPI.getFlowAnalytics('30d')
      
      expect(response.success).toBe(true)
      expect(response.data).toBeDefined()
      expect(response.data.totalSessions).toBeGreaterThanOrEqual(3)
      expect(response.data.completedSessions).toBeGreaterThanOrEqual(3)
      expect(response.data.averageFocusScore).toBeGreaterThan(0)
      expect(response.data.sessionsByType).toBeDefined()
    })

    it('should get flow optimization recommendations', async () => {
      const response = await flowStateAPI.getFlowOptimization()
      
      expect(response.success).toBe(true)
      expect(response.data).toBeDefined()
      expect(response.data.optimal_duration).toBeGreaterThan(0)
      expect(response.data.improvement_suggestions).toBeDefined()
      expect(Array.isArray(response.data.improvement_suggestions)).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid session data', async () => {
      const invalidSessionData = {
        name: '',
        type: 'invalid_type',
        planned_duration: -10
      }

      const response = await flowStateAPI.createFlowSession(invalidSessionData as any)
      
      expect(response.success).toBe(false)
      expect(response.error).toBeDefined()
    })

    it('should handle unauthorized access to sessions', async () => {
      // Create session with current user
      const sessionData = {
        name: 'Unauthorized Test',
        type: 'deep_work' as const,
        planned_duration: 60,
        environment_settings: {
          noise_level: 'silent' as const,
          lighting: 'natural' as const,
          temperature_preference: 'comfortable' as const,
          music_enabled: false,
          notifications_blocked: true,
          website_blocking_enabled: false,
          blocked_websites: []
        },
        metrics: { focus_intervals: [], screen_time_distribution: {}, app_usage: {} },
        tags: []
      }
      
      const createResponse = await flowStateAPI.createFlowSession(sessionData)
      const sessionId = createResponse.data!.id

      // Sign out and try to access
      await supabase.auth.signOut()

      const response = await flowStateAPI.getFlowSession(sessionId)
      
      expect(response.success).toBe(false)
      expect(response.error).toContain('Authentication required')
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle large metrics updates efficiently', async () => {
      // Create session
      const sessionData = {
        name: 'Performance Test Session',
        type: 'deep_work' as const,
        planned_duration: 120,
        environment_settings: {
          noise_level: 'ambient' as const,
          lighting: 'natural' as const,
          temperature_preference: 'comfortable' as const,
          music_enabled: false,
          notifications_blocked: true,
          website_blocking_enabled: false,
          blocked_websites: []
        },
        metrics: { focus_intervals: [], screen_time_distribution: {}, app_usage: {} },
        tags: []
      }
      
      const createResponse = await flowStateAPI.createFlowSession(sessionData)
      testSessionId = createResponse.data!.id

      // Large metrics update
      const largeMetricsUpdate = {
        focus_intervals: Array.from({ length: 100 }, (_, i) => ({
          start_time: new Date(Date.now() + i * 60000).toISOString(),
          end_time: new Date(Date.now() + (i + 1) * 60000).toISOString(),
          focus_level: Math.floor(Math.random() * 10) + 1,
          activity_type: 'coding',
          interruptions: Math.floor(Math.random() * 3)
        })),
        screen_time_distribution: {
          'code-editor': 0.7,
          'browser': 0.2,
          'terminal': 0.1
        },
        app_usage: Object.fromEntries(
          Array.from({ length: 50 }, (_, i) => [`app_${i}`, Math.random()])
        )
      }

      const startTime = Date.now()
      const response = await flowStateAPI.updateFlowMetrics(testSessionId, largeMetricsUpdate)
      const endTime = Date.now()
      
      expect(response.success).toBe(true)
      expect(endTime - startTime).toBeLessThan(5000) // Should complete within 5 seconds
    })
  })
})