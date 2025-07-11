// app/api/schedule-projects/[id]/route.ts
// Fixed version with data transformation

import { NextRequest, NextResponse } from 'next/server'
import {
    validateUpdateScheduleProject,
    formatScheduleProjectErrors,
} from '@/lib/validations/schedule/schedule-projects'
import { ScheduleProjectDatabaseService } from '@/lib/database/services/schedule-projects'
import { ProjectDatabaseService } from '@/lib/database/services/projects'

// ==============================================
// DATA TRANSFORMATION FUNCTIONS
// ==============================================
function transformTimeToHHMM(timeString: string | null): string | undefined {
    if (!timeString) return undefined
    // Convert "22:55:00" to "22:55" (remove seconds)
    return timeString.substring(0, 5)
}

// ==============================================
// DATA TRANSFORMATION FUNCTIONS
// ==============================================
function transformScheduleProjectToFrontend(scheduleProject: any) {
    return {
        id: scheduleProject.id,
        companyId: scheduleProject.company_id,
        projectId: scheduleProject.project_id,
        title: scheduleProject.title,
        description: scheduleProject.description,
        startDate: scheduleProject.start_date,
        endDate: scheduleProject.end_date,
        startTime: transformTimeToHHMM(scheduleProject.start_time), // FIXED: Remove seconds
        endTime: transformTimeToHHMM(scheduleProject.end_time),     // FIXED: Remove seconds
        assignedProjectMemberIds: scheduleProject.assigned_project_member_ids || [],
        tradeRequired: scheduleProject.trade_required,
        status: scheduleProject.status,
        priority: scheduleProject.priority,
        progressPercentage: parseFloat(scheduleProject.progress_percentage) || 0,
        estimatedHours: scheduleProject.estimated_hours ? parseFloat(scheduleProject.estimated_hours) : undefined,
        actualHours: parseFloat(scheduleProject.actual_hours) || 0,
        dependsOn: scheduleProject.depends_on || [],
        location: scheduleProject.location,
        notes: scheduleProject.notes,
        createdBy: scheduleProject.created_by,
        createdAt: scheduleProject.created_at,
        updatedAt: scheduleProject.updated_at,
        completedAt: scheduleProject.completed_at,

        // Related data
        project: scheduleProject.project ? {
            id: scheduleProject.project.id,
            name: scheduleProject.project.name,
            status: scheduleProject.project.status
        } : undefined,

        creator: scheduleProject.creator ? {
            firstName: scheduleProject.creator.first_name,
            lastName: scheduleProject.creator.last_name
        } : undefined,

        assignedMembers: scheduleProject.assignedMembers || []
    }
}


function transformDependentSchedulesToFrontend(dependentSchedules: any[]) {
    return dependentSchedules.map(schedule => ({
        id: schedule.id,
        title: schedule.title,
        status: schedule.status,
        startDate: schedule.start_date,
        endDate: schedule.end_date,
        project: {
            name: schedule.project?.name || schedule.project_name
        }
    }))
}

// ==============================================
// GET /api/schedule-projects/[id] - Get Specific Schedule Project Details
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
                    message: 'You must be logged in to view schedule project details.',
                },
                { status: 401 }
            )
        }

        const scheduleProjectId = params.id

        if (!scheduleProjectId) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid request',
                    message: 'Schedule project ID is required.',
                },
                { status: 400 }
            )
        }

        // Create service instance
        const scheduleService = new ScheduleProjectDatabaseService(true, false)

        // Check if schedule project exists and belongs to company
        const scheduleProjectExists = await scheduleService.checkScheduleProjectExists(scheduleProjectId, companyId)
        if (!scheduleProjectExists) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Schedule project not found',
                    message: 'The requested schedule project does not exist or you do not have access to view it.',
                },
                { status: 404 }
            )
        }

        // Get schedule project details
        const scheduleProjectRaw = await scheduleService.getScheduleProjectById(scheduleProjectId, companyId)

        if (!scheduleProjectRaw) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Schedule project not found',
                    message: 'The requested schedule project could not be found.',
                },
                { status: 404 }
            )
        }

        // Get dependent schedule projects (what depends on this one)
        const dependentSchedulesRaw = await scheduleService.getDependentScheduleProjects(scheduleProjectId, companyId)

        // Transform data to match frontend expectations (camelCase)
        const scheduleProject = transformScheduleProjectToFrontend(scheduleProjectRaw)
        const dependentSchedules = transformDependentSchedulesToFrontend(dependentSchedulesRaw)

        console.log('API Response - Original data:', scheduleProjectRaw)
        console.log('API Response - Transformed data:', scheduleProject)

        return NextResponse.json(
            {
                success: true,
                data: {
                    scheduleProject,
                    dependentSchedules,
                },
                message: 'Schedule project retrieved successfully.',
            },
            { status: 200 }
        )
    } catch (error) {
        console.error('Error in GET /api/schedule-projects/[id]:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                message: 'An unexpected error occurred while fetching the schedule project.',
            },
            { status: 500 }
        )
    }
}

