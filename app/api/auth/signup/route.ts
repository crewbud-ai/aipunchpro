import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { 
  validateCompleteSignup, 
  formatValidationErrors,
} from '@/lib/validations/auth/auth'
import { AuthDatabaseService } from '@/lib/database/services'
import { authEmailService } from '@/lib/email/index'
import { generateVerificationToken, generateVerificationUrl } from '@/lib/email/utils/tokens'

// ==============================================
// POST /api/auth/signup - Complete Company + User Signup with Email
// ==============================================
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    
    // Validate input data
    const validation = validateCompleteSignup(body)
    
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: formatValidationErrors(validation.error),
        },
        { status: 400 }
      )
    }

    const { company, user } = validation.data

    // 🔧 FIX: Create service instance within request context
    const authDatabaseService = new AuthDatabaseService(true, false) // server-side, not admin

    // Check if company slug already exists
    const existingCompany = await authDatabaseService.getCompanyBySlug(company.slug)
    if (existingCompany) {
      return NextResponse.json(
        {
          success: false,
          error: 'Company slug already exists',
          details: [{ field: 'company.slug', message: 'This company URL is already taken' }],
        },
        { status: 409 }
      )
    }

    // Check if user email already exists
    const existingUser = await authDatabaseService.getUserByEmail(user.email)
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email already exists',
          details: [{ field: 'user.email', message: 'An account with this email already exists' }],
        },
        { status: 409 }
      )
    }

    // Create company
    const newCompany = await authDatabaseService.createCompany({
      name: company.name,
      slug: company.slug,
      industry: company.industry,
      size: company.size,
    })

    // Create admin user
    const newUser = await authDatabaseService.createUser({
      company_id: newCompany.id,
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      role: 'admin', // First user is always admin
      phone: user.phone || null,
      password: user.password
    })

    // Generate email verification token
    const verificationToken = generateVerificationToken()
    const verificationUrl = generateVerificationUrl(verificationToken)
    
    // Save verification token to database
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    await authDatabaseService.createEmailVerification({
      userId: newUser.id,
      token: verificationToken,
      expiresAt: tokenExpiresAt,
    })

    // Send welcome email with verification
    const emailResult = await authEmailService.sendWelcomeEmail({
      email: newUser.email,
      firstName: newUser.first_name,
      lastName: newUser.last_name,
      companyName: newCompany.name,
      verificationUrl,
    })

    // Log email result but don't fail signup if email fails
    if (!emailResult.success) {
      console.error('Failed to send welcome email:', emailResult.error)
      // We'll continue with successful signup but note the email failure
    }

    // Create user session
    const session = await createUserSession(newUser.id, request, authDatabaseService)

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully',
        data: {
          company: {
            id: newCompany.id,
            name: newCompany.name,
            slug: newCompany.slug,
            industry: newCompany.industry,
            size: newCompany.size,
          },
          user: {
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.first_name,
            lastName: newUser.last_name,
            role: newUser.role,
            phone: newUser.phone,
            emailVerified: false, // New user, email not verified yet
          },
          session: {
            token: session.token,
            expiresAt: session.expiresAt,
          },
          emailSent: emailResult.success,
        },
        notifications: {
          // User feedback about email status
          emailVerification: emailResult.success 
            ? 'A verification email has been sent to your inbox'
            : 'Account created successfully, but we had trouble sending the verification email. You can request a new one from your dashboard.',
        },
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Signup error:', error)

    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('duplicate key')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Duplicate entry',
            message: 'Company or email already exists',
          },
          { status: 409 }
        )
      }
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong. Please try again.',
      },
      { status: 500 }
    )
  }
}

// ==============================================
// HELPER FUNCTIONS
// ==============================================

async function createUserSession(
  userId: string, 
  request: NextRequest, 
  authDatabaseService: AuthDatabaseService
) {
  // Get client IP and User-Agent
  const headersList = headers()
  const userAgent = headersList.get('user-agent') || ''
  const forwarded = headersList.get('x-forwarded-for')
  const realIp = headersList.get('x-real-ip')
  const ipAddress = forwarded?.split(',')[0] || realIp || '127.0.0.1'

  // Generate session token
  const token = generateSessionToken()
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

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

function generateSessionToken(): string {
  // Generate a secure random token
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// ==============================================
// ALLOWED METHODS
// ==============================================
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}