// ==============================================
// lib/database/services/status-coordinator.ts - FIXED VERSION
// ==============================================

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'
import { ProjectDatabaseService } from './projects'
import { ScheduleProjectDatabaseService } from './schedule-projects'
import { PunchlistItemDatabaseService } from './punchlist-items'
import { TeamMemberDatabaseService } from './team-members'

// ==============================================
// STATUS COORDINATOR SERVICE - FIXED
// ==============================================
export class StatusCoordinatorService {
    private supabaseClient: SupabaseClient
    private projectService: ProjectDatabaseService
    private scheduleService: ScheduleProjectDatabaseService
    private enableLogging: boolean
    private punchlistService: PunchlistItemDatabaseService
    private teamService: TeamMemberDatabaseService
    private enableCache: boolean

    constructor(enableLogging = false, enableCache = false) {
        this.enableLogging = enableLogging
        this.enableCache = enableCache

        // Initialize Supabase client
        this.supabaseClient = createClient(
            env.NEXT_PUBLIC_SUPABASE_URL,
            env.SUPABASE_SERVICE_ROLE_KEY,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // Initialize database services
        this.projectService = new ProjectDatabaseService(enableLogging, enableCache)
        this.scheduleService = new ScheduleProjectDatabaseService(enableLogging, enableCache)
        this.punchlistService = new PunchlistItemDatabaseService(enableLogging, enableCache)
        this.teamService = new TeamMemberDatabaseService(enableLogging, enableCache)
    }

    // ==============================================
    // PROJECT STATUS CASCADE OPERATIONS
    // ==============================================

    /**
     * Update project status with cascade to schedule projects
     */
    async updateProjectStatusWithCascade(
        projectId: string,
        companyId: string,
        newStatus: 'not_started' | 'in_progress' | 'on_track' | 'ahead_of_schedule' | 'behind_schedule' | 'on_hold' | 'completed' | 'cancelled',
        notes?: string,
        userId?: string
    ) {
        try {
            // 1. Update project status first
            const { data: updatedProject, error: projectError } = await this.supabaseClient
                .from('projects')
                .update({
                    status: newStatus,
                    updated_at: new Date().toISOString(),
                    // notes: notes || null
                })
                .eq('id', projectId)
                .eq('company_id', companyId)
                .select('*')
                .single()

            if (projectError) {
                throw new Error(`Failed to update project: ${projectError.message}`)
            }

            // 2. Get all schedule projects for this project
            const { data: scheduleProjects, error: scheduleError } = await this.supabaseClient
                .from('schedule_projects')
                .select('id, title, status, project_id')
                .eq('project_id', projectId)
                .eq('company_id', companyId)

            if (scheduleError) {
                console.error('Error fetching schedule projects:', scheduleError)
                return {
                    success: true,
                    data: {
                        project: updatedProject,
                        updatedCount: 0,
                        skippedCount: 0,
                        scheduleProjects: []
                    }
                }
            }

            // 3. Apply cascade rules
            const cascadeStatus = this.getScheduleStatusFromProjectStatus(newStatus)
            if (!cascadeStatus || !scheduleProjects || scheduleProjects.length === 0) {
                return {
                    success: true,
                    data: {
                        project: updatedProject,
                        updatedCount: 0,
                        skippedCount: scheduleProjects?.length || 0,
                        scheduleProjects: scheduleProjects || []
                    }
                }
            }

            // 4. Update schedule projects in batch
            let updatedCount = 0
            const updatedScheduleProjects = []

            for (const scheduleProject of scheduleProjects) {
                // Skip if already in target status
                if (scheduleProject.status === cascadeStatus) {
                    continue
                }

                try {
                    const { data: updatedSchedule, error: updateError } = await this.supabaseClient
                        .from('schedule_projects')
                        .update({
                            status: cascadeStatus,
                            updated_at: new Date().toISOString(),
                            notes: `Auto-updated from project status: ${newStatus}`
                        })
                        .eq('id', scheduleProject.id)
                        .eq('company_id', companyId)
                        .select('*')
                        .single()

                    if (!updateError && updatedSchedule) {
                        updatedCount++
                        updatedScheduleProjects.push(updatedSchedule)
                    }
                } catch (error) {
                    console.error(`Error updating schedule project ${scheduleProject.id}:`, error)
                }
            }

            return {
                success: true,
                data: {
                    project: updatedProject,
                    updatedCount,
                    skippedCount: scheduleProjects.length - updatedCount,
                    scheduleProjects: updatedScheduleProjects
                }
            }

        } catch (error) {
            console.error('Error in project status cascade:', error)
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            }
        }
    }
    /**
     * Apply cascade rules from project to schedule projects
     */
    private async applyCascadeRules(
        projectStatus: string,
        scheduleProjects: any[],
        companyId: string,
        userId?: string
    ) {
        const updatedScheduleProjects = []
        let updatedCount = 0
        let skippedCount = 0

        for (const scheduleProject of scheduleProjects) {
            const currentStatus = scheduleProject.status
            let newScheduleStatus = null

            // Apply status flow rules from your document
            switch (projectStatus) {
                case 'not_started':
                    // Schedule projects should be planned when project not started
                    if (currentStatus === 'in_progress') {
                        newScheduleStatus = 'planned'
                    }
                    break

                case 'in_progress':
                case 'on_track':
                case 'ahead_of_schedule':
                case 'behind_schedule':
                    // Allow schedule projects to be in progress when project is active
                    // No forced changes needed
                    break

                case 'completed':
                    // All schedule projects should be completed when project completes
                    if (currentStatus !== 'completed' && currentStatus !== 'cancelled') {
                        newScheduleStatus = 'completed'
                    }
                    break

                case 'cancelled':
                    // All schedule projects should be cancelled when project cancels
                    if (currentStatus !== 'cancelled' && currentStatus !== 'completed') {
                        newScheduleStatus = 'cancelled'
                    }
                    break

                case 'on_hold':
                    // Schedule projects should be delayed when project on hold
                    if (currentStatus === 'in_progress' || currentStatus === 'planned') {
                        newScheduleStatus = 'delayed'
                    }
                    break

                default:
                    break
            }

            // Update schedule project if status change needed
            if (newScheduleStatus && newScheduleStatus !== currentStatus) {
                try {
                    const updatedScheduleProject = await this.scheduleService.quickUpdateScheduleStatus(
                        scheduleProject.id,
                        companyId,
                        {
                            status: newScheduleStatus as any,
                            notes: `Auto-updated due to project status change to ${projectStatus}`
                        }
                    )
                    updatedScheduleProjects.push(updatedScheduleProject)
                    updatedCount++
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
                    console.error(`❌ Failed to update schedule project ${scheduleProject.id}:`, errorMessage)
                    skippedCount++
                }
            } else {
                skippedCount++
            }
        }

        return {
            updatedScheduleProjects,
            updatedCount,
            skippedCount
        }
    }

