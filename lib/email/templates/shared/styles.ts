// ==============================================
// src/lib/email/templates/shared/styles.ts - Shared Email Styles
// ==============================================

export const emailStyles = {
  // Base styles
  main: {
    backgroundColor: '#ffffff',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
  },

  container: {
    margin: '0 auto',
    padding: '20px 0 48px',
    width: '600px',
    maxWidth: '100%',
  },

  // Header styles
  header: {
    backgroundColor: '#ea580c',
    padding: '30px',
    textAlign: 'center' as const,
    borderRadius: '8px 8px 0 0',
  },

  successHeader: {
    backgroundColor: '#059669',
    padding: '30px',
    textAlign: 'center' as const,
    borderRadius: '8px 8px 0 0',
  },

  warningHeader: {
    backgroundColor: '#f59e0b',
    padding: '30px',
    textAlign: 'center' as const,
    borderRadius: '8px 8px 0 0',
  },

  errorHeader: {
    backgroundColor: '#dc2626',
    padding: '30px',
    textAlign: 'center' as const,
    borderRadius: '8px 8px 0 0',
  },

  headerTitle: {
    color: '#ffffff',
    fontSize: '28px',
    fontWeight: 'bold',
    margin: '0',
    lineHeight: '1.2',
  },

  // Content styles
  content: {
    padding: '30px',
  },

  h1: {
    color: '#1f2937',
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0 0 20px 0',
    lineHeight: '1.3',
  },

  text: {
    color: '#374151',
    fontSize: '16px',
    lineHeight: '1.6',
    margin: '0 0 20px 0',
  },

  // Section styles
  projectSection: {
    backgroundColor: '#f3f4f6',
    padding: '20px',
    borderRadius: '8px',
    margin: '20px 0',
  },

  successSection: {
    backgroundColor: '#ecfdf5',
    padding: '20px',
    borderRadius: '8px',
    margin: '20px 0',
    borderLeft: '4px solid #059669',
  },

  warningSection: {
    backgroundColor: '#fef3c7',
    padding: '20px',
    borderRadius: '8px',
    margin: '20px 0',
    borderLeft: '4px solid #f59e0b',
  },

  errorSection: {
    backgroundColor: '#fef2f2',
    padding: '20px',
    borderRadius: '8px',
    margin: '20px 0',
    borderLeft: '4px solid #dc2626',
  },

  credentialsSection: {
    backgroundColor: '#dbeafe',
    padding: '20px',
    borderRadius: '8px',
    margin: '20px 0',
    borderLeft: '4px solid #3b82f6',
  },

  securitySection: {
    backgroundColor: '#fef2f2',
    padding: '20px',
    borderRadius: '8px',
    margin: '20px 0',
    borderLeft: '4px solid #ef4444',
  },

  infoSection: {
    backgroundColor: '#f0f9ff',
    padding: '20px',
    borderRadius: '8px',
    margin: '20px 0',
  },

  neutralSection: {
    backgroundColor: '#f3f4f6',
    padding: '20px',
    borderRadius: '8px',
    margin: '20px 0',
  },

  stepsSection: {
    backgroundColor: '#f9fafb',
    padding: '20px',
    borderRadius: '8px',
    margin: '20px 0',
  },

  // Typography styles
  sectionTitle: {
    color: '#1f2937',
    fontSize: '18px',
    fontWeight: 'bold',
    margin: '0 0 15px 0',
  },

  stepsTitle: {
    color: '#374151',
    fontSize: '18px',
    fontWeight: 'bold',
    margin: '0 0 10px 0',
  },

  infoTitle: {
    color: '#0369a1',
    fontSize: '18px',
    fontWeight: 'bold',
    margin: '0 0 10px 0',
  },

  neutralTitle: {
    color: '#374151',
    fontSize: '18px',
    fontWeight: 'bold',
    margin: '0 0 10px 0',
  },

  securityTitle: {
    color: '#dc2626',
    fontSize: '18px',
    fontWeight: 'bold',
    margin: '0 0 10px 0',
  },

  // Text styles
  projectText: {
    color: '#1f2937',
    fontSize: '14px',
    margin: '5px 0',
  },

  detailText: {
    color: '#374151',
    fontSize: '14px',
    margin: '5px 0',
  },

  credentialText: {
    color: '#1e40af',
    fontSize: '14px',
    margin: '5px 0',
  },

  warningText: {
    color: '#92400e',
    fontSize: '14px',
    margin: '0',
  },

  errorText: {
    color: '#7f1d1d',
    fontSize: '14px',
    margin: '0',
  },

  securityText: {
    color: '#7f1d1d',
    fontSize: '14px',
    margin: '0',
  },

  stepText: {
    color: '#6b7280',
    fontSize: '14px',
    margin: '5px 0',
  },

  helpText: {
    color: '#6b7280',
    fontSize: '14px',
    lineHeight: '1.5',
    margin: '30px 0 0 0',
  },

  farewellText: {
    color: '#374151',
    fontSize: '16px',
    lineHeight: '1.6',
    margin: '30px 0',
  },

  contactText: {
    color: '#6b7280',
    fontSize: '14px',
    margin: '20px 0',
  },

  // Special elements
  passwordCode: {
    backgroundColor: '#f1f5f9',
    padding: '4px 8px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '14px',
  },

  link: {
    color: '#3b82f6',
    textDecoration: 'underline',
  },

  // Button styles
  buttonSection: {
    textAlign: 'center' as const,
    margin: '30px 0',
  },

  button: {
    backgroundColor: '#ea580c',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 'bold',
    padding: '15px 30px',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
  },

  successButton: {
    backgroundColor: '#059669',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 'bold',
    padding: '15px 30px',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
  },

  // Layout elements
  hr: {
    borderColor: '#e5e7eb',
    margin: '30px 0',
  },

  footer: {
    color: '#9ca3af',
    fontSize: '14px',
    textAlign: 'center' as const,
    margin: '0',
  },
}