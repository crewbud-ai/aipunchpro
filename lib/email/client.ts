// ==============================================
// src/lib/email/client.ts - Email Client Configuration
// ==============================================

import { Resend } from 'resend'
import { env } from '@/lib/env'

// Initialize Resend client
// export const resend = new Resend(env.RESEND_API_KEY)
export const resend = new Resend(env.RESEND_API_KEY)

// Email configuration
export const emailConfig = {
  from: env.FROM_EMAIL,
  replyTo: env.CONTACT_EMAIL,
  baseUrl: env.NEXT_PUBLIC_APP_URL,
  brandName: env.NEXT_PUBLIC_APP_NAME,
}

// Email response type
export interface EmailResult {
  success: boolean
  id?: string
  error?: string
}

// Base email service class
export abstract class BaseEmailService {
  protected async sendEmail(data: {
    to: string[]
    subject: string
    html?: string
    react?: any
    replyTo?: string
  }): Promise<EmailResult> {
    try {

      const result = await resend.emails.send({
        from: `${emailConfig.brandName} <${emailConfig.from}>`,
        to: data.to,
        // replyTo: data.replyTo || emailConfig.replyTo,
        subject: data.subject,
        html: data.html,
        react: data.react,
      })

      if (result.error) {
        console.error('Email sending error:', result.error)
        return { success: false, error: result.error.message }
      }

      return { success: true, id: result.data?.id }
    } catch (error) {
      console.error('Email service error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
}