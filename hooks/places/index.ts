// ==============================================
// src/hooks/places/index.ts - Places Hooks Exports
// ==============================================

// Re-export all places hooks
export * from './use-places'

// ==============================================
// CONVENIENCE EXPORTS FOR COMMON HOOKS
// ==============================================

// Main hooks
export { usePlacesAutocomplete, usePlaceDetails } from './use-places'

// ==============================================
// TYPE EXPORTS
// ==============================================
export type {
  PlaceSuggestion,
  PlaceDetails,
  SelectedLocation,
} from './use-places'