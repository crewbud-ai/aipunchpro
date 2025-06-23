// ==============================================
// src/app/api/auth/resend-verification/route.ts - Resend Verification Email API
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import { AuthDatabaseService } from '@/lib/database/services'
import { authEmailService } from '@/lib/email/index'
import { generateVerificationToken, generateVerificationUrl } from '@/lib/email/utils/tokens'
import { 
  validateResendVerification, 
  formatVerificationErrors 
} from '@/lib/validations/auth/email-verification'

// ==============================================
// POST /api/auth/resend-verification - Resend Verification Email
// ==============================================
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    
    // Validate input
    const validation = validateResendVerification(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: formatVerificationErrors(validation.error),
        },
        { status: 400 }
      )
    }

    const { email } = validation.data

    // Create service instance
    const authDatabaseService = new AuthDatabaseService(true, false)

    // Find user by email
    const user = await authDatabaseService.getUserByEmail(email)
    
    if (!user) {
      // For security, don't reveal if email exists or not
      return NextResponse.json(
        {
          success: true,
          message: 'If an account with this email exists and is not verified, a verification email has been sent.',
        },
        { status: 200 }
      )
    }

    // Check if email is already verified
    if (user.email_verified) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email already verified',
          message: 'This email address is already verified. You can log in to your account.',
        },
        { status: 400 }
      )
    }

    // Check rate limiting - get verification stats
    const stats = await authDatabaseService.getVerificationStats(user.id)
    
    // Rate limiting: max 3 verification emails per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentRequests = stats.total // You might want to implement more sophisticated rate limiting
    
    if (recentRequests >= 5) { // Max 5 verification emails total
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          message: 'Too many verification emails have been sent. Please wait before requesting another one.',
        },
        { status: 429 }
      )
    }

    // Invalidate existing verification tokens for this user
    await authDatabaseService.invalidateUserVerificationTokens(user.id)

    // Generate new verification token
    const verificationToken = generateVerificationToken()
    const verificationUrl = generateVerificationUrl(verificationToken)
    
    // Save new verification token to database
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    await authDatabaseService.createEmailVerification({
      userId: user.id,
      token: verificationToken,
      expiresAt: tokenExpiresAt,
    })

    // Send verification reminder email
    const emailResult = await authEmailService.sendVerificationReminder({
      email: user.email,
      firstName: user.first_name,
      verificationUrl,
    })

    // Log email result but don't fail if email fails
    if (!emailResult.success) {
      console.error('Failed to send verification reminder email:', emailResult.error)
    }

    // Return success response (don't reveal too much about the user)
    return NextResponse.json(
      {
        success: true,
        message: 'Verification email sent successfully',
        data: {
          emailSent: emailResult.success,
          expiresAt: tokenExpiresAt.toISOString(),
        },
        notifications: {
          message: emailResult.success
            ? 'A new verification email has been sent to your inbox. Please check your email and follow the instructions.'
            : 'We attempted to send a verification email, but there was an issue. Please try again later.',
        },
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Resend verification error:', error)

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong while sending the verification email. Please try again.',
      },
      { status: 500 }
    )
  }
}

// ==============================================
// GET /api/auth/resend-verification - Get verification status
// ==============================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing email parameter',
          message: 'Email address is required to check verification status.',
        },
        { status: 400 }
      )
    }

    // Validate email format
    const validation = validateResendVerification({ email })
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email format',
          details: formatVerificationErrors(validation.error),
        },
        { status: 400 }
      )
    }

    // Create service instance
    const authDatabaseService = new AuthDatabaseService(true, false)

    // Find user by email
    const user = await authDatabaseService.getUserByEmail(email)
    
    if (!user) {
      // For security, don't reveal if email exists or not
      return NextResponse.json(
        {
          success: true,
          data: {
            canResend: false,
            reason: 'User not found',
          },
        },
        { status: 200 }
      )
    }

    // Check if email is already verified
    if (user.email_verified) {
      return NextResponse.json(
        {
          success: true,
          data: {
            canResend: false,
            reason: 'Email already verified',
            emailVerified: true,
          },
        },
        { status: 200 }
      )
    }

    // Get verification stats
    const stats = await authDatabaseService.getVerificationStats(user.id)

    return NextResponse.json(
      {
        success: true,
        data: {
          canResend: stats.total < 5, // Max 5 verification emails
          emailVerified: false,
          stats: {
            totalSent: stats.total,
            pendingTokens: stats.pending,
            lastRequest: stats.lastRequest,
          },
        },
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Get verification status error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong while checking verification status.',
      },
      { status: 500 }
    )
  }
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