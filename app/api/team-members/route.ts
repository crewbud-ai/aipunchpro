// ==============================================
// src/app/api/team-members/route.ts - Team Members API Routes (Updated with Email Integration)
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import {
  validateCreateTeamMember,
  validateGetTeamMembers,
  formatTeamMemberErrors,
} from '@/lib/validations/team/team-member'
import { TeamMemberDatabaseService } from '@/lib/database/services/team-members'
import { AuthDatabaseService } from '@/lib/database/services/auth'
import { ProjectDatabaseService } from '@/lib/database/services/projects'
import { calculateTeamMemberStatus } from '@/lib/database/schema/project-members'
import { teamMemberEmailService } from '@/lib/email/services/team-members'
import { generateSecurePassword, generateLoginUrl, generateDashboardUrl } from '@/lib/email/utils/tokens'

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

    // Get team members from database
    const result = await teamService.getTeamMembersByCompany(companyId, serviceOptions)

    // Transform team members for frontend
    const transformedTeamMembers = result.teamMembers.map((tm: any) => ({
      id: tm.id,
      firstName: tm.first_name,
      lastName: tm.last_name,
      email: tm.email,
      phone: tm.phone,
      role: tm.role,
      jobTitle: tm.job_title,
      tradeSpecialty: tm.trade_specialty,
      hourlyRate: tm.hourly_rate,
      overtimeRate: tm.overtime_rate,
      startDate: tm.start_date,
      certifications: tm.certifications,
      emergencyContactName: tm.emergency_contact_name,
      emergencyContactPhone: tm.emergency_contact_phone,
      isActive: tm.is_active,
      createdAt: tm.created_at,
      updatedAt: tm.updated_at,

      // Project assignments
      currentProjects: tm.project_memberships?.filter((pm: any) => pm.status === 'active').map((pm: any) => ({
        id: pm.project?.id,
        name: pm.project?.name,
        status: pm.project?.status,
        priority: pm.project?.priority,
        role: pm.role,
        hourlyRate: pm.hourly_rate,
        overtimeRate: pm.overtime_rate,
        joinedAt: pm.joined_at,
      })) || [],

      // Calculate assignment status
      assignmentStatus: calculateTeamMemberStatus(tm.is_active, tm.project_memberships?.filter((pm: any) => pm.status === 'active').length || 0),
      activeProjectCount: tm.project_memberships?.filter((pm: any) => pm.status === 'active').length || 0,
    }))

    // Apply frontend filters if needed
    let filteredTeamMembers = transformedTeamMembers

    // Filter by assignment status (post-query filtering)
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
// POST /api/team-members - Create New Team Member (Updated with Email)
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
    const body = await request.json();

    console.log(body, 'body')

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

    // Create service instances
    const teamService = new TeamMemberDatabaseService(true, false)
    const authService = new AuthDatabaseService(true, false)
    const projectService = new ProjectDatabaseService(true, false)

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

    // Get company details for email
    const company = await authService.getCompanyById(companyId)
    if (!company) {
      return NextResponse.json(
        {
          success: false,
          error: 'Company not found',
          message: 'Company information could not be retrieved.',
        },
        { status: 404 }
      )
    }

    // Generate temporary password
    const temporaryPassword = generateSecurePassword()

    let newUser: any
    let projectAssignment: any = null
    let projectDetails: any = null

    // Check if creating with project assignment
    if (teamMemberData.projectId) {
      // Get basic project details using the helper method
      try {
        projectDetails = await teamService.getBasicProjectInfo(teamMemberData.projectId, companyId)

        if (!projectDetails) {
          return NextResponse.json({
            success: false,
            error: 'Project not found',
            message: 'The specified project could not be found.',
          }, { status: 404 })
        }
      } catch (error) {
        console.error('Error fetching project details:', error)
        return NextResponse.json({
          success: false,
          error: 'Project not found',
          message: 'The specified project could not be found.',
        }, { status: 404 })
      }

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
        temporaryPassword,  // PASS THE PASSWORD TO DATABASE

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
      // Create team member only (no project assignment)
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
        temporaryPassword,  // PASS THE PASSWORD TO DATABASE
      })
    }

    // ==============================================
    // SEND WELCOME EMAIL
    // ==============================================
    try {
      await teamMemberEmailService.sendWelcomeEmail({
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        companyName: company.name,
        role: newUser.role,
        temporaryPassword,
        loginUrl: generateLoginUrl(),
        projectAssignment: projectDetails ? {
          projectName: projectDetails.name,
          notes: projectAssignment?.notes,
        } : undefined,
      })
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
      // Don't fail the entire request if email fails
    }

    // Calculate assignment status
    const assignmentStatus = calculateTeamMemberStatus(newUser.is_active, projectAssignment ? 1 : 0)

    const statusSuggestion = await checkProjectStartSuggestion(
      projectAssignment.id,
      companyId
    )

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
      statusSuggestion: statusSuggestion
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
      ? {
        message: `Team member has been created and assigned to the project. They will receive a welcome email with login instructions.`
      }
      : {
        message: `Team member has been created and is ready to be assigned to projects. They will receive a welcome email with login instructions.`
      }

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


async function checkProjectStartSuggestion(
  projectId: string,
  companyId: string
) {
  const projectService = new ProjectDatabaseService(true, false)
  const teamService = new TeamMemberDatabaseService(true, false)
  
  // Get project details
  const project = await projectService.getProjectByIdEnhanced(projectId, companyId)
  if (!project) return null
  
  // Only suggest for not_started projects
  if (project.status !== 'not_started') return null
  
  // Get team members for this project using the correct service
  const projectMembers = await teamService.getProjectTeamMembers(projectId, companyId)
  const hasTeamMembers = projectMembers && projectMembers.length > 0
  
  // Check if start date condition is met
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  let isStartDateReached = true
  if (project.start_date) {
    const startDate = new Date(project.start_date)
    startDate.setHours(0, 0, 0, 0)
    isStartDateReached = startDate <= today
  }
  
  if (hasTeamMembers && isStartDateReached) {
    return {
      shouldSuggest: true,
      currentStatus: 'not_started',
      suggestedStatus: 'in_progress',
      message: 'Your project now has team members assigned. Would you like to start the project?',
      reason: 'Team assigned and start date reached',
      teamCount: projectMembers.length
    }
  } else if (hasTeamMembers && !isStartDateReached) {
    const startDateStr = project.start_date 
      ? new Date(project.start_date).toLocaleDateString()
      : 'Not set'
    return {
      shouldSuggest: false,
      currentStatus: 'not_started',
      message: `Project will auto-start on ${startDateStr}`,
      reason: 'Start date not yet reached'
    }
  }
  
  return null
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