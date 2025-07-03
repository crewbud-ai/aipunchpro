// ==============================================
// src/hooks/projects/use-update-project.ts - Complete Update Project Hook
// ==============================================

import { useState, useCallback } from 'react'
import { projectsApi } from '@/lib/api/projects'
import {
  validateUpdateProject,
  transformUpdateFormDataToApiData,
  projectToUpdateFormData,
  hasFormChanges,
  type Project,
  type UpdateProjectData,
  type UpdateProjectFormData,
  type UpdateProjectState,
  type UpdateProjectResult,
  type ProjectFormErrors,
  type LocationSuggestion,
  LocationSuggestionFree,
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

  // Location autocomplete state
  locationSuggestions: LocationSuggestion[]
  isLoadingLocation: boolean
  locationError: string | null
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

  // Location autocomplete actions
  searchLocations: (query: string) => Promise<void>
  selectLocation: (suggestion: LocationSuggestion) => Promise<void>
  clearLocationSuggestions: () => void

  // FREE Location autocomplete actions (Nominatim)
  searchLocationsFree: (query: string) => Promise<void>
  selectLocationFree: (suggestion: LocationSuggestionFree) => Promise<void>


  // Name availability checking (excluding current project)
  checkNameAvailability: (name: string, currentProjectId: string) => Promise<void>
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
  hasLocationSuggestions: boolean
}

