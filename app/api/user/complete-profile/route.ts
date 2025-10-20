// ==============================================
// app/api/user/complete-profile/route.ts - Complete Profile API
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import { AuthDatabaseService } from '@/lib/database/services'
import { validateCompleteProfileForm } from '@/types/auth/complete-profile'

export async function POST(request: NextRequest) {
  try {
    // Get user ID from middleware (set in headers)
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          message: 'You must be logged in to complete your profile.',
        },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Validate input
    const validation = validateCompleteProfileForm(body)
    if (!validation.success || !validation.data) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: validation.errors,
        },
        { status: 400 }
      )
    }

    const { phone, tradeSpecialty, startDate, emergencyContactName, emergencyContactPhone } = validation.data

    // Create service instance
    const authDatabaseService = new AuthDatabaseService(true, false)

    // Complete Google user profile
    await authDatabaseService.completeGoogleUserProfile(userId, {
      phone,
      tradeSpecialty,
      startDate,
      emergencyContactName,
      emergencyContactPhone,
    })

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Profile completed successfully',
        data: {
          profileCompleted: true,
          completedAt: new Date().toISOString(),
        },
        notifications: {
          message: 'Your profile has been completed successfully!',
        },
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Complete profile error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong while completing your profile. Please try again.',
      },
      { status: 500 }
    )
  }
}

// ==============================================
// ALLOWED METHODS
// ==============================================
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}