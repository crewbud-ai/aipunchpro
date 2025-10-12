// ==============================================
// app/api/punchlist-items/route.ts - UPDATED FOR MULTIPLE ASSIGNMENTS
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import {
    validateCreatePunchlistItem,
    formatPunchlistItemErrors,
} from '@/lib/validations/punchlist/punchlist-items'
import { PunchlistItemDatabaseService } from '@/lib/database/services/punchlist-items'
import { ProjectDatabaseService } from '@/lib/database/services/projects'
import { ScheduleProjectDatabaseService } from '@/lib/database/services/schedule-projects'

// ==============================================
// POST /api/punchlist-items - Create New Punchlist Item (UPDATED)
// ==============================================
export async function POST(request: NextRequest) {
    try {
        // Get user info from middleware
        const userId = request.headers.get('x-user-id')
        const companyId = request.headers.get('x-company-id')

        if (!userId || !companyId) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Authentication required',
                    message: 'You must be logged in to create punchlist items.',
                },
                { status: 401 }
            )
        }

        // Parse request body
        const body = await request.json()

        // Validate input data
        const validation = validateCreatePunchlistItem(body)
        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Validation failed',
                    details: formatPunchlistItemErrors(validation.error),
                },
                { status: 400 }
            )
        }

        // Create service instances
        const punchlistService = new PunchlistItemDatabaseService(true, false)
        const projectService = new ProjectDatabaseService(true, false)
        const scheduleService = new ScheduleProjectDatabaseService(true, false)

        // Verify project exists and belongs to company
        const projectExists = await projectService.checkProjectExists(validation.data.projectId, companyId)
        if (!projectExists) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Project not found',
                    message: 'The specified project does not exist or you do not have access to it.',
                },
                { status: 404 }
            )
        }

        // Verify related schedule project if provided
        if (validation.data.relatedScheduleProjectId) {
            const scheduleProjectExists = await scheduleService.checkScheduleProjectExists(validation.data.relatedScheduleProjectId, companyId)
            if (!scheduleProjectExists) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Schedule project not found',
                        message: 'The specified schedule project does not exist or you do not have access to it.',
                    },
                    { status: 404 }
                )
            }
        }

        // UPDATED: Verify assigned project members if provided
        let validatedAssignments: Array<{
            projectMemberId: string
            role: 'primary' | 'secondary' | 'inspector' | 'supervisor'
        }> = []

        if (validation.data.assignedMembers && validation.data.assignedMembers.length > 0) {
            try {

                const projectMembers = await punchlistService.getProjectMembersForProject(validation.data.projectId, companyId)

                // Convert assignments from userId to projectMemberId
                for (const assignment of validation.data.assignedMembers) {

                    // Try to find by projectMemberId first, then by userId
                    let matchingMember = projectMembers.find(pm => pm.id === assignment.projectMemberId)

                    if (!matchingMember) {
                        // If not found by projectMemberId, try to find by userId
                        matchingMember = projectMembers.find(pm =>
                            (pm.userId) === assignment.projectMemberId
                        )
                    }

                    if (!matchingMember) {

                        return NextResponse.json({
                            success: false,
                            error: 'Invalid assignment',
                            message: `Team member with ID ${assignment.projectMemberId} is not assigned to this project.`,
                            debug: {
                                submittedId: assignment.projectMemberId,
                                availableMembers: projectMembers.map(pm => ({
                                    projectMemberId: pm.id,
                                    userId: pm.userId,
                                    name: `${pm.user?.firstName || 'Unknown'} ${pm.user?.lastName || 'User'}`,
                                    status: pm.status,
                                    isActive: pm.isActive
                                })),
                                projectId: validation.data.projectId,
                                companyId,
                                hint: 'Make sure you are using either the correct userId or projectMemberId'
                            }
                        }, { status: 400 })
                    }

                    // ✅ Store the correct projectMemberId for database insertion
                    validatedAssignments.push({
                        projectMemberId: matchingMember.id, // Always use the actual projectMemberId
                        role: assignment.role || 'primary'
                    })
                }

            } catch (memberError) {
                return NextResponse.json({
                    success: false,
                    error: 'Database error',
                    message: 'Failed to verify project member assignments.',
                    debug: {
                        error: memberError instanceof Error ? memberError.message : 'Unknown error',
                        projectId: validation.data.projectId,
                        companyId
                    }
                }, { status: 500 })
            }
        }

        // Transform form data for database with proper typing
        const { status, assignedMembers, ...validationDataWithoutStatusAndMembers } = validation.data
        const punchlistData = {
            ...validationDataWithoutStatusAndMembers,
            companyId,
            reportedBy: userId,
            // Transform status for database compatibility with proper typing
            status: transformStatusForDatabase(status) as 'open' | 'assigned' | 'in_progress' | 'pending_review' | 'completed' | 'rejected' | 'on_hold',
            // Use validated assignments
            assignedMembers: validatedAssignments,
        }

        // Create punchlist item
        const punchlistItem = await punchlistService.createPunchlistItem(punchlistData)

        // Get the created punchlist item with full details
        const punchlistItemWithDetails = await punchlistService.getPunchlistItemById(punchlistItem.id, companyId)

        return NextResponse.json(
            {
                success: true,
                data: {
                    punchlistItem: punchlistItemWithDetails
                },
                message: 'Punchlist item created successfully.',
            },
            { status: 201 }
        )
    } catch (error) {
        console.error('Error in POST /api/punchlist-items:', error)

        // Handle specific database errors
        if (error instanceof Error) {
            if (error.message.includes('foreign key')) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Invalid reference',
                        message: 'One or more referenced items (project, schedule item, or team member) are invalid.',
                    },
                    { status: 400 }
                )
            }

            if (error.message.includes('unique constraint')) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Duplicate entry',
                        message: 'A punchlist item with similar details already exists.',
                    },
                    { status: 409 }
                )
            }
        }

        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                message: 'An unexpected error occurred while creating the punchlist item.',
            },
            { status: 500 }
        )
    }
}


