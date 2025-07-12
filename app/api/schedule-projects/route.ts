// ==============================================
// src/app/api/schedule-projects/route.ts - Schedule Projects API Routes
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import {
    validateCreateScheduleProject,
    validateGetScheduleProjects,
    formatScheduleProjectErrors,
    transformCreateScheduleProjectData,
} from '@/lib/validations/schedule/schedule-projects'
import { ScheduleProjectDatabaseService } from '@/lib/database/services/schedule-projects'
import { ProjectDatabaseService } from '@/lib/database/services/projects'

// ==============================================
// GET /api/schedule-projects - Get All Schedule Projects for Company
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
                    message: 'You must be logged in to view schedule projects.',
                },
                { status: 401 }
            )
        }

        // Parse query parameters
        const url = new URL(request.url)
        const queryParams = {
            projectId: url.searchParams.get('projectId') || undefined,
            status: url.searchParams.get('status') || undefined,
            priority: url.searchParams.get('priority') || undefined,
            tradeRequired: url.searchParams.get('tradeRequired') || undefined,
            assignedToUserId: url.searchParams.get('assignedToUserId') || undefined,
            startDateFrom: url.searchParams.get('startDateFrom') || undefined,
            startDateTo: url.searchParams.get('startDateTo') || undefined,
            search: url.searchParams.get('search') || undefined,
            limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : 20,
            offset: url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset')!) : 0,
            sortBy: url.searchParams.get('sortBy') || 'startDate',
            sortOrder: url.searchParams.get('sortOrder') || 'asc',
        }

        // Validate query parameters
        const validation = validateGetScheduleProjects(queryParams)
        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid query parameters',
                    details: formatScheduleProjectErrors(validation.error),
                },
                { status: 400 }
            )
        }

        // Destructure with defaults to handle optional fields
        const {
            limit = 20,
            offset = 0,
            ...otherFilters
        } = validation.data

        // Create service instance
        const scheduleService = new ScheduleProjectDatabaseService(true, false)

        // Get schedule projects with filters
        const result = await scheduleService.getScheduleProjects(companyId, validation.data)

        // Transform snake_case to camelCase for frontend
        const transformedScheduleProjects = result.data.map((scheduleProject: any) => ({
            id: scheduleProject.id,
            companyId: scheduleProject.company_id,
            projectId: scheduleProject.project_id,
            title: scheduleProject.title,
            description: scheduleProject.description,

            // Transform dates and times
            startDate: scheduleProject.start_date,
            endDate: scheduleProject.end_date,
            startTime: scheduleProject.start_time,
            endTime: scheduleProject.end_time,

            // Transform assignment and work details
            assignedProjectMemberIds: scheduleProject.assigned_project_member_ids,
            tradeRequired: scheduleProject.trade_required,
            status: scheduleProject.status,
            priority: scheduleProject.priority,
            progressPercentage: scheduleProject.progress_percentage,
            estimatedHours: scheduleProject.estimated_hours,
            actualHours: scheduleProject.actual_hours,
            dependsOn: scheduleProject.depends_on,
            location: scheduleProject.location,
            notes: scheduleProject.notes,

            // Transform metadata
            createdBy: scheduleProject.created_by,
            createdAt: scheduleProject.created_at,
            updatedAt: scheduleProject.updated_at,
            completedAt: scheduleProject.completed_at,

            // Transform related data
            project: scheduleProject.project ? {
                id: scheduleProject.project.id,
                name: scheduleProject.project.name,
                status: scheduleProject.project.status
            } : undefined,

            creator: scheduleProject.creator ? {
                firstName: scheduleProject.creator.first_name,
                lastName: scheduleProject.creator.last_name
            } : undefined,

            assignedMembers: scheduleProject.assignedMembers ? scheduleProject.assignedMembers.map((member: any) => ({
                id: member.id,
                userId: member.userId || member.user_id,
                user: member.user ? {
                    firstName: member.user.firstName || member.user.first_name,
                    lastName: member.user.lastName || member.user.last_name,
                    tradeSpecialty: member.user.tradeSpecialty || member.user.trade_specialty
                } : undefined
            })) : []
        }))

        return NextResponse.json(
            {
                success: true,
                data: {
                    scheduleProjects: transformedScheduleProjects,
                    pagination: {
                        total: result.totalCount,
                        limit,
                        offset,
                        hasMore: result.totalCount > (offset + limit),
                    }
                },
                message: 'Schedule projects retrieved successfully.',
            },
            { status: 200 }
        )
    } catch (error) {
        console.error('Error in GET /api/schedule-projects:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                message: 'An unexpected error occurred while fetching schedule projects.',
            },
            { status: 500 }
        )
    }
}

// ==============================================
// POST /api/schedule-projects - Create New Schedule Project
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
                    message: 'You must be logged in to create schedule projects.',
                },
                { status: 401 }
            )
        }

        // Parse request body
        const body = await request.json()

        // Validate input data
        const validation = validateCreateScheduleProject(body)
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

        // Create service instances
        const scheduleService = new ScheduleProjectDatabaseService(true, false)
        const projectService = new ProjectDatabaseService(true, false)

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

        // Validate dependencies if provided
        if (validation.data.dependsOn && validation.data.dependsOn.length > 0) {
            const validDependencies = await scheduleService.validateDependencies('', validation.data.dependsOn, companyId)
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

        // Transform form data for database
        const scheduleData = {
            ...validation.data,
            companyId,
            createdBy: userId,
        }

        // Create schedule project
        const scheduleProject = await scheduleService.createScheduleProject(scheduleData)

        // Get the created schedule project with full details
        const scheduleProjectWithDetails = await scheduleService.getScheduleProjectById(scheduleProject.id, companyId)



        return NextResponse.json(
            {
                success: true,
                data: {
                    scheduleProject: scheduleProjectWithDetails
                },
                message: 'Schedule project created successfully.',
            },
            { status: 201 }
        )
    } catch (error) {
        console.error('Error in POST /api/schedule-projects:', error)

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
                    { status: 409 }
                )
            }
        }

        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                message: 'An unexpected error occurred while creating the schedule project.',
            },
            { status: 500 }
        )
    }
}