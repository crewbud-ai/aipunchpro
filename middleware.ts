// // ==============================================
// // src/middleware.ts - Cookie-Based Authentication Middleware with User Data Logging
// // ==============================================

// import { NextResponse } from 'next/server'
// import type { NextRequest } from 'next/server'
// import { AuthDatabaseService } from '@/lib/database/services'

// // Protected routes that require authentication
// const protectedRoutes = [
//   // Dashboard routes
//   '/dashboard',
//   '/profile',
//   '/settings',

//   // API routes that require authentication
//   '/api/user',
//   '/api/company',
//   '/api/projects',
//   '/api/team-members',
//   '/api/schedule-projects',    // ← NEW: Schedule projects API
//   '/api/punchlist-items',      // ← NEW: Punchlist items API
//   '/api/protected',

//   // Additional API endpoints that might exist
//   '/api/files',
//   '/api/reports',
//   '/api/notifications',
//   '/api/stats',
// ]

// // Public routes that don't require authentication
// const publicRoutes = [
//   '/',
//   '/auth/login',
//   '/auth/signup',
//   '/auth/verify-email',
//   '/auth/forgot-password',
//   '/auth/reset-password',
//   '/contact',
//   '/about',
//   '/api/auth', // All auth API routes are public
//   '/api/health', // Health check endpoint (if exists)
//   '/api/status', // Status endpoint (if exists)
// ]

// export async function middleware(request: NextRequest) {
//   const { pathname } = request.nextUrl

//   // Skip middleware for static files and specific API routes
//   if (
//     pathname.startsWith('/_next') ||
//     pathname.startsWith('/static') ||
//     pathname.includes('.') ||
//     pathname.startsWith('/api/auth/') // Skip auth API routes
//   ) {
//     return NextResponse.next()
//   }

//   // Get session token from HTTP-only cookie
//   const sessionToken = request.cookies.get('sessionToken')?.value

//   // Check if route requires authentication
//   const isProtectedRoute = protectedRoutes.some(route =>
//     pathname.startsWith(route)
//   )

//   const isPublicRoute = publicRoutes.some(route =>
//     pathname === route || pathname.startsWith(route)
//   )

//   // If it's a protected route and no token, redirect to login
//   if (isProtectedRoute && !sessionToken) {
//     const loginUrl = new URL('/auth/login', request.url)
//     loginUrl.searchParams.set('redirect', pathname)
//     return NextResponse.redirect(loginUrl)
//   }

//   // If user has token, validate session against database
//   if (sessionToken) {
//     try {
//       const authService = new AuthDatabaseService(true, false)
//       const sessionValidation = await authService.validateSession(sessionToken)

//       if (!sessionValidation.success) {
//         console.log('Invalid session:', sessionValidation.error)

//         // Invalid session - clear cookies
//         const response = isProtectedRoute
//           ? NextResponse.redirect(new URL('/auth/login', request.url))
//           : NextResponse.next()

//         response.cookies.delete('sessionToken')
//         response.cookies.delete('userInfo')
//         return response
//       }

//       // Valid session - add info to request headers
//       if (sessionValidation.data) {
//         const requestHeaders = new Headers(request.headers)
//         requestHeaders.set('x-user-id', sessionValidation.data.userId)
//         requestHeaders.set('x-session-id', sessionValidation.data.sessionId)

//         // Extract user info from session data
//         if (sessionValidation.data.user?.role) {
//           requestHeaders.set('x-user-role', sessionValidation.data.user.role)
//         }

//         // IMPORTANT: Add company ID to headers for all protected APIs
//         if (sessionValidation.data.user?.company?.id) {
//           requestHeaders.set('x-company-id', sessionValidation.data.user.company.id)
//         }

//         if (sessionValidation.data.user?.email) {
//           requestHeaders.set('x-user-email', sessionValidation.data.user.email)
//         }

//         // Add user name for convenience
//         if (sessionValidation.data.user?.first_name && sessionValidation.data.user?.last_name) {
//           requestHeaders.set('x-user-name', `${sessionValidation.data.user.first_name} ${sessionValidation.data.user.last_name}`)
//         }

