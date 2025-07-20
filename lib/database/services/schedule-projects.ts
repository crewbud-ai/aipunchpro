// ==============================================
// src/lib/database/services/schedule-projects.ts - Schedule Projects Database Service
// ==============================================

import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { createBrowserClient } from '@/lib/supabase/client'
import type {
    ScheduleProject,
    NewScheduleProject,
    User,
    Project,
    ProjectMember
} from '@/lib/database/schema'

// Extended types for joined data
export interface ScheduleProjectWithDetails extends ScheduleProject {
    project?: {
        id: string
        name: string
        status: string
    }
    assignedMembers?: Array<{
        id: string
        userId: string
        user: {
            firstName: string
            lastName: string
            tradeSpecialty?: string
        }
    }>
    creator?: {
        firstName: string
        lastName: string
    }

}

export interface DependentScheduleProject {
    id: string
    title: string
    status: string
    start_date: string
    end_date: string
    project: {
        name: string
    }
}

export class ScheduleProjectDatabaseService {
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
    // SCHEDULE PROJECT CRUD OPERATIONS
    // ==============================================

    async createScheduleProject(data: {
        companyId: string
        projectId: string
        title: string
        description?: string
        startDate: string
        endDate: string
        startTime?: string
        endTime?: string
        assignedProjectMemberIds: string[]
        tradeRequired?: string
        status?: 'planned' | 'in_progress' | 'completed' | 'delayed' | 'cancelled'
        priority?: 'low' | 'medium' | 'high' | 'critical'
        estimatedHours?: number
        location?: string
        notes?: string
        dependsOn?: string[]
        createdBy: string
    }) {
        const insertData = {
            company_id: data.companyId,
            project_id: data.projectId,
            title: data.title,
            description: data.description || null,
            start_date: data.startDate,
            end_date: data.endDate,
            start_time: data.startTime || null,
            end_time: data.endTime || null,
            assigned_project_member_ids: data.assignedProjectMemberIds,
            trade_required: data.tradeRequired || null,
            status: data.status || 'planned',
            priority: data.priority || 'medium',
            progress_percentage: 0,
            estimated_hours: data.estimatedHours || null,
            actual_hours: 0,
            location: data.location || null,
            notes: data.notes || null,
            depends_on: data.dependsOn || [],
            created_by: data.createdBy,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }

        const { data: scheduleProject, error } = await this.supabaseClient
            .from('schedule_projects')
            .insert(insertData)
            .select('*')
            .single()

        if (error) {
            console.error('Error creating schedule project:', error)
            throw new Error('Failed to create schedule project')
        }

        return scheduleProject
    }

    async updateScheduleProject(
        scheduleId: string,
        companyId: string,
        data: {
            title?: string
            description?: string
            startDate?: string
            endDate?: string
            startTime?: string
            endTime?: string
            assignedProjectMemberIds?: string[]
            tradeRequired?: string
            status?: 'planned' | 'in_progress' | 'completed' | 'delayed' | 'cancelled'
            priority?: 'low' | 'medium' | 'high' | 'critical'
            progressPercentage?: number
            estimatedHours?: number
            actualHours?: number
            location?: string
            notes?: string
            dependsOn?: string[]
        }
    ) {
        const updateData: any = {
            updated_at: new Date().toISOString(),
        }

        // Only include fields that are provided
        if (data.title !== undefined) updateData.title = data.title
        if (data.description !== undefined) updateData.description = data.description
        if (data.startDate !== undefined) updateData.start_date = data.startDate
        if (data.endDate !== undefined) updateData.end_date = data.endDate
        if (data.startTime !== undefined) updateData.start_time = data.startTime
        if (data.endTime !== undefined) updateData.end_time = data.endTime
        if (data.assignedProjectMemberIds !== undefined) updateData.assigned_project_member_ids = data.assignedProjectMemberIds
        if (data.tradeRequired !== undefined) updateData.trade_required = data.tradeRequired
        if (data.status !== undefined) {
            updateData.status = data.status
            // Set completion timestamp when status changes to completed
            if (data.status === 'completed') {
                updateData.completed_at = new Date().toISOString()
            }
        }
        if (data.priority !== undefined) updateData.priority = data.priority
        if (data.progressPercentage !== undefined) updateData.progress_percentage = data.progressPercentage
        if (data.estimatedHours !== undefined) updateData.estimated_hours = data.estimatedHours
        if (data.actualHours !== undefined) updateData.actual_hours = data.actualHours
        if (data.location !== undefined) updateData.location = data.location
        if (data.notes !== undefined) updateData.notes = data.notes
        if (data.dependsOn !== undefined) updateData.depends_on = data.dependsOn

        const { data: scheduleProject, error } = await this.supabaseClient
            .from('schedule_projects')
            .update(updateData)
            .eq('id', scheduleId)
            .eq('company_id', companyId)
            .select('*')
            .single()

        if (error) {
            console.error('Error updating schedule project:', error)
            throw new Error('Failed to update schedule project')
        }

        return scheduleProject
    }

