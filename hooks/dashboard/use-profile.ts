// ==============================================
// src/hooks/profile/use-profile.ts - Profile Hook
// ==============================================

import { useState, useEffect, useCallback } from 'react'
import { authApi } from '@/lib/api/auth'
import { 
  type ProfileState,
  type PasswordChangeState,
  type UserProfile,
  type UpdateProfileData,
  type ChangePasswordData,
  type GetProfileResult,
  type UpdateProfileResult,
  type ChangePasswordResult,
  type UpdateProfileFormData,
  type ChangePasswordFormData,
  type ProfileErrors,
  type PasswordErrors,
  validateUpdateProfileForm,
  validateChangePasswordForm,
  formatUserRole,
  getInitials
} from '@/types/dashboard/profile'

export const useProfile = () => {
  // States
  const [profileState, setProfileState] = useState<ProfileState>('loading')
  const [passwordState, setPasswordState] = useState<PasswordChangeState>('idle')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [company, setCompany] = useState<any>(null)
  const [profileErrors, setProfileErrors] = useState<ProfileErrors>({})
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({})
  
  // Form data
  const [profileFormData, setProfileFormData] = useState<UpdateProfileFormData>({
    firstName: '',
    lastName: '',
    phone: '',
  })
  
  const [passwordFormData, setPasswordFormData] = useState<ChangePasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // Clear errors
  const clearProfileErrors = useCallback(() => {
    setProfileErrors({})
  }, [])

  const clearPasswordErrors = useCallback(() => {
    setPasswordErrors({})
  }, [])

  const clearProfileFieldError = useCallback((field: keyof ProfileErrors) => {
    setProfileErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }, [])

  const clearPasswordFieldError = useCallback((field: keyof PasswordErrors) => {
    setPasswordErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }, [])

  // Update form data
  const updateProfileFormData = useCallback((field: keyof UpdateProfileFormData, value: string) => {
    setProfileFormData(prev => ({ ...prev, [field]: value }))
    clearProfileFieldError(field as keyof ProfileErrors)
  }, [clearProfileFieldError])

  const updatePasswordFormData = useCallback((field: keyof ChangePasswordFormData, value: string) => {
    setPasswordFormData(prev => ({ ...prev, [field]: value }))
    clearPasswordFieldError(field as keyof PasswordErrors)
  }, [clearPasswordFieldError])

  // Load profile data
  const loadProfile = useCallback(async () => {
    try {
      setProfileState('loading')
      clearProfileErrors()
      
      const response = await authApi.getProfile()
      
      if (response.success && response.data) {
        setProfile(response.data.user)
        setCompany(response.data.company)
        
        // Initialize form data with current profile
        setProfileFormData({
          firstName: response.data.user.firstName,
          lastName: response.data.user.lastName,
          phone: response.data.user.phone || '',
        })
        
        setProfileState('viewing')
      } else {
        setProfileState('error')
        setProfileErrors({ general: 'Failed to load profile data' })
      }
    } catch (error: any) {
      console.error('Load profile error:', error)
      setProfileState('error')
      
      if (error?.response?.data) {
        const apiError = error.response.data
        setProfileErrors({ 
          general: apiError.message || apiError.error || 'Failed to load profile' 
        })
      } else {
        setProfileErrors({ 
          general: error?.message || 'Failed to load profile. Please try again.' 
        })
      }
    }
  }, [clearProfileErrors])

  // Validate profile form
  const validateProfileForm = useCallback(() => {
    const validation = validateUpdateProfileForm(profileFormData)
    
    if (!validation.success) {
      const newErrors: ProfileErrors = {}
      validation.errors.forEach(error => {
        newErrors[error.field as keyof ProfileErrors] = error.message
      })
      setProfileErrors(newErrors)
      return false
    }
    
    setProfileErrors({})
    return true
  }, [profileFormData])

  // Validate password form
  const validatePasswordForm = useCallback(() => {
    const validation = validateChangePasswordForm(passwordFormData)
    
    if (!validation.success) {
      const newErrors: PasswordErrors = {}
      validation.errors.forEach(error => {
        newErrors[error.field as keyof PasswordErrors] = error.message
      })
      setPasswordErrors(newErrors)
      return false
    }
    
    setPasswordErrors({})
    return true
  }, [passwordFormData])

  // Update profile
  const updateProfile = useCallback(async (data?: UpdateProfileData) => {
    const updateData = data || profileFormData
    
    if (!data && !validateProfileForm()) {
      return
    }

    try {
      setProfileState('saving')
      clearProfileErrors()
      
      const response = await authApi.updateProfile(updateData)
      
      if (response.success && response.data) {
        setProfile(response.data.user)
        
        // Update localStorage
        const existingUser = localStorage.getItem('user')
        if (existingUser) {
          const userData = JSON.parse(existingUser)
          const updatedUser = { ...userData, ...response.data.user }
          localStorage.setItem('user', JSON.stringify(updatedUser))
        }
        
        setProfileState('viewing')
      } else {
        setProfileState('editing')
        const errorResponse = response as any
        const errorMessage = response.message || errorResponse.error || 'Failed to update profile'
        setProfileErrors({ general: errorMessage })
      }
    } catch (error: any) {
      console.error('Update profile error:', error)
      setProfileState('editing')
      
      if (error?.response?.data) {
        const apiError = error.response.data
        const errorMessage = apiError.message || apiError.error || 'Failed to update profile'
        setProfileErrors({ general: errorMessage })
      } else {
        setProfileErrors({ 
          general: error?.message || 'Failed to update profile. Please try again.' 
        })
      }
    }
  }, [profileFormData, validateProfileForm, clearProfileErrors])

  // Change password
  const changePassword = useCallback(async (data?: ChangePasswordData) => {
    const passwordData = data || passwordFormData
    
    if (!data && !validatePasswordForm()) {
      return
    }

    try {
      setPasswordState('loading')
      clearPasswordErrors()
      
      const response = await authApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })
      
      if (response.success) {
        setPasswordState('success')
        
        // Clear password form
        setPasswordFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
        
        // Reset to idle after a delay
        setTimeout(() => {
          setPasswordState('idle')
        }, 3000)
        
      } else {
        setPasswordState('error')
        const errorResponse = response as any
        const errorMessage = response.message || errorResponse.error || 'Failed to change password'
        setPasswordErrors({ general: errorMessage })
      }
    } catch (error: any) {
      console.error('Change password error:', error)
      setPasswordState('error')
      
      if (error?.response?.data) {
        const apiError = error.response.data
        const errorMessage = apiError.message || apiError.error || 'Failed to change password'
        
        // Handle specific error cases
        if (apiError.error?.includes('current password') || apiError.error?.includes('incorrect')) {
          setPasswordErrors({ currentPassword: 'Current password is incorrect' })
        } else {
          setPasswordErrors({ general: errorMessage })
        }
      } else {
        setPasswordErrors({ 
          general: error?.message || 'Failed to change password. Please try again.' 
        })
      }
    }
  }, [passwordFormData, validatePasswordForm, clearPasswordErrors])

  // Toggle edit mode
  const startEditing = useCallback(() => {
    setProfileState('editing')
  }, [])

  const cancelEditing = useCallback(() => {
    if (profile) {
      // Reset form data to current profile
      setProfileFormData({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone || '',
      })
    }
    clearProfileErrors()
    setProfileState('viewing')
  }, [profile, clearProfileErrors])

  // Load profile on mount
  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  return {
    // States
    profileState,
    passwordState,
    profile,
    company,
    profileErrors,
    passwordErrors,
    profileFormData,
    passwordFormData,
    
    // Computed values
    isLoading: profileState === 'loading',
    isViewing: profileState === 'viewing',
    isEditing: profileState === 'editing',
    isSaving: profileState === 'saving',
    isError: profileState === 'error',
    isPasswordChanging: passwordState === 'loading',
    isPasswordSuccess: passwordState === 'success',
    isPasswordError: passwordState === 'error',
    hasProfileErrors: Object.keys(profileErrors).length > 0,
    hasPasswordErrors: Object.keys(passwordErrors).length > 0,
    canSaveProfile: profileFormData.firstName.trim() !== '' && 
                   profileFormData.lastName.trim() !== '' && 
                   profileState !== 'saving',
    canChangePassword: passwordFormData.currentPassword.trim() !== '' && 
                      passwordFormData.newPassword.trim() !== '' && 
                      passwordFormData.confirmPassword.trim() !== '' && 
                      passwordState !== 'loading',
    userInitials: profile ? getInitials(profile.firstName, profile.lastName) : 'U',
    userFullName: profile ? `${profile.firstName} ${profile.lastName}`.trim() : 'User',
    userRoleDisplay: profile ? formatUserRole(profile.role) : 'User',
    
    // Actions
    loadProfile,
    updateProfile,
    changePassword,
    updateProfileFormData,
    updatePasswordFormData,
    clearProfileErrors,
    clearPasswordErrors,
    clearProfileFieldError,
    clearPasswordFieldError,
    validateProfileForm,
    validatePasswordForm,
    startEditing,
    cancelEditing,
  }
}