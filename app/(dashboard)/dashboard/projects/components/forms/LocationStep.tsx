// projects/components/forms/LocationStep.tsx
"use client"

import { LocationPicker } from "@/components/forms/LocationPicker"
import type { CreateProjectFormData, ProjectFormErrors } from "@/types/projects"

interface LocationStepProps {
  mode?: 'create' | 'edit'  // NEW: Support both modes
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
  mode = 'create', // Default to create mode
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
  return (
    <div className="space-y-6">
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
        hideSelectedLocationDetails={mode === 'create'} // Hide details only in create mode
      />
    </div>
  )
}