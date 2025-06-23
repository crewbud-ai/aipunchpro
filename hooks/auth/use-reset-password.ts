// ==============================================
// src/hooks/auth/use-reset-password.ts - Reset Password Hook
// ==============================================

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { authApi } from '@/lib/api/auth'
import { 
  type VerifyTokenState,
  type ResetPasswordState, 
  type VerifyResetTokenResult,
  type ResetPasswordResult,
  type ResetPasswordData,
  type ResetPasswordFormData,
  type ResetPasswordErrors,
  validateResetPasswordForm,
  RESET_PASSWORD_MESSAGES
} from '@/types/auth/forgot-password'

export const useResetPassword = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // States
  const [tokenState, setTokenState] = useState<VerifyTokenState>('loading')
  const [resetState, setResetState] = useState<ResetPasswordState>('idle')
  const [tokenResult, setTokenResult] = useState<VerifyResetTokenResult | null>(null)
  const [resetResult, setResetResult] = useState<ResetPasswordResult | null>(null)
  const [errors, setErrors] = useState<ResetPasswordErrors>({})
  const [formData, setFormData] = useState<ResetPasswordFormData>({
    token: '',
    email: '',
    newPassword: '',
    confirmPassword: '',
  })

  // Extract token and email from URL params
  const getParamsFromUrl = useCallback(() => {
    const token = searchParams.get('token')
    const email = searchParams.get('email')
    
    return { token, email }
  }, [searchParams])

  // Clear errors
  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])

  // Clear specific field error
  const clearFieldError = useCallback((field: keyof ResetPasswordErrors) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }, [])

  // Update form data
  const updateFormData = useCallback((field: keyof ResetPasswordFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear field error when user starts typing
    clearFieldError(field as keyof ResetPasswordErrors)
  }, [clearFieldError])

  // Validate form
  const validateForm = useCallback(() => {
    const validation = validateResetPasswordForm(formData)
    
    if (!validation.success) {
      const newErrors: ResetPasswordErrors = {}
      validation.errors.forEach(error => {
        newErrors[error.field as keyof ResetPasswordErrors] = error.message
      })
      setErrors(newErrors)
      return false
    }
    
    setErrors({})
    return true
  }, [formData])

  // Verify reset token
  const verifyResetToken = useCallback(async (token: string, email?: string) => {
    try {
      setTokenState('loading')
      
      const response = await authApi.verifyResetToken({
        token,
        ...(email && { email }),
      })
      
      setTokenResult(response)
      
      if (response.success && response.data) {
        setTokenState('valid')
        // Update form data with token and user info
        setFormData(prev => ({
          ...prev,
          token: response.data!.token,
          email: response.data!.user.email,
        }))
      } else {
        const errorResponse = response as any
        if (errorResponse.error?.includes('expired')) {
          setTokenState('expired')
        } else {
          setTokenState('invalid')
        }
      }
    } catch (error: any) {
      console.error('Token verification error:', error)
      
      // Handle HTTP error responses
      if (error?.response?.data) {
        const apiError = error.response.data
        if (apiError.error?.includes('expired')) {
          setTokenState('expired')
        } else {
          setTokenState('invalid')
        }
      } else {
        setTokenState('error')
      }
      
      setTokenResult({
        success: false,
        message: error?.response?.data?.message || error?.message || 'Token verification failed',
      })
    }
  }, [])

  // Submit password reset
  const submitPasswordReset = useCallback(async (data?: ResetPasswordData) => {
    const resetData = data || formData
    
    // Validate form if using form data
    if (!data && !validateForm()) {
      return
    }

    try {
      setResetState('loading')
      clearErrors()
      
      const response = await authApi.resetPassword({
        token: resetData.token,
        email: resetData.email,
        newPassword: resetData.newPassword,
        confirmPassword: resetData.confirmPassword
      })
      
      setResetResult(response)
      
      if (response.success) {
        setResetState('success')
        
        // Redirect to login after a delay
        setTimeout(() => {
          router.push('/auth/login')
        }, 3000)
        
      } else {
        setResetState('error')
        const errorResponse = response as any
        const errorMessage = response.message || errorResponse.error || 'Failed to reset password'
        setErrors({ general: errorMessage })
      }
    } catch (error: any) {
      console.error('Password reset error:', error)
      
      setResetState('error')
      
      // Handle HTTP error responses from your API
      if (error?.response?.data) {
        const apiError = error.response.data
        const errorMessage = apiError.message || apiError.error || 'Failed to reset password'
        
        // Handle specific error types
        if (apiError.error?.includes('expired') || apiError.error?.includes('invalid')) {
          setErrors({ 
            general: 'The password reset link is invalid or has expired. Please request a new one.' 
          })
        } else if (apiError.error === 'Email mismatch') {
          setErrors({ 
            general: 'The email address does not match the reset token.' 
          })
        } else {
          setErrors({ general: errorMessage })
        }
      } else {
        setErrors({ 
          general: error?.message || 'Failed to reset password. Please try again.' 
        })
      }
      
      setResetResult({
        success: false,
        message: error?.response?.data?.message || error?.message || 'Password reset failed',
      })
    }
  }, [formData, validateForm, clearErrors, router])

  // Navigation functions
  const goToLogin = useCallback(() => {
    router.push('/auth/login')
  }, [router])

  const goToForgotPassword = useCallback(() => {
    router.push('/auth/forgot-password')
  }, [router])

  const goHome = useCallback(() => {
    router.push('/')
  }, [router])

  // Reset form
  const resetForm = useCallback(() => {
    setFormData(prev => ({
      token: prev.token, // Keep token
      email: prev.email, // Keep email
      newPassword: '',
      confirmPassword: '',
    }))
    setErrors({})
    setResetState('idle')
    setResetResult(null)
  }, [])

  // Auto-verify token on component mount
  useEffect(() => {
    const params = getParamsFromUrl()
    
    if (!params.token) {
      setTokenState('invalid')
      setTokenResult({
        success: false,
        message: 'No reset token provided',
      })
      return
    }

    // Auto-verify the token
    verifyResetToken(params.token, params.email || undefined)
  }, [getParamsFromUrl, verifyResetToken])

  // Get current message
  const getCurrentMessage = useCallback(() => {
    if (errors.general) {
      return errors.general
    }
    if (resetResult?.message && resetState !== 'success') {
      return resetResult.message
    }
    if (resetResult?.notifications?.message && resetState === 'success') {
      return resetResult.notifications.message
    }
    return RESET_PASSWORD_MESSAGES[resetState]
  }, [resetState, resetResult?.message, resetResult?.notifications?.message, errors.general])

  return {
    // States
    tokenState,
    resetState,
    tokenResult,
    resetResult,
    errors,
    formData,
    
    // Computed values
    isTokenLoading: tokenState === 'loading',
    isTokenValid: tokenState === 'valid',
    isTokenInvalid: tokenState === 'invalid' || tokenState === 'expired',
    isTokenExpired: tokenState === 'expired',
    isResetLoading: resetState === 'loading',
    isResetSuccess: resetState === 'success',
    isResetError: resetState === 'error',
    hasErrors: Object.keys(errors).length > 0,
    canSubmit: formData.newPassword.trim() !== '' && 
               formData.confirmPassword.trim() !== '' && 
               resetState !== 'loading' && 
               tokenState === 'valid',
    message: getCurrentMessage(),
    userEmail: tokenResult?.data?.user?.email,
    userName: tokenResult?.data?.user ? 
      `${tokenResult.data.user.firstName} ${tokenResult.data.user.lastName}`.trim() : 
      undefined,
    
    // Actions
    verifyResetToken,
    submitPasswordReset,
    updateFormData,
    clearErrors,
    clearFieldError,
    validateForm,
    resetForm,
    
    // Navigation
    goToLogin,
    goToForgotPassword,
    goHome,
  }
}