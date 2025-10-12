// ==============================================
// src/app/api/auth/reset-password/route.ts - Reset Password API
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import { AuthDatabaseService } from '@/lib/database/services'
import { authEmailService } from '@/lib/email/index'
import { 
  validateResetPassword, 
  formatPasswordResetErrors 
} from '@/lib/validations/auth/password-reset'

// ==============================================
// POST /api/auth/reset-password - Reset Password
// ==============================================
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    
    // Validate input
    const validation = validateResetPassword(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: formatPasswordResetErrors(validation.error),
        },
        { status: 400 }
      )
    }

    const { token, email, newPassword } = validation.data

    // Create service instance
    const authDatabaseService = new AuthDatabaseService(true, false)

    // Find the password reset token with user data
    const resetData = await authDatabaseService.findValidPasswordResetToken(token)
    
    if (!resetData) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired reset token',
          message: 'The password reset link is invalid or has expired. Please request a new password reset.',
        },
        { status: 400 }
      )
    }

    // Verify email matches
    if (resetData.user.email !== email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email mismatch',
          message: 'The email address does not match the reset token.',
        },
        { status: 400 }
      )
    }

    const user = resetData.user

    // Check if email is verified
    if (!user.email_verified) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email not verified',
          message: 'Please verify your email address before resetting your password.',
          actions: {
            resendVerification: `/api/auth/resend-verification`,
          },
        },
        { status: 403 }
      )
    }

    // Set the new password
    await authDatabaseService.setUserPassword(user.id, newPassword)

    // Mark the reset token as used
    await authDatabaseService.markPasswordResetTokenAsUsed(token)

    // Invalidate all existing sessions for security
    await authDatabaseService.invalidateAllUserSessions(user.id)

    // Send password reset success email
    const emailResult = await authEmailService.sendPasswordResetSuccessEmail({
      email: user.email,
      firstName: user.first_name,
    })

    // Log email result but don't fail password reset if email fails
    if (!emailResult.success) {
      console.error('Failed to send password reset success email:', emailResult.error)
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Password reset successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
          },
          passwordReset: {
            resetAt: new Date().toISOString(),
          },
          emailSent: emailResult.success,
          sessionsInvalidated: true, // All previous sessions are now invalid
        },
        notifications: {
          message: 'Your password has been reset successfully! All previous sessions have been logged out for security.',
          confirmationEmailSent: emailResult.success
            ? 'A confirmation email has been sent to your inbox.'
            : 'Password reset successful, but we had trouble sending the confirmation email.',
        },
        actions: {
          login: '/api/auth/login',
          loginUrl: '/auth/login',
        },
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Reset password error:', error)

    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('Token not found') || error.message.includes('expired')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid reset token',
            message: 'The password reset link is invalid or has expired.',
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
        message: 'Something went wrong during password reset. Please try again.',
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