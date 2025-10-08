// ==============================================
// lib/ai/api-caller.ts - Call Your Existing APIs
// ==============================================

import { getAPIEndpoint, canAccessAPI } from './api-registry'
import type { APIEndpoint } from './api-registry'
import type { FunctionCallResult } from '@/types/ai'

// ==============================================
// API CALLER CLASS
// ==============================================
export class APICaller {
  private baseUrl: string
  private userId: string
  private companyId: string
  private userRole: string
  private userName: string

  constructor(
    userId: string,
    companyId: string,
    userRole: string,
    userName: string
  ) {
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    this.userId = userId
    this.companyId = companyId
    this.userRole = userRole
    this.userName = userName
  }

  // ==============================================
  // MAIN CALL METHOD
  // ==============================================
  async call(functionName: string, args: any): Promise<FunctionCallResult> {
    console.log(`[APICaller] Calling: ${functionName}`, args)

    try {
      // Get API definition
      const api = getAPIEndpoint(functionName)
      
      if (!api) {
        return {
          success: false,
          error: `Unknown API: ${functionName}`
        }
      }

      // Check permissions
      if (!canAccessAPI(api, this.userRole)) {
        return {
          success: false,
          error: `Access denied. This information is only available to administrators.`
        }
      }

      // Build URL with query parameters
      const url = this.buildURL(api, args)

      // Make request
      const response = await fetch(url, {
        method: api.method,
        headers: {
          'Content-Type': 'application/json',
          // Pass authentication headers (your APIs already check these)
          'x-user-id': this.userId,
          'x-company-id': this.companyId,
          'x-user-role': this.userRole,
          'x-user-name': this.userName,
        },
        // Add body for POST/PUT requests if needed
        body: api.method !== 'GET' && args.body ? JSON.stringify(args.body) : undefined,
      })

      // Parse response
      const data = await response.json()

      if (!response.ok) {
        console.error(`[APICaller] Error from ${functionName}:`, data)
        return {
          success: false,
          error: data.message || data.error || `API request failed with status ${response.status}`
        }
      }

      console.log(`[APICaller] Success: ${functionName}`, {
        hasData: !!data.data,
        dataKeys: data.data ? Object.keys(data.data) : []
      })

      return {
        success: true,
        data: data.data || data // Some APIs return data directly, others wrap in { data: ... }
      }

    } catch (error) {
      console.error(`[APICaller] Exception in ${functionName}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'API call failed'
      }
    }
  }

  // ==============================================
  // BUILD URL WITH QUERY PARAMS
  // ==============================================
  private buildURL(api: APIEndpoint, args: any): string {
    const url = new URL(api.path, this.baseUrl)

    // Add query parameters
    if (api.method === 'GET' && args) {
      Object.entries(args).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, String(value))
        }
      })
    }

    return url.toString()
  }

  // ==============================================
  // FORMAT RESULT FOR AI
  // ==============================================
  static formatResultForAI(result: FunctionCallResult): string {
    if (!result.success) {
      return `Error: ${result.error}`
    }

    // Convert data to readable text for AI
    try {
      const data = result.data

      // Handle empty results
      if (!data || (Array.isArray(data) && data.length === 0)) {
        return 'No results found.'
      }

      // Format different types of data
      if (Array.isArray(data)) {
        return `Found ${data.length} results:\n${JSON.stringify(data, null, 2)}`
      }

      if (typeof data === 'object') {
        return JSON.stringify(data, null, 2)
      }

      return String(data)
    } catch (error) {
      return 'Data retrieved successfully but could not be formatted.'
    }
  }
}