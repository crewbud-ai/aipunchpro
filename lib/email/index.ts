// ==============================================
// src/lib/email/index.ts - Email Module Exports
// ==============================================

// Client and types
export { resend, emailConfig } from './client'
export type { EmailResult } from './client'

// Authentication emails
export { authEmailService } from './services/auth'

// Team member emails
// export { teamMemberEmailService } from './services/team-members'

// Utility functions
export { 
  generateVerificationToken, 
  generateVerificationUrl,
  generatePasswordResetToken,
  generatePasswordResetUrl,
  generateRandomPassword,
  generateSecurePassword,
  generateLoginUrl,
  generateDashboardUrl,
  generateProjectUrl,
  generateTeamMemberUrl
} from './utils/tokens'

// Future email services (placeholder for when we add them)
// export { notificationEmailService } from './services/notifications'
// export { reportEmailService } from './services/reports'
// export { marketingEmailService } from './services/marketing'