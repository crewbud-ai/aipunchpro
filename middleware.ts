// ==============================================
// src/middleware.ts - Cookie-Based Authentication Middleware with User Data Logging
// ==============================================

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AuthDatabaseService } from '@/lib/database/services'

// Protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/settings',
  '/api/user',
  '/api/company',
  '/api/projects', // Add projects API protection
  '/api/protected', // Add any other protected API routes
]

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/auth/verify-email',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/contact',
  '/about',
  '/api/auth', // All auth API routes are public
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files and specific API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname.startsWith('/api/auth/') // Skip auth API routes
  ) {
    return NextResponse.next()
  }

  // Get session token from HTTP-only cookie
  const sessionToken = request.cookies.get('sessionToken')?.value

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  )

  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(route)
  )

  // If it's a protected route and no token, redirect to login
  if (isProtectedRoute && !sessionToken) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If user has token, validate session against database
  if (sessionToken) {
    try {
      const authService = new AuthDatabaseService(true, false)
      const sessionValidation = await authService.validateSession(sessionToken)

      if (!sessionValidation.success) {
        console.log('Invalid session:', sessionValidation.error)

        // Invalid session - clear cookies
        const response = isProtectedRoute
          ? NextResponse.redirect(new URL('/auth/login', request.url))
          : NextResponse.next()

        response.cookies.delete('sessionToken')
        response.cookies.delete('userInfo')
        return response
      }

      // Valid session - add info to request headers
      if (sessionValidation.data) {
        const requestHeaders = new Headers(request.headers)
        requestHeaders.set('x-user-id', sessionValidation.data.userId)
        requestHeaders.set('x-session-id', sessionValidation.data.sessionId)

        // Extract user info from session data
        if (sessionValidation.data.user?.role) {
          requestHeaders.set('x-user-role', sessionValidation.data.user.role)
        }

        // Find this section and make sure you have the permissions header
        if (sessionValidation.data.user?.permissions) {
          requestHeaders.set('x-user-permissions', JSON.stringify(sessionValidation.data.user.permissions))
        }

        if (sessionValidation.data.user?.email) {
          requestHeaders.set('x-user-email', sessionValidation.data.user.email)
        }

        // IMPORTANT: Add company ID to headers for project APIs
        if (sessionValidation.data.user?.company?.id) {
          requestHeaders.set('x-company-id', sessionValidation.data.user.company.id)
        }

        // Add user name for convenience
        if (sessionValidation.data.user?.first_name && sessionValidation.data.user?.last_name) {
          requestHeaders.set('x-user-name', `${sessionValidation.data.user.first_name} ${sessionValidation.data.user.last_name}`)
        }

        // 🔐 ADD PERMISSIONS TO HEADERS (for permission checking in API routes)
        if (sessionValidation.data.user?.permissions) {
          let permissionsString = sessionValidation.data.user.permissions
          if (typeof permissionsString === 'object') {
            permissionsString = JSON.stringify(permissionsString)
          }
          requestHeaders.set('x-user-permissions', permissionsString)
        }

        // If authenticated user tries to access auth pages, redirect to dashboard
        if (pathname.startsWith('/auth/') && !pathname.includes('logout')) {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }

        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        })
      }

    } catch (error) {
      console.error('Session validation error in middleware:', error)

      // On error, clear cookies and continue
      const response = isProtectedRoute
        ? NextResponse.redirect(new URL('/auth/login', request.url))
        : NextResponse.next()

      response.cookies.delete('sessionToken')
      response.cookies.delete('userInfo')
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}