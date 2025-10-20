// ==============================================
// src/app/api/auth/login/route.ts - Enhanced Login API with Cookies
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { AuthDatabaseService } from '@/lib/database/services'
import { 
  validateLogin, 
  formatLoginErrors 
} from '@/lib/validations/auth/login'
import { createUserSession } from '@/utils/auth-helpers'

// ==============================================
// POST /api/auth/login - User Login
// ==============================================
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    
    // Validate input
    const validation = validateLogin(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: formatLoginErrors(validation.error),
        },
        { status: 400 }
      )
    }

    const { email, password, rememberMe } = validation.data

    // Create service instance
    const authDatabaseService = new AuthDatabaseService(true, false)

    console.log(authDatabaseService, 'authDatabaseService')

    // Authenticate user
    const authResult = await authDatabaseService.authenticateUser(email, password)
    
    console.log(authResult, 'authResult')

    if (!authResult.success) {
      // Handle different authentication errors
      switch (authResult.error) {
        case 'INVALID_CREDENTIALS':
          return NextResponse.json(
            {
              success: false,
              error: 'Invalid credentials',
              message: 'The email or password you entered is incorrect.',
            },
            { status: 401 }
          )
          
        case 'EMAIL_NOT_VERIFIED':
          return NextResponse.json(
            {
              success: false,
              error: 'Email not verified',
              message: 'Please verify your email address before logging in.',
              data: {
                user: {
                  id: authResult.user?.id,
                  email: authResult.user?.email,
                  emailVerified: false,
                },
              },
              actions: {
                resendVerification: `/api/auth/resend-verification`,
              },
            },
            { status: 403 }
          )
          
        case 'NO_PASSWORD_SET':
          return NextResponse.json(
            {
              success: false,
              error: 'Password not set',
              message: 'This account was created without a password. Please reset your password to continue.',
              actions: {
                resetPassword: `/api/auth/forgot-password`,
              },
            },
            { status: 403 }
          )
          
        default:
          return NextResponse.json(
            {
              success: false,
              error: 'Authentication failed',
              message: 'Unable to authenticate. Please try again.',
            },
            { status: 401 }
          )
      }
    }

    const user = authResult.user!

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

    // Create user session (your existing database session)
    const session = await createUserSession(
      user.id, 
      request, 
      authDatabaseService, 
      rememberMe
    )

    // Update last login timestamp
    await authDatabaseService.updateUserLastLogin(user.id)

    // Create response with data
    const responseData = {
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          permissions: user.permissions,
          phone: user.phone,
          emailVerified: user.email_verified,
          lastLoginAt: new Date().toISOString(),
        },
        company: {
          id: company.id,
          name: company.name,
          slug: company.slug,
          industry: company.industry,
          size: company.size,
        },
        // Keep session in response for backwards compatibility
        session: {
          token: session.token,
          expiresAt: session.expiresAt,
          rememberMe: rememberMe,
        },
      },
      notifications: {
        message: `Welcome back, ${user.first_name}!`,
      },
    }

    const response = NextResponse.json(responseData, { status: 200 })

    // SET HTTP-ONLY COOKIES (Enhanced Security)
    const cookieOptions = {
      httpOnly: true,           // Cannot be accessed via JavaScript (XSS protection)
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict' as const, // CSRF protection
      maxAge: rememberMe 
        ? 30 * 24 * 60 * 60     // 30 days if remember me
        : 24 * 60 * 60,         // 24 hours otherwise
      path: '/',                // Available site-wide
    }

    // Set the session token as HTTP-only cookie
    response.cookies.set('sessionToken', session.token, cookieOptions)
    
    // Optional: Set user info cookie (non-sensitive data) for client-side access
    response.cookies.set('userInfo', JSON.stringify({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      permissions: user.permissions,
      companyId: company.id,
      companyName: company.name,
    }), {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: cookieOptions.maxAge,
      path: '/',
      // Not httpOnly so client can read user info if needed
    })

    return response

  } catch (error) {
    console.error('Login error:', error)

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
        message: 'Something went wrong during login. Please try again.',
      },
      { status: 500 }
    )
  }
}

// ==============================================
// HELPER FUNCTIONS (Your existing functions)
// ==============================================

// async function createUserSession(
//   userId: string, 
//   request: NextRequest, 
//   authDatabaseService: AuthDatabaseService,
//   rememberMe: boolean = false
// ) {
//   // Get client IP and User-Agent
//   const headersList = headers()
//   const userAgent = headersList.get('user-agent') || ''
//   const forwarded = headersList.get('x-forwarded-for')
//   const realIp = headersList.get('x-real-ip')
//   const ipAddress = forwarded?.split(',')[0] || realIp || '127.0.0.1'

//   // Generate session token
//   const token = generateSessionToken()
  
//   // Set session duration based on rememberMe
//   const sessionDuration = rememberMe 
//     ? 30 * 24 * 60 * 60 * 1000  // 30 days
//     : 24 * 60 * 60 * 1000       // 24 hours
    
//   const expiresAt = new Date(Date.now() + sessionDuration)

//   // Save session to database (your existing method)
//   await authDatabaseService.createUserSession({
//     userId,
//     token,
//     ipAddress,
//     userAgent,
//     expiresAt,
//   })

//   return {
//     token,
//     expiresAt: expiresAt.toISOString(),
//   }
// }

function generateSessionToken(): string {
  // Generate a secure random token
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
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