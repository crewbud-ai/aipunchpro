"use client"

import Link from "next/link"
import { Building2, Eye, EyeOff, Lock, AlertCircle, CheckCircle, ArrowLeft, Loader2, KeyRound, XCircle, Clock } from "lucide-react"
import { useState, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useResetPassword } from "@/hooks/auth/use-reset-password"

// Component that uses useSearchParams - wrapped in Suspense
function ResetPasswordForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const {
    tokenState,
    resetState,
    tokenResult,
    resetResult,
    errors,
    formData,
    isTokenLoading,
    isTokenValid,
    isTokenInvalid,
    isTokenExpired,
    isResetLoading,
    isResetSuccess,
    isResetError,
    hasErrors,
    canSubmit,
    message,
    userEmail,
    userName,
    submitPasswordReset,
    updateFormData,
    clearFieldError,
    resetForm,
    goToLogin,
    goToForgotPassword,
    goHome,
  } = useResetPassword()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await submitPasswordReset()
  }

  const togglePasswordVisibility = (field: 'password' | 'confirm') => {
    if (field === 'password') {
      setShowPassword(!showPassword)
    } else {
      setShowConfirmPassword(!showConfirmPassword)
    }
  }

  // Loading state while verifying token - Mobile Optimized
  if (isTokenLoading) {
    return (
      <div className="w-full max-w-md space-y-6 sm:space-y-8">
        <div className="text-center">
          <Link href="/" className="flex items-center justify-center mb-4 sm:mb-6">
            <Building2 className="h-7 w-7 sm:h-8 sm:w-8 text-orange-600" />
            <span className="ml-2 text-xl sm:text-2xl font-bold text-gray-900">CrewBudAI</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Reset Password
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Verifying your reset link...
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

  // Invalid/Expired Token - Mobile Optimized
  if (isTokenInvalid || isTokenExpired) {
    return (
      <div className="w-full max-w-md space-y-6 sm:space-y-8">
        <div className="text-center">
          <Link href="/" className="flex items-center justify-center mb-4 sm:mb-6">
            <Building2 className="h-7 w-7 sm:h-8 sm:w-8 text-orange-600" />
            <span className="ml-2 text-xl sm:text-2xl font-bold text-gray-900">CrewBudAI</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {isTokenExpired ? 'Link Expired' : 'Invalid Link'}
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            {isTokenExpired ? 'This reset link has expired' : 'This reset link is invalid'}
          </p>
        </div>

        <Card className="w-full shadow-sm">
          <CardHeader className="text-center px-4 sm:px-6">
            <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-red-100 mb-4">
              {isTokenExpired ? (
                <Clock className="h-7 w-7 sm:h-8 sm:w-8 text-red-600" />
              ) : (
                <XCircle className="h-7 w-7 sm:h-8 sm:w-8 text-red-600" />
              )}
            </div>
            <CardTitle className="text-xl sm:text-2xl">{isTokenExpired ? 'Link Expired' : 'Invalid Link'}</CardTitle>
            <CardDescription className="text-sm sm:text-base break-words">
              {message}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-4 sm:px-6 pb-6">
            <Button 
              className="w-full bg-orange-600 hover:bg-orange-700 h-11 sm:h-12 text-base" 
              onClick={goToForgotPassword}
            >
              Request New Reset Link
            </Button>
            <Button 
              variant="outline" 
              className="w-full h-11 sm:h-12 text-base"
              onClick={goToLogin}
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success State - Mobile Optimized
  if (isResetSuccess) {
    return (
      <div className="w-full max-w-md space-y-6 sm:space-y-8">
        <div className="text-center">
          <Link href="/" className="flex items-center justify-center mb-4 sm:mb-6">
            <Building2 className="h-7 w-7 sm:h-8 sm:w-8 text-orange-600" />
            <span className="ml-2 text-xl sm:text-2xl font-bold text-gray-900">CrewBudAI</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Password Reset!
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Your password has been successfully updated
          </p>
        </div>

        <Card className="w-full shadow-sm">
          <CardHeader className="text-center px-4 sm:px-6">
            <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-7 w-7 sm:h-8 sm:w-8 text-green-600" />
            </div>
            <CardTitle className="text-xl sm:text-2xl">Success!</CardTitle>
            <CardDescription className="space-y-3 sm:space-y-4 text-sm sm:text-base">
              <p className="break-words">{message}</p>
              {resetResult?.notifications?.confirmationEmailSent && (
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {resetResult.notifications.confirmationEmailSent}
                </p>
              )}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4 px-4 sm:px-6 pb-6">
            {/* Security notice - Mobile Optimized */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Security Notice</h3>
              <ul className="text-xs sm:text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>All previous sessions have been logged out</li>
                <li>You'll need to sign in with your new password</li>
                <li>Consider enabling two-factor authentication</li>
              </ul>
            </div>

            <div className="text-center text-xs sm:text-sm text-gray-600">
              <p>Redirecting to login page in a few seconds...</p>
            </div>

            <Button 
              className="w-full bg-orange-600 hover:bg-orange-700 h-11 sm:h-12 text-base"
              onClick={goToLogin}
            >
              Continue to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main reset password form (when token is valid) - Mobile Optimized
  return (
    <div className="w-full max-w-md space-y-6 sm:space-y-8">
      {/* Header - Mobile Optimized */}
      <div className="text-center">
        <Link href="/" className="flex items-center justify-center mb-4 sm:mb-6">
          <Building2 className="h-7 w-7 sm:h-8 sm:w-8 text-orange-600" />
          <span className="ml-2 text-xl sm:text-2xl font-bold text-gray-900">CrewBudAI</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Reset Password
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Enter your new password to complete the reset
        </p>
      </div>

      {/* Form Card - Mobile Optimized */}
      <Card className="w-full shadow-sm">
        <CardHeader className="space-y-1 px-4 sm:px-6">
          <CardTitle className="text-xl sm:text-2xl text-center">Create New Password</CardTitle>
          <CardDescription className="text-center space-y-1">
            {userName && (
              <p className="text-sm sm:text-base">Welcome back, <span className="font-medium break-words">{userName}</span></p>
            )}
            {userEmail && (
              <p className="text-xs text-muted-foreground break-all">
                Resetting password for: {userEmail}
              </p>
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-4 sm:px-6">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Error Message - Mobile Optimized */}
            {(message && isResetError) && (
              <Alert className="border-red-200 bg-red-50">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <AlertDescription className="text-sm text-red-800 flex-1 min-w-0 break-words">
                    {message}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {/* New Password Field - Mobile Optimized */}
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm sm:text-base">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your new password"
                  value={formData.newPassword}
                  onChange={(e) => updateFormData('newPassword', e.target.value)}
                  onFocus={() => clearFieldError('newPassword')}
                  disabled={isResetLoading}
                  className={`pl-10 pr-10 h-11 sm:h-12 text-base ${
                    errors.newPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''
                  }`}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('password')}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none p-1"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-sm text-red-600 flex items-center mt-1">
                  <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="break-words">{errors.newPassword}</span>
                </p>
              )}
            </div>

            {/* Confirm Password Field - Mobile Optimized */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm sm:text-base">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your new password"
                  value={formData.confirmPassword}
                  onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                  onFocus={() => clearFieldError('confirmPassword')}
                  disabled={isResetLoading}
                  className={`pl-10 pr-10 h-11 sm:h-12 text-base ${
                    errors.confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''
                  }`}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none p-1"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-600 flex items-center mt-1">
                  <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="break-words">{errors.confirmPassword}</span>
                </p>
              )}
            </div>

            {/* Password Requirements - Mobile Optimized */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
              <h3 className="text-sm font-medium text-gray-800 mb-2">Password Requirements:</h3>
              <ul className="text-xs sm:text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>At least 8 characters long</li>
                <li>Contains uppercase and lowercase letters</li>
                <li>Contains at least one number</li>
                <li>Contains at least one special character</li>
              </ul>
            </div>

            {/* Submit Button - Mobile Optimized */}
            <Button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white h-11 sm:h-12 text-base"
              disabled={!canSubmit}
              size="lg"
            >
              {isResetLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting Password...
                </>
              ) : (
                <>
                  <KeyRound className="mr-2 h-4 w-4" />
                  Reset Password
                </>
              )}
            </Button>

            {/* Back to Login - Mobile Optimized */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={goToLogin}
                className="text-sm font-medium text-orange-600 hover:text-orange-500 focus:outline-none focus:underline inline-flex items-center"
                disabled={isResetLoading}
              >
                <ArrowLeft className="mr-1 h-3 w-3" />
                Back to Login
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

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
function ResetPasswordLoading() {
  return (
    <div className="w-full max-w-md space-y-6 sm:space-y-8">
      <div className="text-center">
        <Link href="/" className="flex items-center justify-center mb-4 sm:mb-6">
          <Building2 className="h-7 w-7 sm:h-8 sm:w-8 text-orange-600" />
          <span className="ml-2 text-xl sm:text-2xl font-bold text-gray-900">CrewBudAI</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Reset Password
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Loading...
        </p>
      </div>
      <Card className="w-full shadow-sm">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        </CardContent>
      </Card>
    </div>
  )
}

// Main page component with Suspense wrapper - Mobile Optimized
export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<ResetPasswordLoading />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}