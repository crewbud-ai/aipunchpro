// ==============================================
// src/lib/email/templates/team-member/index.ts - Team Member Templates Export
// ==============================================

// Export all team member email templates
export { default as TeamMemberWelcomeEmail } from './team-member-welcome'
export { default as ProjectAssignmentEmail } from './project-assignment'
export { default as ProjectRemovalEmail } from './project-removal'
export { default as AccountDeactivationEmail } from './account-deactivation'
export { default as AccountReactivationEmail } from './account-reactivation'

// Export shared styles for consistency
export { emailStyles } from '../shared/styles'

// Re-export types if needed
export type {
  TeamMemberWelcomeEmailProps,
  ProjectAssignmentEmailProps,
  ProjectRemovalEmailProps,
  AccountDeactivationEmailProps,
  AccountReactivationEmailProps,
} from './types'