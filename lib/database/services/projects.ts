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
    // FIXED: Remove non-existent foreign key references
    const { data: project, error } = await this.supabaseClient
      .from('projects')
      .select(`
        *,
        creator:users!created_by(
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
      location?: string
      client?: string
    } = {}
  ) {
    // FIXED: Remove non-existent foreign key references
    let query = this.supabaseClient
      .from('projects')
      .select(`
        *,
        creator:users!created_by(
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
  }

  async checkProjectExists(projectId: string, companyId: string): Promise<boolean> {
    const { data, error } = await this.supabaseClient
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('company_id', companyId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return !!data
  }

  // ==============================================
  // NEW METHODS FOR STATUS COORDINATION
  // ==============================================

  /**
   * Update project status with coordination hooks and validation
   */
  async updateProjectStatusCoordinated(
    projectId: string,
    companyId: string,
    newStatus: 'not_started' | 'in_progress' | 'on_track' | 'ahead_of_schedule' | 'behind_schedule' | 'on_hold' | 'completed' | 'cancelled',
    options?: {
      notes?: string
      userId?: string
      skipChildValidation?: boolean
      triggeredBy?: 'user' | 'schedule_sync' | 'admin'
      actualStartDate?: string
      actualEndDate?: string
    }
  ) {
    // Validate status change based on current state and child entities
    if (!options?.skipChildValidation) {
      const validation = await this.validateProjectStatusChange(
        projectId,
        companyId,
        newStatus
      )

      if (!validation.canChange) {
        throw new Error(
          `Cannot change project status to ${newStatus}: ${validation.reasons.join(', ')}`
        )
      }
    }

    // Prepare update data
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    }

    // if (options?.notes) {
    //   updateData.notes = options.notes
    // }

    // Handle status-specific logic
    if (newStatus === 'in_progress' || newStatus === 'on_track') {
      // Set actual start date if not already set and not provided
      console.log('In Progress')
      if (!options?.actualStartDate) {
        const { data: currentProject } = await this.supabaseClient
          .from('projects')
          .select('actual_start_date')
          .eq('id', projectId)
          .eq('company_id', companyId)
          .single()

        if (currentProject && !currentProject.actual_start_date) {
          updateData.actual_start_date = new Date().toISOString().split('T')[0]
        }
      } else {
        updateData.actual_start_date = options.actualStartDate
      }
    }

    if (newStatus === 'completed') {
      updateData.progress = 100
      updateData.actual_end_date = options?.actualEndDate || new Date().toISOString().split('T')[0]
    }

    console.log(updateData, 'updateData')

    // Update the project
    const { data: project, error } = await this.supabaseClient
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .eq('company_id', companyId)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating project status:', error)
      throw new Error('Failed to update project status')
    }

    return project
  }

  /**
   * Validate if project status can be changed based on child entities
   */
  async validateProjectStatusChange(
    projectId: string,
    companyId: string,
    newStatus: string
  ): Promise<{
    canChange: boolean
    reasons: string[]
    childEntityCounts: {
      scheduleProjects: Record<string, number>
      punchlistItems: Record<string, number>
      activeTeamMembers: number
    }
  }> {
    const reasons: string[] = []

    // FIX: Properly type the objects as Record<string, number>
    const childEntityCounts = {
      scheduleProjects: {} as Record<string, number>,
      punchlistItems: {} as Record<string, number>,
      activeTeamMembers: 0
    }

    try {
      // Get schedule project statistics
      const { data: scheduleProjects } = await this.supabaseClient
        .from('schedule_projects')
        .select('status')
        .eq('project_id', projectId)
        .eq('company_id', companyId)

      if (scheduleProjects) {
        scheduleProjects.forEach(sp => {
          childEntityCounts.scheduleProjects[sp.status] =
            (childEntityCounts.scheduleProjects[sp.status] || 0) + 1
        })
      }

      // Get punchlist item statistics
      const { data: punchlistItems } = await this.supabaseClient
        .from('punchlist_items')
        .select('status, priority')
        .eq('project_id', projectId)
        .eq('company_id', companyId)

      if (punchlistItems) {
        punchlistItems.forEach(pi => {
          childEntityCounts.punchlistItems[pi.status] =
            (childEntityCounts.punchlistItems[pi.status] || 0) + 1
        })
      }

      // Get active team member count
      const { data: teamMembers } = await this.supabaseClient
        .from('project_members')
        .select('id')
        .eq('project_id', projectId)
        .eq('company_id', companyId)
        .eq('status', 'active')

      childEntityCounts.activeTeamMembers = teamMembers?.length || 0

      // Apply validation rules based on new status
      switch (newStatus) {
        case 'completed':
          // Check if all schedule projects are completed
          const incompleteSchedules = (childEntityCounts.scheduleProjects.planned || 0) +
            (childEntityCounts.scheduleProjects.in_progress || 0) +
            (childEntityCounts.scheduleProjects.delayed || 0)

          if (incompleteSchedules > 0) {
            reasons.push(`${incompleteSchedules} schedule project(s) are not completed`)
          }

          // Check for critical open punchlist items
          const criticalOpen = (childEntityCounts.punchlistItems.open || 0) +
            (childEntityCounts.punchlistItems.assigned || 0) +
            (childEntityCounts.punchlistItems.in_progress || 0) +
            (childEntityCounts.punchlistItems.pending_review || 0)

          if (criticalOpen > 0) {
            // Get actual critical items
            const { data: criticalItems } = await this.supabaseClient
              .from('punchlist_items')
              .select('id')
              .eq('project_id', projectId)
              .eq('company_id', companyId)
              .in('status', ['open', 'assigned', 'in_progress', 'pending_review'])
              .eq('priority', 'critical')

            if (criticalItems && criticalItems.length > 0) {
              reasons.push(`${criticalItems.length} critical punchlist item(s) are not resolved`)
            }
          }
          break

        case 'in_progress':
          // Check if project has team members assigned
          if (childEntityCounts.activeTeamMembers === 0) {
            reasons.push('No team members assigned to project')
          }
          break

        case 'cancelled':
          // Check if any work is in progress
          const activeWork = (childEntityCounts.scheduleProjects.in_progress || 0)
          if (activeWork > 0) {
            reasons.push(`${activeWork} schedule project(s) are currently in progress`)
          }
          break

        default:
          break
      }

      return {
        canChange: reasons.length === 0,
        reasons,
        childEntityCounts
      }

    } catch (error) {
      console.error('Error validating project status change:', error)
      return {
        canChange: false,
        reasons: ['Validation error occurred'],
        childEntityCounts
      }
    }
  }

  /**
   * Calculate project status based on child entity progress
   */
  async calculateProjectStatusFromChildren(
    projectId: string,
    companyId: string
  ): Promise<{
    suggestedStatus: string
    confidence: number
    reasoning: string
    metrics: {
      scheduleCompletion: number
      punchlistCompletion: number
      overallProgress: number
      daysFromDeadline: number
    }
  }> {
    try {
      // Get project details
      const { data: project } = await this.supabaseClient
        .from('projects')
        .select('end_date, progress')
        .eq('id', projectId)
        .eq('company_id', companyId)
        .single()

      // Get schedule project metrics
      const { data: scheduleProjects } = await this.supabaseClient
        .from('schedule_projects')
        .select('status, progress_percentage')
        .eq('project_id', projectId)
        .eq('company_id', companyId)

      // Get punchlist metrics
      const { data: punchlistItems } = await this.supabaseClient
        .from('punchlist_items')
        .select('status, priority')
        .eq('project_id', projectId)
        .eq('company_id', companyId)

      // Calculate metrics
      const scheduleTotal = scheduleProjects?.length || 0
      const scheduleCompleted = scheduleProjects?.filter(sp => sp.status === 'completed').length || 0
      const scheduleCompletion = scheduleTotal > 0 ? (scheduleCompleted / scheduleTotal) * 100 : 0

      const punchlistTotal = punchlistItems?.length || 0
      const punchlistCompleted = punchlistItems?.filter(pi => pi.status === 'completed').length || 0
      const punchlistCompletion = punchlistTotal > 0 ? (punchlistCompleted / punchlistTotal) * 100 : 0

      // Calculate overall progress from schedule projects
      let totalProgress = 0
      if (scheduleProjects && scheduleProjects.length > 0) {
        totalProgress = scheduleProjects.reduce((sum, sp) =>
          sum + (Number(sp.progress_percentage) || 0), 0
        ) / scheduleProjects.length
      }

      // Calculate days from deadline
      let daysFromDeadline = 0
      if (project?.end_date) {
        const endDate = new Date(project.end_date)
        const today = new Date()
        daysFromDeadline = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      }

      // Determine suggested status
      let suggestedStatus = 'not_started'
      let confidence = 0
      let reasoning = ''

      if (scheduleCompletion === 100 && punchlistCompletion >= 95) {
        suggestedStatus = 'completed'
        confidence = 95
        reasoning = 'All schedule projects and most punchlist items are completed'
      } else if (totalProgress >= 90) {
        if (daysFromDeadline > 0) {
          suggestedStatus = 'ahead_of_schedule'
          confidence = 85
          reasoning = 'Project is nearly complete and ahead of deadline'
        } else {
          suggestedStatus = 'on_track'
          confidence = 80
          reasoning = 'Project is nearly complete'
        }
      } else if (totalProgress >= 50) {
        if (daysFromDeadline < -5) {
          suggestedStatus = 'behind_schedule'
          confidence = 90
          reasoning = 'Project is behind deadline'
        } else if (daysFromDeadline > 10) {
          suggestedStatus = 'ahead_of_schedule'
          confidence = 75
          reasoning = 'Project progress is good and ahead of schedule'
        } else {
          suggestedStatus = 'on_track'
          confidence = 70
          reasoning = 'Project is progressing normally'
        }
      } else if (totalProgress > 0) {
        suggestedStatus = 'in_progress'
        confidence = 80
        reasoning = 'Work has begun on schedule projects'
      }

      return {
        suggestedStatus,
        confidence,
        reasoning,
        metrics: {
          scheduleCompletion,
          punchlistCompletion,
          overallProgress: totalProgress,
          daysFromDeadline
        }
      }

    } catch (error) {
      console.error('Error calculating project status from children:', error)
      return {
        suggestedStatus: 'not_started',
        confidence: 0,
        reasoning: 'Unable to calculate status due to error',
        metrics: {
          scheduleCompletion: 0,
          punchlistCompletion: 0,
          overallProgress: 0,
          daysFromDeadline: 0
        }
      }
    }
  }

  /**
   * Remove team member from all project assignments
   */
  async removeTeamMemberFromAllProjects(
    userId: string,
    companyId: string
  ): Promise<{
    removedCount: number
    affectedProjects: string[]
  }> {
    try {
      // Find all project memberships for this user
      const { data: memberships, error: fetchError } = await this.supabaseClient
        .from('project_members')
        .select('id, project_id')
        .eq('user_id', userId)
        .eq('company_id', companyId)
        .eq('status', 'active')

      if (fetchError) {
        console.error('Error fetching project memberships:', fetchError)
        throw fetchError
      }

      if (!memberships || memberships.length === 0) {
        return { removedCount: 0, affectedProjects: [] }
      }

      let removedCount = 0
      // FIX: Explicitly type as string array
      const affectedProjects: string[] = []

      // Deactivate each membership
      for (const membership of memberships) {
        const { error: updateError } = await this.supabaseClient
          .from('project_members')
          .update({
            status: 'inactive',
            left_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', membership.id)

        if (updateError) {
          console.error(`Error removing project membership ${membership.id}:`, updateError)
        } else {
          removedCount++
          if (!affectedProjects.includes(membership.project_id)) {
            affectedProjects.push(membership.project_id)
          }
        }
      }

      return { removedCount, affectedProjects }

    } catch (error) {
      console.error('Error removing team member from projects:', error)
      return { removedCount: 0, affectedProjects: [] }
    }
  }

  /**
   * Get project status summary with child entity details
   */
  async getProjectStatusSummary(
    projectId: string,
    companyId: string
  ): Promise<{
    project: any
    scheduleProjects: {
      total: number
      byStatus: Record<string, number>
      overallProgress: number
    }
    punchlistItems: {
      total: number
      byStatus: Record<string, number>
      byPriority: Record<string, number>
      blockingCount: number
    }
    teamMembers: {
      total: number
      active: number
    }
    statusRecommendation: {
      suggested: string
      confidence: number
      reasoning: string
    }
  }> {
    try {
      // Get project details
      const project = await this.getProjectByIdEnhanced(projectId, companyId)
      if (!project) {
        throw new Error('Project not found')
      }

      // Get schedule project summary
      const { data: scheduleProjects } = await this.supabaseClient
        .from('schedule_projects')
        .select('status, progress_percentage')
        .eq('project_id', projectId)
        .eq('company_id', companyId)

      // FIX: Properly type as Record<string, number>
      const scheduleByStatus: Record<string, number> = {}
      let scheduleProgress = 0
      if (scheduleProjects) {
        scheduleProjects.forEach(sp => {
          scheduleByStatus[sp.status] = (scheduleByStatus[sp.status] || 0) + 1
          scheduleProgress += Number(sp.progress_percentage || 0)
        })
        if (scheduleProjects.length > 0) {
          scheduleProgress = scheduleProgress / scheduleProjects.length
        }
      }

      // Get punchlist summary
      const { data: punchlistItems } = await this.supabaseClient
        .from('punchlist_items')
        .select('status, priority')
        .eq('project_id', projectId)
        .eq('company_id', companyId)

      // FIX: Properly type as Record<string, number>
      const punchlistByStatus: Record<string, number> = {}
      const punchlistByPriority: Record<string, number> = {}
      let blockingCount = 0
      if (punchlistItems) {
        punchlistItems.forEach(pi => {
          punchlistByStatus[pi.status] = (punchlistByStatus[pi.status] || 0) + 1
          punchlistByPriority[pi.priority] = (punchlistByPriority[pi.priority] || 0) + 1

          // Count blocking items (high/critical that are not resolved)
          if ((pi.priority === 'high' || pi.priority === 'critical') &&
            !['completed', 'rejected'].includes(pi.status)) {
            blockingCount++
          }
        })
      }

      // Get team member summary
      const { data: teamMembers } = await this.supabaseClient
        .from('project_members')
        .select('id, status')
        .eq('project_id', projectId)
        .eq('company_id', companyId)

      const activeTeamMembers = teamMembers?.filter(tm => tm.status === 'active').length || 0

      // Get status recommendation
      const recommendation = await this.calculateProjectStatusFromChildren(projectId, companyId)

      return {
        project,
        scheduleProjects: {
          total: scheduleProjects?.length || 0,
          byStatus: scheduleByStatus,
          overallProgress: scheduleProgress
        },
        punchlistItems: {
          total: punchlistItems?.length || 0,
          byStatus: punchlistByStatus,
          byPriority: punchlistByPriority,
          blockingCount
        },
        teamMembers: {
          total: teamMembers?.length || 0,
          active: activeTeamMembers
        },
        statusRecommendation: {
          suggested: recommendation.suggestedStatus,
          confidence: recommendation.confidence,
          reasoning: recommendation.reasoning
        }
      }

    } catch (error) {
      console.error('Error getting project status summary:', error)
      throw error
    }
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
      .select('status, priority, budget, spent, progress')
      .eq('company_id', companyId)

    if (error) throw error

    const stats = {
      total: projects.length,
      byStatus: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
      totalBudget: 0,
      totalSpent: 0,
      averageProgress: projects.length > 0
        ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)
        : 0,
    }

    projects.forEach(project => {
      // Count by status
      stats.byStatus[project.status] = (stats.byStatus[project.status] || 0) + 1

      // Count by priority
      stats.byPriority[project.priority] = (stats.byPriority[project.priority] || 0) + 1

      // Sum budget and spent
      stats.totalBudget += project.budget || 0
      stats.totalSpent += project.spent || 0
    })

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
      .sort(([, a], [, b]) => b - a)
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
          last_name,
          email
        )
      `)
      .eq('project_id', projectId)

    if (folder) {
      query = query.eq('folder', folder)
    }

    const { data: files, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return files || []
  }

  // ==============================================
  // UTILITY METHODS
  // ==============================================

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

  async uploadProjectFile(data: {
    projectId: string
    companyId: string
    fileName: string
    fileSize: number
    fileType: string
    filePath: string
    folder?: string
    uploadedBy: string
  }) {
    const { data: file, error } = await this.supabaseClient
      .from('project_files')
      .insert([{
        project_id: data.projectId,
        company_id: data.companyId,
        file_name: data.fileName,
        file_size: data.fileSize,
        file_type: data.fileType,
        file_path: data.filePath,
        folder: data.folder,
        uploaded_by: data.uploadedBy,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single()

    if (error) throw error
    return file
  }

  async deleteProjectFile(fileId: string, companyId: string) {
    const { error } = await this.supabaseClient
      .from('project_files')
      .delete()
      .eq('id', fileId)
      .eq('company_id', companyId)

    if (error) throw error
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