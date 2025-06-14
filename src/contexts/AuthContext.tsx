import React, { createContext, useContext, useState } from 'react'

interface UserProfile {
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

interface UserPreferences {
  id: string
  user_id: string
  theme?: 'dark' | 'light' | 'auto'
  ai_personality?: string
  notification_settings?: any
  privacy_settings?: any
  created_at?: string
  updated_at?: string
}

interface AuthContextType {
  user: any | null
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
  // Mock user data for development
  const [user] = useState(null)
  const [profile] = useState<UserProfile | null>(null)
  const [preferences] = useState<UserPreferences | null>(null)
  const [loading] = useState(false)

  const signIn = async (email: string, password: string) => {
    console.log('Sign in with:', email, password)
  }

  const signUp = async (email: string, password: string) => {
    console.log('Sign up with:', email, password)
  }

  const signOut = async () => {
    console.log('Sign out')
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    console.log('Update profile:', updates)
  }

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    console.log('Update preferences:', updates)
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