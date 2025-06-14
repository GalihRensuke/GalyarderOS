import React, { createContext, useContext, useState, useCallback } from 'react'
import type { AIPersonality, LifeInsight, AIResponse } from '@/types/ai'
import toast from 'react-hot-toast'

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

// Sample insights for development
const sampleInsights: LifeInsight[] = [
  {
    id: '1',
    title: 'Morning Routine Optimization',
    message: 'Your productivity is 35% higher on days when you complete your morning routine. Consider making this a non-negotiable daily practice.',
    actionItems: [
      'Prepare for morning routine the night before',
      'Set a consistent wake-up time',
      'Add 10 minutes of mindfulness to your routine'
    ],
    priority: 'high',
    category: 'productivity',
    timestamp: new Date(),
    domain: 'routine-optimization',
    confidence: 92,
    timeframe: 'this_week',
    relatedDomains: ['health', 'focus']
  },
  {
    id: '2',
    title: 'Focus Session Duration Sweet Spot',
    message: 'Your optimal focus session duration appears to be 52 minutes followed by a 17 minute break. This aligns with research on ultradian rhythms.',
    actionItems: [
      'Adjust Pomodoro timer to 52/17 minutes',
      'Schedule 3-4 focus blocks per day',
      'Use breaks for movement, not screens'
    ],
    priority: 'medium',
    category: 'focus',
    timestamp: new Date(),
    domain: 'flow-state',
    confidence: 85,
    timeframe: 'this_week',
    relatedDomains: ['productivity', 'energy']
  },
  {
    id: '3',
    title: 'Sleep Quality Impact',
    message: 'Your cognitive performance drops by 27% when you get less than 7 hours of sleep. Prioritizing sleep could be your highest leverage point.',
    actionItems: [
      'Establish a wind-down routine 1 hour before bed',
      'Maintain consistent sleep/wake times',
      'Limit screen time after 9pm',
      'Track sleep quality with journal entries'
    ],
    priority: 'high',
    category: 'health',
    timestamp: new Date(),
    domain: 'sleep-optimization',
    confidence: 94,
    timeframe: 'immediate',
    relatedDomains: ['energy', 'focus', 'mood']
  }
]

const AIContext = createContext<AIContextType | undefined>(undefined)

