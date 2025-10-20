"use client"

import Link from "next/link"
import { Building2, Eye, EyeOff, Mail, Lock, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { useState, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useLogin } from "@/hooks/auth/use-login"
import { useGoogleAuthErrors } from "@/hooks/auth/use-google-auth-errors"

// Separate component that uses useSearchParams
function LoginPageContent() {
  useGoogleAuthErrors()

  const [showPassword, setShowPassword] = useState(false)
  const {
    state,
    errors,
    formData,
    isLoading,
    isSuccess,
    isError,
    isEmailUnverified,
    hasErrors,
    canLogin,
    message,
    login,
    updateFormData,
    clearFieldError,
    resendVerificationEmail,
    goToSignup,
    goToForgotPassword,
    goToHome,
  } = useLogin()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await login()
  }

  const handleResendVerification = async () => {
    await resendVerificationEmail()
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

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
            Welcome Back
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Sign in to continue to your dashboard
          </p>
        </div>

        {/* Login Card - Mobile Optimized */}
        <Card className="w-full shadow-sm">
          <CardContent className="pt-6 px-4 sm:px-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* Status Messages - Mobile Optimized */}
              {(isSuccess || isError || isEmailUnverified) && message && (
                <Alert className={`${isSuccess ? 'border-green-200 bg-green-50' :
                  isEmailUnverified ? 'border-yellow-200 bg-yellow-50' :
                    'border-red-200 bg-red-50'
                  }`}>
                  <div className="flex items-start space-x-2">
                    {isSuccess ? (
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : isEmailUnverified ? (
                      <Mail className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <AlertDescription className={`text-sm ${isSuccess ? 'text-green-800' :
                        isEmailUnverified ? 'text-yellow-800' :
                          'text-red-800'
                        }`}>
                        {message}
                      </AlertDescription>

                      {/* Email Verification Actions - Mobile Optimized */}
                      {isEmailUnverified && (
                        <div className="mt-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleResendVerification}
                            className="w-full text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                          >
                            <Mail className="mr-2 h-4 w-4" />
                            Resend Verification Email
                          </Button>
                        </div>
                      )}
                    </div>
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
                    className={`pl-10 h-11 sm:h-12 text-base ${errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''
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

              {/* Password Field - Mobile Optimized */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm sm:text-base">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => updateFormData('password', e.target.value)}
                    onFocus={() => clearFieldError('password')}
                    disabled={isLoading}
                    className={`pl-10 pr-10 h-11 sm:h-12 text-base ${errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''
                      }`}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
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
                {errors.password && (
                  <p className="text-sm text-red-600 flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="break-words">{errors.password}</span>
                  </p>
                )}
              </div>

              {/* Remember Me & Forgot Password - Mobile Optimized */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    checked={formData.rememberMe}
                    onCheckedChange={(checked) => updateFormData('rememberMe', !!checked)}
                    disabled={isLoading}
                    className="h-4 w-4"
                  />
                  <Label
                    htmlFor="rememberMe"
                    className="text-sm font-normal cursor-pointer select-none"
                  >
                    Remember me
                  </Label>
                </div>
                <button
                  type="button"
                  onClick={goToForgotPassword}
                  className="text-sm font-medium text-orange-600 hover:text-orange-500 focus:outline-none focus:underline text-left sm:text-right"
                  disabled={isLoading}
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button - Mobile Optimized */}
              <Button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white h-11 sm:h-12 text-base"
                disabled={!canLogin}
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-11 sm:h-12 text-base border-gray-300 hover:bg-gray-50"
                onClick={() => window.location.href = '/api/auth/google'}
                disabled={isLoading}
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </Button>

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
        <div className="text-center px-4">
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

// Main component with Suspense boundary
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
}