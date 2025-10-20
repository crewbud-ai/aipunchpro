// ==============================================
// lib/utils/auth-helpers.ts - Shared Authentication Helper Functions
// ==============================================

import { NextRequest } from 'next/server'
import { headers } from 'next/headers'
import { AuthDatabaseService } from '@/lib/database/services'

// ==============================================
// CREATE USER SESSION
// ==============================================
export async function createUserSession(
  userId: string,
  request: NextRequest,
  authDatabaseService: AuthDatabaseService,
  rememberMe: boolean = false
) {
  // Get client IP and User-Agent
  const headersList = headers()
  const userAgent = headersList.get('user-agent') || ''
  const forwarded = headersList.get('x-forwarded-for')
  const realIp = headersList.get('x-real-ip')
  const ipAddress = forwarded?.split(',')[0] || realIp || '127.0.0.1'

  // Generate session token
  const token = generateSessionToken()

  // Set session duration based on rememberMe
  const sessionDuration = rememberMe
    ? 30 * 24 * 60 * 60 * 1000 // 30 days
    : 24 * 60 * 60 * 1000 // 24 hours

  const expiresAt = new Date(Date.now() + sessionDuration)

  // Save session to database
  await authDatabaseService.createUserSession({
    userId,
    token,
    ipAddress,
    userAgent,
    expiresAt,
  })

  return {
    token,
    expiresAt: expiresAt.toISOString(),
  }
}

// ==============================================
// GENERATE SESSION TOKEN
// ==============================================
export function generateSessionToken(): string {
  // Generate a secure random token
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}