// ==============================================
// src/hooks/projects/index.ts - Project Hooks Exports
// ==============================================

// Re-export all project hooks
export * from './use-projects'
export * from './use-project'
export * from './use-create-project'
export * from './use-update-project'
export * from './use-delete-project'
export * from './use-project-files'

// ==============================================
// CONVENIENCE EXPORTS FOR COMMON HOOKS
// ==============================================

// Main hooks
export { useProjects } from './use-projects'
export { useProject } from './use-project'
export { useCreateProject } from './use-create-project'
export { useUpdateProject } from './use-update-project'
export { useDeleteProject } from './use-delete-project'
export { useProjectFiles } from './use-project-files'

// Utility hooks
export { useProjectStats, useProjectNameCheck } from './use-projects'