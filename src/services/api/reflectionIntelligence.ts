// Reflection Intelligence API Service

import { AuthenticatedAPIService } from './base'
import type { 
  ReflectionPrompt, 
  ReflectionEntry, 
  ReflectionInsight,
  ReflectionAnalytics,
  APIResponse,
  PaginatedResponse 
} from '@/types/backend'
import { supabase } from '@/lib/supabase'
import { geminiService } from '@/services/gemini'

export class ReflectionIntelligenceAPI extends AuthenticatedAPIService {
  constructor() {
    super('reflection_entries')
  }

  // Reflection Prompts
  async getReflectionPrompts(category?: string, difficulty?: number): Promise<APIResponse<ReflectionPrompt[]>> {
    return this.handleRequest(async () => {
      let query = supabase
        .from('reflection_prompts')
        .select('*')
        .eq('is_active', true)
        .order('difficulty_level', { ascending: true })

      if (category) {
        query = query.eq('category', category)
      }

      if (difficulty) {
        query = query.eq('difficulty_level', difficulty)
      }

      return await query
    })
  }

  async generateDynamicPrompt(context: {
    recent_entries?: ReflectionEntry[]
    current_goals?: any[]
    life_events?: string[]
    mood_trend?: string
    focus_area?: string
  }): Promise<APIResponse<ReflectionPrompt>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      // Use AI to generate a personalized prompt
      const promptData = await this.generatePersonalizedPrompt(context)
      