//         // 🔐 ADD PERMISSIONS TO HEADERS (for permission checking in API routes)
//         if (sessionValidation.data.user?.permissions) {
//           let permissionsString = sessionValidation.data.user.permissions
//           if (typeof permissionsString === 'object') {
//             permissionsString = JSON.stringify(permissionsString)
//           }
//           requestHeaders.set('x-user-permissions', permissionsString)
//         }

//         // If authenticated user tries to access auth pages, redirect to dashboard
//         if (pathname.startsWith('/auth/') && !pathname.includes('logout')) {
//           return NextResponse.redirect(new URL('/dashboard', request.url))
//         }

//         return NextResponse.next({
//           request: {
//             headers: requestHeaders,
//           },
//         })
//       }

//     } catch (error) {
//       console.error('Session validation error in middleware:', error)

//       // On error, clear cookies and continue
//       const response = isProtectedRoute
//         ? NextResponse.redirect(new URL('/auth/login', request.url))
//         : NextResponse.next()

//       response.cookies.delete('sessionToken')
//       response.cookies.delete('userInfo')
//       return response
//     }
//   }

//   return NextResponse.next()
// }

// export const config = {
//   matcher: [
//     /*
//      * Match all request paths except for the ones starting with:
//      * - _next/static (static files)
//      * - _next/image (image optimization files)
//      * - favicon.ico (favicon file)
//      */
//     '/((?!_next/static|_next/image|favicon.ico).*)',
//   ],
// }

// ==============================================
// COMPLETE VERSION with Status Coordination + All Previous Functionality
// ==============================================

// ==============================================
// middleware.ts - Clean & Optimized Authentication Middleware
// ==============================================

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AuthDatabaseService } from '@/lib/database/services'

// ==============================================
// ROUTE CONFIGURATION
// ==============================================

// Protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/settings',
  '/api/user',
  '/api/company',
  '/api/projects',
  '/api/team-members',
  '/api/schedule-projects',
  '/api/punchlist-items',
  '/api/protected',
  '/api/time-entries',
  '/api/files',
  '/api/reports',
  '/api/notifications',
  '/api/stats',
  '/api/projects/*/status-coordinated',
  '/api/schedule-projects/*/status-coordinated',
  '/api/team-members/*/deactivate-coordinated',
  '/api/team-members/*/reactivate-coordinated',
  '/api/team-members/reassign-work',
  '/api/team-members/*/replacement-suggestions',
  '/api/projects/*/validate-status-change',
  '/api/schedule-projects/*/validate-dependencies',
  '/api/schedule-projects/*/completion-readiness',
  '/api/projects/*/status-summary',
  '/api/projects/bulk-status-update',
  '/api/schedule-projects/bulk-status-update',
  '/api/team-members/bulk-deactivate',
  '/api/team-members/bulk-role-change',
  '/api/coordination/status-sync',
  '/api/coordination/validate-consistency',
  '/api/coordination/impact-analysis',
]

// Admin-only routes
const adminOnlyRoutes = [
  '/dashboard/admin',
  '/dashboard/payroll',
  '/dashboard/team',
  '/dashboard/settings',
  '/api/team-members/stats',
  '/api/projects/stats',
  '/api/time-entries/*/approve',
  '/api/time-entries/*/reject',
]

// Member-only routes (admins redirected away)
const memberOnlyRoutes = [
  '/dashboard/member',
  '/dashboard/time-tracking',
]

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/auth/verify-email',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/change-password',
  '/contact',
  '/about',
  '/api/auth',
  '/api/health',
  '/api/status',
]

// Routes that bypass authentication check
const bypassRoutes = [
  '/_next',
  '/static',
  '/api/auth/',
]

// ==============================================
// HELPER FUNCTIONS
// ==============================================

/**
 * Check if path matches pattern (supports wildcards)
 */
function matchesPattern(pathname: string, pattern: string): boolean {
  if (pattern.includes('*')) {
    const regexPattern = pattern.replace(/\*/g, '[^/]+')
    const regex = new RegExp(`^${regexPattern}$`)
    return regex.test(pathname)
  }
  return pathname.startsWith(pattern)
}

/**
 * Check if route should bypass middleware
 */
function shouldBypass(pathname: string): boolean {
  return (
    bypassRoutes.some(route => pathname.startsWith(route)) ||
    pathname.includes('.')
  )
}

