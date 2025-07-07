// ==============================================
// src/lib/database/services/projects.ts - Enhanced Project Database Service
// ==============================================

import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { createBrowserClient } from '@/lib/supabase/client'
import type { ProjectLocation, ProjectClient } from '@/lib/database/schema/projects'

export class ProjectDatabaseService {
  private supabaseClient: ReturnType<typeof createServerClient>

  constructor(isServer = false, isAdmin = false) {
    if (isServer && isAdmin) {
      this.supabaseClient = createAdminClient()
    } else if (isServer) {
      this.supabaseClient = createServerClient()
    } else {
      this.supabaseClient = createBrowserClient()
    }
  }

  // ==============================================
  // AUTO-GENERATE PROJECT NUMBER
  // ==============================================
  async getNextProjectNumber(companyId: string): Promise<string> {
    try {
      const currentYear = new Date().getFullYear()
      
      // Find the highest project number for this company and year
      const { data: projects, error } = await this.supabaseClient
        .from('projects')
        .select('project_number')
        .eq('company_id', companyId)
        .like('project_number', `PRJ-${currentYear}-%`)
        .order('project_number', { ascending: false })
        .limit(1)

      if (error) {
        console.error('Error fetching project numbers:', error)
        throw new Error('Failed to generate project number')
      }

      let nextNumber = 1

      if (projects && projects.length > 0) {
        const lastProjectNumber = projects[0].project_number
        const numberMatch = lastProjectNumber.match(/PRJ-\d{4}-(\d{6})$/)
        
        if (numberMatch) {
          const lastNumber = parseInt(numberMatch[1], 10)
          nextNumber = lastNumber + 1
        }
      }

      // Format with leading zeros (6 digits)
      const formattedNumber = nextNumber.toString().padStart(6, '0')
      
      return `PRJ-${currentYear}-${formattedNumber}`
      
    } catch (error) {
      console.error('Error generating project number:', error)
      throw error
    }
  }

  // ==============================================
  // ENHANCED PROJECT CRUD OPERATIONS
  // ==============================================

