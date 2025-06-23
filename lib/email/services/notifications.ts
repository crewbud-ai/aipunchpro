import { emailConfig, EmailResult, resend } from "../client"

interface TaskAssignedEmailData {
  recipientEmail: string
  recipientName: string
  taskTitle: string
  projectName: string
  assignedBy: string
  dueDate?: string
  taskUrl: string
}

export async function sendTaskAssignedEmail(data: TaskAssignedEmailData): Promise<EmailResult> {
  try {
    const { data: emailData, error } = await resend.emails.send({
      from: `${emailConfig.brandName} <${emailConfig.from}>`,
      to: [data.recipientEmail],
      replyTo: emailConfig.replyTo,
      subject: `New Task Assigned: ${data.taskTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #ea580c; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">New Task Assigned</h1>
          </div>
          
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #1f2937;">Hi ${data.recipientName},</h2>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              You've been assigned a new task in <strong>${data.projectName}</strong>:
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #ea580c; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #1f2937;">${data.taskTitle}</h3>
              <p style="color: #6b7280; margin: 0;">
                Assigned by: <strong>${data.assignedBy}</strong>
                ${data.dueDate ? `<br>Due: <strong>${data.dueDate}</strong>` : ''}
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.taskUrl}" 
                 style="background: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View Task Details
              </a>
            </div>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error('Error sending task assigned email:', error)
      return { success: false, error: error.message }
    }

    return { success: true, id: emailData?.id }

  } catch (error) {
    console.error('Task assigned email service error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}