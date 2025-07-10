// ==============================================
// src/hooks/team-members/use-update-team-member.ts - Update Team Member Hook
// ==============================================

import { useState, useCallback } from 'react'
import { teamMembersApi } from '@/lib/api/team-members'
import {
    validateUpdateTeamMember,
    getDefaultUpdateTeamMemberFormData,
    convertTeamMemberToFormData,
    type TeamMember,
    type UpdateTeamMemberData,
    type UpdateTeamMemberFormData,
    type UpdateTeamMemberState,
    type UpdateTeamMemberResult,
    type TeamMemberFormErrors,
} from '@/types/team-members'

// ==============================================
// HOOK INTERFACES
// ==============================================
interface UseUpdateTeamMemberState {
    state: UpdateTeamMemberState
    result: UpdateTeamMemberResult | null
    errors: TeamMemberFormErrors
    formData: UpdateTeamMemberFormData
    originalTeamMember: TeamMember | null
    hasChanges: boolean

    // Email checking state
    isCheckingEmail: boolean
    emailAvailable: boolean
    lastCheckedEmail: string
}

interface UseUpdateTeamMemberActions {
    initializeForm: (teamMember: TeamMember) => void
    updateFormData: (field: keyof UpdateTeamMemberFormData, value: any) => void
    updateFormDataBulk: (data: Partial<UpdateTeamMemberFormData>) => void
    clearErrors: () => void
    clearFieldError: (field: keyof TeamMemberFormErrors) => void
    validateForm: () => boolean
    updateTeamMember: (data?: UpdateTeamMemberData) => Promise<void>
    resetForm: () => void
    reset: () => void

    // Email availability checking (excluding current team member)
    checkEmailAvailability: (email: string, currentTeamMemberId: string) => Promise<void>

    // Multi-step form helpers
    goToNextStep: () => void
    goToPrevStep: () => void
    goToStep: (step: number) => void
    markStepComplete: (step: number) => void
}

