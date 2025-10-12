"use client"

import Link from "next/link"
import { Building2, Loader2 } from "lucide-react"
import { Suspense } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { useEmailVerification } from "@/hooks/auth/use-email-verification"
import { LoadingState } from "./components/LoadingState"
import { ReadyState } from "./components/ReadyState"
import { SuccessState } from "./components/SuccessState"
import { ErrorState } from "./components/ErrorState"
import { AlreadyVerifiedState } from "./components/AlreadyVerifiedState"

// Component that uses useSearchParams - wrapped in Suspense
function VerifyEmailForm() {
  const {
    state,
    result,
    isVerifying,
    isResending,
    message,
    canResend,
    canVerify,
    canAccessDashboard,
    handleVerifyEmail,
    resendVerificationEmail,
    goToDashboard,
    goToLogin,
    goHome,
  } = useEmailVerification()

  const renderContent = () => {
    switch (state) {
      case 'ready':
        return (
          <ReadyState
            message={message}
            onVerifyEmail={handleVerifyEmail}
            isVerifying={isVerifying}
            canVerify={canVerify}
          />
        )
      
      case 'loading':
        return <LoadingState />
      
      case 'success':
        return (
          <SuccessState
            message={message}
            userEmail={result?.data?.user?.email}
            onGoToDashboard={goToDashboard}
            onGoToLogin={goToLogin}
            canAccessDashboard={canAccessDashboard}
          />
        )
      
      case 'already-verified':
        return (
          <AlreadyVerifiedState
            message={message}
            userEmail={result?.data?.user?.email}
            onGoToDashboard={goToDashboard}
            onGoToLogin={goToLogin}
          />
        )
      
      case 'error':
      case 'expired':
      case 'invalid':
        return (
          <ErrorState
            message={message}
            canResend={canResend}
            isResending={isResending}
            onResendEmail={resendVerificationEmail}
            onGoHome={goHome}
            onGoToLogin={goToLogin}
          />
        )
      
      default:
        return <LoadingState />
    }
  }

  return (
    <div className="w-full max-w-md space-y-6 sm:space-y-8">
      {/* Header - Mobile Optimized */}
      <div className="text-center">
        <Link href="/" className="flex items-center justify-center mb-4 sm:mb-6">
          <Building2 className="h-7 w-7 sm:h-8 sm:w-8 text-orange-600" />
          <span className="ml-2 text-xl sm:text-2xl font-bold text-gray-900">CrewBudAI</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Email Verification
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          {state === 'ready' 
            ? "Complete your account setup by verifying your email"
            : "Verifying your email address to activate your account"
          }
        </p>
      </div>

      {/* Content */}
      {renderContent()}

      {/* Footer - Mobile Optimized */}
      <div className="text-center px-4">
        <p className="text-sm text-gray-600">
          Need help?{" "}
          <Link href="/contact" className="font-medium text-orange-600 hover:text-orange-500">
            Contact Support
          </Link>
        </p>
      </div>
    </div>
  )
}

// Loading fallback component - Mobile Optimized
function VerifyEmailLoading() {
  return (
    <div className="w-full max-w-md space-y-6 sm:space-y-8">
      <div className="text-center">
        <Link href="/" className="flex items-center justify-center mb-4 sm:mb-6">
          <Building2 className="h-7 w-7 sm:h-8 sm:w-8 text-orange-600" />
          <span className="ml-2 text-xl sm:text-2xl font-bold text-gray-900">CrewBudAI</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Email Verification
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Loading...
        </p>
      </div>
      <Card className="w-full shadow-sm">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600 mx-auto" />
            <p className="text-sm text-gray-600">Please wait...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Main page component with Suspense wrapper - Mobile Optimized
export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<VerifyEmailLoading />}>
        <VerifyEmailForm />
      </Suspense>
    </div>
  )
}