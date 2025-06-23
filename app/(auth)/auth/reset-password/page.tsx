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

  // Loading state while verifying token
  if (isTokenLoading) {
    return (
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="flex items-center justify-center mb-6">
            <Building2 className="h-8 w-8 text-orange-600" />
            <span className="ml-2 text-2xl font-bold text-gray-900">CrewBudAI</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Verifying Reset Link
          </h1>
        </div>

        <Card className="w-full">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600 mb-4" />
            <p className="text-gray-600 text-center">
              Please wait while we verify your password reset link...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Invalid or expired token state
  if (isTokenInvalid) {
    return (
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="flex items-center justify-center mb-6">
            <Building2 className="h-8 w-8 text-orange-600" />
            <span className="ml-2 text-2xl font-bold text-gray-900">CrewBudAI</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isTokenExpired ? 'Link Expired' : 'Invalid Link'}
          </h1>
          <p className="text-sm text-gray-600">
            {isTokenExpired 
              ? 'This password reset link has expired'
              : 'This password reset link is invalid or has been used'
            }
          </p>
        </div>

        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              {isTokenExpired ? (
                <Clock className="h-6 w-6 text-red-600" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {isTokenExpired ? 'Link Expired' : 'Invalid Link'}
            </CardTitle>
            <CardDescription>
              {tokenResult?.message || 'The password reset link is no longer valid.'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">What happened?</h3>
              <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                {isTokenExpired ? (
                  <>
                    <li>Password reset links expire after 1 hour for security</li>
                    <li>This link was created more than 1 hour ago</li>
                  </>
                ) : (
                  <>
                    <li>The link may have been used already</li>
                    <li>The link might be corrupted or incomplete</li>
                    <li>The link may have been tampered with</li>
                  </>
                )}
              </ul>
            </div>

            <div className="space-y-2">
              <Button 
                className="w-full bg-orange-600 hover:bg-orange-700"
                onClick={goToForgotPassword}
              >
                <KeyRound className="mr-2 h-4 w-4" />
                Request New Reset Link
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={goToLogin}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
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

  // Success state
  if (isResetSuccess) {
    return (
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="flex items-center justify-center mb-6">
            <Building2 className="h-8 w-8 text-orange-600" />
            <span className="ml-2 text-2xl font-bold text-gray-900">CrewBudAI</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Password Reset!
          </h1>
          <p className="text-sm text-gray-600">
            Your password has been successfully updated
          </p>
        </div>

        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Success!</CardTitle>
            <CardDescription className="space-y-2">
              <p>{message}</p>
              {resetResult?.notifications?.confirmationEmailSent && (
                <p className="text-sm text-muted-foreground">
                  {resetResult.notifications.confirmationEmailSent}
                </p>
              )}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Security notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Security Notice</h3>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>All previous sessions have been logged out</li>
                <li>You'll need to sign in with your new password</li>
                <li>Consider enabling two-factor authentication</li>
              </ul>
            </div>

            <div className="text-center text-sm text-gray-600">
              <p>Redirecting to login page in a few seconds...</p>
            </div>

            <Button 
              className="w-full bg-orange-600 hover:bg-orange-700"
              onClick={goToLogin}
            >
              Continue to Login
            </Button>
          </CardContent>
        </Card>

        <div className="text-center">
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

  // Main reset password form (when token is valid)
  return (
    <div className="w-full max-w-md space-y-8">
      {/* Header */}
      <div className="text-center">
        <Link href="/" className="flex items-center justify-center mb-6">
          <Building2 className="h-8 w-8 text-orange-600" />
          <span className="ml-2 text-2xl font-bold text-gray-900">CrewBudAI</span>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Reset Password
        </h1>
        <p className="text-sm text-gray-600">
          Enter your new password to complete the reset
        </p>
      </div>

      {/* Form Card */}
      <Card className="w-full">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Create New Password</CardTitle>
          <CardDescription className="text-center space-y-1">
            {userName && (
              <p>Welcome back, <span className="font-medium">{userName}</span></p>
            )}
            {userEmail && (
              <p className="text-xs text-muted-foreground">
                Resetting password for: {userEmail}
              </p>
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {(message && isResetError) && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {message}
                </AlertDescription>
              </Alert>
            )}

            {/* New Password Field */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
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
                  className={`pl-10 pr-10 ${
                    errors.newPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''
                  }`}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('password')}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.newPassword}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
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
                  className={`pl-10 pr-10 ${
                    errors.confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''
                  }`}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Password Requirements */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-800 mb-2">Password Requirements:</h3>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>At least 8 characters long</li>
                <li>Contains uppercase and lowercase letters</li>
                <li>Contains at least one number</li>
                <li>Contains at least one special character</li>
              </ul>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
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

            {/* Back to Login */}
            <div className="text-center">
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

      {/* Footer */}
      <div className="text-center">
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

// Loading fallback component
function ResetPasswordLoading() {
  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <Link href="/" className="flex items-center justify-center mb-6">
          <Building2 className="h-8 w-8 text-orange-600" />
          <span className="ml-2 text-2xl font-bold text-gray-900">CrewBudAI</span>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Reset Password
        </h1>
        <p className="text-sm text-gray-600">
          Loading...
        </p>
      </div>
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
        </CardContent>
      </Card>
    </div>
  )
}

// Main page component with Suspense wrapper
export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <Suspense fallback={<ResetPasswordLoading />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}