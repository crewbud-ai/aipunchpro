// ==============================================
// src/lib/database/services/punchlist-items.ts - Punchlist Items Database Service
// ==============================================

import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { createBrowserClient } from '@/lib/supabase/client'
import type {
    PunchlistItem,
    NewPunchlistItem,
    User,
    Project,
    ProjectMember,
    ScheduleProject
} from '@/lib/database/schema'

// Extended types for joined data
export interface PunchlistItemWithDetails extends PunchlistItem {
    project?: {
        id: string
        name: string
        status: string
    }
    assignedMember?: {
        id: string
        userId: string
        user: {
            firstName: string
            lastName: string
            tradeSpecialty?: string
        }
    }
    relatedScheduleProject?: {
        id: string
        title: string
        status: string
    }
    reporter?: {
        firstName: string
        lastName: string
    }
    inspector?: {
        firstName: string
        lastName: string
    }
}

export interface PunchlistItemSummary {
    id: string
    title: string
    projectName: string
    status: string
    priority: string
    issueType: string
    assignedMemberName?: string
    dueDate?: string
    isOverdue: boolean
    createdAt: string
}

export class PunchlistItemDatabaseService {
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
    // PUNCHLIST ITEM CRUD OPERATIONS
    // ==============================================

    async createPunchlistItem(data: {
        companyId: string
        projectId: string
        relatedScheduleProjectId?: string
        title: string
        description?: string
        issueType?: 'defect' | 'incomplete' | 'change_request' | 'safety' | 'quality' | 'rework'
        location?: string
        roomArea?: string
        assignedProjectMemberId?: string
        tradeCategory?: string
        reportedBy: string
        priority?: 'low' | 'medium' | 'high' | 'critical'
        status?: 'open' | 'assigned' | 'in_progress' | 'completed' | 'rejected'
        photos?: string[]
        attachments?: string[]
        dueDate?: string
        estimatedHours?: number
        resolutionNotes?: string
        rejectionReason?: string
        requiresInspection?: boolean
        inspectionPassed?: boolean
        inspectionNotes?: string
    }) {
        const insertData = {
            company_id: data.companyId,
            project_id: data.projectId,
            related_schedule_project_id: data.relatedScheduleProjectId || null,
            title: data.title,
            description: data.description || null,
            issue_type: data.issueType || 'defect',
            location: data.location || null,
            room_area: data.roomArea || null,
            assigned_project_member_id: data.assignedProjectMemberId || null,
            trade_category: data.tradeCategory || null,
            reported_by: data.reportedBy,
            priority: data.priority || 'medium',
            status: data.status || 'open',
            photos: data.photos || [],
            attachments: data.attachments || [],
            due_date: data.dueDate || null,
            estimated_hours: data.estimatedHours || null,
            actual_hours: 0,
            resolution_notes: data.resolutionNotes || null,
            rejection_reason: data.rejectionReason || null,
            requires_inspection: data.requiresInspection || false,
            inspection_passed: data.inspectionPassed || null,
            inspection_notes: data.inspectionNotes || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            assigned_at: data.assignedProjectMemberId ? new Date().toISOString() : null,
        }

        const { data: punchlistItem, error } = await this.supabaseClient
            .from('punchlist_items')
            .insert(insertData)
            .select('*')
            .single()

        if (error) {
            console.error('Error creating punchlist item:', error)
            throw new Error('Failed to create punchlist item')
        }

        return punchlistItem
    }

