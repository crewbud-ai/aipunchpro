// ==============================================
// components/ui/permission-guard.tsx - Permission Guard Component
// ==============================================

import React from 'react'
import { 
  hasPermission, 
  hasRole, 
  canUseFeature, 
  canAccessRoute,
  type FEATURE_PERMISSIONS,
} from '@/lib/permissions'
import { type UserPermissions } from '@/lib/database/schema/users'

// ==============================================
// PERMISSION GUARD COMPONENT
// ==============================================
interface PermissionGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  
  // Permission-based
  category?: keyof UserPermissions
  permission?: string
  
  // Feature-based
  feature?: keyof typeof FEATURE_PERMISSIONS
  
  // Role-based
  role?: string
  
  // Route-based
  route?: string
  
  // Custom condition
  condition?: boolean
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  fallback = null,
  category,
  permission,
  feature,
  role,
  route,
  condition
}) => {
  // Check permission
  if (category && permission) {
    if (!hasPermission(category, permission)) {
      return <>{fallback}</>
    }
  }
  
  // Check feature
  if (feature) {
    if (!canUseFeature(feature)) {
      return <>{fallback}</>
    }
  }
  
  // Check role
  if (role) {
    if (!hasRole(role)) {
      return <>{fallback}</>
    }
  }
  
  // Check route
  if (route) {
    if (!canAccessRoute(route)) {
      return <>{fallback}</>
    }
  }
  
  // Check custom condition
  if (condition !== undefined) {
    if (!condition) {
      return <>{fallback}</>
    }
  }
  
  return <>{children}</>
}

// ==============================================
// CONVENIENCE COMPONENTS
// ==============================================

// Feature-based guard
interface FeatureGuardProps {
  feature: keyof typeof FEATURE_PERMISSIONS
  children: React.ReactNode
  fallback?: React.ReactNode
}

export const FeatureGuard: React.FC<FeatureGuardProps> = ({ feature, children, fallback = null }) => (
  <PermissionGuard feature={feature} fallback={fallback}>
    {children}
  </PermissionGuard>
)

// Role-based guard
interface RoleGuardProps {
  role: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ role, children, fallback = null }) => (
  <PermissionGuard role={role} fallback={fallback}>
    {children}
  </PermissionGuard>
)

// Admin-only guard
interface AdminGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export const AdminGuard: React.FC<AdminGuardProps> = ({ children, fallback = null }) => (
  <PermissionGuard role="super_admin" fallback={
    <PermissionGuard role="admin" fallback={fallback}>
      {children}
    </PermissionGuard>
  }>
    {children}
  </PermissionGuard>
)

// Super Admin only guard
export const SuperAdminGuard: React.FC<AdminGuardProps> = ({ children, fallback = null }) => (
  <PermissionGuard role="super_admin" fallback={fallback}>
    {children}
  </PermissionGuard>
)