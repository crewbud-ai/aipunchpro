// ==============================================
// src/hooks/places/use-places.ts - Places API Hooks
// ==============================================

import { useState, useCallback, useRef, useEffect } from 'react'

// ==============================================
// TYPE DEFINITIONS
// ==============================================
export interface PlaceSuggestion {
  place_id: string
  description: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
  types: string[]
}

export interface PlaceDetails {
  place_id: string
  name: string
  formatted_address: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  address_components: Array<{
    long_name: string
    short_name: string
    types: string[]
  }>
}

export interface SelectedLocation {
  address: string
  displayName: string
  coordinates?: { lat: number; lng: number }
  placeId?: string
}

// ==============================================
// PLACES AUTOCOMPLETE HOOK
// ==============================================
interface UsePlacesAutocompleteState {
  suggestions: PlaceSuggestion[]
  isLoading: boolean
  isError: boolean
  error: string | null
  inputValue: string
  showSuggestions: boolean
}

interface UsePlacesAutocompleteActions {
  searchPlaces: (input: string) => Promise<void>
  setInputValue: (value: string) => void
  clearSuggestions: () => void
  hideSuggestions: () => void
  showSuggestionsDropdown: () => void
  selectSuggestion: (suggestion: PlaceSuggestion) => Promise<SelectedLocation | null>
  reset: () => void
}

interface UsePlacesAutocompleteReturn extends UsePlacesAutocompleteState, UsePlacesAutocompleteActions {
  hasResults: boolean
  isEmpty: boolean
}

