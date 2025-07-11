// ==============================================
// src/app/api/schedule-projects/[id]/status/route.ts - Schedule Project Status Update API
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import {
  validateQuickUpdateScheduleStatus,
  formatScheduleProjectErrors,
} from '@/lib/validations/schedule/schedule-projects'
import { ScheduleProjectDatabaseService } from '@/lib/database/services/schedule-projects'

// ==============================================
// PATCH /api/schedule-projects/[id]/status - Update Schedule Project Status
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
          message: 'You must be logged in to update schedule project status.',
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
    const validation = validateQuickUpdateScheduleStatus(validationData)
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

    const { status, progressPercentage, actualHours, notes } = validation.data

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

    // Get current schedule project data for comparison
    const currentScheduleProject = await scheduleService.getScheduleProjectById(scheduleProjectId, companyId)
    if (!currentScheduleProject) {
      return NextResponse.json(
        {
          success: false,
          error: 'Schedule project not found',
          message: 'The requested schedule project could not be found.',
        },
        { status: 404 }
      )
    }

    // Prepare status update data
    const statusUpdateData = {
      status,
      progressPercentage,
      actualHours,
      notes,
    }

    // Update schedule project status
    const updatedScheduleProject = await scheduleService.quickUpdateScheduleStatus(
      scheduleProjectId,
      companyId,
      statusUpdateData
    )

    // Get updated schedule project with full details
    const scheduleProjectWithDetails = await scheduleService.getScheduleProjectById(scheduleProjectId, companyId)

    // Determine what changed for response message
    let changeDescription = `Status updated to "${status}"`
    
    if (progressPercentage !== undefined && progressPercentage !== Number(currentScheduleProject.progressPercentage)) {
      changeDescription += ` with ${progressPercentage}% progress`
    }
    
    if (actualHours !== undefined && actualHours !== Number(currentScheduleProject.actualHours || 0)) {
      changeDescription += ` and ${actualHours} actual hours logged`
    }

    // Prepare response data with previous values for frontend notifications
    const responseData = {
      scheduleProject: scheduleProjectWithDetails,
      changes: {
        previousStatus: currentScheduleProject.status,
        newStatus: status,
        previousProgress: Number(currentScheduleProject.progressPercentage),
        newProgress: progressPercentage || Number(currentScheduleProject.progressPercentage),
        previousActualHours: Number(currentScheduleProject.actualHours || 0),
        newActualHours: actualHours || Number(currentScheduleProject.actualHours || 0),
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: responseData,
        message: `Schedule project ${changeDescription}.`,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in PATCH /api/schedule-projects/[id]/status:', error)

    // Handle specific validation errors
    if (error instanceof Error) {
      if (error.message.includes('progress')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid progress',
            message: 'Progress percentage must be between 0 and 100.',
          },
          { status: 400 }
        )
      }
      
      if (error.message.includes('hours')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid hours',
            message: 'Actual hours must be a positive number.',
          },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred while updating the schedule project status.',
      },
      { status: 500 }
    )
  }
}