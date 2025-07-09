// ==============================================
// src/hooks/team-members/use-create-team-member.ts - Create Team Member Hook
// ==============================================

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { teamMembersApi } from '@/lib/api/team-members'
import {
  validateCreateTeamMember,
  getDefaultCreateTeamMemberFormData,
  type CreateTeamMemberData,
  type CreateTeamMemberFormData,
  type CreateTeamMemberState,
  type CreateTeamMemberResult,
  type TeamMemberFormErrors,
} from '@/types/team-members'

// ==============================================
// HOOK INTERFACES
// ==============================================
interface UseCreateTeamMemberState {
  state: CreateTeamMemberState
  result: CreateTeamMemberResult | null
  errors: TeamMemberFormErrors
  formData: CreateTeamMemberFormData

  // Email checking state
  isCheckingEmail: boolean
  emailAvailable: boolean
  lastCheckedEmail: string
}

interface UseCreateTeamMemberActions {
  updateFormData: (field: keyof CreateTeamMemberFormData, value: any) => void
  updateFormDataBulk: (data: Partial<CreateTeamMemberFormData>) => void
  clearErrors: () => void
  clearFieldError: (field: keyof TeamMemberFormErrors) => void
  validateForm: () => boolean
  createTeamMember: (data?: CreateTeamMemberData) => Promise<void>
  reset: () => void

  // Email availability checking
  checkEmailAvailability: (email: string) => Promise<void>
  
  // Multi-step form helpers
  goToNextStep: () => void
  goToPrevStep: () => void
  goToStep: (step: number) => void
  markStepComplete: (step: number) => void
}

interface UseCreateTeamMemberReturn extends UseCreateTeamMemberState, UseCreateTeamMemberActions {
  // Computed properties
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
  isIdle: boolean
  hasErrors: boolean
  canSubmit: boolean
  
  // Multi-step form computed properties
  currentStep: number
  totalSteps: number
  canGoNext: boolean
  canGoPrev: boolean
  isFirstStep: boolean
  isLastStep: boolean
  progressPercentage: number
}

// ==============================================
// FORM DATA TRANSFORMATION
// ==============================================
function transformFormDataToApiData(formData: CreateTeamMemberFormData): CreateTeamMemberData {
  const data: CreateTeamMemberData = {
    firstName: formData.firstName.trim(),
    lastName: formData.lastName.trim(),
    email: formData.email.trim().toLowerCase(),
    phone: formData.phone?.trim() || undefined,
    role: formData.role,
    jobTitle: formData.jobTitle?.trim() || undefined,
    tradeSpecialty: formData.tradeSpecialty,
    hourlyRate: formData.hourlyRate,
    overtimeRate: formData.overtimeRate,
    startDate: formData.startDate || undefined,
    certifications: formData.certifications,
    emergencyContactName: formData.emergencyContactName?.trim() || undefined,
    emergencyContactPhone: formData.emergencyContactPhone?.trim() || undefined,
    isActive: formData.isActive,
  }

  // Add project assignment if specified
  if (formData.assignToProject && formData.projectId) {
    data.projectId = formData.projectId
    data.projectHourlyRate = formData.projectHourlyRate
    data.projectOvertimeRate = formData.projectOvertimeRate
    data.projectNotes = formData.projectNotes?.trim() || undefined
  }

  return data
}

