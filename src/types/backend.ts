// Core Backend Types and Interfaces

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Ritual Engine Types
export interface Ritual {
  id: string
  user_id: string
  name: string
  description?: string
  category: 'morning' | 'evening' | 'work' | 'health' | 'mindfulness' | 'custom'
  type: 'habit' | 'routine' | 'sequence'
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom'
  custom_frequency?: string
  duration_minutes?: number
  steps: RitualStep[]
  is_active: boolean
  streak_count: number
  best_streak: number
  total_completions: number
  difficulty_level: 1 | 2 | 3 | 4 | 5
  tags: string[]
  reminder_time?: string
  reminder_enabled: boolean
  created_at: string
  updated_at: string
}

export interface RitualStep {
  id: string
  ritual_id: string
  order: number
  name: string
  description?: string
  duration_minutes?: number
  is_required: boolean
  completion_criteria?: string
}

export interface RitualCompletion {
  id: string
  ritual_id: string
  user_id: string
  completed_at: string
  duration_minutes?: number
  mood_before?: number
  mood_after?: number
  energy_before?: number
  energy_after?: number
  notes?: string
  completed_steps: string[]
  skipped_steps: string[]
}

export interface RitualTemplate {
  id: string
  name: string
  description: string
  category: string
  difficulty_level: number
  estimated_duration: number
  steps: Omit<RitualStep, 'id' | 'ritual_id'>[]
  tags: string[]
  popularity_score: number
  created_by: string
  is_public: boolean
}

// Flow State Types
export interface FlowSession {
  id: string
  user_id: string
  name: string
  type: 'deep_work' | 'creative' | 'learning' | 'problem_solving' | 'custom'
  planned_duration: number
  actual_duration?: number
  start_time: string
  end_time?: string
  status: 'planned' | 'active' | 'paused' | 'completed' | 'cancelled'
  focus_score?: number
  productivity_score?: number
  distraction_count: number
  break_count: number
  environment_settings: FlowEnvironment
  metrics: FlowMetrics
  notes?: string
  tags: string[]
}

export interface FlowEnvironment {
  noise_level: 'silent' | 'ambient' | 'moderate' | 'energetic'
  lighting: 'dim' | 'natural' | 'bright'
  temperature_preference: 'cool' | 'comfortable' | 'warm'
  music_enabled: boolean
  music_type?: string
  notifications_blocked: boolean
  website_blocking_enabled: boolean
  blocked_websites: string[]
}

export interface FlowMetrics {
  heart_rate_avg?: number
  heart_rate_variability?: number
  keystroke_dynamics?: any
  mouse_movement_patterns?: any
  screen_time_distribution: any
  app_usage: any
  focus_intervals: FocusInterval[]
}

export interface FocusInterval {
  start_time: string
  end_time: string
  focus_level: number
  activity_type: string
  interruptions: number
}

export interface FlowOptimization {
  id: string
  user_id: string
  optimal_duration: number
  best_time_of_day: string
  preferred_environment: FlowEnvironment
  peak_performance_indicators: any
  improvement_suggestions: string[]
  last_updated: string
}

// Knowledge Synthesis Types
export interface KnowledgeNode {
  id: string
  user_id: string
  title: string
  content: string
  type: 'note' | 'article' | 'book' | 'video' | 'podcast' | 'idea' | 'quote'
  source?: string
  author?: string
  url?: string
  tags: string[]
  category: string
  importance_score: number
  connections: string[]
  created_at: string
  updated_at: string
  last_accessed: string
  access_count: number
}

export interface KnowledgeConnection {
  id: string
  user_id: string
  source_node_id: string
  target_node_id: string
  connection_type: 'related' | 'contradicts' | 'supports' | 'builds_on' | 'example_of'
  strength: number
  description?: string
  created_at: string
}

export interface KnowledgeCluster {
  id: string
  user_id: string
  name: string
  description?: string
  node_ids: string[]
  center_node_id: string
  coherence_score: number
  tags: string[]
  created_at: string
  updated_at: string
}

export interface SearchResult {
  node: KnowledgeNode
  relevance_score: number
  snippet: string
  highlighted_terms: string[]
}

// Reflection Intelligence Types
export interface ReflectionPrompt {
  id: string
  category: 'daily' | 'weekly' | 'monthly' | 'goal_review' | 'life_audit' | 'custom'
  type: 'open_ended' | 'scale' | 'multiple_choice' | 'comparative'
  question: string
  sub_questions?: string[]
  context?: string
  difficulty_level: number
  tags: string[]
  is_active: boolean
}

export interface ReflectionEntry {
  id: string
  user_id: string
  prompt_id?: string
  type: 'daily' | 'weekly' | 'monthly' | 'spontaneous'
  title: string
  content: string
  mood_score?: number
  energy_score?: number
  satisfaction_score?: number
  stress_level?: number
  key_insights: string[]
  action_items: string[]
  gratitude_items: string[]
  challenges_faced: string[]
  wins_celebrated: string[]
  tags: string[]
  is_private: boolean
  created_at: string
  updated_at: string
}

export interface ReflectionInsight {
  id: string
  user_id: string
  type: 'pattern' | 'trend' | 'correlation' | 'anomaly' | 'recommendation'
  title: string
  description: string
  confidence_score: number
  supporting_data: any
  time_period: string
  category: string
  actionable: boolean
  action_suggestions: string[]
  created_at: string
}

export interface ReflectionAnalytics {
  user_id: string
  total_entries: number
  consistency_score: number
  average_mood: number
  mood_trend: 'improving' | 'declining' | 'stable'
  common_themes: string[]
  growth_areas: string[]
  achievement_patterns: any
  stress_triggers: string[]
  energy_patterns: any
  last_updated: string
}

// Life Analytics Types
export interface LifeMetric {
  id: string
  user_id: string
  category: 'physical' | 'mental' | 'spiritual' | 'financial' | 'social' | 'professional'
  name: string
  value: number
  unit: string
  target_value?: number
  measurement_type: 'counter' | 'gauge' | 'timer' | 'percentage'
  data_source: 'manual' | 'automated' | 'calculated'
  recorded_at: string
  metadata?: any
}

export interface AnalyticsDashboard {
  id: string
  user_id: string
  name: string
  description?: string
  widgets: DashboardWidget[]
  layout: any
  is_default: boolean
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface DashboardWidget {
  id: string
  type: 'chart' | 'metric' | 'progress' | 'heatmap' | 'timeline' | 'comparison'
  title: string
  data_source: string
  configuration: any
  position: { x: number; y: number; width: number; height: number }
}

export interface TrendAnalysis {
  metric_name: string
  time_period: string
  trend_direction: 'up' | 'down' | 'stable'
  trend_strength: number
  correlation_factors: string[]
  predictions: any
  confidence_interval: number
}

export interface PersonalReport {
  id: string
  user_id: string
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  period_start: string
  period_end: string
  summary: string
  key_metrics: any
  achievements: string[]
  areas_for_improvement: string[]
  recommendations: string[]
  trend_analysis: TrendAnalysis[]
  generated_at: string
}