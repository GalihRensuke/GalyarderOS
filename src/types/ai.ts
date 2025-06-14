export interface AIPersonality {
  name: string
  style: 'supportive-coach' | 'analytical-advisor' | 'motivational-mentor' | 'zen-guide'
  expertise: string[]
  communicationStyle: 'encouraging' | 'direct' | 'philosophical' | 'scientific'
  adaptiveness: number // 0-1 scale
}

export interface LifeInsight {
  id: string
  title: string
  message: string
  actionItems: string[]
  priority: 'high' | 'medium' | 'low'
  category: string
  timestamp: Date
  domain: string
  confidence?: number
  timeframe?: 'immediate' | 'this_week' | 'this_month' | 'long_term'
  relatedDomains?: string[]
}

export interface AIResponse {
  id: string
  message: string
  timestamp: Date
  context: any
  suggestions: string[]
  confidence?: number
  followUpQuestions?: string[]
}

export interface LifeDomain {
  id: string
  name: string
  description: string
  color: string
  icon: string
  metrics: DomainMetric[]
  currentScore: number
  targetScore: number
  lastUpdated: Date
}

export interface DomainMetric {
  id: string
  name: string
  value: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  target: number
}

export interface NotionIntegration {
  isConnected: boolean
  workspaceId?: string
  databases: {
    goals?: string
    habits?: string
    insights?: string
    reflections?: string
    tasks?: string
  }
  lastSync?: Date
  syncEnabled: boolean
}