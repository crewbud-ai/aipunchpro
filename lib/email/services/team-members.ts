// ==============================================
// src/lib/email/services/team-members.ts - Team Member Email Notifications (Updated with React Templates)
// ==============================================

import { BaseEmailService, EmailResult } from '../client'
import {
  TeamMemberWelcomeEmail,
  ProjectAssignmentEmail,
  ProjectRemovalEmail,
  AccountDeactivationEmail,
  AccountReactivationEmail,
} from '../templates/team-member'

export class TeamMemberEmailService extends BaseEmailService {

  // ==============================================
  // 1. WELCOME EMAIL (New Team Member Added)
  // ==============================================
  async sendWelcomeEmail(data: {
    email: string
    firstName: string
    lastName: string
    companyName: string
    role: string
    temporaryPassword: string
    loginUrl: string
    projectAssignment?: {
      projectName: string
      notes?: string
    }
  }): Promise<EmailResult> {
    const subject = `Welcome to ${data.companyName} - Your Account is Ready!`

    return this.sendEmail({
      to: [data.email],
      subject,
      react: TeamMemberWelcomeEmail({
        firstName: data.firstName,
        lastName: data.lastName,
        companyName: data.companyName,
        role: data.role,
        email: data.email,
        temporaryPassword: data.temporaryPassword,
        loginUrl: data.loginUrl,
        projectAssignment: data.projectAssignment,
      }),
    })
  }

  // ==============================================
  // 2. PROJECT ASSIGNMENT EMAIL
  // ==============================================
  async sendProjectAssignmentEmail(data: {
    email: string
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
  }): Promise<EmailResult> {
    const subject = `New Project Assignment: ${data.projectName}`

    return this.sendEmail({
      to: [data.email],
      subject,
      react: ProjectAssignmentEmail({
        firstName: data.firstName,
        lastName: data.lastName,
        companyName: data.companyName,
        projectName: data.projectName,
        projectDescription: data.projectDescription,
        assignedBy: data.assignedBy,
        notes: data.notes,
        hourlyRate: data.hourlyRate,
        startDate: data.startDate,
        dashboardUrl: data.dashboardUrl,
      }),
    })
  }

  // ==============================================
  // 3. PROJECT REMOVAL EMAIL
  // ==============================================
  async sendProjectRemovalEmail(data: {
    email: string
    firstName: string
    lastName: string
    companyName: string
    projectName: string
    removedBy: string
    reason?: string
    lastWorkingDay?: string
    dashboardUrl: string
  }): Promise<EmailResult> {
    const subject = `Project Assignment Update: ${data.projectName}`

    return this.sendEmail({
      to: [data.email],
      subject,
      react: ProjectRemovalEmail({
        firstName: data.firstName,
        lastName: data.lastName,
        companyName: data.companyName,
        projectName: data.projectName,
        removedBy: data.removedBy,
        reason: data.reason,
        lastWorkingDay: data.lastWorkingDay,
        dashboardUrl: data.dashboardUrl,
      }),
    })
  }

  // ==============================================
  // 4. ACCOUNT DEACTIVATION EMAIL
  // ==============================================
  async sendAccountDeactivationEmail(data: {
    email: string
    firstName: string
    lastName: string
    companyName: string
    deactivatedBy: string
    reason?: string
    lastWorkingDay: string
    contactEmail?: string
  }): Promise<EmailResult> {
    const subject = `Account Status Update - ${data.companyName}`

    return this.sendEmail({
      to: [data.email],
      subject,
      react: AccountDeactivationEmail({
        firstName: data.firstName,
        lastName: data.lastName,
        companyName: data.companyName,
        deactivatedBy: data.deactivatedBy,
        reason: data.reason,
        lastWorkingDay: data.lastWorkingDay,
        contactEmail: data.contactEmail,
      }),
    })
  }

  // ==============================================
  // 5. ACCOUNT REACTIVATION EMAIL
  // ==============================================
  async sendAccountReactivationEmail(data: {
    email: string
    firstName: string
    lastName: string
    companyName: string
    reactivatedBy: string
    temporaryPassword: string
    notes?: string
    loginUrl: string
  }): Promise<EmailResult> {
    const subject = `Welcome Back to ${data.companyName}! 🎉`

    return this.sendEmail({
      to: [data.email],
      subject,
      react: AccountReactivationEmail({
        firstName: data.firstName,
        lastName: data.lastName,
        companyName: data.companyName,
        reactivatedBy: data.reactivatedBy,
        temporaryPassword: data.temporaryPassword,
        notes: data.notes,
        loginUrl: data.loginUrl,
      }),
    })
  }
}

// Export singleton instance
export const teamMemberEmailService = new TeamMemberEmailService()