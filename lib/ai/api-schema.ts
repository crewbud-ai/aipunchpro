// ==============================================
// lib/ai/api-schema.ts - Complete API Schema for AI
// ==============================================

/**
 * This file documents ALL available API endpoints in your system
 * The AI will use this to understand what's possible
 */

export interface APIRoute {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
  description: string
  requiresAuth: boolean
  requiredRole?: 'super_admin' | 'admin' | 'supervisor' | 'member' | null
  queryParams?: Record<string, {
    type: string
    description: string
    required?: boolean
    enum?: string[]
    example?: string
  }>
  pathParams?: Record<string, {
    type: string
    description: string
    example?: string
  }>
  responseExample?: any
}

// ==============================================
// COMPLETE API SCHEMA
// ==============================================
export const API_SCHEMA: Record<string, APIRoute[]> = {
  
  // ==============================================
  // PROJECTS APIs
  // ==============================================
  projects: [
    {
      method: 'GET',
      path: '/api/projects',
      description: 'Get all projects for the company. Returns list of projects with details.',
      requiresAuth: true,
      requiredRole: 'admin',
      queryParams: {
        status: {
          type: 'string',
          description: 'Filter by project status',
          enum: ['not_started', 'in_progress', 'on_track', 'ahead_of_schedule', 'behind_schedule', 'on_hold', 'completed', 'cancelled'],
          example: 'in_progress'
        },
        priority: {
          type: 'string',
          description: 'Filter by priority level',
          enum: ['low', 'medium', 'high', 'urgent'],
          example: 'high'
        },
        search: {
          type: 'string',
          description: 'Search by project name, number, or description',
          example: 'Test New Project'
        },
        location: {
          type: 'string',
          description: 'Filter by project location/address'
        },
        client: {
          type: 'string',
          description: 'Filter by client name'
        },
        sortBy: {
          type: 'string',
          description: 'Field to sort by',
          enum: ['name', 'status', 'startDate', 'budget', 'progress']
        },
        sortOrder: {
          type: 'string',
          description: 'Sort order',
          enum: ['asc', 'desc']
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 20)'
        },
        offset: {
          type: 'number',
          description: 'Number of records to skip for pagination'
        },
        memberView: {
          type: 'boolean',
          description: 'If true, only return projects assigned to current user'
        }
      },
      responseExample: {
        success: true,
        data: {
          projects: [
            {
              id: 'uuid',
              name: 'Test New Project',
              projectNumber: 'PRJ-001',
              status: 'in_progress',
              priority: 'high',
              budget: 50000,
              progress: 45
            }
          ],
          pagination: {
            total: 10,
            page: 1,
            limit: 20
          }
        }
      }
    },
    {
      method: 'GET',
      path: '/api/projects/{id}',
      description: 'Get detailed information about a specific project by ID',
      requiresAuth: true,
      pathParams: {
        id: {
          type: 'uuid',
          description: 'Project ID',
          example: '550e8400-e29b-41d4-a716-446655440000'
        }
      },
      responseExample: {
        success: true,
        data: {
          project: {
            id: 'uuid',
            name: 'Test New Project',
            description: 'Project details...',
            budget: 50000,
            actualCost: 35000,
            progress: 45,
            teamMembers: []
          }
        }
      }
    },
    {
      method: 'GET',
      path: '/api/projects/{id}/members',
      description: 'Get all team members assigned to a specific project',
      requiresAuth: true,
      requiredRole: 'admin',
      pathParams: {
        id: {
          type: 'uuid',
          description: 'Project ID'
        }
      },
      responseExample: {
        success: true,
        data: {
          members: [
            {
              id: 'uuid',
              firstName: 'John',
              lastName: 'Doe',
              role: 'member',
              tradeSpecialty: 'carpenter'
            }
          ]
        }
      }
    },
    {
      method: 'GET',
      path: '/api/projects/stats',
      description: 'Get aggregate statistics about all projects',
      requiresAuth: true,
      requiredRole: 'admin',
      responseExample: {
        success: true,
        data: {
          totalProjects: 25,
          activeProjects: 12,
          completedProjects: 10,
          totalBudget: 1250000,
          totalSpent: 890000
        }
      }
    },
  ],

  // ==============================================
  // TEAM MEMBERS APIs
  // ==============================================
  teamMembers: [
    {
      method: 'GET',
      path: '/api/team-members',
      description: 'Get all team members in the company',
      requiresAuth: true,
      requiredRole: 'admin',
      queryParams: {
        status: {
          type: 'string',
          description: 'Filter by employment status',
          enum: ['active', 'inactive', 'on_leave']
        },
        role: {
          type: 'string',
          description: 'Filter by role',
          enum: ['super_admin', 'admin', 'supervisor', 'member']
        },
        tradeSpecialty: {
          type: 'string',
          description: 'Filter by trade (e.g., carpenter, electrician, plumber)'
        },
        search: {
          type: 'string',
          description: 'Search by name, email, or phone'
        },
        sortBy: {
          type: 'string',
          description: 'Field to sort by',
          enum: ['name', 'role', 'hireDate', 'hourlyRate']
        }
      }
    },
    {
      method: 'GET',
      path: '/api/team-members/stats',
      description: 'Get team member statistics',
      requiresAuth: true,
      requiredRole: 'admin',
      responseExample: {
        success: true,
        data: {
          totalMembers: 45,
          activeMembers: 42,
          byRole: {
            admin: 3,
            supervisor: 8,
            member: 34
          }
        }
      }
    },
  ],

  // ==============================================
  // TIME ENTRIES APIs
  // ==============================================
  timeEntries: [
    {
      method: 'GET',
      path: '/api/time-entries',
      description: 'Get time entries (clock in/out records)',
      requiresAuth: true,
      queryParams: {
        userId: {
          type: 'uuid',
          description: 'Filter by specific user (admin only, or current user)'
        },
        projectId: {
          type: 'uuid',
          description: 'Filter by project'
        },
        scheduleProjectId: {
          type: 'uuid',
          description: 'Filter by schedule project'
        },
        status: {
          type: 'string',
          enum: ['clocked_in', 'clocked_out', 'pending', 'approved', 'rejected'],
          description: 'Filter by entry status'
        },
        dateFrom: {
          type: 'date',
          description: 'Start date (YYYY-MM-DD)',
          example: '2025-01-01'
        },
        dateTo: {
          type: 'date',
          description: 'End date (YYYY-MM-DD)',
          example: '2025-01-31'
        }
      }
    },
    {
      method: 'GET',
      path: '/api/time-entries/current-session',
      description: 'Get current active clock-in session for the user',
      requiresAuth: true
    },
  ],

  // ==============================================
  // PAYROLL / REPORTS APIs
  // ==============================================
  payroll: [
    {
      method: 'GET',
      path: '/api/reports/payroll',
      description: 'Get payroll report with labor costs and hours worked',
      requiresAuth: true,
      requiredRole: 'admin',
      queryParams: {
        startDate: {
          type: 'date',
          description: 'Report start date (YYYY-MM-DD)',
          required: true,
          example: '2025-01-01'
        },
        endDate: {
          type: 'date',
          description: 'Report end date (YYYY-MM-DD)',
          required: true,
          example: '2025-01-31'
        },
        projectId: {
          type: 'uuid',
          description: 'Filter by specific project'
        },
        userId: {
          type: 'uuid',
          description: 'Filter by specific user'
        },
        status: {
          type: 'string',
          enum: ['all', 'pending', 'approved', 'clocked_out'],
          description: 'Filter by approval status'
        }
      },
      responseExample: {
        success: true,
        data: {
          summary: {
            totalHours: 320,
            totalCost: 12800,
            periodStart: '2025-01-01',
            periodEnd: '2025-01-31'
          },
          byProject: [
            {
              projectName: 'Test New Project',
              hours: 120,
              cost: 4800
            }
          ]
        }
      }
    },
    {
      method: 'GET',
      path: '/api/reports/payroll/stats',
      description: 'Get quick payroll statistics',
      requiresAuth: true,
      requiredRole: 'admin'
    },
  ],

  // ==============================================
  // SCHEDULE PROJECTS APIs
  // ==============================================
  scheduleProjects: [
    {
      method: 'GET',
      path: '/api/schedule-projects',
      description: 'Get scheduled tasks/sub-projects within main projects',
      requiresAuth: true,
      queryParams: {
        projectId: {
          type: 'uuid',
          description: 'Filter by main project'
        },
        status: {
          type: 'string',
          description: 'Filter by schedule status',
          enum: ['planned', 'in_progress', 'completed', 'cancelled', 'delayed']
        },
        priority: {
          type: 'string',
          description: 'Filter by priority level',
          enum: ['low', 'medium', 'high', 'urgent']
        },
        assignedToUserId: {
          type: 'uuid',
          description: 'Filter by assigned user'
        }
      }
    },
  ],

  // ==============================================
  // PUNCHLIST APIs
  // ==============================================
  punchlist: [
    {
      method: 'GET',
      path: '/api/punchlist-items',
      description: 'Get punchlist items (issues/tasks that need completion)',
      requiresAuth: true,
      queryParams: {
        projectId: {
          type: 'uuid',
          description: 'Filter by project'
        },
        scheduleProjectId: {
          type: 'uuid',
          description: 'Filter by schedule project'
        },
        status: {
          type: 'string',
          description: 'Filter by completion status',
          enum: ['open', 'in_progress', 'completed', 'verified']
        },
        priority: {
          type: 'string',
          description: 'Filter by priority level',
          enum: ['low', 'medium', 'high', 'critical']
        },
        assignedToUserId: {
          type: 'uuid',
          description: 'Filter by assigned user'
        }
      }
    },
  ],

  // ==============================================
  // MEMBER-SPECIFIC APIs
  // ==============================================
  member: [
    {
      method: 'GET',
      path: '/api/member/projects',
      description: 'Get projects assigned to the current user (member view)',
      requiresAuth: true
    },
  ],
}

