// Flow State Command API Service

import { AuthenticatedAPIService } from './base'
import type { 
  FlowSession, 
  FlowEnvironment, 
  FlowMetrics, 
  FlowOptimization,
  FocusInterval,
  APIResponse,
  PaginatedResponse 
} from '@/types/backend'
import { supabase } from '@/lib/supabase'

export class FlowStateAPI extends AuthenticatedAPIService {
  constructor() {
    super('flow_sessions')
  }

  // Flow Session Management
  async createFlowSession(sessionData: Omit<FlowSession, 'id' | 'user_id' | 'start_time' | 'status' | 'distraction_count' | 'break_count'>): Promise<APIResponse<FlowSession>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      this.validateRequired(sessionData, ['name', 'type', 'planned_duration'])
      
      const session = {
        ...sessionData,
        user_id: userId,
        name: this.sanitizeInput(sessionData.name),
        start_time: new Date().toISOString(),
        status: 'planned' as const,
        distraction_count: 0,
        break_count: 0,
        metrics: {
          focus_intervals: [],
          screen_time_distribution: {},
          app_usage: {},
          ...sessionData.metrics
        }
      }

      return await supabase.from('flow_sessions').insert(session).select().single()
    })
  }

  async startFlowSession(sessionId: string): Promise<APIResponse<FlowSession>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      if (!await this.checkPermission(sessionId, userId)) {
        throw new Error('Access denied')
      }

      const updates = {
        status: 'active' as const,
        start_time: new Date().toISOString()
      }

      const result = await supabase
        .from('flow_sessions')
        .update(updates)
        .eq('id', sessionId)
        .select()
        .single()

      // Initialize distraction blocking if enabled
      if (result.data?.environment_settings.website_blocking_enabled) {
        await this.enableDistractionBlocking(sessionId, result.data.environment_settings.blocked_websites)
      }

      return result
    })
  }

  async pauseFlowSession(sessionId: string): Promise<APIResponse<FlowSession>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      if (!await this.checkPermission(sessionId, userId)) {
        throw new Error('Access denied')
      }

      return await supabase
        .from('flow_sessions')
        .update({ status: 'paused' })
        .eq('id', sessionId)
        .select()
        .single()
    })
  }

  async completeFlowSession(sessionId: string, completionData: {
    focus_score?: number
    productivity_score?: number
    notes?: string
    final_metrics?: Partial<FlowMetrics>
  }): Promise<APIResponse<FlowSession>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      if (!await this.checkPermission(sessionId, userId)) {
        throw new Error('Access denied')
      }

      const { data: session } = await supabase
        .from('flow_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (!session) {
        throw new Error('Session not found')
      }

      const endTime = new Date()
      const startTime = new Date(session.start_time)
      const actualDuration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))

      const updates = {
        status: 'completed' as const,
        end_time: endTime.toISOString(),
        actual_duration: actualDuration,
        focus_score: completionData.focus_score,
        productivity_score: completionData.productivity_score,
        notes: completionData.notes ? this.sanitizeInput(completionData.notes) : null,
        metrics: {
          ...session.metrics,
          ...completionData.final_metrics
        }
      }

      const result = await supabase
        .from('flow_sessions')
        .update(updates)
        .eq('id', sessionId)
        .select()
        .single()

      // Update user's flow optimization data
      await this.updateFlowOptimization(userId, result.data)

      return result
    })
  }

  async getFlowSessions(page: number = 1, limit: number = 20, filters?: any): Promise<PaginatedResponse<FlowSession>> {
    return this.handlePaginatedRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      let query = supabase
        .from('flow_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: false })

      if (filters?.type) {
        query = query.eq('type', filters.type)
      }
      
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      if (filters?.date_from) {
        query = query.gte('start_time', filters.date_from)
      }

      if (filters?.date_to) {
        query = query.lte('start_time', filters.date_to)
      }

      const from = (page - 1) * limit
      const to = from + limit - 1
      
      return await query.range(from, to)
    }, page, limit)
  }

  async getFlowSession(sessionId: string): Promise<APIResponse<FlowSession>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      if (!await this.checkPermission(sessionId, userId)) {
        throw new Error('Access denied')
      }

      return await supabase
        .from('flow_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()
    })
  }

  // Distraction Management
  async recordDistraction(sessionId: string, distractionData: {
    type: string
    source: string
    duration_seconds: number
    timestamp: string
  }): Promise<APIResponse<void>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      if (!await this.checkPermission(sessionId, userId)) {
        throw new Error('Access denied')
      }

      // Increment distraction count
      await supabase.rpc('increment_distraction_count', { session_id: sessionId })

      // Record detailed distraction data
      return await supabase.from('flow_distractions').insert({
        session_id: sessionId,
        user_id: userId,
        ...distractionData
      })
    })
  }

  async enableDistractionBlocking(sessionId: string, blockedWebsites: string[]): Promise<APIResponse<void>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      if (!await this.checkPermission(sessionId, userId)) {
        throw new Error('Access denied')
      }

      // This would integrate with browser extension or system-level blocking
      // For now, we'll just record the blocking configuration
      return await supabase.from('distraction_blocks').insert({
        session_id: sessionId,
        user_id: userId,
        blocked_websites: blockedWebsites,
        enabled_at: new Date().toISOString()
      })
    })
  }

  // Focus Tracking
  async recordFocusInterval(sessionId: string, interval: Omit<FocusInterval, 'session_id'>): Promise<APIResponse<void>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      if (!await this.checkPermission(sessionId, userId)) {
        throw new Error('Access denied')
      }

      return await supabase.from('focus_intervals').insert({
        session_id: sessionId,
        user_id: userId,
        ...interval
      })
    })
  }

  async updateFlowMetrics(sessionId: string, metrics: Partial<FlowMetrics>): Promise<APIResponse<FlowSession>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      if (!await this.checkPermission(sessionId, userId)) {
        throw new Error('Access denied')
      }

      const { data: session } = await supabase
        .from('flow_sessions')
        .select('metrics')
        .eq('id', sessionId)
        .single()

      const updatedMetrics = {
        ...session?.metrics,
        ...metrics
      }

      return await supabase
        .from('flow_sessions')
        .update({ metrics: updatedMetrics })
        .eq('id', sessionId)
        .select()
        .single()
    })
  }

  // Flow Optimization
  async getFlowOptimization(): Promise<APIResponse<FlowOptimization>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()

      return await supabase
        .from('flow_optimizations')
        .select('*')
        .eq('user_id', userId)
        .single()
    })
  }

  private async updateFlowOptimization(userId: string, completedSession: FlowSession): Promise<void> {
    // Analyze completed session and update optimization recommendations
    const { data: sessions } = await supabase
      .from('flow_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('start_time', { ascending: false })
      .limit(50)

    if (!sessions || sessions.length === 0) return

    const analysis = this.analyzeFlowPatterns(sessions)
    
    await supabase
      .from('flow_optimizations')
      .upsert({
        user_id: userId,
        optimal_duration: analysis.optimalDuration,
        best_time_of_day: analysis.bestTimeOfDay,
        preferred_environment: analysis.preferredEnvironment,
        peak_performance_indicators: analysis.peakPerformanceIndicators,
        improvement_suggestions: analysis.improvementSuggestions,
        last_updated: new Date().toISOString()
      })
  }

  private analyzeFlowPatterns(sessions: FlowSession[]): any {
    const highPerformanceSessions = sessions.filter(s => 
      (s.focus_score || 0) >= 8 && (s.productivity_score || 0) >= 8
    )

    // Calculate optimal duration
    const optimalDuration = highPerformanceSessions.length > 0
      ? Math.round(highPerformanceSessions.reduce((sum, s) => sum + (s.actual_duration || 0), 0) / highPerformanceSessions.length)
      : 90 // Default to 90 minutes

    // Find best time of day
    const timeSlots: { [key: string]: number } = {}
    highPerformanceSessions.forEach(session => {
      const hour = new Date(session.start_time).getHours()
      const timeSlot = this.getTimeSlot(hour)
      timeSlots[timeSlot] = (timeSlots[timeSlot] || 0) + 1
    })
    
    const bestTimeOfDay = Object.keys(timeSlots).reduce((a, b) => 
      timeSlots[a] > timeSlots[b] ? a : b
    ) || 'morning'

    // Analyze preferred environment
    const environmentPreferences = this.analyzeEnvironmentPreferences(highPerformanceSessions)

    // Generate improvement suggestions
    const improvementSuggestions = this.generateImprovementSuggestions(sessions)

    return {
      optimalDuration,
      bestTimeOfDay,
      preferredEnvironment: environmentPreferences,
      peakPerformanceIndicators: {
        avgFocusScore: highPerformanceSessions.reduce((sum, s) => sum + (s.focus_score || 0), 0) / highPerformanceSessions.length,
        avgProductivityScore: highPerformanceSessions.reduce((sum, s) => sum + (s.productivity_score || 0), 0) / highPerformanceSessions.length,
        avgDistractions: highPerformanceSessions.reduce((sum, s) => sum + s.distraction_count, 0) / highPerformanceSessions.length
      },
      improvementSuggestions
    }
  }

  private getTimeSlot(hour: number): string {
    if (hour >= 6 && hour < 12) return 'morning'
    if (hour >= 12 && hour < 17) return 'afternoon'
    if (hour >= 17 && hour < 21) return 'evening'
    return 'night'
  }

  private analyzeEnvironmentPreferences(sessions: FlowSession[]): FlowEnvironment {
    // Analyze most common environment settings in high-performance sessions
    const environments = sessions.map(s => s.environment_settings)
    
    return {
      noise_level: this.getMostCommon(environments.map(e => e.noise_level)) || 'ambient',
      lighting: this.getMostCommon(environments.map(e => e.lighting)) || 'natural',
      temperature_preference: this.getMostCommon(environments.map(e => e.temperature_preference)) || 'comfortable',
      music_enabled: environments.filter(e => e.music_enabled).length > environments.length / 2,
      music_type: this.getMostCommon(environments.map(e => e.music_type).filter(Boolean)),
      notifications_blocked: environments.filter(e => e.notifications_blocked).length > environments.length / 2,
      website_blocking_enabled: environments.filter(e => e.website_blocking_enabled).length > environments.length / 2,
      blocked_websites: []
    }
  }

  private getMostCommon<T>(arr: T[]): T | undefined {
    const counts: { [key: string]: number } = {}
    arr.forEach(item => {
      if (item) {
        const key = String(item)
        counts[key] = (counts[key] || 0) + 1
      }
    })
    
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b) as T
  }

  private generateImprovementSuggestions(sessions: FlowSession[]): string[] {
    const suggestions: string[] = []
    
    const avgFocusScore = sessions.reduce((sum, s) => sum + (s.focus_score || 0), 0) / sessions.length
    const avgDistractions = sessions.reduce((sum, s) => sum + s.distraction_count, 0) / sessions.length
    const avgDuration = sessions.reduce((sum, s) => sum + (s.actual_duration || 0), 0) / sessions.length

    if (avgFocusScore < 7) {
      suggestions.push('Consider implementing the Pomodoro Technique to improve focus')
    }

    if (avgDistractions > 3) {
      suggestions.push('Enable website blocking and notification silencing to reduce distractions')
    }

    if (avgDuration < 45) {
      suggestions.push('Try extending your flow sessions to at least 45-60 minutes for deeper focus')
    }

    if (avgDuration > 120) {
      suggestions.push('Consider taking breaks every 90-120 minutes to maintain peak performance')
    }

    return suggestions
  }

  // Analytics
  async getFlowAnalytics(timeRange: string = '30d'): Promise<APIResponse<any>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      const endDate = new Date()
      const startDate = new Date()
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7)
          break
        case '30d':
          startDate.setDate(endDate.getDate() - 30)
          break
        case '90d':
          startDate.setDate(endDate.getDate() - 90)
          break
        default:
          startDate.setDate(endDate.getDate() - 30)
      }

      const { data: sessions } = await supabase
        .from('flow_sessions')
        .select('*')
        .eq('user_id', userId)
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString())
        .order('start_time', { ascending: true })

      const analytics = this.calculateFlowAnalytics(sessions || [])
      
      return { data: analytics }
    })
  }

  private calculateFlowAnalytics(sessions: FlowSession[]): any {
    const completedSessions = sessions.filter(s => s.status === 'completed')
    
    return {
      totalSessions: sessions.length,
      completedSessions: completedSessions.length,
      totalFocusTime: completedSessions.reduce((sum, s) => sum + (s.actual_duration || 0), 0),
      averageSessionLength: completedSessions.length > 0 
        ? completedSessions.reduce((sum, s) => sum + (s.actual_duration || 0), 0) / completedSessions.length 
        : 0,
      averageFocusScore: completedSessions.length > 0
        ? completedSessions.reduce((sum, s) => sum + (s.focus_score || 0), 0) / completedSessions.length
        : 0,
      averageProductivityScore: completedSessions.length > 0
        ? completedSessions.reduce((sum, s) => sum + (s.productivity_score || 0), 0) / completedSessions.length
        : 0,
      totalDistractions: completedSessions.reduce((sum, s) => sum + s.distraction_count, 0),
      sessionsByType: this.groupSessionsByType(sessions),
      sessionsByDay: this.groupSessionsByDay(sessions),
      focusScoreTrend: this.calculateFocusScoreTrend(completedSessions),
      productivityTrend: this.calculateProductivityTrend(completedSessions)
    }
  }

  private groupSessionsByType(sessions: FlowSession[]): any {
    const grouped: { [key: string]: number } = {}
    sessions.forEach(session => {
      grouped[session.type] = (grouped[session.type] || 0) + 1
    })
    return grouped
  }

  private groupSessionsByDay(sessions: FlowSession[]): any {
    const grouped: { [key: string]: number } = {}
    sessions.forEach(session => {
      const date = new Date(session.start_time).toISOString().split('T')[0]
      grouped[date] = (grouped[date] || 0) + 1
    })
    return grouped
  }

  private calculateFocusScoreTrend(sessions: FlowSession[]): number[] {
    return sessions.map(s => s.focus_score || 0)
  }

  private calculateProductivityTrend(sessions: FlowSession[]): number[] {
    return sessions.map(s => s.productivity_score || 0)
  }
}

export const flowStateAPI = new FlowStateAPI()