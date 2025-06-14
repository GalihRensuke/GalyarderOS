import type { AIPersonality, LifeInsight, AIResponse } from '@/types/ai'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent'

class GeminiService {
  private async callGemini(prompt: string, systemInstruction?: string): Promise<string> {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file.')
    }

    try {
      const requestBody: any = {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }

      if (systemInstruction) {
        requestBody.systemInstruction = {
          parts: [{
            text: systemInstruction
          }]
        }
      }

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Gemini API error response:', errorText)
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      return data.candidates[0]?.content?.parts[0]?.text || 'No response generated'
    } catch (error) {
      console.error('Gemini API call failed:', error)
      throw new Error('Failed to generate AI response')
    }
  }

  async generateLifeInsight(domain: string, data: any, personality: AIPersonality): Promise<LifeInsight> {
    const systemInstruction = `You are ${personality.name}, an advanced AI life optimization coach with expertise in ${personality.expertise.join(', ')}. 
    Your communication style is ${personality.communicationStyle} and you adapt your responses based on user context with ${Math.round(personality.adaptiveness * 100)}% adaptiveness.
    Always provide actionable, personalized insights that help users optimize their life across multiple domains.
    
    Generate insights that are practical, specific, and immediately actionable. Focus on behavioral changes and measurable improvements.`

    const prompt = `
    Analyze the following ${domain} data and provide a comprehensive life optimization insight:

    Domain: ${domain}
    Data: ${JSON.stringify(data, null, 2)}

    Provide a JSON response with:
    - title: A compelling, specific insight title (max 60 characters)
    - message: Detailed analysis with actionable recommendations (2-4 sentences)
    - actionItems: Array of 3-5 specific, measurable action steps
    - priority: "high", "medium", or "low" based on impact potential
    - category: The primary life domain this insight affects
    - confidence: A number 0-100 representing your confidence in this insight
    - timeframe: Suggested timeframe for implementation ("immediate", "this_week", "this_month", "long_term")
    - relatedDomains: Array of other life domains this insight might impact
    
    Focus on being ${personality.communicationStyle} while providing maximum value.
    Make sure all action items are specific, measurable, and achievable.
    `

    try {
      const response = await this.callGemini(prompt, systemInstruction)
      const parsed = JSON.parse(response.replace(/```json\n?|\n?```/g, ''))
      
      return {
        id: Date.now().toString(),
        title: parsed.title,
        message: parsed.message,
        actionItems: parsed.actionItems || [],
        priority: parsed.priority || 'medium',
        category: parsed.category || domain,
        timestamp: new Date(),
        domain,
        confidence: parsed.confidence || 85,
        timeframe: parsed.timeframe || 'this_week',
        relatedDomains: parsed.relatedDomains || []
      }
    } catch (error) {
      console.error('Failed to parse AI insight:', error)
      // Enhanced fallback with more intelligence
      return {
        id: Date.now().toString(),
        title: `${domain} Optimization Opportunity`,
        message: `Based on your recent ${domain} patterns, I've identified key areas for improvement. Your current trajectory shows potential for significant gains with focused effort.`,
        actionItems: [
          `Analyze your current ${domain} metrics and identify the top 3 improvement areas`,
          'Set specific, measurable goals with clear deadlines',
          'Implement a daily tracking system to monitor progress',
          'Schedule weekly reviews to adjust strategy as needed'
        ],
        priority: 'medium' as const,
        category: domain,
        timestamp: new Date(),
        domain,
        confidence: 75,
        timeframe: 'this_week',
        relatedDomains: []
      }
    }
  }

  async processQuery(question: string, context: any, personality: AIPersonality): Promise<AIResponse> {
    const systemInstruction = `You are ${personality.name}, an advanced AI life optimization assistant powered by Gemini 2.0 Flash. 
    Your expertise includes: ${personality.expertise.join(', ')}.
    Communication style: ${personality.communicationStyle}
    Adaptiveness level: ${Math.round(personality.adaptiveness * 100)}%
    
    You are part of GalyarderOS, a comprehensive life optimization platform. Always provide helpful, actionable responses that align with life optimization and personal growth principles.
    Be conversational but insightful, and tailor your response to the user's context and needs.
    
    Focus on practical advice that users can implement immediately. When discussing goals, habits, or life improvements, be specific and measurable.`

    const prompt = `
    User Question: ${question}
    
    Context: ${context ? JSON.stringify(context, null, 2) : 'No additional context provided'}
    
    Provide a comprehensive, helpful response that:
    1. Directly addresses the user's question
    2. Offers actionable insights or recommendations
    3. Connects to broader life optimization principles when relevant
    4. Suggests next steps or follow-up actions
    5. Is practical and immediately implementable
    
    Keep the tone ${personality.communicationStyle} and focus on practical value.
    If the question is about life optimization, provide specific strategies and techniques.
    `

    try {
      const response = await this.callGemini(prompt, systemInstruction)
      
      // Extract potential suggestions from the response
      const suggestions = this.extractSuggestions(response)
      
      return {
        id: Date.now().toString(),
        message: response,
        timestamp: new Date(),
        context: context || {},
        suggestions,
        confidence: 90,
        followUpQuestions: this.generateFollowUpQuestions(question, response)
      }
    } catch (error) {
      console.error('Failed to process query:', error)
      return {
        id: Date.now().toString(),
        message: "I'm experiencing some technical difficulties right now. Could you try rephrasing your question? I'm here to help you optimize your life and achieve your goals.",
        timestamp: new Date(),
        context: context || {},
        suggestions: ['Try asking a more specific question', 'Check your internet connection', 'Refresh the page and try again'],
        confidence: 50,
        followUpQuestions: []
      }
    }
  }

  private extractSuggestions(response: string): string[] {
    // Simple extraction of actionable suggestions from response
    const suggestions: string[] = []
    const lines = response.split('\n')
    
    for (const line of lines) {
      if (line.includes('suggest') || line.includes('recommend') || line.includes('try') || line.includes('consider')) {
        const cleaned = line.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '').trim()
        if (cleaned.length > 10 && cleaned.length < 100) {
          suggestions.push(cleaned)
        }
      }
    }
    
    return suggestions.slice(0, 3) // Return top 3 suggestions
  }

  private generateFollowUpQuestions(originalQuestion: string, response: string): string[] {
    // Generate contextual follow-up questions
    const followUps = [
      "How can I track my progress on this?",
      "What are the potential obstacles I should prepare for?",
      "Can you help me create a specific action plan?",
      "How does this connect to my other life goals?"
    ]
    
    return followUps.slice(0, 2) // Return 2 follow-up questions
  }

  async generateGoalRecommendations(userContext: any): Promise<any[]> {
    const systemInstruction = `You are an expert life coach specializing in goal setting and achievement. 
    Generate personalized goal recommendations based on user context and life optimization principles.`

    const prompt = `
    Based on the following user context, generate 3-5 personalized goal recommendations:
    
    User Context: ${JSON.stringify(userContext, null, 2)}
    
    For each goal, provide:
    - title: Clear, specific goal title
    - description: Detailed description of the goal
    - category: Life domain (Business, Health, Learning, Financial, Personal)
    - priority: high, medium, or low
    - timeframe: Target completion timeframe
    - milestones: 3-4 key milestones to track progress
    - reasoning: Why this goal is recommended for this user
    
    Return as JSON array.
    `

    try {
      const response = await this.callGemini(prompt, systemInstruction)
      return JSON.parse(response.replace(/```json\n?|\n?```/g, ''))
    } catch (error) {
      console.error('Failed to generate goal recommendations:', error)
      return []
    }
  }

  async generateHabitSuggestions(userGoals: any[]): Promise<any[]> {
    const systemInstruction = `You are a behavioral psychology expert specializing in habit formation. 
    Generate habit suggestions that support the user's goals and promote life optimization.`

    const prompt = `
    Based on these user goals, suggest 5-7 daily/weekly habits that would support achievement:
    
    Goals: ${JSON.stringify(userGoals, null, 2)}
    
    For each habit, provide:
    - name: Clear habit name
    - description: What the habit involves
    - frequency: daily, weekly, or custom
    - category: Health, Productivity, Learning, Mindfulness, etc.
    - difficulty: easy, medium, hard
    - impact: Expected impact on goals (high, medium, low)
    - startingTips: 2-3 tips for getting started
    
    Return as JSON array.
    `

    try {
      const response = await this.callGemini(prompt, systemInstruction)
      return JSON.parse(response.replace(/```json\n?|\n?```/g, ''))
    } catch (error) {
      console.error('Failed to generate habit suggestions:', error)
      return []
    }
  }
}

export const geminiService = new GeminiService()