    async quickUpdateScheduleStatus(
        scheduleId: string,
        companyId: string,
        data: {
            status: 'planned' | 'in_progress' | 'completed' | 'delayed' | 'cancelled'
            progressPercentage?: number
            actualHours?: number
            notes?: string
        }
    ) {
        const updateData: any = {
            status: data.status,
            updated_at: new Date().toISOString(),
        }

        if (data.progressPercentage !== undefined) updateData.progress_percentage = data.progressPercentage
        if (data.actualHours !== undefined) updateData.actual_hours = data.actualHours
        if (data.notes !== undefined) updateData.notes = data.notes

        // Set completion timestamp when status changes to completed
        if (data.status === 'completed') {
            updateData.completed_at = new Date().toISOString()
            updateData.progress_percentage = 100
        }

        const { data: scheduleProject, error } = await this.supabaseClient
            .from('schedule_projects')
            .update(updateData)
            .eq('id', scheduleId)
            .eq('company_id', companyId)
            .select('*')
            .single()

        if (error) {
            console.error('Error updating schedule status:', error)
            throw new Error('Failed to update schedule status')
        }

        return scheduleProject
    }

    async deleteScheduleProject(scheduleId: string, companyId: string) {
        const { error } = await this.supabaseClient
            .from('schedule_projects')
            .delete()
            .eq('id', scheduleId)
            .eq('company_id', companyId)

        if (error) {
            console.error('Error deleting schedule project:', error)
            throw new Error('Failed to delete schedule project')
        }

        return { success: true }
    }

    // ==============================================
    // SCHEDULE PROJECT QUERY OPERATIONS
    // ==============================================

