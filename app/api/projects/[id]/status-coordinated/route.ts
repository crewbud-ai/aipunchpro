// app/api/projects/[id]/status-coordinated/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { StatusCoordinatorService } from '@/lib/database/services/status-coordinator'
import { ProjectDatabaseService } from '@/lib/database/services/projects'
import { validateProjectStatusCoordination } from '@/lib/validations/coordination/status-coordination'

// ==============================================
// PATCH /api/projects/[id]/status-coordinated - Update Project Status with Coordination
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
                    message: 'You must be logged in to update project status.',
                },
                { status: 401 }
            )
        }

        const projectId = params.id

        if (!projectId) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid request',
                    message: 'Project ID is required.',
                },
                { status: 400 }
            )
        }

        // Parse and validate request body
        let body
        try {
            body = await request.json()
        } catch {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid JSON',
                    message: 'Request body must be valid JSON.',
                },
                { status: 400 }
            )
        }

        const validation = validateProjectStatusCoordination(body)
        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Validation failed',
                    message: 'Invalid status update data.',
                    details: validation.error.errors
                },
                { status: 400 }
            )
        }

        const { status, notes } = validation.data

        // Create status coordinator service with error handling
        const projectService = new ProjectDatabaseService(true, false)

        try {
            // Perform coordinated status update using the correct method

            const result = await projectService.updateProjectStatusCoordinated(
                projectId,
                companyId,
                status,
                {
                    notes: notes,
                    userId: userId
                }
            )
            console.log(result, 'result')

            // Ensure we have valid data
            if (!result) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Status update failed',
                        message: 'Failed to update project status',
                    },
                    { status: 400 }
                )
            }

            // Build success response based on actual StatusCoordinatorService response structure
            // const updatedCount = result.data.updatedCount || 0
            // const skippedCount = result.data.skippedCount || 0
            // const scheduleProjects = result.data.scheduleProjects || []

            // Clean, professional response message
            const statusLabel = status.split('_').map(word =>
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ')

            let message = `Project status updated to ${statusLabel}`

            // if (updatedCount > 0) {
            //     message += ` • ${updatedCount} related item${updatedCount !== 1 ? 's' : ''} synced`
            // }

            return NextResponse.json(
                {
                    success: true,
                    data: {
                        project: result,  // ← result is the project object directly
                        cascadeResults: {
                            scheduleProjectsUpdated: 0,  // No cascade for now
                            scheduleProjectsSkipped: 0,
                            updatedScheduleProjects: []
                        }
                    },
                    message,
                    notifications: {
                        type: 'success',
                        title: 'Status Updated',
                        message
                    }
                },
                { status: 200 }
            )

        } catch (coordinationError) {
            console.error('Coordination error:', coordinationError)

            // Handle specific coordination errors
            if (coordinationError instanceof Error) {
                if (coordinationError.message.includes('Cannot change project status')) {
                    return NextResponse.json(
                        {
                            success: false,
                            error: 'Status change blocked',
                            message: coordinationError.message,
                        },
                        { status: 400 }
                    )
                }

                if (coordinationError.message.includes('not found')) {
                    return NextResponse.json(
                        {
                            success: false,
                            error: 'Project not found',
                            message: 'The requested project does not exist or you do not have access to update it.',
                        },
                        { status: 404 }
                    )
                }
            }

            // Fallback error
            return NextResponse.json(
                {
                    success: false,
                    error: 'Coordination failed',
                    message: 'Status update failed due to coordination error',
                },
                { status: 500 }
            )
        }

    } catch (error) {
        console.error('Error in PATCH /api/projects/[id]/status-coordinated:', error)

        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                message: 'An unexpected error occurred while updating the project status.',
            },
            { status: 500 }
        )
    }
}

// ==============================================
// GET /api/projects/[id]/status-coordinated - Get Project Status Summary
// ==============================================
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = request.headers.get('x-user-id')
        const companyId = request.headers.get('x-company-id')

        if (!userId || !companyId) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Authentication required',
                    message: 'You must be logged in to view project status.',
                },
                { status: 401 }
            )
        }

        const projectId = params.id

        if (!projectId) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid request',
                    message: 'Project ID is required.',
                },
                { status: 400 }
            )
        }

        const statusCoordinator = new StatusCoordinatorService(true, false)
        const summary = await statusCoordinator.validateStatusConsistency(projectId, companyId)

        return NextResponse.json(
            {
                success: true,
                data: {
                    statusConsistency: summary,
                    timestamp: new Date().toISOString()
                },
                message: summary.isConsistent
                    ? 'Project status is consistent across all modules.'
                    : `Found ${summary.inconsistencies.length} status inconsistency(ies).`
            },
            { status: 200 }
        )

    } catch (error) {
        console.error('Error in GET /api/projects/[id]/status-coordinated:', error)

        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                message: 'An unexpected error occurred while checking project status.',
            },
            { status: 500 }
        )
    }
}