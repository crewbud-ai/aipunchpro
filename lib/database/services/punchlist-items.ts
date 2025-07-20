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
import { PunchlistItemAssignment } from '@/types/punchlist-items'

// ==============================================
// EXTENDED TYPES FOR MULTIPLE ASSIGNMENTS
// ==============================================
// export interface PunchlistItemAssignment {
//     id: string
//     projectMemberId: string
//     role: 'primary' | 'secondary' | 'inspector' | 'supervisor'
//     assignedAt: string
//     assignedBy: string
//     isActive: boolean
//     user: {
//         firstName: string
//         lastName: string
//         email: string
//         tradeSpecialty?: string
//     }
//     hourlyRate?: number
// }

// Extended types for joined data
export interface PunchlistItemWithDetails extends PunchlistItem {
    project?: {
        id: string
        name: string
        status: string
    }

    // NEW: Multiple assignments
    assignedMembers?: PunchlistItemAssignment[]

    // DEPRECATED: Keep for backward compatibility during transition
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
    assignedMemberNames: string[]
    assignedMemberCount: number
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
        assignedMembers?: Array<{
            projectMemberId: string
            role?: 'primary' | 'secondary' | 'inspector' | 'supervisor'
        }>
        tradeCategory?: string
        reportedBy: string
        priority?: 'low' | 'medium' | 'high' | 'critical'
        status?: 'open' | 'assigned' | 'in_progress' | 'pending_review' | 'completed' | 'rejected' | 'on_hold'
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
        // Start a transaction
        const { data: punchlistItem, error: itemError } = await this.supabaseClient
            .from('punchlist_items')
            .insert({
                company_id: data.companyId,
                project_id: data.projectId,
                related_schedule_project_id: data.relatedScheduleProjectId || null,
                title: data.title,
                description: data.description || null,
                issue_type: data.issueType || 'defect',
                location: data.location || null,
                room_area: data.roomArea || null,
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
            })
            .select('*')
            .single()

        if (itemError) {
            console.error('Error creating punchlist item:', itemError)
            throw new Error('Failed to create punchlist item')
        }

        // Create assignments if provided
        if (data.assignedMembers && data.assignedMembers.length > 0) {
            const assignments = data.assignedMembers.map(assignment => ({
                company_id: data.companyId,
                punchlist_item_id: punchlistItem.id,
                project_member_id: assignment.projectMemberId,
                role: assignment.role || 'primary',
                assigned_by: data.reportedBy,
                assigned_at: new Date().toISOString(),
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }))

            const { error: assignmentError } = await this.supabaseClient
                .from('punchlist_item_assignments')
                .insert(assignments)

            if (assignmentError) {
                console.error('Error creating assignments:', assignmentError)
                // Don't fail the whole operation, just log the error
                // The punchlist item was created successfully
            }
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
            assignedMembers?: Array<{
                projectMemberId: string
                role?: 'primary' | 'secondary' | 'inspector' | 'supervisor'
            }>
            tradeCategory?: string
            priority?: 'low' | 'medium' | 'high' | 'critical'
            status?: 'open' | 'assigned' | 'in_progress' | 'pending_review' | 'completed' | 'rejected' | 'on_hold'
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
            updateData.inspected_at = new Date().toISOString()
        }
        if (data.inspectionNotes !== undefined) updateData.inspection_notes = data.inspectionNotes

        // Update the punchlist item
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

        // Handle assignment updates if provided
        if (data.assignedMembers !== undefined) {
            await this.updatePunchlistAssignments(punchlistItemId, companyId, data.assignedMembers)
        }

