// ==============================================
// src/app/api/auth/logout/route.ts - Logout API
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import { AuthDatabaseService } from '@/lib/database/services'

export async function POST(request: NextRequest) {
  try {
    // Get session token from HTTP-only cookie
    const sessionToken = request.cookies.get('sessionToken')?.value

    if (sessionToken) {
      try {
        // Invalidate session in database
        const authService = new AuthDatabaseService(true, false)
        await authService.invalidateUserSession(sessionToken)
      } catch (dbError) {
        // Log but don't fail logout if database error occurs
        console.error('Database session invalidation error:', dbError)
      }
    }

    // Create success response
    const response = NextResponse.json(
      {
        success: true,
        message: 'Logged out successfully',
      },
      { status: 200 }
    )

    // Clear HTTP-only cookies
    response.cookies.set('sessionToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Immediately expire
      path: '/',
    })

    response.cookies.set('userInfo', '', {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Immediately expire
      path: '/',
    })

    return response

  } catch (error) {
    console.error('Logout error:', error)
    
    // Even if there's an error, still clear cookies and return success
    // from the client's perspective, they should be logged out
    const response = NextResponse.json(
      {
        success: true,
        message: 'Logged out successfully',
      },
      { status: 200 }
    )

    // Clear cookies regardless of error
    response.cookies.set('sessionToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    })

    response.cookies.set('userInfo', '', {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    })

    return response
  }
}

// Only allow POST method
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