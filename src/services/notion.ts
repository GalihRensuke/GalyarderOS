const NOTION_TOKEN = import.meta.env.VITE_NOTION_TOKEN
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const NOTION_PROXY_URL = `${SUPABASE_URL}/functions/v1/notion-proxy`

interface NotionPage {
  id: string
  title: string
  content: any[]
  properties: Record<string, any>
  created_time: string
  last_edited_time: string
}

interface NotionDatabase {
  id: string
  title: string
  properties: Record<string, any>
  entries: NotionPage[]
}

interface NotionComment {
  id: string
  rich_text: any[]
  created_time: string
  created_by: any
  discussion_id: string
}

class NotionService {
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!NOTION_TOKEN) {
      throw new Error('Notion token is not configured. Please add VITE_NOTION_TOKEN to your .env file.')
    }

    if (!SUPABASE_URL) {
      throw new Error('Supabase URL is not configured. Please add VITE_SUPABASE_URL to your .env file.')
    }

    try {
      // Use the edge function proxy instead of direct API calls
      const proxyUrl = `${NOTION_PROXY_URL}?endpoint=${encodeURIComponent(endpoint)}`
      
      const response = await fetch(proxyUrl, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Notion API error:', errorText)
        throw new Error(`Notion API error: ${response.status} - ${errorText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Notion API request failed:', error)
      throw error
    }
  }

  // Content Capabilities
  async readContent(pageId: string): Promise<NotionPage> {
    const page = await this.makeRequest(`/pages/${pageId}`)
    const blocks = await this.makeRequest(`/blocks/${pageId}/children`)
    
    return {
      id: page.id,
      title: this.extractTitle(page.properties),
      content: blocks.results,
      properties: page.properties,
      created_time: page.created_time,
      last_edited_time: page.last_edited_time
    }
  }

  async updateContent(pageId: string, updates: any): Promise<NotionPage> {
    const updatedPage = await this.makeRequest(`/pages/${pageId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    })

    return {
      id: updatedPage.id,
      title: this.extractTitle(updatedPage.properties),
      content: [],
      properties: updatedPage.properties,
      created_time: updatedPage.created_time,
      last_edited_time: updatedPage.last_edited_time
    }
  }

  async insertContent(parentId: string, content: any): Promise<NotionPage> {
    const newPage = await this.makeRequest('/pages', {
      method: 'POST',
      body: JSON.stringify({
        parent: { page_id: parentId },
        properties: content.properties,
        children: content.children || []
      })
    })

    return {
      id: newPage.id,
      title: this.extractTitle(newPage.properties),
      content: content.children || [],
      properties: newPage.properties,
      created_time: newPage.created_time,
      last_edited_time: newPage.last_edited_time
    }
  }

  // Comment Capabilities
  async readComments(pageId: string): Promise<NotionComment[]> {
    const comments = await this.makeRequest(`/comments?block_id=${pageId}`)
    return comments.results.map((comment: any) => ({
      id: comment.id,
      rich_text: comment.rich_text,
      created_time: comment.created_time,
      created_by: comment.created_by,
      discussion_id: comment.discussion_id
    }))
  }

  async insertComment(pageId: string, comment: string): Promise<NotionComment> {
    const newComment = await this.makeRequest('/comments', {
      method: 'POST',
      body: JSON.stringify({
        parent: { page_id: pageId },
        rich_text: [
          {
            text: {
              content: comment
            }
          }
        ]
      })
    })

    return {
      id: newComment.id,
      rich_text: newComment.rich_text,
      created_time: newComment.created_time,
      created_by: newComment.created_by,
      discussion_id: newComment.discussion_id
    }
  }

  // Database Operations
  async queryDatabase(databaseId: string, filter?: any, sorts?: any): Promise<NotionPage[]> {
    const query: any = {}
    if (filter) query.filter = filter
    if (sorts) query.sorts = sorts

    const response = await this.makeRequest(`/databases/${databaseId}/query`, {
      method: 'POST',
      body: JSON.stringify(query)
    })

    return response.results.map((page: any) => ({
      id: page.id,
      title: this.extractTitle(page.properties),
      content: [],
      properties: page.properties,
      created_time: page.created_time,
      last_edited_time: page.last_edited_time
    }))
  }

  async createDatabaseEntry(databaseId: string, properties: any): Promise<NotionPage> {
    const newEntry = await this.makeRequest('/pages', {
      method: 'POST',
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties
      })
    })

    return {
      id: newEntry.id,
      title: this.extractTitle(newEntry.properties),
      content: [],
      properties: newEntry.properties,
      created_time: newEntry.created_time,
      last_edited_time: newEntry.last_edited_time
    }
  }

  // Life Optimization Specific Methods
  async createGoalEntry(databaseId: string, goal: any): Promise<NotionPage> {
    const properties = {
      Name: {
        title: [
          {
            text: {
              content: goal.title
            }
          }
        ]
      },
      Status: {
        select: {
          name: goal.status || 'Not Started'
        }
      },
      Priority: {
        select: {
          name: goal.priority || 'Medium'
        }
      },
      Progress: {
        number: goal.progress || 0
      },
      Deadline: goal.deadline ? {
        date: {
          start: goal.deadline
        }
      } : undefined,
      Category: {
        multi_select: [
          {
            name: goal.category || 'Personal'
          }
        ]
      },
      Description: {
        rich_text: [
          {
            text: {
              content: goal.description || ''
            }
          }
        ]
      }
    }

    return this.createDatabaseEntry(databaseId, properties)
  }

  async createHabitEntry(databaseId: string, habit: any): Promise<NotionPage> {
    const properties = {
      Name: {
        title: [
          {
            text: {
              content: habit.name
            }
          }
        ]
      },
      Frequency: {
        select: {
          name: habit.frequency || 'Daily'
        }
      },
      Category: {
        select: {
          name: habit.category || 'Health'
        }
      },
      Current_Streak: {
        number: habit.currentStreak || 0
      },
      Longest_Streak: {
        number: habit.longestStreak || 0
      },
      Is_Active: {
        checkbox: habit.isActive !== false
      },
      Description: {
        rich_text: [
          {
            text: {
              content: habit.description || ''
            }
          }
        ]
      }
    }

    return this.createDatabaseEntry(databaseId, properties)
  }

  async createInsightEntry(databaseId: string, insight: any): Promise<NotionPage> {
    const properties = {
      Title: {
        title: [
          {
            text: {
              content: insight.title
            }
          }
        ]
      },
      Priority: {
        select: {
          name: insight.priority || 'Medium'
        }
      },
      Domain: {
        select: {
          name: insight.domain || 'General'
        }
      },
      Category: {
        select: {
          name: insight.category || 'General'
        }
      },
      Confidence: {
        number: insight.confidence || 85
      },
      Timeframe: {
        select: {
          name: insight.timeframe || 'This Week'
        }
      },
      Message: {
        rich_text: [
          {
            text: {
              content: insight.message
            }
          }
        ]
      },
      Action_Items: {
        rich_text: [
          {
            text: {
              content: insight.actionItems?.join('\n• ') || ''
            }
          }
        ]
      }
    }

    return this.createDatabaseEntry(databaseId, properties)
  }

  async createReflectionEntry(databaseId: string, reflection: any): Promise<NotionPage> {
    const properties = {
      Date: {
        date: {
          start: reflection.date || new Date().toISOString().split('T')[0]
        }
      },
      Type: {
        select: {
          name: reflection.type || 'Daily'
        }
      },
      Mood: {
        number: reflection.mood || 5
      },
      Energy: {
        number: reflection.energy || 5
      },
      Productivity: {
        number: reflection.productivity || 5
      },
      Wins: {
        rich_text: [
          {
            text: {
              content: reflection.wins || ''
            }
          }
        ]
      },
      Challenges: {
        rich_text: [
          {
            text: {
              content: reflection.challenges || ''
            }
          }
        ]
      },
      Lessons: {
        rich_text: [
          {
            text: {
              content: reflection.lessons || ''
            }
          }
        ]
      },
      Tomorrow_Focus: {
        rich_text: [
          {
            text: {
              content: reflection.tomorrowFocus || ''
            }
          }
        ]
      }
    }

    return this.createDatabaseEntry(databaseId, properties)
  }

  // User Information Methods
  async getUserInfo(): Promise<any> {
    return this.makeRequest('/users/me')
  }

  async getWorkspaceUsers(): Promise<any[]> {
    const response = await this.makeRequest('/users')
    return response.results
  }

  // Search functionality
  async searchContent(query: string, filter?: any): Promise<NotionPage[]> {
    const searchBody: any = {
      query,
      page_size: 50
    }

    if (filter) {
      searchBody.filter = filter
    }

    const response = await this.makeRequest('/search', {
      method: 'POST',
      body: JSON.stringify(searchBody)
    })

    return response.results
      .filter((item: any) => item.object === 'page')
      .map((page: any) => ({
        id: page.id,
        title: this.extractTitle(page.properties),
        content: [],
        properties: page.properties,
        created_time: page.created_time,
        last_edited_time: page.last_edited_time
      }))
  }

  // Utility methods
  private extractTitle(properties: any): string {
    for (const [key, value] of Object.entries(properties)) {
      if ((value as any).type === 'title' && (value as any).title?.length > 0) {
        return (value as any).title[0].text.content
      }
    }
    return 'Untitled'
  }

  // Sync methods for life optimization data
  async syncGoalsToNotion(goals: any[], databaseId: string): Promise<void> {
    for (const goal of goals) {
      try {
        await this.createGoalEntry(databaseId, goal)
      } catch (error) {
        console.error(`Failed to sync goal ${goal.title}:`, error)
      }
    }
  }

  async syncInsightsToNotion(insights: any[], databaseId: string): Promise<void> {
    for (const insight of insights) {
      try {
        await this.createInsightEntry(databaseId, insight)
      } catch (error) {
        console.error(`Failed to sync insight ${insight.title}:`, error)
      }
    }
  }

  async syncHabitsToNotion(habits: any[], databaseId: string): Promise<void> {
    for (const habit of habits) {
      try {
        await this.createHabitEntry(databaseId, habit)
      } catch (error) {
        console.error(`Failed to sync habit ${habit.name}:`, error)
      }
    }
  }
}

export const notionService = new NotionService()