        return punchlistItem
    }

    // ==============================================
    // ASSIGNMENT MANAGEMENT METHODS (NEW)
    // ==============================================

    async updatePunchlistAssignments(
        punchlistItemId: string,
        companyId: string,
        newAssignments: Array<{
            projectMemberId: string
            role?: 'primary' | 'secondary' | 'inspector' | 'supervisor'
        }>
    ) {
        // Get current assignments
        const { data: currentAssignments } = await this.supabaseClient
            .from('punchlist_item_assignments')
            .select('*')
            .eq('punchlist_item_id', punchlistItemId)
            .eq('company_id', companyId)
            .eq('is_active', true)

        const currentMemberIds = (currentAssignments || []).map(a => a.project_member_id)
        const newMemberIds = newAssignments.map(a => a.projectMemberId)

        // Find assignments to remove (in current but not in new)
        const toRemove = currentMemberIds.filter(id => !newMemberIds.includes(id))

        // Find assignments to add (in new but not in current)
        const toAdd = newAssignments.filter(a => !currentMemberIds.includes(a.projectMemberId))

        // Find assignments to update (role changes)
        const toUpdate = newAssignments.filter(newAssignment => {
            const existing = currentAssignments?.find(current =>
                current.project_member_id === newAssignment.projectMemberId
            )
            return existing && existing.role !== (newAssignment.role || 'primary')
        })

        // Remove old assignments
        if (toRemove.length > 0) {
            await this.supabaseClient
                .from('punchlist_item_assignments')
                .update({
                    is_active: false,
                    removed_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('punchlist_item_id', punchlistItemId)
                .eq('company_id', companyId)
                .in('project_member_id', toRemove)
        }

        // Add new assignments
        if (toAdd.length > 0) {
            const assignments = toAdd.map(assignment => ({
                company_id: companyId,
                punchlist_item_id: punchlistItemId,
                project_member_id: assignment.projectMemberId,
                role: assignment.role || 'primary',
                assigned_by: 'system', // TODO: Get from context
                assigned_at: new Date().toISOString(),
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }))

            await this.supabaseClient
                .from('punchlist_item_assignments')
                .insert(assignments)
        }

        // Update role changes
        for (const assignment of toUpdate) {
            await this.supabaseClient
                .from('punchlist_item_assignments')
                .update({
                    role: assignment.role || 'primary',
                    updated_at: new Date().toISOString()
                })
                .eq('punchlist_item_id', punchlistItemId)
                .eq('company_id', companyId)
                .eq('project_member_id', assignment.projectMemberId)
                .eq('is_active', true)
        }
    }

    async addAssignment(
        punchlistItemId: string,
        companyId: string,
        projectMemberId: string,
        role: 'primary' | 'secondary' | 'inspector' | 'supervisor' = 'primary',
        assignedBy: string
    ) {
        const { data, error } = await this.supabaseClient
            .from('punchlist_item_assignments')
            .insert({
                company_id: companyId,
                punchlist_item_id: punchlistItemId,
                project_member_id: projectMemberId,
                role,
                assigned_by: assignedBy,
                assigned_at: new Date().toISOString(),
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select('*')
            .single()

        if (error) {
            console.error('Error adding assignment:', error)
            throw new Error('Failed to add assignment')
        }

        return data
    }

    async removeAssignment(
        punchlistItemId: string,
        companyId: string,
        projectMemberId: string,
        removedBy: string
    ) {
        const { error } = await this.supabaseClient
            .from('punchlist_item_assignments')
            .update({
                is_active: false,
                removed_at: new Date().toISOString(),
                removed_by: removedBy,
                updated_at: new Date().toISOString(),
            })
            .eq('punchlist_item_id', punchlistItemId)
            .eq('company_id', companyId)
            .eq('project_member_id', projectMemberId)
            .eq('is_active', true)

        if (error) {
            console.error('Error removing assignment:', error)
            throw new Error('Failed to remove assignment')
        }

        return { success: true }
    }

    async updateAssignmentRole(
        punchlistItemId: string,
        companyId: string,
        projectMemberId: string,
        role: 'primary' | 'secondary' | 'inspector' | 'supervisor'
    ) {
        const { data, error } = await this.supabaseClient
            .from('punchlist_item_assignments')
            .update({
                role,
                updated_at: new Date().toISOString(),
            })
            .eq('punchlist_item_id', punchlistItemId)
            .eq('company_id', companyId)
            .eq('project_member_id', projectMemberId)
            .eq('is_active', true)
            .select('*')
            .single()

        if (error) {
            console.error('Error updating assignment role:', error)
            throw new Error('Failed to update assignment role')
        }

        return data
    }

    async updatePunchlistItemAssignments(
        punchlistItemId: string,
        companyId: string,
        newAssignments: Array<{ projectMemberId: string; role: 'primary' | 'secondary' | 'inspector' | 'supervisor' }>,
        assignedBy: string
    ): Promise<void> {
        try {
            // Get current assignments
            const currentAssignments = await this.getAssignmentsForPunchlistItem(punchlistItemId)

            // Create a map of current assignments by project member ID
            const currentAssignmentMap = new Map(
                currentAssignments.map(assignment => [assignment.projectMemberId, assignment])
            )

            // Create a map of new assignments by project member ID
            const newAssignmentMap = new Map(
                newAssignments.map(assignment => [assignment.projectMemberId, assignment])
            )

            // Find assignments to remove (in current but not in new)
            const assignmentsToRemove = currentAssignments.filter(
                assignment => !newAssignmentMap.has(assignment.projectMemberId)
            )

            // Find assignments to add (in new but not in current)
            const assignmentsToAdd = newAssignments.filter(
                assignment => !currentAssignmentMap.has(assignment.projectMemberId)
            )

            // Find assignments to update (role changed)
            const assignmentsToUpdate = newAssignments.filter(assignment => {
                const current = currentAssignmentMap.get(assignment.projectMemberId)
                return current && current.role !== assignment.role
            })

            // Remove assignments
            if (assignmentsToRemove.length > 0) {
                const assignmentIdsToRemove = assignmentsToRemove.map(a => a.id)
                const { error: removeError } = await this.supabaseClient
                    .from('punchlist_item_assignments')
                    .update({
                        is_active: false,
                        removed_at: new Date().toISOString(),
                        removed_by: assignedBy
                    })
                    .in('id', assignmentIdsToRemove)
                    .eq('company_id', companyId)

                if (removeError) {
                    console.error('Error removing assignments:', removeError)
                    throw new Error('Failed to remove assignments')
                }
            }

            // Add new assignments
            if (assignmentsToAdd.length > 0) {
                const newAssignmentRecords = assignmentsToAdd.map(assignment => ({
                    company_id: companyId,
                    punchlist_item_id: punchlistItemId,
                    project_member_id: assignment.projectMemberId,
                    role: assignment.role,
                    assigned_by: assignedBy,
                    is_active: true
                }))

                const { error: addError } = await this.supabaseClient
                    .from('punchlist_item_assignments')
                    .insert(newAssignmentRecords)

                if (addError) {
                    console.error('Error adding assignments:', addError)
                    throw new Error('Failed to add assignments')
                }
            }

            // Update existing assignments (role changes)
            for (const assignment of assignmentsToUpdate) {
                const currentAssignment = currentAssignmentMap.get(assignment.projectMemberId)
                if (currentAssignment) {
                    const { error: updateError } = await this.supabaseClient
                        .from('punchlist_item_assignments')
                        .update({
                            role: assignment.role,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', currentAssignment.id)
                        .eq('company_id', companyId)

                    if (updateError) {
                        console.error('Error updating assignment:', updateError)
                        throw new Error('Failed to update assignment')
                    }
                }
            }

        } catch (error) {
            console.error('Error updating punchlist item assignments:', error)
            throw error
        }
    }

    async quickUpdatePunchlistStatus(
        punchlistItemId: string,
        companyId: string,
        data: {
            status: 'open' | 'assigned' | 'in_progress' | 'pending_review' | 'completed' | 'rejected' | 'on_hold'
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
            status?: 'open' | 'assigned' | 'in_progress' | 'pending_review' | 'completed' | 'rejected' | 'on_hold'
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
        let query = this.supabaseClient
            .from('punchlist_items')
            .select(`
                *,
                project:projects(id, name, status),
                reporter:users!reported_by(first_name, last_name),
                inspector:users!inspected_by(first_name, last_name)
            `)
            .eq('company_id', companyId)

        // Apply basic filters
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

        // Filter by assigned user (check assignments table)
        if (options.assignedToUserId) {
            // Get punchlist item IDs where this user is assigned
            const { data: userAssignments } = await this.supabaseClient
                .from('punchlist_item_assignments')
                .select(`
                    punchlist_item_id,
                    project_members!inner(user_id)
                `)
                .eq('company_id', companyId)
                .eq('is_active', true)
                .eq('project_members.user_id', options.assignedToUserId)

            if (userAssignments && userAssignments.length > 0) {
                const punchlistItemIds = userAssignments.map(a => a.punchlist_item_id)
                query = query.in('id', punchlistItemIds)
            } else {
                // User has no assignments, return empty results
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

        // Get assignments for each punchlist item
        const punchlistItemsWithDetails = await Promise.all(
            (punchlistItems || []).map(async (punchlistItem) => {
                const assignedMembers = await this.getAssignmentsForPunchlistItem(punchlistItem.id)
                const relatedScheduleProject = punchlistItem.related_schedule_project_id
                    ? await this.getRelatedScheduleProject(punchlistItem.related_schedule_project_id)
                    : null

                return {
                    ...punchlistItem,
                    assignedMembers,
                    relatedScheduleProject
                }
            })
        )

        return {
            data: punchlistItemsWithDetails as PunchlistItemWithDetails[],
            totalCount: count || 0
        }
    }

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

        // Get assignments and related schedule project
        const assignedMembers = await this.getAssignmentsForPunchlistItem(punchlistItemId)
        const relatedScheduleProject = punchlistItem.related_schedule_project_id
            ? await this.getRelatedScheduleProject(punchlistItem.related_schedule_project_id)
            : null

        return {
            ...punchlistItem,
            assignedMembers,
            relatedScheduleProject
        } as PunchlistItemWithDetails
    }

    // ==============================================
    // NEW METHODS FOR STATUS COORDINATION
    // ==============================================

    /**
     * Get punchlist items by schedule project (for blocking logic)
     */
    async getPunchlistItemsByScheduleProject(
        scheduleProjectId: string,
        companyId: string,
        options?: {
            status?: ('open' | 'assigned' | 'in_progress' | 'pending_review' | 'completed' | 'rejected' | 'on_hold')[]
            priority?: ('low' | 'medium' | 'high' | 'critical')[]
            includeResolved?: boolean
        }
    ): Promise<any[]> {
        let query = this.supabaseClient
            .from('punchlist_items')
            .select(`
            *,
            project:projects!inner(
                id,
                name,
                status
            ),
            relatedScheduleProject:schedule_projects(
                id,
                title,
                status
            ),
            reporter:users!punchlist_items_reported_by_fkey(
                id,
                first_name,
                last_name,
                email
            ),
            inspector:users!punchlist_items_inspected_by_fkey(
                id,
                first_name,
                last_name,
                email
            )
        `)
            .eq('related_schedule_project_id', scheduleProjectId)
            .eq('company_id', companyId)

        // Apply status filter if provided
        if (options?.status && options.status.length > 0) {
            query = query.in('status', options.status)
        } else if (!options?.includeResolved) {
            // By default, exclude completed and rejected items
            query = query.not('status', 'in', ['completed', 'rejected'])
        }

        // Apply priority filter if provided
        if (options?.priority && options.priority.length > 0) {
            query = query.in('priority', options.priority)
        }

        // Order by priority (critical first) and created date
        query = query.order('priority', { ascending: false })
            .order('created_at', { ascending: true })

        const { data: punchlistItems, error } = await query

        if (error) {
            console.error('Error fetching punchlist items by schedule project:', error)
            throw new Error('Failed to fetch punchlist items')
        }

        return punchlistItems || []
    }

    /**
     * Get punchlist items blocking a schedule project completion
     */
    async getBlockingPunchlistItems(
        scheduleProjectId: string,
        companyId: string
    ): Promise<{
        blockingItems: any[]
        criticalCount: number
        highCount: number
        canComplete: boolean
    }> {
        try {
            // Get high and critical priority items that are not resolved
            const blockingItems = await this.getPunchlistItemsByScheduleProject(
                scheduleProjectId,
                companyId,
                {
                    status: ['open', 'assigned', 'in_progress', 'pending_review'],
                    priority: ['high', 'critical'],
                    includeResolved: false
                }
            )

            const criticalCount = blockingItems.filter(item => item.priority === 'critical').length
            const highCount = blockingItems.filter(item => item.priority === 'high').length

            // Business rule: Critical items always block, high items block if > 2
            const canComplete = criticalCount === 0 && highCount <= 2

            return {
                blockingItems,
                criticalCount,
                highCount,
                canComplete
            }

        } catch (error) {
            console.error('Error getting blocking punchlist items:', error)
            return {
                blockingItems: [],
                criticalCount: 0,
                highCount: 0,
                canComplete: false
            }
        }
    }

    /**
     * Get punchlist item statistics for a project
     */
    async getPunchlistStatsByProject(
        projectId: string,
        companyId: string
    ): Promise<{
        total: number
        byStatus: Record<string, number>
        byPriority: Record<string, number>
        byIssueType: Record<string, number>
        completionRate: number
        averageResolutionDays: number
        overdueCount: number
    }> {
        const { data: punchlistItems, error } = await this.supabaseClient
            .from('punchlist_items')
            .select(`
            status,
            priority, 
            issue_type,
            due_date,
            created_at,
            completed_at
        `)
            .eq('project_id', projectId)
            .eq('company_id', companyId)

        if (error) {
            console.error('Error fetching punchlist stats:', error)
            return {
                total: 0,
                byStatus: {},
                byPriority: {},
                byIssueType: {},
                completionRate: 0,
                averageResolutionDays: 0,
                overdueCount: 0
            }
        }

        const stats = {
            total: punchlistItems.length,
            byStatus: {} as Record<string, number>,
            byPriority: {} as Record<string, number>,
            byIssueType: {} as Record<string, number>,
            completionRate: 0,
            averageResolutionDays: 0,
            overdueCount: 0
        }

        if (punchlistItems.length === 0) {
            return stats
        }

        const now = new Date()
        let totalResolutionDays = 0
        let resolvedCount = 0

        // Calculate statistics
        punchlistItems.forEach(item => {
            // Count by status
            stats.byStatus[item.status] = (stats.byStatus[item.status] || 0) + 1

            // Count by priority
            stats.byPriority[item.priority] = (stats.byPriority[item.priority] || 0) + 1

            // Count by issue type
            stats.byIssueType[item.issue_type] = (stats.byIssueType[item.issue_type] || 0) + 1

            // Count overdue items
            if (item.due_date && new Date(item.due_date) < now && item.status !== 'completed') {
                stats.overdueCount++
            }

            // Calculate resolution time for completed items
            if (item.status === 'completed' && item.completed_at) {
                const createdDate = new Date(item.created_at)
                const completedDate = new Date(item.completed_at)
                const resolutionDays = (completedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
                totalResolutionDays += resolutionDays
                resolvedCount++
            }
        })

        // Calculate completion rate
        const completedCount = stats.byStatus['completed'] || 0
        stats.completionRate = (completedCount / stats.total) * 100

        // Calculate average resolution days
        if (resolvedCount > 0) {
            stats.averageResolutionDays = totalResolutionDays / resolvedCount
        }

        return stats
    }

    /**
     * Remove team member from all punchlist assignments
     */
    async removeTeamMemberFromAllPunchlistItems(
        userId: string,
        companyId: string
    ): Promise<{
        removedCount: number
        affectedPunchlistItems: string[]
    }> {
        try {
            // First, find all punchlist items where this user is assigned via project_members
            // Since we're using the new punchlist_item_assignments table, we need to query that
            const { data: assignments, error: fetchError } = await this.supabaseClient
                .from('punchlist_item_assignments')
                .select(`
                id,
                punchlist_item_id,
                project_member:project_members!inner(
                    id,
                    user_id
                )
            `)
                .eq('company_id', companyId)
                .eq('is_active', true)
                .eq('project_members.user_id', userId)

            if (fetchError) {
                console.error('Error fetching punchlist assignments:', fetchError)
                throw fetchError
            }

            if (!assignments || assignments.length === 0) {
                return { removedCount: 0, affectedPunchlistItems: [] }
            }

            let removedCount = 0
            const affectedIds = []

            // Deactivate each assignment
            for (const assignment of assignments) {
                const { error: updateError } = await this.supabaseClient
                    .from('punchlist_item_assignments')
                    .update({
                        is_active: false,
                        removed_at: new Date().toISOString(),
                        removed_by: userId, // You might want to pass the admin user ID here
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', assignment.id)

                if (updateError) {
                    console.error(`Error removing punchlist assignment ${assignment.id}:`, updateError)
                } else {
                    removedCount++
                    if (!affectedIds.includes(assignment.punchlist_item_id)) {
                        affectedIds.push(assignment.punchlist_item_id)
                    }
                }
            }

            return { removedCount, affectedPunchlistItems: affectedIds }

        } catch (error) {
            console.error('Error removing team member from punchlist items:', error)
            return { removedCount: 0, affectedPunchlistItems: [] }
        }
    }

    /**
     * Update punchlist item status with coordination hooks
     */
    async updatePunchlistItemStatusCoordinated(
        punchlistItemId: string,
        companyId: string,
        data: {
            status: 'open' | 'assigned' | 'in_progress' | 'pending_review' | 'completed' | 'rejected' | 'on_hold'
            actualHours?: number
            resolutionNotes?: string
            rejectionReason?: string
            inspectionPassed?: boolean
            inspectionNotes?: string
            triggeredBy?: 'user' | 'schedule_cascade' | 'bulk_update'
            userId?: string
        }
    ) {
        // Validate status transition if not triggered by system
        if (data.triggeredBy === 'user') {
            // Get current status to validate transition
            const { data: currentItem } = await this.supabaseClient
                .from('punchlist_items')
                .select('status')
                .eq('id', punchlistItemId)
                .eq('company_id', companyId)
                .single()

            if (currentItem) {
                // Apply your status transition validation rules here
                // Based on PUNCHLIST_STATUS_TRANSITIONS from your types
            }
        }

        // Prepare update data
        const updateData: any = {
            status: data.status,
            updated_at: new Date().toISOString(),
        }

        if (data.actualHours !== undefined) updateData.actual_hours = data.actualHours
        if (data.resolutionNotes !== undefined) updateData.resolution_notes = data.resolutionNotes
        if (data.rejectionReason !== undefined) updateData.rejection_reason = data.rejectionReason
        if (data.inspectionNotes !== undefined) updateData.inspection_notes = data.inspectionNotes

        // Handle status-specific logic
        if (data.status === 'completed') {
            updateData.completed_at = new Date().toISOString()
            if (data.inspectionPassed !== undefined) {
                updateData.inspection_passed = data.inspectionPassed
                updateData.inspected_at = new Date().toISOString()
                if (data.userId) {
                    updateData.inspected_by = data.userId
                }
            }
        }

        if (data.status === 'assigned' && !updateData.assigned_at) {
            // Set assigned timestamp if not already set
            const { data: currentItem } = await this.supabaseClient
                .from('punchlist_items')
                .select('assigned_at')
                .eq('id', punchlistItemId)
                .single()

            if (currentItem && !currentItem.assigned_at) {
                updateData.assigned_at = new Date().toISOString()
            }
        }

        const { data: punchlistItem, error } = await this.supabaseClient
            .from('punchlist_items')
            .update(updateData)
            .eq('id', punchlistItemId)
            .eq('company_id', companyId)
            .select('*')
            .single()

        if (error) {
            console.error('Error updating punchlist item status:', error)
            throw new Error('Failed to update punchlist item status')
        }

        return punchlistItem
    }

    /**
     * Batch update multiple punchlist items (for cascade operations)
     */
    async batchUpdatePunchlistItemStatus(
        updates: Array<{
            id: string
            status: 'open' | 'assigned' | 'in_progress' | 'pending_review' | 'completed' | 'rejected' | 'on_hold'
            notes?: string
        }>,
        companyId: string,
        triggeredBy: 'schedule_cascade' | 'admin_bulk' = 'schedule_cascade',
        userId?: string
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
                await this.updatePunchlistItemStatusCoordinated(
                    update.id,
                    companyId,
                    {
                        status: update.status,
                        resolutionNotes: update.notes,
                        triggeredBy,
                        userId
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

    /**
     * Check punchlist item assignment validity for team member
     */
    async validatePunchlistAssignment(
        punchlistItemId: string,
        projectMemberId: string,
        companyId: string
    ): Promise<{
        isValid: boolean
        reason?: string
        projectMember?: any
    }> {
        try {
            // Check if project member exists and is active
            const { data: projectMember, error } = await this.supabaseClient
                .from('project_members')
                .select(`
                id,
                status,
                user:users!inner(
                    id,
                    first_name,
                    last_name,
                    is_active,
                    trade_specialty
                ),
                project:projects!inner(
                    id,
                    name,
                    status
                )
            `)
                .eq('id', projectMemberId)
                .eq('company_id', companyId)
                .single()

            if (error || !projectMember) {
                return {
                    isValid: false,
                    reason: 'Project member not found'
                }
            }

            if (!projectMember.user.is_active) {
                return {
                    isValid: false,
                    reason: 'User account is inactive',
                    projectMember
                }
            }

            if (projectMember.status !== 'active') {
                return {
                    isValid: false,
                    reason: 'Project member is not active on project',
                    projectMember
                }
            }

            // Check if punchlist item belongs to the same project
            const { data: punchlistItem } = await this.supabaseClient
                .from('punchlist_items')
                .select('project_id')
                .eq('id', punchlistItemId)
                .eq('company_id', companyId)
                .single()

            if (punchlistItem && punchlistItem.project_id !== projectMember.project.id) {
                return {
                    isValid: false,
                    reason: 'Project member is not assigned to the same project as punchlist item',
                    projectMember
                }
            }

            return {
                isValid: true,
                projectMember
            }

        } catch (error) {
            console.error('Error validating punchlist assignment:', error)
            return {
                isValid: false,
                reason: 'Validation error occurred'
            }
        }
    }

    // ==============================================
    // HELPER METHODS
    // ==============================================
    async getAssignmentsForPunchlistItem(punchlistItemId: string): Promise<PunchlistItemAssignment[]> {
        console.log('🔍 DEBUG: Fetching assignments for punchlist item', { punchlistItemId })

        try {
            const { data: assignments, error } = await this.supabaseClient
                .from('punchlist_item_assignments')
                .select(`
                id,
                project_member_id,
                role,
                assigned_at,
                assigned_by,
                is_active,
                project_members!inner(
                    id,
                    hourly_rate,
                    user:users!project_members_user_id_users_id_fk(
                        id,
                        first_name, 
                        last_name, 
                        email, 
                        trade_specialty
                    )
                )
            `)
                .eq('punchlist_item_id', punchlistItemId)
                .eq('is_active', true)
                .order('assigned_at', { ascending: true })

            if (error) {
                console.error('🚨 Error fetching assignments:', error)
                console.log('🔄 Trying simpler query approach...')
                return await this.getAssignmentsSimple(punchlistItemId)
            }

            console.log('✅ Raw assignments from Supabase', {
                count: assignments?.length || 0,
                sampleAssignment: assignments?.[0]
            })

            if (!assignments || assignments.length === 0) {
                console.log('📝 No assignments found for this punchlist item')
                return []
            }

            // ✅ FIXED: Proper type handling
            return assignments.map(assignment => {
                console.log('🔍 Processing assignment', {
                    id: assignment.id,
                    project_members: assignment.project_members,
                    project_members_type: Array.isArray(assignment.project_members) ? 'array' : 'object'
                })

                // Handle project_members array
                const projectMember = Array.isArray(assignment.project_members)
                    ? assignment.project_members[0]
                    : assignment.project_members

                // Handle user array within project member
                const userData = projectMember?.user
                const user = Array.isArray(userData) ? userData[0] : userData

                console.log('🔍 Processed data', {
                    projectMember,
                    userData,
                    user,
                    hasUser: !!user
                })

                // ✅ FIXED: Create the assignment object with proper types
                const assignmentResult: PunchlistItemAssignment = {
                    id: assignment.id,
                    projectMemberId: assignment.project_member_id,
                    role: assignment.role as 'primary' | 'secondary' | 'inspector' | 'supervisor',
                    assignedAt: assignment.assigned_at,
                    assignedBy: assignment.assigned_by,
                    isActive: assignment.is_active,
                    user: user ? {
                        id: user.id,
                        firstName: user.first_name,
                        lastName: user.last_name,
                        email: user.email,
                        tradeSpecialty: user.trade_specialty,
                    } : null,
                    hourlyRate: projectMember?.hourly_rate ?? undefined, // ✅ Convert null to undefined
                }

                return assignmentResult
            })

        } catch (error) {
            console.error('🚨 Unexpected error fetching assignments:', error)
            return []
        }
    }

    async getAssignmentsSimple(punchlistItemId: string): Promise<PunchlistItemAssignment[]> {
        try {
            console.log('🔄 Using simple assignment query')

            // Step 1: Get basic assignment data
            const { data: assignments, error: assignmentError } = await this.supabaseClient
                .from('punchlist_item_assignments')
                .select('id, project_member_id, role, assigned_at, assigned_by, is_active')
                .eq('punchlist_item_id', punchlistItemId)
                .eq('is_active', true)
                .order('assigned_at', { ascending: true })

            if (assignmentError) {
                console.error('🚨 Error in simple assignment query:', assignmentError)
                return []
            }

            if (!assignments || assignments.length === 0) {
                console.log('📝 No assignments found in simple query')
                return []
            }

            console.log('✅ Found assignments, enriching with user data', { count: assignments.length })

            // Step 2: Get project member and user data for each assignment
            const enrichedAssignments: PunchlistItemAssignment[] = []

            for (const assignment of assignments) {
                try {
                    // Get project member data
                    const { data: projectMember, error: memberError } = await this.supabaseClient
                        .from('project_members')
                        .select('id, user_id, hourly_rate')
                        .eq('id', assignment.project_member_id)
                        .single()

                    if (memberError || !projectMember) {
                        console.error('🚨 Error fetching project member:', memberError)
                        // Still add the assignment but without user data
                        enrichedAssignments.push({
                            id: assignment.id,
                            projectMemberId: assignment.project_member_id,
                            role: assignment.role as 'primary' | 'secondary' | 'inspector' | 'supervisor',
                            assignedAt: assignment.assigned_at,
                            assignedBy: assignment.assigned_by,
                            isActive: assignment.is_active,
                            user: null,
                            hourlyRate: undefined, // ✅ Use undefined instead of null
                        })
                        continue
                    }

                    // Get user data
                    const { data: user, error: userError } = await this.supabaseClient
                        .from('users')
                        .select('id, first_name, last_name, email, trade_specialty')
                        .eq('id', projectMember.user_id)
                        .single()

                    enrichedAssignments.push({
                        id: assignment.id,
                        projectMemberId: assignment.project_member_id,
                        role: assignment.role as 'primary' | 'secondary' | 'inspector' | 'supervisor',
                        assignedAt: assignment.assigned_at,
                        assignedBy: assignment.assigned_by,
                        isActive: assignment.is_active,
                        user: (userError || !user) ? null : {
                            id: user.id,
                            firstName: user.first_name,
                            lastName: user.last_name,
                            email: user.email,
                            tradeSpecialty: user.trade_specialty,
                        },
                        hourlyRate: projectMember.hourly_rate ?? undefined, // ✅ Convert null to undefined
                    })

                } catch (error) {
                    console.error('🚨 Error enriching assignment:', error)
                    // Add assignment with null user data
                    enrichedAssignments.push({
                        id: assignment.id,
                        projectMemberId: assignment.project_member_id,
                        role: assignment.role as 'primary' | 'secondary' | 'inspector' | 'supervisor',
                        assignedAt: assignment.assigned_at,
                        assignedBy: assignment.assigned_by,
                        isActive: assignment.is_active,
                        user: null,
                        hourlyRate: undefined, // ✅ Use undefined instead of null
                    })
                }
            }

            console.log('✅ Enriched assignments completed', {
                total: enrichedAssignments.length,
                withUsers: enrichedAssignments.filter(a => a.user !== null).length
            })

            return enrichedAssignments

        } catch (error) {
            console.error('🚨 Error in simple assignments method:', error)
            return []
        }
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

    // ==============================================
    // FIXED: getProjectMembersForProject without role column
    // ==============================================

    async getProjectMembersForProject(projectId: string, companyId: string) {
        console.log('🔍 DEBUG: Fetching project members', { projectId, companyId })

        const { data: projectMembers, error } = await this.supabaseClient
            .from('project_members')
            .select(`
            id,
            user_id,
            user:users!project_members_user_id_users_id_fk(
                id,
                first_name, 
                last_name, 
                email,
                trade_specialty
            ),
            hourly_rate,
            status,
            joined_at,
            notes
        `)
            .eq('project_id', projectId)
            .eq('company_id', companyId)
            .eq('status', 'active')
            .is('left_at', null)

        if (error) {
            console.error('🚨 Error fetching project members:', error)
            throw new Error(`Failed to fetch project members: ${error.message}`)
        }

        console.log('🔍 DEBUG: Raw database response', {
            count: projectMembers?.length || 0,
            sampleMember: projectMembers?.[0],
            userStructure: projectMembers?.[0]?.user
        })

        // Transform and handle user array
        const transformedMembers = projectMembers?.map(pm => {
            // Handle user being an array - take the first item
            const userData = Array.isArray(pm.user) ? pm.user[0] : pm.user

            return {
                id: pm.id,
                userId: pm.user_id,
                role: 'member', // ✅ FIXED: Default role since column doesn't exist
                hourlyRate: pm.hourly_rate,
                isActive: pm.status === 'active',
                status: pm.status,
                joinedAt: pm.joined_at,
                notes: pm.notes,
                user: userData ? {
                    id: userData.id,
                    firstName: userData.first_name,
                    lastName: userData.last_name,
                    email: userData.email,
                    tradeSpecialty: userData.trade_specialty
                } : null
            }
        }) || []

        console.log('🔍 DEBUG: Transformed project members', {
            count: transformedMembers.length,
            members: transformedMembers.map(pm => ({
                id: pm.id,
                userId: pm.userId,
                userName: `${pm.user?.firstName || 'Unknown'} ${pm.user?.lastName || 'User'}`,
                isActive: pm.isActive,
                status: pm.status
            }))
        })

        return transformedMembers
    }

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

    // async getRelatedScheduleProject(scheduleProjectId: string) {
    //     const { data: scheduleProject, error } = await this.supabaseClient
    //         .from('schedule_projects')
    //         .select('id, title, status')
    //         .eq('id', scheduleProjectId)
    //         .single()

    //     if (error) {
    //         console.error('Error fetching related schedule project:', error)
    //         return null
    //     }

    //     return scheduleProject
    // }

    // async getProjectMembersForProject(projectId: string, companyId: string) {

    //     const { data: projectMembers, error } = await this.supabaseClient
    //         .from('project_members')
    //         .select(`
    //         id,
    //         user_id,
    //         user:users!project_members_user_id_users_id_fk(first_name, last_name, trade_specialty),
    //         hourly_rate,
    //         status,
    //         joined_at,
    //         notes
    //     `)
    //         .eq('project_id', projectId)
    //         .eq('company_id', companyId)
    //         .eq('status', 'active')
    //         .is('left_at', null)  // Only get members who haven't left

    //     if (error) {
    //         console.error('🚨 Error fetching project members:', error)
    //         throw new Error('Failed to fetch project members')
    //     }

    //     return projectMembers || []
    // }

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