// ==============================================
// DEFAULT FORM DATA
// ==============================================
const getDefaultUpdateFormData = (projectId: string): UpdateProjectFormData => ({
  id: projectId,
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
  actualStartDate: '',
  actualEndDate: '',
  estimatedHours: undefined,
  actualHours: undefined,
  locationSearch: '',
  selectedLocation: undefined,
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  clientContactPerson: '',
  clientWebsite: '',
  clientNotes: '',
  projectManagerId: undefined,
  foremanId: undefined,
  tags: [],
})

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
    formData: getDefaultUpdateFormData(''),
    originalProject: null,
    hasChanges: false,
    locationSuggestions: [],
    isLoadingLocation: false,
    locationError: null,
  })

  // ==============================================
  // COMPUTED PROPERTIES
  // ==============================================
  const isLoading = state.state === 'loading'
  const isSuccess = state.state === 'success'
  const isError = state.state === 'error'
  const isIdle = state.state === 'idle'
  const hasErrors = Object.keys(state.errors).length > 0
  const isInitialized = state.originalProject !== null
  const canSubmit = state.hasChanges && !isLoading && !hasErrors && isInitialized
  const hasLocationSuggestions = state.locationSuggestions.length > 0

  // ==============================================
  // FORM INITIALIZATION
  // ==============================================
  const initializeForm = useCallback((project: Project) => {
    const formData = projectToUpdateFormData(project)

    setState(prev => ({
      ...prev,
      formData,
      originalProject: project,
      hasChanges: false,
      errors: {},
      state: 'idle',
      result: null,
      locationSuggestions: [],
      isLoadingLocation: false,
      locationError: null,
    }))
  }, [])

  // ==============================================
  // FORM DATA MANAGEMENT
  // ==============================================
  const updateFormData = useCallback((field: keyof UpdateProjectFormData, value: any) => {
    setState(prev => {
      const newFormData = { ...prev.formData, [field]: value }
      const newHasChanges = prev.originalProject ? hasFormChanges(newFormData, prev.originalProject) : false

      return {
        ...prev,
        formData: newFormData,
        hasChanges: newHasChanges,
        // Clear field error when user starts typing
        errors: { ...prev.errors, [field]: undefined },
      }
    })
  }, [])

  const updateFormDataBulk = useCallback((data: Partial<UpdateProjectFormData>) => {
    setState(prev => {
      const newFormData = { ...prev.formData, ...data }
      const newHasChanges = prev.originalProject ? hasFormChanges(newFormData, prev.originalProject) : false

      return {
        ...prev,
        formData: newFormData,
        hasChanges: newHasChanges,
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
      validation.error.errors.forEach((error: any) => {
        const fieldPath = error.path.join('.')
        newErrors[fieldPath as keyof ProjectFormErrors] = error.message
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
  // LOCATION AUTOCOMPLETE
  // ==============================================
  const searchLocations = useCallback(async (query: string) => {
    if (query.length < 3) {
      setState(prev => ({
        ...prev,
        locationSuggestions: [],
        locationError: null,
      }))
      return
    }

    try {
      setState(prev => ({
        ...prev,
        isLoadingLocation: true,
        locationError: null,
      }))

      const response = await projectsApi.getLocationSuggestions(query)

      if (response.success) {
        setState(prev => ({
          ...prev,
          locationSuggestions: response.suggestions,
          isLoadingLocation: false,
        }))
      } else {
        setState(prev => ({
          ...prev,
          locationSuggestions: [],
          isLoadingLocation: false,
          locationError: response.message || 'Failed to search locations',
        }))
      }
    } catch (error: any) {
      console.error('Error searching locations:', error)
      setState(prev => ({
        ...prev,
        locationSuggestions: [],
        isLoadingLocation: false,
        locationError: 'Failed to search locations',
      }))
    }
  }, [])

  const selectLocation = useCallback(async (suggestion: LocationSuggestion) => {
    try {
      setState(prev => ({
        ...prev,
        isLoadingLocation: true,
        locationError: null,
      }))

      // Get detailed location info
      const response = await projectsApi.getLocationDetails(suggestion.place_id)

      if (response.success) {
        const place = response.place

        updateFormDataBulk({
          locationSearch: suggestion.description,
          selectedLocation: {
            address: place.formatted_address,
            displayName: place.name || suggestion.structured_formatting.main_text,
            coordinates: {
              lat: place.geometry.location.lat,
              lng: place.geometry.location.lng,
            },
            placeId: suggestion.place_id,
          },
        })

        setState(prev => ({
          ...prev,
          locationSuggestions: [],
          isLoadingLocation: false,
        }))
      } else {
        setState(prev => ({
          ...prev,
          isLoadingLocation: false,
          locationError: response.message || 'Failed to get location details',
        }))
      }
    } catch (error: any) {
      console.error('Error selecting location:', error)
      setState(prev => ({
        ...prev,
        isLoadingLocation: false,
        locationError: 'Failed to get location details',
      }))
    }
  }, [updateFormDataBulk])

  // ==============================================
  // FREE LOCATION AUTOCOMPLETE (for development)
  // ==============================================
  const searchLocationsFree = useCallback(async (query: string) => {
    if (query.length < 3) {
      setState(prev => ({
        ...prev,
        locationSuggestions: [],
        locationError: null,
      }))
      return
    }

    try {
      setState(prev => ({
        ...prev,
        isLoadingLocation: true,
        locationError: null,
      }))

      // Use FREE version for development
      const response = await projectsApi.getLocationSuggestionsFree(query)

      if (response.success) {
        setState(prev => ({
          ...prev,
          locationSuggestions: response.suggestions,
          isLoadingLocation: false,
        }))
      } else {
        setState(prev => ({
          ...prev,
          locationSuggestions: [],
          isLoadingLocation: false,
          locationError: response.message || 'Failed to search locations',
        }))
      }
    } catch (error: any) {
      console.error('Error searching locations (free):', error)
      setState(prev => ({
        ...prev,
        locationSuggestions: [],
        isLoadingLocation: false,
        locationError: 'Failed to search locations',
      }))
    }
  }, [])

  const selectLocationFree = useCallback(async (suggestion: LocationSuggestionFree) => {
    try {
      setState(prev => ({
        ...prev,
        isLoadingLocation: true,
        locationError: null,
      }))

      // For Nominatim suggestions, coordinates are already included
      if (suggestion.coordinates) {
        // Use coordinates directly from suggestion (faster for Nominatim)
        updateFormDataBulk({
          locationSearch: suggestion.description,
          selectedLocation: {
            address: suggestion.description,
            displayName: suggestion.structured_formatting.main_text,
            coordinates: {
              lat: suggestion.coordinates.lat,
              lng: suggestion.coordinates.lng,
            },
            placeId: suggestion.place_id,
          },
        })

        setState(prev => ({
          ...prev,
          locationSuggestions: [],
          isLoadingLocation: false,
        }))
      } else {
        // Fallback to details API call (use FREE version)
        const response = await projectsApi.getLocationDetailsFree(suggestion.place_id)

        if (response.success) {
          const place = response.place

          updateFormDataBulk({
            locationSearch: suggestion.description,
            selectedLocation: {
              address: place.formatted_address,
              displayName: place.name || suggestion.structured_formatting.main_text,
              coordinates: {
                lat: place.geometry.location.lat,
                lng: place.geometry.location.lng,
              },
              placeId: suggestion.place_id,
            },
          })

          setState(prev => ({
            ...prev,
            locationSuggestions: [],
            isLoadingLocation: false,
          }))
        } else {
          setState(prev => ({
            ...prev,
            isLoadingLocation: false,
            locationError: response.message || 'Failed to get location details',
          }))
        }
      }
    } catch (error: any) {
      console.error('Error selecting location (free):', error)
      setState(prev => ({
        ...prev,
        isLoadingLocation: false,
        locationError: 'Failed to get location details',
      }))
    }
  }, [updateFormDataBulk])


  const clearLocationSuggestions = useCallback(() => {
    setState(prev => ({
      ...prev,
      locationSuggestions: [],
      locationError: null,
    }))
  }, [])

  // ==============================================
  // NAME AVAILABILITY CHECKING (excluding current project)
  // ==============================================
  const checkNameAvailability = useCallback(async (name: string, currentProjectId: string) => {
    if (!name.trim() || name.length < 2) {
      updateFormData('isNameAvailable', undefined)
      updateFormData('lastCheckedName', '')
      return
    }

    // Don't check if name hasn't changed from original
    if (state.originalProject && name === state.originalProject.name) {
      updateFormDataBulk({
        isNameAvailable: true,
        lastCheckedName: name,
        isCheckingName: false,
      })
      return
    }

    try {
      updateFormData('isCheckingName', true)

      // Get projects with this name
      const response = await projectsApi.getProjects({
        search: name,
        limit: 10 // Get a few to check for exact matches
      })

      // Check if exact match exists (excluding current project)
      const exactMatch = response.data.projects.find(
        project => project.name.toLowerCase() === name.toLowerCase() && project.id !== currentProjectId
      )

      const isAvailable = !exactMatch

      updateFormDataBulk({
        isNameAvailable: isAvailable,
        lastCheckedName: name,
        isCheckingName: false,
      })

      if (!isAvailable) {
        setState(prev => ({
          ...prev,
          errors: {
            ...prev.errors,
            name: 'A project with this name already exists'
          },
        }))
      }
    } catch (error: any) {
      console.error('Error checking name availability:', error)
      updateFormDataBulk({
        isCheckingName: false,
        isNameAvailable: undefined,
        lastCheckedName: '',
      })
    }
  }, [state.originalProject, updateFormData, updateFormDataBulk])

  // ==============================================
  // UPDATE PROJECT
  // ==============================================
  const updateProject = useCallback(async (data?: UpdateProjectData) => {
    if (!isInitialized) {
      setState(prev => ({
        ...prev,
        errors: { general: 'Project must be initialized before updating' },
      }))
      return
    }

    try {
      setState(prev => ({
        ...prev,
        state: 'loading',
        errors: {},
      }))

      // Use provided data or transform form data
      const projectData = data || transformUpdateFormDataToApiData(state.formData)

      // Validate data before sending
      const validation = validateUpdateProject(projectData)
      if (!validation.success) {
        const newErrors: ProjectFormErrors = {}
        validation.error.errors.forEach((error: any) => {
          const fieldPath = error.path.join('.')
          newErrors[fieldPath as keyof ProjectFormErrors] = error.message
        })

        setState(prev => ({
          ...prev,
          state: 'error',
          errors: newErrors,
        }))
        return
      }

      const response = await projectsApi.updateProject(projectData.id, projectData)

      if (response.success) {
        const updatedProject = response.data.project

        setState(prev => ({
          ...prev,
          state: 'success',
          result: response,
          originalProject: updatedProject,
          formData: projectToUpdateFormData(updatedProject),
          hasChanges: false,
          errors: {},
        }))
      } else {
        setState(prev => ({
          ...prev,
          state: 'error',
          errors: { general: response.message || 'Failed to update project' },
        }))
      }
    } catch (error: any) {
      console.error('Error updating project:', error)

      setState(prev => ({
        ...prev,
        state: 'error',
        errors: { general: error.message || 'Failed to update project' },
      }))
    }
  }, [state.formData, isInitialized])

  // ==============================================
  // FORM RESET
  // ==============================================
  const resetForm = useCallback(() => {
    if (state.originalProject) {
      const formData = projectToUpdateFormData(state.originalProject)
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

  const reset = useCallback(() => {
    setState({
      state: 'idle',
      result: null,
      errors: {},
      formData: getDefaultUpdateFormData(''),
      originalProject: null,
      hasChanges: false,
      locationSuggestions: [],
      isLoadingLocation: false,
      locationError: null,
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
    locationSuggestions: state.locationSuggestions,
    isLoadingLocation: state.isLoadingLocation,
    locationError: state.locationError,

    // Computed properties
    isLoading,
    isSuccess,
    isError,
    isIdle,
    hasErrors,
    canSubmit,
    isInitialized,
    hasLocationSuggestions,

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

    // Location actions
    searchLocations,
    selectLocation,
    clearLocationSuggestions,

    // FREE Location actions (Nominatim - for development)
    searchLocationsFree,
    selectLocationFree,

    // Name checking
    checkNameAvailability,
  } satisfies UseUpdateProjectReturn
}