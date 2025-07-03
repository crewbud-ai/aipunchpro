// ==============================================
// src/app/api/projects/check-name/route.ts - Project Name Availability Check
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import { ProjectDatabaseService } from '@/lib/database/services/projects'

export async function GET(request: NextRequest) {
  try {
    // Get user info from middleware (same pattern as your other APIs)
    const userId = request.headers.get('x-user-id')
    const companyId = request.headers.get('x-company-id')
    
    if (!userId || !companyId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          message: 'You must be logged in to check project names.',
          available: false
        },
        { status: 401 }
      )
    }

    // Get project name from query params
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')

    if (!name) {
      return NextResponse.json(
        { error: 'Project name is required', available: false },
        { status: 400 }
      )
    }

    // Trim and validate name
    const trimmedName = name.trim()
    if (trimmedName.length < 2) {
      return NextResponse.json(
        { error: 'Project name must be at least 2 characters', available: false },
        { status: 400 }
      )
    }

    if (trimmedName.length > 255) {
      return NextResponse.json(
        { error: 'Project name must be less than 255 characters', available: false },
        { status: 400 }
      )
    }

    // Check name availability using ProjectDatabaseService (consistent with your other APIs)
    const projectService = new ProjectDatabaseService(true, false)
    const isNameTaken = await projectService.isProjectNameTaken(trimmedName, companyId)

    const isAvailable = !isNameTaken

    return NextResponse.json({
      success: true,
      available: isAvailable,
      name: trimmedName,
      message: isAvailable 
        ? 'Project name is available' 
        : 'Project name is already taken'
    })

  } catch (error) {
    console.error('Error checking project name availability:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to check project name availability', 
        message: 'Something went wrong while checking the project name.',
        available: false 
      },
      { status: 500 }
    )
  }
}