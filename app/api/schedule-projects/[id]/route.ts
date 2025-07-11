// ==============================================
// src/app/api/schedule-projects/[id]/route.ts - Individual Schedule Project API Routes
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import {
  validateUpdateScheduleProject,
  formatScheduleProjectErrors,
} from '@/lib/validations/schedule/schedule-projects'
import { ScheduleProjectDatabaseService } from '@/lib/database/services/schedule-projects'
import { ProjectDatabaseService } from '@/lib/database/services/projects'

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
    const scheduleProject = await scheduleService.getScheduleProjectById(scheduleProjectId, companyId)

    if (!scheduleProject) {
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
    const dependentSchedules = await scheduleService.getDependentScheduleProjects(scheduleProjectId, companyId)

    return NextResponse.json(
      {
        success: true,
        data: {
          ...scheduleProject,
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
// PATCH /api/schedule-projects/[id] - Update Schedule Project
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

    // Create service instances
    const scheduleService = new ScheduleProjectDatabaseService(true, false)
    const projectService = new ProjectDatabaseService(true, false)

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

    // If project is being changed, verify new project exists
    if (validation.data.projectId) {
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

    // Extract update data (remove id from validation data)
    const { id, ...updateData } = validation.data

    // Update schedule project
    const updatedScheduleProject = await scheduleService.updateScheduleProject(
      scheduleProjectId,
      companyId,
      updateData
    )

    // Get updated schedule project with full details
    const scheduleProjectWithDetails = await scheduleService.getScheduleProjectById(scheduleProjectId, companyId)

    return NextResponse.json(
      {
        success: true,
        data: scheduleProjectWithDetails,
        message: 'Schedule project updated successfully.',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in PATCH /api/schedule-projects/[id]:', error)

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
          message: `Cannot delete this schedule project because ${dependentSchedules.length} other schedule project(s) depend on it. Please remove dependencies first.`,
          details: {
            dependentSchedules: dependentSchedules.map(dep => ({
              id: dep.id,
              title: dep.title,
              projectName: dep.project?.name
            }))
          }
        },
        { status: 409 }
      )
    }

    // Delete schedule project
    await scheduleService.deleteScheduleProject(scheduleProjectId, companyId)

    return NextResponse.json(
      {
        success: true,
        message: 'Schedule project deleted successfully.',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in DELETE /api/schedule-projects/[id]:', error)

    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('foreign key')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Cannot delete',
            message: 'Cannot delete this schedule project because it has related punchlist items. Please resolve all related items first.',
          },
          { status: 409 }
        )
      }
    }

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