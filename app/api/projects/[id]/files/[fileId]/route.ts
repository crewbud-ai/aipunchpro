// ==============================================
// app/api/projects/[id]/files/[fileId]/route.ts - Individual Project File API
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import {
  validateUpdateProjectFile,
  validateDeleteProjectFile,
  formatProjectFileErrors,
} from '@/lib/validations/projects/project-files'
import { ProjectDatabaseService } from '@/lib/database/services/projects'
import { ProjectFilesDatabaseService } from '@/lib/database/services/project-files'

// ==============================================
// GET /api/projects/[id]/files/[fileId] - Get Single Project File
// ==============================================
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; fileId: string } }
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
          message: 'You must be logged in to view project files.',
        },
        { status: 401 }
      )
    }

    const projectId = params.id
    const fileId = params.fileId

    if (!projectId || !fileId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          message: 'Project ID and file ID are required.',
        },
        { status: 400 }
      )
    }

    // Validate ID formats
    if (projectId.length !== 36 || fileId.length !== 36) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid ID format',
          message: 'Please provide valid project and file IDs.',
        },
        { status: 400 }
      )
    }

    // Create service instances
    const projectService = new ProjectDatabaseService(true, false)
    const projectFilesService = new ProjectFilesDatabaseService(true, false)

    // Check if project exists and belongs to company
    const projectExists = await projectService.checkProjectExists(projectId, companyId)
    if (!projectExists) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project not found',
          message: 'The requested project could not be found.',
        },
        { status: 404 }
      )
    }

    // Get project file with full details
    const fileWithDetails = await projectFilesService.getProjectFileById(fileId, projectId)

    if (!fileWithDetails) {
      return NextResponse.json(
        {
          success: false,
          error: 'File not found',
          message: 'The requested file could not be found.',
        },
        { status: 404 }
      )
    }

    // Transform response to match frontend expectations
    const transformedFile = {
      id: fileWithDetails.id,
      projectId: fileWithDetails.project_id,
      name: fileWithDetails.name,
      originalName: fileWithDetails.original_name,
      fileUrl: fileWithDetails.file_url,
      fileType: fileWithDetails.file_type,
      fileSize: fileWithDetails.file_size,
      mimeType: fileWithDetails.mime_type,
      folder: fileWithDetails.folder,
      category: fileWithDetails.category,
      version: fileWithDetails.version,
      description: fileWithDetails.description,
      tags: fileWithDetails.tags || [],
      isPublic: fileWithDetails.is_public,
      status: fileWithDetails.status,
      uploadedBy: fileWithDetails.uploaded_by,
      uploadedAt: fileWithDetails.uploaded_at,
      createdAt: fileWithDetails.created_at,
      updatedAt: fileWithDetails.updated_at,

      // Related data
      uploader: fileWithDetails.uploader ? {
        id: fileWithDetails.uploader.id,
        firstName: fileWithDetails.uploader.first_name,
        lastName: fileWithDetails.uploader.last_name,
        email: fileWithDetails.uploader.email,
      } : null,
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Project file retrieved successfully',
        data: {
          file: transformedFile,
        },
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Get project file error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong while retrieving the project file.',
      },
      { status: 500 }
    )
  }
}

// ==============================================
// PUT /api/projects/[id]/files/[fileId] - Update Project File
// ==============================================
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; fileId: string } }
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
          message: 'You must be logged in to update project files.',
        },
        { status: 401 }
      )
    }

    const projectId = params.id
    const fileId = params.fileId

    if (!projectId || !fileId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          message: 'Project ID and file ID are required.',
        },
        { status: 400 }
      )
    }

    // Validate ID formats
    if (projectId.length !== 36 || fileId.length !== 36) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid ID format',
          message: 'Please provide valid project and file IDs.',
        },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Add IDs to validation data
    const validationData = { ...body, id: fileId }

    // Validate input data
    const validation = validateUpdateProjectFile(validationData)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: formatProjectFileErrors(validation.error),
        },
        { status: 400 }
      )
    }

    // Create service instances
    const projectService = new ProjectDatabaseService(true, false)
    const projectFilesService = new ProjectFilesDatabaseService(true, false)

    // Check if project exists and belongs to company
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

    // Check if file exists
    const fileExists = await projectFilesService.checkProjectFileExists(fileId, projectId)
    if (!fileExists) {
      return NextResponse.json(
        {
          success: false,
          error: 'File not found',
          message: 'The file you are trying to update does not exist.',
        },
        { status: 404 }
      )
    }

    // Update project file
    await projectFilesService.updateProjectFile(fileId, projectId, validation.data)

    // Get updated file with full details
    const updatedFile = await projectFilesService.getProjectFileById(fileId, projectId)

    // Transform response to match frontend expectations
    const transformedFile = {
      id: updatedFile.id,
      projectId: updatedFile.project_id,
      name: updatedFile.name,
      originalName: updatedFile.original_name,
      fileUrl: updatedFile.file_url,
      fileType: updatedFile.file_type,
      fileSize: updatedFile.file_size,
      mimeType: updatedFile.mime_type,
      folder: updatedFile.folder,
      category: updatedFile.category,
      version: updatedFile.version,
      description: updatedFile.description,
      tags: updatedFile.tags || [],
      isPublic: updatedFile.is_public,
      status: updatedFile.status,
      uploadedBy: updatedFile.uploaded_by,
      uploadedAt: updatedFile.uploaded_at,
      createdAt: updatedFile.created_at,
      updatedAt: updatedFile.updated_at,

      // Related data
      uploader: updatedFile.uploader ? {
        id: updatedFile.uploader.id,
        firstName: updatedFile.uploader.first_name,
        lastName: updatedFile.uploader.last_name,
        email: updatedFile.uploader.email,
      } : null,
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Project file updated successfully',
        data: {
          file: transformedFile,
        },
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Update project file error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong while updating the project file.',
      },
      { status: 500 }
    )
  }
}

// ==============================================
// DELETE /api/projects/[id]/files/[fileId] - Delete Project File
// ==============================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; fileId: string } }
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
          message: 'You must be logged in to delete project files.',
        },
        { status: 401 }
      )
    }

    const projectId = params.id
    const fileId = params.fileId

    if (!projectId || !fileId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          message: 'Project ID and file ID are required.',
        },
        { status: 400 }
      )
    }

    // Validate ID formats
    if (projectId.length !== 36 || fileId.length !== 36) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid ID format',
          message: 'Please provide valid project and file IDs.',
        },
        { status: 400 }
      )
    }

    // Validate input data
    const validation = validateDeleteProjectFile({ id: fileId, projectId })
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: formatProjectFileErrors(validation.error),
        },
        { status: 400 }
      )
    }

    // Create service instances
    const projectService = new ProjectDatabaseService(true, false)
    const projectFilesService = new ProjectFilesDatabaseService(true, false)

    // Check if project exists and belongs to company
    const projectExists = await projectService.checkProjectExists(projectId, companyId)
    if (!projectExists) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project not found',
          message: 'The project you are trying to delete from does not exist.',
        },
        { status: 404 }
      )
    }

    // Check if file exists
    const fileExists = await projectFilesService.checkProjectFileExists(fileId, projectId)
    if (!fileExists) {
      return NextResponse.json(
        {
          success: false,
          error: 'File not found',
          message: 'The file you are trying to delete does not exist.',
        },
        { status: 404 }
      )
    }

    // Delete project file
    await projectFilesService.deleteProjectFile(fileId, projectId)

    return NextResponse.json(
      {
        success: true,
        message: 'Project file deleted successfully',
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Delete project file error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong while deleting the project file.',
      },
      { status: 500 }
    )
  }
}