      return {
        data: {
          id: `dynamic_${Date.now()}`,
          category: 'custom',
          type: 'open_ended',
          question: promptData.question,
          sub_questions: promptData.sub_questions,
          context: promptData.context,
          difficulty_level: promptData.difficulty_level,
          tags: promptData.tags,
          is_active: true
        }
      }
    })
  }

  // Reflection Entries
  async createReflectionEntry(entryData: Omit<ReflectionEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<APIResponse<ReflectionEntry>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      this.validateRequired(entryData, ['title', 'content', 'type'])
      
      const entry = {
        ...entryData,
        user_id: userId,
        title: this.sanitizeInput(entryData.title),
        content: this.sanitizeInput(entryData.content),
        key_insights: entryData.key_insights?.map(insight => this.sanitizeInput(insight)) || [],
        action_items: entryData.action_items?.map(item => this.sanitizeInput(item)) || [],
        gratitude_items: entryData.gratitude_items?.map(item => this.sanitizeInput(item)) || [],
        challenges_faced: entryData.challenges_faced?.map(challenge => this.sanitizeInput(challenge)) || [],
        wins_celebrated: entryData.wins_celebrated?.map(win => this.sanitizeInput(win)) || []
      }

      const result = await supabase.from('reflection_entries').insert(entry).select().single()
      
      // Generate insights from the reflection entry
      if (result.data) {
        await this.generateInsightsFromEntry(result.data)
      }

      return result
    })
  }

  async getReflectionEntries(page: number = 1, limit: number = 20, filters?: any): Promise<PaginatedResponse<ReflectionEntry>> {
    return this.handlePaginatedRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      let query = supabase
        .from('reflection_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (filters?.type) {
        query = query.eq('type', filters.type)
      }
      
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from)
      }

      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to)
      }

      if (filters?.mood_min) {
        query = query.gte('mood_score', filters.mood_min)
      }

      if (filters?.mood_max) {
        query = query.lte('mood_score', filters.mood_max)
      }

      if (filters?.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags)
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`)
      }

      const from = (page - 1) * limit
      const to = from + limit - 1
      
      return await query.range(from, to)
    }, page, limit)
  }

  async getReflectionEntry(id: string): Promise<APIResponse<ReflectionEntry>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      if (!await this.checkPermission(id, userId)) {
        throw new Error('Access denied')
      }

      return await supabase
        .from('reflection_entries')
        .select('*')
        .eq('id', id)
        .single()
    })
  }

  async updateReflectionEntry(id: string, updates: Partial<ReflectionEntry>): Promise<APIResponse<ReflectionEntry>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      if (!await this.checkPermission(id, userId)) {
        throw new Error('Access denied')
      }

      const sanitizedUpdates = {
        ...updates,
        title: updates.title ? this.sanitizeInput(updates.title) : undefined,
        content: updates.content ? this.sanitizeInput(updates.content) : undefined,
        key_insights: updates.key_insights?.map(insight => this.sanitizeInput(insight)),
        action_items: updates.action_items?.map(item => this.sanitizeInput(item)),
        gratitude_items: updates.gratitude_items?.map(item => this.sanitizeInput(item)),
        challenges_faced: updates.challenges_faced?.map(challenge => this.sanitizeInput(challenge)),
        wins_celebrated: updates.wins_celebrated?.map(win => this.sanitizeInput(win)),
        updated_at: new Date().toISOString()
      }

      return await supabase
        .from('reflection_entries')
        .update(sanitizedUpdates)
        .eq('id', id)
        .select()
        .single()
    })
  }

  async deleteReflectionEntry(id: string): Promise<APIResponse<void>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      if (!await this.checkPermission(id, userId)) {
        throw new Error('Access denied')
      }

      return await supabase.from('reflection_entries').delete().eq('id', id)
    })
  }

  // Reflection Insights
  async getReflectionInsights(timeRange: string = '30d'): Promise<APIResponse<ReflectionInsight[]>> {
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

      return await supabase
        .from('reflection_insights')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('confidence_score', { ascending: false })
    })
  }

  async generateInsights(timeRange: string = '30d'): Promise<APIResponse<ReflectionInsight[]>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      // Get reflection entries for the time range
      const { data: entries } = await this.getReflectionEntries(1, 100, {
        date_from: this.getDateFromRange(timeRange)
      })

      if (!entries || entries.length === 0) {
        return { data: [] }
      }

      const insights = await this.analyzeReflectionPatterns(entries)
      
      // Save insights to database
      const savedInsights = []
      for (const insight of insights) {
        const { data: savedInsight } = await supabase
          .from('reflection_insights')
          .insert({
            ...insight,
            user_id: userId
          })
          .select()
          .single()
        
        if (savedInsight) {
          savedInsights.push(savedInsight)
        }
      }

      return { data: savedInsights }
    })
  }

  // Reflection Analytics
  async getReflectionAnalytics(timeRange: string = '30d'): Promise<APIResponse<ReflectionAnalytics>> {
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

      const { data: entries } = await supabase
        .from('reflection_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true })

      if (!entries) {
        return { data: this.getEmptyAnalytics(userId) }
      }

      const analytics = this.calculateReflectionAnalytics(userId, entries)
      
      return { data: analytics }
    })
  }

  // AI-powered features
  private async generatePersonalizedPrompt(context: any): Promise<any> {
    try {
      const prompt = `
        Generate a personalized reflection prompt based on the following context:
        ${JSON.stringify(context, null, 2)}
        
        Create a thoughtful, engaging prompt that encourages deep self-reflection.
        Include 2-3 sub-questions that guide the reflection process.
        
        Return JSON with:
        - question: Main reflection question
        - sub_questions: Array of 2-3 follow-up questions
        - context: Brief explanation of why this prompt is relevant
        - difficulty_level: 1-5 scale
        - tags: Relevant tags for categorization
      `

      const response = await geminiService.processQuery(prompt, context, {
        name: 'Reflection Guide',
        style: 'philosophical',
        expertise: ['self-reflection', 'personal-growth', 'mindfulness'],
        communicationStyle: 'philosophical',
        adaptiveness: 0.8
      })

      return JSON.parse(response.message)
    } catch (error) {
      console.error('Failed to generate personalized prompt:', error)
      
      // Fallback to default prompt
      return {
        question: "What patterns do you notice in your thoughts, emotions, and behaviors lately?",
        sub_questions: [
          "What triggers these patterns?",
          "How do these patterns serve or limit you?",
          "What small change could you make to improve these patterns?"
        ],
        context: "A general reflection on personal patterns and growth opportunities",
        difficulty_level: 3,
        tags: ['patterns', 'self-awareness', 'growth']
      }
    }
  }

  private async generateInsightsFromEntry(entry: ReflectionEntry): Promise<void> {
    try {
      const prompt = `
        Analyze this reflection entry and extract key insights:
        
        Title: ${entry.title}
        Content: ${entry.content}
        Mood: ${entry.mood_score || 'Not specified'}
        Energy: ${entry.energy_score || 'Not specified'}
        Key Insights: ${entry.key_insights.join(', ')}
        Challenges: ${entry.challenges_faced.join(', ')}
        Wins: ${entry.wins_celebrated.join(', ')}
        
        Generate insights about:
        1. Emotional patterns
        2. Behavioral patterns
        3. Growth opportunities
        4. Potential correlations
        5. Actionable recommendations
        
        Return JSON array of insights with:
        - type: 'pattern', 'trend', 'correlation', 'anomaly', or 'recommendation'
        - title: Brief insight title
        - description: Detailed explanation
        - confidence_score: 0-100
        - category: Main category
        - actionable: boolean
        - action_suggestions: Array of specific actions
      `

      const response = await geminiService.processQuery(prompt, { entry }, {
        name: 'Reflection Analyst',
        style: 'analytical-advisor',
        expertise: ['psychology', 'behavioral-analysis', 'personal-growth'],
        communicationStyle: 'scientific',
        adaptiveness: 0.9
      })

      const insights = JSON.parse(response.message)
      
      // Save insights to database
      for (const insight of insights) {
        await supabase.from('reflection_insights').insert({
          user_id: entry.user_id,
          type: insight.type,
          title: insight.title,
          description: insight.description,
          confidence_score: insight.confidence_score,
          supporting_data: { entry_id: entry.id },
          time_period: 'single_entry',
          category: insight.category,
          actionable: insight.actionable,
          action_suggestions: insight.action_suggestions
        })
      }
    } catch (error) {
      console.error('Failed to generate insights from entry:', error)
    }
  }

  private async analyzeReflectionPatterns(entries: ReflectionEntry[]): Promise<any[]> {
    const insights: any[] = []
    
    // Mood trend analysis
    const moodTrend = this.analyzeMoodTrend(entries)
    if (moodTrend) {
      insights.push(moodTrend)
    }

    // Energy pattern analysis
    const energyPattern = this.analyzeEnergyPattern(entries)
    if (energyPattern) {
      insights.push(energyPattern)
    }

    // Common themes analysis
    const themes = this.analyzeCommonThemes(entries)
    insights.push(...themes)

    // Consistency analysis
    const consistency = this.analyzeConsistency(entries)
    if (consistency) {
      insights.push(consistency)
    }

    // Growth indicators
    const growth = this.analyzeGrowthIndicators(entries)
    insights.push(...growth)

    return insights
  }

  private analyzeMoodTrend(entries: ReflectionEntry[]): any | null {
    const moodEntries = entries.filter(e => e.mood_score !== null && e.mood_score !== undefined)
    if (moodEntries.length < 3) return null

    const moods = moodEntries.map(e => e.mood_score!)
    const avgMood = moods.reduce((sum, mood) => sum + mood, 0) / moods.length
    
    // Calculate trend
    const firstHalf = moods.slice(0, Math.floor(moods.length / 2))
    const secondHalf = moods.slice(Math.floor(moods.length / 2))
    
    const firstAvg = firstHalf.reduce((sum, mood) => sum + mood, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, mood) => sum + mood, 0) / secondHalf.length
    
    const trendDirection = secondAvg > firstAvg ? 'improving' : secondAvg < firstAvg ? 'declining' : 'stable'
    const trendStrength = Math.abs(secondAvg - firstAvg)

    return {
      type: 'trend',
      title: `Mood Trend: ${trendDirection}`,
      description: `Your average mood has been ${trendDirection} over the reflection period. Average mood score: ${avgMood.toFixed(1)}/10`,
      confidence_score: Math.min(90, 50 + (trendStrength * 20)),
      category: 'emotional',
      actionable: trendDirection === 'declining',
      action_suggestions: trendDirection === 'declining' ? [
        'Identify specific triggers for low mood days',
        'Implement mood-boosting activities in your routine',
        'Consider speaking with a mental health professional'
      ] : []
    }
  }

  private analyzeEnergyPattern(entries: ReflectionEntry[]): any | null {
    const energyEntries = entries.filter(e => e.energy_score !== null && e.energy_score !== undefined)
    if (energyEntries.length < 3) return null

    const energyLevels = energyEntries.map(e => e.energy_score!)
    const avgEnergy = energyLevels.reduce((sum, energy) => sum + energy, 0) / energyLevels.length
    
    // Analyze energy patterns by day of week or time
    const lowEnergyDays = energyEntries.filter(e => e.energy_score! < 5).length
    const highEnergyDays = energyEntries.filter(e => e.energy_score! >= 7).length

    return {
      type: 'pattern',
      title: 'Energy Level Pattern',
      description: `Your average energy level is ${avgEnergy.toFixed(1)}/10. You had ${highEnergyDays} high-energy days and ${lowEnergyDays} low-energy days.`,
      confidence_score: 75,
      category: 'physical',
      actionable: avgEnergy < 6,
      action_suggestions: avgEnergy < 6 ? [
        'Review your sleep schedule and quality',
        'Examine your nutrition and hydration habits',
        'Consider incorporating regular exercise',
        'Identify and minimize energy-draining activities'
      ] : []
    }
  }

  private analyzeCommonThemes(entries: ReflectionEntry[]): any[] {
    const allChallenges = entries.flatMap(e => e.challenges_faced)
    const allWins = entries.flatMap(e => e.wins_celebrated)
    const allInsights = entries.flatMap(e => e.key_insights)

    const insights: any[] = []

    // Analyze common challenges
    const challengeFreq = this.getWordFrequency(allChallenges)
    const topChallenges = Object.entries(challengeFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)

    if (topChallenges.length > 0) {
      insights.push({
        type: 'pattern',
        title: 'Recurring Challenges',
        description: `Your most common challenges include: ${topChallenges.map(([challenge]) => challenge).join(', ')}`,
        confidence_score: 80,
        category: 'behavioral',
        actionable: true,
        action_suggestions: [
          'Develop specific strategies for your most common challenges',
          'Consider what underlying factors contribute to these patterns',
          'Create preventive measures or early warning systems'
        ]
      })
    }

    // Analyze wins and strengths
    const winFreq = this.getWordFrequency(allWins)
    const topWins = Object.entries(winFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)

    if (topWins.length > 0) {
      insights.push({
        type: 'pattern',
        title: 'Strength Areas',
        description: `You consistently excel in: ${topWins.map(([win]) => win).join(', ')}`,
        confidence_score: 85,
        category: 'strengths',
        actionable: true,
        action_suggestions: [
          'Leverage these strengths in challenging areas',
          'Share your expertise in these areas with others',
          'Build upon these strengths for further growth'
        ]
      })
    }

    return insights
  }

  private analyzeConsistency(entries: ReflectionEntry[]): any | null {
    if (entries.length < 7) return null

    const totalDays = Math.ceil((new Date(entries[0].created_at).getTime() - new Date(entries[entries.length - 1].created_at).getTime()) / (1000 * 60 * 60 * 24))
    const consistencyScore = (entries.length / totalDays) * 100

    return {
      type: 'pattern',
      title: 'Reflection Consistency',
      description: `You've maintained a ${consistencyScore.toFixed(1)}% consistency rate in your reflection practice.`,
      confidence_score: 90,
      category: 'habits',
      actionable: consistencyScore < 70,
      action_suggestions: consistencyScore < 70 ? [
        'Set a specific time each day for reflection',
        'Start with shorter, more manageable reflection sessions',
        'Use prompts or templates to make reflection easier',
        'Set reminders to maintain the habit'
      ] : []
    }
  }

  private analyzeGrowthIndicators(entries: ReflectionEntry[]): any[] {
    const insights: any[] = []
    
    // Analyze action item completion (would need additional tracking)
    const totalActionItems = entries.reduce((sum, e) => sum + e.action_items.length, 0)
    
    if (totalActionItems > 0) {
      insights.push({
        type: 'recommendation',
        title: 'Action Item Follow-through',
        description: `You've identified ${totalActionItems} action items across your reflections. Consider tracking completion rates.`,
        confidence_score: 70,
        category: 'growth',
        actionable: true,
        action_suggestions: [
          'Create a system to track action item completion',
          'Review previous action items in new reflections',
          'Set specific deadlines for action items',
          'Break large action items into smaller steps'
        ]
      })
    }

    return insights
  }

  private getWordFrequency(items: string[]): { [key: string]: number } {
    const frequency: { [key: string]: number } = {}
    
    items.forEach(item => {
      const words = item.toLowerCase().split(/\W+/).filter(word => word.length > 3)
      words.forEach(word => {
        frequency[word] = (frequency[word] || 0) + 1
      })
    })
    
    return frequency
  }

  private calculateReflectionAnalytics(userId: string, entries: ReflectionEntry[]): ReflectionAnalytics {
    const totalEntries = entries.length
    
    // Calculate consistency score
    const dateRange = entries.length > 1 
      ? Math.ceil((new Date(entries[0].created_at).getTime() - new Date(entries[entries.length - 1].created_at).getTime()) / (1000 * 60 * 60 * 24))
      : 1
    const consistencyScore = (totalEntries / dateRange) * 100

    // Calculate average mood and trend
    const moodEntries = entries.filter(e => e.mood_score !== null && e.mood_score !== undefined)
    const averageMood = moodEntries.length > 0
      ? moodEntries.reduce((sum, e) => sum + e.mood_score!, 0) / moodEntries.length
      : 0

    // Determine mood trend
    let moodTrend: 'improving' | 'declining' | 'stable' = 'stable'
    if (moodEntries.length >= 4) {
      const firstHalf = moodEntries.slice(0, Math.floor(moodEntries.length / 2))
      const secondHalf = moodEntries.slice(Math.floor(moodEntries.length / 2))
      
      const firstAvg = firstHalf.reduce((sum, e) => sum + e.mood_score!, 0) / firstHalf.length
      const secondAvg = secondHalf.reduce((sum, e) => sum + e.mood_score!, 0) / secondHalf.length
      
      if (secondAvg > firstAvg + 0.5) moodTrend = 'improving'
      else if (secondAvg < firstAvg - 0.5) moodTrend = 'declining'
    }

    // Extract common themes
    const allChallenges = entries.flatMap(e => e.challenges_faced)
    const allWins = entries.flatMap(e => e.wins_celebrated)
    const allInsights = entries.flatMap(e => e.key_insights)

    const challengeFreq = this.getWordFrequency(allChallenges)
    const commonThemes = Object.entries(challengeFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([theme]) => theme)

    const winFreq = this.getWordFrequency(allWins)
    const growthAreas = Object.entries(winFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([area]) => area)

    // Analyze achievement patterns
    const achievementPatterns = {
      consistency: consistencyScore,
      moodStability: this.calculateMoodStability(moodEntries),
      growthMindset: this.assessGrowthMindset(entries),
      selfAwareness: this.assessSelfAwareness(entries)
    }

    // Identify stress triggers
    const stressEntries = entries.filter(e => e.stress_level && e.stress_level > 6)
    const stressTriggers = this.extractStressTriggers(stressEntries)

    // Analyze energy patterns
    const energyEntries = entries.filter(e => e.energy_score !== null && e.energy_score !== undefined)
    const energyPatterns = this.analyzeEnergyPatterns(energyEntries)

    return {
      user_id: userId,
      total_entries: totalEntries,
      consistency_score: Math.min(100, consistencyScore),
      average_mood: averageMood,
      mood_trend: moodTrend,
      common_themes: commonThemes,
      growth_areas: growthAreas,
      achievement_patterns: achievementPatterns,
      stress_triggers: stressTriggers,
      energy_patterns: energyPatterns,
      last_updated: new Date().toISOString()
    }
  }

  private calculateMoodStability(moodEntries: ReflectionEntry[]): number {
    if (moodEntries.length < 2) return 0

    const moods = moodEntries.map(e => e.mood_score!)
    const mean = moods.reduce((sum, mood) => sum + mood, 0) / moods.length
    const variance = moods.reduce((sum, mood) => sum + Math.pow(mood - mean, 2), 0) / moods.length
    const standardDeviation = Math.sqrt(variance)

    // Lower standard deviation = higher stability (inverted scale)
    return Math.max(0, 100 - (standardDeviation * 20))
  }

  private assessGrowthMindset(entries: ReflectionEntry[]): number {
    let growthIndicators = 0
    const totalEntries = entries.length

    entries.forEach(entry => {
      const content = entry.content.toLowerCase()
      const insights = entry.key_insights.join(' ').toLowerCase()
      
      // Look for growth mindset indicators
      if (content.includes('learn') || content.includes('improve') || content.includes('grow')) growthIndicators++
      if (content.includes('challenge') && content.includes('opportunity')) growthIndicators++
      if (insights.includes('realize') || insights.includes('understand')) growthIndicators++
      if (entry.action_items.length > 0) growthIndicators++
    })

    return Math.min(100, (growthIndicators / totalEntries) * 50)
  }

  private assessSelfAwareness(entries: ReflectionEntry[]): number {
    let awarenessIndicators = 0
    const totalEntries = entries.length

    entries.forEach(entry => {
      if (entry.key_insights.length > 0) awarenessIndicators++
      if (entry.mood_score !== null) awarenessIndicators++
      if (entry.energy_score !== null) awarenessIndicators++
      if (entry.challenges_faced.length > 0) awarenessIndicators++
      
      const content = entry.content.toLowerCase()
      if (content.includes('feel') || content.includes('emotion')) awarenessIndicators++
      if (content.includes('pattern') || content.includes('notice')) awarenessIndicators++
    })

    return Math.min(100, (awarenessIndicators / (totalEntries * 6)) * 100)
  }

  private extractStressTriggers(stressEntries: ReflectionEntry[]): string[] {
    const triggers: string[] = []
    
    stressEntries.forEach(entry => {
      entry.challenges_faced.forEach(challenge => {
        if (challenge.toLowerCase().includes('stress') || 
            challenge.toLowerCase().includes('pressure') ||
            challenge.toLowerCase().includes('overwhelm')) {
          triggers.push(challenge)
        }
      })
    })

    // Get unique triggers and sort by frequency
    const triggerFreq = this.getWordFrequency(triggers)
    return Object.entries(triggerFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([trigger]) => trigger)
  }

  private analyzeEnergyPatterns(energyEntries: ReflectionEntry[]): any {
    if (energyEntries.length === 0) return {}

    const energyLevels = energyEntries.map(e => e.energy_score!)
    const avgEnergy = energyLevels.reduce((sum, energy) => sum + energy, 0) / energyLevels.length

    // Analyze by day of week (if we had date parsing)
    const patterns = {
      average: avgEnergy,
      variability: this.calculateVariability(energyLevels),
      lowEnergyFrequency: energyLevels.filter(e => e < 4).length / energyLevels.length,
      highEnergyFrequency: energyLevels.filter(e => e >= 7).length / energyLevels.length
    }

    return patterns
  }

  private calculateVariability(values: number[]): number {
    if (values.length < 2) return 0

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    return Math.sqrt(variance)
  }

  private getEmptyAnalytics(userId: string): ReflectionAnalytics {
    return {
      user_id: userId,
      total_entries: 0,
      consistency_score: 0,
      average_mood: 0,
      mood_trend: 'stable',
      common_themes: [],
      growth_areas: [],
      achievement_patterns: {},
      stress_triggers: [],
      energy_patterns: {},
      last_updated: new Date().toISOString()
    }
  }

  private getDateFromRange(timeRange: string): string {
    const date = new Date()
    switch (timeRange) {
      case '7d':
        date.setDate(date.getDate() - 7)
        break
      case '30d':
        date.setDate(date.getDate() - 30)
        break
      case '90d':
        date.setDate(date.getDate() - 90)
        break
      default:
        date.setDate(date.getDate() - 30)
    }
    return date.toISOString()
  }
}

export const reflectionIntelligenceAPI = new ReflectionIntelligenceAPI()