// ==============================================
// src/app/api/projects/[id]/route.ts - FIXED for Tags Support
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import {
  validateUpdateProject,
  formatProjectErrors
} from '@/lib/validations/projects/project'
import { ProjectDatabaseService } from '@/lib/database/services/projects'
import { createProjectLocation, createProjectClient } from '@/lib/database/schema/projects'
import StatusCoordinatorService from '@/lib/database/services/status-coordinator'

// ==============================================
// GET /api/projects/[id] - Get Single Project
// ==============================================
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id

    // Get user info from middleware
    const userId = request.headers.get('x-user-id')
    const companyId = request.headers.get('x-company-id')

    if (!userId || !companyId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          message: 'You must be logged in to view projects.',
        },
        { status: 401 }
      )
    }

    // Validate project ID format
    if (!projectId || projectId.length !== 36) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid project ID',
          message: 'Please provide a valid project ID.',
        },
        { status: 400 }
      )
    }

    // Create service instance
    const projectService = new ProjectDatabaseService(true, false)

    // FIXED: Use the correct method name
    const project = await projectService.getProjectByIdEnhanced(projectId, companyId)

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project not found',
          message: 'The requested project could not be found.',
        },
        { status: 404 }
      )
    }

    // Get project files
    const files = await projectService.getProjectFiles(projectId)

    // Return project data with enhanced structure
    return NextResponse.json(
      {
        success: true,
        message: 'Project retrieved successfully',
        data: {
          project: {
            id: project.id,
            name: project.name,
            description: project.description,
            projectNumber: project.project_number,
            status: project.status,
            priority: project.priority,
            budget: project.budget,
            spent: project.spent,
            progress: project.progress,
            startDate: project.start_date,
            endDate: project.end_date,
            actualStartDate: project.actual_start_date,
            actualEndDate: project.actual_end_date,
            estimatedHours: project.estimated_hours,
            actualHours: project.actual_hours,

            // Enhanced JSONB fields
            location: project.location || null,
            client: project.client || null,

            tags: project.tags || [],
            createdAt: project.created_at,
            updatedAt: project.updated_at,

            // Related data
            creator: project.creator ? {
              id: project.creator.id,
              firstName: project.creator.first_name,
              lastName: project.creator.last_name,
              email: project.creator.email,
            } : null,

            projectManager: project.project_manager ? {
              id: project.project_manager.id,
              firstName: project.project_manager.first_name,
              lastName: project.project_manager.last_name,
              email: project.project_manager.email,
            } : null,

            files: files.map(file => ({
              id: file.id,
              name: file.name,
              fileType: file.file_type,
              fileSize: file.file_size,
              folder: file.folder,
              uploadedAt: file.uploaded_at,
              uploader: file.uploader ? {
                firstName: file.uploader.first_name,
                lastName: file.uploader.last_name,
              } : null,
            })),
          },
        },
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Get project error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong while retrieving the project.',
      },
      { status: 500 }
    )
  }
}

