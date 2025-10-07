// ==============================================
// lib/ai/permissions.ts - AI Context Permissions
// ==============================================

import type { ContextPermissions } from '@/types/ai'

// ==============================================
// DETERMINE USER PERMISSIONS FOR AI CONTEXT
// ==============================================
export function getAIContextPermissions(role: string): ContextPermissions {
  const isAdmin = role === 'super_admin' || role === 'admin'
  const isSupervisor = role === 'supervisor'

  return {
    canAccessPayroll: isAdmin,
    canAccessAllProjects: isAdmin,
    canAccessTeamData: isAdmin || isSupervisor,
    canAccessReports: isAdmin,
  }
}

// ==============================================
// VALIDATE DATA ACCESS REQUEST
// ==============================================
export function canAccessData(
  requestType: 'payroll' | 'all_projects' | 'team_data' | 'reports' | 'own_data',
  permissions: ContextPermissions
): boolean {
  switch (requestType) {
    case 'payroll':
      return permissions.canAccessPayroll
    case 'all_projects':
      return permissions.canAccessAllProjects
    case 'team_data':
      return permissions.canAccessTeamData
    case 'reports':
      return permissions.canAccessReports
    case 'own_data':
      return true // Everyone can access their own data
    default:
      return false
  }
}

// ==============================================
// GET ACCESS DENIAL MESSAGE
// ==============================================
export function getAccessDenialMessage(requestType: string, role: string): string {
  const messages: Record<string, string> = {
    payroll: "I don't have access to payroll information. Only administrators can view company payroll data. You can view your own timesheet by asking about 'my timesheet' or 'my hours'.",
    all_projects: "I can only show you information about projects you're assigned to. For company-wide project data, please contact your administrator.",
    team_data: "I can only provide information about your own work. For team member information, please contact your supervisor or administrator.",
    reports: "I don't have access to company reports. Only administrators can generate and view company reports.",
  }

  return messages[requestType] || "I don't have access to that information. Please contact your administrator."
}