    async getScheduleProjects(
        companyId: string,
        options: {
            projectId?: string
            status?: 'planned' | 'in_progress' | 'completed' | 'delayed' | 'cancelled'
            priority?: 'low' | 'medium' | 'high' | 'critical'
            tradeRequired?: string
            assignedToUserId?: string
            startDateFrom?: string
            startDateTo?: string
            search?: string
            limit?: number
            offset?: number
            sortBy?: 'title' | 'startDate' | 'endDate' | 'status' | 'priority' | 'createdAt'
            sortOrder?: 'asc' | 'desc'
        } = {}
    ) {
        let query = this.supabaseClient
            .from('schedule_projects')
            .select(`
                *,
                project:projects(id, name, status),
                creator:users!created_by(first_name, last_name)
            `)
            .eq('company_id', companyId)

        // Apply filters (keep all existing filter logic)
        if (options.projectId) {
            query = query.eq('project_id', options.projectId)
        }

        if (options.status) {
            query = query.eq('status', options.status)
        }

        if (options.priority) {
            query = query.eq('priority', options.priority)
        }

        if (options.tradeRequired) {
            query = query.eq('trade_required', options.tradeRequired)
        }

        if (options.startDateFrom) {
            query = query.gte('start_date', options.startDateFrom)
        }

        if (options.startDateTo) {
            query = query.lte('start_date', options.startDateTo)
        }

        // Search functionality
        if (options.search) {
            query = query.or(`title.ilike.%${options.search}%, description.ilike.%${options.search}%, location.ilike.%${options.search}%`)
        }

        // Filter by assigned user (check if user ID is in assignedProjectMemberIds)
        if (options.assignedToUserId) {
            // First get project_member IDs for this user
            const { data: userProjectMembers } = await this.supabaseClient
                .from('project_members')
                .select('id')
                .eq('user_id', options.assignedToUserId)
                .eq('company_id', companyId)
                .eq('status', 'active')

            if (userProjectMembers && userProjectMembers.length > 0) {
                const projectMemberIds = userProjectMembers.map(pm => pm.id)
                // Use overlaps operator to check if any of the user's project_member IDs are in the array
                query = query.overlaps('assigned_project_member_ids', projectMemberIds)
            } else {
                // User has no active project assignments, return empty results
                return { data: [], totalCount: 0 }
            }
        }

        // Apply sorting
        const sortField = options.sortBy ? ({
            'startDate': 'start_date',
            'endDate': 'end_date',
            'createdAt': 'created_at',
            'title': 'title',
            'status': 'status',
            'priority': 'priority'
        }[options.sortBy] || 'start_date') : 'start_date'
        const sortOrder = options.sortOrder || 'asc'
        query = query.order(sortField, { ascending: sortOrder === 'asc' })

        // Apply pagination
        const limit = options.limit || 20
        const offset = options.offset || 0
        query = query.range(offset, offset + limit - 1)

        const { data: scheduleProjects, error, count } = await query

        if (error) {
            console.error('Error fetching schedule projects:', error)
            throw new Error('Failed to fetch schedule projects')
        }

        // Get assigned members for each schedule project
        const scheduleProjectsWithMembers = await Promise.all(
            (scheduleProjects || []).map(async (scheduleProject) => {
                const assignedMembers = await this.getAssignedMembersForScheduleProject(scheduleProject.assigned_project_member_ids)
                return {
                    ...scheduleProject,
                    assignedMembers
                }
            })
        )

        return {
            data: scheduleProjectsWithMembers as ScheduleProjectWithDetails[],
            totalCount: count || 0
        }
    }

    async getScheduleProjectById(scheduleId: string, companyId: string): Promise<ScheduleProjectWithDetails | null> {
        const { data: scheduleProject, error } = await this.supabaseClient
            .from('schedule_projects')
            .select(`
                *,
                project:projects(id, name, status),
                creator:users!created_by(first_name, last_name)
            `)
            .eq('id', scheduleId)
            .eq('company_id', companyId)
            .single()

        if (error) {
            console.error('Error fetching schedule project:', error)
            return null
        }

        if (!scheduleProject) {
            return null
        }

        // Get assigned members
        const assignedMembers = await this.getAssignedMembersForScheduleProject(scheduleProject.assigned_project_member_ids)

        return {
            ...scheduleProject,
            assignedMembers
        } as ScheduleProjectWithDetails
    }

    // ==============================================
    // HELPER METHODS
    // ==============================================

    async checkScheduleProjectExists(scheduleId: string, companyId: string): Promise<boolean> {
        const { data, error } = await this.supabaseClient
            .from('schedule_projects')
            .select('id')
            .eq('id', scheduleId)
            .eq('company_id', companyId)
            .single()

        if (error) {
            return false
        }

        return !!data
    }