/**
 * Check if user is admin
 */
function isAdmin(role: string): boolean {
  return role === 'super_admin' || role === 'admin'
}

/**
 * Validate session with timeout protection
 */
async function validateSessionWithTimeout(
  authService: AuthDatabaseService,
  sessionToken: string,
  timeoutMs: number = 3000
): Promise<{ success: boolean; error: string | null; data: any }> {
  return Promise.race([
    authService.validateSession(sessionToken),
    new Promise<{ success: false; error: string; data: null }>((resolve) =>
      setTimeout(
        () => resolve({ success: false, error: 'TIMEOUT', data: null }),
        timeoutMs
      )
    ),
  ])
}

/**
 * Clear session cookies
 */
function clearSessionCookies(response: NextResponse): NextResponse {
  response.cookies.delete('sessionToken')
  response.cookies.delete('userInfo')
  return response
}

/**
 * Redirect to login with redirect parameter
 */
function redirectToLogin(request: NextRequest, pathname: string): NextResponse {
  const loginUrl = new URL('/auth/login', request.url)
  loginUrl.searchParams.set('redirect', pathname)
  return NextResponse.redirect(loginUrl)
}

// ==============================================
// MAIN MIDDLEWARE
// ==============================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files and auth routes
  if (shouldBypass(pathname)) {
    return NextResponse.next()
  }

  // Get session token
  const sessionToken = request.cookies.get('sessionToken')?.value

  // Check route types
  const isProtectedRoute = protectedRoutes.some(route => matchesPattern(pathname, route))
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route))
  const isAdminRoute = adminOnlyRoutes.some(route => matchesPattern(pathname, route))
  const isMemberRoute = memberOnlyRoutes.some(route => matchesPattern(pathname, route))

  // If protected route and no token, redirect to login
  if (isProtectedRoute && !sessionToken) {
    return redirectToLogin(request, pathname)
  }

  // If no token, allow public routes
  if (!sessionToken) {
    return NextResponse.next()
  }

  // ==============================================
  // SESSION VALIDATION
  // ==============================================

  try {
    const authService = new AuthDatabaseService(true, false)
    const sessionValidation = await validateSessionWithTimeout(authService, sessionToken, 3000)

    // Handle timeout
    if (sessionValidation.error === 'TIMEOUT') {
      console.error('Session validation timeout - allowing request to proceed')
      const response = NextResponse.next()
      response.headers.set('X-Session-Warning', 'validation-timeout')
      return response
    }

    // Handle invalid session
    if (!sessionValidation.success || !sessionValidation.data) {
      console.log('Invalid session:', sessionValidation.error)

      if (isProtectedRoute) {
        const response = redirectToLogin(request, pathname)
        return clearSessionCookies(response)
      }

      const response = NextResponse.next()
      return clearSessionCookies(response)
    }

    // Extract user data
    const { user } = sessionValidation.data
    const userRole = user?.role
    const requiresPasswordChange = user?.requires_password_change || false

    // ==============================================
    // PASSWORD CHANGE ENFORCEMENT
    // ==============================================

    if (
      requiresPasswordChange &&
      pathname !== '/auth/change-password' &&
      pathname !== '/api/user/change-password' &&
      pathname !== '/api/auth/logout'
    ) {
      console.log(`Redirecting user ${user.id} to change password`)
      return NextResponse.redirect(new URL('/auth/change-password', request.url))
    }

    if (!requiresPasswordChange && pathname === '/auth/change-password') {
      console.log(`User ${user.id} already changed password, redirecting to dashboard`)
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // ==============================================
    // ROLE-BASED ACCESS CONTROL
    // ==============================================

    // Block non-admins from admin routes
    if (isAdminRoute && userRole && !isAdmin(userRole)) {
      console.log(`Non-admin (${userRole}) blocked from: ${pathname}`)
      return NextResponse.redirect(new URL('/dashboard/member', request.url))
    }

    // Redirect admins away from member routes
    if (isMemberRoute && userRole && isAdmin(userRole)) {
      console.log(`Admin blocked from member route: ${pathname}`)
      return NextResponse.redirect(new URL('/dashboard/admin', request.url))
    }

    // ==============================================
    // REDIRECT AUTHENTICATED USERS FROM AUTH PAGES
    // ==============================================

    if (
      pathname.startsWith('/auth/') &&
      pathname !== '/auth/change-password' &&
      !pathname.includes('logout')
    ) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // ==============================================
    // ADD USER CONTEXT TO HEADERS
    // ==============================================

    const requestHeaders = new Headers(request.headers)

    // Session info
    requestHeaders.set('x-user-id', sessionValidation.data.userId || user?.id)
    requestHeaders.set('x-session-id', sessionValidation.data.sessionId)

    // User info
    if (user) {
      // Company ID
      const companyId = user.company_id || user.company?.id
      if (companyId) {
        requestHeaders.set('x-company-id', companyId)
      }

      // Basic user data
      if (user.role) requestHeaders.set('x-user-role', user.role)
      if (user.email) requestHeaders.set('x-user-email', user.email)
      
      // Full name for audit trails
      if (user.first_name && user.last_name) {
        requestHeaders.set('x-user-name', `${user.first_name} ${user.last_name}`)
      }

      // Password change status
      requestHeaders.set('x-requires-password-change', requiresPasswordChange ? 'true' : 'false')

      // Permissions (for coordinated operations)
      if (user.permissions) {
        const permissionsString = typeof user.permissions === 'object'
          ? JSON.stringify(user.permissions)
          : user.permissions
        requestHeaders.set('x-user-permissions', permissionsString)
      }
    }

    // Return response with updated headers
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })

  } catch (error) {
    console.error('Session validation error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      pathname,
    })

    // On error, redirect to login if protected route
    if (isProtectedRoute) {
      const response = redirectToLogin(request, pathname)
      return clearSessionCookies(response)
    }

    return NextResponse.next()
  }
}

