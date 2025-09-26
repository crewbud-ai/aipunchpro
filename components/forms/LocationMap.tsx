// ==============================================
// components/forms/LocationMap.tsx - Professional Version Using Hooks
// ==============================================

'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin, Crosshair, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { SelectedLocation } from '@/hooks/places'
import { useReverseGeocoding, useCurrentLocation } from '@/hooks/places'

// ==============================================
// TYPES
// ==============================================
interface LocationMapProps {
  value?: SelectedLocation | null
  onLocationSelect: (location: SelectedLocation) => void
  className?: string
  height?: number
  disabled?: boolean
  error?: string
}

// Leaflet types (we'll load dynamically)
declare global {
  interface Window {
    L: any
  }
}

// ==============================================
// CONSTANTS
// ==============================================
const DEFAULT_CENTER = { lat: 39.8283, lng: -98.5795 } // Center of USA
const DEFAULT_ZOOM = 4
const SELECTED_ZOOM = 15

// ==============================================
// MAIN COMPONENT
// ==============================================
export const LocationMap = ({
  value,
  onLocationSelect,
  className,
  height = 300,
  disabled = false,
  error,
}: LocationMapProps) => {
  // ==============================================
  // HOOKS
  // ==============================================
  const {
    reverseGeocode,
    isLoading: isReverseGeocoding,
    error: reverseGeocodingError,
  } = useReverseGeocoding()

  const {
    getCurrentLocation,
    isLoading: isGettingCurrentLocation,
    error: currentLocationError,
    isSupported: isGeolocationSupported,
  } = useCurrentLocation()

  // ==============================================
  // STATE & REFS
  // ==============================================
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [isMapLoading, setIsMapLoading] = useState(true)
  const [leafletLoaded, setLeafletLoaded] = useState(false)

  // Combined loading state
  const isProcessingLocation = isReverseGeocoding || isGettingCurrentLocation

  // ==============================================
  // LEAFLET DYNAMIC LOADING
  // ==============================================
  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window === 'undefined' || window.L) {
        setLeafletLoaded(true)
        return
      }

      try {
        // Load Leaflet CSS
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)

        // Load Leaflet JS
        const script = document.createElement('script')
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
        script.onload = () => setLeafletLoaded(true)
        script.onerror = () => {
          console.error('Failed to load Leaflet')
          setIsMapLoading(false)
        }
        document.head.appendChild(script)
      } catch (error) {
        console.error('Failed to load Leaflet:', error)
        setIsMapLoading(false)
      }
    }

    loadLeaflet()
  }, [])

  // ==============================================
  // MAP INITIALIZATION
  // ==============================================
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || mapInstanceRef.current) {
      return
    }

    try {
      const L = window.L
      
      // Initialize map
      const map = L.map(mapRef.current, {
        center: value?.coordinates ? [value.coordinates.lat, value.coordinates.lng] : [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng],
        zoom: value?.coordinates ? SELECTED_ZOOM : DEFAULT_ZOOM,
        zoomControl: false,
      })

      // Add tile layer (OpenStreetMap)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      // Add zoom control to bottom right
      L.control.zoom({
        position: 'bottomright'
      }).addTo(map)

      // Handle map clicks
      map.on('click', handleMapClick)

      mapInstanceRef.current = map
      setIsMapLoading(false)

      // Add marker if location exists
      if (value?.coordinates) {
        addMarker(value.coordinates.lat, value.coordinates.lng, value.displayName)
      }

    } catch (error) {
      console.error('Failed to initialize map:', error)
      setIsMapLoading(false)
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [leafletLoaded, value])

  // ==============================================
  // MARKER MANAGEMENT
  // ==============================================
  const addMarker = (lat: number, lng: number, displayName?: string) => {
    if (!mapInstanceRef.current || !window.L) return

    const L = window.L

    // Remove existing marker
    if (markerRef.current) {
      mapInstanceRef.current.removeLayer(markerRef.current)
    }

    // Create custom marker
    const marker = L.marker([lat, lng], {
      icon: L.divIcon({
        html: `<div class="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                 <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                   <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
                 </svg>
               </div>`,
        className: 'custom-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
    })

    // Add popup if display name exists
    if (displayName) {
      marker.bindPopup(displayName, {
        offset: [0, -12],
        className: 'custom-popup'
      })
    }

    marker.addTo(mapInstanceRef.current)
    markerRef.current = marker
  }

  // ==============================================
  // EVENT HANDLERS
  // ==============================================
  const handleMapClick = async (e: any) => {
    if (disabled || isProcessingLocation) return

    const { lat, lng } = e.latlng
    
    // Add temporary marker immediately for better UX
    addMarker(lat, lng, 'Getting address...')

    try {
      // Use the reverse geocoding hook
      const location = await reverseGeocode(lat, lng)
      
      // Update marker with the actual location info
      addMarker(lat, lng, location.displayName)
      
      // Notify parent component
      onLocationSelect(location)

    } catch (error) {
      console.error('Map click geocoding failed:', error)
      
      // The hook already handles fallbacks, but just in case
      const fallbackLocation: SelectedLocation = {
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        displayName: 'Selected Location',
        coordinates: { lat, lng },
        placeId: `manual_${Date.now()}`,
      }
      
      addMarker(lat, lng, fallbackLocation.displayName)
      onLocationSelect(fallbackLocation)
    }
  }

  const handleCenterOnLocation = () => {
    if (value?.coordinates && mapInstanceRef.current) {
      mapInstanceRef.current.setView([value.coordinates.lat, value.coordinates.lng], SELECTED_ZOOM)
    }
  }

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], DEFAULT_ZOOM)
    }
  }

  const handleCurrentLocation = async () => {
    if (!isGeolocationSupported || isProcessingLocation) return

    try {
      const location = await getCurrentLocation()
      
      if (location && mapInstanceRef.current) {
        // Center map on current location
        mapInstanceRef.current.setView([location.coordinates!.lat, location.coordinates!.lng], SELECTED_ZOOM)
        
        // Add marker
        addMarker(location.coordinates!.lat, location.coordinates!.lng, location.displayName)
        
        // Notify parent component
        onLocationSelect(location)
      }
    } catch (error) {
      console.error('Failed to get current location:', error)
      // Error is already handled by the hook
    }
  }

  // ==============================================
  // ERROR HANDLING
  // ==============================================
  const getLocationError = () => {
    if (reverseGeocodingError) return reverseGeocodingError
    if (currentLocationError) return currentLocationError
    return null
  }

  const locationError = getLocationError()

  // ==============================================
  // RENDER
  // ==============================================
  return (
    <div className={cn('relative', className)}>
      {/* Map Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <MapPin className="h-4 w-4" />
          Click on map to select location
          {isProcessingLocation && (
            <span className="text-blue-600 text-xs">
              {isReverseGeocoding && '(Getting address...)'}
              {isGettingCurrentLocation && '(Getting current location...)'}
            </span>
          )}
        </div>
        
        {/* Map Controls */}
        <div className="flex items-center gap-1">
          {value?.coordinates && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCenterOnLocation}
              className="h-7 px-2 text-xs"
              title="Center on selected location"
              disabled={isProcessingLocation}
            >
              <MapPin className="h-3 w-3" />
            </Button>
          )}
          
          {isGeolocationSupported && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCurrentLocation}
              className="h-7 px-2 text-xs"
              title="Use current location"
              disabled={isProcessingLocation}
            >
              {isGettingCurrentLocation ? (
                <div className="w-3 h-3 border border-gray-400 border-t-gray-600 rounded-full animate-spin" />
              ) : (
                <Crosshair className="h-3 w-3" />
              )}
            </Button>
          )}
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetView}
            className="h-7 px-2 text-xs"
            title="Reset view"
            disabled={isProcessingLocation}
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Map Container */}
      <div 
        className={cn(
          'relative border rounded-lg overflow-hidden bg-gray-100',
          error && 'border-red-300',
          disabled && 'opacity-50 cursor-not-allowed',
          isProcessingLocation && 'cursor-wait'
        )}
        style={{ height }}
      >
        <div 
          ref={mapRef} 
          className="w-full h-full"
          style={{ 
            filter: disabled ? 'grayscale(1)' : 'none',
            pointerEvents: disabled || isProcessingLocation ? 'none' : 'auto'
          }}
        />
        
        {/* Loading Overlay */}
        {isMapLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-2 text-gray-500">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              <p className="text-sm">Loading map...</p>
            </div>
          </div>
        )}

        {/* Processing Overlay */}
        {isProcessingLocation && !isMapLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-10 flex items-center justify-center">
            <div className="bg-white px-3 py-2 rounded-lg shadow-md flex items-center gap-2 text-sm">
              <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
              {isReverseGeocoding && 'Getting address...'}
              {isGettingCurrentLocation && 'Getting current location...'}
            </div>
          </div>
        )}
      </div>

      {/* Selected Location Info */}
      {value && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
          <div className="flex items-center gap-2">
            <MapPin className="h-3 w-3 text-green-600" />
            <span className="font-medium text-green-900">{value.displayName}</span>
          </div>
          {value.coordinates && (
            <div className="text-green-700 ml-5">
              {value.coordinates.lat.toFixed(6)}, {value.coordinates.lng.toFixed(6)}
            </div>
          )}
        </div>
      )}

      {/* Error Messages */}
      {error && (
        <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
          <span className="font-medium">Form Error:</span> {error}
        </p>
      )}

      {locationError && (
        <p className="text-sm text-orange-600 mt-2 flex items-center gap-1">
          <span className="font-medium">Location Error:</span> {locationError}
        </p>
      )}

      {/* Geolocation Not Supported Warning */}
      {!isGeolocationSupported && (
        <p className="text-xs text-gray-500 mt-2">
          Current location feature is not supported by your browser.
        </p>
      )}

      {/* Custom CSS for markers */}
      <style jsx>{`
        :global(.custom-marker) {
          background: transparent !important;
          border: none !important;
        }
        
        :global(.custom-popup .leaflet-popup-content) {
          font-size: 12px;
          line-height: 1.4;
          margin: 8px;
        }
        
        :global(.custom-popup .leaflet-popup-content-wrapper) {
          border-radius: 6px;
        }
      `}</style>
    </div>
  )
}