// ==============================================
// src/app/api/team-members/route.ts - Team Members API Routes
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import { 
  validateCreateTeamMember, 
  validateGetTeamMembers,
  formatTeamMemberErrors,
} from '@/lib/validations/team/team-member'
import { TeamMemberDatabaseService } from '@/lib/database/services/team-members'
import { calculateTeamMemberStatus } from '@/lib/database/schema/project-members'

// ==============================================
// GET /api/team-members - Get All Team Members for Company
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
          message: 'You must be logged in to view team members.',
        },
        { status: 401 }
      )
    }

    // Parse query parameters
    const url = new URL(request.url)
    const queryParams = {
      role: url.searchParams.get('role'),
      status: url.searchParams.get('status'),
      assignmentStatus: url.searchParams.get('assignmentStatus'),
      tradeSpecialty: url.searchParams.get('tradeSpecialty'),
      projectId: url.searchParams.get('projectId'),
      limit: url.searchParams.get('limit'),
      offset: url.searchParams.get('offset'),
      search: url.searchParams.get('search'),
      sortBy: url.searchParams.get('sortBy'),
      sortOrder: url.searchParams.get('sortOrder'),
    }

    // Validate query parameters
    const validation = validateGetTeamMembers(queryParams)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: formatTeamMemberErrors(validation.error),
        },
        { status: 400 }
      )
    }

    // Create service instance
    const teamService = new TeamMemberDatabaseService(true, false)

    // Transform validation data to match service expectations (camelCase -> snake_case)
    const serviceOptions = {
      ...validation.data,
      // Map frontend sortBy fields to database field names
      sortBy: validation.data.sortBy ? {
        'firstName': 'first_name',
        'lastName': 'last_name',
        'tradeSpecialty': 'trade_specialty',
        'hourlyRate': 'hourly_rate',
        'startDate': 'start_date',
        'createdAt': 'created_at',
        'email': 'email',
        'role': 'role'
      }[validation.data.sortBy] as any : undefined
    }

    // Get team members with pagination and filtering
    const result = await teamService.getTeamMembersByCompany(companyId, serviceOptions)

    // Transform team members to clean structure with calculated assignment status
    const transformedTeamMembers = result.teamMembers.map(user => {
      const activeProjects = user.project_memberships?.filter((pm: any) => pm.status === 'active') || []
      const assignmentStatus = calculateTeamMemberStatus(user.is_active, activeProjects.length)

      const currentProjects = activeProjects.map((pm: any) => ({
        id: pm.project.id,
        name: pm.project.name,
        status: pm.status,
        joinedAt: pm.joined_at,
      }))

      return {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        jobTitle: user.job_title,
        tradeSpecialty: user.trade_specialty,
        hourlyRate: user.hourly_rate,
        overtimeRate: user.overtime_rate,
        startDate: user.start_date,
        certifications: user.certifications,
        emergencyContactName: user.emergency_contact_name,
        emergencyContactPhone: user.emergency_contact_phone,
        isActive: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        
        // Calculated fields
        assignmentStatus,
        activeProjectCount: activeProjects.length,
        currentProjects,
      }
    })

    // Apply assignment status filter if specified (post-query since it's calculated)
    let filteredTeamMembers = transformedTeamMembers
    if (validation.data.assignmentStatus) {
      filteredTeamMembers = transformedTeamMembers.filter(tm => tm.assignmentStatus === validation.data.assignmentStatus)
    }

    // Apply project filter if specified (post-query)
    if (validation.data.projectId) {
      filteredTeamMembers = transformedTeamMembers.filter(tm => 
        tm.currentProjects.some((p: any) => p.id === validation.data.projectId)
      )
    }

    // Calculate pagination info
    const limit = validation.data.limit || 50
    const offset = validation.data.offset || 0
    const hasMore = result.total > offset + limit

    return NextResponse.json(
      {
        success: true,
        message: 'Team members retrieved successfully',
        data: {
          teamMembers: filteredTeamMembers,
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
    console.error('Get team members error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong while retrieving team members.',
      },
      { status: 500 }
    )
  }
}

