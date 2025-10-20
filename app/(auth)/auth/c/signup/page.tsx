"use client"

import Link from "next/link"
import { Building2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { CompanyInfoStep } from "./components/CompanyInfoStep"
import { UserInfoStep } from "./components/UserInfoStep"
import { SuccessStep } from "./components/SuccessStep"
import { useSignupForm } from "@/hooks/auth/use-signup-form"
import { usePasswordVisibility } from "@/hooks/auth/use-signup-form"

export default function SignupPage() {
  const {
    step,
    isLoading,
    formData,
    errors,
    handleInputChange,
    handleNext,
    handleBack,
    handleSubmit,
    handleResendVerification,
    handleGoToDashboard,
  } = useSignupForm()

  const {
    showPassword,
    showConfirmPassword,
    togglePasswordVisibility,
    toggleConfirmPasswordVisibility,
  } = usePasswordVisibility()

  // Success step - render separately
  if (step === 3) {
    return (
      <SuccessStep
        email={formData.email}
        onGoToDashboard={handleGoToDashboard}
        onResendVerification={handleResendVerification}
      />
    )
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
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {step === 1 ? "Create Your Company Account" : "Tell Us About Yourself"}
          </h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            {step === 1 ? "Set up your construction company" : "Create your admin account"}
          </p>
        </div>

        {/* Progress Indicator - Mobile Optimized */}
        <div className="flex items-center justify-center space-x-2">
          <div className={`h-2 w-16 sm:w-20 rounded-full transition-colors ${step >= 1 ? 'bg-orange-600' : 'bg-gray-200'
            }`} />
          <div className={`h-2 w-16 sm:w-20 rounded-full transition-colors ${step >= 2 ? 'bg-orange-600' : 'bg-gray-200'
            }`} />
          <div className={`h-2 w-16 sm:w-20 rounded-full transition-colors ${step >= 3 ? 'bg-orange-600' : 'bg-gray-200'
            }`} />
        </div>

        {/* Form Card - Mobile Optimized */}
        <Card className="shadow-sm">
          <CardContent className="pt-6 px-4 sm:px-6">
            <form className="space-y-4 sm:space-y-5" onSubmit={(e) => e.preventDefault()}>
              {step === 1 && (
                <CompanyInfoStep
                  formData={formData}
                  errors={errors}
                  onInputChange={handleInputChange}
                  onNext={handleNext}
                />
              )}

              {step === 2 && (
                <UserInfoStep
                  formData={formData}
                  errors={errors}
                  isLoading={isLoading}
                  showPassword={showPassword}
                  showConfirmPassword={showConfirmPassword}
                  onInputChange={handleInputChange}
                  onSubmit={handleSubmit}
                  onBack={handleBack}
                  onTogglePassword={togglePasswordVisibility}
                  onToggleConfirmPassword={toggleConfirmPasswordVisibility}
                />
              )}
            </form>
          </CardContent>
        </Card>

        {/* Footer - Mobile Optimized */}
        <div className="text-center px-4">
          <p className="text-sm sm:text-base text-gray-600">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-medium text-orange-600 hover:text-orange-500">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}