    // ==============================================
    // SCHEDULE PROJECT REVERSE SYNC OPERATIONS
    // ==============================================

    /**
     * Update schedule project status with reverse sync to project
     */
    async updateScheduleProjectStatusWithSync(
        scheduleProjectId: string,
        companyId: string,
        newStatus: 'planned' | 'in_progress' | 'completed' | 'delayed' | 'cancelled',
        progressPercentage?: number,
        actualHours?: number,
        notes?: string,
        userId?: string
    ) {
        if (this.enableLogging) {
            console.log(`🔄 StatusCoordinator: Updating schedule project ${scheduleProjectId} to ${newStatus}`)
        }

        try {
            // Step 1: Update the schedule project status
            const updatedScheduleProject = await this.scheduleService.quickUpdateScheduleStatus(
                scheduleProjectId,
                companyId,
                {
                    status: newStatus,
                    progressPercentage,
                    actualHours,
                    notes
                }
            )

            // Step 2: Get schedule project details to find parent project
            const scheduleProjectDetails = await this.scheduleService.getScheduleProjectById(
                scheduleProjectId,
                companyId
            )

            if (!scheduleProjectDetails) {
                throw new Error('Schedule project not found')
            }

            // Step 3: Check if parent project status should be updated
            const projectSyncResult = await this.syncProjectFromScheduleProjects(
                scheduleProjectDetails.projectId,
                companyId,
                userId
            )

            if (this.enableLogging) {
                console.log(`✅ StatusCoordinator: Schedule project updated, project sync result:`, projectSyncResult)
            }

            return {
                success: true,
                data: {
                    scheduleProject: updatedScheduleProject,
                    projectSync: projectSyncResult
                },
                message: `Schedule project status updated to ${newStatus}.`
            }

        } catch (error) {
            console.error('❌ StatusCoordinator: Schedule project sync failed:', error)
            throw error
        }
    }
    
