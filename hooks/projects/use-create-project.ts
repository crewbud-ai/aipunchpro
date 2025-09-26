// ==============================================
// src/hooks/projects/use-create-project.ts - Complete Professional Create Project Hook
// ==============================================

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { projectsApi } from '@/lib/api/projects'
import {
  validateCreateProject,
  transformFormDataToApiData,
  getDefaultCreateProjectFormData,
  type CreateProjectData,
  type CreateProjectFormData,
  type CreateProjectState,
  type CreateProjectResult,
  type ProjectFormErrors,
  type LocationSuggestion,
  LocationSuggestionFree,
} from '@/types/projects'
import { SelectedLocation } from '../places'

// ==============================================
// HOOK INTERFACES
// ==============================================
interface UseCreateProjectState {
  state: CreateProjectState
  result: CreateProjectResult | null
  errors: ProjectFormErrors
  formData: CreateProjectFormData

  // Location autocomplete state
  locationSuggestions: LocationSuggestion[]
  isLoadingLocation: boolean
  locationError: string | null

  // Project number state
  projectNumber: string
  isLoadingProjectNumber: boolean
  projectNumberError: string | null
}

interface UseCreateProjectActions {
  updateFormData: (field: keyof CreateProjectFormData, value: any) => void
  updateFormDataBulk: (data: Partial<CreateProjectFormData>) => void
  clearErrors: () => void
  clearFieldError: (field: keyof ProjectFormErrors) => void
  validateForm: () => boolean
  createProject: (data?: CreateProjectData) => Promise<void>
  reset: () => void

  // Location autocomplete actions
  searchLocations: (query: string) => Promise<void>
  selectLocation: (suggestion: LocationSuggestion) => Promise<void>
  clearLocationSuggestions: () => void

  // FREE Location autocomplete actions (Nominatim)
  searchLocationsFree: (query: string) => Promise<void>
  selectLocationFree: (suggestion: LocationSuggestionFree) => Promise<void>

  // Project number actions
  generateProjectNumber: () => Promise<void>
}

