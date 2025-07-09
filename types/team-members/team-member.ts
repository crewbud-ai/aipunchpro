// ==============================================
// src/types/team-members/team-member.ts - Core Team Member Types
// ==============================================

// ==============================================
// CORE TEAM MEMBER INTERFACES
// ==============================================
export interface TeamMember {
  id: string
  companyId: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: 'admin' | 'supervisor' | 'member'
  jobTitle?: string
  tradeSpecialty?: 'electrical' | 'plumbing' | 'framing' | 'drywall' | 'roofing' | 'concrete' | 'hvac' | 'general' | 'management' | 'safety'
  hourlyRate?: number
  overtimeRate?: number
  startDate?: string
  certifications?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  
  // Related data (populated from joins)
  creator?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  
  // Project assignment data
  currentProjects?: Array<{
    id: string
    name: string
    status: 'active' | 'inactive'
    joinedAt: string
    hourlyRate?: number
    overtimeRate?: number
    notes?: string
  }>
  
  // Calculated fields
  activeProjectCount?: number
  assignmentStatus?: 'not_assigned' | 'assigned' | 'inactive'
}

export interface TeamMemberSummary {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: TeamMember['role']
  jobTitle?: string
  tradeSpecialty?: TeamMember['tradeSpecialty']
  hourlyRate?: number
  startDate?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  
  // Summary data for list view
  activeProjectCount: number
  assignmentStatus: 'not_assigned' | 'assigned' | 'inactive'
  currentProject?: {
    id: string
    name: string
  }
}

// ==============================================
// QUERY INTERFACES
// ==============================================
export interface TeamMemberFilters {
  role?: TeamMember['role']
  status?: 'active' | 'inactive'
  assignmentStatus?: 'not_assigned' | 'assigned' | 'inactive'
  tradeSpecialty?: TeamMember['tradeSpecialty']
  projectId?: string
  search?: string
  sortBy?: 'firstName' | 'lastName' | 'role' | 'startDate' | 'createdAt' | 'hourlyRate'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

// ==============================================
// TEAM MEMBER STATES
// ==============================================
export type TeamMembersState = 
  | 'loading'        // Loading team members list
  | 'loaded'         // Team members loaded successfully
  | 'error'          // Error loading team members
  | 'empty'          // No team members found

export type TeamMemberState = 
  | 'loading'        // Loading single team member
  | 'loaded'         // Team member loaded
  | 'error'          // Error loading team member
  | 'not_found'      // Team member not found

// ==============================================
// API RESPONSE INTERFACES
// ==============================================
export interface GetTeamMembersResult {
  success: boolean
  message: string
  data: {
    teamMembers: TeamMemberSummary[]
    pagination: {
      total: number
      limit: number
      offset: number
      hasMore: boolean
    }
    filters?: {
      role?: TeamMember['role']
      status?: 'active' | 'inactive'
      assignmentStatus?: 'not_assigned' | 'assigned' | 'inactive'
      tradeSpecialty?: TeamMember['tradeSpecialty']
      projectId?: string
      search?: string
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
    }
  }
  notifications?: {
    message: string
  }
}

export interface GetTeamMemberResult {
  success: boolean
  message: string
  data: {
    teamMember: TeamMember
  }
  notifications?: {
    message: string
  }
}

export interface DeleteTeamMemberResult {
  success: boolean
  message: string
  data: {
    deactivatedTeamMemberId: string
  }
  notifications?: {
    message: string
  }
}

// ==============================================
// ERROR TYPES
// ==============================================
export interface TeamMemberFieldError {
  field: string
  message: string
}

export interface TeamMemberFormErrors {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  role?: string
  jobTitle?: string
  tradeSpecialty?: string
  hourlyRate?: string
  overtimeRate?: string
  startDate?: string
  certifications?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  isActive?: string
  projectId?: string
  projectHourlyRate?: string
  projectOvertimeRate?: string
  projectNotes?: string
  
  // General errors
  general?: string
}

// ==============================================
// FORM DATA INTERFACE (for filtering forms)
// ==============================================
export interface TeamMemberFiltersFormData {
  role?: TeamMember['role']
  status?: 'active' | 'inactive'
  assignmentStatus?: 'not_assigned' | 'assigned' | 'inactive'
  tradeSpecialty?: TeamMember['tradeSpecialty']
  projectId?: string
  search: string
  sortBy: TeamMemberFilters['sortBy']
  sortOrder: TeamMemberFilters['sortOrder']
}

// ==============================================
// HELPER FUNCTIONS FOR FORM DATA
// ==============================================
export function getDefaultTeamMemberFiltersFormData(): TeamMemberFiltersFormData {
  return {
    search: '',
    sortBy: 'firstName',
    sortOrder: 'asc',
  }
}

// ==============================================
// TEAM MEMBER STATS (for dashboard)
// ==============================================
export interface TeamMemberStats {
  totalMembers: number
  activeMembers: number
  inactiveMembers: number
  assignedMembers: number
  unassignedMembers: number
  membersByRole: Array<{
    role: string  // Changed from TeamMember['role'] to string for API flexibility
    count: number
  }>
  membersByTrade: Array<{
    trade: string  // Changed from TeamMember['tradeSpecialty'] to string for API flexibility
    count: number
  }>
  averageHourlyRate?: number
  recentlyAdded: number // members added in last 30 days
}