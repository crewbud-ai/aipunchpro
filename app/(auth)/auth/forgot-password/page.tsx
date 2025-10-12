"use client"

import Link from "next/link"
import { Building2, Mail, AlertCircle, CheckCircle, ArrowLeft, Loader2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useForgotPassword } from "@/hooks/auth/use-forgot-password"

export default function ForgotPasswordPage() {
  const {
    state,
    result,
    errors,
    formData,
    isLoading,
    isSuccess,
    isError,
    isRateLimited,
    hasErrors,
    canSubmit,
    message,
    submitForgotPassword,
    updateFormData,
    clearFieldError,
    resetForm,
    goToLogin,
    goToSignup,
    goHome,
  } = useForgotPassword()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await submitForgotPassword()
  }

  const handleTryAgain = () => {
    resetForm()
  }

  // Success state component - Mobile Optimized
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-6 sm:space-y-8">
          {/* Header - Mobile Optimized */}
          <div className="text-center">
            <Link href="/" className="flex items-center justify-center mb-4 sm:mb-6">
              <Building2 className="h-7 w-7 sm:h-8 sm:w-8 text-orange-600" />
              <span className="ml-2 text-xl sm:text-2xl font-bold text-gray-900">CrewBudAI</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Check Your Email
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              We've sent password reset instructions to your email
            </p>
          </div>

          {/* Success Card - Mobile Optimized */}
          <Card className="w-full shadow-sm">
            <CardHeader className="text-center px-4 sm:px-6">
              <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-7 w-7 sm:h-8 sm:w-8 text-green-600" />
              </div>
              <CardTitle className="text-xl sm:text-2xl">Email Sent!</CardTitle>
              <CardDescription className="space-y-3 sm:space-y-4 text-sm sm:text-base">
                <p className="break-words">{message}</p>
                <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200 text-left">
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs sm:text-sm text-blue-800 flex-1 min-w-0">
                      <p className="font-medium mb-1">Check your inbox</p>
                      <p>
                        Click the link in the email to reset your password. The link expires in 1 hour.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-amber-50 p-3 sm:p-4 rounded-lg border border-amber-200 text-left">
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs sm:text-sm text-amber-800 flex-1 min-w-0">
                      Didn't receive it? Check your spam folder or request a new link.
                    </p>
                  </div>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-4 sm:px-6 pb-6">
              <Button 
                className="w-full bg-orange-600 hover:bg-orange-700 h-11 sm:h-12 text-base" 
                onClick={handleTryAgain}
              >
                Send Another Email
              </Button>
              <Button 
                variant="outline" 
                className="w-full h-11 sm:h-12 text-base"
                onClick={goToLogin}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Main form - Mobile Optimized
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 sm:space-y-8">
        {/* Header - Mobile Optimized */}
        <div className="text-center">
          <Link href="/" className="flex items-center justify-center mb-4 sm:mb-6">
            <Building2 className="h-7 w-7 sm:h-8 sm:w-8 text-orange-600" />
            <span className="ml-2 text-xl sm:text-2xl font-bold text-gray-900">CrewBudAI</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Forgot Password?
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            No worries, we'll send you reset instructions
          </p>
        </div>

        {/* Form Card - Mobile Optimized */}
        <Card className="w-full shadow-sm">
          <CardContent className="pt-6 px-4 sm:px-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* Error/Rate Limit Messages - Mobile Optimized */}
              {(isError || isRateLimited) && message && (
                <Alert className={`${
                  isRateLimited ? 'border-amber-200 bg-amber-50' : 'border-red-200 bg-red-50'
                }`}>
                  <div className="flex items-start space-x-2">
                    {isRateLimited ? (
                      <Clock className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    )}
                    <AlertDescription className={`text-sm flex-1 min-w-0 break-words ${
                      isRateLimited ? 'text-amber-800' : 'text-red-800'
                    }`}>
                      {message}
                    </AlertDescription>
                  </div>
                </Alert>
              )}

              {/* Email Field - Mobile Optimized */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm sm:text-base">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    onFocus={() => clearFieldError('email')}
                    disabled={isLoading}
                    className={`pl-10 h-11 sm:h-12 text-base ${
                      errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''
                    }`}
                    autoComplete="email"
                    required
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600 flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="break-words">{errors.email}</span>
                  </p>
                )}
              </div>

              {/* Submit Button - Mobile Optimized */}
              <Button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white h-11 sm:h-12 text-base"
                disabled={!canSubmit}
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Reset Email...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Reset Email
                  </>
                )}
              </Button>

              {/* Info - Mobile Optimized */}
              <div className="text-center text-xs sm:text-sm text-gray-600 space-y-1">
                <p>We'll send you a secure link to reset your password.</p>
                <p>The link will expire in 1 hour for security.</p>
              </div>

              {/* Back to Login - Mobile Optimized */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={goToLogin}
                  className="text-sm font-medium text-orange-600 hover:text-orange-500 focus:outline-none focus:underline inline-flex items-center"
                  disabled={isLoading}
                >
                  <ArrowLeft className="mr-1 h-3 w-3" />
                  Back to Login
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Sign Up Link - Mobile Optimized */}
        {/* <div className="text-center px-4">
          <p className="text-sm sm:text-base text-gray-600">
            Don't have an account?{" "}
            <button
              onClick={goToSignup}
              className="font-medium text-orange-600 hover:text-orange-500 focus:outline-none focus:underline"
            >
              Sign up for free
            </button>
          </p>
        </div> */}

        {/* Footer - Mobile Optimized */}
        {/* <div className="text-center px-4">
          <p className="text-sm text-gray-600">
            Need help?{" "}
            <Link href="/contact" className="font-medium text-orange-600 hover:text-orange-500">
              Contact Support
            </Link>
          </p>
        </div> */}
      </div>
    </div>
  )
}