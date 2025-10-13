// ==============================================
// app/(dashboard)/dashboard/projects/components/forms/LocationStep.tsx - Mobile Responsive
// ==============================================

"use client"

import { LocationPicker } from "@/components/forms/LocationPicker"
import { LocationMap } from "@/components/forms/LocationMap"
import type { CreateProjectFormData, ProjectFormErrors } from "@/types/projects"
import type { SelectedLocation } from "@/components/forms/LocationPicker"

interface LocationStepProps {
  mode?: 'create' | 'edit'
  formData: Pick<CreateProjectFormData, 'locationSearch' | 'selectedLocation'>
  errors: ProjectFormErrors
  locationSuggestions: any[]
  isLoadingLocation: boolean
  locationError: string | null
  hasLocationSuggestions: boolean
  onLocationInputChange: (value: string) => void
  onLocationSelect: (suggestion: any) => void
  onLocationClear: () => void
}

export function LocationStep({
  mode = 'create',
  formData,
  errors,
  locationSuggestions,
  isLoadingLocation,
  locationError,
  hasLocationSuggestions,
  onLocationInputChange,
  onLocationSelect,
  onLocationClear,
}: LocationStepProps) {
  
  // ==============================================
  // MAP EVENT HANDLERS
  // ==============================================
  
  const handleMapLocationSelect = (location: SelectedLocation) => {
    // Transform the map selection to match the existing suggestion format
    const mapSuggestion = {
      place_id: location.placeId || `map_${Date.now()}`,
      description: location.address,
      structured_formatting: {
        main_text: location.displayName,
        secondary_text: location.address.split(',').slice(1).join(',').trim(),
      },
      types: ['geocode'],
      // Add the coordinate data for direct processing
      coordinates: location.coordinates,
      isMapSelection: true,
    }
    
    onLocationSelect(mapSuggestion)
  }

  // ==============================================
  // RENDER - Mobile Responsive
  // ==============================================
  return (
    <div className="space-y-4 xs:space-y-5 sm:space-y-6">
      {/* Location Input Field */}
      <LocationPicker
        label="Project Location"
        placeholder="Start typing an address..."
        value={formData.selectedLocation}
        inputValue={formData.locationSearch}
        error={errors.selectedLocation || errors.location || locationError || undefined}
        required={true}
        suggestions={locationSuggestions}
        isLoading={isLoadingLocation}
        showSuggestions={hasLocationSuggestions}
        onInputChange={onLocationInputChange}
        onLocationSelect={onLocationSelect}
        onClear={onLocationClear}
        hideSelectedLocationDetails={mode === 'create'}
      />
      
      {/* Divider with "OR" - Mobile Responsive */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs xs:text-sm">
          <span className="px-3 xs:px-4 bg-white text-gray-500 font-medium">
            OR select on map
          </span>
        </div>
      </div>
      
      {/* Interactive Map - Mobile Responsive */}
      <div>
        <LocationMap
          value={formData.selectedLocation}
          onLocationSelect={handleMapLocationSelect}
          height={300} // Reduced from 350 for mobile
          error={errors.selectedLocation || errors.location || locationError || undefined}
          className="w-full"
        />
        
        {/* Map Instructions - Mobile Responsive */}
        <div className="mt-2 xs:mt-3 p-2.5 xs:p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2 xs:gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="h-4 w-4 xs:h-5 xs:w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs xs:text-sm font-medium text-blue-900 leading-tight">
                How to use the map:
              </h4>
              <ul className="mt-1 xs:mt-1.5 text-xs xs:text-sm text-blue-800 space-y-0.5 xs:space-y-1">
                <li className="flex items-start gap-1.5">
                  <span className="text-blue-600 mt-0.5 shrink-0">•</span>
                  <span className="leading-snug">Click anywhere on the map to select that exact location</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-blue-600 mt-0.5 shrink-0">•</span>
                  <span className="leading-snug">
                    Use the <span className="font-medium">crosshair button</span> to use your current location
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-blue-600 mt-0.5 shrink-0">•</span>
                  <span className="leading-snug">
                    Use the <span className="font-medium">pin button</span> to center on your selected location
                  </span>
                </li>
                <li className="flex items-start gap-1.5 hidden xs:flex">
                  <span className="text-blue-600 mt-0.5 shrink-0">•</span>
                  <span className="leading-snug">Zoom and pan to find the precise spot you need</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}