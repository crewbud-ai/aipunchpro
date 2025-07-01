// ==============================================
// src/hooks/projects/index.ts - Project Hooks Exports
// ==============================================

// Re-export all project hooks
export * from './use-projects'
export * from './use-project'
export * from './use-create-project'
export * from './use-update-project'

// ==============================================
// CONVENIENCE EXPORTS FOR COMMON HOOKS
// ==============================================

// Main hooks
export { useProjects } from './use-projects'
export { useProject } from './use-project'
export { useCreateProject } from './use-create-project'
export { useUpdateProject } from './use-update-project'

// Utility hooks
export { useProjectStats, useProjectNameCheck } from './use-projects'