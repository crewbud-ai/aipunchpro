// ==============================================
// src/lib/email/templates/team-member/account-reactivation.tsx
// ==============================================

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import { emailStyles } from '../shared/styles'

interface AccountReactivationEmailProps {
  firstName: string
  lastName: string
  companyName: string
  reactivatedBy: string
  temporaryPassword: string
  notes?: string
  loginUrl: string
}

export const AccountReactivationEmail = ({
  firstName,
  lastName,
  companyName,
  reactivatedBy,
  temporaryPassword,
  notes,
  loginUrl,
}: AccountReactivationEmailProps) => {
  const previewText = `Welcome back to ${companyName}!`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={emailStyles.main}>
        <Container style={emailStyles.container}>
          {/* Header */}
          <Section style={emailStyles.successHeader}>
            <Heading style={emailStyles.headerTitle}>Welcome Back! 🎉</Heading>
          </Section>

          {/* Main Content */}
          <Section style={emailStyles.content}>
            <Heading style={emailStyles.h1}>Hi {firstName}!</Heading>
            
            <Text style={emailStyles.text}>
              Great news! Your account at <strong>{companyName}</strong> has been reactivated. We're excited to have you back on the team!
            </Text>

            {/* Account Access */}
            <Section style={emailStyles.successSection}>
              <Heading style={emailStyles.sectionTitle}>🔑 Your Account Access</Heading>
              <Text style={emailStyles.detailText}>
                <strong>Reactivated by:</strong> {reactivatedBy}
              </Text>
              <Text style={emailStyles.detailText}>
                <strong>Email:</strong> (your existing email)
              </Text>
              <Text style={emailStyles.detailText}>
                <strong>New Temporary Password:</strong> <code style={emailStyles.passwordCode}>{temporaryPassword}</code>
              </Text>
            </Section>

            {/* Security Notice */}
            <Section style={emailStyles.securitySection}>
              <Heading style={emailStyles.securityTitle}>🔒 Security Notice</Heading>
              <Text style={emailStyles.securityText}>
                <strong>Please change your password</strong> immediately after logging in for security purposes.
              </Text>
            </Section>

            {/* Additional Notes */}
            {notes && (
              <Section style={emailStyles.infoSection}>
                <Heading style={emailStyles.infoTitle}>Additional Notes:</Heading>
                <Text style={emailStyles.text}>{notes}</Text>
              </Section>
            )}

            {/* Action Button */}
            <Section style={emailStyles.buttonSection}>
              <Button style={emailStyles.successButton} href={loginUrl}>
                Log In to Your Account
              </Button>
            </Section>

            {/* What's Available */}
            <Section style={emailStyles.infoSection}>
              <Heading style={emailStyles.infoTitle}>What's Available:</Heading>
              <Text style={emailStyles.stepText}>• Access to your dashboard and profile</Text>
              <Text style={emailStyles.stepText}>• View assigned projects and tasks</Text>
              <Text style={emailStyles.stepText}>• Time tracking and reporting tools</Text>
              <Text style={emailStyles.stepText}>• Team collaboration features</Text>
              <Text style={emailStyles.stepText}>• Project files and documentation</Text>
            </Section>

            <Text style={emailStyles.helpText}>
              If you have any questions or need assistance getting back up to speed, please don't hesitate to contact your manager.
            </Text>
          </Section>

          <Hr style={emailStyles.hr} />

          <Section>
            <Text style={emailStyles.footer}>
              This email was sent by CrewBudAI on behalf of {companyName}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default AccountReactivationEmail