    async getAssignedMembersForScheduleProject(assignedProjectMemberIds: string[]) {
        if (!assignedProjectMemberIds || assignedProjectMemberIds.length === 0) {
            return []
        }

        try {
            // First try as project member IDs
            const { data: projectMembers, error: pmError } = await this.supabaseClient
                .from('project_members')
                .select('id, user_id, project_id, status, company_id')
                .in('id', assignedProjectMemberIds)
                .eq('status', 'active')

            if (!pmError && projectMembers && projectMembers.length > 0) {
                const userIds = projectMembers.map(pm => pm.user_id)
                const { data: users } = await this.supabaseClient
                    .from('users')
                    .select('id, first_name, last_name, trade_specialty, role')
                    .in('id', userIds)

                return this.formatMemberData(projectMembers, users || [])
            }

            // If not found, try as user IDs
            const { data: projectMembersByUserId, error: userIdError } = await this.supabaseClient
                .from('project_members')
                .select('id, user_id, project_id, status, company_id')
                .in('user_id', assignedProjectMemberIds)
                .eq('status', 'active')

            if (!userIdError && projectMembersByUserId && projectMembersByUserId.length > 0) {
                const { data: users } = await this.supabaseClient
                    .from('users')
                    .select('id, first_name, last_name, trade_specialty, role')
                    .in('id', assignedProjectMemberIds)

                return this.formatMemberData(projectMembersByUserId, users || [])
            }

            // Fallback: direct user lookup
            const { data: users, error: directUserError } = await this.supabaseClient
                .from('users')
                .select('id, first_name, last_name, trade_specialty, role')
                .in('id', assignedProjectMemberIds)

            if (!directUserError && users && users.length > 0) {
                const mockProjectMembers = users.map(user => ({
                    id: `user-${user.id}`,
                    user_id: user.id,
                    project_id: null,
                    status: 'active',
                    company_id: null
                }))

                return this.formatMemberData(mockProjectMembers, users)
            }

            return []

        } catch (error) {
            console.error('Error in getAssignedMembersForScheduleProject:', error)
            return []
        }
    }

    // Add this helper method to the same class
    private formatMemberData(projectMembers: any[], users: any[]) {
        return projectMembers.map(member => {
            const user = users.find(u => u.id === member.user_id)
            return {
                id: member.id,
                userId: member.user_id,
                projectId: member.project_id,
                status: member.status,
                user: user ? {
                    id: user.id,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    tradeSpecialty: user.trade_specialty,
                    role: user.role
                } : null
            }
        }).filter(member => member.user !== null)
    }



    async getProjectMembersForProject(projectId: string, companyId: string) {
        const { data: projectMembers, error } = await this.supabaseClient
            .from('project_members')
            .select(`
            id,
            user_id,
            user:users!user_id(first_name, last_name, trade_specialty),
            hourly_rate,
            status
        `)
            .eq('project_id', projectId)
            .eq('company_id', companyId)
            .eq('status', 'active')

        if (error) {
            console.error('Error fetching project members:', error)
            throw new Error('Failed to fetch project members')
        }

        return projectMembers || []
    }

    async getTodaysScheduleForUser(userId: string, companyId: string) {
        const today = new Date().toISOString().split('T')[0]

        // First get user's project member IDs
        const { data: userProjectMembers } = await this.supabaseClient
            .from('project_members')
            .select('id')
            .eq('user_id', userId)
            .eq('company_id', companyId)
            .eq('status', 'active')

        if (!userProjectMembers || userProjectMembers.length === 0) {
            return []
        }

        const projectMemberIds = userProjectMembers.map(pm => pm.id)

        const { data: todaysSchedule, error } = await this.supabaseClient
            .from('schedule_projects')
            .select(`
                *,
                project:projects(id, name, status)
            `)
            .eq('company_id', companyId)
            .overlaps('assigned_project_member_ids', projectMemberIds)
            .lte('start_date', today)
            .gte('end_date', today)
            .order('start_time', { ascending: true })

        if (error) {
            console.error('Error fetching today\'s schedule:', error)
            return []
        }

        return todaysSchedule || []
    }

