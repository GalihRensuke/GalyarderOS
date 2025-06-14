import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export interface UserProfile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  timezone?: string
  level?: number
  experience_points?: number
  optimization_score?: number
  created_at?: string
  updated_at?: string
}

export interface UserPreferences {
  id: string
  user_id: string
  theme?: 'dark' | 'light' | 'auto'
  ai_personality?: string
  notification_settings?: any
  privacy_settings?: any
  created_at?: string
  updated_at?: string
}

class DatabaseService {
  // User Profile Operations
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Database error:', error)
      return null
    }
  }

  async createUserProfile(user: User): Promise<UserProfile | null> {
    try {
      const profileData = {
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name || null,
        avatar_url: user.user_metadata?.avatar_url || null,
        timezone: 'UTC',
        level: 1,
        experience_points: 0,
        optimization_score: 0
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .insert(profileData)
        .select()
        .single()

      if (error) {
        console.error('Error creating user profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Database error:', error)
      return null
    }
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        console.error('Error updating user profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Database error:', error)
      return null
    }
  }

  // User Preferences Operations
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error('Error fetching user preferences:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Database error:', error)
      return null
    }
  }

  async createUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const preferencesData = {
        user_id: userId,
        theme: 'dark',
        ai_personality: 'supportive-coach',
        notification_settings: {
          insights: true,
          reminders: true,
          achievements: true,
          weekly_reports: true,
          push_notifications: true,
          email_notifications: true
        },
        privacy_settings: {
          analytics: true,
          ai_learning: true,
          data_sharing: false,
          public_profile: false
        }
      }

      const { data, error } = await supabase
        .from('user_preferences')
        .insert(preferencesData)
        .select()
        .single()

      if (error) {
        console.error('Error creating user preferences:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Database error:', error)
      return null
    }
  }

  async updateUserPreferences(userId: string, updates: Partial<UserPreferences>): Promise<UserPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        console.error('Error updating user preferences:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Database error:', error)
      return null
    }
  }

  // Initialize user data (profile + preferences)
  async initializeUser(user: User): Promise<{ profile: UserProfile | null, preferences: UserPreferences | null }> {
    try {
      // Check if profile exists
      let profile = await this.getUserProfile(user.id)
      
      if (!profile) {
        profile = await this.createUserProfile(user)
      }

      // Check if preferences exist
      let preferences = await this.getUserPreferences(user.id)
      
      if (!preferences) {
        preferences = await this.createUserPreferences(user.id)
      }

      return { profile, preferences }
    } catch (error) {
      console.error('Error initializing user:', error)
      return { profile: null, preferences: null }
    }
  }

  // Real-time subscriptions
  subscribeToUserProfile(userId: string, callback: (profile: UserProfile) => void) {
    return supabase
      .channel(`user_profile_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles',
          filter: `id=eq.${userId}`
        },
        (payload) => {
          if (payload.new) {
            callback(payload.new as UserProfile)
          }
        }
      )
      .subscribe()
  }

  subscribeToUserPreferences(userId: string, callback: (preferences: UserPreferences) => void) {
    return supabase
      .channel(`user_preferences_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_preferences',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.new) {
            callback(payload.new as UserPreferences)
          }
        }
      )
      .subscribe()
  }
}

export const databaseService = new DatabaseService()