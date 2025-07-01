// ==============================================
// src/app/api/projects/next-number/route.ts - Auto-generate Next Project Number
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import { ProjectDatabaseService } from '@/lib/database/services/projects'

// ==============================================
// GET /api/projects/next-number - Get Next Available Project Number
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
          message: 'You must be logged in to generate project numbers.',
        },
        { status: 401 }
      )
    }

    // Create service instance
    const projectService = new ProjectDatabaseService(true, false)

    try {
      // Get the next project number for this company using enhanced method
      const nextProjectNumber = await projectService.getNextProjectNumber(companyId)
      
      return NextResponse.json(
        {
          success: true,
          projectNumber: nextProjectNumber,
          message: 'Project number generated successfully',
        },
        { status: 200 }
      )
      
    } catch (error) {
      console.error('Generate project number error:', error)
      
      // Fallback: generate based on current timestamp
      const currentYear = new Date().getFullYear()
      const timestamp = Date.now().toString().slice(-6)
      const fallbackNumber = `PRJ-${currentYear}-${timestamp}`
      
      return NextResponse.json(
        {
          success: true,
          projectNumber: fallbackNumber,
          message: 'Project number generated with fallback method',
          warning: 'Used fallback generation due to database error',
        },
        { status: 200 }
      )
    }

  } catch (error) {
    console.error('Project number generation error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong while generating the project number.',
      },
      { status: 500 }
    )
  }
}

// ==============================================
// ALLOWED METHODS
// ==============================================
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

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