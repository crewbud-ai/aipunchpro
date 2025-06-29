// ==============================================
// src/app/api/projects/route.ts - Projects API Routes
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import { 
  validateCreateProject, 
  validateGetProjects,
  formatProjectErrors 
} from '@/lib/validations/projects/project'
import { ProjectDatabaseService } from '@/lib/database/services/projects'

// ==============================================
// GET /api/projects - Get All Projects for Company
// ==============================================
export async function GET(request: NextRequest) {
  try {
    // Get user info from middleware (set in headers)
    const userId = request.headers.get('x-user-id')
    const userEmail = request.headers.get('x-user-email')
    
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          message: 'You must be logged in to view projects.',
        },
        { status: 401 }
      )
    }

    // Get company ID from user (we'll need to fetch this)
    const projectService = new ProjectDatabaseService(true, false)
    
    // Parse query parameters - handle empty/null values
    const url = new URL(request.url)
    const queryParams = {
      status: url.searchParams.get('status'),
      priority: url.searchParams.get('priority'),
      limit: url.searchParams.get('limit'),
      offset: url.searchParams.get('offset'),
      search: url.searchParams.get('search'),
      sortBy: url.searchParams.get('sortBy'),
      sortOrder: url.searchParams.get('sortOrder'),
    }

    // Validate query parameters - but allow empty object
    const validation = validateGetProjects(queryParams)
    if (!validation.success) {
      console.error('Validation error:', validation.error)
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: formatProjectErrors(validation.error),
        },
        { status: 400 }
      )
    }

    // TODO: Get company ID from user session/token
    // For now, we'll need to fetch user info to get company_id
    const companyId = request.headers.get('x-company-id') // This should be set by middleware

    if (!companyId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Company not found',
          message: 'Unable to determine company context.',
        },
        { status: 400 }
      )
    }

    // Get projects with pagination and filtering
    const result = await projectService.getProjectsByCompany(companyId, validation.data)

    // Calculate pagination info
    const limit = validation.data.limit || 50
    const offset = validation.data.offset || 0
    const hasMore = result.total > offset + limit

    return NextResponse.json(
      {
        success: true,
        message: 'Projects retrieved successfully',
        data: {
          projects: result.projects,
          pagination: {
            total: result.total,
            limit,
            offset,
            hasMore,
          },
        },
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Get projects error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong while retrieving projects.',
      },
      { status: 500 }
    )
  }
}

// ==============================================
// POST /api/projects - Create New Project
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
          message: 'You must be logged in to create projects.',
        },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    
    // Validate input data
    const validation = validateCreateProject(body)
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

    const projectData = validation.data

    // Create service instance
    const projectService = new ProjectDatabaseService(true, false)

    // Check if project name already exists for this company
    const nameExists = await projectService.isProjectNameTaken(
      projectData.name, 
      companyId
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

    // Create project
    const newProject = await projectService.createProject({
      companyId,
      name: projectData.name,
      description: projectData.description,
      projectNumber: projectData.projectNumber,
      status: projectData.status,
      priority: projectData.priority,
      budget: projectData.budget,
      startDate: projectData.startDate,
      endDate: projectData.endDate,
      estimatedHours: projectData.estimatedHours,
      location: projectData.location,
      address: projectData.address,
      clientName: projectData.clientName,
      clientContact: projectData.clientContact,
      createdBy: userId,
      tags: projectData.tags,
    })

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Project created successfully',
        data: {
          project: {
            id: newProject.id,
            name: newProject.name,
            description: newProject.description,
            projectNumber: newProject.project_number,
            status: newProject.status,
            priority: newProject.priority,
            budget: newProject.budget,
            spent: newProject.spent,
            progress: newProject.progress,
            startDate: newProject.start_date,
            endDate: newProject.end_date,
            estimatedHours: newProject.estimated_hours,
            actualHours: newProject.actual_hours,
            location: newProject.location,
            address: newProject.address,
            clientName: newProject.client_name,
            clientContact: newProject.client_contact,
            tags: newProject.tags,
            createdAt: newProject.created_at,
            updatedAt: newProject.updated_at,
          },
        },
        notifications: {
          message: 'Project has been created and is ready for team assignments.',
        },
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Create project error:', error)

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
        message: 'Something went wrong while creating the project.',
      },
      { status: 500 }
    )
  }
}

// ==============================================
// ALLOWED METHODS
// ==============================================
export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}