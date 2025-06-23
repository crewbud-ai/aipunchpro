// ==============================================
// src/app/api/auth/verify-email/route.ts - Email Verification API
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import { AuthDatabaseService } from '@/lib/database/services'
import { authEmailService } from '@/lib/email/index'
import { 
  validateEmailVerification, 
  validateVerificationUrlParams,
  formatVerificationErrors 
} from '@/lib/validations/auth/email-verification'

// ==============================================
// POST /api/auth/verify-email - Verify Email Token
// ==============================================
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    
    // Validate input
    const validation = validateEmailVerification(body)
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

    const { token, userId } = validation.data

    // Create service instance
    const authDatabaseService = new AuthDatabaseService(true, false)

    // Find the verification token with user data
    const verification = await authDatabaseService.findValidVerificationToken(token)
    
    console.log(verification, 'verification')

    if (!verification) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired verification token',
          message: 'The verification link is invalid or has expired. Please request a new verification email.',
        },
        { status: 400 }
      )
    }

    // Additional security: check userId if provided
    if (userId && verification.user_id !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Token mismatch',
          message: 'The verification token does not match the user.',
        },
        { status: 400 }
      )
    }

    const user = verification.user

    // Check if email is already verified
    if (user.email_verified) {
      return NextResponse.json(
        {
          success: true,
          message: 'Email already verified',
          data: {
            user: {
              id: user.id,
              email: user.email,
              firstName: user.first_name,
              lastName: user.last_name,
              emailVerified: true,
            },
          },
          notifications: {
            message: 'Your email is already verified. You can continue using your account.',
          },
        },
        { status: 200 }
      )
    }

    // Verify the email (updates user and marks token as used)
    await authDatabaseService.verifyUserEmail(verification.user_id, token)

    // Send congratulations email
    const emailResult = await authEmailService.sendEmailVerificationSuccess({
      email: user.email,
      firstName: user.first_name,
    })

    // Log email result but don't fail verification if email fails
    if (!emailResult.success) {
      console.error('Failed to send verification success email:', emailResult.error)
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Email verified successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            emailVerified: true,
          },
          verification: {
            verifiedAt: new Date().toISOString(),
          },
          emailSent: emailResult.success,
        },
        notifications: {
          message: '🎉 Congratulations! Your email has been verified successfully. Your account is now fully activated.',
          confirmationEmailSent: emailResult.success
            ? 'A confirmation email has been sent to your inbox.'
            : 'Verification successful, but we had trouble sending the confirmation email.',
        },
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Email verification error:', error)

    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('Token not found') || error.message.includes('expired')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid verification token',
            message: 'The verification link is invalid or has expired.',
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
        message: 'Something went wrong during email verification. Please try again.',
      },
      { status: 500 }
    )
  }
}

// ==============================================
// GET /api/auth/verify-email - Verify via URL params (for email clicks)
// ==============================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const userId = searchParams.get('userId') // Optional

    // Validate URL parameters
    const validation = validateVerificationUrlParams({ 
      token, 
      ...(userId && { userId }) 
    })
    
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid URL parameters',
          details: formatVerificationErrors(validation.error),
        },
        { status: 400 }
      )
    }

    // Use the same logic as POST but with URL params
    const body = validation.data
    
    // Create a new request with the body for reuse
    const postRequest = new NextRequest(request.url, {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify(body),
    })

    return await POST(postRequest)

  } catch (error) {
    console.error('GET email verification error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong during email verification.',
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