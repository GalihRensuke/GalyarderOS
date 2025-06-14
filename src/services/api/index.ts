// API Services Index - Export all API services

export { ritualEngineAPI } from './ritualEngine'
export { flowStateAPI } from './flowState'
export { knowledgeSynthesisAPI } from './knowledgeSynthesis'
export { reflectionIntelligenceAPI } from './reflectionIntelligence'
export { lifeAnalyticsAPI } from './lifeAnalytics'

// Re-export types
export type * from '@/types/backend'

// API Response helpers
export const handleAPIError = (error: any) => {
  console.error('API Error:', error)
  
  if (error.message?.includes('Authentication required')) {
    // Redirect to login or show auth modal
    return 'Please sign in to continue'
  }
  
  if (error.message?.includes('Access denied')) {
    return 'You do not have permission to perform this action'
  }
  
  if (error.message?.includes('Network')) {
    return 'Network error. Please check your connection and try again'
  }
  
  return error.message || 'An unexpected error occurred'
}

export const formatAPIResponse = <T>(response: any): T | null => {
  if (response?.success && response?.data) {
    return response.data
  }
  return null
}

// Common API utilities
export const createPaginationParams = (page: number = 1, limit: number = 20) => ({
  page: Math.max(1, page),
  limit: Math.min(100, Math.max(1, limit))
})

export const createDateRangeFilter = (days: number) => {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(endDate.getDate() - days)
  
  return {
    date_from: startDate.toISOString(),
    date_to: endDate.toISOString()
  }
}

export const validateRequiredFields = (data: any, requiredFields: string[]) => {
  const missingFields = requiredFields.filter(field => !data[field])
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
  }
}