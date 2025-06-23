// ==============================================
// src/app/api/auth/forgot-password/route.ts - Forgot Password API
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import { AuthDatabaseService } from '@/lib/database/services'
import { authEmailService } from '@/lib/email/index'
import { generatePasswordResetToken, generatePasswordResetUrl } from '@/lib/email/utils/tokens'
import { 
  validateForgotPassword, 
  formatPasswordResetErrors 
} from '@/lib/validations/auth/password-reset'

// ==============================================
// POST /api/auth/forgot-password - Request Password Reset
// ==============================================
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    
    // Validate input
    const validation = validateForgotPassword(body)
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

    const { email } = validation.data

    // Create service instance
    const authDatabaseService = new AuthDatabaseService(true, false)

    // Find user by email
    const user = await authDatabaseService.getUserByEmail(email)
    
    // For security, always return success even if user doesn't exist
    if (!user) {
      return NextResponse.json(
        {
          success: true,
          message: 'If an account with this email exists, a password reset link has been sent.',
          data: {
            emailSent: true, // We say true for security, but actually didn't send
          },
        },
        { status: 200 }
      )
    }

    // Check if email is verified
    if (!user.email_verified) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email not verified',
          message: 'Please verify your email address before requesting a password reset.',
          actions: {
            resendVerification: `/api/auth/resend-verification`,
          },
        },
        { status: 403 }
      )
    }

    // Check rate limiting - get password reset stats
    const stats = await authDatabaseService.getPasswordResetStats(user.id)
    
    // Rate limiting: max 3 password reset requests per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentRequests = stats.total // You might want to implement more sophisticated rate limiting
    
    if (recentRequests >= 5) { // Max 5 password reset requests total
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          message: 'Too many password reset requests have been sent. Please wait before requesting another one.',
        },
        { status: 429 }
      )
    }

    // Invalidate existing password reset tokens for this user
    await authDatabaseService.invalidateUserPasswordResetTokens(user.id)

    // Generate new password reset token
    const resetToken = generatePasswordResetToken()
    const resetUrl = generatePasswordResetUrl(resetToken)
    
    // Save password reset token to database
    const tokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    await authDatabaseService.createPasswordReset({
      userId: user.id,
      token: resetToken,
      expiresAt: tokenExpiresAt,
    })

    // Send password reset email
    const emailResult = await authEmailService.sendPasswordResetEmail({
      email: user.email,
      firstName: user.first_name,
      resetUrl,
    })

    // Log email result but don't fail if email fails
    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error)
    }

    // Return success response (don't reveal too much about the user)
    return NextResponse.json(
      {
        success: true,
        message: 'Password reset email sent successfully',
        data: {
          emailSent: emailResult.success,
          expiresAt: tokenExpiresAt.toISOString(),
        },
        notifications: {
          message: emailResult.success
            ? 'A password reset link has been sent to your email. Please check your inbox and follow the instructions.'
            : 'We attempted to send a password reset email, but there was an issue. Please try again later.',
        },
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Forgot password error:', error)

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong while processing your password reset request. Please try again.',
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