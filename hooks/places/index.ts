// ==============================================
// src/hooks/places/index.ts - Places Hooks Exports
// ==============================================

// Re-export all places hooks
export * from './use-places'
export * from './use-reverse-geocoding'

// ==============================================
// CONVENIENCE EXPORTS FOR COMMON HOOKS
// ==============================================

// Main hooks
export { usePlacesAutocomplete, usePlaceDetails } from './use-places'
export { useReverseGeocoding, useCurrentLocation } from './use-reverse-geocoding'

// ==============================================
// TYPE EXPORTS
// ==============================================
export type {
  PlaceSuggestion,
  PlaceDetails,
  SelectedLocation,
} from './use-places'

export type {
  ReverseGeocodingResult,
} from './use-reverse-geocoding'