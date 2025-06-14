// Base API Service with common functionality

import { supabase } from '@/lib/supabase'
import type { APIResponse, PaginatedResponse } from '@/types/backend'

export class BaseAPIService {
  protected tableName: string

  constructor(tableName: string) {
    this.tableName = tableName
  }

  protected async handleRequest<T>(
    operation: () => Promise<any>
  ): Promise<APIResponse<T>> {
    try {
      const result = await operation()
      
      if (result.error) {
        return {
          success: false,
          error: result.error.message,
          timestamp: new Date().toISOString()
        }
      }

      return {
        success: true,
        data: result.data,
        timestamp: new Date().toISOString()
      }
    } catch (error: any) {
      console.error(`API Error in ${this.tableName}:`, error)
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
        timestamp: new Date().toISOString()
      }
    }
  }

  protected async handlePaginatedRequest<T>(
    operation: () => Promise<any>,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<T>> {
    try {
      const from = (page - 1) * limit
      const to = from + limit - 1

      const [dataResult, countResult] = await Promise.all([
        operation(),
        supabase.from(this.tableName).select('*', { count: 'exact', head: true })
      ])

      if (dataResult.error) {
        return {
          success: false,
          error: dataResult.error.message,
          timestamp: new Date().toISOString(),
          pagination: { page, limit, total: 0, totalPages: 0 }
        }
      }

      const total = countResult.count || 0
      const totalPages = Math.ceil(total / limit)

      return {
        success: true,
        data: dataResult.data,
        timestamp: new Date().toISOString(),
        pagination: { page, limit, total, totalPages }
      }
    } catch (error: any) {
      console.error(`Paginated API Error in ${this.tableName}:`, error)
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
        pagination: { page, limit, total: 0, totalPages: 0 }
      }
    }
  }

  protected getCurrentUserId(): string {
    const user = supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }
    return user.data.user?.id || ''
  }

  protected validateRequired(data: any, requiredFields: string[]): void {
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`${field} is required`)
      }
    }
  }

  protected sanitizeInput(input: string): string {
    return input.trim().replace(/[<>]/g, '')
  }

  protected validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  protected validateUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }
}

export class AuthenticatedAPIService extends BaseAPIService {
  protected async ensureAuthenticated(): Promise<string> {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      throw new Error('Authentication required')
    }
    
    return user.id
  }

  protected async checkPermission(resourceId: string, userId?: string): Promise<boolean> {
    const currentUserId = userId || await this.ensureAuthenticated()
    
    const { data, error } = await supabase
      .from(this.tableName)
      .select('user_id')
      .eq('id', resourceId)
      .single()

    if (error || !data) {
      return false
    }

    return data.user_id === currentUserId
  }
}