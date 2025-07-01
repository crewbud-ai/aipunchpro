// ==============================================
// src/hooks/projects/use-create-project.ts - Create Project Hook
// ==============================================

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { projectsApi } from '@/lib/api/projects'
import { 
  validateCreateProject,
  type CreateProjectData,
  type CreateProjectFormData,
  type CreateProjectState,
  type CreateProjectResult,
  type ProjectFormErrors,
  type ProjectFieldError,
} from '@/types/projects'

// ==============================================
// HOOK INTERFACES
// ==============================================
interface UseCreateProjectState {
  state: CreateProjectState
  result: CreateProjectResult | null
  errors: ProjectFormErrors
  formData: CreateProjectFormData
}

interface UseCreateProjectActions {
  updateFormData: (field: keyof CreateProjectFormData, value: any) => void
  updateFormDataBulk: (data: Partial<CreateProjectFormData>) => void
  clearErrors: () => void
  clearFieldError: (field: keyof ProjectFormErrors) => void
  validateForm: () => boolean
  createProject: (data?: CreateProjectData) => Promise<void>
  reset: () => void
}

interface UseCreateProjectReturn extends UseCreateProjectState, UseCreateProjectActions {
  // Computed properties
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
  isIdle: boolean
  hasErrors: boolean
  canSubmit: boolean
}

// ==============================================
// DEFAULT FORM DATA
// ==============================================
const DEFAULT_FORM_DATA: CreateProjectFormData = {
  name: '',
  description: '',
  projectNumber: '',
  status: 'not_started',
  priority: 'medium',
  budget: undefined,
  startDate: '',
  endDate: '',
  estimatedHours: undefined,
  location: '',
  address: '',
  clientName: '',
  clientContact: '',
  tags: [],
}

// ==============================================
// MAIN HOOK
// ==============================================
export const useCreateProject = () => {
  const router = useRouter()

  // ==============================================
  // STATE
  // ==============================================
  const [state, setState] = useState<UseCreateProjectState>({
    state: 'idle',
    result: null,
    errors: {},
    formData: { ...DEFAULT_FORM_DATA },
  })

  // ==============================================
  // COMPUTED PROPERTIES
  // ==============================================
  const isLoading = state.state === 'loading'
  const isSuccess = state.state === 'success'
  const isError = state.state === 'error'
  const isIdle = state.state === 'idle'
  const hasErrors = Object.keys(state.errors).length > 0
  const canSubmit = state.formData.name.trim().length > 0 && !isLoading

  // ==============================================
  // FORM DATA MANAGEMENT
  // ==============================================
  const updateFormData = useCallback((field: keyof CreateProjectFormData, value: any) => {
    setState(prev => ({
      ...prev,
      formData: { ...prev.formData, [field]: value },
      // Clear field error when user starts typing
      errors: { ...prev.errors, [field]: undefined },
    }))
  }, [])

  const updateFormDataBulk = useCallback((data: Partial<CreateProjectFormData>) => {
    setState(prev => ({
      ...prev,
      formData: { ...prev.formData, ...data },
    }))
  }, [])

  // ==============================================
  // ERROR MANAGEMENT
  // ==============================================
  const clearErrors = useCallback(() => {
    setState(prev => ({
      ...prev,
      errors: {},
    }))
  }, [])

  const clearFieldError = useCallback((field: keyof ProjectFormErrors) => {
    setState(prev => ({
      ...prev,
      errors: { ...prev.errors, [field]: undefined },
    }))
  }, [])

  // ==============================================
  // FORM VALIDATION
  // ==============================================
  const validateForm = useCallback(() => {
    const validation = validateCreateProject(state.formData)
    
    if (!validation.success) {
      const newErrors: ProjectFormErrors = {}
      validation.errors.forEach((error: ProjectFieldError) => {
        newErrors[error.field as keyof ProjectFormErrors] = error.message
      })
      
      setState(prev => ({
        ...prev,
        errors: newErrors,
      }))
      return false
    }
    
    setState(prev => ({
      ...prev,
      errors: {},
    }))
    return true
  }, [state.formData])

  // ==============================================
  // CREATE PROJECT
  // ==============================================
  const createProject = useCallback(async (data?: CreateProjectData) => {
    const projectData = data || state.formData
    
    // Validate form if using form data
    if (!data && !validateForm()) {
      return
    }

    try {
      setState(prev => ({
        ...prev,
        state: 'loading',
        errors: {},
      }))
      
      const response = await projectsApi.createProject(projectData)
      
      setState(prev => ({
        ...prev,
        result: response,
      }))
      
      if (response.success) {
        setState(prev => ({
          ...prev,
          state: 'success',
        }))
        
        // Navigate to the new project after a brief delay for UX
        setTimeout(() => {
          router.push(`/dashboard/projects/${response.data.project.id}`)
        }, 1000)
        
      } else {
        setState(prev => ({
          ...prev,
          state: 'error',
          errors: { general: response.message || 'Failed to create project' },
        }))
      }
    } catch (error: any) {
      console.error('Create project error:', error)
      
      setState(prev => ({
        ...prev,
        state: 'error',
      }))
      
      // Handle different error types
      if (error.status === 400 && error.details) {
        // Validation errors from API
        const newErrors: ProjectFormErrors = {}
        error.details.forEach((detail: ProjectFieldError) => {
          newErrors[detail.field as keyof ProjectFormErrors] = detail.message
        })
        setState(prev => ({
          ...prev,
          errors: newErrors,
        }))
      } else if (error.status === 409) {
        // Duplicate name error
        setState(prev => ({
          ...prev,
          errors: { name: error.message || 'A project with this name already exists' },
        }))
      } else {
        // General error
        setState(prev => ({
          ...prev,
          errors: { general: error.message || 'Failed to create project' },
        }))
      }
    }
  }, [state.formData, validateForm, router])

  // ==============================================
  // RESET FORM
  // ==============================================
  const reset = useCallback(() => {
    setState({
      state: 'idle',
      result: null,
      errors: {},
      formData: { ...DEFAULT_FORM_DATA },
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
    
    // Computed properties
    isLoading,
    isSuccess,
    isError,
    isIdle,
    hasErrors,
    canSubmit,
    
    // Actions
    updateFormData,
    updateFormDataBulk,
    clearErrors,
    clearFieldError,
    validateForm,
    createProject,
    reset,
  } satisfies UseCreateProjectReturn
}