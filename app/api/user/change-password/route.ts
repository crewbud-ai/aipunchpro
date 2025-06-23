// ==============================================
// src/app/api/user/change-password/route.ts - Change Password API (FIXED)
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import { AuthDatabaseService } from '@/lib/database/services'
import { authEmailService } from '@/lib/email/index'
import { 
  validateChangePassword, 
  formatProfileErrors 
} from '@/lib/validations/dashboard/profile'

// ==============================================
// POST /api/user/change-password - Change User Password
// ==============================================
export async function POST(request: NextRequest) {
  try {
    // Get user ID from middleware (set in headers)
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          message: 'You must be logged in to change your password.',
        },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    
    // Validate input
    const validation = validateChangePassword(body)
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

    const { currentPassword, newPassword } = validation.data

    // Create service instance
    const authDatabaseService = new AuthDatabaseService(true, false)

    // Get user with password hash for verification
    const user = await authDatabaseService.getUserForLogin(
      request.headers.get('x-user-email') || ''
    )
    
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
          message: 'User account not found.',
        },
        { status: 404 }
      )
    }

    // Verify user ID matches (security check)
    if (user.id !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication mismatch',
          message: 'Authentication error. Please log in again.',
        },
        { status: 401 }
      )
    }

    // Check if user has a password set
    if (!user.password_hash) {
      return NextResponse.json(
        {
          success: false,
          error: 'No password set',
          message: 'This account was created without a password. Please use the password reset function.',
          actions: {
            resetPassword: `/api/auth/forgot-password`,
          },
        },
        { status: 403 }
      )
    }

    // Verify current password
    const isCurrentPasswordValid = await authDatabaseService.verifyPassword(
      currentPassword, 
      user.password_hash
    )
    
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid current password',
          message: 'The current password you entered is incorrect.',
        },
        { status: 400 }
      )
    }

    // Check if new password is different from current password
    const isSamePassword = await authDatabaseService.verifyPassword(
      newPassword, 
      user.password_hash
    )
    
    if (isSamePassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'Same password',
          message: 'New password must be different from your current password.',
        },
        { status: 400 }
      )
    }

    // Set the new password
    await authDatabaseService.setUserPassword(userId, newPassword)

    // PROFESSIONAL APPROACH: Invalidate ALL sessions for maximum security
    // User will need to log in again with new password (industry standard)
    await authDatabaseService.invalidateAllUserSessions(userId)

    // Send password change notification email using existing method
    const emailResult = await authEmailService.sendPasswordResetSuccessEmail({
      email: user.email,
      firstName: user.first_name,
    })

    // Log email result but don't fail password change if email fails
    if (!emailResult.success) {
      console.error('Failed to send password change notification email:', emailResult.error)
    }

    // Return success response with professional messaging
    return NextResponse.json(
      {
        success: true,
        message: 'Password changed successfully',
        data: {
          passwordChanged: true,
          changedAt: new Date().toISOString(),
          sessionsInvalidated: true,
        },
        notifications: {
          message: '🔐 Password changed successfully! For security, you have been logged out of all devices. Please log in again with your new password.',
        },
        security: {
          all_sessions_invalidated: true,
          action_required: 'reauthentication',
          reason: 'Password change security protocol'
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Change password error:', error)

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
        message: 'Something went wrong while changing your password. Please try again.',
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