import React, { createContext, useContext, useState, useCallback } from 'react'
import { geminiService } from '@/services/gemini'
import type { AIPersonality, LifeInsight, AIResponse } from '@/types/ai'

interface AIContextType {
  personality: AIPersonality
  insights: LifeInsight[]
  isProcessing: boolean
  generateInsight: (domain: string, data: any) => Promise<LifeInsight>
  askAI: (question: string, context?: any) => Promise<AIResponse>
  updatePersonality: (updates: Partial<AIPersonality>) => void
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
  const [personality, setPersonality] = useState<AIPersonality>(defaultPersonality)
  const [insights, setInsights] = useState<LifeInsight[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

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

  const updatePersonality = useCallback((updates: Partial<AIPersonality>) => {
    setPersonality(prev => ({ ...prev, ...updates }))
  }, [])

  const value = {
    personality,
    insights,
    isProcessing,
    generateInsight,
    askAI,
    updatePersonality,
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