// ==============================================
// HELPER: Get all available endpoints
// ==============================================
export function getAllAPIEndpoints(): APIRoute[] {
  const allRoutes: APIRoute[] = []
  Object.values(API_SCHEMA).forEach(categoryRoutes => {
    allRoutes.push(...categoryRoutes)
  })
  return allRoutes
}

// ==============================================
// HELPER: Find relevant endpoints for a query
// ==============================================
export function findRelevantEndpoints(userQuery: string, userRole: string): APIRoute[] {
  const allEndpoints = getAllAPIEndpoints()
  const query = userQuery.toLowerCase()
  
  // Role check
  const isAdmin = ['super_admin', 'admin'].includes(userRole)
  
  // Filter by relevance and permissions
  return allEndpoints.filter(endpoint => {
    // Check role permissions
    if (endpoint.requiredRole && !isAdmin) {
      return false
    }
    
    // Check if endpoint is relevant to query
    const description = endpoint.description.toLowerCase()
    const path = endpoint.path.toLowerCase()
    
    // Simple relevance matching
    const keywords = query.split(' ').filter(w => w.length > 3)
    const relevant = keywords.some(keyword => 
      description.includes(keyword) || path.includes(keyword)
    )
    
    return relevant
  })
}

// ==============================================
// HELPER: Format schema for AI prompt
// ==============================================
export function formatAPISchemaForAI(userRole: string): string {
  const allEndpoints = getAllAPIEndpoints()
  const isAdmin = ['super_admin', 'admin'].includes(userRole)
  
  // Filter by role
  const availableEndpoints = allEndpoints.filter(endpoint => {
    if (endpoint.requiredRole && !isAdmin) return false
    return true
  })
  
  let schema = '# AVAILABLE API ENDPOINTS\n\n'
  schema += 'You have access to the following APIs. You can call any of these endpoints to get data.\n\n'
  
  availableEndpoints.forEach(endpoint => {
    schema += `## ${endpoint.method} ${endpoint.path}\n`
    schema += `${endpoint.description}\n`
    
    if (endpoint.pathParams && Object.keys(endpoint.pathParams).length > 0) {
      schema += `**Path Parameters:**\n`
      Object.entries(endpoint.pathParams).forEach(([key, param]) => {
        schema += `- {${key}}: ${param.description}${param.example ? ` (example: ${param.example})` : ''}\n`
      })
    }
    
    if (endpoint.queryParams && Object.keys(endpoint.queryParams).length > 0) {
      schema += `**Query Parameters:**\n`
      Object.entries(endpoint.queryParams).forEach(([key, param]) => {
        const required = param.required ? ' (required)' : ''
        const enumValues = param.enum ? ` (options: ${param.enum.join(', ')})` : ''
        schema += `- ${key}: ${param.description}${required}${enumValues}\n`
      })
    }
    
    schema += '\n'
  })
  
  return schema
}