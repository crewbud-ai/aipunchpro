// ==============================================
// src/lib/email/utils/tokens.ts - Email Token Utilities
// ==============================================

import { emailConfig } from '../client'

// ==============================================
// TOKEN GENERATION
// ==============================================
export function generateVerificationToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

export function generatePasswordResetToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// ==============================================
// PASSWORD GENERATION
// ==============================================
export function generateRandomPassword(length: number = 12): string {
  // Character sets for password generation
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*'
  
  // Ensure at least one character from each set
  const allChars = lowercase + uppercase + numbers + symbols
  let password = ''
  
  // Guarantee at least one character from each set
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Shuffle the password to avoid predictable patterns
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

export function generateSecurePassword(): string {
  return generateRandomPassword(12)
}

// ==============================================
// URL GENERATION
// ==============================================
export function generateVerificationUrl(token: string): string {
  return `${emailConfig.baseUrl}/auth/verify-email?token=${token}`
}

export function generatePasswordResetUrl(token: string): string {
  return `${emailConfig.baseUrl}/auth/reset-password?token=${token}`
}

export function generateLoginUrl(): string {
  return `${emailConfig.baseUrl}/dashboard`
}

export function generateDashboardUrl(): string {
  return `${emailConfig.baseUrl}/dashboard`
}

export function generateInviteUrl(token: string): string {
  return `${emailConfig.baseUrl}/auth/accept-invite?token=${token}`
}

export function generateProjectUrl(projectId: string): string {
  return `${emailConfig.baseUrl}/dashboard/projects/${projectId}`
}

export function generateTeamMemberUrl(userId: string): string {
  return `${emailConfig.baseUrl}/dashboard/teams/${userId}`
}