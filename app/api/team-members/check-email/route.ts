// ==============================================
// src/app/api/team-members/check-email/route.ts - Email Availability Check API
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import { TeamMemberDatabaseService } from '@/lib/database/services/team-members'

// ==============================================
// GET /api/team-members/check-email - Check Email Availability
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
          message: 'You must be logged in to check email availability.',
        },
        { status: 401 }
      )
    }

    // Parse query parameters
    const url = new URL(request.url)
    const email = url.searchParams.get('email')
    const excludeId = url.searchParams.get('excludeId') // For excluding current user during updates

    // Validate email parameter
    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          message: 'Email parameter is required.',
        },
        { status: 400 }
      )
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          available: false,
          reason: 'Invalid email format',
        },
        { status: 200 }
      )
    }

    // Create service instance
    const teamService = new TeamMemberDatabaseService(true, false)

    // Check if email is already taken in this company
    const emailTaken = await teamService.isEmailTaken(email, companyId, excludeId || undefined)

    return NextResponse.json(
      {
        available: !emailTaken,
        email: email,
        ...(emailTaken && { reason: 'Email is already in use by another team member' }),
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Check email availability error:', error)

    // For email checking, we return "not available" on error to be safe
    return NextResponse.json(
      {
        available: false,
        reason: 'Unable to verify email availability',
      },
      { status: 200 }
    )
  }
}