    async updatePunchlistItem(
        punchlistItemId: string,
        companyId: string,
        data: {
            title?: string
            description?: string
            issueType?: 'defect' | 'incomplete' | 'change_request' | 'safety' | 'quality' | 'rework'
            location?: string
            roomArea?: string
            assignedProjectMemberId?: string
            tradeCategory?: string
            priority?: 'low' | 'medium' | 'high' | 'critical'
            status?: 'open' | 'assigned' | 'in_progress' | 'completed' | 'rejected'
            photos?: string[]
            attachments?: string[]
            dueDate?: string
            estimatedHours?: number
            actualHours?: number
            resolutionNotes?: string
            rejectionReason?: string
            requiresInspection?: boolean
            inspectedBy?: string
            inspectionPassed?: boolean
            inspectionNotes?: string
        }
    ) {
        const updateData: any = {
            updated_at: new Date().toISOString(),
        }

        // Only include fields that are provided
        if (data.title !== undefined) updateData.title = data.title
        if (data.description !== undefined) updateData.description = data.description
        if (data.issueType !== undefined) updateData.issue_type = data.issueType
        if (data.location !== undefined) updateData.location = data.location
        if (data.roomArea !== undefined) updateData.room_area = data.roomArea
        if (data.assignedProjectMemberId !== undefined) {
            updateData.assigned_project_member_id = data.assignedProjectMemberId
            // Set assignment timestamp when assigning
            if (data.assignedProjectMemberId) {
                updateData.assigned_at = new Date().toISOString()
            }
        }
        if (data.tradeCategory !== undefined) updateData.trade_category = data.tradeCategory
        if (data.priority !== undefined) updateData.priority = data.priority
        if (data.status !== undefined) {
            updateData.status = data.status
            // Set completion timestamp when status changes to completed
            if (data.status === 'completed') {
                updateData.completed_at = new Date().toISOString()
            }
        }
        if (data.photos !== undefined) updateData.photos = data.photos
        if (data.attachments !== undefined) updateData.attachments = data.attachments
        if (data.dueDate !== undefined) updateData.due_date = data.dueDate
        if (data.estimatedHours !== undefined) updateData.estimated_hours = data.estimatedHours
        if (data.actualHours !== undefined) updateData.actual_hours = data.actualHours
        if (data.resolutionNotes !== undefined) updateData.resolution_notes = data.resolutionNotes
        if (data.rejectionReason !== undefined) updateData.rejection_reason = data.rejectionReason
        if (data.requiresInspection !== undefined) updateData.requires_inspection = data.requiresInspection
        if (data.inspectedBy !== undefined) updateData.inspected_by = data.inspectedBy
        if (data.inspectionPassed !== undefined) {
            updateData.inspection_passed = data.inspectionPassed
            // Set inspection timestamp
            updateData.inspected_at = new Date().toISOString()
        }
        if (data.inspectionNotes !== undefined) updateData.inspection_notes = data.inspectionNotes

        const { data: punchlistItem, error } = await this.supabaseClient
            .from('punchlist_items')
            .update(updateData)
            .eq('id', punchlistItemId)
            .eq('company_id', companyId)
            .select('*')
            .single()

        if (error) {
            console.error('Error updating punchlist item:', error)
            throw new Error('Failed to update punchlist item')
        }

        return punchlistItem
    }

    async quickUpdatePunchlistStatus(
        punchlistItemId: string,
        companyId: string,
        data: {
            status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'rejected'
            actualHours?: number
            resolutionNotes?: string
            rejectionReason?: string
            inspectionPassed?: boolean
            inspectionNotes?: string
            inspectedBy?: string
        }
    ) {
        const updateData: any = {
            status: data.status,
            updated_at: new Date().toISOString(),
        }

        if (data.actualHours !== undefined) updateData.actual_hours = data.actualHours
        if (data.resolutionNotes !== undefined) updateData.resolution_notes = data.resolutionNotes
        if (data.rejectionReason !== undefined) updateData.rejection_reason = data.rejectionReason
        if (data.inspectionPassed !== undefined) {
            updateData.inspection_passed = data.inspectionPassed
            updateData.inspected_at = new Date().toISOString()
        }
        if (data.inspectionNotes !== undefined) updateData.inspection_notes = data.inspectionNotes
        if (data.inspectedBy !== undefined) updateData.inspected_by = data.inspectedBy

        // Set completion timestamp when status changes to completed
        if (data.status === 'completed') {
            updateData.completed_at = new Date().toISOString()
        }

        const { data: punchlistItem, error } = await this.supabaseClient
            .from('punchlist_items')
            .update(updateData)
            .eq('id', punchlistItemId)
            .eq('company_id', companyId)
            .select('*')
            .single()

        if (error) {
            console.error('Error updating punchlist status:', error)
            throw new Error('Failed to update punchlist status')
        }

        return punchlistItem
    }