export function toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

export function transformObjectKeys<T = any>(obj: any): T {
    if (obj === null || obj === undefined) {
        return obj
    }

    if (Array.isArray(obj)) {
        return obj.map(item => transformObjectKeys(item)) as T
    }

    if (typeof obj === 'object' && obj.constructor === Object) {
        const transformed: any = {}

        for (const [key, value] of Object.entries(obj)) {
            const camelKey = toCamelCase(key)
            transformed[camelKey] = transformObjectKeys(value)
        }

        return transformed as T
    }

    return obj
}


export function transformPunchlistItem(rawPunchlistItem: any) {
    if (!rawPunchlistItem) return null

    // Transform the main object
    const transformed = transformObjectKeys(rawPunchlistItem)

    // Handle special cases and ensure proper structure
    return {
        ...transformed,
        // Ensure these arrays exist
        photos: transformed.photos || [],
        attachments: transformed.attachments || [],

        // Handle nested objects
        project: transformed.project ? transformObjectKeys(transformed.project) : null,
        reporter: transformed.reporter ? transformObjectKeys(transformed.reporter) : null,
        inspector: transformed.inspector ? transformObjectKeys(transformed.inspector) : null,
        relatedScheduleProject: transformed.relatedScheduleProject ? transformObjectKeys(transformed.relatedScheduleProject) : null,

        // ✅ FIXED: Transform assignedMembers array (no duplicate)
        assignedMembers: (transformed.assignedMembers || []).map((member: any) => ({
            ...transformObjectKeys(member),
            user: member.user ? transformObjectKeys(member.user) : null
        }))
    }
}

