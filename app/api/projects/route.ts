// ==============================================
// src/app/api/projects/route.ts - Clean Projects API Routes for New Schema
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import {
  validateCreateProject,
  validateGetProjects,
  formatProjectErrors,
} from '@/lib/validations/projects/project'
import { ProjectDatabaseService } from '@/lib/database/services/projects'
import { createProjectLocation, createProjectClient, ProjectClient, ProjectLocation } from '@/lib/database/schema/projects'

// ==============================================
// GET /api/projects - Get All Projects for Company
// ==============================================
export async function GET(request: NextRequest) {
  try {
    // Get user info from middleware (your existing code)
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

    // Parse query parameters (your existing code + memberView)
    const url = new URL(request.url)
    const queryParams = {
      status: url.searchParams.get('status'),
      priority: url.searchParams.get('priority'),
      limit: url.searchParams.get('limit'),
      offset: url.searchParams.get('offset'),
      search: url.searchParams.get('search'),
      sortBy: url.searchParams.get('sortBy'),
      sortOrder: url.searchParams.get('sortOrder'),
      location: url.searchParams.get('location'),
      client: url.searchParams.get('client'),
      // NEW: Check if this is a member view request
      memberView: url.searchParams.get('memberView') === 'true'
    }

    // Validate query parameters (your existing validation)
    const validation = validateGetProjects(queryParams)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: formatProjectErrors(validation.error),
        },
        { status: 400 }
      )
    }

    // Create service instance (your existing code)
    const projectService = new ProjectDatabaseService(true, false)

    let result

    // NEW: Check if this is a member view request
    if (queryParams.memberView) {
      // Get only assigned projects for members
      result = await projectService.getMemberAssignedProjects(companyId, userId, validation.data)
    } else {
      // Get all projects for admins (your existing logic)
      result = await projectService.getProjectsByCompany(companyId, validation.data)
    }

    // Transform projects to clean structure (your existing logic)
    const transformedProjects = result.projects.map(project => ({
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

      // JSONB fields
      location: project.location || null,
      client: project.client || null,
      tags: project.tags || [],
      createdAt: project.created_at,
      updatedAt: project.updated_at,

      // FIXED: Member-specific fields with correct data structure
      ...(queryParams.memberView && project.project_member && {
        // Get the role from the nested user object (not from project_members anymore)
        memberRole: project.project_member.user?.role || 'member',
        joinedAt: project.project_member.joined_at,
        // FIXED: status field instead of is_active
        isActive: project.project_member.status === 'active',
        memberStatus: project.project_member.status,
        assignedBy: project.project_member.assigned_by,
        hourlyRate: project.project_member.hourly_rate,
        overtimeRate: project.project_member.overtime_rate,
        memberNotes: project.project_member.notes
      }),

      creator: project.creator ? {
        id: project.creator.id,
        name: `${project.creator.first_name} ${project.creator.last_name}`,
        email: project.creator.email,
      } : null,

      // FIXED: Member info when in member view (from the nested user object)
      ...(queryParams.memberView && project.project_member?.user && {
        memberInfo: {
          id: project.project_member.user.id,
          name: `${project.project_member.user.first_name} ${project.project_member.user.last_name}`,
          email: project.project_member.user.email,
          role: project.project_member.user.role
        }
      })
    }))

    return NextResponse.json({
      success: true,
      data: {
        projects: transformedProjects,
        pagination: {
          total: result.total,
          page: Math.floor((validation.data.offset || 0) / (validation.data.limit || 20)) + 1,
          limit: validation.data.limit || 20,
          totalPages: Math.ceil(result.total / (validation.data.limit || 20))
        },
        filters: {
          memberView: queryParams.memberView,
          status: validation.data.status,
          priority: validation.data.priority,
          search: validation.data.search,
          location: validation.data.location,
          client: validation.data.client,
          sortBy: validation.data.sortBy,
          sortOrder: validation.data.sortOrder
        }
      }
    })


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

    // Validate input data directly
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

    // Auto-generate project number if not provided
    let projectNumber = projectData.projectNumber
    if (!projectNumber) {
      projectNumber = await projectService.getNextProjectNumber(companyId)
    }

    // Prepare location JSONB data
    let locationData: ProjectLocation | undefined = undefined
    if (projectData.location) {
      // Direct location object provided
      locationData = projectData.location
    } else if (projectData.selectedLocation) {
      // Transform selectedLocation from form
      locationData = createProjectLocation(
        projectData.selectedLocation.address,
        projectData.selectedLocation.coordinates,
        projectData.selectedLocation.placeId,
        projectData.selectedLocation.displayName
      )
    }

    // Prepare client JSONB data  
    let clientData: ProjectClient | undefined = undefined
    if (projectData.client) {
      // Direct client object provided
      clientData = projectData.client
    } else if (projectData.clientName || projectData.clientEmail || projectData.clientPhone) {
      // Transform client form fields
      clientData = createProjectClient(
        projectData.clientName,
        projectData.clientEmail,
        projectData.clientPhone,
        projectData.clientContactPerson
      )
    }

    // Create project using enhanced method
    const newProject = await projectService.createProjectEnhanced({
      companyId,
      name: projectData.name,
      description: projectData.description,
      projectNumber,
      status: projectData.status || 'not_started',
      priority: projectData.priority || 'medium',
      budget: projectData.budget,
      startDate: projectData.startDate,
      endDate: projectData.endDate,
      estimatedHours: projectData.estimatedHours,
      location: locationData,
      client: clientData,
      tags: projectData.tags,
      createdBy: userId,
    })

    // Return clean success response
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
            actualStartDate: newProject.actual_start_date,
            actualEndDate: newProject.actual_end_date,
            estimatedHours: newProject.estimated_hours,
            actualHours: newProject.actual_hours,

            // Clean JSONB fields
            location: newProject.location,
            client: newProject.client,

            tags: newProject.tags || [],
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