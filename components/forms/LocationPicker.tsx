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
      {/* Label */}
      <Label htmlFor="location-search" className="flex items-center gap-2 text-base font-medium">
        <MapPin className="h-4 w-4" />
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>

      {/* Input Container */}
      <div className="relative mt-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          
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
              'pl-10 pr-20 text-base',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
              value && 'border-green-500 focus:border-green-500 focus:ring-green-500'
            )}
          />

          {/* Action Buttons */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {isLoading && (
              <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
            )}
            
            {inputValue && !isLoading && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            
            {!value && !isLoading && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCurrentLocation}
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                title="Use current location"
              >
                <Navigation className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Suggestions Dropdown */}
        {isFocused && showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.place_id}
                type="button"
                onClick={() => handleSuggestionSelect(suggestion)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900 truncate">
                      {suggestion.structured_formatting.main_text}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {suggestion.structured_formatting.secondary_text}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* No Results Message */}
        {isFocused && !isLoading && suggestions.length === 0 && inputValue.length >= 3 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
            <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>No locations found</p>
            <p className="text-sm">Try a different search term</p>
          </div>
        )}
      </div>

      {/* UPDATED: Conditional location display based on hideSelectedLocationDetails */}
      {value && !hideSelectedLocationDetails && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="font-medium text-green-900">
                {value.displayName}
              </div>
              <div className="text-sm text-green-700 mt-1">
                {value.address}
              </div>
              {value.coordinates && (
                <div className="text-xs text-green-600 mt-1">
                  {value.coordinates.lat.toFixed(6)}, {value.coordinates.lng.toFixed(6)}
                </div>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-green-600 hover:text-green-800 hover:bg-green-100 h-auto p-1"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* NEW: Simple confirmation for selected location when details are hidden */}
      {value && hideSelectedLocationDetails && (
        <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
          <Check className="h-3 w-3" />
          <span>Location selected: {value.displayName}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="ml-auto text-green-600 hover:text-green-800 h-auto p-1"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}

      {/* UPDATED: Hide hint text when details are hidden and location is selected */}
      {!value && !error && (
        <p className="text-sm text-gray-500 mt-2">
          Start typing to search for addresses, or click <Navigation className="h-3 w-3 inline" /> to use your current location
        </p>
      )}
    </div>
  )
}