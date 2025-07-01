// ==============================================
// src/hooks/projects/index.ts - Project Hooks Exports
// ==============================================

// Re-export all project hooks
export * from './use-projects'
export * from './use-project'
export * from './use-create-project'
export * from './use-update-project'

// Re-export places hooks for project location functionality
export * from '../places'

// ==============================================
// CONVENIENCE EXPORTS FOR COMMON HOOKS
// ==============================================

// Main project hooks
export { useProjects } from './use-projects'
export { useProject } from './use-project'
export { useCreateProject } from './use-create-project'
export { useUpdateProject } from './use-update-project'

// Utility hooks
export { useProjectStats, useProjectNameCheck } from './use-projects'

// Places hooks for location functionality
export { usePlacesAutocomplete, usePlaceDetails } from '../places'

// ==============================================
// TYPE EXPORTS
// ==============================================

// Import and re-export project types from validation
export type {
  CreateProjectFormData,
  CreateProjectData,
  ProjectLocation,
  ProjectClient,
  SelectedLocation,
  CreateProjectInput,
  UpdateProjectInput,
  GetProjectsInput,
} from '@/lib/validations/projects/project'

// Places types
export type {
  PlaceSuggestion,
  PlaceDetails,
} from '../places'