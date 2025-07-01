// ==============================================
// src/hooks/projects/use-update-project.ts - Update Project Hook
// ==============================================

import { useState, useCallback, useEffect } from 'react'
import { projectsApi } from '@/lib/api/projects'
import { 
  validateUpdateProject,
  type Project,
  type UpdateProjectData,
  type UpdateProjectFormData,
  type UpdateProjectState,
  type UpdateProjectResult,
  type ProjectFormErrors,
  type ProjectFieldError,
} from '@/types/projects'

// ==============================================
// HOOK INTERFACES
// ==============================================
interface UseUpdateProjectState {
  state: UpdateProjectState
  result: UpdateProjectResult | null
  errors: ProjectFormErrors
  formData: UpdateProjectFormData
  originalProject: Project | null
  hasChanges: boolean
}

interface UseUpdateProjectActions {
  initializeForm: (project: Project) => void
  updateFormData: (field: keyof UpdateProjectFormData, value: any) => void
  updateFormDataBulk: (data: Partial<UpdateProjectFormData>) => void
  clearErrors: () => void
  clearFieldError: (field: keyof ProjectFormErrors) => void
  validateForm: () => boolean
  updateProject: (data?: UpdateProjectData) => Promise<void>
  resetForm: () => void
  reset: () => void
}

interface UseUpdateProjectReturn extends UseUpdateProjectState, UseUpdateProjectActions {
  // Computed properties
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
  isIdle: boolean
  hasErrors: boolean
  canSubmit: boolean
  isInitialized: boolean
}

// ==============================================
// UTILITY FUNCTIONS
// ==============================================
const projectToFormData = (project: Project): UpdateProjectFormData => ({
  id: project.id,
  name: project.name,
  description: project.description || '',
  projectNumber: project.projectNumber || '',
  status: project.status,
  priority: project.priority,
  budget: project.budget,
  spent: project.spent,
  progress: project.progress,
  startDate: project.startDate || '',
  endDate: project.endDate || '',
  estimatedHours: project.estimatedHours,
  actualHours: project.actualHours,
  location: project.location || '',
  address: project.address || '',
  clientName: project.clientName || '',
  clientContact: project.clientContact || '',
  tags: project.tags || [],
})

const hasFormChanges = (
  current: UpdateProjectFormData, 
  original: Project | null
): boolean => {
  if (!original) return false
  
  const originalForm = projectToFormData(original)
  
  // Compare all fields
  return (
    current.name !== originalForm.name ||
    current.description !== originalForm.description ||
    current.projectNumber !== originalForm.projectNumber ||
    current.status !== originalForm.status ||
    current.priority !== originalForm.priority ||
    current.budget !== originalForm.budget ||
    current.spent !== originalForm.spent ||
    current.progress !== originalForm.progress ||
    current.startDate !== originalForm.startDate ||
    current.endDate !== originalForm.endDate ||
    current.estimatedHours !== originalForm.estimatedHours ||
    current.actualHours !== originalForm.actualHours ||
    current.location !== originalForm.location ||
    current.address !== originalForm.address ||
    current.clientName !== originalForm.clientName ||
    current.clientContact !== originalForm.clientContact ||
    JSON.stringify(current.tags) !== JSON.stringify(originalForm.tags)
  )
}

