// ==============================================
// src/lib/email/templates/team-member/project-removal.tsx
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

interface ProjectRemovalEmailProps {
  firstName: string
  lastName: string
  companyName: string
  projectName: string
  removedBy: string
  reason?: string
  lastWorkingDay?: string
  dashboardUrl: string
}

export const ProjectRemovalEmail = ({
  firstName,
  lastName,
  companyName,
  projectName,
  removedBy,
  reason,
  lastWorkingDay,
  dashboardUrl,
}: ProjectRemovalEmailProps) => {
  const previewText = `Project assignment update: ${projectName}`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={emailStyles.main}>
        <Container style={emailStyles.container}>
          {/* Header */}
          <Section style={emailStyles.warningHeader}>
            <Heading style={emailStyles.headerTitle}>Project Assignment Update</Heading>
          </Section>

          {/* Main Content */}
          <Section style={emailStyles.content}>
            <Heading style={emailStyles.h1}>Hi {firstName}!</Heading>
            
            <Text style={emailStyles.text}>
              We wanted to inform you about a change to your project assignments at <strong>{companyName}</strong>.
            </Text>

            {/* Assignment Change */}
            <Section style={emailStyles.warningSection}>
              <Heading style={emailStyles.sectionTitle}>📋 Assignment Change</Heading>
              <Text style={emailStyles.warningText}>
                You have been removed from the <strong>{projectName}</strong> project.
              </Text>
              <Text style={emailStyles.detailText}>
                <strong>Updated by:</strong> {removedBy}
              </Text>
              {reason && (
                <Text style={emailStyles.detailText}>
                  <strong>Reason:</strong> {reason}
                </Text>
              )}
              {lastWorkingDay && (
                <Text style={emailStyles.detailText}>
                  <strong>Last Working Day:</strong> {new Date(lastWorkingDay).toLocaleDateString()}
                </Text>
              )}
            </Section>

            {/* What This Means */}
            <Section style={emailStyles.infoSection}>
              <Heading style={emailStyles.infoTitle}>What This Means:</Heading>
              <Text style={emailStyles.stepText}>• You no longer have access to this project's resources</Text>
              <Text style={emailStyles.stepText}>• Your time entries for this project have been finalized</Text>
              <Text style={emailStyles.stepText}>• You may be assigned to other projects as needed</Text>
              <Text style={emailStyles.stepText}>• Your overall employment status remains unchanged</Text>
            </Section>

            {/* Action Button */}
            <Section style={emailStyles.buttonSection}>
              <Button style={emailStyles.button} href={dashboardUrl}>
                View Your Dashboard
              </Button>
            </Section>

            <Text style={emailStyles.helpText}>
              If you have any questions about this change or need clarification, please contact your manager or HR department.
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

export default ProjectRemovalEmail