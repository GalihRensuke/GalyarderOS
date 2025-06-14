import React, { createContext, useContext, useState, useCallback } from 'react'
import { notionService } from '@/services/notion'
import type { NotionIntegration } from '@/types/ai'
import toast from 'react-hot-toast'

interface NotionContextType {
  integration: NotionIntegration
  isConnected: boolean
  isLoading: boolean
  connectToNotion: () => Promise<void>
  disconnectFromNotion: () => void
  syncData: (type: 'goals' | 'habits' | 'insights' | 'reflections', data: any[]) => Promise<void>
  searchContent: (query: string) => Promise<any[]>
  createContent: (type: string, data: any) => Promise<any>
  updateSyncSettings: (settings: Partial<NotionIntegration>) => void
  testConnection: () => Promise<boolean>
}

const defaultIntegration: NotionIntegration = {
  isConnected: false,
  databases: {},
  syncEnabled: false
}

const NotionContext = createContext<NotionContextType | undefined>(undefined)

export function NotionProvider({ children }: { children: React.ReactNode }) {
  const [integration, setIntegration] = useState<NotionIntegration>(defaultIntegration)
  const [isLoading, setIsLoading] = useState(false)

  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      return await notionService.testConnection()
    } catch (error) {
      console.error('Connection test failed:', error)
      return false
    }
  }, [])

  const connectToNotion = useCallback(async () => {
    setIsLoading(true)
    try {
      // Test connection by getting user info
      const userInfo = await notionService.getUserInfo()
      
      setIntegration(prev => ({
        ...prev,
        isConnected: true,
        workspaceId: userInfo.id,
        lastSync: new Date(),
        syncEnabled: true
      }))
      
      toast.success('Successfully connected to Notion!')
    } catch (error) {
      console.error('Failed to connect to Notion:', error)
      
      // More specific error messages
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('Invalid JWT')) {
          toast.error('Invalid Notion token. Please check your integration token in the .env file. Make sure you have set VITE_NOTION_TOKEN with a valid Notion integration token.')
        } else if (error.message.includes('not configured')) {
          toast.error('Notion token not configured. Please add VITE_NOTION_TOKEN to your .env file with your Notion integration token.')
        } else if (error.message.includes('403')) {
          toast.error('Access denied. Please ensure your Notion integration has the required permissions.')
        } else if (error.message.includes('CORS')) {
          toast.error('CORS error. The Notion API proxy may not be properly configured.')
        } else {
          toast.error(`Failed to connect to Notion: ${error.message}`)
        }
      } else {
        toast.error('Failed to connect to Notion. Please check your configuration and try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const disconnectFromNotion = useCallback(() => {
    setIntegration(defaultIntegration)
    toast.success('Disconnected from Notion')
  }, [])

  const syncData = useCallback(async (type: 'goals' | 'habits' | 'insights' | 'reflections', data: any[]) => {
    if (!integration.isConnected || !integration.databases[type]) {
      toast.error(`${type} database not configured`)
      return
    }

    setIsLoading(true)
    try {
      const databaseId = integration.databases[type]!
      
      switch (type) {
        case 'goals':
          await notionService.syncGoalsToNotion(data, databaseId)
          break
        case 'habits':
          await notionService.syncHabitsToNotion(data, databaseId)
          break
        case 'insights':
          await notionService.syncInsightsToNotion(data, databaseId)
          break
        case 'reflections':
          // Implement reflection sync
          break
      }
      
      setIntegration(prev => ({
        ...prev,
        lastSync: new Date()
      }))
      
      toast.success(`${type} synced to Notion successfully!`)
    } catch (error) {
      console.error(`Failed to sync ${type}:`, error)
      toast.error(`Failed to sync ${type} to Notion`)
    } finally {
      setIsLoading(false)
    }
  }, [integration])

  const searchContent = useCallback(async (query: string) => {
    if (!integration.isConnected) {
      throw new Error('Not connected to Notion')
    }

    try {
      return await notionService.searchContent(query)
    } catch (error) {
      console.error('Failed to search Notion content:', error)
      throw error
    }
  }, [integration.isConnected])

  const createContent = useCallback(async (type: string, data: any) => {
    if (!integration.isConnected) {
      throw new Error('Not connected to Notion')
    }

    try {
      const databaseId = integration.databases[type as keyof typeof integration.databases]
      
      switch (type) {
        case 'goals':
          return await notionService.createGoalEntry(databaseId!, data)
        case 'habits':
          return await notionService.createHabitEntry(databaseId!, data)
        case 'insights':
          return await notionService.createInsightEntry(databaseId!, data)
        case 'reflections':
          return await notionService.createReflectionEntry(databaseId!, data)
        case 'notes':
          return await notionService.createQuickNote(data.title, data.content, databaseId)
        default:
          if (databaseId) {
            return await notionService.createDatabaseEntry(databaseId, data)
          } else {
            return await notionService.createQuickNote(data.title || 'Quick Note', data.content || 'Created from GalyarderOS')
          }
      }
    } catch (error) {
      console.error(`Failed to create ${type}:`, error)
      throw error
    }
  }, [integration])

  const updateSyncSettings = useCallback((settings: Partial<NotionIntegration>) => {
    setIntegration(prev => ({ ...prev, ...settings }))
  }, [])

  const value = {
    integration,
    isConnected: integration.isConnected,
    isLoading,
    connectToNotion,
    disconnectFromNotion,
    syncData,
    searchContent,
    createContent,
    updateSyncSettings,
    testConnection
  }

  return (
    <NotionContext.Provider value={value}>
      {children}
    </NotionContext.Provider>
  )
}

export function useNotion() {
  const context = useContext(NotionContext)
  if (context === undefined) {
    throw new Error('useNotion must be used within a NotionProvider')
  }
  return context
}