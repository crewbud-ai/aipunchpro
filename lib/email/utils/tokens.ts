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

export function generateInviteUrl(token: string): string {
  return `${emailConfig.baseUrl}/auth/accept-invite?token=${token}`
}