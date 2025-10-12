"use client"

import Link from "next/link"
import { Building2, Eye, EyeOff, Lock, AlertCircle, CheckCircle, Loader2, ShieldCheck } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useChangePassword } from "@/hooks/auth/use-change-password"

export default function ChangePasswordPage() {
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const {
    state,
    errors,
    formData,
    userInfo,
    isLoading,
    isSuccess,
    isError,
    hasErrors,
    canSubmit,
    message,
    submitPasswordChange,
    updateFormData,
    clearFieldError,
  } = useChangePassword()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await submitPasswordChange()
  }

  const togglePasswordVisibility = (field: 'new' | 'confirm') => {
    if (field === 'new') {
      setShowNewPassword(!showNewPassword)
    } else {
      setShowConfirmPassword(!showConfirmPassword)
    }
  }

  // Success state - password changed - Mobile Optimized
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
          </div>

          {/* Success Card - Mobile Optimized */}
          <Card className="w-full border-green-200 shadow-sm">
            <CardHeader className="text-center pb-3 px-4 sm:px-6">
              <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-7 w-7 sm:h-8 sm:w-8 text-green-600" />
              </div>
              <CardTitle className="text-xl sm:text-2xl">Password Changed Successfully!</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Your password has been updated. You can now access all features.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4 px-4 sm:px-6 pb-6">
              <Alert className="border-green-200 bg-green-50">
                <div className="flex items-start space-x-2">
                  <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <AlertDescription className="text-sm sm:text-base text-green-800 flex-1 min-w-0 break-words">
                    {message || 'Your account is now secure with your new password.'}
                  </AlertDescription>
                </div>
              </Alert>

              <Button 
                onClick={() => window.location.href = '/dashboard'} 
                className="w-full bg-orange-600 hover:bg-orange-700 h-11 sm:h-12 text-base"
              >
                Go to Dashboard
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
            Change Your Password
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            {userInfo ? `Welcome, ${userInfo.firstName}! ` : ''}Create a new secure password
          </p>
        </div>

        {/* Form Card - Mobile Optimized */}
        <Card className="w-full shadow-sm">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-xl sm:text-2xl text-center">Create New Password</CardTitle>
            <CardDescription className="text-center text-sm sm:text-base">
              {userInfo?.email && (
                <span className="block text-xs sm:text-sm text-muted-foreground break-all">
                  {userInfo.email}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-4 sm:px-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* Error/Info Messages - Mobile Optimized */}
              {isError && message && (
                <Alert className="border-red-200 bg-red-50">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <AlertDescription className="text-sm text-red-800 flex-1 min-w-0 break-words">
                      {message}
                    </AlertDescription>
                  </div>
                </Alert>
              )}

              {/* Info Alert - Mobile Optimized */}
              <Alert className="border-blue-200 bg-blue-50">
                <div className="flex items-start space-x-2">
                  <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <AlertDescription className="text-xs sm:text-sm text-blue-800 flex-1 min-w-0">
                    Please create a new secure password to continue.
                  </AlertDescription>
                </div>
              </Alert>

              {/* New Password Field - Mobile Optimized */}
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm sm:text-base">
                  New Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter your new password"
                    value={formData.newPassword}
                    onChange={(e) => updateFormData('newPassword', e.target.value)}
                    onFocus={() => clearFieldError('newPassword')}
                    disabled={isLoading}
                    className={`pl-10 pr-10 h-11 sm:h-12 text-base ${
                      errors.newPassword ? 'border-red-500' : ''
                    }`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-3 p-1"
                    onClick={() => togglePasswordVisibility('new')}
                    disabled={isLoading}
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-sm text-red-600 flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="break-words">{errors.newPassword}</span>
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Must be at least 8 characters with uppercase, lowercase, number, and special character
                </p>
              </div>

              {/* Confirm Password Field - Mobile Optimized */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm sm:text-base">
                  Confirm New Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
                    value={formData.confirmPassword}
                    onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                    onFocus={() => clearFieldError('confirmPassword')}
                    disabled={isLoading}
                    className={`pl-10 pr-10 h-11 sm:h-12 text-base ${
                      errors.confirmPassword ? 'border-red-500' : ''
                    }`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-3 p-1"
                    onClick={() => togglePasswordVisibility('confirm')}
                    disabled={isLoading}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
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
                <h3 className="text-sm font-medium text-gray-800 mb-2">Password must contain:</h3>
                <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>At least 8 characters</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>One uppercase & one lowercase letter</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>At least one number (0-9)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>At least one special character (!@#$%^&*)</span>
                  </li>
                </ul>
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
                    Changing Password...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Change Password
                  </>
                )}
              </Button>
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
    </div>
  )
}