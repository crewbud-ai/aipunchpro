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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="flex items-center justify-center mb-6">
            <Building2 className="h-8 w-8 text-orange-600" />
            <span className="ml-2 text-2xl font-bold text-gray-900">CrewBudAI</span>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">
            {step === 1 ? "Create Your Company Account" : "Tell Us About Yourself"}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === 1 ? "Set up your construction company" : "Create your admin account"}
          </p>
        </div>

        {/* Form Card */}
        <Card>
          <CardContent className="pt-6">
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
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

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
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