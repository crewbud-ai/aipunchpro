// ==============================================
// src/lib/email/templates/welcome.tsx - Welcome Email Template
// ==============================================

import React from 'react'
import { emailConfig } from '../client'

interface WelcomeEmailProps {
  firstName: string
  lastName: string
  companyName: string
  verificationUrl: string
  dashboardUrl: string
  trialDays: number
}

export const WelcomeEmailTemplate: React.FC<WelcomeEmailProps> = ({
  firstName,
  lastName,
  companyName,
  verificationUrl,
  dashboardUrl,
  trialDays
}) => (
  <html>
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Welcome to CrewBudAI</title>
    </head>
    <body style={{ margin: 0, padding: 0, fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #ea580c 0%, #2563eb 100%)',
          padding: '40px 20px',
          textAlign: 'center' as const
        }}>
          <h1 style={{
            color: 'white',
            margin: 0,
            fontSize: '28px',
            fontWeight: 'bold'
          }}>
            🏗️ Welcome to CrewBudAI!
          </h1>
          <p style={{
            color: 'rgba(255, 255, 255, 0.9)',
            margin: '10px 0 0 0',
            fontSize: '16px'
          }}>
            Construction Project Management Made Simple
          </p>
        </div>

        {/* Main Content */}
        <div style={{ padding: '40px 20px', backgroundColor: '#f9fafb' }}>
          <h2 style={{ color: '#1f2937', marginBottom: '20px', fontSize: '24px' }}>
            Hi {firstName} {lastName}! 👋
          </h2>
          
          <p style={{ color: '#4b5563', fontSize: '16px', lineHeight: '1.6', marginBottom: '20px' }}>
            Welcome to CrewBudAI! Your company account for <strong>{companyName}</strong> has been successfully created.
            Your {trialDays}-day free trial is now active and ready to streamline your construction projects.
          </p>

          {/* Verification Section */}
          <div style={{
            backgroundColor: '#fef3cd',
            padding: '20px',
            borderRadius: '8px',
            margin: '30px 0',
            borderLeft: '4px solid #fbbf24'
          }}>
            <h3 style={{ color: '#92400e', marginTop: 0, fontSize: '18px' }}>
              ⚠️ Action Required: Verify Your Email
            </h3>
            <p style={{ color: '#92400e', margin: '10px 0', fontSize: '14px' }}>
              To unlock all features and secure your account, please verify your email address:
            </p>
            <div style={{ textAlign: 'center' as const, margin: '20px 0' }}>
              <a 
                href={verificationUrl}
                style={{
                  backgroundColor: '#ea580c',
                  color: 'white',
                  padding: '12px 24px',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  display: 'inline-block'
                }}
              >
                Verify Email Address
              </a>
            </div>
            <p style={{ color: '#92400e', margin: 0, fontSize: '12px', textAlign: 'center' as const }}>
              This link expires in 24 hours
            </p>
          </div>

          {/* Quick Access */}
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            margin: '30px 0',
            textAlign: 'center' as const
          }}>
            <h3 style={{ color: '#1f2937', marginTop: 0, fontSize: '18px' }}>
              🚀 Start Building Right Away
            </h3>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '10px 0 20px 0' }}>
              You can access your dashboard immediately (some features will be limited until email verification)
            </p>
            <a 
              href={dashboardUrl}
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                padding: '12px 24px',
                textDecoration: 'none',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '14px',
                display: 'inline-block'
              }}
            >
              Go to Dashboard →
            </a>
          </div>

          {/* What's Next Section */}
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            margin: '30px 0'
          }}>
            <h3 style={{ color: '#1f2937', marginTop: 0, fontSize: '20px' }}>
              🎯 What's Next?
            </h3>
            <ul style={{ color: '#4b5563', lineHeight: '1.8', paddingLeft: '20px' }}>
              <li>✅ Verify your email address (important!)</li>
              <li>🏗️ Set up your first construction project</li>
              <li>📋 Create your task punchlist</li>
              <li>👥 Invite your team members and foremen</li>
              <li>⏱️ Start tracking time and progress</li>
              <li>📅 Explore drag-and-drop scheduling</li>
            </ul>
          </div>

          {/* Features Highlight */}
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            margin: '30px 0'
          }}>
            <h3 style={{ color: '#1f2937', marginTop: 0, fontSize: '18px' }}>
              🛠️ Built for Construction Professionals
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <h4 style={{ color: '#ea580c', margin: '0 0 8px 0', fontSize: '14px' }}>
                  📋 Digital Punchlist
                </h4>
                <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>
                  Replace clipboards with smart task tracking
                </p>
              </div>
              <div>
                <h4 style={{ color: '#ea580c', margin: '0 0 8px 0', fontSize: '14px' }}>
                  📅 Smart Scheduling
                </h4>
                <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>
                  Drag-and-drop crew scheduling
                </p>
              </div>
              <div>
                <h4 style={{ color: '#ea580c', margin: '0 0 8px 0', fontSize: '14px' }}>
                  ⏱️ Time Tracking
                </h4>
                <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>
                  Track hours and manage payroll
                </p>
              </div>
              <div>
                <h4 style={{ color: '#ea580c', margin: '0 0 8px 0', fontSize: '14px' }}>
                  📱 Mobile Ready
                </h4>
                <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>
                  Works perfectly on tablets and phones
                </p>
              </div>
            </div>
          </div>

          {/* Support */}
          <p style={{
            color: '#6b7280',
            fontSize: '14px',
            textAlign: 'center' as const,
            marginTop: '40px'
          }}>
            Need help getting started? <br />
            Reply to this email or contact our support team at {emailConfig.replyTo}
          </p>
        </div>

        {/* Footer */}
        <div style={{
          backgroundColor: '#1f2937',
          padding: '20px',
          textAlign: 'center' as const
        }}>
          <p style={{
            color: '#9ca3af',
            margin: 0,
            fontSize: '14px'
          }}>
            © 2025 CrewBudAI. Built for construction professionals.
          </p>
          <p style={{
            color: '#6b7280',
            margin: '10px 0 0 0',
            fontSize: '12px'
          }}>
            This email was sent because you signed up for CrewBudAI. <br />
            If you didn't create this account, please ignore this email.
          </p>
        </div>
      </div>
    </body>
  </html>
)