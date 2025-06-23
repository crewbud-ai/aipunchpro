import { emailConfig, EmailResult, resend } from "../client"

interface SecurityAlertData {
  userEmail: string
  userName: string
  alertType: 'login_new_device' | 'password_changed' | 'suspicious_activity'
  details: {
    ipAddress?: string
    userAgent?: string
    location?: string
    timestamp: string
  }
}

export async function sendSecurityAlert(data: SecurityAlertData): Promise<EmailResult> {
  try {
    const alertTitles = {
      login_new_device: 'New Device Login Detected',
      password_changed: 'Password Changed Successfully',
      suspicious_activity: 'Suspicious Activity Detected'
    }

    const alertMessages = {
      login_new_device: `We detected a login from a new device. If this was you, you can ignore this email. If not, please secure your account immediately.`,
      password_changed: `Your account password was successfully changed. If you didn't make this change, please contact support immediately.`,
      suspicious_activity: `We detected unusual activity on your account. Please review your recent account activity and contact support if needed.`
    }

    const { data: emailData, error } = await resend.emails.send({
      from: `${emailConfig.brandName} Security <${emailConfig.from}>`,
      to: [data.userEmail],
      replyTo: emailConfig.replyTo,
      subject: `Security Alert: ${alertTitles[data.alertType]}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #dc2626; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">🔒 Security Alert</h1>
          </div>
          
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #1f2937;">Hi ${data.userName},</h2>
            
            <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #dc2626; margin: 0 0 10px 0;">${alertTitles[data.alertType]}</h3>
              <p style="color: #4b5563; margin: 0;">${alertMessages[data.alertType]}</p>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #1f2937; margin: 0 0 10px 0;">Activity Details:</h4>
              <p style="color: #6b7280; margin: 5px 0;"><strong>Time:</strong> ${data.details.timestamp}</p>
              ${data.details.ipAddress ? `<p style="color: #6b7280; margin: 5px 0;"><strong>IP Address:</strong> ${data.details.ipAddress}</p>` : ''}
              ${data.details.location ? `<p style="color: #6b7280; margin: 5px 0;"><strong>Location:</strong> ${data.details.location}</p>` : ''}
              ${data.details.userAgent ? `<p style="color: #6b7280; margin: 5px 0;"><strong>Device:</strong> ${data.details.userAgent}</p>` : ''}
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${emailConfig.baseUrl}/dashboard/security" 
                 style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 10px;">
                Review Account Security
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; text-align: center;">
              If you need help securing your account, contact our support team at ${emailConfig.replyTo}
            </p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error('Error sending security alert:', error)
      return { success: false, error: error.message }
    }

    return { success: true, id: emailData?.id }

  } catch (error) {
    console.error('Security alert service error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}