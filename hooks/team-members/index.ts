// ==============================================
// src/hooks/team-members/index.ts - Team Members Hooks Exports
// ==============================================

// Re-export all team member hooks
export * from './use-team-members'
export * from './use-team-member'
export * from './use-create-team-member'
export * from './use-update-team-member'
export * from './use-delete-team-member'
export * from './use-assign-team-members'
export * from './use-remove-team-member'

// ==============================================
// CONVENIENCE EXPORTS FOR COMMON HOOKS
// ==============================================

// Main hooks
export { useTeamMembers } from './use-team-members'
export { useTeamMember } from './use-team-member'
export { useCreateTeamMember } from './use-create-team-member'
export { useUpdateTeamMember } from './use-update-team-member'
export { useDeleteTeamMember, useBulkDeleteTeamMembers } from './use-delete-team-member'
export { useAssignTeamMembers } from './use-assign-team-members'
export { useRemoveTeamMember } from './use-remove-team-member'

// Utility hooks
export { 
  useTeamMemberStats, 
  useTeamMemberEmailCheck 
} from './use-team-members'