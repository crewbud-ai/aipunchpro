// ==============================================
// src/app/api/punchlist-items/[id]/route.ts - Individual Punchlist Item API Routes (COMPLETE FIXED)
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import {
    validateUpdatePunchlistItem,
    formatPunchlistItemErrors,
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
// GET /api/punchlist-items/[id] - Get Specific Punchlist Item Details
// ==============================================
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Get user info from middleware
        const userId = request.headers.get('x-user-id')
        const companyId = request.headers.get('x-company-id')

        if (!userId || !companyId) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Authentication required',
                    message: 'You must be logged in to view punchlist item details.',
                },
                { status: 401 }
            )
        }

        const punchlistItemId = params.id

        if (!punchlistItemId) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid request',
                    message: 'Punchlist item ID is required.',
                },
                { status: 400 }
            )
        }

        // Create service instance
        const punchlistService = new PunchlistItemDatabaseService(true, false)

        // Check if punchlist item exists and belongs to company
        const punchlistItemExists = await punchlistService.checkPunchlistItemExists(punchlistItemId, companyId)
        if (!punchlistItemExists) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Punchlist item not found',
                    message: 'The requested punchlist item does not exist or you do not have access to view it.',
                },
                { status: 404 }
            )
        }

        // Get punchlist item details
        const punchlistItem = await punchlistService.getPunchlistItemById(punchlistItemId, companyId)

        if (!punchlistItem) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Punchlist item not found',
                    message: 'The requested punchlist item could not be found.',
                },
                { status: 404 }
            )
        }

        return NextResponse.json(
            {
                success: true,
                data: punchlistItem,
                message: 'Punchlist item retrieved successfully.',
            },
            { status: 200 }
        )
    } catch (error) {
        console.error('Error in GET /api/punchlist-items/[id]:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                message: 'An unexpected error occurred while fetching the punchlist item.',
            },
            { status: 500 }
        )
    }
}

// ==============================================
// PATCH /api/punchlist-items/[id] - Update Punchlist Item (FIXED)
// ==============================================
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Get user info from middleware
        const userId = request.headers.get('x-user-id')
        const companyId = request.headers.get('x-company-id')

        if (!userId || !companyId) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Authentication required',
                    message: 'You must be logged in to update punchlist items.',
                },
                { status: 401 }
            )
        }

        const punchlistItemId = params.id

        if (!punchlistItemId) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid request',
                    message: 'Punchlist item ID is required.',
                },
                { status: 400 }
            )
        }

        // Parse request body
        const body = await request.json()

        // Add ID to validation data
        const validationData = { ...body, id: punchlistItemId }

        // Validate input data
        const validation = validateUpdatePunchlistItem(validationData)
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

        // Check if punchlist item exists and belongs to company
        const punchlistItemExists = await punchlistService.checkPunchlistItemExists(punchlistItemId, companyId)
        if (!punchlistItemExists) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Punchlist item not found',
                    message: 'The requested punchlist item does not exist or you do not have access to update it.',
                },
                { status: 404 }
            )
        }

        // ✅ FIXED: Extract fields that actually exist in validation data
        const {
            id: validationId,
            assignedProjectMemberId: newAssignedProjectMemberId,
            status: newStatus,
            ...otherUpdateData
        } = validation.data

        // Note: projectId and relatedScheduleProjectId are NOT included in update validation
        // They cannot be changed via the update endpoint - only during creation

        // If assigned project member is being changed, verify assignment is valid
        if (newAssignedProjectMemberId) {
            // Get the current punchlist item to determine which project to check against
            const currentPunchlistItem = await punchlistService.getPunchlistItemById(punchlistItemId, companyId)
            const projectIdToCheck = currentPunchlistItem?.projectId

            if (projectIdToCheck) {
                const projectMembers = await punchlistService.getProjectMembersForProject(projectIdToCheck, companyId)
                const assignedMemberExists = projectMembers.some(pm => pm.id === newAssignedProjectMemberId)

                if (!assignedMemberExists) {
                    return NextResponse.json(
                        {
                            success: false,
                            error: 'Invalid assignment',
                            message: 'The specified team member is not assigned to this project.',
                        },
                        { status: 400 }
                    )
                }
            }
        }

        // ✅ FIXED: Create update data with proper type handling
        const updateData = {
            ...otherUpdateData,
            // Include the properly typed fields conditionally
            ...(newAssignedProjectMemberId && { assignedProjectMemberId: newAssignedProjectMemberId }),
            // Transform status for database compatibility
            ...(newStatus && { status: transformStatusForDatabase(newStatus) }),
            // Add inspector information if inspection fields are being updated
            ...(otherUpdateData.inspectionPassed !== undefined || otherUpdateData.inspectionNotes !== undefined
                ? { inspectedBy: userId }
                : {})
        }

        // Update punchlist item
        const updatedPunchlistItem = await punchlistService.updatePunchlistItem(
            punchlistItemId,
            companyId,
            updateData
        )

        // Get updated punchlist item with full details
        const punchlistItemWithDetails = await punchlistService.getPunchlistItemById(punchlistItemId, companyId)

        return NextResponse.json(
            {
                success: true,
                data: punchlistItemWithDetails,
                message: 'Punchlist item updated successfully.',
            },
            { status: 200 }
        )
    } catch (error) {
        console.error('Error in PATCH /api/punchlist-items/[id]:', error)

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
        }

        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                message: 'An unexpected error occurred while updating the punchlist item.',
            },
            { status: 500 }
        )
    }
}

// ==============================================
// DELETE /api/punchlist-items/[id] - Delete Punchlist Item
// ==============================================
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Get user info from middleware
        const userId = request.headers.get('x-user-id')
        const companyId = request.headers.get('x-company-id')

        if (!userId || !companyId) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Authentication required',
                    message: 'You must be logged in to delete punchlist items.',
                },
                { status: 401 }
            )
        }

        const punchlistItemId = params.id

        if (!punchlistItemId) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid request',
                    message: 'Punchlist item ID is required.',
                },
                { status: 400 }
            )
        }

        // Create service instance
        const punchlistService = new PunchlistItemDatabaseService(true, false)

        // Check if punchlist item exists and belongs to company
        const punchlistItemExists = await punchlistService.checkPunchlistItemExists(punchlistItemId, companyId)
        if (!punchlistItemExists) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Punchlist item not found',
                    message: 'The requested punchlist item does not exist or you do not have access to delete it.',
                },
                { status: 404 }
            )
        }

        // Optional: Check if item can be deleted (business logic)
        const punchlistItem = await punchlistService.getPunchlistItemById(punchlistItemId, companyId)
        if (punchlistItem?.status === 'completed') {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Cannot delete',
                    message: 'Cannot delete completed punchlist items. Please reject the item first if deletion is necessary.',
                },
                { status: 409 }
            )
        }

        // Delete punchlist item
        await punchlistService.deletePunchlistItem(punchlistItemId, companyId)

        return NextResponse.json(
            {
                success: true,
                message: 'Punchlist item deleted successfully.',
            },
            { status: 200 }
        )
    } catch (error) {
        console.error('Error in DELETE /api/punchlist-items/[id]:', error)

        // Handle specific database errors
        if (error instanceof Error) {
            if (error.message.includes('foreign key')) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Cannot delete',
                        message: 'Cannot delete this punchlist item because it has related data. Please remove related references first.',
                    },
                    { status: 409 }
                )
            }
        }

        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                message: 'An unexpected error occurred while deleting the punchlist item.',
            },
            { status: 500 }
        )
    }
}