    async getUpcomingScheduleForUser(userId: string, companyId: string, days = 7) {
        const today = new Date()
        const futureDate = new Date(today.getTime() + (days * 24 * 60 * 60 * 1000))

        const todayStr = today.toISOString().split('T')[0]
        const futureDateStr = futureDate.toISOString().split('T')[0]

        // First get user's project member IDs
        const { data: userProjectMembers } = await this.supabaseClient
            .from('project_members')
            .select('id')
            .eq('user_id', userId)
            .eq('company_id', companyId)
            .eq('status', 'active')

        if (!userProjectMembers || userProjectMembers.length === 0) {
            return []
        }

        const projectMemberIds = userProjectMembers.map(pm => pm.id)

        const { data: upcomingSchedule, error } = await this.supabaseClient
            .from('schedule_projects')
            .select(`
                *,
                project:projects(id, name, status)
            `)
            .eq('company_id', companyId)
            .overlaps('assigned_project_member_ids', projectMemberIds)
            .gte('start_date', todayStr)
            .lte('start_date', futureDateStr)
            .order('start_date', { ascending: true })
            .order('start_time', { ascending: true })

        if (error) {
            console.error('Error fetching upcoming schedule:', error)
            return []
        }

        return upcomingSchedule || []
    }

    async getScheduleStatsForProject(projectId: string, companyId: string) {
        const { data: stats, error } = await this.supabaseClient
            .from('schedule_projects')
            .select('status, priority')
            .eq('project_id', projectId)
            .eq('company_id', companyId)

        if (error) {
            console.error('Error fetching schedule stats:', error)
            return {
                total: 0,
                planned: 0,
                inProgress: 0,
                completed: 0,
                delayed: 0,
                cancelled: 0,
                highPriority: 0,
                critical: 0
            }
        }

        const statsData = stats || []

        return {
            total: statsData.length,
            planned: statsData.filter(s => s.status === 'planned').length,
            inProgress: statsData.filter(s => s.status === 'in_progress').length,
            completed: statsData.filter(s => s.status === 'completed').length,
            delayed: statsData.filter(s => s.status === 'delayed').length,
            cancelled: statsData.filter(s => s.status === 'cancelled').length,
            highPriority: statsData.filter(s => s.priority === 'high').length,
            critical: statsData.filter(s => s.priority === 'critical').length
        }
    }

    async getScheduleStatsForCompany(companyId: string) {
        const { data: stats, error } = await this.supabaseClient
            .from('schedule_projects')
            .select('status, priority, start_date')
            .eq('company_id', companyId)

        if (error) {
            console.error('Error fetching company schedule stats:', error)
            return {
                total: 0,
                planned: 0,
                inProgress: 0,
                completed: 0,
                delayed: 0,
                cancelled: 0,
                todaysWork: 0,
                thisWeeksWork: 0,
                overdue: 0
            }
        }

        const statsData = stats || []
        const today = new Date().toISOString().split('T')[0]
        const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

        return {
            total: statsData.length,
            planned: statsData.filter(s => s.status === 'planned').length,
            inProgress: statsData.filter(s => s.status === 'in_progress').length,
            completed: statsData.filter(s => s.status === 'completed').length,
            delayed: statsData.filter(s => s.status === 'delayed').length,
            cancelled: statsData.filter(s => s.status === 'cancelled').length,
            todaysWork: statsData.filter(s => s.start_date === today).length,
            thisWeeksWork: statsData.filter(s => s.start_date >= today && s.start_date <= weekFromNow).length,
            overdue: statsData.filter(s => s.start_date < today && ['planned', 'in_progress', 'delayed'].includes(s.status)).length
        }
    }

    // ==============================================
    // NEW METHODS FOR STATUS COORDINATION
    // ==============================================


    /**
     * Get all schedule projects for a specific project (for cascade operations)
    */
    async getScheduleProjectsByProject(
        projectId: string,
        companyId: string,
        options?: {
            status?: ('planned' | 'in_progress' | 'completed' | 'delayed' | 'cancelled')[]
            includeInactive?: boolean
        }
    ) {
        let query = this.supabaseClient
            .from('schedule_projects')
            .select(`
            *,
            project:projects!inner(
                id,
                name,
                status
            ),
            creator:users!schedule_projects_created_by_fkey(
                id,
                first_name,
                last_name,
                email
            )
        `)
            .eq('project_id', projectId)
            .eq('company_id', companyId)

        // Apply status filter if provided
        if (options?.status && options.status.length > 0) {
            query = query.in('status', options.status)
        }

        // Order by start date
        query = query.order('start_date', { ascending: true })

        const { data: scheduleProjects, error } = await query

        if (error) {
            console.error('Error fetching schedule projects by project:', error)
            throw new Error('Failed to fetch schedule projects')
        }

        return scheduleProjects || []
    }