interface UseUpdateTeamMemberReturn extends UseUpdateTeamMemberState, UseUpdateTeamMemberActions {
    // Computed properties
    isLoading: boolean
    isSuccess: boolean
    isError: boolean
    isIdle: boolean
    hasErrors: boolean
    canSubmit: boolean
    isInitialized: boolean

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
function transformFormDataToApiData(formData: UpdateTeamMemberFormData, teamMemberId: string): UpdateTeamMemberData {
    console.log(formData, 'formData')
    const data: UpdateTeamMemberData = {
        id: teamMemberId,
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
        data.assignToProject = true  // Add this line for clarity
        data.projectId = formData.projectId
        data.projectHourlyRate = formData.projectHourlyRate
        data.projectOvertimeRate = formData.projectOvertimeRate
        data.projectNotes = formData.projectNotes?.trim() || undefined
    }

    return data
}

// ==============================================
// FORM CHANGES DETECTION
// ==============================================
function hasFormChanges(formData: UpdateTeamMemberFormData, originalTeamMember: TeamMember | null): boolean {
    if (!originalTeamMember) return false

    const originalFormData = convertTeamMemberToFormData(originalTeamMember)

    return (
        formData.firstName !== originalFormData.firstName ||
        formData.lastName !== originalFormData.lastName ||
        formData.email !== originalFormData.email ||
        formData.phone !== originalFormData.phone ||
        formData.role !== originalFormData.role ||
        formData.jobTitle !== originalFormData.jobTitle ||
        formData.tradeSpecialty !== originalFormData.tradeSpecialty ||
        formData.hourlyRate !== originalFormData.hourlyRate ||
        formData.overtimeRate !== originalFormData.overtimeRate ||
        formData.startDate !== originalFormData.startDate ||
        formData.certifications !== originalFormData.certifications ||
        formData.emergencyContactName !== originalFormData.emergencyContactName ||
        formData.emergencyContactPhone !== originalFormData.emergencyContactPhone ||
        formData.isActive !== originalFormData.isActive
    )
}

// ==============================================
// MAIN HOOK
// ==============================================
export const useUpdateTeamMember = () => {
    // ==============================================
    // STATE
    // ==============================================
    const [state, setState] = useState<UseUpdateTeamMemberState>({
        state: 'idle',
        result: null,
        errors: {},
        formData: getDefaultUpdateTeamMemberFormData(),
        originalTeamMember: null,
        hasChanges: false,
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
    const canSubmit = !hasErrors && !isLoading && state.hasChanges && !!state.formData.firstName && !!state.formData.lastName && !!state.formData.email
    const isInitialized = state.originalTeamMember !== null

    // Multi-step form computed properties
    const currentStep = state.formData.currentStep || 1
    const totalSteps = 4
    const canGoNext = currentStep < totalSteps
    const canGoPrev = currentStep > 1
    const isFirstStep = currentStep === 1
    const isLastStep = currentStep === totalSteps
    const progressPercentage = (currentStep / totalSteps) * 100

    // ==============================================
    // INITIALIZE FORM
    // ==============================================
    const initializeForm = useCallback((teamMember: TeamMember) => {
        const formData = convertTeamMemberToFormData(teamMember)
        setState(prev => ({
            ...prev,
            formData,
            originalTeamMember: teamMember,
            hasChanges: false,
            errors: {},
            lastCheckedEmail: teamMember.email,
        }))
    }, [])

    // ==============================================
    // FORM DATA MANAGEMENT
    // ==============================================
    const updateFormData = useCallback((field: keyof UpdateTeamMemberFormData, value: any) => {
        setState(prev => {
            const newFormData = { ...prev.formData, [field]: value }
            const hasChanges = hasFormChanges(newFormData, prev.originalTeamMember)

            return {
                ...prev,
                formData: newFormData,
                hasChanges,
                // Clear field error when user starts typing
                errors: { ...prev.errors, [field]: undefined },
            }
        })
    }, [])

    const updateFormDataBulk = useCallback((data: Partial<UpdateTeamMemberFormData>) => {
        setState(prev => {
            const newFormData = { ...prev.formData, ...data }
            const hasChanges = hasFormChanges(newFormData, prev.originalTeamMember)

            return {
                ...prev,
                formData: newFormData,
                hasChanges,
            }
        })
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
        if (!state.originalTeamMember) {
            setState(prev => ({
                ...prev,
                errors: { general: 'No team member data available for validation' }
            }))
            return false
        }

        const apiData = transformFormDataToApiData(state.formData, state.originalTeamMember.id)
        const validation = validateUpdateTeamMember(apiData)

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
    }, [state.formData, state.originalTeamMember])

    // ==============================================
    // EMAIL AVAILABILITY CHECKING
    // ==============================================
    const checkEmailAvailability = useCallback(async (email: string, currentTeamMemberId: string) => {
        if (!email || email === state.lastCheckedEmail) {
            return
        }

        try {
            setState(prev => ({ ...prev, isCheckingEmail: true }))

            const response = await teamMembersApi.checkEmailAvailability(email, currentTeamMemberId)

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
    // UPDATE TEAM MEMBER
    // ==============================================
    const updateTeamMember = useCallback(async (customData?: UpdateTeamMemberData) => {
        if (!state.originalTeamMember) {
            setState(prev => ({
                ...prev,
                errors: { general: 'No team member loaded for update' }
            }))
            return
        }

        try {
            setState(prev => ({ ...prev, state: 'loading', errors: {} }))

            // Use custom data if provided, otherwise transform form data
            const apiData = customData || transformFormDataToApiData(state.formData, state.originalTeamMember.id)

            console.log(apiData, 'Update Team Member apiData')

            // Validate data
            const validation = validateUpdateTeamMember(apiData)
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

            // Update team member
            const response = await teamMembersApi.updateTeamMember(state.originalTeamMember.id, apiData)

            setState(prev => ({
                ...prev,
                state: 'success',
                result: response,
                originalTeamMember: response.data.teamMember,
                hasChanges: false,
                errors: {},
            }))

            // Update form data with the updated team member
            const updatedFormData = convertTeamMemberToFormData(response.data.teamMember)
            setState(prev => ({
                ...prev,
                formData: updatedFormData,
            }))

        } catch (error: any) {
            console.error('Error updating team member:', error)

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
                    errors: { general: error.message || 'Failed to update team member' },
                }))
            }
        }
    }, [state.formData, state.originalTeamMember])

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
    // RESET FUNCTIONS
    // ==============================================
    const resetForm = useCallback(() => {
        if (state.originalTeamMember) {
            initializeForm(state.originalTeamMember)
        }
    }, [state.originalTeamMember, initializeForm])

    const reset = useCallback(() => {
        setState({
            state: 'idle',
            result: null,
            errors: {},
            formData: getDefaultUpdateTeamMemberFormData(),
            originalTeamMember: null,
            hasChanges: false,
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
        originalTeamMember: state.originalTeamMember,
        hasChanges: state.hasChanges,
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
        isInitialized,
        currentStep,
        totalSteps,
        canGoNext,
        canGoPrev,
        isFirstStep,
        isLastStep,
        progressPercentage,

        // Actions
        initializeForm,
        updateFormData,
        updateFormDataBulk,
        clearErrors,
        clearFieldError,
        validateForm,
        updateTeamMember,
        resetForm,
        reset,
        checkEmailAvailability,
        goToNextStep,
        goToPrevStep,
        goToStep,
        markStepComplete,
    } satisfies UseUpdateTeamMemberReturn
}