// ==============================================
// src/hooks/use-signup-form.ts - Fixed Signup Form Custom Hooks
// ==============================================

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { authApi, sessionManager, type SignupRequest } from '@/lib/api/auth'
import { 
  type SignupFormData, 
  getInitialFormData, 
  generateSlugFromName,
  validateStep1,
  validateStep2
} from '@/types/auth/signup'

// ==============================================
// SIGNUP FORM HOOK
// ==============================================
export const useSignupForm = () => {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<SignupFormData>(getInitialFormData())
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Handle input changes with better optimization
  const handleInputChange = useCallback((field: keyof SignupFormData, value: string) => {
    // Use functional update to ensure we have the latest state
    setFormData((prev) => {
      const newData = { ...prev, [field]: value }
      
      // Auto-generate slug from company name
      if (field === "companyName") {
        const slug = generateSlugFromName(value)
        newData.companySlug = slug
      }
      
      return newData
    })
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }, [errors])

  // Handle step navigation
  const handleNext = useCallback(() => {
    const validation = validateStep1(formData)
    if (validation.success) {
      setStep(2)
      setErrors({})
    } else {
      setErrors(validation.errors)
    }
  }, [formData])

  const handleBack = useCallback(() => {
    setStep(1)
    setErrors({})
  }, [])

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    const validation = validateStep2(formData)
    if (!validation.success) {
      setErrors(validation.errors)
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const signupData: SignupRequest = {
        company: {
          name: formData.companyName,
          slug: formData.companySlug,
          industry: formData.industry || undefined,
          size: formData.companySize || undefined,
        },
        user: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          role: 'super_admin',
          phone: formData.phone || undefined,
        },
      }

      console.log(signupData, 'signupData')

      const response = await authApi.signup(signupData)
      
      // Store session
      sessionManager.setSession(
        response.data.session.token,
        response.data.session.expiresAt
      )
      
      setStep(3) // Success step
    } catch (error) {
      console.error("Signup error:", error)
      // Error handling is done in the authApi service with toasts
    } finally {
      setIsLoading(false)
    }
  }, [formData])

  // Resend verification email
  const handleResendVerification = useCallback(() => {
    authApi.resendVerification(formData.email)
  }, [formData.email])

  // Navigate to dashboard
  const handleGoToDashboard = useCallback(() => {
    router.push("/dashboard")
  }, [router])

  return {
    // State
    step,
    isLoading,
    formData,
    errors,
    
    // Actions
    handleInputChange,
    handleNext,
    handleBack,
    handleSubmit,
    handleResendVerification,
    handleGoToDashboard,
  }
}

// ==============================================
// PASSWORD VISIBILITY HOOK
// ==============================================
export const usePasswordVisibility = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev)
  }, [])

  const toggleConfirmPasswordVisibility = useCallback(() => {
    setShowConfirmPassword(prev => !prev)
  }, [])

  return {
    showPassword,
    showConfirmPassword,
    togglePasswordVisibility,
    toggleConfirmPasswordVisibility,
  }
}