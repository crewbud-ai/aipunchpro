// ==============================================
// src/app/api/user/profile/route.ts - Fixed Get/Update Profile API
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import { AuthDatabaseService } from '@/lib/database/services'
import { 
  validateUpdateProfile, 
  formatProfileErrors 
} from '@/lib/validations/dashboard/profile'

// ==============================================
// GET /api/user/profile - Get User Profile
// ==============================================
export async function GET(request: NextRequest) {
  try {
    // Get user ID from middleware (set in headers)
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          message: 'You must be logged in to access your profile.',
        },
        { status: 401 }
      )
    }

    // Create service instance
    const authDatabaseService = new AuthDatabaseService(true, false)

    // Get user profile with company data
    const user = await authDatabaseService.getUserById(userId)
    
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
          message: 'User profile not found.',
        },
        { status: 404 }
      )
    }

    // Safely extract company data (handle both object and array cases)
    const company = Array.isArray(user.company) ? user.company[0] : user.company
    
    if (!company) {
      return NextResponse.json(
        {
          success: false,
          error: 'Company data not found',
          message: 'Unable to retrieve company information.',
        },
        { status: 500 }
      )
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Profile retrieved successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            phone: user.phone || null,
            role: user.role,
            emailVerified: user.email_verified,
            lastLoginAt: user.last_login_at || null,
            createdAt: user.created_at,
            updatedAt: user.updated_at,
          },
          company: {
            id: company.id,
            name: company.name,
            slug: company.slug,
            industry: company.industry || null,
            size: company.size || null,
          },
        },
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Get profile error:', error)

    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('Invalid input syntax')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid request',
            message: 'The request contains invalid data.',
          },
          { status: 400 }
        )
      }
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong while retrieving your profile. Please try again.',
      },
      { status: 500 }
    )
  }
}

// ==============================================
// PUT /api/user/profile - Update User Profile
// ==============================================
export async function PUT(request: NextRequest) {
  try {
    // Get user ID from middleware (set in headers)
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          message: 'You must be logged in to update your profile.',
        },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    
    // Validate input
    const validation = validateUpdateProfile(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: formatProfileErrors(validation.error),
        },
        { status: 400 }
      )
    }

    const { firstName, lastName, phone } = validation.data

    // Create service instance
    const authDatabaseService = new AuthDatabaseService(true, false)

    // Check if user exists
    const existingUser = await authDatabaseService.getUserById(userId)
    
    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
          message: 'User profile not found.',
        },
        { status: 404 }
      )
    }

    // Update user profile
    const updatedUser = await authDatabaseService.updateUserProfile(userId, {
      firstName,
      lastName,
      phone: phone || null, // Convert empty string to null
    })

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            firstName: updatedUser.first_name,
            lastName: updatedUser.last_name,
            phone: updatedUser.phone || null,
            role: updatedUser.role,
            emailVerified: updatedUser.email_verified,
            lastLoginAt: updatedUser.last_login_at || null,
            createdAt: updatedUser.created_at,
            updatedAt: updatedUser.updated_at,
          },
        },
        notifications: {
          message: 'Your profile has been updated successfully.',
        },
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Update profile error:', error)

    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('Invalid input syntax')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid request',
            message: 'The request contains invalid data.',
          },
          { status: 400 }
        )
      }
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong while updating your profile. Please try again.',
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

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}