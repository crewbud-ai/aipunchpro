// ==============================================
// lib/ai/intelligent-api-caller.ts - Type 4 AI: Intelligent API Discovery
// ==============================================

import { API_SCHEMA, type APIRoute, getAllAPIEndpoints } from './api-schema'
import type { FunctionCallResult } from '@/types/ai'

// ==============================================
// INTELLIGENT API CALLER
// ==============================================
export class IntelligentAPICaller {
  private baseUrl: string
  private userId: string
  private companyId: string
  private userRole: string
  private userName: string
  private sessionToken: string
  private callHistory: Array<{ endpoint: string; result: any }> = []

  constructor(
    userId: string,
    companyId: string,
    userRole: string,
    userName: string,
    sessionToken: string
  ) {
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    this.userId = userId
    this.companyId = companyId
    this.userRole = userRole
    this.userName = userName
    this.sessionToken = sessionToken
  }

  // ==============================================
  // MAIN: CALL ANY API DYNAMICALLY
  // ==============================================
  async callAPI(params: {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    path: string
    queryParams?: Record<string, any>
    pathParams?: Record<string, string>
    body?: any
    reason?: string
  }): Promise<FunctionCallResult> {
    const { method, path, queryParams, pathParams, body, reason } = params

    console.log(`[IntelligentAPI] ${reason || 'Calling API'}`)
    console.log(`[IntelligentAPI] ${method} ${path}`, { queryParams, pathParams })

    try {
      // Build the full URL
      let fullPath = path

      // Replace path parameters (e.g., /api/projects/{id})
      if (pathParams) {
        Object.entries(pathParams).forEach(([key, value]) => {
          fullPath = fullPath.replace(`{${key}}`, value)
        })
      }

      const url = new URL(fullPath, this.baseUrl)

      // Add query parameters
      if (queryParams && method === 'GET') {
        Object.entries(queryParams).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            url.searchParams.append(key, String(value))
          }
        })
      }

      // Make the request
      const response = await fetch(url.toString(), {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `sessionToken=${this.sessionToken}`,
          'x-user-id': this.userId,
          'x-company-id': this.companyId,
          'x-user-role': this.userRole,
          'x-user-name': this.userName,
        },
        body: body && method !== 'GET' ? JSON.stringify(body) : undefined,
      })

      const data = await response.json()

      if (!response.ok) {
        console.error(`[IntelligentAPI] Error:`, data)
        return {
          success: false,
          error: data.message || data.error || `API failed with status ${response.status}`
        }
      }

      console.log(`[IntelligentAPI] Success:`, {
        hasData: !!data.data,
        dataType: Array.isArray(data.data) ? 'array' : typeof data.data
      })

      // Store in history for context
      this.callHistory.push({
        endpoint: `${method} ${path}`,
        result: data
      })

      return {
        success: true,
        data: data.data || data
      }

    } catch (error) {
      console.error(`[IntelligentAPI] Exception:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'API call failed'
      }
    }
  }

  // ==============================================
  // HELPER: Find relevant endpoints for a query
  // ==============================================
  findRelevantEndpoints(userQuery: string): APIRoute[] {
    const allEndpoints = getAllAPIEndpoints()
    const query = userQuery.toLowerCase()
    const isAdmin = ['super_admin', 'admin'].includes(this.userRole)

    return allEndpoints.filter(endpoint => {
      // Check permissions
      if (endpoint.requiredRole && !isAdmin) {
        return false
      }

      // Match against description and path
      const description = endpoint.description.toLowerCase()
      const path = endpoint.path.toLowerCase()

      // Extract keywords from query
      const keywords = query.split(' ').filter(w => w.length > 3)

      // Check if endpoint is relevant
      return keywords.some(keyword =>
        description.includes(keyword) ||
        path.includes(keyword)
      )
    })
  }

  // ==============================================
  // HELPER: Suggest next API calls based on previous results
  // ==============================================
  suggestNextSteps(currentResult: any): string[] {
    const suggestions: string[] = []

    // If we got a project, suggest getting its members
    if (currentResult?.data?.projects || currentResult?.data?.project) {
      suggestions.push('Get team members for this project')
      suggestions.push('Get schedule projects for this project')
      suggestions.push('Get time entries for this project')
    }

    // If we got project ID, suggest related data
    if (currentResult?.data?.project?.id) {
      const projectId = currentResult.data.project.id
      suggestions.push(`Get members: GET /api/projects/${projectId}/members`)
      suggestions.push(`Get files: GET /api/projects/${projectId}/files`)
    }

    return suggestions
  }

  // ==============================================
  // HELPER: Extract IDs from previous calls
  // ==============================================
  extractIDsFromHistory(): Record<string, string[]> {
    const ids: Record<string, string[]> = {
      projectIds: [],
      userIds: [],
      scheduleProjectIds: []
    }

    this.callHistory.forEach(call => {
      const result = call.result

      // Extract project IDs
      if (result?.data?.projects) {
        result.data.projects.forEach((p: any) => {
          if (p.id) ids.projectIds.push(p.id)
        })
      }
      if (result?.data?.project?.id) {
        ids.projectIds.push(result.data.project.id)
      }

      // Extract user IDs
      if (result?.data?.members) {
        result.data.members.forEach((m: any) => {
          if (m.id) ids.userIds.push(m.id)
        })
      }
    })

    return ids
  }

  // ==============================================
  // HELPER: Get call history for AI context
  // ==============================================
  getCallHistory(): string {
    if (this.callHistory.length === 0) {
      return 'No previous API calls in this conversation.'
    }

    let history = '## Previous API Calls:\n\n'
    this.callHistory.forEach((call, index) => {
      history += `${index + 1}. ${call.endpoint}\n`
      history += `   Result: ${JSON.stringify(call.result).substring(0, 200)}...\n\n`
    })

    return history
  }

  // ==============================================
  // HELPER: Clear history (for new conversation)
  // ==============================================
  clearHistory() {
    this.callHistory = []
  }

  // ==============================================
  // STATIC: Format result for AI
  // ==============================================
  static formatResultForAI(result: FunctionCallResult): string {
    if (!result.success) {
      return `❌ Error: ${result.error}`
    }

    try {
      const data = result.data

      if (!data || (Array.isArray(data) && data.length === 0)) {
        return '✅ Success, but no data found.'
      }

      // Format arrays nicely
      if (Array.isArray(data)) {
        if (data.length <= 5) {
          // Show all items if 5 or less
          return `✅ Found ${data.length} result(s):\n${JSON.stringify(data, null, 2)}`
        } else {
          // Show summary for large arrays
          return `✅ Found ${data.length} results. First 3:\n${JSON.stringify(data.slice(0, 3), null, 2)}\n... and ${data.length - 3} more`
        }
      }

      // Format objects
      if (typeof data === 'object') {
        // Check if it's a summary/stats object
        if (data.summary || data.stats || data.total !== undefined) {
          return `✅ Summary:\n${JSON.stringify(data, null, 2)}`
        }

        return `✅ Result:\n${JSON.stringify(data, null, 2)}`
      }

      return `✅ Result: ${String(data)}`

    } catch (error) {
      return '✅ Data retrieved but could not be formatted.'
    }
  }
}

// ==============================================
// HELPER FUNCTIONS FOR AI PLANNING
// ==============================================

/**
 * Analyze a user query and suggest API calls
 */
export function planAPICallsForQuery(
  userQuery: string,
  userRole: string
): {
  steps: Array<{
    step: number
    action: string
    endpoint: APIRoute | null
    reason: string
  }>
  requiresMultipleSteps: boolean
} {
  const query = userQuery.toLowerCase()
  const isAdmin = ['super_admin', 'admin'].includes(userRole)

  const steps: Array<{
    step: number
    action: string
    endpoint: APIRoute | null
    reason: string
  }> = []

  // Pattern matching for common queries
  
  // Pattern: "team members under/for/on [project name]"
  if (query.includes('team member') && (query.includes('under') || query.includes('for') || query.includes('on'))) {
    steps.push({
      step: 1,
      action: 'Search for the project by name',
      endpoint: null,
      reason: 'Need to find project ID first'
    })
    steps.push({
      step: 2,
      action: 'Get team members for that project',
      endpoint: null,
      reason: 'Once we have project ID, get its members'
    })
  }

  // Pattern: "how much spent/cost"
  else if (query.includes('spent') || query.includes('cost') || query.includes('expense')) {
    if (isAdmin) {
      steps.push({
        step: 1,
        action: 'Get all projects',
        endpoint: null,
        reason: 'Need project data to calculate costs'
      })
      steps.push({
        step: 2,
        action: 'Get payroll/time entries',
        endpoint: null,
        reason: 'Need labor costs'
      })
      steps.push({
        step: 3,
        action: 'Calculate total spending',
        endpoint: null,
        reason: 'Aggregate all costs'
      })
    }
  }

  // Pattern: "active projects" or "list projects"
  else if (query.includes('project') && (query.includes('list') || query.includes('active') || query.includes('show'))) {
    steps.push({
      step: 1,
      action: 'Get projects with appropriate filters',
      endpoint: null,
      reason: 'Direct API call to get projects'
    })
  }

  return {
    steps,
    requiresMultipleSteps: steps.length > 1
  }
}