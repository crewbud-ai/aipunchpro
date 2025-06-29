// ==============================================
// src/lib/database/services/projects.ts - Project Database Service
// ==============================================

import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { createBrowserClient } from '@/lib/supabase/client'

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
  // PROJECT CRUD OPERATIONS
  // ==============================================

  async createProject(data: {
    companyId: string
    name: string
    description?: string
    projectNumber?: string
    status?: 'planning' | 'active' | 'on_hold' | 'completed'
    priority?: 'low' | 'medium' | 'high'
    budget?: number
    startDate?: string
    endDate?: string
    estimatedHours?: number
    location?: string
    address?: string
    clientName?: string
    clientContact?: string
    createdBy: string
    tags?: string[]
  }) {
    const { data: project, error } = await this.supabaseClient
      .from('projects')
      .insert([{
        company_id: data.companyId,
        name: data.name,
        description: data.description,
        project_number: data.projectNumber,
        status: data.status || 'planning',
        priority: data.priority || 'medium',
        budget: data.budget,
        spent: 0,
        progress: 0,
        start_date: data.startDate,
        end_date: data.endDate,
        estimated_hours: data.estimatedHours,
        actual_hours: 0,
        location: data.location,
        address: data.address,
        client_name: data.clientName,
        client_contact: data.clientContact,
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

  async getProjectById(projectId: string, companyId: string) {
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
      status?: 'planning' | 'active' | 'on_hold' | 'completed'
      priority?: 'low' | 'medium' | 'high'
      limit?: number
      offset?: number
      search?: string
      sortBy?: 'name' | 'created_at' | 'start_date' | 'progress'
      sortOrder?: 'asc' | 'desc'
    } = {}
  ) {
    let query = this.supabaseClient
      .from('projects')
      .select(`
        *,
        creator:users!created_by(
          id,
          first_name,
          last_name
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

    if (options.search) {
      query = query.or(`name.ilike.%${options.search}%,description.ilike.%${options.search}%,client_name.ilike.%${options.search}%`)
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

  async updateProject(
    projectId: string,
    companyId: string,
    data: {
      name?: string
      description?: string
      projectNumber?: string
      status?: 'planning' | 'active' | 'on_hold' | 'completed'
      priority?: 'low' | 'medium' | 'high'
      budget?: number
      spent?: number
      progress?: number
      startDate?: string
      endDate?: string
      estimatedHours?: number
      actualHours?: number
      location?: string
      address?: string
      clientName?: string
      clientContact?: string
      tags?: string[]
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
    if (data.estimatedHours !== undefined) updateData.estimated_hours = data.estimatedHours
    if (data.actualHours !== undefined) updateData.actual_hours = data.actualHours
    if (data.location !== undefined) updateData.location = data.location
    if (data.address !== undefined) updateData.address = data.address
    if (data.clientName !== undefined) updateData.client_name = data.clientName
    if (data.clientContact !== undefined) updateData.client_contact = data.clientContact
    if (data.tags !== undefined) updateData.tags = data.tags

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
    status: 'planning' | 'active' | 'on_hold' | 'completed',
    notes?: string
  ) {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    // If project is being marked as completed, set progress to 100
    if (status === 'completed') {
      updateData.progress = 100
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
  // PROJECT STATISTICS & ANALYTICS
  // ==============================================

  async getProjectStats(companyId: string) {
    const { data: projects, error } = await this.supabaseClient
      .from('projects')
      .select('status, priority, budget, spent, progress')
      .eq('company_id', companyId)

    if (error) throw error

    const stats = {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'active').length,
      completedProjects: projects.filter(p => p.status === 'completed').length,
      onHoldProjects: projects.filter(p => p.status === 'on_hold').length,
      planningProjects: projects.filter(p => p.status === 'planning').length,
      totalBudget: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
      totalSpent: projects.reduce((sum, p) => sum + (p.spent || 0), 0),
      averageProgress: projects.length > 0 
        ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)
        : 0,
    }

    return {
      ...stats,
      remainingBudget: stats.totalBudget - stats.totalSpent,
      budgetUtilization: stats.totalBudget > 0 
        ? Math.round((stats.totalSpent / stats.totalBudget) * 100)
        : 0,
    }
  }

  // ==============================================
  // PROJECT FILES OPERATIONS
  // ==============================================

  async uploadProjectFile(data: {
    projectId: string
    name: string
    fileUrl: string
    fileType?: string
    fileSize?: number
    mimeType?: string
    folder?: string
    description?: string
    tags?: string[]
    uploadedBy: string
  }) {
    const { data: file, error } = await this.supabaseClient
      .from('project_files')
      .insert([{
        project_id: data.projectId,
        name: data.name,
        file_url: data.fileUrl,
        file_type: data.fileType,
        file_size: data.fileSize,
        mime_type: data.mimeType,
        folder: data.folder || 'general',
        description: data.description,
        tags: data.tags || [],
        uploaded_by: data.uploadedBy,
        uploaded_at: new Date().toISOString(),
      }])
      .select()
      .single()

    if (error) throw error
    return file
  }

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
      .eq('status', 'active')

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
      console.error('Check project exists error:', error)
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
}