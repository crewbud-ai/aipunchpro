// ==============================================
// hooks/places/use-reverse-geocoding.ts - Reverse Geocoding Hook
// ==============================================

import { useState, useCallback } from 'react'
import type { SelectedLocation } from './use-places'

// ==============================================
// TYPE DEFINITIONS
// ==============================================
export interface ReverseGeocodingResult {
  place_id: string
  address: string
  displayName: string
  coordinates: { lat: number; lng: number }
  details: {
    country?: string
    state?: string
    city?: string
    postcode?: string
    road?: string
    house_number?: string
  }
}

interface ReverseGeocodingResponse {
  success: boolean
  location?: ReverseGeocodingResult
  message: string
  warning?: string
}

// ==============================================
// REVERSE GEOCODING HOOK
// ==============================================
interface UseReverseGeocodingState {
  result: ReverseGeocodingResult | null
  isLoading: boolean
  isError: boolean
  error: string | null
}

interface UseReverseGeocodingActions {
  reverseGeocode: (lat: number, lng: number) => Promise<SelectedLocation>
  clearResult: () => void
  reset: () => void
}

interface UseReverseGeocodingReturn extends UseReverseGeocodingState, UseReverseGeocodingActions {
  hasResult: boolean
}

export const useReverseGeocoding = () => {
  // ==============================================
  // STATE
  // ==============================================
  const [state, setState] = useState<UseReverseGeocodingState>({
    result: null,
    isLoading: false,
    isError: false,
    error: null,
  })

  // ==============================================
  // COMPUTED PROPERTIES
  // ==============================================
  const hasResult = state.result !== null

  // ==============================================
  // ACTIONS
  // ==============================================
  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<SelectedLocation> => {
    // Validate coordinates
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setState(prev => ({
        ...prev,
        isError: true,
        error: 'Invalid coordinates provided',
      }))
      
      // Return fallback location
      return {
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        displayName: 'Invalid Location',
        coordinates: { lat, lng },
        placeId: `invalid_${Date.now()}`,
      }
    }

    try {
      setState(prev => ({
        ...prev,
        isLoading: true,
        isError: false,
        error: null,
      }))

      const response = await fetch('/api/places/reverse-geocode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lat, lng }),
      })

      const data: ReverseGeocodingResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: Failed to reverse geocode`)
      }

      if (data.success && data.location) {
        const result = data.location
        
        setState(prev => ({
          ...prev,
          result,
          isLoading: false,
        }))

        // Return in SelectedLocation format
        const selectedLocation: SelectedLocation = {
          address: result.address,
          displayName: result.displayName,
          coordinates: result.coordinates,
          placeId: result.place_id,
        }

        return selectedLocation

      } else {
        // API returned success: false or no location
        throw new Error(data.message || 'No location found for coordinates')
      }

    } catch (error: any) {
      console.error('Reverse geocoding error:', error)
      
      setState(prev => ({
        ...prev,
        result: null,
        isLoading: false,
        isError: true,
        error: error.message || 'Failed to reverse geocode location',
      }))

      // Return fallback location even on error
      const fallbackLocation: SelectedLocation = {
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        displayName: 'Selected Location',
        coordinates: { lat, lng },
        placeId: `fallback_${Date.now()}`,
      }

      return fallbackLocation
    }
  }, [])

  const clearResult = useCallback(() => {
    setState(prev => ({
      ...prev,
      result: null,
      isError: false,
      error: null,
    }))
  }, [])

  const reset = useCallback(() => {
    setState({
      result: null,
      isLoading: false,
      isError: false,
      error: null,
    })
  }, [])

  return {
    // State
    result: state.result,
    isLoading: state.isLoading,
    isError: state.isError,
    error: state.error,

    // Computed
    hasResult,

    // Actions
    reverseGeocode,
    clearResult,
    reset,
  } satisfies UseReverseGeocodingReturn
}

// ==============================================
// CURRENT LOCATION HOOK
// ==============================================
interface UseCurrentLocationState {
  location: SelectedLocation | null
  isLoading: boolean
  isError: boolean
  error: string | null
  isSupported: boolean
}

interface UseCurrentLocationActions {
  getCurrentLocation: () => Promise<SelectedLocation | null>
  clearLocation: () => void
  reset: () => void
}

interface UseCurrentLocationReturn extends UseCurrentLocationState, UseCurrentLocationActions {
  hasLocation: boolean
}

export const useCurrentLocation = () => {
  // ==============================================
  // STATE
  // ==============================================
  const [state, setState] = useState<UseCurrentLocationState>({
    location: null,
    isLoading: false,
    isError: false,
    error: null,
    isSupported: typeof navigator !== 'undefined' && 'geolocation' in navigator,
  })

  // Hook for reverse geocoding
  const { reverseGeocode } = useReverseGeocoding()

  // ==============================================
  // COMPUTED PROPERTIES
  // ==============================================
  const hasLocation = state.location !== null

  // ==============================================
  // ACTIONS
  // ==============================================
  const getCurrentLocation = useCallback(async (): Promise<SelectedLocation | null> => {
    if (!state.isSupported) {
      setState(prev => ({
        ...prev,
        isError: true,
        error: 'Geolocation is not supported by this browser',
      }))
      return null
    }

    return new Promise((resolve) => {
      setState(prev => ({
        ...prev,
        isLoading: true,
        isError: false,
        error: null,
      }))

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords

          try {
            // Use reverse geocoding hook to get address
            const location = await reverseGeocode(latitude, longitude)
            
            // Update display name to indicate it's current location
            const currentLocation: SelectedLocation = {
              ...location,
              displayName: location.displayName === 'Selected Location' 
                ? 'Current Location' 
                : `${location.displayName} (Current)`,
              placeId: `current_${location.placeId}`,
            }

            setState(prev => ({
              ...prev,
              location: currentLocation,
              isLoading: false,
            }))

            resolve(currentLocation)

          } catch (error) {
            // Fallback if reverse geocoding fails
            const fallbackLocation: SelectedLocation = {
              address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
              displayName: 'Current Location',
              coordinates: { lat: latitude, lng: longitude },
              placeId: `current_${Date.now()}`,
            }

            setState(prev => ({
              ...prev,
              location: fallbackLocation,
              isLoading: false,
            }))

            resolve(fallbackLocation)
          }
        },
        (error) => {
          console.error('Geolocation error:', error)
          
          let errorMessage = 'Failed to get current location'
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user'
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable'
              break
            case error.TIMEOUT:
              errorMessage = 'Location request timed out'
              break
          }

          setState(prev => ({
            ...prev,
            location: null,
            isLoading: false,
            isError: true,
            error: errorMessage,
          }))

          resolve(null)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000, // 10 seconds
          maximumAge: 300000, // 5 minutes
        }
      )
    })
  }, [state.isSupported, reverseGeocode])

  const clearLocation = useCallback(() => {
    setState(prev => ({
      ...prev,
      location: null,
      isError: false,
      error: null,
    }))
  }, [])

  const reset = useCallback(() => {
    setState(prev => ({
      ...prev,
      location: null,
      isLoading: false,
      isError: false,
      error: null,
    }))
  }, [])

  return {
    // State
    location: state.location,
    isLoading: state.isLoading,
    isError: state.isError,
    error: state.error,
    isSupported: state.isSupported,

    // Computed
    hasLocation,

    // Actions
    getCurrentLocation,
    clearLocation,
    reset,
  } satisfies UseCurrentLocationReturn
}