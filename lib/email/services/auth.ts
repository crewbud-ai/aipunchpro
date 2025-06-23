// ==============================================
// src/lib/email/services/auth.ts - Authentication Email Services
// ==============================================

import { BaseEmailService, EmailResult, emailConfig } from '../client'
import { WelcomeEmailTemplate } from '../templates/welcome'
import { env } from '@/lib/env'

export class AuthEmailService extends BaseEmailService {

    // ==============================================
    // WELCOME EMAIL (SIGNUP)
    // ==============================================
    async sendWelcomeEmail(data: {
        email: string
        firstName: string
        lastName: string
        companyName: string
        verificationUrl: string
    }): Promise<EmailResult> {
        const dashboardUrl = `${emailConfig.baseUrl}/dashboard`
        const trialDays = parseInt(env.DEFAULT_TRIAL_DAYS.toString())

        return this.sendEmail({
            to: [data.email],
            subject: `Welcome to ${emailConfig.brandName} - Verify Your Account`,
            react: WelcomeEmailTemplate({
                firstName: data.firstName,
                lastName: data.lastName,
                companyName: data.companyName,
                verificationUrl: data.verificationUrl,
                dashboardUrl,
                trialDays,
            }),
        })
    }

    // ==============================================
    // EMAIL VERIFICATION REMINDER
    // ==============================================
    async sendVerificationReminder(data: {
        email: string
        firstName: string
        verificationUrl: string
    }): Promise<EmailResult> {
        return this.sendEmail({
            to: [data.email],
            subject: `Please verify your ${emailConfig.brandName} account`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hi ${data.firstName}!</h2>
          <p>We noticed you haven't verified your email address yet.</p>
          <p>To unlock all features of CrewBudAI, please verify your email:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.verificationUrl}" 
               style="background: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Verify Email Address
            </a>
          </div>
          <p><small>This link expires in 24 hours.</small></p>
        </div>
      `,
        })
    }

    // ==============================================
    // PASSWORD RESET EMAIL
    // ==============================================
    async sendPasswordResetEmail(data: {
        email: string
        firstName: string
        resetUrl: string
    }): Promise<EmailResult> {
        return this.sendEmail({
            to: [data.email],
            subject: `Reset your ${emailConfig.brandName} password`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Hi ${data.firstName},</p>
          <p>You requested to reset your password for ${emailConfig.brandName}.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.resetUrl}" 
               style="background: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p><strong>This link will expire in 1 hour.</strong></p>
          <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
        </div>
      `,
        })
    }

    // ==============================================
    // PASSWORD RESET SUCCESS EMAIL (NEW!)
    // ==============================================
    async sendPasswordResetSuccessEmail(data: {
        email: string
        firstName: string
    }): Promise<EmailResult> {
        return this.sendEmail({
            to: [data.email],
            subject: `Password successfully reset - ${emailConfig.brandName}`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">
              ✅ Password Reset Successful
            </h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">
              Your CrewBudAI account is secure
            </p>
          </div>
          
          <div style="padding: 40px 20px; background-color: #f9fafb;">
            <h2 style="color: #1f2937; margin-bottom: 20px; font-size: 24px;">
              Hi ${data.firstName}! 👋
            </h2>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Great news! Your password has been successfully reset for your CrewBudAI account.
            </p>
            
            <div style="background-color: #d1fae5; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #10b981;">
              <h3 style="color: #047857; margin-top: 0; font-size: 18px;">
                🔐 Your Account is Secure
              </h3>
              <p style="color: #047857; margin: 10px 0; font-size: 14px;">
                You can now log in with your new password. Your account remains fully secure.
              </p>
              <div style="text-align: center; margin: 20px 0;">
                <a href="${emailConfig.baseUrl}/auth/login" 
                   style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
                  Log In to Your Account
                </a>
              </div>
            </div>
            
            <div style="background-color: white; padding: 30px; border-radius: 8px; margin: 30px 0;">
              <h3 style="color: #1f2937; margin-top: 0; font-size: 18px;">
                🛡️ Security Tips
              </h3>
              <ul style="color: #4b5563; line-height: 1.8; padding-left: 20px;">
                <li>Keep your password secure and don't share it with anyone</li>
                <li>Use a unique password for your CrewBudAI account</li>
                <li>Contact support immediately if you notice any suspicious activity</li>
                <li>Consider using a password manager for added security</li>
              </ul>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 40px;">
              If you didn't reset your password, contact support immediately at ${emailConfig.replyTo}
            </p>
          </div>
          
          <div style="background-color: #1f2937; padding: 20px; text-align: center;">
            <p style="color: #9ca3af; margin: 0; font-size: 14px;">
              © 2025 CrewBudAI. Built for construction professionals.
            </p>
          </div>
        </div>
      `,
        })
    }

    // ==============================================
    // EMAIL VERIFICATION SUCCESS
    // ==============================================
    async sendEmailVerificationSuccess(data: {
        email: string
        firstName: string
    }): Promise<EmailResult> {
        return this.sendEmail({
            to: [data.email],
            subject: `Email verified - Welcome to ${emailConfig.brandName}!`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>🎉 Email Verified Successfully!</h2>
          <p>Hi ${data.firstName},</p>
          <p>Great news! Your email address has been verified and your CrewBudAI account is now fully activated.</p>
          <p>You now have access to all features including:</p>
          <ul>
            <li>Create unlimited projects</li>
            <li>Invite team members</li>
            <li>Access mobile apps</li>
            <li>Export reports</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${emailConfig.baseUrl}/dashboard" 
               style="background: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Go to Dashboard
            </a>
          </div>
        </div>
      `,
        })
    }
}

// Export singleton instance
export const authEmailService = new AuthEmailService()