// ==============================================
// POST /api/team-members - Create New Team Member
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
          message: 'You must be logged in to create team members.',
        },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    
    // Validate input data
    const validation = validateCreateTeamMember(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: formatTeamMemberErrors(validation.error),
        },
        { status: 400 }
      )
    }

    const teamMemberData = validation.data

    // Create service instance
    const teamService = new TeamMemberDatabaseService(true, false)

    // Check if email already exists for this company
    const emailExists = await teamService.isEmailTaken(
      teamMemberData.email, 
      companyId
    )

    if (emailExists) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email already exists',
          details: [{ field: 'email', message: 'A team member with this email already exists' }],
        },
        { status: 409 }
      )
    }

    let newUser: any
    let projectAssignment: any = null

    // Check if creating with project assignment
    if (teamMemberData.projectId) {
      // Create team member with project assignment
      const result = await teamService.createTeamMemberWithProjectAssignment({
        companyId,
        firstName: teamMemberData.firstName,
        lastName: teamMemberData.lastName,
        email: teamMemberData.email,
        phone: teamMemberData.phone,
        role: teamMemberData.role || 'member',
        jobTitle: teamMemberData.jobTitle,
        tradeSpecialty: teamMemberData.tradeSpecialty,
        hourlyRate: teamMemberData.hourlyRate,
        overtimeRate: teamMemberData.overtimeRate,
        startDate: teamMemberData.startDate,
        certifications: teamMemberData.certifications,
        emergencyContactName: teamMemberData.emergencyContactName,
        emergencyContactPhone: teamMemberData.emergencyContactPhone,
        isActive: teamMemberData.isActive !== undefined ? teamMemberData.isActive : true,
        
        // Project assignment data
        projectId: teamMemberData.projectId,
        projectHourlyRate: teamMemberData.projectHourlyRate,
        projectOvertimeRate: teamMemberData.projectOvertimeRate,
        assignmentNotes: teamMemberData.assignmentNotes,
        assignmentStatus: teamMemberData.assignmentStatus || 'active',
        assignedBy: userId,
      })

      newUser = result.user
      projectAssignment = result.projectAssignment
    } else {
      // Create team member only
      newUser = await teamService.createTeamMember({
        companyId,
        firstName: teamMemberData.firstName,
        lastName: teamMemberData.lastName,
        email: teamMemberData.email,
        phone: teamMemberData.phone,
        role: teamMemberData.role || 'member',
        jobTitle: teamMemberData.jobTitle,
        tradeSpecialty: teamMemberData.tradeSpecialty,
        hourlyRate: teamMemberData.hourlyRate,
        overtimeRate: teamMemberData.overtimeRate,
        startDate: teamMemberData.startDate,
        certifications: teamMemberData.certifications,
        emergencyContactName: teamMemberData.emergencyContactName,
        emergencyContactPhone: teamMemberData.emergencyContactPhone,
        isActive: teamMemberData.isActive !== undefined ? teamMemberData.isActive : true,
      })
    }

    // Calculate assignment status
    const assignmentStatus = calculateTeamMemberStatus(newUser.is_active, projectAssignment ? 1 : 0)

    // Build response data
    const responseData: any = {
      user: {
        id: newUser.id,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        jobTitle: newUser.job_title,
        tradeSpecialty: newUser.trade_specialty,
        hourlyRate: newUser.hourly_rate,
        overtimeRate: newUser.overtime_rate,
        startDate: newUser.start_date,
        certifications: newUser.certifications,
        emergencyContactName: newUser.emergency_contact_name,
        emergencyContactPhone: newUser.emergency_contact_phone,
        isActive: newUser.is_active,
        createdAt: newUser.created_at,
        updatedAt: newUser.updated_at,
      },
      assignmentStatus,
      activeProjectCount: projectAssignment ? 1 : 0,
    }

    // Add project assignment details if created
    if (projectAssignment) {
      responseData.projectAssignment = {
        id: projectAssignment.id,
        projectId: projectAssignment.project_id,
        status: projectAssignment.status,
        hourlyRate: projectAssignment.hourly_rate,
        overtimeRate: projectAssignment.overtime_rate,
        notes: projectAssignment.notes,
        joinedAt: projectAssignment.joined_at,
      }
    }

    // Build success message
    const message = projectAssignment 
      ? 'Team member created successfully and assigned to project'
      : 'Team member created successfully'

    const notifications = projectAssignment
      ? { message: 'Team member has been created and assigned to the project. They can now access project tasks and resources.' }
      : { message: 'Team member has been created and is ready to be assigned to projects.' }

    return NextResponse.json(
      {
        success: true,
        message,
        data: responseData,
        notifications,
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Create team member error:', error)

    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('duplicate key')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Duplicate entry',
            message: 'Email address already exists.',
          },
          { status: 409 }
        )
      }

      if (error.message.includes('User is already assigned')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Assignment conflict',
            message: 'User is already assigned to this project.',
          },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong while creating the team member.',
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