// ==============================================
// MAIN HOOK
// ==============================================
export const useUpdateProject = () => {
  // ==============================================
  // STATE
  // ==============================================
  const [state, setState] = useState<UseUpdateProjectState>({
    state: 'idle',
    result: null,
    errors: {},
    formData: {
      id: '',
      name: '',
      description: '',
      projectNumber: '',
      status: 'not_started',
      priority: 'medium',
      budget: undefined,
      spent: undefined,
      progress: undefined,
      startDate: '',
      endDate: '',
      estimatedHours: undefined,
      actualHours: undefined,
      location: '',
      address: '',
      clientName: '',
      clientContact: '',
      tags: [],
    },
    originalProject: null,
    hasChanges: false,
  })

  // ==============================================
  // COMPUTED PROPERTIES
  // ==============================================
  const isLoading = state.state === 'loading'
  const isSuccess = state.state === 'success'
  const isError = state.state === 'error'
  const isIdle = state.state === 'idle'
  const hasErrors = Object.keys(state.errors).length > 0
  const canSubmit = (state.formData.name?.trim().length || 0) > 0 && !isLoading && state.hasChanges
  const isInitialized = state.originalProject !== null

  // ==============================================
  // INITIALIZE FORM
  // ==============================================
  const initializeForm = useCallback((project: Project) => {
    const formData = projectToFormData(project)
    
    setState(prev => ({
      ...prev,
      formData,
      originalProject: project,
      hasChanges: false,
      errors: {},
      state: 'idle',
      result: null,
    }))
  }, [])

  // ==============================================
  // FORM DATA MANAGEMENT
  // ==============================================
  const updateFormData = useCallback((field: keyof UpdateProjectFormData, value: any) => {
    setState(prev => {
      const newFormData = { ...prev.formData, [field]: value }
      const hasChanges = hasFormChanges(newFormData, prev.originalProject)
      
      return {
        ...prev,
        formData: newFormData,
        hasChanges,
        // Clear field error when user starts typing
        errors: { ...prev.errors, [field]: undefined },
      }
    })
  }, [])

  const updateFormDataBulk = useCallback((data: Partial<UpdateProjectFormData>) => {
    setState(prev => {
      const newFormData = { ...prev.formData, ...data }
      const hasChanges = hasFormChanges(newFormData, prev.originalProject)
      
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
    const validation = validateUpdateProject(state.formData)
    
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
  // UPDATE PROJECT
  // ==============================================
  const updateProject = useCallback(async (data?: UpdateProjectData) => {
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
      
      const response = await projectsApi.updateProject(projectData)
      
      setState(prev => ({
        ...prev,
        result: response,
      }))
      
      if (response.success) {
        setState(prev => ({
          ...prev,
          state: 'success',
          originalProject: response.data.project,
          formData: projectToFormData(response.data.project),
          hasChanges: false,
        }))
        
        // Reset to idle after showing success state
        setTimeout(() => {
          setState(prev => ({
            ...prev,
            state: 'idle',
          }))
        }, 2000)
        
      } else {
        setState(prev => ({
          ...prev,
          state: 'error',
          errors: { general: response.message || 'Failed to update project' },
        }))
      }
    } catch (error: any) {
      console.error('Update project error:', error)
      
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
      } else if (error.status === 404) {
        // Project not found
        setState(prev => ({
          ...prev,
          errors: { general: 'Project not found' },
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
          errors: { general: error.message || 'Failed to update project' },
        }))
      }
    }
  }, [state.formData, validateForm])

  // ==============================================
  // RESET FORM TO ORIGINAL
  // ==============================================
  const resetForm = useCallback(() => {
    if (state.originalProject) {
      const formData = projectToFormData(state.originalProject)
      setState(prev => ({
        ...prev,
        formData,
        hasChanges: false,
        errors: {},
        state: 'idle',
        result: null,
      }))
    }
  }, [state.originalProject])

  // ==============================================
  // RESET COMPLETELY
  // ==============================================
  const reset = useCallback(() => {
    setState({
      state: 'idle',
      result: null,
      errors: {},
      formData: {
        id: '',
        name: '',
        description: '',
        projectNumber: '',
        status: 'not_started',
        priority: 'medium',
        budget: undefined,
        spent: undefined,
        progress: undefined,
        startDate: '',
        endDate: '',
        estimatedHours: undefined,
        actualHours: undefined,
        location: '',
        address: '',
        clientName: '',
        clientContact: '',
        tags: [],
      },
      originalProject: null,
      hasChanges: false,
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
    originalProject: state.originalProject,
    hasChanges: state.hasChanges,
    
    // Computed properties
    isLoading,
    isSuccess,
    isError,
    isIdle,
    hasErrors,
    canSubmit,
    isInitialized,
    
    // Actions
    initializeForm,
    updateFormData,
    updateFormDataBulk,
    clearErrors,
    clearFieldError,
    validateForm,
    updateProject,
    resetForm,
    reset,
  } satisfies UseUpdateProjectReturn
}