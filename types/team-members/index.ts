// ==============================================
// src/types/team-members/index.ts - Team Members Types Exports
// ==============================================

import { TEAM_MEMBER_ROLES, TRADE_SPECIALTIES } from './create-team-member'
import { TeamMember, TeamMemberSummary } from './team-member'

// Re-export all team member types
export * from './team-member'
export * from './create-team-member'
export * from './update-team-member'

// ==============================================
// CONVENIENCE EXPORTS FOR COMMON TYPES
// ==============================================

// Core Team Member Types
export type {
  TeamMember,
  TeamMemberSummary,
  TeamMemberFilters,
  TeamMemberFormErrors,
  TeamMemberFieldError,
  TeamMemberStats,
  TeamMembersState,
  TeamMemberState,
  GetTeamMembersResult,
  GetTeamMemberResult,
  DeleteTeamMemberResult,
  TeamMemberFiltersFormData,
} from './team-member'

// Create Team Member Types
export type {
  CreateTeamMemberData,
  CreateTeamMemberResult,
  CreateTeamMemberState,
  CreateTeamMemberFormData,
  CreateTeamMemberFormStep,
} from './create-team-member'

// Update Team Member Types
export type {
  UpdateTeamMemberData,
  UpdateTeamMemberResult,
  UpdateTeamMemberState,
  UpdateTeamMemberFormData,
  UpdateTeamMemberFormStep,
  QuickUpdateTeamMemberData,
  QuickUpdateTeamMemberResult,
  UpdateTeamMemberStatusData,
  UpdateTeamMemberStatusResult,
  TeamMemberFieldConfig,
} from './update-team-member'

// ==============================================
// VALIDATION EXPORTS
// ==============================================

// Create Team Member Validation
export {
  createTeamMemberSchema,
  validateCreateTeamMember,
  getDefaultCreateTeamMemberFormData,
  CREATE_TEAM_MEMBER_FORM_STEPS,
  TEAM_MEMBER_ROLES,
  TRADE_SPECIALTIES,
} from './create-team-member'

// Update Team Member Validation
export {
  updateTeamMemberSchema,
  updateTeamMemberStatusSchema,
  validateUpdateTeamMember,
  validateUpdateTeamMemberStatus,
  getDefaultUpdateTeamMemberFormData,
  convertTeamMemberToFormData,
  UPDATE_TEAM_MEMBER_FORM_STEPS,
  TEAM_MEMBER_FIELD_CONFIGS,
} from './update-team-member'

// Helper Functions
export {
  getDefaultTeamMemberFiltersFormData,
} from './team-member'

// ==============================================
// CONSTANTS AND ENUMS
// ==============================================

// Team Member Status Constants
export const TEAM_MEMBER_STATUSES = [
  { value: 'active', label: 'Active', color: 'green' },
  { value: 'inactive', label: 'Inactive', color: 'gray' },
] as const

// Assignment Status Constants
export const ASSIGNMENT_STATUSES = [
  { value: 'not_assigned', label: 'Not Assigned', color: 'yellow' },
  { value: 'assigned', label: 'Assigned', color: 'blue' },
  { value: 'inactive', label: 'Inactive', color: 'gray' },
] as const

// Sort Options for Team Members
export const TEAM_MEMBER_SORT_OPTIONS = [
  { value: 'firstName', label: 'First Name' },
  { value: 'lastName', label: 'Last Name' },
  { value: 'role', label: 'Role' },
  { value: 'startDate', label: 'Start Date' },
  { value: 'createdAt', label: 'Date Added' },
  { value: 'hourlyRate', label: 'Hourly Rate' },
] as const

// Filter Options for Trade Specialties (for UI dropdowns)
export const TRADE_SPECIALTY_FILTER_OPTIONS = [
  { value: '', label: 'All Trades' },
  ...TRADE_SPECIALTIES,
] as const

// Filter Options for Roles (for UI dropdowns)
export const ROLE_FILTER_OPTIONS = [
  { value: '', label: 'All Roles' },
  ...TEAM_MEMBER_ROLES,
] as const

// ==============================================
// TYPE GUARDS
// ==============================================

export function isTeamMember(obj: any): obj is TeamMember {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.firstName === 'string' &&
    typeof obj.lastName === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.role === 'string' &&
    typeof obj.isActive === 'boolean'
  )
}

export function isTeamMemberSummary(obj: any): obj is TeamMemberSummary {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.firstName === 'string' &&
    typeof obj.lastName === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.role === 'string' &&
    typeof obj.isActive === 'boolean' &&
    typeof obj.activeProjectCount === 'number' &&
    typeof obj.assignmentStatus === 'string'
  )
}

// ==============================================
// UTILITY TYPES
// ==============================================

// Extract just the filter-able fields for advanced filtering
export type TeamMemberFilterableFields = Pick<
  TeamMember,
  'role' | 'tradeSpecialty' | 'isActive'
>

// Extract just the searchable text fields
export type TeamMemberSearchableFields = Pick<
  TeamMember,
  'firstName' | 'lastName' | 'email' | 'jobTitle'
>

// Extract just the sortable fields
export type TeamMemberSortableFields = Pick<
  TeamMember,
  'firstName' | 'lastName' | 'role' | 'startDate' | 'createdAt' | 'hourlyRate'
>

// Team member fields that can be quick-edited
export type QuickEditableFields = 
  | 'firstName' 
  | 'lastName' 
  | 'email' 
  | 'phone' 
  | 'role' 
  | 'jobTitle' 
  | 'tradeSpecialty' 
  | 'hourlyRate' 
  | 'overtimeRate' 
  | 'isActive'

// ==============================================
// DEFAULT VALUES AND CONFIGURATIONS
// ==============================================

// Default pagination settings
export const TEAM_MEMBER_DEFAULT_PAGINATION = {
  limit: 20,
  offset: 0,
} as const

// Default sort settings
export const TEAM_MEMBER_DEFAULT_SORT = {
  sortBy: 'firstName' as const,
  sortOrder: 'asc' as const,
} as const

// Form validation patterns
export const VALIDATION_PATTERNS = {
  phone: /^[\+]?[1-9][\d]{0,15}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  name: /^[a-zA-Z\s'-]{1,50}$/,
} as const

// Currency formatting options
export const CURRENCY_FORMAT_OPTIONS = {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
} as const