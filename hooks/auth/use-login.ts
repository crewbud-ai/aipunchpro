// ==============================================
// src/hooks/auth/use-login.ts - Login Hook
// ==============================================

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api/auth'
import {
  type LoginState,
  type LoginResult,
  type LoginData,
  type LoginFormData,
  type LoginErrors,
  validateLoginForm,
  LOGIN_MESSAGES
} from '@/types/auth/login';
import { initializePermissions } from '@/lib/permissions';

export const useLogin = () => {
  const router = useRouter()
  const [state, setState] = useState<LoginState>('idle')
  const [result, setResult] = useState<LoginResult | null>(null)
  const [errors, setErrors] = useState<LoginErrors>({})
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false,
  })

  // Clear errors
  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])

  // Clear specific field error
  const clearFieldError = useCallback((field: keyof LoginErrors) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }, [])

  // Update form data
  const updateFormData = useCallback((field: keyof LoginFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear field error when user starts typing
    clearFieldError(field as keyof LoginErrors)
  }, [clearFieldError])

  // Validate form
  const validateForm = useCallback(() => {
    const validation = validateLoginForm(formData)

    if (!validation.success) {
      const newErrors: LoginErrors = {}
      validation.errors.forEach(error => {
        newErrors[error.field as keyof LoginErrors] = error.message
      })
      setErrors(newErrors)
      return false
    }

    setErrors({})
    return true
  }, [formData])

  // Login function
  const login = useCallback(async (data?: LoginData) => {
    const loginData = data || formData

    // Validate form if using form data
    if (!data && !validateForm()) {
      return
    }

    try {
      setState('loading')
      clearErrors()

      const response = await authApi.login({
        email: loginData.email,
        password: loginData.password,
        rememberMe: loginData.rememberMe,
      })

      setResult(response)

      if (response.success) {
        setState('success')

        if (response.data?.user) {
          // 🔥 IMPORTANT: Store the full user object including permissions
          localStorage.setItem('user', JSON.stringify(response.data.user))
        }

        // Store company data
        if (response.data?.company) {
          localStorage.setItem('company', JSON.stringify(response.data.company))
        }

        // 🔥 Initialize permissions after successful login
        if (response.data?.user && response.data?.company) {
          initializePermissions({
            user: response.data.user,
            company: response.data.company
          })
        }
        
        // Optional: Store non-sensitive user data in localStorage for quick access
        if (response.data?.user) {
          localStorage.setItem('user', JSON.stringify({
            id: response.data.user.id,
            email: response.data.user.email,
            firstName: response.data.user.firstName,
            lastName: response.data.user.lastName,
            role: response.data.user.role,
            permissions: response.data.user.permissions
          }))
        }

        // Store company data
        if (response.data?.company) {
          localStorage.setItem('company', JSON.stringify(response.data.company))
        }

        // Redirect with a slight delay for UX
        setTimeout(() => {
          router.push('/dashboard')
          router.refresh() // Force refresh to trigger middleware
        }, 1000)

      } else {
        // Handle different error types based on your API
        // Cast response to handle both LoginResponse and error response structures
        const errorResponse = response as any
        const errorMessage = response.message || errorResponse.error || 'Login failed'

        if (errorMessage.toLowerCase().includes('email') &&
          errorMessage.toLowerCase().includes('verify')) {
          setState('email-unverified')
        } else {
          setState('error')
          setErrors({ general: errorMessage })
        }
      }
    } catch (error: any) {
      console.error('Login error:', error)

      setState('error')

      // Handle HTTP error responses from your API
      if (error?.response?.data) {
        const apiError = error.response.data
        const errorMessage = apiError.message || apiError.error || 'Login failed'

        // Handle specific error types based on your API
        if (apiError.error === 'EMAIL_NOT_VERIFIED') {
          setState('email-unverified')
          setErrors({
            general: errorMessage
          })
        } else if (apiError.error === 'INVALID_CREDENTIALS') {
          setErrors({
            general: 'Invalid email or password. Please try again.'
          })
        } else if (error?.response?.status === 429) {
          setErrors({
            general: 'Too many login attempts. Please try again later.'
          })
        } else {
          setErrors({
            general: errorMessage
          })
        }
      } else {
        // Handle network or other errors
        setErrors({
          general: error?.message || 'Login failed. Please try again.'
        })
      }

      setResult({
        success: false,
        message: error?.response?.data?.message || error?.message || 'Login failed',
      })
    }
  }, [formData, validateForm, clearErrors, router])

  // Resend verification email
  const resendVerificationEmail = useCallback(async () => {
    if (!formData.email) return

    try {
      await authApi.resendVerification(formData.email)
    } catch (error) {
      console.error('Resend verification error:', error)
    }
  }, [formData.email])

  // Navigation functions
  const goToSignup = useCallback(() => {
    router.push('/auth/signup')
  }, [router])

  const goToForgotPassword = useCallback(() => {
    router.push('/auth/forgot-password')
  }, [router])

  const goToHome = useCallback(() => {
    router.push('/')
  }, [router])

  const goToDashboard = useCallback(() => {
    router.push('/dashboard')
  }, [router])

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      email: '',
      password: '',
      rememberMe: false,
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
    return LOGIN_MESSAGES[state]
  }, [state, result?.message, errors.general])

  return {
    // State
    state,
    result,
    errors,
    formData,

    // Computed values
    isLoading: state === 'loading',
    isSuccess: state === 'success',
    isError: state === 'error',
    isEmailUnverified: state === 'email-unverified',
    hasErrors: Object.keys(errors).length > 0,
    canLogin: formData.email.trim() !== '' && formData.password.trim() !== '' && state !== 'loading',
    message: getCurrentMessage(),

    // Actions
    login,
    updateFormData,
    clearErrors,
    clearFieldError,
    validateForm,
    resetForm,
    resendVerificationEmail,

    // Navigation
    goToSignup,
    goToForgotPassword,
    goToHome,
    goToDashboard,
  }
}