export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
  preferences: UserPreferences
  createdAt: Date
  lastActive: Date
}

export interface UserPreferences {
  theme: 'dark' | 'light' | 'auto'
  aiPersonality: string
  notifications: NotificationSettings
  privacy: PrivacySettings
}

export interface NotificationSettings {
  insights: boolean
  reminders: boolean
  achievements: boolean
  weeklyReports: boolean
}

export interface PrivacySettings {
  dataSharing: boolean
  analytics: boolean
  aiLearning: boolean
}

export interface Goal {
  id: string
  title: string
  description: string
  category: string
  priority: 'high' | 'medium' | 'low'
  status: 'active' | 'completed' | 'paused' | 'archived'
  progress: number
  target: number
  unit: string
  deadline?: Date
  milestones: Milestone[]
  createdAt: Date
  updatedAt: Date
}

export interface Milestone {
  id: string
  title: string
  description?: string
  completed: boolean
  completedAt?: Date
  dueDate?: Date
}

export interface Habit {
  id: string
  name: string
  description?: string
  category: string
  frequency: 'daily' | 'weekly' | 'monthly'
  targetCount: number
  currentStreak: number
  longestStreak: number
  completions: HabitCompletion[]
  isActive: boolean
  createdAt: Date
}

export interface HabitCompletion {
  id: string
  date: Date
  completed: boolean
  notes?: string
}

export interface Session {
  id: string
  type: 'focus' | 'reflection' | 'planning' | 'review'
  title: string
  duration: number // in minutes
  startTime: Date
  endTime?: Date
  notes?: string
  mood?: number // 1-10 scale
  energy?: number // 1-10 scale
  productivity?: number // 1-10 scale
  tags: string[]
}