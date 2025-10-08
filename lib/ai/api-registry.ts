// ==============================================
// lib/ai/api-registry.ts - Registry of Available APIs
// ==============================================

export interface APIEndpoint {
  name: string
  description: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  requiredRole?: 'admin' | 'member' // If not specified, available to all
  parameters?: {
    query?: Record<string, {
      type: string
      description: string
      required?: boolean
      enum?: string[]
    }>
    body?: Record<string, {
      type: string
      description: string
      required?: boolean
    }>
  }
}

// ==============================================
// AVAILABLE API ENDPOINTS FOR AI
// ==============================================
export const API_REGISTRY: APIEndpoint[] = [
  // ==============================================
  // PROJECTS APIs
  // ==============================================
  {
    name: 'get_projects',
    description: 'Get list of all company projects. Use this when user asks about projects, active projects, or project status.',
    method: 'GET',
    path: '/api/projects',
    requiredRole: 'admin', // Only admins can see all projects
    parameters: {
      query: {
        status: {
          type: 'string',
          description: 'Filter by project status',
          enum: ['not_started', 'in_progress', 'on_track', 'ahead_of_schedule', 'behind_schedule', 'on_hold', 'completed', 'cancelled']
        },
        priority: {
          type: 'string',
          description: 'Filter by priority',
          enum: ['low', 'medium', 'high', 'urgent']
        },
        search: {
          type: 'string',
          description: 'Search projects by name or project number'
        },
        sortBy: {
          type: 'string',
          description: 'Sort field',
          enum: ['name', 'status', 'startDate', 'budget', 'progress']
        },
        sortOrder: {
          type: 'string',
          description: 'Sort order',
          enum: ['asc', 'desc']
        },
        limit: {
          type: 'number',
          description: 'Max results (default: 20)'
        }
      }
    }
  },

  {
    name: 'get_project_stats',
    description: 'Get statistics about projects (total count, active count, completion rates). Use when user asks about project overview or summary.',
    method: 'GET',
    path: '/api/projects/stats',
    requiredRole: 'admin'
  },

  {
    name: 'get_my_projects',
    description: 'Get projects assigned to the current user. Use this for non-admin users asking about "my projects".',
    method: 'GET',
    path: '/api/member/projects',
    // Available to all users
  },

  // ==============================================
  // TEAM MEMBERS APIs
  // ==============================================
  {
    name: 'get_team_members',
    description: 'Get list of all team members in the company. Use when user asks about team, employees, staff, or workers.',
    method: 'GET',
    path: '/api/team-members',
    requiredRole: 'admin',
    parameters: {
      query: {
        role: {
          type: 'string',
          description: 'Filter by role',
          enum: ['super_admin', 'administrator', 'supervisor', 'member']
        },
        trade: {
          type: 'string',
          description: 'Filter by trade specialty'
        },
        search: {
          type: 'string',
          description: 'Search by name or email'
        },
        isActive: {
          type: 'boolean',
          description: 'Filter by active status'
        },
        limit: {
          type: 'number',
          description: 'Max results (default: 50)'
        }
      }
    }
  },

  {
    name: 'get_team_stats',
    description: 'Get team statistics (total members, roles distribution). Use when asking about team overview.',
    method: 'GET',
    path: '/api/team-members/stats',
    requiredRole: 'admin'
  },

  // ==============================================
  // TIME ENTRIES APIs
  // ==============================================
  {
    name: 'get_time_entries',
    description: 'Get time entries (timesheets, hours worked). Use when user asks about hours, timesheets, or time tracking. Admins see all entries, members see only their own.',
    method: 'GET',
    path: '/api/time-entries',
    parameters: {
      query: {
        userId: {
          type: 'string',
          description: 'Filter by user ID (admin only)'
        },
        projectId: {
          type: 'string',
          description: 'Filter by project ID'
        },
        status: {
          type: 'string',
          description: 'Filter by status',
          enum: ['pending', 'approved', 'rejected', 'draft', 'clocked_in', 'clocked_out']
        },
        dateFrom: {
          type: 'string',
          description: 'Start date (YYYY-MM-DD)'
        },
        dateTo: {
          type: 'string',
          description: 'End date (YYYY-MM-DD)'
        },
        limit: {
          type: 'number',
          description: 'Max results (default: 50)'
        }
      }
    }
  },

  // ==============================================
  // PAYROLL APIs
  // ==============================================
  {
    name: 'get_payroll_reports',
    description: 'Get payroll reports including hours and costs. Use when user asks about payroll, costs, wages, or expenses.',
    method: 'GET',
    path: '/api/reports/payroll',
    requiredRole: 'admin',
    parameters: {
      query: {
        dateFrom: {
          type: 'string',
          description: 'Start date (YYYY-MM-DD)'
        },
        dateTo: {
          type: 'string',
          description: 'End date (YYYY-MM-DD)'
        },
        projectId: {
          type: 'string',
          description: 'Filter by project'
        },
        userId: {
          type: 'string',
          description: 'Filter by user'
        }
      }
    }
  },

  {
    name: 'get_payroll_stats',
    description: 'Get quick payroll statistics (total hours, total pay, pending approvals).',
    method: 'GET',
    path: '/api/reports/payroll/stats',
    requiredRole: 'admin',
    parameters: {
      query: {
        dateFrom: {
          type: 'string',
          description: 'Start date (YYYY-MM-DD)'
        },
        dateTo: {
          type: 'string',
          description: 'End date (YYYY-MM-DD)'
        }
      }
    }
  },

  // ==============================================
  // PUNCHLIST APIs
  // ==============================================
  {
    name: 'get_punchlist_items',
    description: 'Get punchlist items (defects, issues, tasks to fix). Use when user asks about punchlist, issues, defects, or quality items.',
    method: 'GET',
    path: '/api/punchlist-items',
    parameters: {
      query: {
        projectId: {
          type: 'string',
          description: 'Filter by project'
        },
        status: {
          type: 'string',
          description: 'Filter by status',
          enum: ['open', 'assigned', 'in_progress', 'pending_review', 'completed', 'rejected', 'on_hold']
        },
        priority: {
          type: 'string',
          description: 'Filter by priority',
          enum: ['low', 'medium', 'high', 'critical']
        },
        limit: {
          type: 'number',
          description: 'Max results (default: 20)'
        }
      }
    }
  },

  // ==============================================
  // SCHEDULE APIs
  // ==============================================
  {
    name: 'get_schedule_projects',
    description: 'Get scheduled projects and tasks. Use when user asks about schedule, timeline, or upcoming work.',
    method: 'GET',
    path: '/api/schedule-projects',
    parameters: {
      query: {
        projectId: {
          type: 'string',
          description: 'Filter by main project'
        },
        status: {
          type: 'string',
          description: 'Filter by status',
          enum: ['planned', 'in_progress', 'completed', 'cancelled', 'delayed']
        },
        startDateFrom: {
          type: 'string',
          description: 'Filter schedules starting from this date (YYYY-MM-DD)'
        },
        startDateTo: {
          type: 'string',
          description: 'Filter schedules starting before this date (YYYY-MM-DD)'
        }
      }
    }
  },
]