// ==============================================
// PUT /api/projects/[id] - Update Project
// ==============================================
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id

    // Get user info from middleware
    const userId = request.headers.get('x-user-id')
    const companyId = request.headers.get('x-company-id')

    if (!userId || !companyId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          message: 'You must be logged in to update projects.',
        },
        { status: 401 }
      )
    }

    // Validate project ID format
    if (!projectId || projectId.length !== 36) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid project ID',
          message: 'Please provide a valid project ID.',
        },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Validate input data
    const validation = validateUpdateProject({ ...body, id: projectId })
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: formatProjectErrors(validation.error),
        },
        { status: 400 }
      )
    }

    const updateData = validation.data

    // Create service instance
    const projectService = new ProjectDatabaseService(true, false)

    // Check if project exists
    const projectExists = await projectService.checkProjectExists(projectId, companyId)
    if (!projectExists) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project not found',
          message: 'The project you are trying to update does not exist.',
        },
        { status: 404 }
      )
    }

    // Check if new name conflicts with existing projects (if name is being changed)
    if (updateData.name) {
      const nameExists = await projectService.isProjectNameTaken(
        updateData.name,
        companyId,
        projectId
      )

      if (nameExists) {
        return NextResponse.json(
          {
            success: false,
            error: 'Project name already exists',
            details: [{ field: 'name', message: 'A project with this name already exists' }],
          },
          { status: 409 }
        )
      }
    }

    // Prepare enhanced update data
    const enhancedUpdateData: any = {
      name: updateData.name,
      description: updateData.description,
      projectNumber: updateData.projectNumber,
      status: updateData.status,
      priority: updateData.priority,
      budget: updateData.budget,
      spent: updateData.spent,
      progress: updateData.progress,
      startDate: updateData.startDate,
      endDate: updateData.endDate,
      actualStartDate: updateData.actualStartDate,
      actualEndDate: updateData.actualEndDate,
      estimatedHours: updateData.estimatedHours,
      actualHours: updateData.actualHours,
      tags: updateData.tags,  // FIXED: Include tags in update data
      projectManagerId: updateData.projectManagerId,
      foremanId: updateData.foremanId,  // FIXED: Include foremanId
    }

    // Handle location updates
    if (updateData.location || updateData.selectedLocation) {
      if (updateData.location && typeof updateData.location === 'object') {
        enhancedUpdateData.location = updateData.location
      } else if (updateData.selectedLocation) {
        enhancedUpdateData.location = createProjectLocation(
          updateData.selectedLocation.address,
          updateData.selectedLocation.coordinates,
          updateData.selectedLocation.placeId,
          updateData.selectedLocation.displayName
        )
      }
    }

    // Handle client updates
    if (updateData.client || updateData.clientName || updateData.clientEmail || updateData.clientPhone) {
      if (updateData.client && typeof updateData.client === 'object') {
        enhancedUpdateData.client = updateData.client
      } else {
        enhancedUpdateData.client = createProjectClient(
          updateData.clientName,
          updateData.clientEmail,
          updateData.clientPhone,
          updateData.clientContactPerson,
          updateData.clientWebsite,  // FIXED: Include website
          updateData.clientNotes     // FIXED: Include notes
        )
      }
    }

    // FIXED: Update project using the correct method name
    const updatedProject = await projectService.updateProjectEnhanced(
      projectId,
      companyId,
      enhancedUpdateData
    )

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Project updated successfully',
        data: {
          project: {
            id: updatedProject.id,
            name: updatedProject.name,
            description: updatedProject.description,
            projectNumber: updatedProject.project_number,
            status: updatedProject.status,
            priority: updatedProject.priority,
            budget: updatedProject.budget,
            spent: updatedProject.spent,
            progress: updatedProject.progress,
            startDate: updatedProject.start_date,
            endDate: updatedProject.end_date,
            actualStartDate: updatedProject.actual_start_date,
            actualEndDate: updatedProject.actual_end_date,
            estimatedHours: updatedProject.estimated_hours,
            actualHours: updatedProject.actual_hours,

            // Enhanced JSONB fields
            location: updatedProject.location,
            client: updatedProject.client,

            tags: updatedProject.tags || [],  // FIXED: Ensure tags are included
            updatedAt: updatedProject.updated_at,
          },
        },
        notifications: {
          message: 'Project details have been updated successfully.',
        },
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Update project error:', error)

    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('duplicate key')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Duplicate entry',
            message: 'Project name or number already exists.',
          },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong while updating the project.',
      },
      { status: 500 }
    )
  }
}

