// ==============================================
// src/hooks/auth/use-forgot-password.ts - Forgot Password Hook
// ==============================================

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api/auth'
import { 
  type ForgotPasswordState, 
  type ForgotPasswordResult,
  type ForgotPasswordData,
  type ForgotPasswordFormData,
  type ForgotPasswordErrors,
  validateForgotPasswordForm,
  FORGOT_PASSWORD_MESSAGES
} from '@/types/auth/forgot-password'

export const useForgotPassword = () => {
  const router = useRouter()
  const [state, setState] = useState<ForgotPasswordState>('idle')
  const [result, setResult] = useState<ForgotPasswordResult | null>(null)
  const [errors, setErrors] = useState<ForgotPasswordErrors>({})
  const [formData, setFormData] = useState<ForgotPasswordFormData>({
    email: '',
  })

  // Clear errors
  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])

  // Clear specific field error
  const clearFieldError = useCallback((field: keyof ForgotPasswordErrors) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }, [])

  // Update form data
  const updateFormData = useCallback((field: keyof ForgotPasswordFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear field error when user starts typing
    clearFieldError(field as keyof ForgotPasswordErrors)
  }, [clearFieldError])

  // Validate form
  const validateForm = useCallback(() => {
    const validation = validateForgotPasswordForm(formData)
    
    if (!validation.success) {
      const newErrors: ForgotPasswordErrors = {}
      validation.errors.forEach(error => {
        newErrors[error.field as keyof ForgotPasswordErrors] = error.message
      })
      setErrors(newErrors)
      return false
    }
    
    setErrors({})
    return true
  }, [formData])

  // Submit forgot password request
  const submitForgotPassword = useCallback(async (data?: ForgotPasswordData) => {
    const requestData = data || formData
    
    // Validate form if using form data
    if (!data && !validateForm()) {
      return
    }

    try {
      setState('loading')
      clearErrors()
      
      const response = await authApi.forgotPassword({
        email: requestData.email,
      })
      
      setResult(response)
      
      if (response.success) {
        setState('success')
      } else {
        // Handle different error types based on your API
        const errorResponse = response as any
        const errorMessage = response.message || errorResponse.error || 'Failed to send reset email'
        
        if (errorResponse.error === 'Rate limit exceeded') {
          setState('rate-limited')
        } else {
          setState('error')
          setErrors({ general: errorMessage })
        }
      }
    } catch (error: any) {
      console.error('Forgot password error:', error)
      
      setState('error')
      
      // Handle HTTP error responses from your API
      if (error?.response?.data) {
        const apiError = error.response.data
        const errorMessage = apiError.message || apiError.error || 'Failed to send reset email'
        
        // Handle specific error types based on your API
        if (apiError.error === 'Rate limit exceeded') {
          setState('rate-limited')
          setErrors({ 
            general: 'Too many password reset requests. Please wait before trying again.' 
          })
        } else if (apiError.error === 'Email not verified') {
          setErrors({ 
            general: 'Please verify your email address before requesting a password reset.' 
          })
        } else if (error?.response?.status === 429) {
          setState('rate-limited')
          setErrors({ 
            general: 'Too many requests. Please try again later.' 
          })
        } else {
          setErrors({ 
            general: errorMessage
          })
        }
      } else {
        // Handle network or other errors
        setErrors({ 
          general: error?.message || 'Failed to send password reset email. Please try again.' 
        })
      }
      
      setResult({
        success: false,
        message: error?.response?.data?.message || error?.message || 'Request failed',
      })
    }
  }, [formData, validateForm, clearErrors])

  // Navigation functions
  const goToLogin = useCallback(() => {
    router.push('/auth/login')
  }, [router])

  const goToSignup = useCallback(() => {
    router.push('/auth/signup')
  }, [router])

  const goHome = useCallback(() => {
    router.push('/')
  }, [router])

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      email: '',
    })
    setErrors({})
    setState('idle')
    setResult(null)
  }, [])

  // Get current message
  const getCurrentMessage = useCallback(() => {
    if (errors.general) {
      return errors.general
    }
    if (result?.message && state !== 'success') {
      return result.message
    }
    if (result?.notifications?.message && state === 'success') {
      return result.notifications.message
    }
    return FORGOT_PASSWORD_MESSAGES[state]
  }, [state, result?.message, result?.notifications?.message, errors.general])

  return {
    // State
    state,
    result,
    errors,
    formData,
    
    // Computed values
    isLoading: state === 'loading',
    isSuccess: state === 'success',
    isError: state === 'error' || state === 'rate-limited',
    isRateLimited: state === 'rate-limited',
    hasErrors: Object.keys(errors).length > 0,
    canSubmit: formData.email.trim() !== '' && state !== 'loading',
    message: getCurrentMessage(),
    
    // Actions
    submitForgotPassword,
    updateFormData,
    clearErrors,
    clearFieldError,
    validateForm,
    resetForm,
    
    // Navigation
    goToLogin,
    goToSignup,
    goHome,
  }
}