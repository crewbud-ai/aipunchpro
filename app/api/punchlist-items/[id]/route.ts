// ==============================================
// src/app/api/punchlist-items/[id]/route.ts - UPDATED for Multiple Assignments
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import {
    validateUpdatePunchlistItem,
    formatPunchlistItemErrors,
} from '@/lib/validations/punchlist/punchlist-items'
import { PunchlistItemDatabaseService } from '@/lib/database/services/punchlist-items'
import { ProjectDatabaseService } from '@/lib/database/services/projects'
import { ScheduleProjectDatabaseService } from '@/lib/database/services/schedule-projects'

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

        const transformedPunchlistItem = transformPunchlistItem(punchlistItem)


        return NextResponse.json(
            {
                success: true,
                data: {
                    punchlistItem: transformedPunchlistItem
                },
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
// PATCH /api/punchlist-items/[id] - Update Punchlist Item (UPDATED FOR MULTIPLE ASSIGNMENTS)
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

        // Get current punchlist item to check project context
        const currentPunchlistItem = await punchlistService.getPunchlistItemById(punchlistItemId, companyId)
        const projectIdToCheck = currentPunchlistItem?.projectId

        // ✅ UPDATED: Extract fields including multiple assignments
        const {
            id: validationId,
            assignedMembers: newAssignedMembers,
            status: newStatus,
            ...otherUpdateData
        } = validation.data

        // Handle legacy single assignment if provided in the request body directly
        const legacyAssignedMemberId = body.assignedProjectMemberId

        // ✅ NEW: Handle multiple assignments validation
        if (newAssignedMembers && newAssignedMembers.length > 0 && projectIdToCheck) {
            // Get all valid project members for this project
            const projectMembers = await punchlistService.getProjectMembersForProject(projectIdToCheck, companyId)
            const validProjectMemberIds = new Set(projectMembers.map(pm => pm.id))

            // Validate all assigned members
            for (const assignment of newAssignedMembers) {
                if (!validProjectMemberIds.has(assignment.projectMemberId)) {
                    return NextResponse.json(
                        {
                            success: false,
                            error: 'Invalid assignment',
                            message: `Team member with ID ${assignment.projectMemberId} is not assigned to this project.`,
                        },
                        { status: 400 }
                    )
                }
            }
        }

        // ✅ LEGACY: Handle single assignment for backward compatibility
        if (legacyAssignedMemberId && projectIdToCheck) {
            const projectMembers = await punchlistService.getProjectMembersForProject(projectIdToCheck, companyId)
            const assignedMemberExists = projectMembers.some(pm => pm.id === legacyAssignedMemberId)

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

        // ✅ UPDATED: Create update data with proper type handling
        const updateData = {
            ...otherUpdateData,
            // Transform status for database compatibility
            ...(newStatus && { status: transformStatusForDatabase(newStatus) }),
            // Add inspector information if inspection fields are being updated
            ...(otherUpdateData.inspectionPassed !== undefined || otherUpdateData.inspectionNotes !== undefined
                ? { inspectedBy: userId }
                : {})
        }

        // ✅ NEW: Handle assignment updates
        if (newAssignedMembers) {
            // This will be handled separately by updating the assignments table
            // We don't include assignedMembers in the main punchlist_items update
            await punchlistService.updatePunchlistItemAssignments(
                punchlistItemId,
                companyId,
                newAssignedMembers,
                userId
            )
        } else if (legacyAssignedMemberId) {
            // Handle legacy single assignment by converting to new assignment format
            await punchlistService.updatePunchlistItemAssignments(
                punchlistItemId,
                companyId,
                [{ projectMemberId: legacyAssignedMemberId, role: 'primary' }],
                userId
            )
        }

        // Update main punchlist item
        const updatedPunchlistItem = await punchlistService.updatePunchlistItem(
            punchlistItemId,
            companyId,
            updateData
        )

        // Get updated punchlist item with full details including assignments
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
// DELETE /api/punchlist-items/[id] - Delete Punchlist Item (UNCHANGED)
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

        // Delete punchlist item (this will also cascade delete assignments)
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