// ==============================================
// DELETE /api/projects/[id] - Delete Project
// ==============================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id

    // Get user info from middleware
    const userId = request.headers.get('x-user-id')
    const companyId = request.headers.get('x-company-id')

    if (!userId || !companyId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          message: 'You must be logged in to delete projects.',
        },
        { status: 401 }
      )
    }

    // Validate project ID format
    if (!projectId || projectId.length !== 36) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid project ID',
          message: 'Please provide a valid project ID.',
        },
        { status: 400 }
      )
    }

    // Create service instance
    const projectService = new ProjectDatabaseService(true, false)

    // Check if project exists
    const projectExists = await projectService.checkProjectExists(projectId, companyId)
    if (!projectExists) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project not found',
          message: 'The project you are trying to delete does not exist.',
        },
        { status: 404 }
      )
    }

    // Delete project (cascade will handle related data)
    await projectService.deleteProject(projectId, companyId)

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Project deleted successfully',
        data: {
          deletedProjectId: projectId,
          deletedAt: new Date().toISOString(),
        },
        notifications: {
          message: 'Project and all related data have been permanently deleted.',
        },
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Delete project error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong while deleting the project.',
      },
      { status: 500 }
    )
  }
}

// ==============================================
// PATCH /api/projects/[id] - Partial Update (Status/Progress)
// ==============================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id

    // Get user info from middleware
    const userId = request.headers.get('x-user-id')
    const companyId = request.headers.get('x-company-id')

    if (!userId || !companyId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          message: 'You must be logged in to update projects.',
        },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      action,
      status,
      progress,
      notes,
      useCoordination = false,
      skipChildValidation = false
    } = body

    // Create service instances
    const projectService = new ProjectDatabaseService(true, false)
    let statusCoordinator = null

    // Check if project exists
    const projectExists = await projectService.checkProjectExists(projectId, companyId)
    if (!projectExists) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project not found',
          message: 'The project you are trying to update does not exist.',
        },
        { status: 404 }
      )
    }

    let updatedProject
    let cascadeResults = null

    // Handle different patch actions
    switch (action) {
      case 'update_status':
        if (!status || !['not_started', 'in_progress', 'on_track', 'ahead_of_schedule', 'behind_schedule', 'on_hold', 'completed', 'cancelled'].includes(status)) {
          return NextResponse.json(
            {
              success: false,
              error: 'Invalid status',
              message: 'Status must be one of: not_started, in_progress, on_track, ahead_of_schedule, behind_schedule, on_hold, completed, cancelled',
            },
            { status: 400 }
          )
        }

        // Use coordination if requested
        if (useCoordination) {
          statusCoordinator = new StatusCoordinatorService(true, false)

          try {
            const coordinatedResult = await statusCoordinator.updateProjectStatusWithCascade(
              projectId,
              companyId,
              status,
              notes,
              userId
            )

            // Check if coordination was successful before accessing data
            if (!coordinatedResult.success) {
              return NextResponse.json(
                {
                  success: false,
                  error: 'Status coordination failed',
                  message: coordinatedResult.error || 'Failed to coordinate status update',
                },
                { status: 500 }
              )
            }

            // Add type guard to ensure data exists
            if (!coordinatedResult.data) {
              return NextResponse.json(
                {
                  success: false,
                  error: 'Coordination data missing',
                  message: 'Status update completed but response data is missing',
                },
                { status: 500 }
              )
            }

            // Now we can safely access coordinatedResult.data
            updatedProject = coordinatedResult.data.project
            cascadeResults = {
              scheduleProjectsUpdated: coordinatedResult.data.updatedCount,
              scheduleProjectsSkipped: coordinatedResult.data.skippedCount,
              affectedScheduleProjects: coordinatedResult.data.scheduleProjects.map(sp => ({
                id: sp.id,
                title: sp.title,
                newStatus: sp.status
              }))
            }

          } catch (coordinationError) {
            // FIX: Type guard for unknown error
            const errorMessage = coordinationError instanceof Error
              ? coordinationError.message
              : String(coordinationError)

            // If coordination fails, fall back to regular update or return error
            if (errorMessage.includes('Cannot change project status')) {
              return NextResponse.json(
                {
                  success: false,
                  error: 'Status change blocked',
                  message: errorMessage,
                  details: {
                    suggestion: 'Use skipChildValidation=true to force the update, or resolve blocking issues first.'
                  }
                },
                { status: 400 }
              )
            }
            throw coordinationError
          }
        } else {
          // Original logic for backward compatibility
          updatedProject = await projectService.updateProjectStatus(projectId, companyId, status, notes)
        }
        break

      case 'update_progress':
        if (typeof progress !== 'number' || progress < 0 || progress > 100) {
          return NextResponse.json(
            {
              success: false,
              error: 'Invalid progress',
              message: 'Progress must be a number between 0 and 100',
            },
            { status: 400 }
          )
        }

        // Auto-trigger status coordination when progress reaches milestones
        if (useCoordination && (progress === 100 || progress === 0)) {
          statusCoordinator = new StatusCoordinatorService(true, false)

          // Auto-suggest status based on progress
          const suggestedStatus = progress === 100 ? 'completed' : 'not_started'

          try {
            const coordinatedResult = await statusCoordinator.updateProjectStatusWithCascade(
              projectId,
              companyId,
              suggestedStatus,
              notes || `Auto-updated due to progress reaching ${progress}%`,
              userId
            )

            // Check if coordination was successful before accessing data
            if (coordinatedResult.success && coordinatedResult.data) {
              // TypeScript now knows coordinatedResult.data exists
              updatedProject = coordinatedResult.data.project
              cascadeResults = {
                autoStatusUpdate: true,
                newStatus: suggestedStatus,
                scheduleProjectsUpdated: coordinatedResult.data.updatedCount
              }
            } else {
              // If coordination fails, just update progress without status change
              updatedProject = await projectService.updateProjectProgress(projectId, companyId, progress, notes)
              cascadeResults = {
                autoStatusUpdate: false,
                error: coordinatedResult.error || 'Coordination failed'
              }
            }
          } catch (coordinationError) {
            // FIX: Type guard for unknown error
            const errorMessage = coordinationError instanceof Error
              ? coordinationError.message
              : String(coordinationError)

            // If coordination fails, just update progress without status change
            updatedProject = await projectService.updateProjectProgress(projectId, companyId, progress, notes)
            cascadeResults = {
              autoStatusUpdate: false,
              error: errorMessage
            }
          }
        } else {
          // Original logic
          updatedProject = await projectService.updateProjectProgress(projectId, companyId, progress, notes)
        }
        break

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action',
            message: 'Action must be either update_status or update_progress',
          },
          { status: 400 }
        )
    }

    // FIX: Prepare response message with proper type checking
    let responseMessage = `Project ${action.replace('update_', '')} updated successfully`

    // Check if scheduleProjectsUpdated exists and is a number
    if (cascadeResults &&
      'scheduleProjectsUpdated' in cascadeResults &&
      typeof cascadeResults.scheduleProjectsUpdated === 'number' &&
      cascadeResults.scheduleProjectsUpdated > 0) {
      responseMessage += `. ${cascadeResults.scheduleProjectsUpdated} schedule project(s) were automatically updated.`
    }

    // Return enhanced response
    return NextResponse.json(
      {
        success: true,
        message: responseMessage,
        data: {
          project: {
            id: updatedProject.id,
            name: updatedProject.name,
            status: updatedProject.status,
            progress: updatedProject.progress,
            updatedAt: updatedProject.updated_at,
          },
          coordination: cascadeResults ? {
            enabled: useCoordination,
            results: cascadeResults
          } : null
        },
        notifications: {
          message: responseMessage,
          type: 'success'
        },
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Patch project error:', error)

    // Enhanced error handling for coordination errors
    if (error instanceof Error) {
      if (error.message.includes('coordination')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Coordination error',
            message: 'Status coordination failed. Changes may be partially applied.',
            details: error.message
          },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong while updating the project.',
      },
      { status: 500 }
    )
  }
}