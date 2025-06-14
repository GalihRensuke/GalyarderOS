import type { AIPersonality, LifeInsight, AIResponse } from '@/types/ai'

const GEMINI_API_KEY = 'AIzaSyAipb-sbS3B80VPLqe_YynUnaVaSX_VwHI'
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'

class GeminiService {
  private async callGemini(prompt: string): Promise<string> {
    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      })

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`)
      }

      const data = await response.json()
      return data.candidates[0]?.content?.parts[0]?.text || 'No response generated'
    } catch (error) {
      console.error('Gemini API call failed:', error)
      throw new Error('Failed to generate AI response')
    }
  }

  async generateLifeInsight(domain: string, data: any, personality: AIPersonality): Promise<LifeInsight> {
    const prompt = `
    As ${personality.name}, an AI life coach with expertise in ${personality.expertise.join(', ')}, 
    analyze the following ${domain} data and provide a personalized insight:

    Data: ${JSON.stringify(data, null, 2)}

    Communication Style: ${personality.communicationStyle}
    
    Provide a JSON response with:
    - title: A compelling insight title
    - message: Detailed analysis and recommendation (2-3 sentences)
    - actionItems: Array of 2-3 specific actionable steps
    - priority: high/medium/low
    - category: The life domain this relates to
    
    Focus on being ${personality.communicationStyle} and actionable.
    `

    try {
      const response = await this.callGemini(prompt)
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
      }
    } catch (error) {
      // Fallback insight if parsing fails
      return {
        id: Date.now().toString(),
        title: `${domain} Optimization Opportunity`,
        message: 'Based on your recent activity, there are opportunities to optimize your approach in this area.',
        actionItems: ['Review your current patterns', 'Set specific improvement goals', 'Track progress daily'],
        priority: 'medium' as const,
        category: domain,
        timestamp: new Date(),
        domain,
      }
    }
  }

  async processQuery(question: string, context: any, personality: AIPersonality): Promise<AIResponse> {
    const prompt = `
    As ${personality.name}, respond to this question in a ${personality.communicationStyle} manner:
    
    Question: ${question}
    Context: ${context ? JSON.stringify(context, null, 2) : 'No additional context'}
    
    Your expertise areas: ${personality.expertise.join(', ')}
    
    Provide a helpful, actionable response that aligns with life optimization and personal growth.
    Keep it conversational but insightful.
    `

    try {
      const response = await this.callGemini(prompt)
      
      return {
        id: Date.now().toString(),
        message: response,
        timestamp: new Date(),
        context: context || {},
        suggestions: [], // Could be enhanced to extract suggestions
      }
    } catch (error) {
      return {
        id: Date.now().toString(),
        message: "I'm having trouble processing that right now. Could you try rephrasing your question?",
        timestamp: new Date(),
        context: context || {},
        suggestions: [],
      }
    }
  }
}

export const geminiService = new GeminiService()