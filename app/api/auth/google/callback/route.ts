// ==============================================
// app/api/auth/google/callback/route.ts
// Handles Google's response after user logs in
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import { AuthDatabaseService } from '@/lib/database/services'
import { createUserSession } from '@/utils/auth-helpers'
import { authEmailService } from '@/lib/email/index'
import { generateVerificationToken, generateVerificationUrl } from '@/lib/email/utils/tokens'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    // If user cancelled or error occurred
    if (error || !code) {
      return NextResponse.redirect(
        new URL(`/auth/login?error=${error || 'GoogleAuthFailed'}`, request.url)
      )
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    })

    const tokens = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error('❌ Token exchange failed:', tokens)
      return NextResponse.redirect(
        new URL('/auth/login?error=TokenExchangeFailed', request.url)
      )
    }

    // Get user info from Google using access token
    const userInfoResponse = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }
    )

    const googleUser = await userInfoResponse.json()

    if (!userInfoResponse.ok) {
      console.error('❌ Failed to get user info:', googleUser)
      return NextResponse.redirect(
        new URL('/auth/login?error=GoogleUserInfoFailed', request.url)
      )
    }

    console.log('✅ Google user info:', {
      email: googleUser.email,
      name: googleUser.name,
      id: googleUser.id
    })

    // Create auth service
    const authService = new AuthDatabaseService(true, true)

    // Check if user already exists by email
    let user = await authService.getUserByEmail(googleUser.email)

    if (user) {
      // User exists - check if they signed up with Google
      if (user.auth_provider !== 'google') {
        console.log('❌ User exists but used email/password signup')
        return NextResponse.redirect(
          new URL('/auth/login?error=EmailAlreadyExists', request.url)
        )
      }
      console.log('✅ Existing Google user found - logging in')
      
      // Update last login
      await authService.updateUserLastLogin(user.id)
    } else {
      // New user - create account
      console.log('🆕 Creating new Google user')
      
      // Get the first/only company
      const company = await authService.getFirstCompany()

      if (!company) {
        console.error('❌ No company found in system')
        return NextResponse.redirect(
          new URL('/auth/login?error=NoCompanyFound', request.url)
        )
      }

      // Split name into first and last
      const nameParts = googleUser.name?.split(' ') || ['', '']
      const firstName = nameParts[0] || 'User'
      const lastName = nameParts.slice(1).join(' ') || ''

      // Create user with profile_completed = false
      user = await authService.createGoogleUser({
        email: googleUser.email,
        firstName,
        lastName,
        googleId: googleUser.id,
        companyId: company.id,
        avatarUrl: googleUser.picture,
      })

      console.log('✅ New Google user created:', user.id)
    }

    // Create session using shared helper function
    const session = await createUserSession(user.id, request, authService, false)

    // Get company data
    const company = await authService.getCompanyById(user.company_id!)

    // Decide where to redirect
    const redirectPath = user.profile_completed 
      ? '/dashboard' 
      : '/auth/complete-profile'

    console.log(`✅ Redirecting to: ${redirectPath}`)

    // Create response
    const response = NextResponse.redirect(new URL(redirectPath, request.url))

    // Set cookies using YOUR existing pattern
    response.cookies.set('sessionToken', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    })

    response.cookies.set(
      'userInfo',
      JSON.stringify({
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        permissions: user.permissions,
        companyId: company?.id,
        companyName: company?.name,
      }),
      {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60,
        path: '/',
      }
    )

    return response

  } catch (error) {
    console.error('❌ Google OAuth error:', error)
    return NextResponse.redirect(
      new URL('/auth/login?error=ServerError', request.url)
    )
  }
}