// ==============================================
// HELPER FUNCTIONS
// ==============================================

/**
 * Get API endpoint by name
 */
export function getAPIEndpoint(name: string): APIEndpoint | undefined {
  return API_REGISTRY.find(api => api.name === name)
}

/**
 * Get all APIs available to user based on role
 */
export function getAvailableAPIs(userRole: string): APIEndpoint[] {
  const isAdmin = userRole === 'super_admin' || userRole === 'admin'  // ✅ FIXED
  
  return API_REGISTRY.filter(api => {
    if (!api.requiredRole) return true // Available to all
    if (api.requiredRole === 'admin') return isAdmin
    return true
  })
}

/**
 * Check if user can access this API
 */
export function canAccessAPI(api: APIEndpoint, userRole: string): boolean {
  const isAdmin = userRole === 'super_admin' || userRole === 'admin'  // ✅ FIXED
  
  if (!api.requiredRole) return true
  if (api.requiredRole === 'admin') return isAdmin
  
  return false
}

/**
 * Convert API registry to OpenAI function format
 */
export function convertToOpenAIFunctions(userRole: string) {
  const availableAPIs = getAvailableAPIs(userRole)
  
  return availableAPIs.map(api => {
    const properties = api.parameters?.query || {}
    const requiredFields = Object.entries(properties)
      .filter(([_, param]) => param.required === true)
      .map(([key]) => key)
    
    const parameters: any = {
      type: 'object',
      properties: properties,
    }
    
    // Only add required field if there are required parameters
    if (requiredFields.length > 0) {
      parameters.required = requiredFields
    }
    
    return {
      name: api.name,
      description: api.description,
      parameters
    }
  })
}