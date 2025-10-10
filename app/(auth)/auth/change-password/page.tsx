"use client"

import Link from "next/link"
import { Building2, Eye, EyeOff, Lock, AlertCircle, CheckCircle, Loader2, KeyRound, ShieldCheck } from "lucide-react"
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

  // Success state - password changed
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
          </div>

          {/* Success Card */}
          <Card className="w-full border-green-200">
            <CardHeader className="text-center pb-3">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Password Changed Successfully!</CardTitle>
              <CardDescription>
                Your password has been updated. You can now access all features.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {message || 'Your account is now secure with your new password.'}
                </AlertDescription>
              </Alert>

              <Button
                onClick={() => window.location.href = '/dashboard'}
                className="w-full bg-orange-600 hover:bg-orange-700"
                size="lg"
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
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
            Change Your Password
          </h1>
          <p className="text-sm text-gray-600">
            Please set a new password for your account
          </p>
        </div>

        {/* Form Card */}
        <Card className="w-full">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Set New Password</CardTitle>
            <CardDescription className="text-center space-y-1">
              {userInfo && (
                <p>Welcome, <span className="font-medium">{userInfo.firstName} {userInfo.lastName}</span></p>
              )}
              <p className="text-xs text-muted-foreground">
                Create a secure password you'll remember
              </p>
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Message */}
              {(message && isError) && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {message}
                  </AlertDescription>
                </Alert>
              )}

              {/* Info Message */}
              <Alert className="border-blue-200 bg-blue-50">
                <KeyRound className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Security Notice:</strong> You're using a temporary password. Please create a new secure password to continue.
                </AlertDescription>
              </Alert>

              {/* New Password Field */}
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password *</Label>
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
                    className={`pl-10 pr-10 ${
                      errors.newPassword ? 'border-red-500' : ''
                    }`}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-3"
                    onClick={() => togglePasswordVisibility('new')}
                    disabled={isLoading}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-sm text-red-600">{errors.newPassword}</p>
                )}
                <p className="text-xs text-gray-500">
                  Must be at least 8 characters with uppercase, lowercase, number, and special character
                </p>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password *</Label>
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
                    className={`pl-10 pr-10 ${
                      errors.confirmPassword ? 'border-red-500' : ''
                    }`}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-3"
                    onClick={() => togglePasswordVisibility('confirm')}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Password Requirements */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium text-gray-700">Password Requirements:</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                    At least 8 characters long
                  </li>
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                    One uppercase letter (A-Z)
                  </li>
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                    One lowercase letter (a-z)
                  </li>
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                    One number (0-9)
                  </li>
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                    One special character (!@#$%^&*)
                  </li>
                </ul>
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