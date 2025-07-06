// ==============================================
// lib/permissions.ts - Global Permissions System
// ==============================================

import { UserPermissions } from '@/lib/database/schema/users'

// ==============================================
// PERMISSION STORE (Global State)
// ==============================================
class PermissionStore {
  private permissions: UserPermissions | null = null
  private userRole: string | null = null

  // Set permissions after login
  setPermissions(permissions: UserPermissions, role: string) {
    this.permissions = permissions
    this.userRole = role
  }

  // Clear permissions on logout
  clearPermissions() {
    this.permissions = null
    this.userRole = null
  }

  // Get current permissions
  getPermissions(): UserPermissions | null {
    return this.permissions
  }

  // Get current role
  getRole(): string | null {
    return this.userRole
  }

  // Check specific permission
  hasPermission(category: keyof UserPermissions, permission: string): boolean {
    if (!this.permissions) return false
    return this.permissions[category]?.[permission as keyof UserPermissions[typeof category]] === true
  }

  // Check role
  hasRole(role: string): boolean {
    return this.userRole === role
  }

  // Check if user is admin (super_admin or admin)
  isAdmin(): boolean {
    return this.userRole === 'super_admin' || this.userRole === 'admin'
  }

  // Check if user is super admin
  isSuperAdmin(): boolean {
    return this.userRole === 'super_admin'
  }
}

// Global instance
const permissionStore = new PermissionStore()

// ==============================================
// PERMISSION UTILITIES
// ==============================================

/**
 * Initialize permissions after login
 */
export function initializePermissions(sessionData: any) {
  console.log('🔥 Initializing permissions with:', sessionData)
  
  if (sessionData?.user?.permissions && sessionData?.user?.role) {
    console.log('✅ Permissions found, setting in store')
    permissionStore.setPermissions(sessionData.user.permissions, sessionData.user.role)
    
    // Verify it was set
    console.log('✅ Permissions set successfully:', permissionStore.getPermissions())
  } else {
    console.log('❌ No permissions found in session data')
    console.log('User object:', sessionData?.user)
  }
}

/**
 * Clear permissions on logout
 */
export function clearPermissions() {
  permissionStore.clearPermissions()
}

/**
 * Check if user has specific permission
 */
export function hasPermission(category: keyof UserPermissions, permission: string): boolean {
  const result = permissionStore.hasPermission(category, permission)
  console.log(`🔍 Checking permission ${category}.${permission}: ${result}`)
  return result
}

/**
 * Check if user has specific role
 */
export function hasRole(role: string): boolean {
  return permissionStore.hasRole(role)
}

/**
 * Check if user is admin
 */
