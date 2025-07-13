// ==============================================
// src/app/api/punchlist-items/route.ts - Punchlist Items API Routes
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import {
    validateCreatePunchlistItem,
    validateGetPunchlistItems,
    formatPunchlistItemErrors,
    transformCreatePunchlistItemData,
} from '@/lib/validations/punchlist/punchlist-items'
import { PunchlistItemDatabaseService } from '@/lib/database/services/punchlist-items'
import { ProjectDatabaseService } from '@/lib/database/services/projects'
import { ScheduleProjectDatabaseService } from '@/lib/database/services/schedule-projects'

// ==============================================
// HELPER FUNCTION - Status Transformation
// ==============================================
function transformStatusForDatabase(frontendStatus?: string): 'open' | 'assigned' | 'in_progress' | 'completed' | 'rejected' {
    switch (frontendStatus) {
        case 'pending_review':
            return 'in_progress' // Map pending_review to in_progress for database
        case 'on_hold':
            return 'assigned' // Map on_hold to assigned for database
        case 'open':
        case 'assigned':
        case 'in_progress':
        case 'completed':
        case 'rejected':
            return frontendStatus as any
        default:
            return 'open'
    }
}

// ==============================================
// GET /api/punchlist-items - Get All Punchlist Items for Company
// ==============================================
export async function GET(request: NextRequest) {
    try {
        // Get user info from middleware
        const userId = request.headers.get('x-user-id')
        const companyId = request.headers.get('x-company-id')

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

        // Parse query parameters - ✅ FIXED: Following schedule pattern exactly
        const url = new URL(request.url)
        const queryParams = {
            projectId: url.searchParams.get('projectId') || undefined,
            relatedScheduleProjectId: url.searchParams.get('relatedScheduleProjectId') || undefined,
            status: url.searchParams.get('status') || undefined,
            priority: url.searchParams.get('priority') || undefined,
            issueType: url.searchParams.get('issueType') || undefined,
            tradeCategory: url.searchParams.get('tradeCategory') || undefined,
            assignedToUserId: url.searchParams.get('assignedToUserId') || undefined,
            reportedBy: url.searchParams.get('reportedBy') || undefined,
            dueDateFrom: url.searchParams.get('dueDateFrom') || undefined,
            dueDateTo: url.searchParams.get('dueDateTo') || undefined,
            requiresInspection: url.searchParams.get('requiresInspection') === 'true' ? true : undefined,
            isOverdue: url.searchParams.get('isOverdue') === 'true' ? true : undefined,
            search: url.searchParams.get('search') || undefined,
            limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : 20,
            offset: url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset')!) : 0,
            sortBy: url.searchParams.get('sortBy') || 'createdAt',
            sortOrder: url.searchParams.get('sortOrder') || 'desc',
        }

        // Validate query parameters
        const validation = validateGetPunchlistItems(queryParams)
        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid query parameters',
                    details: formatPunchlistItemErrors(validation.error),
                },
                { status: 400 }
            )
        }

        // Create service instance
        const punchlistService = new PunchlistItemDatabaseService(true, false)

        // Transform validation data for database service
        const { status, ...otherFilters } = validation.data

        const databaseFilters = {
            ...otherFilters,
            // Transform status filter for database compatibility
            ...(status && { status: transformStatusForDatabase(status) }),
        }

        // Get punchlist items with filters
        const result = await punchlistService.getPunchlistItems(companyId, databaseFilters)

        return NextResponse.json(
            {
                success: true,
                data: {
                    punchlistItems: result.data,
                    pagination: {
                        total: result.totalCount,
                        limit: validation.data.limit || 20,
                        offset: validation.data.offset || 0,
                        hasMore: result.totalCount > ((validation.data.offset || 0) + (validation.data.limit || 20)),
                    }
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
// POST /api/punchlist-items - Create New Punchlist Item
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

        // Verify assigned project member if provided
        if (validation.data.assignedProjectMemberId) {

            try {
                const projectMembers = await punchlistService.getProjectMembersForProject(validation.data.projectId, companyId)

                // CHANGED: Check if the user_id exists in project members (not project_member_id)
                const assignedMember = projectMembers.find(pm => pm.user_id === validation.data.assignedProjectMemberId)

                if (!assignedMember) {
                    return NextResponse.json(
                        {
                            success: false,
                            error: 'Invalid assignment',
                            message: 'The specified user is not assigned to this project.',
                            debug: {
                                sentUserId: validation.data.assignedProjectMemberId,
                                availableUsers: projectMembers.map(pm => ({
                                    user_id: pm.user_id,
                                    // name: `${pm.user?.first_name} ${pm.user?.last_name}`
                                }))
                            }
                        },
                        { status: 400 }
                    )
                }

                // IMPORTANT: Replace the user_id with the actual project_member_id for database storage
                validation.data.assignedProjectMemberId = assignedMember.id

            } catch (memberError) {
                console.error('🚨 Error fetching project members:', memberError)
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Database error',
                        message: 'Failed to verify user assignment.',
                        // debug: { originalError: memberError.message }
                    },
                    { status: 500 }
                )
            }
        }

        // Transform form data for database (handle status mapping)
        const { status, ...validationDataWithoutStatus } = validation.data
        const punchlistData = {
            ...validationDataWithoutStatus,
            companyId,
            reportedBy: userId,
            // Transform status for database compatibility
            status: transformStatusForDatabase(status),
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