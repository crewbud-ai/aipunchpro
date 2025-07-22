// ==============================================
// src/types/projects/index.ts - Project Types Exports
// ==============================================

// Re-export all project types
export * from './project'
export * from './create-project'
export * from './update-project'

// ==============================================
// CONVENIENCE EXPORTS FOR COMMON TYPES
// ==============================================

// Core Project Types
export type {
  Project,
  ProjectSummary,
  ProjectFilters,
  ProjectFormErrors,
  ProjectFieldError,
  ProjectStats,
  ProjectsState,
  ProjectState,
  GetProjectsResult,
  GetProjectResult,
  DeleteProjectResult,
  MemberProjectSummary,
  MemberProjectStats,
} from './project'

// Create Project Types
export type {
  CreateProjectData,
  CreateProjectResult,
  CreateProjectState,
  CreateProjectFormData,
} from './create-project'

// Update Project Types
export type {
  UpdateProjectData,
  UpdateProjectResult,
  UpdateProjectState,
  UpdateProjectFormData,
  ProjectFiltersFormData,
} from './update-project'

// ==============================================
// VALIDATION EXPORTS
// ==============================================

// Create Project Validation
export {
  createProjectSchema,
  validateCreateProject,
} from './create-project'

// Update Project Validation
export {
  updateProjectSchema,
  projectFiltersSchema,
  validateUpdateProject,
  validateProjectFilters,
} from './update-project'
