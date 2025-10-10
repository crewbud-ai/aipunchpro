// ==============================================
// hooks/auth/use-change-password.ts - Change Password Hook (First Login)
// ==============================================

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api/auth'
import { 
  type ChangePasswordFirstLoginState,
  type ChangePasswordFirstLoginFormData,
  type ChangePasswordFirstLoginErrors,
  validateChangePasswordFirstLoginForm,
  CHANGE_PASSWORD_MESSAGES
} from '@/types/auth/change-password'

export const useChangePassword = () => {
  const router = useRouter()
  
  // States
  const [state, setState] = useState<ChangePasswordFirstLoginState>('idle')
  const [errors, setErrors] = useState<ChangePasswordFirstLoginErrors>({})
  const [message, setMessage] = useState<string>('')
  const [userInfo, setUserInfo] = useState<{ firstName: string; lastName: string; email: string } | null>(null)
  const [formData, setFormData] = useState<ChangePasswordFirstLoginFormData>({
    newPassword: '',
    confirmPassword: '',
  })

  // Load user info from localStorage
  useEffect(() => {
    try {
      const userData = localStorage.getItem('user')
      if (userData) {
        const user = JSON.parse(userData)
        setUserInfo({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
        })
      }
    } catch (error) {
      console.error('Failed to load user info:', error)
    }
  }, [])

  // Clear errors
  const clearErrors = useCallback(() => {
    setErrors({})
    setMessage('')
  }, [])

  // Clear specific field error
  const clearFieldError = useCallback((field: keyof ChangePasswordFirstLoginErrors) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }, [])

  // Update form data
  const updateFormData = useCallback((field: keyof ChangePasswordFirstLoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    clearFieldError(field as keyof ChangePasswordFirstLoginErrors)
  }, [clearFieldError])

  // Validate form
  const validateForm = useCallback(() => {
    const validation = validateChangePasswordFirstLoginForm(formData)
    
    if (!validation.success) {
      const newErrors: ChangePasswordFirstLoginErrors = {}
      validation.errors.forEach(error => {
        newErrors[error.field as keyof ChangePasswordFirstLoginErrors] = error.message
      })
      setErrors(newErrors)
      setMessage('Please fix the errors below')
      return false
    }
    
    setErrors({})
    setMessage('')
    return true
  }, [formData])

  // Submit password change
  const submitPasswordChange = useCallback(async () => {
    // Validate form
    if (!validateForm()) {
      return
    }

    try {
      setState('loading')
      setMessage(CHANGE_PASSWORD_MESSAGES.loading)
      clearErrors()
      
      // Call the change password API (no current password needed for first-time change)
      const response = await authApi.changePasswordFirstLogin({
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      })
      
      if (response.success) {
        setState('success')
        setMessage(CHANGE_PASSWORD_MESSAGES.success)
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/dashboard')
          router.refresh() // Force refresh to update middleware
        }, 2000)
        
      } else {
        setState('error')
        const errorResponse = response as any
        const errorMessage = response.message || errorResponse.error || CHANGE_PASSWORD_MESSAGES.error
        setMessage(errorMessage)
        setErrors({ general: errorMessage })
      }
    } catch (error: any) {
      console.error('Password change error:', error)
      
      setState('error')
      
      // Handle HTTP error responses from API
      if (error?.response?.data) {
        const apiError = error.response.data
        const errorMessage = apiError.message || apiError.error || CHANGE_PASSWORD_MESSAGES.error
        
        // Handle specific error types
        if (apiError.error?.includes('password')) {
          setErrors({ newPassword: errorMessage })
        } else {
          setErrors({ general: errorMessage })
        }
        
        setMessage(errorMessage)
      } else {
        const errorMessage = error?.message || CHANGE_PASSWORD_MESSAGES.error
        setErrors({ general: errorMessage })
        setMessage(errorMessage)
      }
    }
  }, [formData, validateForm, clearErrors, router])

  // Get current message
  const getCurrentMessage = useCallback(() => {
    if (message) return message
    return CHANGE_PASSWORD_MESSAGES[state]
  }, [state, message])

  return {
    // States
    state,
    errors,
    formData,
    userInfo,
    
    // Computed values
    isLoading: state === 'loading',
    isSuccess: state === 'success',
    isError: state === 'error',
    hasErrors: Object.keys(errors).length > 0,
    canSubmit: formData.newPassword.trim() !== '' && 
               formData.confirmPassword.trim() !== '' && 
               state !== 'loading',
    message: getCurrentMessage(),
    
    // Actions
    submitPasswordChange,
    updateFormData,
    clearErrors,
    clearFieldError,
    validateForm,
  }
}