export function isAdmin(): boolean {
  return permissionStore.isAdmin()
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(): boolean {
  return permissionStore.isSuperAdmin()
}

/**
 * Get current user permissions
 */
export function getCurrentPermissions(): UserPermissions | null {
  return permissionStore.getPermissions()
}

/**
 * Get current user role
 */
export function getCurrentRole(): string | null {
  return permissionStore.getRole()
}

// ==============================================
// ROUTE PERMISSIONS
// ==============================================
export const ROUTE_PERMISSIONS = {
  // Dashboard routes
  '/dashboard': () => true, // Everyone can access dashboard
  '/dashboard/projects': () => hasPermission('projects', 'view'),
  '/dashboard/projects/new': () => hasPermission('projects', 'create'),
  '/dashboard/team': () => hasPermission('team', 'view'),
  '/dashboard/team/new': () => hasPermission('team', 'add'),
  '/dashboard/settings': () => hasPermission('admin', 'companySettings'),
  '/dashboard/settings/roles': () => hasPermission('admin', 'manageUsers'),
  '/dashboard/reports': () => hasPermission('reports', 'view'),
  '/dashboard/schedule': () => hasPermission('schedule', 'view'),
  '/dashboard/files': () => hasPermission('files', 'view'),
  
  // API routes
  '/api/projects': () => hasPermission('projects', 'view'),
  '/api/team': () => hasPermission('team', 'view'),
  '/api/reports': () => hasPermission('reports', 'view'),
} as const

/**
 * Check if user can access route
 */
export function canAccessRoute(route: string): boolean {
  const checker = ROUTE_PERMISSIONS[route as keyof typeof ROUTE_PERMISSIONS]
  return checker ? checker() : true // Default allow if route not defined
}

// ==============================================
// FEATURE PERMISSIONS
// ==============================================
export const FEATURE_PERMISSIONS = {
  // Project features
  createProject: () => hasPermission('projects', 'create'),
  editProject: () => hasPermission('projects', 'edit'),
  deleteProject: () => hasPermission('projects', 'delete'),
  viewAllProjects: () => hasPermission('projects', 'viewAll'),
  
  // Team features
  addTeamMember: () => hasPermission('team', 'add'),
  editTeamMember: () => hasPermission('team', 'edit'),
  removeTeamMember: () => hasPermission('team', 'remove'),
  assignToProjects: () => hasPermission('team', 'assignToProjects'),
  
  // Task features
  createTask: () => hasPermission('tasks', 'create'),
  editTask: () => hasPermission('tasks', 'edit'),
  deleteTask: () => hasPermission('tasks', 'delete'),
  assignTask: () => hasPermission('tasks', 'assign'),
  completeTask: () => hasPermission('tasks', 'complete'),
  
  // Admin features
  manageUsers: () => hasPermission('admin', 'manageUsers'),
  systemSettings: () => hasPermission('admin', 'systemSettings'),
  companySettings: () => hasPermission('admin', 'companySettings'),
  
  // Financial features
  viewFinancials: () => hasPermission('financials', 'view'),
  editFinancials: () => hasPermission('financials', 'edit'),
  viewReports: () => hasPermission('financials', 'viewReports'),
  
  // File features
  uploadFiles: () => hasPermission('files', 'upload'),
  deleteFiles: () => hasPermission('files', 'delete'),
  downloadAllFiles: () => hasPermission('files', 'downloadAll'),
  
  // Schedule features
  createSchedule: () => hasPermission('schedule', 'create'),
  editSchedule: () => hasPermission('schedule', 'edit'),
  
  // Report features
  generateReports: () => hasPermission('reports', 'generate'),
  exportReports: () => hasPermission('reports', 'export'),
} as const

/**
 * Check if user can use specific feature
 */
export function canUseFeature(feature: keyof typeof FEATURE_PERMISSIONS): boolean {
  return FEATURE_PERMISSIONS[feature]()
}

// ==============================================
// PERMISSION GUARD HELPER
// ==============================================
/**
 * Helper for conditional rendering based on permissions
 */
export function withPermission<T>(
  category: keyof UserPermissions,
  permission: string,
  component: T,
  fallback: T | null = null
): T | null {
  return hasPermission(category, permission) ? component : fallback
}

/**
 * Helper for conditional rendering based on features
 */
export function withFeature<T>(
  feature: keyof typeof FEATURE_PERMISSIONS,
  component: T,
  fallback: T | null = null
): T | null {
  return canUseFeature(feature) ? component : fallback
}

/**
 * Helper for conditional rendering based on role
 */
export function withRole<T>(
  role: string,
  component: T,
  fallback: T | null = null
): T | null {
  return hasRole(role) ? component : fallback
}

// ==============================================
// MENU PERMISSIONS (for Navigation)
// ==============================================
export const MENU_PERMISSIONS = {
  dashboard: () => true,
  projects: () => hasPermission('projects', 'view'),
  team: () => hasPermission('team', 'view'),
  schedule: () => hasPermission('schedule', 'view'),
  reports: () => hasPermission('reports', 'view'),
  files: () => hasPermission('files', 'view'),
  settings: () => hasPermission('admin', 'companySettings'),
} as const

/**
 * Check if menu item should be visible
 */
export function canViewMenuItem(menuItem: keyof typeof MENU_PERMISSIONS): boolean {
  return MENU_PERMISSIONS[menuItem]()
}

/**
 * Get visible menu items
 */
export function getVisibleMenuItems(): (keyof typeof MENU_PERMISSIONS)[] {
  return Object.keys(MENU_PERMISSIONS).filter(menuItem => 
    MENU_PERMISSIONS[menuItem as keyof typeof MENU_PERMISSIONS]()
  ) as (keyof typeof MENU_PERMISSIONS)[]
}

// ==============================================
// SERVER-SIDE PERMISSION CHECKER
// ==============================================
/**
 * Check permissions from request headers (for API routes)
 */
export function checkApiPermission(
  headers: Headers,
  category: keyof UserPermissions,
  permission: string
): boolean {
  try {
    const permissionsStr = headers.get('x-user-permissions')
    if (!permissionsStr) return false
    
    const permissions = JSON.parse(permissionsStr) as UserPermissions
    return permissions[category]?.[permission as keyof UserPermissions[typeof category]] === true
  } catch {
    return false
  }
}

/**
 * Check role from request headers (for API routes)
 */
export function checkApiRole(headers: Headers, role: string): boolean {
  const userRole = headers.get('x-user-role')
  return userRole === role
}

/**
 * Check if user is admin from request headers
 */
export function isApiAdmin(headers: Headers): boolean {
  const userRole = headers.get('x-user-role')
  return userRole === 'super_admin' || userRole === 'admin'
}