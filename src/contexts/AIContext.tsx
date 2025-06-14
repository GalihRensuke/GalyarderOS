import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { geminiService } from '@/services/gemini'
import { useAuth } from '@/contexts/AuthContext'
import type { AIPersonality, LifeInsight, AIResponse } from '@/types/ai'

interface AIContextType {
  personality: AIPersonality
  insights: LifeInsight[]
  isProcessing: boolean
  generateInsight: (domain: string, data: any) => Promise<LifeInsight>
  askAI: (question: string, context?: any) => Promise<AIResponse>
  updatePersonality: (updates: Partial<AIPersonality>) => void
  generateGoalRecommendations: (userContext: any) => Promise<any[]>
  generateHabitSuggestions: (userGoals: any[]) => Promise<any[]>
}

const defaultPersonality: AIPersonality = {
  name: 'Neural',
  style: 'supportive-coach',
  expertise: ['life-optimization', 'goal-setting', 'habit-formation'],
  communicationStyle: 'encouraging',
  adaptiveness: 0.8,
}

const AIContext = createContext<AIContextType | undefined>(undefined)

export function AIProvider({ children }: { children: React.ReactNode }) {
  const { user, preferences, updatePreferences } = useAuth()
  const [personality, setPersonality] = useState<AIPersonality>(defaultPersonality)
  const [insights, setInsights] = useState<LifeInsight[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  // Load personality from user preferences
  useEffect(() => {
    if (preferences?.ai_personality) {
      setPersonality(prev => ({
        ...prev,
        style: preferences.ai_personality as any
      }))
    }
  }, [preferences])

  const generateInsight = useCallback(async (domain: string, data: any): Promise<LifeInsight> => {
    setIsProcessing(true)
    try {
      const insight = await geminiService.generateLifeInsight(domain, data, personality)
      setInsights(prev => [insight, ...prev.slice(0, 9)]) // Keep last 10 insights
      return insight
    } finally {
      setIsProcessing(false)
    }
  }, [personality])

  const askAI = useCallback(async (question: string, context?: any): Promise<AIResponse> => {
    setIsProcessing(true)
    try {
      return await geminiService.processQuery(question, context, personality)
    } finally {
      setIsProcessing(false)
    }
  }, [personality])

  const updatePersonality = useCallback(async (updates: Partial<AIPersonality>) => {
    const newPersonality = { ...personality, ...updates }
    setPersonality(newPersonality)
    
    // Save to user preferences if user is logged in
    if (user && updates.style) {
      try {
        await updatePreferences({ ai_personality: updates.style })
      } catch (error) {
        console.error('Failed to save AI personality preference:', error)
      }
    }
  }, [personality, user, updatePreferences])

  const generateGoalRecommendations = useCallback(async (userContext: any) => {
    setIsProcessing(true)
    try {
      return await geminiService.generateGoalRecommendations(userContext)
    } catch (error) {
      console.error('Failed to generate goal recommendations:', error)
      return []
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const generateHabitSuggestions = useCallback(async (userGoals: any[]) => {
    setIsProcessing(true)
    try {
      return await geminiService.generateHabitSuggestions(userGoals)
    } catch (error) {
      console.error('Failed to generate habit suggestions:', error)
      return []
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const value = {
    personality,
    insights,
    isProcessing,
    generateInsight,
    askAI,
    updatePersonality,
    generateGoalRecommendations,
    generateHabitSuggestions,
  }

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  )
}

export function useAI() {
  const context = useContext(AIContext)
  if (context === undefined) {
    throw new Error('useAI must be used within an AIProvider')
  }
  return context
}