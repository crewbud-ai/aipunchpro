// ==============================================
// src/app/api/auth/verify-reset-token/route.ts - Verify Reset Token API
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import { AuthDatabaseService } from '@/lib/database/services'
import { 
  validateVerifyResetToken, 
  validateResetUrlParams,
  formatPasswordResetErrors 
} from '@/lib/validations/auth/password-reset'

// ==============================================
// POST /api/auth/verify-reset-token - Verify Reset Token
// ==============================================
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    
    // Validate input
    const validation = validateVerifyResetToken(body)
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

    const { token, email } = validation.data

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

    // Additional security: check email if provided
    if (email && resetData.user.email !== email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Token mismatch',
          message: 'The reset token does not match the provided email address.',
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

    // Token is valid - return success with user info for the reset form
    return NextResponse.json(
      {
        success: true,
        message: 'Reset token is valid',
        data: {
          token: token, // Return token for the password reset form
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
          },
          tokenExpiry: resetData.expires_at,
        },
        notifications: {
          message: 'Token verified successfully. You can now reset your password.',
        },
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Verify reset token error:', error)

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
        message: 'Something went wrong during token verification. Please try again.',
      },
      { status: 500 }
    )
  }
}

// ==============================================
// GET /api/auth/verify-reset-token - Verify via URL params (for email clicks)
// ==============================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const email = searchParams.get('email') // Optional

    // Validate URL parameters
    const validation = validateResetUrlParams({ 
      token, 
      ...(email && { email }) 
    })
    
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid URL parameters',
          details: formatPasswordResetErrors(validation.error),
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
    console.error('GET verify reset token error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong during token verification.',
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