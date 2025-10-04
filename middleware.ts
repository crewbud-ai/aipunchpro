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
// middleware.ts - COMPLETE VERSION with Status Coordination + All Previous Functionality
// ==============================================

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AuthDatabaseService } from '@/lib/database/services'

// Protected routes that require authentication - UPDATED with new coordinated routes
const protectedRoutes = [
  // Dashboard routes
  '/dashboard',
  '/profile',
  '/settings',

  // API routes that require authentication
  '/api/user',
  '/api/company',

  // Original API routes
  '/api/projects',
  '/api/team-members',
  '/api/schedule-projects',
  '/api/punchlist-items',
  '/api/protected',
  '/api/time-entries',

  // Additional API endpoints
  '/api/files',
  '/api/reports',
  '/api/notifications',
  '/api/stats',

  // NEW: Coordinated status management routes
  '/api/projects/*/status-coordinated',
  '/api/schedule-projects/*/status-coordinated',
  '/api/team-members/*/deactivate-coordinated',
  '/api/team-members/*/reactivate-coordinated',
  '/api/team-members/reassign-work',
  '/api/team-members/*/replacement-suggestions',

  // NEW: Status validation and analysis routes
  '/api/projects/*/validate-status-change',
  '/api/schedule-projects/*/validate-dependencies',
  '/api/schedule-projects/*/completion-readiness',
  '/api/projects/*/status-summary',

  // NEW: Bulk operations routes
  '/api/projects/bulk-status-update',
  '/api/schedule-projects/bulk-status-update',
  '/api/team-members/bulk-deactivate',
  '/api/team-members/bulk-role-change',

  // NEW: Cross-module coordination routes
  '/api/coordination/status-sync',
  '/api/coordination/validate-consistency',
  '/api/coordination/impact-analysis',
]

// ==============================================
// ADMIN-ONLY ROUTES (New Feature)
// ==============================================
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

// ==============================================
// MEMBER-ONLY ROUTES (Admins redirected away)
// ==============================================
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
  '/contact',
  '/about',
  '/api/auth', // All auth API routes are public
  '/api/health', // Health check endpoint (if exists)
  '/api/status', // Status endpoint (if exists)
]

// ==============================================
// HELPER: Check if path matches pattern (supports wildcards)
// ==============================================
function matchesPattern(pathname: string, pattern: string): boolean {
  if (pattern.includes('*')) {
    const regexPattern = pattern.replace(/\*/g, '[^/]+')
    const regex = new RegExp(`^${regexPattern}$`)
    return regex.test(pathname)
  }
  return pathname.startsWith(pattern)
}

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

  // Check if route requires authentication - UPDATED to handle wildcard patterns
  const isProtectedRoute = protectedRoutes.some(route => matchesPattern(pathname, route))
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route))

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

        // Invalid session - clear cookies (including userInfo from previous version)
        const response = isProtectedRoute
          ? NextResponse.redirect(new URL('/auth/login', request.url))
          : NextResponse.next()

        response.cookies.delete('sessionToken')
        response.cookies.delete('userInfo') // ← RESTORED from previous version
        return response
      }

      // FIX: Add type guard to ensure data exists before accessing user
      if (!sessionValidation.data) {
        console.log('Session validation missing data')

        const response = isProtectedRoute
          ? NextResponse.redirect(new URL('/auth/login', request.url))
          : NextResponse.next()

        response.cookies.delete('sessionToken')
        response.cookies.delete('userInfo')
        return response
      }

      // NOW we can safely access sessionValidation.data
      const { user } = sessionValidation.data
      const userRole = user?.role

      // ==============================================
      // NEW: ROLE-BASED ROUTE PROTECTION
      // ==============================================

      // Check if route is admin-only
      const isAdminRoute = adminOnlyRoutes.some(route => matchesPattern(pathname, route))
      
      // Check if route is member-only
      const isMemberRoute = memberOnlyRoutes.some(route => matchesPattern(pathname, route))

      // PROTECTION: Admin-only routes
      if (isAdminRoute && userRole) {
        const isAdmin = userRole === 'super_admin' || userRole === 'admin'
        
        if (!isAdmin) {
          // Non-admins trying to access admin routes → Redirect to member dashboard
          console.log(`Non-admin (${userRole}) blocked from: ${pathname}`)
          return NextResponse.redirect(new URL('/dashboard/member', request.url))
        }
      }

      // PROTECTION: Member-only routes (admins should use admin dashboard)
      if (isMemberRoute && userRole) {
        const isAdmin = userRole === 'super_admin' || userRole === 'admin'
        
        if (isAdmin) {
          // Admins trying to access member routes → Redirect to admin dashboard
          console.log(`Admin blocked from member route: ${pathname}`)
          return NextResponse.redirect(new URL('/dashboard/admin', request.url))
        }
      }

      // Clone the request headers
      const requestHeaders = new Headers(request.headers)

      // Add session info to headers
      requestHeaders.set('x-user-id', sessionValidation.data.userId || user?.id)
      requestHeaders.set('x-session-id', sessionValidation.data.sessionId)

      // Add user information to headers for API consumption
      if (user) {
        // RESTORED: Company ID handling from previous version
        if (user.company_id) {
          requestHeaders.set('x-company-id', user.company_id)
        } else if (user.company?.id) {
          requestHeaders.set('x-company-id', user.company.id)
        }

        if (user.role) {
          requestHeaders.set('x-user-role', user.role)
        }

        if (user.email) {
          requestHeaders.set('x-user-email', user.email)
        }

        // NEW: Add user permissions for coordinated operations
        if (user.permissions) {
          let permissionsString = user.permissions
          if (typeof permissionsString === 'object') {
            permissionsString = JSON.stringify(permissionsString)
          }
          requestHeaders.set('x-user-permissions', permissionsString)
        }

        // NEW: Add user name for audit trails in coordinated operations
        if (user.first_name && user.last_name) {
          requestHeaders.set('x-user-name', `${user.first_name} ${user.last_name}`)
        }
      }

      // RESTORED: Redirect authenticated users away from auth pages (from previous version)
      if (pathname.startsWith('/auth/') && !pathname.includes('logout')) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }

      // Return response with updated headers
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })

    } catch (error) {
      console.error('Middleware session validation error:', error)

      // On validation error, clear cookies and redirect to login if protected
      const response = isProtectedRoute
        ? NextResponse.redirect(new URL('/auth/login', request.url))
        : NextResponse.next()

      response.cookies.delete('sessionToken')
      response.cookies.delete('userInfo') // ← RESTORED from previous version
      return response
    }
  }

  // No token but accessing public route - allow through
  return NextResponse.next()
}

export const config = {
  /*
   * Match all request paths except for the ones starting with:
   * - api/auth (authentication routes)
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico (favicon file)
   * - public folder files
   */
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ],
}

// ==============================================
// MIDDLEWARE UTILITIES FOR COORDINATED OPERATIONS
// ==============================================

/**
 * Extract coordination context from request headers
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
    source: 'coordination_middleware'
  }
}

// ==============================================
// HELPER FUNCTIONS FOR COMMON MIDDLEWARE OPERATIONS
// ==============================================

/**
 * Check if user has required role for an operation
 */
export function hasRequiredRole(
  request: NextRequest,
  requiredRoles: string[]
): boolean {
  const userRole = request.headers.get('x-user-role')
  return userRole ? requiredRoles.includes(userRole) : false
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