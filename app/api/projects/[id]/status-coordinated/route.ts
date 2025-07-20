// ==============================================
// app/api/projects/[id]/status-coordinated/route.ts - Coordinated Project Status Update API
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { StatusCoordinatorService } from '@/lib/database/services/status-coordinator'

// ==============================================
// VALIDATION SCHEMA
// ==============================================
const updateProjectStatusCoordinatedSchema = z.object({
    status: z.enum([
        'not_started',
        'in_progress',
        'on_track',
        'ahead_of_schedule',
        'behind_schedule',
        'on_hold',
        'completed',
        'cancelled'
    ], {
        errorMap: () => ({ message: 'Please select a valid status' })
    }),

    notes: z
        .string()
        .max(500, 'Notes must be less than 500 characters')
        .optional(),

    actualStartDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
        .optional(),

    actualEndDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
        .optional(),

    skipChildValidation: z
        .boolean()
        .default(false)
        .optional(),
})

function formatValidationErrors(error: z.ZodError) {
    return error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
    }))
}

// ==============================================
// PATCH /api/projects/[id]/status-coordinated - Update Project Status with Cascade
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

        // Parse request body
        const body = await request.json()

        // Validate input data
        const validation = updateProjectStatusCoordinatedSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Validation failed',
                    details: formatValidationErrors(validation.error),
                },
                { status: 400 }
            )
        }

        const { status, notes, actualStartDate, actualEndDate, skipChildValidation } = validation.data

        // Create status coordinator service
        const statusCoordinator = new StatusCoordinatorService(true, false)

        // Update project status with cascade
        const result = await statusCoordinator.updateProjectStatusWithCascade(
            projectId,
            companyId,
            status,
            notes,
            userId
        )

        // FIX: Check if coordination was successful before accessing data
        if (!result.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Status coordination failed',
                    message: result.error || 'Failed to coordinate status update',
                },
                { status: 500 }
            )
        }

        // FIX: Add type guard to ensure data exists
        if (!result.data) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Coordination data missing',
                    message: 'Status update completed but response data is missing',
                },
                { status: 500 }
            )
        }

        // NOW we can safely access result.data
        // Determine response message based on affected items
        let responseMessage = `Project status updated to "${status}".`
        if (result.data.updatedCount > 0) {
            responseMessage += ` ${result.data.updatedCount} schedule project(s) were automatically updated.`
        }

        return NextResponse.json(
            {
                success: true,
                data: {
                    project: result.data.project,
                    cascadeResults: {
                        scheduleProjectsUpdated: result.data.updatedCount,
                        scheduleProjectsSkipped: result.data.skippedCount,
                        updatedScheduleProjects: result.data.scheduleProjects.map(sp => ({
                            id: sp.id,
                            title: sp.title,
                            newStatus: sp.status
                        }))
                    }
                },
                message: responseMessage,
                notifications: {
                    type: 'success',
                    title: 'Project Status Updated',
                    message: responseMessage
                }
            },
            { status: 200 }
        )

    } catch (error) {
        console.error('Error in PATCH /api/projects/[id]/status-coordinated:', error)

        // Handle specific coordination errors
        if (error instanceof Error) {
            if (error.message.includes('Cannot change project status')) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Status change blocked',
                        message: error.message,
                    },
                    { status: 400 }
                )
            }

            if (error.message.includes('not found')) {
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
        // Get user info from middleware
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

        // Create status coordinator service  
        const statusCoordinator = new StatusCoordinatorService(true, false)

        // Get project status summary
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