interface UseCreateProjectReturn extends UseCreateProjectState, UseCreateProjectActions {
  // Computed properties
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
  isIdle: boolean
  hasErrors: boolean
  canSubmit: boolean
  hasLocationSuggestions: boolean
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
    formData: getDefaultCreateProjectFormData(),
    locationSuggestions: [],
    isLoadingLocation: false,
    locationError: null,
    projectNumber: '',
    isLoadingProjectNumber: false,
    projectNumberError: null,
  })

  // ==============================================
  // COMPUTED PROPERTIES
  // ==============================================
  const isLoading = state.state === 'loading'
  const isSuccess = state.state === 'success'
  const isError = state.state === 'error'
  const isIdle = state.state === 'idle'
  const hasErrors = Object.keys(state.errors).length > 0
  const canSubmit = Boolean(
    state.formData.name.trim().length > 0 &&
    !isLoading &&
    state.formData.selectedLocation
  )
  const hasLocationSuggestions = state.locationSuggestions.length > 0

  // ==============================================
  // FORM DATA MANAGEMENT
  // ==============================================
  const updateFormData = useCallback((field: keyof CreateProjectFormData, value: any) => {
    console.log(field, value)
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
  // PROJECT NUMBER GENERATION
  // ==============================================
  const generateProjectNumber = useCallback(async () => {
    try {
      setState(prev => ({
        ...prev,
        isLoadingProjectNumber: true,
        projectNumberError: null,
      }))

      const response = await projectsApi.getNextProjectNumber()

      console.log('Project number API response:', response) // Debug log

      // FIXED: Check for response.projectNumber instead of response.nextNumber
      if (response.success && response.projectNumber) {
        setState(prev => ({
          ...prev,
          projectNumber: response.projectNumber!, // Use projectNumber field
          formData: { ...prev.formData, projectNumber: response.projectNumber! },
          isLoadingProjectNumber: false,
          projectNumberError: null,
        }))
      } else {
        setState(prev => ({
          ...prev,
          isLoadingProjectNumber: false,
          projectNumberError: response.message || 'Failed to generate project number',
        }))
      }
    } catch (error: any) {
      console.error('Error generating project number:', error)
      setState(prev => ({
        ...prev,
        isLoadingProjectNumber: false,
        projectNumberError: error.message || 'Failed to generate project number',
      }))
    }
  }, [])

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
            // FIXED: Ensure placeId is always a string
            placeId: String(suggestion.place_id),
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

  const selectLocationFromMap = useCallback(async (location: SelectedLocation) => {
    try {
      setState(prev => ({
        ...prev,
        isLoadingLocation: true,
        locationError: null,
      }))

      // For map selections, we already have all the data we need
      updateFormDataBulk({
        locationSearch: location.address,
        selectedLocation: {
          address: location.address,
          displayName: location.displayName,
          coordinates: location.coordinates,
          placeId: location.placeId,
        },
      })

      setState(prev => ({
        ...prev,
        locationSuggestions: [], // Clear suggestions when map is used
        isLoadingLocation: false,
        locationError: null,
      }))

    } catch (error: any) {
      console.error('Error selecting location from map:', error)
      setState(prev => ({
        ...prev,
        isLoadingLocation: false,
        locationError: 'Failed to select location from map',
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
            // FIXED: Ensure placeId is always a string
            placeId: String(suggestion.place_id),
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
              // FIXED: Ensure placeId is always a string
              placeId: String(suggestion.place_id),
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
  // FORM VALIDATION
  // ==============================================
  const validateForm = useCallback(() => {
    const validation = validateCreateProject(state.formData)

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
  // CREATE PROJECT
  // ==============================================
  const createProject = useCallback(async (data?: CreateProjectData) => {
    try {
      setState(prev => ({
        ...prev,
        state: 'loading',
        errors: {},
      }))

      // Use provided data or transform form data
      const projectData = data || transformFormDataToApiData(state.formData)

      // Validate data before sending
      const validation = validateCreateProject(projectData)
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

      const response = await projectsApi.createProject(projectData)

      if (response.success) {
        setState(prev => ({
          ...prev,
          state: 'success',
          result: response,
          errors: {},
        }))

        // Navigate to the new project
        router.push(`/dashboard/projects/${response.data.project.id}`)
      } else {
        setState(prev => ({
          ...prev,
          state: 'error',
          errors: { general: response.message || 'Failed to create project' },
        }))
      }
    } catch (error: any) {
      console.error('Error creating project:', error)

      setState(prev => ({
        ...prev,
        state: 'error',
        errors: { general: error.message || 'Failed to create project' },
      }))
    }
  }, [state.formData, router])

  // ==============================================
  // RESET
  // ==============================================
  const reset = useCallback(() => {
    setState({
      state: 'idle',
      result: null,
      errors: {},
      formData: getDefaultCreateProjectFormData(),
      locationSuggestions: [],
      isLoadingLocation: false,
      locationError: null,
      projectNumber: '',
      isLoadingProjectNumber: false,
      projectNumberError: null,
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
    locationSuggestions: state.locationSuggestions,
    isLoadingLocation: state.isLoadingLocation,
    locationError: state.locationError,
    projectNumber: state.projectNumber,
    isLoadingProjectNumber: state.isLoadingProjectNumber,
    projectNumberError: state.projectNumberError,

    // Computed properties
    isLoading,
    isSuccess,
    isError,
    isIdle,
    hasErrors,
    canSubmit,
    hasLocationSuggestions,

    // Actions
    updateFormData,
    updateFormDataBulk,
    clearErrors,
    clearFieldError,
    validateForm,
    createProject,
    reset,

    // Location actions
    searchLocations,
    selectLocation,
    clearLocationSuggestions,

    // FREE Location actions (Nominatim - for development)
    selectLocationFree,
    searchLocationsFree,

    // Project number actions
    generateProjectNumber,
  } satisfies UseCreateProjectReturn
}