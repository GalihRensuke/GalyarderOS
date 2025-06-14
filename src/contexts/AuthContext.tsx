import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { databaseService, type UserProfile, type UserPreferences } from '@/services/database'
import type { User } from '@supabase/supabase-js'

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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        initializeUserData(session.user)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await initializeUserData(session.user)
        } else {
          setProfile(null)
          setPreferences(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const initializeUserData = async (user: User) => {
    try {
      const { profile, preferences } = await databaseService.initializeUser(user)
      setProfile(profile)
      setPreferences(preferences)
      
      // Set up real-time subscriptions
      if (profile) {
        databaseService.subscribeToUserProfile(user.id, setProfile)
        databaseService.subscribeToUserPreferences(user.id, setPreferences)
      }
    } catch (error) {
      console.error('Failed to initialize user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('No user logged in')
    
    const updatedProfile = await databaseService.updateUserProfile(user.id, updates)
    if (updatedProfile) {
      setProfile(updatedProfile)
    }
  }

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!user) throw new Error('No user logged in')
    
    const updatedPreferences = await databaseService.updateUserPreferences(user.id, updates)
    if (updatedPreferences) {
      setPreferences(updatedPreferences)
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