    async deletePunchlistItem(punchlistItemId: string, companyId: string) {
        const { error } = await this.supabaseClient
            .from('punchlist_items')
            .delete()
            .eq('id', punchlistItemId)
            .eq('company_id', companyId)

        if (error) {
            console.error('Error deleting punchlist item:', error)
            throw new Error('Failed to delete punchlist item')
        }

        return { success: true }
    }

    // ==============================================
    // PUNCHLIST ITEM QUERY OPERATIONS
    // ==============================================

    async getPunchlistItems(
        companyId: string,
        options: {
            projectId?: string
            relatedScheduleProjectId?: string
            status?: 'open' | 'assigned' | 'in_progress' | 'completed' | 'rejected'
            priority?: 'low' | 'medium' | 'high' | 'critical'
            issueType?: 'defect' | 'incomplete' | 'change_request' | 'safety' | 'quality' | 'rework'
            tradeCategory?: string
            assignedToUserId?: string
            reportedBy?: string
            dueDateFrom?: string
            dueDateTo?: string
            requiresInspection?: boolean
            isOverdue?: boolean
            search?: string
            limit?: number
            offset?: number
            sortBy?: 'title' | 'status' | 'priority' | 'issueType' | 'dueDate' | 'createdAt'
            sortOrder?: 'asc' | 'desc'
        } = {}
    ) {
        // ✅ FIXED: Use correct foreign key names or simple joins
        let query = this.supabaseClient
            .from('punchlist_items')
            .select(`
            *,
            project:projects(id, name, status),
            reporter:users!reported_by(first_name, last_name),
            inspector:users!inspected_by(first_name, last_name)
        `)
            .eq('company_id', companyId)

        // Apply filters
        if (options.projectId) {
            query = query.eq('project_id', options.projectId)
        }

        if (options.relatedScheduleProjectId) {
            query = query.eq('related_schedule_project_id', options.relatedScheduleProjectId)
        }

        if (options.status) {
            query = query.eq('status', options.status)
        }

        if (options.priority) {
            query = query.eq('priority', options.priority)
        }

        if (options.issueType) {
            query = query.eq('issue_type', options.issueType)
        }

        if (options.tradeCategory) {
            query = query.eq('trade_category', options.tradeCategory)
        }

        if (options.reportedBy) {
            query = query.eq('reported_by', options.reportedBy)
        }

        if (options.dueDateFrom) {
            query = query.gte('due_date', options.dueDateFrom)
        }

        if (options.dueDateTo) {
            query = query.lte('due_date', options.dueDateTo)
        }

        if (options.requiresInspection !== undefined) {
            query = query.eq('requires_inspection', options.requiresInspection)
        }

        // Handle overdue filter
        if (options.isOverdue !== undefined) {
            const today = new Date().toISOString().split('T')[0]
            if (options.isOverdue) {
                query = query.lt('due_date', today).in('status', ['open', 'assigned', 'in_progress'])
            } else {
                query = query.or(`due_date.is.null,due_date.gte.${today},status.eq.completed,status.eq.rejected`)
            }
        }

        // Search functionality
        if (options.search) {
            query = query.or(`title.ilike.%${options.search}%, description.ilike.%${options.search}%, location.ilike.%${options.search}%`)
        }

        // Filter by assigned user (check if user ID matches project member's user)
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
                query = query.in('assigned_project_member_id', projectMemberIds)
            } else {
                // User has no active project assignments, return empty results
                return { data: [], totalCount: 0 }
            }
        }

        // Apply sorting
        const sortField = options.sortBy ? ({
            'title': 'title',
            'status': 'status',
            'priority': 'priority',
            'issueType': 'issue_type',
            'dueDate': 'due_date',
            'createdAt': 'created_at'
        }[options.sortBy] || 'created_at') : 'created_at'
        const sortOrder = options.sortOrder || 'desc'
        query = query.order(sortField, { ascending: sortOrder === 'asc' })

        // Apply pagination
        const limit = options.limit || 20
        const offset = options.offset || 0
        query = query.range(offset, offset + limit - 1)

        // Get total count
        const { count } = await this.supabaseClient
            .from('punchlist_items')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', companyId)

        const { data: punchlistItems, error } = await query

        if (error) {
            console.error('Error fetching punchlist items:', error)
            throw new Error('Failed to fetch punchlist items')
        }

        // Get assigned members and related schedule projects for each punchlist item
        const punchlistItemsWithDetails = await Promise.all(
            (punchlistItems || []).map(async (punchlistItem) => {
                const assignedMember = punchlistItem.assigned_project_member_id
                    ? await this.getAssignedMemberForPunchlistItem(punchlistItem.assigned_project_member_id)
                    : null

                const relatedScheduleProject = punchlistItem.related_schedule_project_id
                    ? await this.getRelatedScheduleProject(punchlistItem.related_schedule_project_id)
                    : null

                return {
                    ...punchlistItem,
                    assignedMember,
                    relatedScheduleProject
                }
            })
        )

        return {
            data: punchlistItemsWithDetails as PunchlistItemWithDetails[],
            totalCount: count || 0
        }
    }

    // ✅ ALSO FIX: getPunchlistItemById method
    async getPunchlistItemById(punchlistItemId: string, companyId: string): Promise<PunchlistItemWithDetails | null> {
        const { data: punchlistItem, error } = await this.supabaseClient
            .from('punchlist_items')
            .select(`
            *,
            project:projects(id, name, status),
            reporter:users!reported_by(first_name, last_name),
            inspector:users!inspected_by(first_name, last_name)
        `)
            .eq('id', punchlistItemId)
            .eq('company_id', companyId)
            .single()

        if (error) {
            console.error('Error fetching punchlist item:', error)
            return null
        }

        if (!punchlistItem) {
            return null
        }

        // Get assigned member and related schedule project
        const assignedMember = punchlistItem.assigned_project_member_id
            ? await this.getAssignedMemberForPunchlistItem(punchlistItem.assigned_project_member_id)
            : null

        const relatedScheduleProject = punchlistItem.related_schedule_project_id
            ? await this.getRelatedScheduleProject(punchlistItem.related_schedule_project_id)
            : null

        return {
            ...punchlistItem,
            assignedMember,
            relatedScheduleProject
        } as PunchlistItemWithDetails
    }

    // ==============================================
    // HELPER METHODS
    // ==============================================

    async checkPunchlistItemExists(punchlistItemId: string, companyId: string): Promise<boolean> {
        const { data, error } = await this.supabaseClient
            .from('punchlist_items')
            .select('id')
            .eq('id', punchlistItemId)
            .eq('company_id', companyId)
            .single()

        if (error) {
            return false
        }

        return !!data
    }

    async getAssignedMemberForPunchlistItem(assignedProjectMemberId: string) {
        const { data: projectMember, error } = await this.supabaseClient
            .from('project_members')
            .select(`
            id,
            user_id,
            user:users!project_members_user_id_users_id_fk(first_name, last_name, trade_specialty),
            status,
            joined_at
        `)
            .eq('id', assignedProjectMemberId)
            .single()

        if (error) {
            console.error('Error fetching assigned member:', error)
            return null
        }

        return projectMember
    }

    async getRelatedScheduleProject(scheduleProjectId: string) {
        const { data: scheduleProject, error } = await this.supabaseClient
            .from('schedule_projects')
            .select('id, title, status')
            .eq('id', scheduleProjectId)
            .single()

        if (error) {
            console.error('Error fetching related schedule project:', error)
            return null
        }

        return scheduleProject
    }

    async getProjectMembersForProject(projectId: string, companyId: string) {

        const { data: projectMembers, error } = await this.supabaseClient
            .from('project_members')
            .select(`
            id,
            user_id,
            user:users!project_members_user_id_users_id_fk(first_name, last_name, trade_specialty),
            hourly_rate,
            status,
            joined_at,
            notes
        `)
            .eq('project_id', projectId)
            .eq('company_id', companyId)
            .eq('status', 'active')
            .is('left_at', null)  // Only get members who haven't left

        if (error) {
            console.error('🚨 Error fetching project members:', error)
            throw new Error('Failed to fetch project members')
        }

        return projectMembers || []
    }

    async getTodaysPunchlistForUser(userId: string, companyId: string) {
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

        const { data: todaysPunchlist, error } = await this.supabaseClient
            .from('punchlist_items')
            .select(`
                *,
                project:projects(id, name, status)
            `)
            .eq('company_id', companyId)
            .in('assigned_project_member_id', projectMemberIds)
            .in('status', ['open', 'assigned', 'in_progress'])
            .order('priority', { ascending: false })
            .order('created_at', { ascending: true })

        if (error) {
            console.error('Error fetching today\'s punchlist:', error)
            return []
        }

        return todaysPunchlist || []
    }

    async getOverduePunchlistForUser(userId: string, companyId: string) {
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

        const { data: overduePunchlist, error } = await this.supabaseClient
            .from('punchlist_items')
            .select(`
                *,
                project:projects(id, name, status)
            `)
            .eq('company_id', companyId)
            .in('assigned_project_member_id', projectMemberIds)
            .lt('due_date', today)
            .in('status', ['open', 'assigned', 'in_progress'])
            .order('due_date', { ascending: true })

        if (error) {
            console.error('Error fetching overdue punchlist:', error)
            return []
        }

        return overduePunchlist || []
    }

    async getPunchlistStatsForProject(projectId: string, companyId: string) {
        const { data: stats, error } = await this.supabaseClient
            .from('punchlist_items')
            .select('status, priority, due_date')
            .eq('project_id', projectId)
            .eq('company_id', companyId)

        if (error) {
            console.error('Error fetching punchlist stats:', error)
            return {
                total: 0,
                open: 0,
                assigned: 0,
                inProgress: 0,
                completed: 0,
                rejected: 0,
                highPriority: 0,
                critical: 0,
                overdue: 0
            }
        }

        const statsData = stats || []
        const today = new Date().toISOString().split('T')[0]

        return {
            total: statsData.length,
            open: statsData.filter(s => s.status === 'open').length,
            assigned: statsData.filter(s => s.status === 'assigned').length,
            inProgress: statsData.filter(s => s.status === 'in_progress').length,
            completed: statsData.filter(s => s.status === 'completed').length,
            rejected: statsData.filter(s => s.status === 'rejected').length,
            highPriority: statsData.filter(s => s.priority === 'high').length,
            critical: statsData.filter(s => s.priority === 'critical').length,
            overdue: statsData.filter(s =>
                s.due_date && s.due_date < today && ['open', 'assigned', 'in_progress'].includes(s.status)
            ).length
        }
    }

    async getPunchlistStatsForCompany(companyId: string) {
        const { data: stats, error } = await this.supabaseClient
            .from('punchlist_items')
            .select('status, priority, due_date, created_at')
            .eq('company_id', companyId)

        if (error) {
            console.error('Error fetching company punchlist stats:', error)
            return {
                total: 0,
                open: 0,
                assigned: 0,
                inProgress: 0,
                completed: 0,
                rejected: 0,
                createdToday: 0,
                createdThisWeek: 0,
                overdue: 0,
                critical: 0
            }
        }

        const statsData = stats || []
        const today = new Date().toISOString().split('T')[0]
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

        return {
            total: statsData.length,
            open: statsData.filter(s => s.status === 'open').length,
            assigned: statsData.filter(s => s.status === 'assigned').length,
            inProgress: statsData.filter(s => s.status === 'in_progress').length,
            completed: statsData.filter(s => s.status === 'completed').length,
            rejected: statsData.filter(s => s.status === 'rejected').length,
            createdToday: statsData.filter(s => s.created_at?.split('T')[0] === today).length,
            createdThisWeek: statsData.filter(s => s.created_at?.split('T')[0] >= weekAgo).length,
            overdue: statsData.filter(s =>
                s.due_date && s.due_date < today && ['open', 'assigned', 'in_progress'].includes(s.status)
            ).length,
            critical: statsData.filter(s => s.priority === 'critical').length
        }
    }
}