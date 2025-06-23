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

  // Success state component
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <Link href="/" className="flex items-center justify-center mb-6">
              <Building2 className="h-8 w-8 text-orange-600" />
              <span className="ml-2 text-2xl font-bold text-gray-900">CrewBudAI</span>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Check Your Email
            </h1>
            <p className="text-sm text-gray-600">
              We've sent password reset instructions to your email
            </p>
          </div>

          {/* Success Card */}
          <Card className="w-full">
            <CardHeader className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Email Sent!</CardTitle>
              <CardDescription className="space-y-2">
                <p>{message}</p>
                <p className="text-sm text-muted-foreground">
                  Email sent to: <span className="font-medium">{formData.email}</span>
                </p>
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Next Steps:</h3>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Check your email inbox for a message from CrewBudAI</li>
                  <li>Click the "Reset Password" link in the email</li>
                  <li>Follow the instructions to create a new password</li>
                  <li>Sign in with your new password</li>
                </ol>
              </div>

              {/* Additional info */}
              <div className="text-center text-sm text-gray-600">
                <p>Didn't receive the email? Check your spam folder.</p>
                <p className="mt-2">
                  The reset link will expire in <span className="font-medium">1 hour</span>.
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleTryAgain}
                >
                  Send Another Email
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
      </div>
    )
  }

  // Main form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="flex items-center justify-center mb-6">
            <Building2 className="h-8 w-8 text-orange-600" />
            <span className="ml-2 text-2xl font-bold text-gray-900">CrewBudAI</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Forgot Password?
          </h1>
          <p className="text-sm text-gray-600">
            No worries! Enter your email and we'll send you reset instructions.
          </p>
        </div>

        {/* Form Card */}
        <Card className="w-full">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Reset Password</CardTitle>
            <CardDescription className="text-center">
              Enter your email address and we'll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error/Rate Limited Message */}
              {(message && isError) && (
                <Alert className={`${
                  isRateLimited ? 'border-yellow-200 bg-yellow-50' : 'border-red-200 bg-red-50'
                }`}>
                  <div className="flex items-start space-x-2">
                    {isRateLimited ? (
                      <Clock className="h-4 w-4 text-yellow-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    )}
                    <AlertDescription className={`${
                      isRateLimited ? 'text-yellow-800' : 'text-red-800'
                    }`}>
                      {message}
                    </AlertDescription>
                  </div>
                </Alert>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    onFocus={() => clearFieldError('email')}
                    disabled={isLoading}
                    className={`pl-10 ${
                      errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''
                    }`}
                    autoComplete="email"
                    required
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
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

              {/* Info */}
              <div className="text-center text-sm text-gray-600">
                <p>We'll send you a secure link to reset your password.</p>
                <p className="mt-1">The link will expire in 1 hour for security.</p>
              </div>

              {/* Back to Login */}
              <div className="text-center">
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

        {/* Sign Up Link */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <button
              onClick={goToSignup}
              className="font-medium text-orange-600 hover:text-orange-500 focus:outline-none focus:underline"
            >
              Sign up for free
            </button>
          </p>
        </div>

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
    </div>
  )
}