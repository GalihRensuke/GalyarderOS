// Ritual Engine API Service

import { AuthenticatedAPIService } from './base'
import type { 
  Ritual, 
  RitualStep, 
  RitualCompletion, 
  RitualTemplate,
  APIResponse,
  PaginatedResponse 
} from '@/types/backend'
import { supabase } from '@/lib/supabase'

export class RitualEngineAPI extends AuthenticatedAPIService {
  constructor() {
    super('rituals')
  }

  // Ritual CRUD Operations
  async createRitual(ritualData: Omit<Ritual, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<APIResponse<Ritual>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      this.validateRequired(ritualData, ['name', 'category', 'type', 'frequency'])
      
      const ritual = {
        ...ritualData,
        user_id: userId,
        name: this.sanitizeInput(ritualData.name),
        description: ritualData.description ? this.sanitizeInput(ritualData.description) : null,
        streak_count: 0,
        best_streak: 0,
        total_completions: 0,
        is_active: true
      }

      return await supabase.from('rituals').insert(ritual).select().single()
    })
  }

  async getRituals(page: number = 1, limit: number = 20, filters?: any): Promise<PaginatedResponse<Ritual>> {
    return this.handlePaginatedRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      let query = supabase
        .from('rituals')
        .select(`
          *,
          ritual_steps(*),
          ritual_completions(count)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (filters?.category) {
        query = query.eq('category', filters.category)
      }
      
      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active)
      }

      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`)
      }

      const from = (page - 1) * limit
      const to = from + limit - 1
      
      return await query.range(from, to)
    }, page, limit)
  }

  async getRitual(id: string): Promise<APIResponse<Ritual>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      if (!await this.checkPermission(id, userId)) {
        throw new Error('Access denied')
      }

      return await supabase
        .from('rituals')
        .select(`
          *,
          ritual_steps(*),
          ritual_completions(*)
        `)
        .eq('id', id)
        .single()
    })
  }

  async updateRitual(id: string, updates: Partial<Ritual>): Promise<APIResponse<Ritual>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      if (!await this.checkPermission(id, userId)) {
        throw new Error('Access denied')
      }

      const sanitizedUpdates = {
        ...updates,
        name: updates.name ? this.sanitizeInput(updates.name) : undefined,
        description: updates.description ? this.sanitizeInput(updates.description) : undefined,
        updated_at: new Date().toISOString()
      }

      return await supabase
        .from('rituals')
        .update(sanitizedUpdates)
        .eq('id', id)
        .select()
        .single()
    })
  }

  async deleteRitual(id: string): Promise<APIResponse<void>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      if (!await this.checkPermission(id, userId)) {
        throw new Error('Access denied')
      }

      return await supabase.from('rituals').delete().eq('id', id)
    })
  }

  // Ritual Steps Management
  async addRitualStep(ritualId: string, stepData: Omit<RitualStep, 'id' | 'ritual_id'>): Promise<APIResponse<RitualStep>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      if (!await this.checkPermission(ritualId, userId)) {
        throw new Error('Access denied')
      }

      this.validateRequired(stepData, ['name', 'order'])

      const step = {
        ...stepData,
        ritual_id: ritualId,
        name: this.sanitizeInput(stepData.name),
        description: stepData.description ? this.sanitizeInput(stepData.description) : null
      }

      return await supabase.from('ritual_steps').insert(step).select().single()
    })
  }

  async updateRitualStep(stepId: string, updates: Partial<RitualStep>): Promise<APIResponse<RitualStep>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      // Check if user owns the ritual that contains this step
      const { data: step } = await supabase
        .from('ritual_steps')
        .select('ritual_id')
        .eq('id', stepId)
        .single()

      if (!step || !await this.checkPermission(step.ritual_id, userId)) {
        throw new Error('Access denied')
      }

      const sanitizedUpdates = {
        ...updates,
        name: updates.name ? this.sanitizeInput(updates.name) : undefined,
        description: updates.description ? this.sanitizeInput(updates.description) : undefined
      }

      return await supabase
        .from('ritual_steps')
        .update(sanitizedUpdates)
        .eq('id', stepId)
        .select()
        .single()
    })
  }

  async deleteRitualStep(stepId: string): Promise<APIResponse<void>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      const { data: step } = await supabase
        .from('ritual_steps')
        .select('ritual_id')
        .eq('id', stepId)
        .single()

      if (!step || !await this.checkPermission(step.ritual_id, userId)) {
        throw new Error('Access denied')
      }

      return await supabase.from('ritual_steps').delete().eq('id', stepId)
    })
  }

  // Ritual Completion Tracking
  async completeRitual(
    ritualId: string, 
    completionData: Omit<RitualCompletion, 'id' | 'ritual_id' | 'user_id' | 'completed_at'>
  ): Promise<APIResponse<RitualCompletion>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      if (!await this.checkPermission(ritualId, userId)) {
        throw new Error('Access denied')
      }

      const completion = {
        ...completionData,
        ritual_id: ritualId,
        user_id: userId,
        completed_at: new Date().toISOString(),
        notes: completionData.notes ? this.sanitizeInput(completionData.notes) : null
      }

      // Insert completion and update ritual stats
      const [completionResult] = await Promise.all([
        supabase.from('ritual_completions').insert(completion).select().single(),
        this.updateRitualStats(ritualId)
      ])

      return completionResult
    })
  }

  private async updateRitualStats(ritualId: string): Promise<void> {
    // Get current streak and total completions
    const { data: completions } = await supabase
      .from('ritual_completions')
      .select('completed_at')
      .eq('ritual_id', ritualId)
      .order('completed_at', { ascending: false })

    if (!completions) return

    const totalCompletions = completions.length
    const currentStreak = this.calculateCurrentStreak(completions.map(c => c.completed_at))
    
    // Get best streak from database or calculate if needed
    const { data: ritual } = await supabase
      .from('rituals')
      .select('best_streak')
      .eq('id', ritualId)
      .single()

    const bestStreak = Math.max(currentStreak, ritual?.best_streak || 0)

    await supabase
      .from('rituals')
      .update({
        total_completions: totalCompletions,
        streak_count: currentStreak,
        best_streak: bestStreak,
        updated_at: new Date().toISOString()
      })
      .eq('id', ritualId)
  }

  private calculateCurrentStreak(completionDates: string[]): number {
    if (completionDates.length === 0) return 0

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    let streak = 0
    let currentDate = new Date(today)

    for (const dateStr of completionDates) {
      const completionDate = new Date(dateStr)
      completionDate.setHours(0, 0, 0, 0)

      if (completionDate.getTime() === currentDate.getTime()) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else if (completionDate.getTime() < currentDate.getTime()) {
        break
      }
    }

    return streak
  }

  // Ritual Templates
  async getRitualTemplates(category?: string): Promise<APIResponse<RitualTemplate[]>> {
    return this.handleRequest(async () => {
      let query = supabase
        .from('ritual_templates')
        .select('*')
        .eq('is_public', true)
        .order('popularity_score', { ascending: false })

      if (category) {
        query = query.eq('category', category)
      }

      return await query
    })
  }

  async createRitualFromTemplate(templateId: string, customizations?: Partial<Ritual>): Promise<APIResponse<Ritual>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()

      const { data: template, error } = await supabase
        .from('ritual_templates')
        .select('*')
        .eq('id', templateId)
        .single()

      if (error || !template) {
        throw new Error('Template not found')
      }

      const ritualData = {
        name: customizations?.name || template.name,
        description: template.description,
        category: template.category,
        type: 'routine' as const,
        frequency: 'daily' as const,
        duration_minutes: template.estimated_duration,
        difficulty_level: template.difficulty_level,
        tags: template.tags,
        reminder_enabled: false,
        is_active: true,
        ...customizations
      }

      const ritualResult = await this.createRitual(ritualData)
      
      if (ritualResult.success && ritualResult.data) {
        // Add template steps to the new ritual
        for (const step of template.steps) {
          await this.addRitualStep(ritualResult.data.id, step)
        }
      }

      return ritualResult
    })
  }

  // Analytics and Insights
  async getRitualAnalytics(ritualId: string, timeRange: string = '30d'): Promise<APIResponse<any>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      if (!await this.checkPermission(ritualId, userId)) {
        throw new Error('Access denied')
      }

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

      const { data: completions } = await supabase
        .from('ritual_completions')
        .select('*')
        .eq('ritual_id', ritualId)
        .gte('completed_at', startDate.toISOString())
        .lte('completed_at', endDate.toISOString())
        .order('completed_at', { ascending: true })

      const analytics = this.calculateRitualAnalytics(completions || [])
      
      return { data: analytics }
    })
  }

  private calculateRitualAnalytics(completions: RitualCompletion[]): any {
    const totalCompletions = completions.length
    const avgMoodBefore = completions.reduce((sum, c) => sum + (c.mood_before || 0), 0) / totalCompletions || 0
    const avgMoodAfter = completions.reduce((sum, c) => sum + (c.mood_after || 0), 0) / totalCompletions || 0
    const avgEnergyBefore = completions.reduce((sum, c) => sum + (c.energy_before || 0), 0) / totalCompletions || 0
    const avgEnergyAfter = completions.reduce((sum, c) => sum + (c.energy_after || 0), 0) / totalCompletions || 0
    const avgDuration = completions.reduce((sum, c) => sum + (c.duration_minutes || 0), 0) / totalCompletions || 0

    return {
      totalCompletions,
      averages: {
        moodBefore: avgMoodBefore,
        moodAfter: avgMoodAfter,
        energyBefore: avgEnergyBefore,
        energyAfter: avgEnergyAfter,
        duration: avgDuration
      },
      improvements: {
        moodImprovement: avgMoodAfter - avgMoodBefore,
        energyImprovement: avgEnergyAfter - avgEnergyBefore
      },
      completionsByDay: this.groupCompletionsByDay(completions),
      consistency: this.calculateConsistency(completions)
    }
  }

  private groupCompletionsByDay(completions: RitualCompletion[]): any {
    const grouped: { [key: string]: number } = {}
    
    completions.forEach(completion => {
      const date = new Date(completion.completed_at).toISOString().split('T')[0]
      grouped[date] = (grouped[date] || 0) + 1
    })

    return grouped
  }

  private calculateConsistency(completions: RitualCompletion[]): number {
    if (completions.length === 0) return 0

    const dates = completions.map(c => new Date(c.completed_at).toISOString().split('T')[0])
    const uniqueDates = new Set(dates)
    const daysCovered = uniqueDates.size
    
    const firstDate = new Date(Math.min(...completions.map(c => new Date(c.completed_at).getTime())))
    const lastDate = new Date(Math.max(...completions.map(c => new Date(c.completed_at).getTime())))
    const totalDays = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

    return daysCovered / totalDays
  }
}

export const ritualEngineAPI = new RitualEngineAPI()