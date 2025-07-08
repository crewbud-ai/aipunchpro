// ==============================================
// src/lib/email/templates/team-member/team-member-welcome.tsx
// ==============================================

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import { emailStyles } from '../shared/styles'

interface TeamMemberWelcomeEmailProps {
  firstName: string
  lastName: string
  companyName: string
  role: string
  email: string
  temporaryPassword: string
  loginUrl: string
  projectAssignment?: {
    projectName: string
    notes?: string
  }
}

export const TeamMemberWelcomeEmail = ({
  firstName,
  lastName,
  companyName,
  role,
  email,
  temporaryPassword,
  loginUrl,
  projectAssignment,
}: TeamMemberWelcomeEmailProps) => {
  const previewText = `Welcome to ${companyName}! Your account is ready.`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={emailStyles.main}>
        <Container style={emailStyles.container}>
          {/* Header */}
          <Section style={emailStyles.header}>
            <Heading style={emailStyles.headerTitle}>Welcome to {companyName}! 🎉</Heading>
          </Section>

          {/* Main Content */}
          <Section style={emailStyles.content}>
            <Heading style={emailStyles.h1}>Hi {firstName}!</Heading>
            
            <Text style={emailStyles.text}>
              Congratulations! You've been added as a team member to <strong>{companyName}</strong>. 
              We're excited to have you on board as a <strong>{role}</strong>.
            </Text>

            {/* Project Assignment Section */}
            {projectAssignment ? (
              <Section style={emailStyles.projectSection}>
                <Heading style={emailStyles.sectionTitle}>🎯 Project Assignment</Heading>
                <Text style={emailStyles.projectText}>
                  <strong>Project:</strong> {projectAssignment.projectName}
                </Text>
                {projectAssignment.notes && (
                  <Text style={emailStyles.projectText}>
                    <strong>Notes:</strong> {projectAssignment.notes}
                  </Text>
                )}
              </Section>
            ) : (
              <Section style={emailStyles.warningSection}>
                <Text style={emailStyles.warningText}>
                  📋 You haven't been assigned to any projects yet. Your manager will assign you to projects as needed.
                </Text>
              </Section>
            )}

            {/* Login Credentials */}
            <Section style={emailStyles.credentialsSection}>
              <Heading style={emailStyles.sectionTitle}>🔑 Your Login Credentials</Heading>
              <Text style={emailStyles.credentialText}>
                <strong>Email:</strong> {email}
              </Text>
              <Text style={emailStyles.credentialText}>
                <strong>Temporary Password:</strong> <code style={emailStyles.passwordCode}>{temporaryPassword}</code>
              </Text>
            </Section>

            {/* Security Notice */}
            <Section style={emailStyles.securitySection}>
              <Heading style={emailStyles.securityTitle}>🔒 Important Security Notice</Heading>
              <Text style={emailStyles.securityText}>
                <strong>You must change your password</strong> when you first log in. This temporary password is only for your initial access.
              </Text>
            </Section>

            {/* Login Button */}
            <Section style={emailStyles.buttonSection}>
              <Button style={emailStyles.button} href={loginUrl}>
                Log In to Your Account
              </Button>
            </Section>

            {/* Next Steps */}
            <Section style={emailStyles.stepsSection}>
              <Heading style={emailStyles.stepsTitle}>What's Next?</Heading>
              <Text style={emailStyles.stepText}>• Log in with your credentials above</Text>
              <Text style={emailStyles.stepText}>• Change your password to something secure</Text>
              <Text style={emailStyles.stepText}>• Complete your profile information</Text>
              <Text style={emailStyles.stepText}>• Explore your dashboard and available projects</Text>
              <Text style={emailStyles.stepText}>• Contact your manager if you have any questions</Text>
            </Section>

            <Text style={emailStyles.helpText}>
              If you have any questions or need help getting started, please don't hesitate to reach out to your manager or contact our support team.
            </Text>
          </Section>

          <Hr style={emailStyles.hr} />

          {/* Footer */}
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

export default TeamMemberWelcomeEmail