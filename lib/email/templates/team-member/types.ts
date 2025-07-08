// ==============================================
// src/lib/email/templates/team-member/types.ts - Template Type Definitions
// ==============================================

export interface TeamMemberWelcomeEmailProps {
  firstName: string
  lastName: string
  companyName: string
  role: string
  email: string
  temporaryPassword: string
  loginUrl: string
  projectAssignment?: {
    projectName: string
    notes?: string
  }
}

export interface ProjectAssignmentEmailProps {
  firstName: string
  lastName: string
  companyName: string
  projectName: string
  projectDescription?: string
  assignedBy: string
  notes?: string
  hourlyRate?: number
  startDate?: string
  dashboardUrl: string
}

export interface ProjectRemovalEmailProps {
  firstName: string
  lastName: string
  companyName: string
  projectName: string
  removedBy: string
  reason?: string
  lastWorkingDay?: string
  dashboardUrl: string
}

export interface AccountDeactivationEmailProps {
  firstName: string
  lastName: string
  companyName: string
  deactivatedBy: string
  reason?: string
  lastWorkingDay: string
  contactEmail?: string
}

export interface AccountReactivationEmailProps {
  firstName: string
  lastName: string
  companyName: string
  reactivatedBy: string
  temporaryPassword: string
  notes?: string
  loginUrl: string
}