  async createProjectEnhanced(data: {
    companyId: string
    name: string
    description?: string
    projectNumber?: string
    status?: 'not_started' | 'in_progress' | 'on_track' | 'ahead_of_schedule' | 'behind_schedule' | 'on_hold' | 'completed' | 'cancelled'
    priority?: 'low' | 'medium' | 'high' | 'urgent'
    budget?: number
    startDate?: string
    endDate?: string
    actualStartDate?: string
    actualEndDate?: string
    estimatedHours?: number
    location?: ProjectLocation
    client?: ProjectClient
    tags?: string[]
    createdBy: string
  }) {
    // Auto-generate project number if not provided
    let projectNumber = data.projectNumber
    if (!projectNumber) {
      projectNumber = await this.getNextProjectNumber(data.companyId)
    }

    const { data: project, error } = await this.supabaseClient
      .from('projects')
      .insert([{
        company_id: data.companyId,
        name: data.name,
        description: data.description,
        project_number: projectNumber,
        status: data.status || 'not_started',
        priority: data.priority || 'medium',
        budget: data.budget,
        spent: 0,
        progress: 0,
        start_date: data.startDate,
        end_date: data.endDate,
        actual_start_date: data.actualStartDate,
        actual_end_date: data.actualEndDate,
        estimated_hours: data.estimatedHours,
        actual_hours: 0,
        location: data.location,
        client: data.client,
        created_by: data.createdBy,
        tags: data.tags || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single()

    if (error) throw error
    return project
  }

  async getProjectByIdEnhanced(projectId: string, companyId: string) {
    const { data: project, error } = await this.supabaseClient
      .from('projects')
      .select(`
        *,
        creator:users!created_by(
          id,
          first_name,
          last_name,
          email
        ),
        project_manager:users!project_manager_id(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', projectId)
      .eq('company_id', companyId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }
    return project
  }

  async getProjectsByCompany(
    companyId: string,
    options: {
      status?: 'not_started' | 'in_progress' | 'on_track' | 'ahead_of_schedule' | 'behind_schedule' | 'on_hold' | 'completed' | 'cancelled'
      priority?: 'low' | 'medium' | 'high' | 'urgent'
      limit?: number
      offset?: number
      search?: string
      sortBy?: 'name' | 'created_at' | 'start_date' | 'end_date' | 'progress' | 'status' | 'priority' | 'budget'
      sortOrder?: 'asc' | 'desc'
      managerId?: string
      location?: string
      client?: string
    } = {}
  ) {
    let query = this.supabaseClient
      .from('projects')
      .select(`
        *,
        creator:users!created_by(
          id,
          first_name,
          last_name,
          email
        ),
        project_manager:users!project_manager_id(
          id,
          first_name,
          last_name,
          email
        )
      `, { count: 'exact' })
      .eq('company_id', companyId)

    // Apply filters
    if (options.status) {
      query = query.eq('status', options.status)
    }

    if (options.priority) {
      query = query.eq('priority', options.priority)
    }

    if (options.managerId) {
      query = query.eq('project_manager_id', options.managerId)
    }

    if (options.search) {
      // Search in name, description, and JSONB fields
      query = query.or(`
        name.ilike.%${options.search}%,
        description.ilike.%${options.search}%,
        location->>'address'.ilike.%${options.search}%,
        location->>'city'.ilike.%${options.search}%,
        location->>'state'.ilike.%${options.search}%,
        client->>'name'.ilike.%${options.search}%,
        client->>'email'.ilike.%${options.search}%
      `.replace(/\s+/g, ''))
    }

    if (options.location) {
      // Search specifically in location JSONB
      query = query.or(`
        location->>'address'.ilike.%${options.location}%,
        location->>'city'.ilike.%${options.location}%,
        location->>'state'.ilike.%${options.location}%,
        location->>'displayName'.ilike.%${options.location}%
      `.replace(/\s+/g, ''))
    }

    if (options.client) {
      // Search specifically in client JSONB
      query = query.or(`
        client->>'name'.ilike.%${options.client}%,
        client->>'email'.ilike.%${options.client}%,
        client->>'contactPerson'.ilike.%${options.client}%
      `.replace(/\s+/g, ''))
    }

    // Apply sorting
    const sortBy = options.sortBy || 'created_at'
    const sortOrder = options.sortOrder || 'desc'
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit)
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
    }

    const { data: projects, error, count } = await query

    if (error) throw error

    return {
      projects: projects || [],
      total: count || 0
    }
  }

  async updateProjectEnhanced(
    projectId: string,
    companyId: string,
    data: {
      name?: string
      description?: string
      projectNumber?: string
      status?: 'not_started' | 'in_progress' | 'on_track' | 'ahead_of_schedule' | 'behind_schedule' | 'on_hold' | 'completed' | 'cancelled'
      priority?: 'low' | 'medium' | 'high' | 'urgent'
      budget?: number
      spent?: number
      progress?: number
      startDate?: string
      endDate?: string
      actualStartDate?: string
      actualEndDate?: string
      estimatedHours?: number
      actualHours?: number
      location?: ProjectLocation
      client?: ProjectClient
      tags?: string[]
      projectManagerId?: string
      foremanId?: string
    }
  ) {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    // Only include fields that are provided
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.projectNumber !== undefined) updateData.project_number = data.projectNumber
    if (data.status !== undefined) updateData.status = data.status
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.budget !== undefined) updateData.budget = data.budget
    if (data.spent !== undefined) updateData.spent = data.spent
    if (data.progress !== undefined) updateData.progress = data.progress
    if (data.startDate !== undefined) updateData.start_date = data.startDate
    if (data.endDate !== undefined) updateData.end_date = data.endDate
    if (data.actualStartDate !== undefined) updateData.actual_start_date = data.actualStartDate
    if (data.actualEndDate !== undefined) updateData.actual_end_date = data.actualEndDate
    if (data.estimatedHours !== undefined) updateData.estimated_hours = data.estimatedHours
    if (data.actualHours !== undefined) updateData.actual_hours = data.actualHours
    if (data.location !== undefined) updateData.location = data.location
    if (data.client !== undefined) updateData.client = data.client
    if (data.tags !== undefined) updateData.tags = data.tags
    if (data.projectManagerId !== undefined) updateData.project_manager_id = data.projectManagerId
    if (data.foremanId !== undefined) updateData.foreman_id = data.foremanId

    const { data: project, error } = await this.supabaseClient
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .eq('company_id', companyId)
      .select()
      .single()

    if (error) throw error
    return project
  }

  async deleteProject(projectId: string, companyId: string) {
    const { error } = await this.supabaseClient
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('company_id', companyId)

    if (error) throw error
    return true
  }

  // ==============================================
  // PROJECT STATUS & PROGRESS OPERATIONS
  // ==============================================

  async updateProjectStatus(
    projectId: string,
    companyId: string,
    status: 'not_started' | 'in_progress' | 'on_track' | 'ahead_of_schedule' | 'behind_schedule' | 'on_hold' | 'completed' | 'cancelled',
    notes?: string
  ) {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    // Auto-set actual dates based on status
    if (status === 'in_progress' || status === 'on_track') {
      // Set actual start date if not already set
      const { data: currentProject } = await this.supabaseClient
        .from('projects')
        .select('actual_start_date')
        .eq('id', projectId)
        .eq('company_id', companyId)
        .single()

      if (currentProject && !currentProject.actual_start_date) {
        updateData.actual_start_date = new Date().toISOString().split('T')[0]
      }
    }

    if (status === 'completed') {
      updateData.progress = 100
      updateData.actual_end_date = new Date().toISOString().split('T')[0]
    }

    const { data: project, error } = await this.supabaseClient
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .eq('company_id', companyId)
      .select()
      .single()

    if (error) throw error
    return project
  }

  async updateProjectProgress(
    projectId: string,
    companyId: string,
    progress: number,
    notes?: string
  ) {
    let updateData: any = {
      progress,
      updated_at: new Date().toISOString(),
    }

    // Auto-complete project if progress reaches 100%
    if (progress >= 100) {
      updateData.status = 'completed'
      updateData.progress = 100
      updateData.actual_end_date = new Date().toISOString().split('T')[0]
    }

    const { data: project, error } = await this.supabaseClient
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .eq('company_id', companyId)
      .select()
      .single()

    if (error) throw error
    return project
  }

  // ==============================================
  // ENHANCED STATISTICS & ANALYTICS
  // ==============================================

  async getProjectStats(companyId: string) {
    const { data: projects, error } = await this.supabaseClient
      .from('projects')
      .select('status, priority, budget, spent, progress, estimated_hours, actual_hours, start_date, end_date, created_at')
      .eq('company_id', companyId)

    if (error) throw error

    const statusCounts = {
      not_started: 0,
      in_progress: 0,
      on_track: 0,
      ahead_of_schedule: 0,
      behind_schedule: 0,
      on_hold: 0,
      completed: 0,
      cancelled: 0,
    }

    const priorityCounts = {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0,
    }

    projects.forEach(project => {
      statusCounts[project.status as keyof typeof statusCounts]++
      priorityCounts[project.priority as keyof typeof priorityCounts]++
    })

    const stats = {
      totalProjects: projects.length,
      byStatus: statusCounts,
      byPriority: priorityCounts,
      totalBudget: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
      totalSpent: projects.reduce((sum, p) => sum + (p.spent || 0), 0),
      totalEstimatedHours: projects.reduce((sum, p) => sum + (p.estimated_hours || 0), 0),
      totalActualHours: projects.reduce((sum, p) => sum + (p.actual_hours || 0), 0),
      averageProgress: projects.length > 0 
        ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)
        : 0,
    }

    return stats
  }

  async getProjectsWithCoordinates(companyId: string) {
    const { data: projects, error } = await this.supabaseClient
      .from('projects')
      .select('id, name, location, status, priority, budget, progress')
      .eq('company_id', companyId)
      .not('location', 'is', null)

    if (error) throw error

    // Filter projects that have coordinates
    return (projects || []).filter(project => 
      project.location && 
      project.location.coordinates && 
      project.location.coordinates.lat && 
      project.location.coordinates.lng
    )
  }

  async getClientStats(companyId: string) {
    const { data: projects, error } = await this.supabaseClient
      .from('projects')
      .select('client')
      .eq('company_id', companyId)
      .not('client', 'is', null)

    if (error) throw error

    const clientCounts: Record<string, number> = {}
    let totalUniqueClients = 0
    let projectsWithoutClient = 0

    projects.forEach(project => {
      if (project.client && project.client.name) {
        const clientName = project.client.name
        clientCounts[clientName] = (clientCounts[clientName] || 0) + 1
        if (clientCounts[clientName] === 1) {
          totalUniqueClients++
        }
      } else {
        projectsWithoutClient++
      }
    })

    const topClients = Object.entries(clientCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))

    const clientsWithMultipleProjects = Object.values(clientCounts)
      .filter(count => count > 1).length

    return {
      totalUniqueClients,
      clientsWithMultipleProjects,
      topClients,
      projectsWithoutClient,
    }
  }

  async getBudgetStatsByStatus(companyId: string) {
    const { data: projects, error } = await this.supabaseClient
      .from('projects')
      .select('status, budget, spent')
      .eq('company_id', companyId)

    if (error) throw error

    const budgetByStatus: Record<string, { budget: number, spent: number }> = {}

    projects.forEach(project => {
      const status = project.status
      if (!budgetByStatus[status]) {
        budgetByStatus[status] = { budget: 0, spent: 0 }
      }
      budgetByStatus[status].budget += project.budget || 0
      budgetByStatus[status].spent += project.spent || 0
    })

    return budgetByStatus
  }

  // ==============================================
  // PROJECT FILES OPERATIONS
  // ==============================================

  async getProjectFiles(projectId: string, folder?: string) {
    let query = this.supabaseClient
      .from('project_files')
      .select(`
        *,
        uploader:users!uploaded_by(
          id,
          first_name,
          last_name
        )
      `)
      .eq('project_id', projectId)

    if (folder) {
      query = query.eq('folder', folder)
    }

    query = query.order('uploaded_at', { ascending: false })

    const { data: files, error } = await query

    if (error) throw error

    return files || []
  }

  // ==============================================
  // UTILITY METHODS
  // ==============================================

  async checkProjectExists(projectId: string, companyId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseClient
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('company_id', companyId)
        .single()

      return !error && !!data
    } catch (error) {
      return false
    }
  }

  async isProjectNameTaken(name: string, companyId: string, excludeProjectId?: string): Promise<boolean> {
    try {
      let query = this.supabaseClient
        .from('projects')
        .select('id')
        .eq('company_id', companyId)
        .eq('name', name)

      if (excludeProjectId) {
        query = query.neq('id', excludeProjectId)
      }

      const { data, error } = await query.single()

      return !error && !!data
    } catch (error) {
      return false
    }
  }

  // ==============================================
  // SEARCH METHODS FOR JSONB FIELDS
  // ==============================================

  async searchProjectsByLocation(companyId: string, locationQuery: string, limit = 10) {
    const { data: projects, error } = await this.supabaseClient
      .from('projects')
      .select('id, name, location, status, priority')
      .eq('company_id', companyId)
      .or(`
        location->>'address'.ilike.%${locationQuery}%,
        location->>'city'.ilike.%${locationQuery}%,
        location->>'state'.ilike.%${locationQuery}%,
        location->>'displayName'.ilike.%${locationQuery}%
      `.replace(/\s+/g, ''))
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return projects || []
  }

  async searchProjectsByClient(companyId: string, clientQuery: string, limit = 10) {
    const { data: projects, error } = await this.supabaseClient
      .from('projects')
      .select('id, name, client, status, priority')
      .eq('company_id', companyId)
      .or(`
        client->>'name'.ilike.%${clientQuery}%,
        client->>'email'.ilike.%${clientQuery}%,
        client->>'contactPerson'.ilike.%${clientQuery}%
      `.replace(/\s+/g, ''))
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return projects || []
  }
}