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

    // 🆕 CHECK IF THIS IS FIRST-TIME PASSWORD CHANGE (no currentPassword provided)
    const isFirstTimeChange = !body.currentPassword

    // Validate input - different validation for first-time vs normal change
    let validation
    if (isFirstTimeChange) {
      // First-time change: only need new password and confirm
      validation = {
        success: true,
        data: {
          newPassword: body.newPassword,
          confirmPassword: body.confirmPassword,
        }
      }

      // Basic validation
      if (!body.newPassword || !body.confirmPassword) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation failed',
            message: 'New password and confirmation are required.',
          },
          { status: 400 }
        )
      }

      if (body.newPassword !== body.confirmPassword) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation failed',
            message: 'Passwords do not match.',
          },
          { status: 400 }
        )
      }
    } else {
      // Normal password change: need current password
      validation = validateChangePassword(body)
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
    }

    const { newPassword } = validation.data
    const currentPassword = body.currentPassword

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

    // HANDLE FIRST-TIME PASSWORD CHANGE
    if (isFirstTimeChange) {
      // Verify this user actually requires password change
      const requiresChange = await authDatabaseService.getUserPasswordChangeStatus(userId)

      if (!requiresChange) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid request',
            message: 'This endpoint is only for first-time password changes.',
          },
          { status: 400 }
        )
      }

      // Check if new password is different from temporary password
      const isSameAsTemporary = await authDatabaseService.verifyPassword(
        newPassword,
        user.password_hash
      )

      if (isSameAsTemporary) {
        return NextResponse.json(
          {
            success: false,
            error: 'Same password',
            message: 'New password must be different from your temporary password.',
          },
          { status: 400 }
        )
      }
    } else {
      // NORMAL PASSWORD CHANGE: Verify current password
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
    }

    // Set the new password (this also clears requires_password_change flag - Phase 2!)
    await authDatabaseService.setUserPassword(userId, newPassword)

    // DIFFERENT SESSION HANDLING FOR FIRST-TIME CHANGE
    if (isFirstTimeChange) {
      // First-time change: Keep current session, just refresh
      // User stays logged in after changing password
      console.log(`✅ First-time password changed for user ${userId}, keeping session active`)
    } else {
      // Normal change: Invalidate ALL sessions for maximum security
      await authDatabaseService.invalidateAllUserSessions(userId)
      console.log(`✅ Password changed for user ${userId}, all sessions invalidated`)
    }

    // Send password change notification email
    const emailResult = await authEmailService.sendPasswordResetSuccessEmail({
      email: user.email,
      firstName: user.first_name,
    })

    // Log email result but don't fail password change if email fails
    if (!emailResult.success) {
      console.error('Failed to send password change notification email:', emailResult.error)
    }

    // Return success response with different messages for first-time vs normal
    return NextResponse.json(
      {
        success: true,
        message: isFirstTimeChange
          ? 'Password changed successfully'
          : 'Password changed successfully',
        data: {
          passwordChanged: true,
          changedAt: new Date().toISOString(),
          sessionsInvalidated: !isFirstTimeChange, // Only invalidate for normal changes
        },
        notifications: {
          message: isFirstTimeChange
            ? 'Password changed successfully! You can now access all features.'
            : 'Password changed successfully! For security, you have been logged out of all devices. Please log in again with your new password.',
        },
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Change password error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong while changing your password.',
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