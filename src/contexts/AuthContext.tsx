import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { databaseService } from '@/services/database'
import type { User } from '@supabase/supabase-js'
import type { UserProfile, UserPreferences } from '@/services/database'
import toast from 'react-hot-toast'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  preferences: UserPreferences | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          return
        }

        if (session?.user) {
          setUser(session.user)
          await loadUserData(session.user.id)
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        
        if (session?.user) {
          setUser(session.user)
          await loadUserData(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
          setPreferences(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const loadUserData = async (userId: string) => {
    try {
      const { profile: userProfile, preferences: userPreferences } = await databaseService.initializeUser({ id: userId } as User)
      setProfile(userProfile)
      setPreferences(userPreferences)
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      if (data.user) {
        setUser(data.user)
        await loadUserData(data.user.id)
      }
    } catch (error: any) {
      console.error('Sign in error:', error)
      throw new Error(error.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        throw error
      }

      if (data.user) {
        // User will be set via the auth state change listener
        // Profile and preferences will be created via database trigger
      }
    } catch (error: any) {
      console.error('Sign up error:', error)
      throw new Error(error.message || 'Failed to sign up')
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw error
      }

      setUser(null)
      setProfile(null)
      setPreferences(null)
    } catch (error: any) {
      console.error('Sign out error:', error)
      throw new Error(error.message || 'Failed to sign out')
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      throw new Error('No user logged in')
    }

    try {
      const updatedProfile = await databaseService.updateUserProfile(user.id, updates)
      if (updatedProfile) {
        setProfile(updatedProfile)
        toast.success('Profile updated successfully')
      }
    } catch (error: any) {
      console.error('Update profile error:', error)
      throw new Error(error.message || 'Failed to update profile')
    }
  }

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!user) {
      throw new Error('No user logged in')
    }

    try {
      const updatedPreferences = await databaseService.updateUserPreferences(user.id, updates)
      if (updatedPreferences) {
        setPreferences(updatedPreferences)
        toast.success('Preferences updated successfully')
      }
    } catch (error: any) {
      console.error('Update preferences error:', error)
      throw new Error(error.message || 'Failed to update preferences')
    }
  }

  const value = {
    user,
    profile,
    preferences,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    updatePreferences,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}