export function AIProvider({ children }: { children: React.ReactNode }) {
  const [personality, setPersonality] = useState<AIPersonality>(defaultPersonality)
  const [insights, setInsights] = useState<LifeInsight[]>(sampleInsights)
  const [isProcessing, setIsProcessing] = useState(false)

  const generateInsight = useCallback(async (domain: string, data: any): Promise<LifeInsight> => {
    setIsProcessing(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const newInsight: LifeInsight = {
        id: Date.now().toString(),
        title: `${domain.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Insight`,
        message: `Based on your ${domain} data, we've identified a key optimization opportunity that could significantly improve your results.`,
        actionItems: [
          'Implement a consistent tracking system',
          'Focus on the highest leverage activities',
          'Review progress weekly and adjust'
        ],
        priority: 'medium',
        category: domain,
        timestamp: new Date(),
        domain,
        confidence: 85,
        timeframe: 'this_week',
        relatedDomains: []
      }
      
      setInsights(prev => [newInsight, ...prev])
      return newInsight
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const askAI = useCallback(async (question: string, context?: any): Promise<AIResponse> => {
    setIsProcessing(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Generate a response based on the question
      let response = ''
      
      if (question.toLowerCase().includes('goal')) {
        response = "Based on your data, I recommend focusing on habit consistency before adding new goals. Your current completion rate is 68%, and research shows that mastering existing habits before adding new ones leads to better long-term outcomes. Consider optimizing your morning routine first, as it shows the strongest correlation with your productive days."
      } else if (question.toLowerCase().includes('focus') || question.toLowerCase().includes('productivity')) {
        response = "Your focus data shows you're most productive between 9-11am and 3-5pm. I recommend scheduling your most important deep work during these windows. Also, your focus sessions longer than 90 minutes show diminishing returns - consider using the 52/17 method (52 minutes of focus followed by 17 minutes of rest) for optimal results."
      } else if (question.toLowerCase().includes('sleep') || question.toLowerCase().includes('energy')) {
        response = "Your energy levels are most affected by sleep quality and morning exercise. Data shows your optimal sleep duration is 7.5 hours, and days with morning movement show 32% higher energy scores. I recommend prioritizing sleep consistency and adding even a short 10-minute morning movement routine."
      } else {
        response = "I've analyzed your patterns across multiple domains and noticed that consistency is your biggest opportunity area. When you maintain consistent routines for more than 14 days, your overall life satisfaction scores increase by 23%. Focus on building sustainable systems rather than setting ambitious targets."
      }
      
      return {
        id: Date.now().toString(),
        message: response,
        timestamp: new Date(),
        context: context || {},
        suggestions: [
          'Track your progress daily',
          'Review your data weekly',
          'Adjust your approach based on results'
        ],
        confidence: 90,
        followUpQuestions: [
          'How can I improve my consistency?',
          'What specific metrics should I focus on?'
        ]
      }
    } finally {
      setIsProcessing(false)
    }
  }, [personality])

  const updatePersonality = useCallback((updates: Partial<AIPersonality>) => {
    setPersonality(prev => ({ ...prev, ...updates }))
    toast.success('AI personality updated')
  }, [])

  const generateGoalRecommendations = useCallback(async (userContext: any) => {
    setIsProcessing(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      return [
        {
          title: 'Establish a Consistent Morning Routine',
          description: 'Create and maintain a morning routine that sets you up for daily success',
          category: 'Productivity',
          priority: 'high',
          timeframe: '30 days',
          milestones: [
            'Define ideal morning routine components',
            'Start with 3 core habits for 7 days',
            'Gradually add components until complete',
            'Maintain for 21 consecutive days'
          ],
          reasoning: 'Data shows your productivity is 35% higher on days with a complete morning routine'
        },
        {
          title: 'Optimize Sleep Quality',
          description: 'Improve sleep metrics to enhance cognitive performance and energy levels',
          category: 'Health',
          priority: 'high',
          timeframe: '60 days',
          milestones: [
            'Establish consistent sleep/wake times',
            'Create an evening wind-down routine',
            'Optimize sleep environment',
            'Achieve 7.5+ hours of quality sleep consistently'
          ],
          reasoning: 'Your cognitive performance drops 27% with less than 7 hours of sleep'
        },
        {
          title: 'Build Deep Work Capacity',
          description: 'Increase ability to perform focused, high-value work without distraction',
          category: 'Professional',
          priority: 'medium',
          timeframe: '90 days',
          milestones: [
            'Start with 30-minute focused sessions',
            'Gradually increase to 90-minute sessions',
            'Implement distraction-blocking systems',
            'Achieve 3 hours of deep work daily'
          ],
          reasoning: 'Your highest-value outputs correlate strongly with distraction-free focus time'
        }
      ]
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const generateHabitSuggestions = useCallback(async (userGoals: any[]) => {
    setIsProcessing(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      return [
        {
          name: 'Morning Meditation',
          description: '10-15 minutes of mindfulness meditation after waking up',
          frequency: 'daily',
          category: 'Mindfulness',
          difficulty: 'medium',
          impact: 'high',
          startingTips: [
            'Start with just 5 minutes',
            'Use a guided meditation app',
            'Same time and place each day'
          ]
        },
        {
          name: 'Exercise Session',
          description: '30-45 minutes of moderate to intense physical activity',
          frequency: 'daily',
          category: 'Health',
          difficulty: 'medium',
          impact: 'high',
          startingTips: [
            'Choose activities you enjoy',
            'Start with 20 minutes if 45 feels too much',
            'Prepare workout clothes the night before'
          ]
        },
        {
          name: 'Deep Work Block',
          description: 'Focused, distraction-free work on your most important task',
          frequency: 'daily',
          category: 'Productivity',
          difficulty: 'hard',
          impact: 'high',
          startingTips: [
            'Start with 30-minute blocks',
            'Use website blockers during this time',
            'Define the task before starting'
          ]
        },
        {
          name: 'Reading Session',
          description: '30 minutes of reading books related to your goals',
          frequency: 'daily',
          category: 'Learning',
          difficulty: 'easy',
          impact: 'medium',
          startingTips: [
            'Keep book visible as a reminder',
            'Replace social media time with reading',
            'Take brief notes on key insights'
          ]
        },
        {
          name: 'Evening Review',
          description: '10 minutes to review your day and plan tomorrow',
          frequency: 'daily',
          category: 'Productivity',
          difficulty: 'easy',
          impact: 'high',
          startingTips: [
            'Create a simple template to follow',
            'Do this before your evening wind-down',
            'Include 3 wins and 3 priorities for tomorrow'
          ]
        }
      ]
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