// ==============================================
// src/components/forms/LocationPicker.tsx - Professional Location Picker Component (Updated)
// ==============================================

'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  MapPin,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  Navigation,
  Check
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ==============================================
// TYPES
// ==============================================
export interface SelectedLocation {
  address: string
  displayName: string
  coordinates?: { lat: number; lng: number }
  placeId?: string
}

export interface LocationSuggestion {
  place_id: string
  description: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
  types: string[]
}

interface LocationPickerProps {
  label?: string
  placeholder?: string
  value?: SelectedLocation | null
  inputValue?: string
  error?: string
  required?: boolean
  disabled?: boolean
  className?: string
  hideSelectedLocationDetails?: boolean // NEW: Option to hide detailed location display

  // Suggestions from hook
  suggestions: LocationSuggestion[]
  isLoading: boolean
  showSuggestions: boolean

  // Event handlers
  onInputChange: (value: string) => void
  onLocationSelect: (suggestion: LocationSuggestion) => void
  onClear: () => void
}

// ==============================================
// MAIN COMPONENT
// ==============================================
export const LocationPicker = ({
  label = 'Project Location',
  placeholder = 'Start typing an address...',
  value,
  inputValue = '',
  error,
  required = false,
  disabled = false,
  className,
  hideSelectedLocationDetails = false, // NEW: Default to false for backward compatibility

  // From hook
  suggestions,
  isLoading,
  showSuggestions,

  // Handlers
  onInputChange,
  onLocationSelect,
  onClear,
}: LocationPickerProps) => {
  // ==============================================
  // STATE & REFS
  // ==============================================
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // ==============================================
  // EFFECTS
  // ==============================================

  // Handle click outside to hide suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ==============================================
  // EVENT HANDLERS
  // ==============================================
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onInputChange(newValue)
  }

  const handleInputFocus = () => {
    setIsFocused(true)
  }

  const handleInputBlur = () => {
    // Delay hiding to allow for suggestion clicks
    setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setIsFocused(false)
      }
    }, 150)
  }

  const handleSuggestionSelect = (suggestion: LocationSuggestion) => {
    onLocationSelect(suggestion)
    setIsFocused(false)
  }

  const handleClear = () => {
    onClear()
    inputRef.current?.focus()
  }

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        // For now, just set coordinates. In a real implementation,
        // you might want to reverse geocode to get the address
        const currentLocation: SelectedLocation = {
          address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          displayName: 'Current Location',
          coordinates: { lat: latitude, lng: longitude },
        }
        // You would need to add this to the hook interface
        // onLocationSelect(currentLocation)
      },
      (error) => {
        console.error('Error getting current location:', error)
      }
    )
  }

  // ==============================================
  // RENDER
  // ==============================================
  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Label - Mobile Responsive */}
      <Label htmlFor="location-search" className="flex items-center gap-1.5 xs:gap-2 text-sm xs:text-base font-medium">
        <MapPin className="h-3.5 w-3.5 xs:h-4 xs:w-4 shrink-0" />
        <span>{label}</span>
        {required && <span className="text-red-500">*</span>}
      </Label>

      {/* Input Container - Mobile Responsive */}
      <div className="relative mt-1.5 xs:mt-2">
        <div className="relative">
          <Search className="absolute left-2.5 xs:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 xs:h-4 xs:w-4 text-gray-400" />

          <Input
            ref={inputRef}
            id="location-search"
            type="text"
            placeholder={placeholder}
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            disabled={disabled}
            className={cn(
              'pl-9 xs:pl-10 pr-16 xs:pr-20 text-sm xs:text-base h-10 xs:h-11',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
              value && 'border-green-500 focus:border-green-500 focus:ring-green-500'
            )}
          />

          {/* Action Buttons - Mobile Responsive */}
          <div className="absolute right-1.5 xs:right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-0.5 xs:gap-1">
            {isLoading && (
              <Loader2 className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-gray-400 animate-spin" />
            )}

            {inputValue && !isLoading && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-6 w-6 xs:h-7 xs:w-7 p-0 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3 w-3 xs:h-3.5 xs:w-3.5" />
              </Button>
            )}

            {!value && !isLoading && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCurrentLocation}
                className="h-6 w-6 xs:h-7 xs:w-7 p-0 text-gray-400 hover:text-gray-600"
                title="Use current location"
              >
                <Navigation className="h-3 w-3 xs:h-3.5 xs:w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Suggestions Dropdown - Mobile Responsive */}
        {isFocused && showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 xs:max-h-64 overflow-y-auto">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.place_id}
                type="button"
                onClick={() => handleSuggestionSelect(suggestion)}
                className="w-full text-left px-3 xs:px-4 py-2.5 xs:py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="flex items-start gap-2 xs:gap-3">
                  <MapPin className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm xs:text-base text-gray-900 truncate leading-snug">
                      {suggestion.structured_formatting.main_text}
                    </div>
                    <div className="text-xs xs:text-sm text-gray-500 truncate mt-0.5 leading-snug">
                      {suggestion.structured_formatting.secondary_text}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* No Results Message - Mobile Responsive */}
        {isFocused && !isLoading && suggestions.length === 0 && inputValue.length >= 3 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 xs:p-4 text-center text-gray-500">
            <MapPin className="h-6 w-6 xs:h-8 xs:w-8 mx-auto mb-1.5 xs:mb-2 text-gray-300" />
            <p className="text-sm xs:text-base">No locations found</p>
            <p className="text-xs xs:text-sm mt-0.5">Try a different search term</p>
          </div>
        )}
      </div>

      {/* Selected Location Display (Full Details) - Mobile Responsive */}
      {value && !hideSelectedLocationDetails && (
        <div className="mt-2 xs:mt-3 p-2.5 xs:p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-2 xs:gap-3">
            <CheckCircle className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-green-600 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="font-medium text-sm xs:text-base text-green-900 leading-snug">
                {value.displayName}
              </div>
              <div className="text-xs xs:text-sm text-green-700 mt-1 leading-snug">
                {value.address}
              </div>
              {value.coordinates && (
                <div className="text-xs text-green-600 mt-1 leading-tight font-mono">
                  {value.coordinates.lat.toFixed(6)}, {value.coordinates.lng.toFixed(6)}
                </div>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-green-600 hover:text-green-800 hover:bg-green-100 h-auto p-1 shrink-0"
            >
              <X className="h-3 w-3 xs:h-3.5 xs:w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Selected Location Display (Simple Confirmation) - Mobile Responsive */}
      {value && hideSelectedLocationDetails && (
        <div className="mt-2 xs:mt-3 flex items-center gap-1.5 xs:gap-2 text-xs xs:text-sm text-green-600">
          <Check className="h-3 w-3 xs:h-3.5 xs:w-3.5 shrink-0" />
          <span className="flex-1 min-w-0 truncate">Location selected: {value.displayName}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="ml-auto text-green-600 hover:text-green-800 h-auto p-1 shrink-0"
          >
            <X className="h-3 w-3 xs:h-3.5 xs:w-3.5" />
          </Button>
        </div>
      )}

      {/* Error Message - Mobile Responsive */}
      {error && (
        <p className="text-xs xs:text-sm text-red-600 mt-1.5 xs:mt-2 flex items-center gap-1">
          <AlertCircle className="h-3 w-3 xs:h-3.5 xs:w-3.5 shrink-0" />
          <span className="leading-tight">{error}</span>
        </p>
      )}

      {/* Hint Text - Mobile Responsive */}
      {!value && !error && (
        <p className="text-xs xs:text-sm text-gray-500 mt-1.5 xs:mt-2 leading-snug">
          Start typing to search for addresses, or click <Navigation className="h-3 w-3 inline align-middle" /> to use your current location
        </p>
      )}
    </div>
  )
}