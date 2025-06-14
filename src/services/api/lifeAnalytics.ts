// Life Analytics API Service

import { AuthenticatedAPIService } from './base'
import type { 
  LifeMetric, 
  AnalyticsDashboard, 
  DashboardWidget,
  TrendAnalysis,
  PersonalReport,
  APIResponse,
  PaginatedResponse 
} from '@/types/backend'
import { supabase } from '@/lib/supabase'

export class LifeAnalyticsAPI extends AuthenticatedAPIService {
  constructor() {
    super('life_metrics')
  }

  // Life Metrics Management
  async recordMetric(metricData: Omit<LifeMetric, 'id' | 'user_id' | 'recorded_at'>): Promise<APIResponse<LifeMetric>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      this.validateRequired(metricData, ['category', 'name', 'value', 'unit', 'measurement_type'])
      
      const metric = {
        ...metricData,
        user_id: userId,
        name: this.sanitizeInput(metricData.name),
        recorded_at: new Date().toISOString()
      }

      return await supabase.from('life_metrics').insert(metric).select().single()
    })
  }

  async getMetrics(page: number = 1, limit: number = 50, filters?: any): Promise<PaginatedResponse<LifeMetric>> {
    return this.handlePaginatedRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      let query = supabase
        .from('life_metrics')
        .select('*')
        .eq('user_id', userId)
        .order('recorded_at', { ascending: false })

      if (filters?.category) {
        query = query.eq('category', filters.category)
      }
      
      if (filters?.name) {
        query = query.eq('name', filters.name)
      }

      if (filters?.date_from) {
        query = query.gte('recorded_at', filters.date_from)
      }

      if (filters?.date_to) {
        query = query.lte('recorded_at', filters.date_to)
      }

      if (filters?.data_source) {
        query = query.eq('data_source', filters.data_source)
      }

      const from = (page - 1) * limit
      const to = from + limit - 1
      
      return await query.range(from, to)
    }, page, limit)
  }

  async getMetricHistory(metricName: string, timeRange: string = '30d'): Promise<APIResponse<LifeMetric[]>> {
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
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1)
          break
        default:
          startDate.setDate(endDate.getDate() - 30)
      }

      return await supabase
        .from('life_metrics')
        .select('*')
        .eq('user_id', userId)
        .eq('name', metricName)
        .gte('recorded_at', startDate.toISOString())
        .lte('recorded_at', endDate.toISOString())
        .order('recorded_at', { ascending: true })
    })
  }

  async updateMetric(id: string, updates: Partial<LifeMetric>): Promise<APIResponse<LifeMetric>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      if (!await this.checkPermission(id, userId)) {
        throw new Error('Access denied')
      }

      const sanitizedUpdates = {
        ...updates,
        name: updates.name ? this.sanitizeInput(updates.name) : undefined
      }

      return await supabase
        .from('life_metrics')
        .update(sanitizedUpdates)
        .eq('id', id)
        .select()
        .single()
    })
  }

  async deleteMetric(id: string): Promise<APIResponse<void>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      if (!await this.checkPermission(id, userId)) {
        throw new Error('Access denied')
      }

      return await supabase.from('life_metrics').delete().eq('id', id)
    })
  }

  // Dashboard Management
  async createDashboard(dashboardData: Omit<AnalyticsDashboard, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<APIResponse<AnalyticsDashboard>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      this.validateRequired(dashboardData, ['name'])
      
      const dashboard = {
        ...dashboardData,
        user_id: userId,
        name: this.sanitizeInput(dashboardData.name),
        description: dashboardData.description ? this.sanitizeInput(dashboardData.description) : null
      }

      return await supabase.from('analytics_dashboards').insert(dashboard).select().single()
    })
  }

  async getDashboards(): Promise<APIResponse<AnalyticsDashboard[]>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()

      return await supabase
        .from('analytics_dashboards')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
    })
  }

  async getDashboard(id: string): Promise<APIResponse<AnalyticsDashboard>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      if (!await this.checkPermission(id, userId)) {
        throw new Error('Access denied')
      }

      return await supabase
        .from('analytics_dashboards')
        .select('*')
        .eq('id', id)
        .single()
    })
  }

  async updateDashboard(id: string, updates: Partial<AnalyticsDashboard>): Promise<APIResponse<AnalyticsDashboard>> {
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
        .from('analytics_dashboards')
        .update(sanitizedUpdates)
        .eq('id', id)
        .select()
        .single()
    })
  }

  async deleteDashboard(id: string): Promise<APIResponse<void>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      if (!await this.checkPermission(id, userId)) {
        throw new Error('Access denied')
      }

      return await supabase.from('analytics_dashboards').delete().eq('id', id)
    })
  }

  // Trend Analysis
  async analyzeTrends(metricNames: string[], timeRange: string = '30d'): Promise<APIResponse<TrendAnalysis[]>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      const trends: TrendAnalysis[] = []
      
      for (const metricName of metricNames) {
        const { data: metrics } = await this.getMetricHistory(metricName, timeRange)
        
        if (metrics && metrics.length >= 3) {
          const trend = this.calculateTrend(metrics, timeRange)
          trends.push(trend)
        }
      }

      return { data: trends }
    })
  }

  async getCorrelationAnalysis(metric1: string, metric2: string, timeRange: string = '30d'): Promise<APIResponse<any>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      const [metrics1Result, metrics2Result] = await Promise.all([
        this.getMetricHistory(metric1, timeRange),
        this.getMetricHistory(metric2, timeRange)
      ])

      if (!metrics1Result.data || !metrics2Result.data) {
        throw new Error('Insufficient data for correlation analysis')
      }

      const correlation = this.calculateCorrelation(metrics1Result.data, metrics2Result.data)
      
      return { data: correlation }
    })
  }

  // Predictive Analytics
  async generatePredictions(metricName: string, daysAhead: number = 7): Promise<APIResponse<any>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      const { data: historicalData } = await this.getMetricHistory(metricName, '90d')
      
      if (!historicalData || historicalData.length < 14) {
        throw new Error('Insufficient historical data for predictions')
      }

      const predictions = this.generateSimplePredictions(historicalData, daysAhead)
      
      return { data: predictions }
    })
  }

  // Personal Reports
  async generatePersonalReport(type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly', date?: string): Promise<APIResponse<PersonalReport>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      const { periodStart, periodEnd } = this.calculateReportPeriod(type, date)
      
      // Gather data from all modules
      const reportData = await this.gatherReportData(userId, periodStart, periodEnd)
      
      // Generate insights and recommendations
      const analysis = await this.analyzeReportData(reportData)
      
      const report: Omit<PersonalReport, 'id'> = {
        user_id: userId,
        type,
        period_start: periodStart,
        period_end: periodEnd,
        summary: analysis.summary,
        key_metrics: analysis.keyMetrics,
        achievements: analysis.achievements,
        areas_for_improvement: analysis.areasForImprovement,
        recommendations: analysis.recommendations,
        trend_analysis: analysis.trendAnalysis,
        generated_at: new Date().toISOString()
      }

      const result = await supabase.from('personal_reports').insert(report).select().single()
      
      return result
    })
  }

  async getPersonalReports(type?: string): Promise<APIResponse<PersonalReport[]>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      let query = supabase
        .from('personal_reports')
        .select('*')
        .eq('user_id', userId)
        .order('generated_at', { ascending: false })

      if (type) {
        query = query.eq('type', type)
      }

      return await query
    })
  }

  // Data Aggregation and Insights
  async getLifeOverview(timeRange: string = '30d'): Promise<APIResponse<any>> {
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

      // Get metrics by category
      const { data: metrics } = await supabase
        .from('life_metrics')
        .select('*')
        .eq('user_id', userId)
        .gte('recorded_at', startDate.toISOString())
        .lte('recorded_at', endDate.toISOString())

      if (!metrics) {
        return { data: this.getEmptyOverview() }
      }

      const overview = this.calculateLifeOverview(metrics)
      
      return { data: overview }
    })
  }

  async getCategoryInsights(category: string, timeRange: string = '30d'): Promise<APIResponse<any>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      const { data: metrics } = await this.getMetrics(1, 1000, {
        category,
        date_from: this.getDateFromRange(timeRange)
      })

      if (!metrics || metrics.length === 0) {
        return { data: { category, insights: [], trends: [], recommendations: [] } }
      }

      const insights = this.analyzeCategoryData(category, metrics)
      
      return { data: insights }
    })
  }

  // Automated Data Collection
  async setupAutomatedCollection(config: {
    metric_name: string
    data_source: string
    collection_frequency: 'hourly' | 'daily' | 'weekly'
    api_endpoint?: string
    transformation_rules?: any
  }): Promise<APIResponse<any>> {
    return this.handleRequest(async () => {
      const userId = await this.ensureAuthenticated()
      
      this.validateRequired(config, ['metric_name', 'data_source', 'collection_frequency'])
      
      const automationConfig = {
        ...config,
        user_id: userId,
        metric_name: this.sanitizeInput(config.metric_name),
        is_active: true,
        created_at: new Date().toISOString()
      }

      return await supabase.from('automated_collections').insert(automationConfig).select().single()
    })
  }

  // Helper Methods
  private calculateTrend(metrics: LifeMetric[], timeRange: string): TrendAnalysis {
    const values = metrics.map(m => m.value)
    const dates = metrics.map(m => new Date(m.recorded_at))
    
    // Simple linear regression for trend
    const n = values.length
    const sumX = dates.reduce((sum, date, i) => sum + i, 0)
    const sumY = values.reduce((sum, val) => sum + val, 0)
    const sumXY = values.reduce((sum, val, i) => sum + (i * val), 0)
    const sumXX = dates.reduce((sum, date, i) => sum + (i * i), 0)
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n
    
    // Determine trend direction and strength
    const trendDirection = slope > 0.1 ? 'up' : slope < -0.1 ? 'down' : 'stable'
    const trendStrength = Math.abs(slope)
    
    // Calculate correlation factors (simplified)
    const correlationFactors = this.identifyCorrelationFactors(metrics[0].name)
    
    // Generate simple predictions
    const predictions = this.generateTrendPredictions(slope, intercept, values.length, 7)
    
    return {
      metric_name: metrics[0].name,
      time_period: timeRange,
      trend_direction: trendDirection,
      trend_strength: trendStrength,
      correlation_factors: correlationFactors,
      predictions: predictions,
      confidence_interval: this.calculateConfidenceInterval(values, slope, intercept)
    }
  }

  private calculateCorrelation(metrics1: LifeMetric[], metrics2: LifeMetric[]): any {
    // Align metrics by date
    const alignedData = this.alignMetricsByDate(metrics1, metrics2)
    
    if (alignedData.length < 3) {
      return { correlation: 0, significance: 'insufficient_data' }
    }

    const values1 = alignedData.map(d => d.value1)
    const values2 = alignedData.map(d => d.value2)
    
    const correlation = this.pearsonCorrelation(values1, values2)
    const significance = this.assessCorrelationSignificance(correlation, alignedData.length)
    
    return {
      correlation,
      significance,
      sample_size: alignedData.length,
      interpretation: this.interpretCorrelation(correlation)
    }
  }

  private generateSimplePredictions(historicalData: LifeMetric[], daysAhead: number): any {
    const values = historicalData.map(m => m.value)
    const recentTrend = this.calculateRecentTrend(values)
    const seasonality = this.detectSeasonality(values)
    
    const predictions = []
    const lastValue = values[values.length - 1]
    
    for (let i = 1; i <= daysAhead; i++) {
      const trendComponent = lastValue + (recentTrend * i)
      const seasonalComponent = seasonality[i % seasonality.length] || 0
      const predicted = trendComponent + seasonalComponent
      
      predictions.push({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString(),
        predicted_value: predicted,
        confidence_lower: predicted * 0.9,
        confidence_upper: predicted * 1.1
      })
    }
    
    return {
      predictions,
      model_type: 'simple_trend_seasonal',
      accuracy_estimate: this.estimateAccuracy(values)
    }
  }

  private calculateReportPeriod(type: string, date?: string): { periodStart: string, periodEnd: string } {
    const referenceDate = date ? new Date(date) : new Date()
    let periodStart: Date
    let periodEnd: Date
    
    switch (type) {
      case 'daily':
        periodStart = new Date(referenceDate)
        periodStart.setHours(0, 0, 0, 0)
        periodEnd = new Date(periodStart)
        periodEnd.set

        periodEnd.setHours(23, 59, 59, 999)
        break
      case 'weekly':
        periodStart = new Date(referenceDate)
        periodStart.setDate(referenceDate.getDate() - referenceDate.getDay())
        periodStart.setHours(0, 0, 0, 0)
        periodEnd = new Date(periodStart)
        periodEnd.setDate(periodStart.getDate() + 6)
        periodEnd.setHours(23, 59, 59, 999)
        break
      case 'monthly':
        periodStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1)
        periodEnd = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0, 23, 59, 59, 999)
        break
      case 'quarterly':
        const quarter = Math.floor(referenceDate.getMonth() / 3)
        periodStart = new Date(referenceDate.getFullYear(), quarter * 3, 1)
        periodEnd = new Date(referenceDate.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59, 999)
        break
      case 'yearly':
        periodStart = new Date(referenceDate.getFullYear(), 0, 1)
        periodEnd = new Date(referenceDate.getFullYear(), 11, 31, 23, 59, 59, 999)
        break
      default:
        throw new Error('Invalid report type')
    }
    
    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString()
    }
  }

  private async gatherReportData(userId: string, periodStart: string, periodEnd: string): Promise<any> {
    // Gather data from all modules
    const [metricsResult, ritualsResult, flowSessionsResult, reflectionsResult] = await Promise.all([
      supabase.from('life_metrics').select('*').eq('user_id', userId).gte('recorded_at', periodStart).lte('recorded_at', periodEnd),
      supabase.from('ritual_completions').select('*').eq('user_id', userId).gte('completed_at', periodStart).lte('completed_at', periodEnd),
      supabase.from('flow_sessions').select('*').eq('user_id', userId).gte('start_time', periodStart).lte('start_time', periodEnd),
      supabase.from('reflection_entries').select('*').eq('user_id', userId).gte('created_at', periodStart).lte('created_at', periodEnd)
    ])

    return {
      metrics: metricsResult.data || [],
      rituals: ritualsResult.data || [],
      flowSessions: flowSessionsResult.data || [],
      reflections: reflectionsResult.data || []
    }
  }

  private async analyzeReportData(data: any): Promise<any> {
    const analysis = {
      summary: this.generateSummary(data),
      keyMetrics: this.extractKeyMetrics(data),
      achievements: this.identifyAchievements(data),
      areasForImprovement: this.identifyImprovementAreas(data),
      recommendations: this.generateRecommendations(data),
      trendAnalysis: this.analyzeTrendsInData(data)
    }

    return analysis
  }

  private generateSummary(data: any): string {
    const totalMetrics = data.metrics.length
    const totalRituals = data.rituals.length
    const totalFlowSessions = data.flowSessions.length
    const totalReflections = data.reflections.length

    return `During this period, you recorded ${totalMetrics} metrics, completed ${totalRituals} rituals, had ${totalFlowSessions} flow sessions, and wrote ${totalReflections} reflections. This shows ${totalMetrics > 50 ? 'excellent' : totalMetrics > 20 ? 'good' : 'moderate'} engagement with your life optimization journey.`
  }

  private extractKeyMetrics(data: any): any {
    const metricsByCategory = this.groupBy(data.metrics, 'category')
    const keyMetrics: any = {}

    Object.keys(metricsByCategory).forEach(category => {
      const categoryMetrics = metricsByCategory[category]
      const avgValue = categoryMetrics.reduce((sum: number, m: any) => sum + m.value, 0) / categoryMetrics.length
      
      keyMetrics[category] = {
        average: avgValue,
        count: categoryMetrics.length,
        trend: this.calculateSimpleTrend(categoryMetrics.map((m: any) => m.value))
      }
    })

    return keyMetrics
  }

  private identifyAchievements(data: any): string[] {
    const achievements: string[] = []

    // Ritual achievements
    if (data.rituals.length > 0) {
      const uniqueRituals = new Set(data.rituals.map((r: any) => r.ritual_id)).size
      achievements.push(`Completed ${data.rituals.length} ritual sessions across ${uniqueRituals} different rituals`)
    }

    // Flow session achievements
    if (data.flowSessions.length > 0) {
      const totalFocusTime = data.flowSessions.reduce((sum: number, s: any) => sum + (s.actual_duration || 0), 0)
      achievements.push(`Achieved ${Math.round(totalFocusTime / 60)} hours of focused work time`)
    }

    // Reflection achievements
    if (data.reflections.length > 0) {
      achievements.push(`Maintained consistent reflection practice with ${data.reflections.length} entries`)
    }

    return achievements
  }

  private identifyImprovementAreas(data: any): string[] {
    const areas: string[] = []

    // Analyze consistency
    const daysCovered = this.calculateDaysCovered(data)
    if (daysCovered < 0.7) {
      areas.push('Improve consistency in daily tracking and habits')
    }

    // Analyze balance
    const categoryBalance = this.analyzeCategoryBalance(data.metrics)
    if (categoryBalance.imbalanced) {
      areas.push(`Focus more on ${categoryBalance.neglectedCategories.join(', ')} aspects of life`)
    }

    return areas
  }

  private generateRecommendations(data: any): string[] {
    const recommendations: string[] = []

    // Based on data patterns
    if (data.metrics.length < 30) {
      recommendations.push('Increase frequency of metric tracking for better insights')
    }

    if (data.flowSessions.length === 0) {
      recommendations.push('Start incorporating focused work sessions to improve productivity')
    }

    if (data.reflections.length < 7) {
      recommendations.push('Establish a regular reflection practice for better self-awareness')
    }

    return recommendations
  }

  private analyzeTrendsInData(data: any): TrendAnalysis[] {
    const trends: TrendAnalysis[] = []

    // Analyze metric trends by category
    const metricsByCategory = this.groupBy(data.metrics, 'category')
    
    Object.keys(metricsByCategory).forEach(category => {
      const categoryMetrics = metricsByCategory[category]
      if (categoryMetrics.length >= 3) {
        const values = categoryMetrics.map((m: any) => m.value)
        const trend = this.calculateSimpleTrend(values)
        
        trends.push({
          metric_name: category,
          time_period: 'report_period',
          trend_direction: trend > 0.1 ? 'up' : trend < -0.1 ? 'down' : 'stable',
          trend_strength: Math.abs(trend),
          correlation_factors: [],
          predictions: {},
          confidence_interval: 0.8
        })
      }
    })

    return trends
  }

  private calculateLifeOverview(metrics: LifeMetric[]): any {
    const metricsByCategory = this.groupBy(metrics, 'category')
    const overview: any = {
      totalMetrics: metrics.length,
      categories: {},
      overallTrend: 'stable',
      topPerformingAreas: [],
      areasNeedingAttention: []
    }

    Object.keys(metricsByCategory).forEach(category => {
      const categoryMetrics = metricsByCategory[category]
      const avgValue = categoryMetrics.reduce((sum, m) => sum + m.value, 0) / categoryMetrics.length
      const trend = this.calculateSimpleTrend(categoryMetrics.map(m => m.value))
      
      overview.categories[category] = {
        average: avgValue,
        count: categoryMetrics.length,
        trend: trend > 0.1 ? 'improving' : trend < -0.1 ? 'declining' : 'stable',
        lastValue: categoryMetrics[categoryMetrics.length - 1]?.value
      }

      if (trend > 0.2) {
        overview.topPerformingAreas.push(category)
      } else if (trend < -0.2) {
        overview.areasNeedingAttention.push(category)
      }
    })

    return overview
  }

  private analyzeCategoryData(category: string, metrics: LifeMetric[]): any {
    const metricsByName = this.groupBy(metrics, 'name')
    const insights: any = {
      category,
      insights: [],
      trends: [],
      recommendations: []
    }

    Object.keys(metricsByName).forEach(metricName => {
      const metricData = metricsByName[metricName]
      if (metricData.length >= 3) {
        const values = metricData.map(m => m.value)
        const trend = this.calculateSimpleTrend(values)
        const avg = values.reduce((sum, val) => sum + val, 0) / values.length
        
        insights.trends.push({
          metric: metricName,
          trend: trend > 0.1 ? 'improving' : trend < -0.1 ? 'declining' : 'stable',
          average: avg,
          latest: values[values.length - 1]
        })

        if (trend < -0.2) {
          insights.recommendations.push(`Focus on improving ${metricName} - showing declining trend`)
        }
      }
    })

    return insights
  }

  // Utility methods
  private groupBy<T>(array: T[], key: keyof T): { [key: string]: T[] } {
    return array.reduce((groups, item) => {
      const group = String(item[key])
      groups[group] = groups[group] || []
      groups[group].push(item)
      return groups
    }, {} as { [key: string]: T[] })
  }

  private calculateSimpleTrend(values: number[]): number {
    if (values.length < 2) return 0
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2))
    const secondHalf = values.slice(Math.floor(values.length / 2))
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length
    
    return (secondAvg - firstAvg) / firstAvg
  }

  private identifyCorrelationFactors(metricName: string): string[] {
    // Simplified correlation factor identification
    const commonFactors: { [key: string]: string[] } = {
      'mood': ['sleep_quality', 'exercise', 'stress_level'],
      'energy': ['sleep_duration', 'nutrition', 'exercise'],
      'productivity': ['focus_time', 'distractions', 'energy'],
      'stress': ['workload', 'sleep_quality', 'exercise']
    }

    return commonFactors[metricName.toLowerCase()] || []
  }

  private generateTrendPredictions(slope: number, intercept: number, dataPoints: number, daysAhead: number): any {
    const predictions = []
    
    for (let i = 1; i <= daysAhead; i++) {
      const predicted = slope * (dataPoints + i) + intercept
      predictions.push({
        day: i,
        value: predicted,
        confidence: Math.max(0.5, 1 - (i * 0.1)) // Decreasing confidence over time
      })
    }
    
    return predictions
  }

  private calculateConfidenceInterval(values: number[], slope: number, intercept: number): number {
    // Simplified confidence interval calculation
    const predictions = values.map((_, i) => slope * i + intercept)
    const errors = values.map((val, i) => Math.abs(val - predictions[i]))
    const meanError = errors.reduce((sum, err) => sum + err, 0) / errors.length
    
    return Math.max(0.5, 1 - (meanError / (Math.max(...values) - Math.min(...values))))
  }

  private alignMetricsByDate(metrics1: LifeMetric[], metrics2: LifeMetric[]): any[] {
    const aligned: any[] = []
    
    metrics1.forEach(m1 => {
      const date1 = new Date(m1.recorded_at).toDateString()
      const m2 = metrics2.find(m => new Date(m.recorded_at).toDateString() === date1)
      
      if (m2) {
        aligned.push({
          date: date1,
          value1: m1.value,
          value2: m2.value
        })
      }
    })
    
    return aligned
  }

  private pearsonCorrelation(x: number[], y: number[]): number {
    const n = x.length
    const sumX = x.reduce((sum, val) => sum + val, 0)
    const sumY = y.reduce((sum, val) => sum + val, 0)
    const sumXY = x.reduce((sum, val, i) => sum + (val * y[i]), 0)
    const sumXX = x.reduce((sum, val) => sum + (val * val), 0)
    const sumYY = y.reduce((sum, val) => sum + (val * val), 0)
    
    const numerator = n * sumXY - sumX * sumY
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY))
    
    return denominator === 0 ? 0 : numerator / denominator
  }

  private assessCorrelationSignificance(correlation: number, sampleSize: number): string {
    const absCorr = Math.abs(correlation)
    
    if (sampleSize < 10) return 'insufficient_data'
    if (absCorr > 0.7) return 'strong'
    if (absCorr > 0.5) return 'moderate'
    if (absCorr > 0.3) return 'weak'
    return 'negligible'
  }

  private interpretCorrelation(correlation: number): string {
    const absCorr = Math.abs(correlation)
    const direction = correlation > 0 ? 'positive' : 'negative'
    
    if (absCorr > 0.7) return `Strong ${direction} correlation`
    if (absCorr > 0.5) return `Moderate ${direction} correlation`
    if (absCorr > 0.3) return `Weak ${direction} correlation`
    return 'No significant correlation'
  }

  private calculateRecentTrend(values: number[]): number {
    if (values.length < 4) return 0
    
    const recent = values.slice(-7) // Last 7 values
    return this.calculateSimpleTrend(recent)
  }

  private detectSeasonality(values: number[]): number[] {
    // Simplified seasonality detection (weekly pattern)
    const weeklyPattern = new Array(7).fill(0)
    
    values.forEach((value, index) => {
      const dayOfWeek = index % 7
      weeklyPattern[dayOfWeek] += value
    })
    
    const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length
    return weeklyPattern.map(sum => (sum / Math.ceil(values.length / 7)) - avgValue)
  }

  private estimateAccuracy(values: number[]): number {
    // Simple accuracy estimate based on variance
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    const coefficientOfVariation = Math.sqrt(variance) / mean
    
    return Math.max(0.3, 1 - coefficientOfVariation)
  }

  private getEmptyOverview(): any {
    return {
      totalMetrics: 0,
      categories: {},
      overallTrend: 'stable',
      topPerformingAreas: [],
      areasNeedingAttention: []
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

  private calculateDaysCovered(data: any): number {
    const allDates = new Set()
    
    data.metrics.forEach((m: any) => {
      allDates.add(new Date(m.recorded_at).toDateString())
    })
    
    data.rituals.forEach((r: any) => {
      allDates.add(new Date(r.completed_at).toDateString())
    })
    
    data.flowSessions.forEach((f: any) => {
      allDates.add(new Date(f.start_time).toDateString())
    })
    
    data.reflections.forEach((r: any) => {
      allDates.add(new Date(r.created_at).toDateString())
    })
    
    const totalPossibleDays = 30 // Assuming 30-day period
    return allDates.size / totalPossibleDays
  }

  private analyzeCategoryBalance(metrics: LifeMetric[]): any {
    const categories = ['physical', 'mental', 'spiritual', 'financial', 'social', 'professional']
    const metricsByCategory = this.groupBy(metrics, 'category')
    
    const categoryCounts = categories.map(cat => ({
      category: cat,
      count: metricsByCategory[cat]?.length || 0
    }))
    
    const avgCount = categoryCounts.reduce((sum, c) => sum + c.count, 0) / categories.length
    const neglectedCategories = categoryCounts
      .filter(c => c.count < avgCount * 0.5)
      .map(c => c.category)
    
    return {
      imbalanced: neglectedCategories.length > 0,
      neglectedCategories
    }
  }
}

export const lifeAnalyticsAPI = new LifeAnalyticsAPI()