    /**
     * Check if schedule project can be completed (considering dependencies and blocking items)
     */
    async canCompleteScheduleProject(
        scheduleProjectId: string,
        companyId: string
    ): Promise<{
        canComplete: boolean
        blockingReasons: string[]
        dependencyStatus: { completed: number; total: number }
    }> {
        try {
            // Get schedule project details
            const scheduleProject = await this.getScheduleProjectById(scheduleProjectId, companyId)
            if (!scheduleProject) {
                return {
                    canComplete: false,
                    blockingReasons: ['Schedule project not found'],
                    dependencyStatus: { completed: 0, total: 0 }
                }
            }

            const blockingReasons = []

            // Check dependencies
            if (scheduleProject.dependsOn && scheduleProject.dependsOn.length > 0) {
                const { data: dependencies } = await this.supabaseClient
                    .from('schedule_projects')
                    .select('id, title, status')
                    .in('id', scheduleProject.dependsOn)
                    .eq('company_id', companyId)

                const incompleteDependencies = dependencies?.filter(dep =>
                    dep.status !== 'completed'
                ) || []

                if (incompleteDependencies.length > 0) {
                    blockingReasons.push(
                        `${incompleteDependencies.length} dependency(ies) not completed: ${incompleteDependencies.map(d => d.title).join(', ')
                        }`
                    )
                }

                const dependencyStatus = {
                    completed: (dependencies?.length || 0) - incompleteDependencies.length,
                    total: dependencies?.length || 0
                }

                return {
                    canComplete: blockingReasons.length === 0,
                    blockingReasons,
                    dependencyStatus
                }
            }

            return {
                canComplete: true,
                blockingReasons: [],
                dependencyStatus: { completed: 0, total: 0 }
            }

        } catch (error) {
            console.error('Error checking schedule project completion eligibility:', error)
            return {
                canComplete: false,
                blockingReasons: ['Error checking completion eligibility'],
                dependencyStatus: { completed: 0, total: 0 }
            }
        }
    }

    /**
     * Update schedule project status with coordination hooks
     */
    async updateScheduleProjectStatusCoordinated(
        scheduleId: string,
        companyId: string,
        data: {
            status: 'planned' | 'in_progress' | 'completed' | 'delayed' | 'cancelled'
            progressPercentage?: number
            actualHours?: number
            notes?: string
            skipValidation?: boolean
            triggeredBy?: 'user' | 'project_cascade' | 'dependency' | 'admin_bulk'
        }
    ) {
        // Validate completion eligibility if status is 'completed'
        if (data.status === 'completed' && !data.skipValidation) {
            const eligibility = await this.canCompleteScheduleProject(scheduleId, companyId)
            if (!eligibility.canComplete) {
                throw new Error(
                    `Cannot complete schedule project: ${eligibility.blockingReasons.join(', ')}`
                )
            }
        }

        // Prepare update data
        const updateData: any = {
            status: data.status,
            updated_at: new Date().toISOString(),
        }

        if (data.progressPercentage !== undefined) updateData.progress_percentage = data.progressPercentage
        if (data.actualHours !== undefined) updateData.actual_hours = data.actualHours
        if (data.notes !== undefined) updateData.notes = data.notes

        // Set completion timestamp when status changes to completed
        if (data.status === 'completed') {
            updateData.completed_at = new Date().toISOString()
            updateData.progress_percentage = 100
        }

        const { data: scheduleProject, error } = await this.supabaseClient
            .from('schedule_projects')
            .update(updateData)
            .eq('id', scheduleId)
            .eq('company_id', companyId)
            .select('*')
            .single()

        if (error) {
            console.error('Error updating schedule project status:', error)
            throw new Error('Failed to update schedule project status')
        }

        return scheduleProject
    }

