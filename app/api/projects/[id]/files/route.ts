// ==============================================
// app/api/projects/[id]/files/route.ts - Project Files API (Fixed Exports)
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import {
  validateCreateProjectFile,
  validateGetProjectFiles,
  formatProjectFileErrors,
} from '@/lib/validations/projects/project-files'
import { ProjectDatabaseService } from '@/lib/database/services/projects'
import { ProjectFilesDatabaseService } from '@/lib/database/services/project-files'

// ==============================================
// GET /api/projects/[id]/files - Get Project Files
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
          message: 'You must be logged in to view project files.',
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

    // Validate project ID format
    if (projectId.length !== 36) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid project ID',
          message: 'Please provide a valid project ID.',
        },
        { status: 400 }
      )
    }

    // Parse query parameters
    const url = new URL(request.url)
    const queryParams = {
      folder: url.searchParams.get('folder'),
      category: url.searchParams.get('category'),
      limit: url.searchParams.get('limit'),
      offset: url.searchParams.get('offset'),
      search: url.searchParams.get('search'),
      sortBy: url.searchParams.get('sortBy'),
      sortOrder: url.searchParams.get('sortOrder'),
    }

    // Validate query parameters
    const validation = validateGetProjectFiles(queryParams)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
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
          message: 'The requested project could not be found.',
        },
        { status: 404 }
      )
    }

    // Get project files with filtering and pagination
    const options = {
      folder: validation.data.folder || undefined,
      category: validation.data.category || undefined,
      search: validation.data.search || undefined,
      sortBy: validation.data.sortBy || undefined,
      sortOrder: validation.data.sortOrder || undefined,
      limit: validation.data.limit || undefined,
      offset: validation.data.offset || undefined,
    }
    
    const result = await projectFilesService.getProjectFiles(projectId, options)

    // Transform files to clean structure (following your pattern)
    const transformedFiles = result.files.map((file: any) => ({
      id: file.id,
      projectId: file.project_id,
      name: file.name,
      originalName: file.original_name,
      fileUrl: file.file_url,
      fileType: file.file_type,
      fileSize: file.file_size,
      mimeType: file.mime_type,
      folder: file.folder,
      category: file.category,
      version: file.version,
      description: file.description,
      tags: file.tags || [],
      isPublic: file.is_public,
      status: file.status,
      uploadedBy: file.uploaded_by,
      uploadedAt: file.uploaded_at,
      createdAt: file.created_at,
      updatedAt: file.updated_at,

      // Related data
      uploader: file.uploader ? {
        id: file.uploader.id,
        firstName: file.uploader.first_name,
        lastName: file.uploader.last_name,
        email: file.uploader.email,
      } : null,
    }))

    return NextResponse.json(
      {
        success: true,
        message: 'Project files retrieved successfully',
        data: {
          files: transformedFiles,
          totalCount: result.totalCount,
          pagination: {
            limit: validation.data.limit || 50,
            offset: validation.data.offset || 0,
            hasMore: result.totalCount > (validation.data.offset || 0) + transformedFiles.length,
          },
        },
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Get project files error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong while retrieving project files.',
      },
      { status: 500 }
    )
  }
}

// ==============================================
// POST /api/projects/[id]/files - Upload Project File
// ==============================================
export async function POST(
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
          message: 'You must be logged in to upload files.',
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

    // Validate project ID format
    if (projectId.length !== 36) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid project ID',
          message: 'Please provide a valid project ID.',
        },
        { status: 400 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const description = formData.get('description') as string
    const version = formData.get('version') as string

    // Prepare validation data
    const validationData = {
      projectId,
      file,
      description: description || undefined,
      version: version || '1.0',
      // Fixed values as requested
      folder: 'blueprints',
      category: 'architectural',
      isPublic: true,
    }

    // Validate input data
    const validation = validateCreateProjectFile(validationData)
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
          message: 'The project you are trying to upload to does not exist.',
        },
        { status: 404 }
      )
    }

    // Transform validation data for database service
    const fileData = {
      ...validation.data,
      companyId,
      uploadedBy: userId,
    }

    // Create project file
    const newFile = await projectFilesService.createProjectFile(fileData)

    // Get the created file with full details
    const fileWithDetails = await projectFilesService.getProjectFileById(newFile.id, projectId)

    // Transform response to match frontend expectations (following your pattern)
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
        message: 'File uploaded successfully',
        data: {
          file: transformedFile,
        },
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Upload project file error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong while uploading the file.',
      },
      { status: 500 }
    )
  }
}