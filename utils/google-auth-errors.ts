// ==============================================
// utils/google-auth-errors.ts - Professional Google OAuth Error Messages
// ==============================================

export const GOOGLE_AUTH_ERRORS = {
  // User-friendly messages that don't expose system details
  NoCompanyFound: {
    title: "Account Setup Required",
    description: "We couldn't find your organization in our system. Please contact your administrator to set up your company account first, or sign up as a new organization.",
    variant: "default" as const,
  },
  EmailAlreadyExists: {
    title: "Email Already Registered",
    description: "This email is already registered with a password. Please sign in using your email and password instead.",
    variant: "destructive" as const,
  },
  GoogleAuthFailed: {
    title: "Sign In Cancelled",
    description: "Google sign-in was cancelled or failed. Please try again.",
    variant: "default" as const,
  },
  TokenExchangeFailed: {
    title: "Authentication Error",
    description: "We couldn't complete the sign-in process. Please try again in a moment.",
    variant: "destructive" as const,
  },
  GoogleUserInfoFailed: {
    title: "Profile Access Error",
    description: "We couldn't retrieve your Google profile information. Please try again.",
    variant: "destructive" as const,
  },
  ServerError: {
    title: "Something Went Wrong",
    description: "We encountered an unexpected error. Please try again, or contact support if the problem persists.",
    variant: "destructive" as const,
  },
  // Default fallback
  Unknown: {
    title: "Sign In Error",
    description: "An unexpected error occurred during sign-in. Please try again.",
    variant: "destructive" as const,
  },
} as const

export type GoogleAuthErrorKey = keyof typeof GOOGLE_AUTH_ERRORS

export function getGoogleAuthError(errorKey: string): typeof GOOGLE_AUTH_ERRORS[GoogleAuthErrorKey] {
  return GOOGLE_AUTH_ERRORS[errorKey as GoogleAuthErrorKey] || GOOGLE_AUTH_ERRORS.Unknown
}