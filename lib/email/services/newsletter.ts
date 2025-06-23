import { emailConfig, EmailResult, resend } from "../client"

export async function sendNewsletterConfirmation(email: string): Promise<EmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: `${emailConfig.brandName} <${emailConfig.from}>`,
      to: [email],
      replyTo: emailConfig.replyTo,
      subject: `Welcome to ${emailConfig.brandName} Updates!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ea580c 0%, #2563eb 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">You're all set!</h1>
          </div>
          
          <div style="padding: 40px 20px; background: #f9fafb;">
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Thanks for subscribing to ${emailConfig.brandName} updates! You'll be the first to know about new features, construction industry insights, and special offers.
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${emailConfig.baseUrl}/auth/signup" 
                 style="background: #ea580c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Start Your Free Trial
              </a>
            </div>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error('Error sending newsletter confirmation:', error)
      return { success: false, error: error.message }
    }

    return { success: true, id: data?.id }

  } catch (error) {
    console.error('Newsletter confirmation service error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
