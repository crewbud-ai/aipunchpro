// ==============================================
// src/lib/email/templates/team-member/project-assignment.tsx
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

interface ProjectAssignmentEmailProps {
  firstName: string
  lastName: string
  companyName: string
  projectName: string
  projectDescription?: string
  assignedBy: string
  notes?: string
  hourlyRate?: number
  startDate?: string
  dashboardUrl: string
}

export const ProjectAssignmentEmail = ({
  firstName,
  lastName,
  companyName,
  projectName,
  projectDescription,
  assignedBy,
  notes,
  hourlyRate,
  startDate,
  dashboardUrl,
}: ProjectAssignmentEmailProps) => {
  const previewText = `New project assignment: ${projectName}`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={emailStyles.main}>
        <Container style={emailStyles.container}>
          {/* Header */}
          <Section style={emailStyles.successHeader}>
            <Heading style={emailStyles.headerTitle}>New Project Assignment! 🚀</Heading>
          </Section>

          {/* Main Content */}
          <Section style={emailStyles.content}>
            <Heading style={emailStyles.h1}>Hi {firstName}!</Heading>
            
            <Text style={emailStyles.text}>
              Great news! You've been assigned to a new project at <strong>{companyName}</strong>.
            </Text>

            {/* Project Details */}
            <Section style={emailStyles.successSection}>
              <Heading style={emailStyles.sectionTitle}>📋 Project Details</Heading>
              <Text style={emailStyles.detailText}>
                <strong>Project:</strong> {projectName}
              </Text>
              {projectDescription && (
                <Text style={emailStyles.detailText}>
                  <strong>Description:</strong> {projectDescription}
                </Text>
              )}
              <Text style={emailStyles.detailText}>
                <strong>Assigned by:</strong> {assignedBy}
              </Text>
              {hourlyRate && (
                <Text style={emailStyles.detailText}>
                  <strong>Hourly Rate:</strong> ${hourlyRate}/hour
                </Text>
              )}
              {startDate && (
                <Text style={emailStyles.detailText}>
                  <strong>Start Date:</strong> {new Date(startDate).toLocaleDateString()}
                </Text>
              )}
              {notes && (
                <Text style={emailStyles.detailText}>
                  <strong>Notes:</strong> {notes}
                </Text>
              )}
            </Section>

            {/* Action Button */}
            <Section style={emailStyles.buttonSection}>
              <Button style={emailStyles.successButton} href={dashboardUrl}>
                View Project Details
              </Button>
            </Section>

            {/* What You Can Do */}
            <Section style={emailStyles.infoSection}>
              <Heading style={emailStyles.infoTitle}>What You Can Do Now:</Heading>
              <Text style={emailStyles.stepText}>• Access project dashboard and resources</Text>
              <Text style={emailStyles.stepText}>• View project tasks and timeline</Text>
              <Text style={emailStyles.stepText}>• Collaborate with other team members</Text>
              <Text style={emailStyles.stepText}>• Track your time and progress</Text>
              <Text style={emailStyles.stepText}>• Upload project files and documents</Text>
            </Section>
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

export default ProjectAssignmentEmail