// ==============================================
// MAIN HOOK
// ==============================================
export const useCreateTeamMember = () => {
  const router = useRouter()

  // ==============================================
  // STATE
  // ==============================================
  const [state, setState] = useState<UseCreateTeamMemberState>({
    state: 'idle',
    result: null,
    errors: {},
    formData: getDefaultCreateTeamMemberFormData(),
    isCheckingEmail: false,
    emailAvailable: true,
    lastCheckedEmail: '',
  })

  // ==============================================
  // COMPUTED PROPERTIES
  // ==============================================
  const isLoading = state.state === 'loading'
  const isSuccess = state.state === 'success'
  const isError = state.state === 'error'
  const isIdle = state.state === 'idle'
  const hasErrors = Object.keys(state.errors).length > 0
  const canSubmit = !hasErrors && !isLoading && !!state.formData.firstName && !!state.formData.lastName && !!state.formData.email

  // Multi-step form computed properties
  const currentStep = state.formData.currentStep || 1
  const totalSteps = 4
  const canGoNext = currentStep < totalSteps
  const canGoPrev = currentStep > 1
  const isFirstStep = currentStep === 1
  const isLastStep = currentStep === totalSteps
  const progressPercentage = (currentStep / totalSteps) * 100

  // ==============================================
  // FORM DATA MANAGEMENT
  // ==============================================
  const updateFormData = useCallback((field: keyof CreateTeamMemberFormData, value: any) => {
    setState(prev => ({
      ...prev,
      formData: { ...prev.formData, [field]: value },
      // Clear field error when user starts typing
      errors: { ...prev.errors, [field]: undefined },
    }))
  }, [])

  const updateFormDataBulk = useCallback((data: Partial<CreateTeamMemberFormData>) => {
    setState(prev => ({
      ...prev,
      formData: { ...prev.formData, ...data },
    }))
  }, [])

  // ==============================================
  // ERROR MANAGEMENT
  // ==============================================
  const clearErrors = useCallback(() => {
    setState(prev => ({ ...prev, errors: {} }))
  }, [])

  const clearFieldError = useCallback((field: keyof TeamMemberFormErrors) => {
    setState(prev => ({
      ...prev,
      errors: { ...prev.errors, [field]: undefined },
    }))
  }, [])

  // ==============================================
  // FORM VALIDATION
  // ==============================================
  const validateForm = useCallback(() => {
    const apiData = transformFormDataToApiData(state.formData)
    const validation = validateCreateTeamMember(apiData)

    if (!validation.success) {
      const formErrors: TeamMemberFormErrors = {}
      
      validation.error.errors.forEach(error => {
        const field = error.path[0] as keyof TeamMemberFormErrors
        formErrors[field] = error.message
      })

      setState(prev => ({ ...prev, errors: formErrors }))
      return false
    }

    setState(prev => ({ ...prev, errors: {} }))
    return true
  }, [state.formData])

  // ==============================================
  // EMAIL AVAILABILITY CHECKING
  // ==============================================
  const checkEmailAvailability = useCallback(async (email: string) => {
    if (!email || email === state.lastCheckedEmail) {
      return
    }

    try {
      setState(prev => ({ ...prev, isCheckingEmail: true }))
      
      const response = await teamMembersApi.checkEmailAvailability(email)
      
      setState(prev => ({
        ...prev,
        emailAvailable: response.available,
        lastCheckedEmail: email,
        isCheckingEmail: false,
        errors: {
          ...prev.errors,
          email: response.available ? undefined : 'This email is already in use'
        }
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        emailAvailable: false,
        isCheckingEmail: false,
        errors: {
          ...prev.errors,
          email: 'Unable to check email availability'
        }
      }))
    }
  }, [state.lastCheckedEmail])

  // ==============================================
  // CREATE TEAM MEMBER
  // ==============================================
  const createTeamMember = useCallback(async (customData?: CreateTeamMemberData) => {
    try {
      setState(prev => ({ ...prev, state: 'loading', errors: {} }))

      // Use custom data if provided, otherwise transform form data
      const apiData = customData || transformFormDataToApiData(state.formData)

      // Validate data
      const validation = validateCreateTeamMember(apiData)
      if (!validation.success) {
        const formErrors: TeamMemberFormErrors = {}
        validation.error.errors.forEach(error => {
          const field = error.path[0] as keyof TeamMemberFormErrors
          formErrors[field] = error.message
        })

        setState(prev => ({
          ...prev,
          state: 'error',
          errors: formErrors,
        }))
        return
      }

      // Create team member
      const response = await teamMembersApi.createTeamMember(apiData)

      setState(prev => ({
        ...prev,
        state: 'success',
        result: response,
        errors: {},
      }))

      // Optionally redirect to team member details page
      if (response.data.user.id) {
        setTimeout(() => {
          router.push(`/dashboard/team/${response.data.user.id}`)
        }, 1500)
      }

    } catch (error: any) {
      console.error('Error creating team member:', error)

      // Handle API errors
      if (error.details && Array.isArray(error.details)) {
        const formErrors: TeamMemberFormErrors = {}
        error.details.forEach((detail: any) => {
          if (detail.field) {
            formErrors[detail.field as keyof TeamMemberFormErrors] = detail.message
          }
        })

        setState(prev => ({
          ...prev,
          state: 'error',
          errors: formErrors,
        }))
      } else {
        setState(prev => ({
          ...prev,
          state: 'error',
          errors: { general: error.message || 'Failed to create team member' },
        }))
      }
    }
  }, [state.formData, router])

  // ==============================================
  // MULTI-STEP FORM NAVIGATION
  // ==============================================
  const goToNextStep = useCallback(() => {
    if (canGoNext) {
      const nextStep = currentStep + 1
      updateFormData('currentStep', nextStep)
      
      // Mark current step as completed
      const completedSteps = state.formData.completedSteps || []
      if (!completedSteps.includes(currentStep)) {
        updateFormData('completedSteps', [...completedSteps, currentStep])
      }
    }
  }, [canGoNext, currentStep, updateFormData, state.formData.completedSteps])

  const goToPrevStep = useCallback(() => {
    if (canGoPrev) {
      updateFormData('currentStep', currentStep - 1)
    }
  }, [canGoPrev, currentStep, updateFormData])

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= totalSteps) {
      updateFormData('currentStep', step)
    }
  }, [updateFormData])

  const markStepComplete = useCallback((step: number) => {
    const completedSteps = state.formData.completedSteps || []
    if (!completedSteps.includes(step)) {
      updateFormData('completedSteps', [...completedSteps, step])
    }
  }, [state.formData.completedSteps, updateFormData])

  // ==============================================
  // RESET
  // ==============================================
  const reset = useCallback(() => {
    setState({
      state: 'idle',
      result: null,
      errors: {},
      formData: getDefaultCreateTeamMemberFormData(),
      isCheckingEmail: false,
      emailAvailable: true,
      lastCheckedEmail: '',
    })
  }, [])

  // ==============================================
  // RETURN HOOK INTERFACE
  // ==============================================
  return {
    // State
    state: state.state,
    result: state.result,
    errors: state.errors,
    formData: state.formData,
    isCheckingEmail: state.isCheckingEmail,
    emailAvailable: state.emailAvailable,
    lastCheckedEmail: state.lastCheckedEmail,

    // Computed properties
    isLoading,
    isSuccess,
    isError,
    isIdle,
    hasErrors,
    canSubmit,
    currentStep,
    totalSteps,
    canGoNext,
    canGoPrev,
    isFirstStep,
    isLastStep,
    progressPercentage,

    // Actions
    updateFormData,
    updateFormDataBulk,
    clearErrors,
    clearFieldError,
    validateForm,
    createTeamMember,
    reset,
    checkEmailAvailability,
    goToNextStep,
    goToPrevStep,
    goToStep,
    markStepComplete,
  } satisfies UseCreateTeamMemberReturn
}