export const usePlacesAutocomplete = (options?: {
  types?: string
  components?: string
  debounceMs?: number
  minLength?: number
}) => {
  const {
    types = 'geocode',
    components = 'country:us',
    debounceMs = 300,
    minLength = 3
  } = options || {}

  // ==============================================
  // STATE
  // ==============================================
  const [state, setState] = useState<UsePlacesAutocompleteState>({
    suggestions: [],
    isLoading: false,
    isError: false,
    error: null,
    inputValue: '',
    showSuggestions: false,
  })

  // Debounce ref
  const debounceRef = useRef<NodeJS.Timeout>()

  // ==============================================
  // COMPUTED PROPERTIES
  // ==============================================
  const hasResults = state.suggestions.length > 0
  const isEmpty = state.suggestions.length === 0 && !state.isLoading

  // ==============================================
  // ACTIONS
  // ==============================================
  const searchPlaces = useCallback(async (input: string) => {
    if (!input || input.length < minLength) {
      setState(prev => ({
        ...prev,
        suggestions: [],
        isLoading: false,
        isError: false,
        error: null,
        showSuggestions: false,
      }))
      return
    }

    try {
      setState(prev => ({
        ...prev,
        isLoading: true,
        isError: false,
        error: null,
      }))

      const params = new URLSearchParams({
        input,
        types,
        components,
      })

      const response = await fetch(`/api/places/autocomplete?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch location suggestions')
      }

      if (data.success) {
        setState(prev => ({
          ...prev,
          suggestions: data.suggestions || [],
          isLoading: false,
          showSuggestions: true,
        }))
      } else {
        throw new Error(data.message || 'Failed to fetch suggestions')
      }
    } catch (error: any) {
      console.error('Places autocomplete error:', error)
      setState(prev => ({
        ...prev,
        suggestions: [],
        isLoading: false,
        isError: true,
        error: error.message || 'Failed to fetch location suggestions',
        showSuggestions: false,
      }))
    }
  }, [minLength, types, components])

  const debouncedSearch = useCallback((input: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      searchPlaces(input)
    }, debounceMs)
  }, [searchPlaces, debounceMs])

  const setInputValue = useCallback((value: string) => {
    setState(prev => ({
      ...prev,
      inputValue: value,
    }))

    // Trigger debounced search
    debouncedSearch(value)
  }, [debouncedSearch])

  const clearSuggestions = useCallback(() => {
    setState(prev => ({
      ...prev,
      suggestions: [],
      showSuggestions: false,
    }))
  }, [])

  const hideSuggestions = useCallback(() => {
    setState(prev => ({
      ...prev,
      showSuggestions: false,
    }))
  }, [])

  const showSuggestionsDropdown = useCallback(() => {
    setState(prev => ({
      ...prev,
      showSuggestions: prev.suggestions.length > 0,
    }))
  }, [])

  const selectSuggestion = useCallback(async (suggestion: PlaceSuggestion): Promise<SelectedLocation | null> => {
    try {
      setState(prev => ({
        ...prev,
        isLoading: true,
        isError: false,
        error: null,
      }))

      // Get place details using place_id
      const response = await fetch('/api/places/details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          place_id: suggestion.place_id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get place details')
      }

      if (data.success && data.place) {
        const place = data.place as PlaceDetails
        
        const selectedLocation: SelectedLocation = {
          address: place.formatted_address,
          displayName: place.name || suggestion.structured_formatting.main_text,
          coordinates: {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
          },
          placeId: place.place_id,
        }

        setState(prev => ({
          ...prev,
          inputValue: place.formatted_address,
          suggestions: [],
          isLoading: false,
          showSuggestions: false,
        }))

        return selectedLocation
      } else {
        throw new Error('Invalid place details response')
      }
    } catch (error: any) {
      console.error('Place details error:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        isError: true,
        error: error.message || 'Failed to get location details',
      }))
      return null
    }
  }, [])

  const reset = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    setState({
      suggestions: [],
      isLoading: false,
      isError: false,
      error: null,
      inputValue: '',
      showSuggestions: false,
    })
  }, [])

  // ==============================================
  // CLEANUP
  // ==============================================
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  return {
    // State
    suggestions: state.suggestions,
    isLoading: state.isLoading,
    isError: state.isError,
    error: state.error,
    inputValue: state.inputValue,
    showSuggestions: state.showSuggestions,

    // Computed
    hasResults,
    isEmpty,

    // Actions
    searchPlaces,
    setInputValue,
    clearSuggestions,
    hideSuggestions,
    showSuggestionsDropdown,
    selectSuggestion,
    reset,
  } satisfies UsePlacesAutocompleteReturn
}

// ==============================================
// PLACE DETAILS HOOK
// ==============================================
interface UsePlaceDetailsState {
  place: PlaceDetails | null
  isLoading: boolean
  isError: boolean
  error: string | null
}

interface UsePlaceDetailsActions {
  getPlaceDetails: (placeId: string) => Promise<PlaceDetails | null>
  clearPlace: () => void
  reset: () => void
}

interface UsePlaceDetailsReturn extends UsePlaceDetailsState, UsePlaceDetailsActions {
  hasPlace: boolean
}

export const usePlaceDetails = () => {
  // ==============================================
  // STATE
  // ==============================================
  const [state, setState] = useState<UsePlaceDetailsState>({
    place: null,
    isLoading: false,
    isError: false,
    error: null,
  })

  // ==============================================
  // COMPUTED PROPERTIES
  // ==============================================
  const hasPlace = state.place !== null

  // ==============================================
  // ACTIONS
  // ==============================================
  const getPlaceDetails = useCallback(async (placeId: string): Promise<PlaceDetails | null> => {
    if (!placeId) {
      setState(prev => ({
        ...prev,
        isError: true,
        error: 'Place ID is required',
      }))
      return null
    }

    try {
      setState(prev => ({
        ...prev,
        isLoading: true,
        isError: false,
        error: null,
      }))

      const response = await fetch('/api/places/details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          place_id: placeId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get place details')
      }

      if (data.success && data.place) {
        const place = data.place as PlaceDetails
        
        setState(prev => ({
          ...prev,
          place,
          isLoading: false,
        }))

        return place
      } else {
        throw new Error('Invalid place details response')
      }
    } catch (error: any) {
      console.error('Place details error:', error)
      setState(prev => ({
        ...prev,
        place: null,
        isLoading: false,
        isError: true,
        error: error.message || 'Failed to get place details',
      }))
      return null
    }
  }, [])

  const clearPlace = useCallback(() => {
    setState(prev => ({
      ...prev,
      place: null,
      isError: false,
      error: null,
    }))
  }, [])

  const reset = useCallback(() => {
    setState({
      place: null,
      isLoading: false,
      isError: false,
      error: null,
    })
  }, [])

  return {
    // State
    place: state.place,
    isLoading: state.isLoading,
    isError: state.isError,
    error: state.error,

    // Computed
    hasPlace,

    // Actions
    getPlaceDetails,
    clearPlace,
    reset,
  } satisfies UsePlaceDetailsReturn
}