    async syncProjectFromScheduleProjects(
        projectId: string,
        companyId: string,
        userId?: string
    ) {
        try {
            // Get current project
            const project = await this.projectService.getProjectByIdEnhanced(projectId, companyId)
            if (!project) {
                return { updated: false, reason: 'Project not found' }
            }

            // Get all schedule projects for this project
            const scheduleProjects = await this.getScheduleProjectsByProject(
                projectId,
                companyId
            )

            if (scheduleProjects.length === 0) {
                return { updated: false, reason: 'No schedule projects found' }
            }

            // Analyze schedule project statuses
            const statusCounts = scheduleProjects.reduce((acc, sp) => {
                acc[sp.status] = (acc[sp.status] || 0) + 1
                return acc
            }, {} as Record<string, number>)

            const total = scheduleProjects.length
            const completed = statusCounts.completed || 0
            const inProgress = statusCounts.in_progress || 0
            const planned = statusCounts.planned || 0
            const cancelled = statusCounts.cancelled || 0

            let newProjectStatus = null

            // Apply reverse sync rules
            if (completed === total) {
                if (project.status !== 'completed') {
                    newProjectStatus = 'completed'
                }
            } else if (inProgress > 0 || completed > 0) {
                if (project.status === 'not_started') {
                    newProjectStatus = 'in_progress'
                }
            } else if (cancelled === total) {
                if (project.status !== 'cancelled' && project.status !== 'completed') {
                    newProjectStatus = 'cancelled'
                }
            }

            // Update project status if needed
            if (newProjectStatus) {
                // ✅ FIXED: Prepare update data WITHOUT notes field
                const updateData: any = {
                    status: newProjectStatus,
                    updated_at: new Date().toISOString()
                    // ❌ REMOVED: notes field since projects table doesn't have it
                    // notes: `Auto-updated based on schedule project progress`
                }

                // Add userId to update data if provided (for audit trail)
                if (userId) {
                    updateData.updated_by = userId
                }

                const { error: updateError } = await this.supabaseClient
                    .from('projects')
                    .update(updateData)
                    .eq('id', projectId)
                    .eq('company_id', companyId)

                if (updateError) {
                    return { updated: false, reason: updateError.message }
                }

                return {
                    updated: true,
                    previousStatus: project.status,
                    newStatus: newProjectStatus,
                    reason: `Based on schedule projects: ${JSON.stringify(statusCounts)}`,
                    updatedBy: userId || 'system'
                }
            }

            return {
                updated: false,
                reason: `No status change needed. Current: ${project.status}, Schedule counts: ${JSON.stringify(statusCounts)}`
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            console.error('Error syncing project from schedule projects:', errorMessage)
            return { updated: false, reason: errorMessage }
        }
    }


    /**
     * Sync parent project status based on schedule projects
     */
    // private async syncProjectFromScheduleProjects(
    //     projectId: string,
    //     companyId: string,
    //     userId?: string
    // ) {
    //     try {
    //         // Get current project
    //         const project = await this.projectService.getProjectByIdEnhanced(projectId, companyId)
    //         if (!project) {
    //             return { updated: false, reason: 'Project not found' }
    //         }

    //         // Get all schedule projects for this project
    //         const scheduleProjects = await this.getScheduleProjectsByProject(
    //             projectId,
    //             companyId
    //         )

    //         if (scheduleProjects.length === 0) {
    //             return { updated: false, reason: 'No schedule projects found' }
    //         }

    //         // Analyze schedule project statuses
    //         const statusCounts = scheduleProjects.reduce((acc, sp) => {
    //             acc[sp.status] = (acc[sp.status] || 0) + 1
    //             return acc
    //         }, {} as Record<string, number>)

    //         const total = scheduleProjects.length
    //         const completed = statusCounts.completed || 0
    //         const inProgress = statusCounts.in_progress || 0
    //         const planned = statusCounts.planned || 0
    //         const cancelled = statusCounts.cancelled || 0

    //         let newProjectStatus = null

    //         // Apply reverse sync rules
    //         if (completed === total) {
    //             // All schedule projects completed -> project should be completed
    //             if (project.status !== 'completed') {
    //                 newProjectStatus = 'completed'
    //             }
    //         } else if (inProgress > 0 || completed > 0) {
    //             // Some work in progress -> project should be in_progress
    //             if (project.status === 'not_started') {
    //                 newProjectStatus = 'in_progress'
    //             }
    //         } else if (cancelled === total) {
    //             // All schedule projects cancelled -> project might be cancelled
    //             if (project.status !== 'cancelled' && project.status !== 'completed') {
    //                 newProjectStatus = 'cancelled'
    //             }
    //         }

    //         // Update project status if needed
    //         if (newProjectStatus) {
    //             await this.projectService.updateProjectStatus(
    //                 projectId,
    //                 companyId,
    //                 newProjectStatus as any,
    //                 `Auto-updated based on schedule project progress`
    //             )

    //             return {
    //                 updated: true,
    //                 previousStatus: project.status,
    //                 newStatus: newProjectStatus,
    //                 reason: `Based on schedule projects: ${JSON.stringify(statusCounts)}`
    //             }
    //         }

    //         return {
    //             updated: false,
    //             reason: `No status change needed. Current: ${project.status}, Schedule counts: ${JSON.stringify(statusCounts)}`
    //         }

    //     } catch (error) {
    //         const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    //         console.error('❌ Error syncing project from schedule projects:', errorMessage)
    //         return { updated: false, reason: errorMessage }
    //     }
    // }

    // ==============================================
    // TEAM MEMBER DEACTIVATION CASCADE - FIXED
    // ==============================================

    /**
     * Deactivate team member and remove all assignments
     */
    async deactivateTeamMemberWithCascade(
        userId: string,
        companyId: string,
        reason?: string,
        adminUserId?: string
    ) {
        try {
            // 1. Deactivate the user
            const { data: updatedUser, error: userError } = await this.supabaseClient
                .from('users')
                .update({
                    is_active: false,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId)
                .eq('company_id', companyId)
                .select('*')
                .single()

            if (userError) {
                throw new Error(`Failed to deactivate user: ${userError.message}`)
            }

            // 2. Remove from all assignments
            const projectResults = await this.removeFromAllProjectAssignments(userId, companyId)
            const scheduleResults = await this.removeFromAllScheduleAssignments(userId, companyId)
            const punchlistResults = await this.removeFromAllPunchlistAssignments(userId, companyId)

            return {
                success: true,
                data: {
                    user: updatedUser,
                    removedAssignments: {
                        projects: projectResults.removedCount,
                        scheduleProjects: scheduleResults.removedCount,
                        punchlistItems: punchlistResults.removedCount
                    }
                }
            }

        } catch (error) {
            console.error('Error in team member deactivation cascade:', error)
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            }
        }
    }

    /**
     * Remove team member from all project assignments
     */
    private async removeFromAllProjectAssignments(userId: string, companyId: string) {
        try {
            // Deactivate project memberships
            const { error } = await this.supabaseClient
                .from('project_members')
                .update({
                    status: 'inactive',
                    left_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', userId)
                .eq('company_id', companyId)
                .eq('status', 'active')

            if (error) {
                console.error('Error removing project assignments:', error)
                return { removedCount: 0 }
            }

            // Get count of affected assignments
            const { data: affectedAssignments, error: countError } = await this.supabaseClient
                .from('project_members')
                .select('id')
                .eq('user_id', userId)
                .eq('company_id', companyId)
                .eq('status', 'inactive')

            return { removedCount: affectedAssignments?.length || 0 }
        } catch (error) {
            console.error('Error removing project assignments:', error)
            return { removedCount: 0 }
        }
    }

    /**
     * Remove team member from all schedule project assignments
     */
    private async removeFromAllScheduleAssignments(userId: string, companyId: string) {
        try {
            // First get project member IDs for this user
            const { data: projectMembers, error: fetchError } = await this.supabaseClient
                .from('project_members')
                .select('id')
                .eq('user_id', userId)
                .eq('company_id', companyId)

            if (fetchError || !projectMembers || projectMembers.length === 0) {
                return { removedCount: 0 }
            }

            const projectMemberIds = projectMembers.map(pm => pm.id)

            // Find schedule projects where this user is assigned
            const { data: affectedProjects, error: scheduleError } = await this.supabaseClient
                .from('schedule_projects')
                .select('id, assigned_project_member_ids')
                .eq('company_id', companyId)
                .filter('assigned_project_member_ids', 'ov', projectMemberIds) // overlaps

            if (scheduleError || !affectedProjects || affectedProjects.length === 0) {
                return { removedCount: 0 }
            }

            let removedCount = 0

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

                if (!updateError) {
                    removedCount++
                }
            }

            return { removedCount }
        } catch (error) {
            console.error('Error removing schedule assignments:', error)
            return { removedCount: 0 }
        }
    }

    /**
     * Remove team member from all punchlist assignments
     */
    private async removeFromAllPunchlistAssignments(userId: string, companyId: string) {
        try {
            // First get project member IDs for this user
            const { data: projectMembers, error: fetchError } = await this.supabaseClient
                .from('project_members')
                .select('id')
                .eq('user_id', userId)
                .eq('company_id', companyId)

            if (fetchError || !projectMembers || projectMembers.length === 0) {
                return { removedCount: 0 }
            }

            const projectMemberIds = projectMembers.map(pm => pm.id)

            // Find all punchlist assignments for these project members
            const { data: assignments, error: assignmentError } = await this.supabaseClient
                .from('punchlist_item_assignments')
                .select('id')
                .in('project_member_id', projectMemberIds)
                .eq('company_id', companyId)
                .eq('is_active', true)

            if (assignmentError || !assignments || assignments.length === 0) {
                return { removedCount: 0 }
            }

            // Deactivate assignments
            const { error: updateError } = await this.supabaseClient
                .from('punchlist_item_assignments')
                .update({
                    is_active: false,
                    removed_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .in('id', assignments.map(a => a.id))

            if (updateError) {
                console.error('Error deactivating punchlist assignments:', updateError)
                return { removedCount: 0 }
            }

            return { removedCount: assignments.length }
        } catch (error) {
            console.error('Error removing punchlist assignments:', error)
            return { removedCount: 0 }
        }
    }


    // ==============================================
    // PUNCHLIST BLOCKING LOGIC - FIXED
    // ==============================================

    /**
     * Check if schedule project can be completed (no blocking punchlist items)
     */
    async canCompleteScheduleProject(scheduleProjectId: string, companyId: string) {
        try {
            // Get all punchlist items related to this schedule project
            const { data: punchlistItems, error } = await this.supabaseClient
                .from('punchlist_items')
                .select('id, title, status, priority')
                .eq('related_schedule_project_id', scheduleProjectId)
                .eq('company_id', companyId)
                .in('status', ['open', 'assigned', 'in_progress', 'pending_review']) // Non-completed statuses
                .in('priority', ['high', 'critical']) // Only high priority items block completion

            if (error) {
                console.error('Error fetching blocking punchlist items:', error)
                return {
                    canComplete: false,
                    blockingCount: -1,
                    blockingItems: [],
                    error: error.message
                }
            }

            const blockingPunchlistItems = punchlistItems || []
            const canComplete = blockingPunchlistItems.length === 0

            return {
                canComplete,
                blockingCount: blockingPunchlistItems.length,
                blockingItems: blockingPunchlistItems.map(item => ({
                    id: item.id,
                    title: item.title,
                    status: item.status,
                    priority: item.priority
                }))
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
            console.error('Error checking schedule project completion eligibility:', errorMessage)
            return {
                canComplete: false,
                blockingCount: -1,
                blockingItems: [],
                error: errorMessage
            }
        }
    }

    // ==============================================
    // VALIDATION & UTILITY METHODS - FIXED
    // ==============================================

    /**
     * Validate cross-module status consistency
     */
    async validateStatusConsistency(projectId: string, companyId: string) {
        try {
            // Get project and all related entities
            const project = await this.projectService.getProjectByIdEnhanced(projectId, companyId)
            const scheduleProjects = await this.getScheduleProjectsByProject(projectId, companyId)

            const inconsistencies = []

            // Check project vs schedule project consistency
            if (project.status === 'completed') {
                const incompleteSchedules = scheduleProjects.filter(sp =>
                    sp.status !== 'completed' && sp.status !== 'cancelled'
                )
                if (incompleteSchedules.length > 0) {
                    inconsistencies.push({
                        type: 'project_schedule_mismatch',
                        message: `Project is completed but ${incompleteSchedules.length} schedule projects are not completed`,
                        items: incompleteSchedules.map(sp => ({ id: sp.id, title: sp.title, status: sp.status }))
                    })
                }
            }

            if (project.status === 'not_started') {
                const activeSchedules = scheduleProjects.filter(sp => sp.status === 'in_progress')
                if (activeSchedules.length > 0) {
                    inconsistencies.push({
                        type: 'project_schedule_mismatch',
                        message: `Project not started but ${activeSchedules.length} schedule projects are in progress`,
                        items: activeSchedules.map(sp => ({ id: sp.id, title: sp.title, status: sp.status }))
                    })
                }
            }

            return {
                isConsistent: inconsistencies.length === 0,
                inconsistencies
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
            console.error('❌ Error validating status consistency:', errorMessage)
            return {
                isConsistent: false,
                inconsistencies: [],
                error: errorMessage
            }
        }
    }

    // ==============================================
    // HELPER METHODS
    // ==============================================

    /**
  * Map project status to schedule project status
  */
    private getScheduleStatusFromProjectStatus(
        projectStatus: string
    ): 'planned' | 'in_progress' | 'completed' | 'delayed' | 'cancelled' | null {
        const statusMap: Record<string, 'planned' | 'in_progress' | 'completed' | 'delayed' | 'cancelled'> = {
            'not_started': 'planned',
            'in_progress': 'in_progress',
            'on_track': 'in_progress',
            'ahead_of_schedule': 'in_progress',
            'behind_schedule': 'delayed',
            'on_hold': 'delayed',
            'completed': 'completed',
            'cancelled': 'cancelled'
        }

        return statusMap[projectStatus] || null
    }

    /**
     * Get schedule projects by project ID
     */
    private async getScheduleProjectsByProject(projectId: string, companyId: string) {
        const { data: scheduleProjects, error } = await this.supabaseClient
            .from('schedule_projects')
            .select('*')
            .eq('project_id', projectId)
            .eq('company_id', companyId)

        if (error) {
            console.error('Error fetching schedule projects:', error)
            return []
        }

        return scheduleProjects || []
    }
}

// ==============================================
// EXPORT
// ==============================================
export default StatusCoordinatorService