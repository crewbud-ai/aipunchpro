// ==============================================
// components/maps/LocationDisplayMap.tsx - Read-only Location Display Map
// ==============================================

'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin, Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ==============================================
// TYPES
// ==============================================
interface LocationDisplayMapProps {
  location: {
    address: string
    displayName: string
    coordinates: { lat: number; lng: number }
    placeId?: string
  }
  className?: string
  height?: number
  showControls?: boolean
  showAddress?: boolean
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
const DEFAULT_ZOOM = 15
const EXPANDED_HEIGHT = 400
const COLLAPSED_HEIGHT = 200

// ==============================================
// MAIN COMPONENT
// ==============================================
export const LocationDisplayMap = ({
  location,
  className,
  height = COLLAPSED_HEIGHT,
  showControls = true,
  showAddress = true,
}: LocationDisplayMapProps) => {
  // ==============================================
  // STATE & REFS
  // ==============================================
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [isMapLoading, setIsMapLoading] = useState(true)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  const currentHeight = isExpanded ? EXPANDED_HEIGHT : height

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
          setMapError('Failed to load map library')
          setIsMapLoading(false)
        }
        document.head.appendChild(script)
      } catch (error) {
        console.error('Failed to load Leaflet:', error)
        setMapError('Failed to initialize map')
        setIsMapLoading(false)
      }
    }

    loadLeaflet()
  }, [])

  // ==============================================
  // MAP INITIALIZATION
  // ==============================================
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || mapInstanceRef.current || !location.coordinates) {
      return
    }

    try {
      const L = window.L

      // Initialize map
      const map = L.map(mapRef.current, {
        center: [location.coordinates.lat, location.coordinates.lng],
        zoom: DEFAULT_ZOOM,
        zoomControl: showControls,
        scrollWheelZoom: false, // Disable scroll zoom for read-only behavior
        doubleClickZoom: true,
        dragging: true,
        touchZoom: true,
      })

      // Add tile layer (OpenStreetMap)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      // Position zoom control if enabled
      if (showControls) {
        L.control.zoom({
          position: 'topright'
        }).addTo(map)
      }

      // Add marker for the location
      addLocationMarker(map, location.coordinates.lat, location.coordinates.lng, location.displayName)

      mapInstanceRef.current = map
      setIsMapLoading(false)

    } catch (error) {
      console.error('Failed to initialize map:', error)
      setMapError('Failed to initialize map')
      setIsMapLoading(false)
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markerRef.current = null
      }
    }
  }, [leafletLoaded, location.coordinates, showControls])

  // ==============================================
  // HANDLE MAP RESIZE
  // ==============================================
  useEffect(() => {
    if (mapInstanceRef.current) {
      // Delay to allow height transition to complete
      setTimeout(() => {
        mapInstanceRef.current.invalidateSize()
      }, 300)
    }
  }, [isExpanded, currentHeight])

  // ==============================================
  // MARKER MANAGEMENT
  // ==============================================
  const addLocationMarker = (map: any, lat: number, lng: number, displayName: string) => {
    if (!window.L) return

    const L = window.L

    // Remove existing marker
    if (markerRef.current) {
      map.removeLayer(markerRef.current)
    }

    // Create custom marker with location pin
    const marker = L.marker([lat, lng], {
      icon: L.divIcon({
        html: `<div class="w-8 h-8 bg-orange-600 rounded-full border-3 border-white shadow-lg flex items-center justify-center">
                 <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                   <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
                 </svg>
               </div>`,
        className: 'location-display-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      }),
    })

    // Add popup with location info
    marker.bindPopup(`
      <div class="text-center">
        <div class="font-medium text-gray-900 mb-1">${displayName}</div>
        <div class="text-xs text-gray-600">${lat.toFixed(6)}, ${lng.toFixed(6)}</div>
      </div>
    `, {
      offset: [0, -16],
      className: 'location-display-popup'
    })

    marker.addTo(map)
    markerRef.current = marker
  }

  // ==============================================
  // EVENT HANDLERS
  // ==============================================
  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  const handleCenterLocation = () => {
    if (mapInstanceRef.current && location.coordinates) {
      mapInstanceRef.current.setView([location.coordinates.lat, location.coordinates.lng], DEFAULT_ZOOM)
    }
  }

  // ==============================================
  // RENDER ERROR STATE
  // ==============================================
  if (mapError) {
    return (
      <div className={cn('relative border rounded-lg bg-gray-50', className)} style={{ height }}>
        <div className="flex items-center justify-center h-full px-4">
          <div className="text-center text-gray-500">
            <MapPin className="h-6 w-6 xs:h-7 xs:w-7 sm:h-8 sm:w-8 mx-auto mb-1.5 xs:mb-2 flex-shrink-0" />
            <p className="text-xs xs:text-sm">Unable to load map</p>
            {showAddress && (
              <p className="text-xs mt-1 text-gray-400 break-words max-w-xs mx-auto">{location.address}</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ==============================================
  // RENDER
  // ==============================================
  return (
    // Main Component - Responsive
    <div className={cn('relative', className)}>
      {/* Map Header */}
      {showControls && (
        <div className="flex items-center justify-between mb-1.5 xs:mb-2 gap-2">
          <div className="flex items-center gap-1.5 xs:gap-2 text-xs xs:text-sm font-medium text-gray-700 min-w-0">
            <MapPin className="h-3.5 w-3.5 xs:h-4 xs:w-4 flex-shrink-0" />
            <span className="truncate">Project Location</span>
          </div>

          {/* Map Controls */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCenterLocation}
              className="h-6 xs:h-7 px-1.5 xs:px-2 text-xs"
              title="Center on location"
              disabled={isMapLoading}
            >
              <MapPin className="h-3 w-3 xs:h-3.5 xs:w-3.5" />
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleToggleExpand}
              className="h-6 xs:h-7 px-1.5 xs:px-2 text-xs"
              title={isExpanded ? "Collapse map" : "Expand map"}
              disabled={isMapLoading}
            >
              {isExpanded ? (
                <Minimize2 className="h-3 w-3 xs:h-3.5 xs:w-3.5" />
              ) : (
                <Maximize2 className="h-3 w-3 xs:h-3.5 xs:w-3.5" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div
        className={cn(
          'relative border rounded-lg overflow-hidden bg-gray-100 transition-all duration-300',
          isMapLoading && 'bg-gray-50'
        )}
        style={{ height: currentHeight }}
      >
        <div
          ref={mapRef}
          className="w-full h-full"
        />

        {/* Loading Overlay */}
        {isMapLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-1.5 xs:gap-2 text-gray-500">
              <div className="w-5 h-5 xs:w-6 xs:h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              <p className="text-xs xs:text-sm">Loading map...</p>
            </div>
          </div>
        )}

        {/* Read-only indicator */}
        <div className="absolute top-1.5 xs:top-2 left-1.5 xs:left-2 bg-white bg-opacity-90 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded text-xs text-gray-600 shadow-sm whitespace-nowrap">
          📍 Project Location
        </div>
      </div>

      {/* Location Info */}
      {showAddress && (
        <div className="mt-2 xs:mt-2.5 sm:mt-3 p-2.5 xs:p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start gap-2 xs:gap-2.5 sm:gap-3">
            <MapPin className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-orange-900 text-xs xs:text-sm truncate">{location.displayName}</h4>
              <p className="text-orange-800 text-xs mt-0.5 xs:mt-1 break-words leading-snug">{location.address}</p>
              <div className="text-orange-700 text-xs mt-1.5 xs:mt-2 break-all leading-snug">
                📍 {location.coordinates.lat.toFixed(6)}, {location.coordinates.lng.toFixed(6)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom CSS for markers */}
      <style jsx>{`
        :global(.location-display-marker) {
          background: transparent !important;
          border: none !important;
        }
        
        :global(.location-display-popup .leaflet-popup-content) {
          font-size: 11px;
          line-height: 1.4;
          margin: 6px;
        }

        @media (min-width: 480px) {
          :global(.location-display-popup .leaflet-popup-content) {
            font-size: 12px;
            margin: 8px;
          }
        }
        
        :global(.location-display-popup .leaflet-popup-content-wrapper) {
          border-radius: 6px;
          border: 2px solid #ea580c;
        }

        :global(.location-display-popup .leaflet-popup-tip) {
          border-top-color: #ea580c;
        }
      `}</style>
    </div>
  )
}