// ==============================================
// GET /api/punchlist-items - Get Punchlist Items (UPDATED)
// ==============================================
export async function GET(request: NextRequest) {
    try {
        // Get user info from middleware
        const userId = request.headers.get('x-user-id')
        const companyId = request.headers.get('x-company-id')
        const userRole = request.headers.get('x-user-role')

        if (!userId || !companyId) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Authentication required',
                    message: 'You must be logged in to view punchlist items.',
                },
                { status: 401 }
            )
        }

        // Parse query parameters
        const url = new URL(request.url)

        // Base query params shared for all roles
        const baseFilters = {
            projectId: url.searchParams.get('projectId') || undefined,
            relatedScheduleProjectId: url.searchParams.get('relatedScheduleProjectId') || undefined,
            status: url.searchParams.get('status') as 'open' | 'assigned' | 'in_progress' | 'pending_review' | 'completed' | 'rejected' | 'on_hold' | undefined,
            priority: url.searchParams.get('priority') as 'low' | 'medium' | 'high' | 'critical' | undefined,
            issueType: url.searchParams.get('issueType') as 'defect' | 'incomplete' | 'change_request' | 'safety' | 'quality' | 'rework' | undefined,
            tradeCategory: url.searchParams.get('tradeCategory') as 'general' | 'electrical' | 'plumbing' | 'hvac' | 'framing' | 'drywall' | 'flooring' | 'painting' | 'roofing' | 'concrete' | 'masonry' | 'landscaping' | 'cleanup' | undefined,
            reportedBy: url.searchParams.get('reportedBy') || undefined,
            dueDateFrom: url.searchParams.get('dueDateFrom') || undefined,
            dueDateTo: url.searchParams.get('dueDateTo') || undefined,
            requiresInspection: url.searchParams.get('requiresInspection') === 'true' ? true :
                url.searchParams.get('requiresInspection') === 'false' ? false : undefined,
            isOverdue: url.searchParams.get('isOverdue') === 'true' ? true :
                url.searchParams.get('isOverdue') === 'false' ? false : undefined,
            hasPhotos: url.searchParams.get('hasPhotos') === 'true' ? true :
                url.searchParams.get('hasPhotos') === 'false' ? false : undefined,
            search: url.searchParams.get('search') || undefined,
            limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit') as string, 10) : 20,
            offset: url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset') as string, 10) : 0,
            sortBy: url.searchParams.get('sortBy') || 'createdAt',
            sortOrder: url.searchParams.get('sortOrder') || 'desc',
        }

        // Role-based filtering
        let filters: any = {}

        if (userRole === 'member') {
            // For members, only show punchlist items assigned to them
            // Unless they explicitly request to see someone else's items (e.g., admin viewing a member's tasks)
            filters = {
                ...baseFilters,
                assignedToUserId: url.searchParams.get('assignedToUserId') || userId,
            }

        } else {
            // For admin/superadmin, show all items or filter by specific assignee if requested
            filters = {
                ...baseFilters,
                assignedToUserId: url.searchParams.get('assignedToUserId') || undefined,
            }
        }

        // Create service instance
        const punchlistService = new PunchlistItemDatabaseService(true, false)


        const { data: punchlistItems, totalCount } = await punchlistService.getPunchlistItems(companyId, filters)

        // Convert all items to camelCase
        const transformedItems = punchlistItems.map(item => transformPunchlistItem(item))

        return NextResponse.json(
            {
                success: true,
                data: {
                    punchlistItems: transformedItems,
                    pagination: {
                        total: totalCount,
                        limit: filters.limit,
                        offset: filters.offset,
                        hasMore: (filters.offset + filters.limit) < totalCount,
                    },
                    filters,
                },
                message: 'Punchlist items retrieved successfully.',
            },
            { status: 200 }
        )
    } catch (error) {
        console.error('Error in GET /api/punchlist-items:', error)

        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                message: 'An unexpected error occurred while fetching punchlist items.',
            },
            { status: 500 }
        )
    }
}

// ==============================================
// HELPER FUNCTION (UPDATED)
// ==============================================
function transformStatusForDatabase(status: string): 'open' | 'assigned' | 'in_progress' | 'pending_review' | 'completed' | 'rejected' | 'on_hold' {
    // Map frontend status to database status if needed
    const statusMap: Record<string, 'open' | 'assigned' | 'in_progress' | 'pending_review' | 'completed' | 'rejected' | 'on_hold'> = {
        'open': 'open',
        'assigned': 'assigned',
        'in_progress': 'in_progress',
        'pending_review': 'pending_review',
        'completed': 'completed',
        'rejected': 'rejected',
        'on_hold': 'on_hold'
    }

    return statusMap[status] || 'open'
}