// ==============================================
// PUT /api/schedule-projects/[id] - Update Schedule Project
// ==============================================
export async function PUT(
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
                    message: 'You must be logged in to update schedule projects.',
                },
                { status: 401 }
            )
        }

        const scheduleProjectId = params.id

        if (!scheduleProjectId) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid request',
                    message: 'Schedule project ID is required.',
                },
                { status: 400 }
            )
        }

        // Parse request body
        const body = await request.json()

        // Add ID to validation data
        const validationData = { ...body, id: scheduleProjectId }

        // Validate input data
        const validation = validateUpdateScheduleProject(validationData)
        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Validation failed',
                    details: formatScheduleProjectErrors(validation.error),
                },
                { status: 400 }
            )
        }

        // Create service instance
        const scheduleService = new ScheduleProjectDatabaseService(true, false)

        // Check if schedule project exists and belongs to company
        const scheduleProjectExists = await scheduleService.checkScheduleProjectExists(scheduleProjectId, companyId)
        if (!scheduleProjectExists) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Schedule project not found',
                    message: 'The requested schedule project does not exist or you do not have access to update it.',
                },
                { status: 404 }
            )
        }

        // Validate dependencies if provided
        if (validation.data.dependsOn && validation.data.dependsOn.length > 0) {
            const validDependencies = await scheduleService.validateDependencies(scheduleProjectId, validation.data.dependsOn, companyId)
            if (!validDependencies) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Invalid dependencies',
                        message: 'One or more dependency schedule projects are invalid or would create a circular dependency.',
                    },
                    { status: 400 }
                )
            }
        }

        // Update schedule project - FIX: Correct parameter order
        const updatedScheduleProject = await scheduleService.updateScheduleProject(scheduleProjectId, companyId, validation.data)

        // Get the updated schedule project with full details
        const scheduleProjectWithDetailsRaw = await scheduleService.getScheduleProjectById(updatedScheduleProject.id, companyId)

        // Transform data to match frontend expectations
        const scheduleProjectWithDetails = transformScheduleProjectToFrontend(scheduleProjectWithDetailsRaw)

        return NextResponse.json(
            {
                success: true,
                data: {
                    scheduleProject: scheduleProjectWithDetails
                },
                message: 'Schedule project updated successfully.',
            },
            { status: 200 }
        )
    } catch (error) {
        console.error('Error in PUT /api/schedule-projects/[id]:', error)

        // Handle specific database errors
        if (error instanceof Error) {
            if (error.message.includes('foreign key')) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Invalid reference',
                        message: 'One or more assigned team members are invalid.',
                    },
                    { status: 400 }
                )
            }

            if (error.message.includes('unique constraint')) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Duplicate entry',
                        message: 'A schedule project with similar details already exists.',
                    },
                    { status: 400 }
                )
            }
        }

        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                message: 'An unexpected error occurred while updating the schedule project.',
            },
            { status: 500 }
        )
    }
}

// ==============================================
// DELETE /api/schedule-projects/[id] - Delete Schedule Project
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
                    message: 'You must be logged in to delete schedule projects.',
                },
                { status: 401 }
            )
        }

        const scheduleProjectId = params.id

        if (!scheduleProjectId) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid request',
                    message: 'Schedule project ID is required.',
                },
                { status: 400 }
            )
        }

        // Create service instance
        const scheduleService = new ScheduleProjectDatabaseService(true, false)

        // Check if schedule project exists and belongs to company
        const scheduleProjectExists = await scheduleService.checkScheduleProjectExists(scheduleProjectId, companyId)
        if (!scheduleProjectExists) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Schedule project not found',
                    message: 'The requested schedule project does not exist or you do not have access to delete it.',
                },
                { status: 404 }
            )
        }

        // Check if other schedule projects depend on this one
        const dependentSchedules = await scheduleService.getDependentScheduleProjects(scheduleProjectId, companyId)
        if (dependentSchedules.length > 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Cannot delete',
                    message: `Cannot delete this schedule project because ${dependentSchedules.length} other schedule project(s) depend on it.`,
                },
                { status: 400 }
            )
        }

        // Delete schedule project
        await scheduleService.deleteScheduleProject(scheduleProjectId, companyId)

        return NextResponse.json(
            {
                success: true,
                data: {
                    deletedScheduleProjectId: scheduleProjectId
                },
                message: 'Schedule project deleted successfully.',
            },
            { status: 200 }
        )
    } catch (error) {
        console.error('Error in DELETE /api/schedule-projects/[id]:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                message: 'An unexpected error occurred while deleting the schedule project.',
            },
            { status: 500 }
        )
    }
}