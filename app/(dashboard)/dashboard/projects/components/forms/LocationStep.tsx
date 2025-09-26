// ==============================================
// app/(dashboard)/dashboard/projects/components/forms/LocationStep.tsx
// Updated to include map alongside location field
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
    console.log(location, 'location');
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

    console.log(mapSuggestion, 'mapSuggestion')
    
    onLocationSelect(mapSuggestion)
  }

  // ==============================================
  // RENDER
  // ==============================================
  return (
    <div className="space-y-6">
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
      
      {/* Divider with "OR" */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-gray-50 text-gray-500 font-medium">
            OR select on map
          </span>
        </div>
      </div>
      
      {/* Interactive Map */}
      <div>
        <LocationMap
          value={formData.selectedLocation}
          onLocationSelect={handleMapLocationSelect}
          height={350}
          error={errors.selectedLocation || errors.location || locationError || undefined}
          className="w-full"
        />
        
        {/* Map Instructions */}
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-900">How to use the map:</h4>
              <ul className="mt-1 text-sm text-blue-800 list-disc list-inside space-y-1">
                <li>Click anywhere on the map to select that exact location</li>
                <li>Use the <span className="font-medium">crosshair button</span> to use your current location</li>
                <li>Use the <span className="font-medium">pin button</span> to center on your selected location</li>
                <li>Zoom and pan to find the precise spot you need</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}