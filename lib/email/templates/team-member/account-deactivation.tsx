// ==============================================
// src/lib/email/templates/team-member/account-deactivation.tsx
// ==============================================

import {
  Body,
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

interface AccountDeactivationEmailProps {
  firstName: string
  lastName: string
  companyName: string
  deactivatedBy: string
  reason?: string
  lastWorkingDay: string
  contactEmail?: string
}

export const AccountDeactivationEmail = ({
  firstName,
  lastName,
  companyName,
  deactivatedBy,
  reason,
  lastWorkingDay,
  contactEmail,
}: AccountDeactivationEmailProps) => {
  const previewText = `Account status update - ${companyName}`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={emailStyles.main}>
        <Container style={emailStyles.container}>
          {/* Header */}
          <Section style={emailStyles.errorHeader}>
            <Heading style={emailStyles.headerTitle}>Account Status Update</Heading>
          </Section>

          {/* Main Content */}
          <Section style={emailStyles.content}>
            <Heading style={emailStyles.h1}>Hi {firstName}!</Heading>
            
            <Text style={emailStyles.text}>
              We're writing to inform you about an important change to your account status at <strong>{companyName}</strong>.
            </Text>

            {/* Deactivation Notice */}
            <Section style={emailStyles.errorSection}>
              <Heading style={emailStyles.sectionTitle}>Account Deactivation Notice</Heading>
              <Text style={emailStyles.errorText}>
                Your account has been deactivated as of {new Date(lastWorkingDay).toLocaleDateString()}.
              </Text>
              <Text style={emailStyles.detailText}>
                <strong>Updated by:</strong> {deactivatedBy}
              </Text>
              {reason && (
                <Text style={emailStyles.detailText}>
                  <strong>Reason:</strong> {reason}
                </Text>
              )}
            </Section>

            {/* What This Means */}
            <Section style={emailStyles.neutralSection}>
              <Heading style={emailStyles.neutralTitle}>What This Means:</Heading>
              <Text style={emailStyles.stepText}>• You no longer have access to the company dashboard</Text>
              <Text style={emailStyles.stepText}>• Your access to all projects has been removed</Text>
              <Text style={emailStyles.stepText}>• Your timesheet data has been preserved for payroll purposes</Text>
              <Text style={emailStyles.stepText}>• You will no longer receive project-related notifications</Text>
            </Section>

            {/* Important Notice */}
            <Section style={emailStyles.warningSection}>
              <Text style={emailStyles.warningText}>
                <strong>Important:</strong> Please return any company equipment, access cards, or materials in your possession.
              </Text>
            </Section>

            <Text style={emailStyles.farewellText}>
              Thank you for your contributions to {companyName}. We wish you all the best in your future endeavors.
            </Text>

            {contactEmail && (
              <Text style={emailStyles.contactText}>
                For any questions, please contact: <Link href={`mailto:${contactEmail}`} style={emailStyles.link}>{contactEmail}</Link>
              </Text>
            )}
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

export default AccountDeactivationEmail