    /**
     * Remove team member from all schedule project assignments - FIXED
     */
    async removeTeamMemberFromAllScheduleProjects(
        userId: string,
        companyId: string
    ): Promise<{
        removedCount: number
        affectedScheduleProjects: string[]
    }> {
        try {
            // FIXED: First get project member IDs for this user
            const { data: projectMembers, error: fetchProjectMembersError } = await this.supabaseClient
                .from('project_members')
                .select('id')
                .eq('user_id', userId)
                .eq('company_id', companyId)

            if (fetchProjectMembersError) {
                console.error('Error fetching project members:', fetchProjectMembersError)
                throw fetchProjectMembersError
            }

            if (!projectMembers || projectMembers.length === 0) {
                return { removedCount: 0, affectedScheduleProjects: [] }
            }

            const projectMemberIds = projectMembers.map(pm => pm.id)

            // FIXED: Find schedule projects where this user is assigned via project member IDs
            const { data: affectedProjects, error: fetchError } = await this.supabaseClient
                .from('schedule_projects')
                .select('id, title, assigned_project_member_ids')
                .eq('company_id', companyId)
                .filter('assigned_project_member_ids', 'ov', projectMemberIds) // overlaps

            if (fetchError) {
                console.error('Error fetching affected schedule projects:', fetchError)
                throw fetchError
            }

            if (!affectedProjects || affectedProjects.length === 0) {
                return { removedCount: 0, affectedScheduleProjects: [] }
            }

            let removedCount = 0
            const affectedIds = []

            // Update each schedule project to remove the project member IDs
            for (const project of affectedProjects) {
                const newAssignedMembers = (project.assigned_project_member_ids || []).filter(
                    (memberId: string) => !projectMemberIds.includes(memberId)
                )

                const { error: updateError } = await this.supabaseClient
                    .from('schedule_projects')
                    .update({
                        assigned_project_member_ids: newAssignedMembers,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', project.id)
                    .eq('company_id', companyId)

                if (updateError) {
                    console.error(`Error removing user from schedule project ${project.id}:`, updateError)
                } else {
                    removedCount++
                    affectedIds.push(project.id)
                }
            }

            return { removedCount, affectedScheduleProjects: affectedIds }

        } catch (error) {
            console.error('Error removing team member from schedule projects:', error)
            return { removedCount: 0, affectedScheduleProjects: [] }
        }
    }

    /**
     * Get schedule project statistics for a project
     */
    async getScheduleProjectStatsByProject(
        projectId: string,
        companyId: string
    ): Promise<{
        total: number
        byStatus: Record<string, number>
        overallProgress: number
        estimatedHours: number
        actualHours: number
    }> {
        const { data: scheduleProjects, error } = await this.supabaseClient
            .from('schedule_projects')
            .select('status, progress_percentage, estimated_hours, actual_hours')
            .eq('project_id', projectId)
            .eq('company_id', companyId)

        if (error) {
            console.error('Error fetching schedule project stats:', error)
            return {
                total: 0,
                byStatus: {},
                overallProgress: 0,
                estimatedHours: 0,
                actualHours: 0
            }
        }

        const stats = {
            total: scheduleProjects.length,
            byStatus: {} as Record<string, number>,
            overallProgress: 0,
            estimatedHours: 0,
            actualHours: 0
        }

        // Calculate statistics
        scheduleProjects.forEach(sp => {
            // Count by status
            stats.byStatus[sp.status] = (stats.byStatus[sp.status] || 0) + 1

            // Sum hours
            stats.estimatedHours += Number(sp.estimated_hours || 0)
            stats.actualHours += Number(sp.actual_hours || 0)
        })

        // Calculate overall progress (weighted average)
        if (scheduleProjects.length > 0) {
            const totalProgress = scheduleProjects.reduce((sum, sp) =>
                sum + Number(sp.progress_percentage || 0), 0
            )
            stats.overallProgress = totalProgress / scheduleProjects.length
        }

        return stats
    }

    /**
     * Batch update multiple schedule projects (for cascade operations)
     */
    async batchUpdateScheduleProjectStatus(
        updates: Array<{
            id: string
            status: 'planned' | 'in_progress' | 'completed' | 'delayed' | 'cancelled'
            notes?: string
        }>,
        companyId: string,
        triggeredBy: 'project_cascade' | 'admin_bulk' = 'project_cascade'  // ← This is correct now
    ): Promise<{
        success: number
        failed: number
        results: Array<{ id: string; success: boolean; error?: string }>
    }> {
        const results = []
        let successCount = 0
        let failedCount = 0

        for (const update of updates) {
            try {
                await this.updateScheduleProjectStatusCoordinated(
                    update.id,
                    companyId,
                    {
                        status: update.status,
                        notes: update.notes || `Batch updated via ${triggeredBy}`,
                        skipValidation: triggeredBy === 'project_cascade',
                        triggeredBy
                    }
                )

                results.push({ id: update.id, success: true })
                successCount++
            } catch (error) {
                results.push({
                    id: update.id,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                })
                failedCount++
            }
        }

        return {
            success: successCount,
            failed: failedCount,
            results
        }
    }


    // ==============================================
    // DEPENDENCY MANAGEMENT
    // ==============================================

    async validateDependencies(scheduleId: string, dependsOn: string[], companyId: string): Promise<boolean> {
        // Check if all dependency IDs exist and belong to the same company
        if (!dependsOn || dependsOn.length === 0) {
            return true
        }

        const { data: dependencies, error } = await this.supabaseClient
            .from('schedule_projects')
            .select('id, status')
            .in('id', dependsOn)
            .eq('company_id', companyId)

        if (error) {
            console.error('Error validating dependencies:', error)
            return false
        }

        // Check if all dependencies exist
        if (!dependencies || dependencies.length !== dependsOn.length) {
            return false
        }

        // Check for circular dependencies
        return await this.checkCircularDependencies(scheduleId, dependsOn, companyId)
    }

    private async checkCircularDependencies(scheduleId: string, dependsOn: string[], companyId: string): Promise<boolean> {
        // Simple circular dependency check - this could be enhanced for more complex scenarios
        const visited = new Set<string>()
        const inProgress = new Set<string>()

        const hasCycle = async (currentId: string): Promise<boolean> => {
            if (inProgress.has(currentId)) {
                return true // Found a cycle
            }

            if (visited.has(currentId)) {
                return false // Already processed
            }

            visited.add(currentId)
            inProgress.add(currentId)

            // Get dependencies for current schedule
            const { data: schedule } = await this.supabaseClient
                .from('schedule_projects')
                .select('depends_on')
                .eq('id', currentId)
                .eq('company_id', companyId)
                .single()

            if (schedule?.depends_on) {
                for (const depId of schedule.depends_on) {
                    if (await hasCycle(depId)) {
                        return true
                    }
                }
            }

            inProgress.delete(currentId)
            return false
        }

        // Check if adding these dependencies would create a cycle
        for (const depId of dependsOn) {
            if (await hasCycle(depId)) {
                return false
            }
        }

        return true
    }

    async getDependentScheduleProjects(scheduleId: string, companyId: string): Promise<DependentScheduleProject[]> {
        const { data: dependentSchedules, error } = await this.supabaseClient
            .from('schedule_projects')
            .select(`
                id,
                title,
                status,
                start_date,
                end_date,
                project:projects!inner(name)
            `)
            .eq('company_id', companyId)
            .contains('depends_on', [scheduleId])

        if (error) {
            console.error('Error fetching dependent schedules:', error)
            return []
        }

        // Transform the data to ensure project is a single object, not array
        const transformedSchedules = (dependentSchedules || []).map(schedule => ({
            ...schedule,
            project: Array.isArray(schedule.project) ? schedule.project[0] : schedule.project
        })) as DependentScheduleProject[]

        return transformedSchedules
    }
}