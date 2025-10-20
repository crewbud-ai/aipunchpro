// ==============================================
// hooks/auth/use-complete-profile.ts - Complete Profile Hook
// ==============================================

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api/auth'
import type {
    CompleteProfileFormData,
    CompleteProfileErrors,
    CompleteProfileState,
} from '@/types/auth/complete-profile'
import {
    validateCompleteProfileForm,
    COMPLETE_PROFILE_MESSAGES,
    getDefaultCompleteProfileFormData,
} from '@/types/auth/complete-profile'

export function useCompleteProfile() {
    const router = useRouter()

    // Form state
    const [formData, setFormData] = useState<CompleteProfileFormData>(getDefaultCompleteProfileFormData())
    const [errors, setErrors] = useState<CompleteProfileErrors>({})
    const [state, setState] = useState<CompleteProfileState>('idle')
    const [message, setMessage] = useState('')
    const [userInfo, setUserInfo] = useState<any>(null)

    // Load user info from cookie on mount
    useEffect(() => {
        const userInfoCookie = document.cookie
            .split('; ')
            .find(row => row.startsWith('userInfo='))

        if (userInfoCookie) {
            try {
                const info = JSON.parse(decodeURIComponent(userInfoCookie.split('=')[1]))
                setUserInfo(info)
            } catch (error) {
                console.error('Failed to parse user info:', error)
            }
        }
    }, [])

    // Computed states
    const isLoading = state === 'loading'
    const isSuccess = state === 'success'
    const isError = state === 'error'
    const hasErrors = Object.keys(errors).length > 0

    // Clear specific field error
    const clearFieldError = useCallback((field: keyof CompleteProfileErrors) => {
        setErrors(prev => {
            const newErrors = { ...prev }
            delete newErrors[field]
            return newErrors
        })
    }, [])

    // Clear all errors
    const clearErrors = useCallback(() => {
        setErrors({})
        setMessage('')
    }, [])

    // Update form data
    const updateFormData = useCallback((field: keyof CompleteProfileFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        clearFieldError(field as keyof CompleteProfileErrors)
    }, [clearFieldError])

    // Validate form
    const validateForm = useCallback(() => {
        const validation = validateCompleteProfileForm(formData)

        if (!validation.success) {
            const newErrors: CompleteProfileErrors = {}
            validation.errors.forEach(error => {
                newErrors[error.field as keyof CompleteProfileErrors] = error.message
            })
            setErrors(newErrors)
            setMessage('Please fix the errors below')
            return false
        }

        setErrors({})
        setMessage('')
        return true
    }, [formData])

    // Submit profile completion
    const submitProfile = useCallback(async () => {
        // Validate form
        if (!validateForm()) {
            return
        }

        try {
            setState('loading')
            setMessage(COMPLETE_PROFILE_MESSAGES.loading)
            clearErrors()

            // Call the complete profile API
            const response = await authApi.completeProfile(formData)

            const data = await response.data

            if (response.success) {
                setState('success')
                setMessage(COMPLETE_PROFILE_MESSAGES.success)

                // Redirect to dashboard after a short delay
                setTimeout(() => {
                    router.push('/dashboard')
                    router.refresh() // Force refresh to update middleware
                }, 2000)

            } else {
                setState('error')
                const errorResponse = response as any
                const errorMessage = response.message || errorResponse.error || COMPLETE_PROFILE_MESSAGES.error
                setMessage(errorMessage)
                setErrors({ general: errorMessage })
            }

        } catch (error) {
            console.error('Complete profile error:', error)
            setState('error')
            const errorMessage = error instanceof Error ? error.message : COMPLETE_PROFILE_MESSAGES.error
            setMessage(errorMessage)
            setErrors({ general: errorMessage })
        }
    }, [formData, validateForm, clearErrors, router])

    // Reset form
    const reset = useCallback(() => {
        setFormData(getDefaultCompleteProfileFormData())
        setErrors({})
        setState('idle')
        setMessage('')
    }, [])

    return {
        // Form data
        formData,
        errors,
        message,
        state,
        userInfo,

        // Computed states
        isLoading,
        isSuccess,
        isError,
        hasErrors,

        // Actions
        updateFormData,
        clearFieldError,
        clearErrors,
        submitProfile,
        reset,
    }
}