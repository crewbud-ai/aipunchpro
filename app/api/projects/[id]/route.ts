// ==============================================
// src/app/api/projects/[id]/route.ts - Individual Project API Routes
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import { 
  validateUpdateProject,
  formatProjectErrors 
} from '@/lib/validations/projects/project'
import { ProjectDatabaseService } from '@/lib/database/services/projects'

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

    // Get project with related data
    const project = await projectService.getProjectById(projectId, companyId)

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

    // Return project data
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
            estimatedHours: project.estimated_hours,
            actualHours: project.actual_hours,
            location: project.location,
            address: project.address,
            clientName: project.client_name,
            clientContact: project.client_contact,
            tags: project.tags,
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

    // Update project
    const updatedProject = await projectService.updateProject(
      projectId, 
      companyId, 
      updateData
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
            estimatedHours: updatedProject.estimated_hours,
            actualHours: updatedProject.actual_hours,
            location: updatedProject.location,
            address: updatedProject.address,
            clientName: updatedProject.client_name,
            clientContact: updatedProject.client_contact,
            tags: updatedProject.tags,
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
    const { action, status, progress, notes } = body

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

    let updatedProject

    // Handle different patch actions
    switch (action) {
      case 'update_status':
        if (!status || !['planning', 'active', 'on_hold', 'completed'].includes(status)) {
          return NextResponse.json(
            {
              success: false,
              error: 'Invalid status',
              message: 'Status must be one of: planning, active, on_hold, completed',
            },
            { status: 400 }
          )
        }
        updatedProject = await projectService.updateProjectStatus(projectId, companyId, status, notes)
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
        updatedProject = await projectService.updateProjectProgress(projectId, companyId, progress, notes)
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

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: `Project ${action.replace('update_', '')} updated successfully`,
        data: {
          project: {
            id: updatedProject.id,
            name: updatedProject.name,
            status: updatedProject.status,
            progress: updatedProject.progress,
            updatedAt: updatedProject.updated_at,
          },
        },
        notifications: {
          message: `Project ${action.replace('update_', '')} has been updated.`,
        },
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Patch project error:', error)

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