// ==============================================
// MIDDLEWARE CONFIG
// ==============================================

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ],
}

// ==============================================
// UTILITY FUNCTIONS FOR API ROUTES
// ==============================================

/**
 * Get coordination context from request headers
 */
export function getCoordinationContext(request: NextRequest) {
  return {
    userId: request.headers.get('x-user-id'),
    companyId: request.headers.get('x-company-id'),
    userRole: request.headers.get('x-user-role'),
    userName: request.headers.get('x-user-name'),
    userEmail: request.headers.get('x-user-email'),
    sessionId: request.headers.get('x-session-id'),
    permissions: (() => {
      try {
        const permissionsStr = request.headers.get('x-user-permissions')
        return permissionsStr ? JSON.parse(permissionsStr) : null
      } catch {
        return null
      }
    })(),
  }
}

/**
 * Get user context from request headers
 */
export function getUserContext(request: NextRequest) {
  return {
    userId: request.headers.get('x-user-id'),
    companyId: request.headers.get('x-company-id'),
    userRole: request.headers.get('x-user-role'),
    userEmail: request.headers.get('x-user-email'),
    userName: request.headers.get('x-user-name'),
    sessionId: request.headers.get('x-session-id'),
  }
}

/**
 * Check if user has permission for coordinated operations
 */
export function hasCoordinationPermission(
  request: NextRequest,
  requiredPermission: {
    category: string
    permission: string
  }
): boolean {
  try {
    const permissionsStr = request.headers.get('x-user-permissions')
    if (!permissionsStr) return false

    const permissions = JSON.parse(permissionsStr)
    return permissions[requiredPermission.category]?.[requiredPermission.permission] === true
  } catch {
    return false
  }
}

/**
 * Check if user has required role
 */
export function hasRequiredRole(
  request: NextRequest,
  requiredRoles: string[]
): boolean {
  const userRole = request.headers.get('x-user-role')
  return userRole ? requiredRoles.includes(userRole) : false
}

/**
 * Create audit trail entry for coordinated operations
 */
export function createCoordinationAuditEntry(
  request: NextRequest,
  operation: string,
  entityType: string,
  entityId: string,
  details?: any
) {
  const context = getCoordinationContext(request)

  return {
    userId: context.userId,
    companyId: context.companyId,
    operation,
    entityType,
    entityId,
    userRole: context.userRole,
    userName: context.userName,
    sessionId: context.sessionId,
    timestamp: new Date().toISOString(),
    details: details || {},
    source: 'coordination_middleware',
  }
}