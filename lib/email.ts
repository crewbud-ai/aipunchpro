import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendWelcomeEmail(email: string, firstName: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: "CrewBudAI <noreply@crewbudai.com>",
      to: [email],
      subject: "Welcome to CrewBudAI - Your Free Trial is Ready!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ea580c 0%, #2563eb 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to CrewBudAI!</h1>
          </div>
          
          <div style="padding: 40px 20px; background: #f9fafb;">
            <h2 style="color: #1f2937; margin-bottom: 20px;">Hi ${firstName},</h2>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Thanks for signing up for CrewBudAI! Your 14-day free trial is now active and ready to use.
            </p>
            
            <div style="background: white; padding: 30px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #ea580c;">
              <h3 style="color: #1f2937; margin-top: 0;">What's Next?</h3>
              <ul style="color: #4b5563; line-height: 1.8;">
                <li>Set up your first project</li>
                <li>Invite your team members</li>
                <li>Explore our AI assistant</li>
                <li>Try the mobile app for field work</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="https://app.crewbudai.com/dashboard" 
                 style="background: #ea580c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Access Your Dashboard
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              Need help getting started? Reply to this email or contact our support team at support@crewbudai.com
            </p>
          </div>
          
          <div style="background: #1f2937; padding: 20px; text-align: center;">
            <p style="color: #9ca3af; margin: 0; font-size: 14px;">
              © 2024 CrewBudAI. Built for construction professionals.
            </p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error("Error sending welcome email:", error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error sending welcome email:", error)
    return { success: false, error }
  }
}

export async function sendContactNotification(submission: {
  firstName: string
  lastName: string
  email: string
  company?: string
  phone?: string
  message?: string
}) {
  try {
    // Send notification to you
    const { data, error } = await resend.emails.send({
      from: "CrewBudAI Contact Form <noreply@crewbudai.com>",
      to: [process.env.CONTACT_EMAIL || "your-email@example.com"], // Replace with your email
      subject: `New Contact Form Submission from ${submission.firstName} ${submission.lastName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1f2937; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">New Contact Form Submission</h1>
          </div>
          
          <div style="padding: 30px; background: #f9fafb;">
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="margin-top: 0; color: #1f2937;">Contact Details</h3>
              <p><strong>Name:</strong> ${submission.firstName} ${submission.lastName}</p>
              <p><strong>Email:</strong> ${submission.email}</p>
              <p><strong>Company:</strong> ${submission.company || "Not provided"}</p>
              <p><strong>Phone:</strong> ${submission.phone || "Not provided"}</p>
            </div>
            
            ${
              submission.message
                ? `
              <div style="background: white; padding: 20px; border-radius: 8px;">
                <h3 style="margin-top: 0; color: #1f2937;">Message</h3>
                <p style="white-space: pre-wrap; color: #4b5563;">${submission.message}</p>
              </div>
            `
                : ""
            }
          </div>
        </div>
      `,
    })

    // Send confirmation to the user
    await resend.emails.send({
      from: "CrewBudAI <noreply@crewbudai.com>",
      to: [submission.email],
      subject: "Thanks for contacting CrewBudAI - We'll be in touch soon!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ea580c 0%, #2563eb 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Thanks for reaching out!</h1>
          </div>
          
          <div style="padding: 40px 20px; background: #f9fafb;">
            <h2 style="color: #1f2937; margin-bottom: 20px;">Hi ${submission.firstName},</h2>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Thanks for your interest in CrewBudAI! We've received your message and our sales team will contact you within 24 hours.
            </p>
            
            <div style="background: white; padding: 30px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #ea580c;">
              <h3 style="color: #1f2937; margin-top: 0;">While you wait...</h3>
              <p style="color: #4b5563; margin-bottom: 20px;">Why not start your free trial and explore CrewBudAI yourself?</p>
              <a href="https://crewbudai.com/signup" 
                 style="background: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Start Free Trial
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              Have urgent questions? Call us at 1-800-CREW-AI1 or email sales@crewbudai.com
            </p>
          </div>
        </div>
      `,
    })

    return { success: true, data }
  } catch (error) {
    console.error("Error sending contact notification:", error)
    return { success: false, error }
  }
}

export async function sendNewsletterConfirmation(email: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: "CrewBudAI <noreply@crewbudai.com>",
      to: [email],
      subject: "Welcome to CrewBudAI Updates!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ea580c 0%, #2563eb 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">You're all set!</h1>
          </div>
          
          <div style="padding: 40px 20px; background: #f9fafb;">
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Thanks for subscribing to CrewBudAI updates! You'll be the first to know about new features, construction industry insights, and special offers.
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="https://crewbudai.com/signup" 
                 style="background: #ea580c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Start Your Free Trial
              </a>
            </div>
          </div>
        </div>
      `,
    })

    return { success: true, data }
  } catch (error) {
    console.error("Error sending newsletter confirmation:", error)
    return { success: false, error }
  }
}
