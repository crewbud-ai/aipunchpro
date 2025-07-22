// ==============================================
// src/types/projects/project.ts - Updated Core Project Types
// ==============================================

// ==============================================
// LOCATION AND CLIENT INTERFACES (JSONB)
// ==============================================
export interface ProjectLocation {
  address: string
  displayName?: string
  city?: string
  state?: string
  country?: string
  zipCode?: string
  coordinates?: {
    lat: number
    lng: number
  }
  placeId?: string
  timezone?: string
}

export interface ProjectClient {
  name?: string
  contactPerson?: string
  email?: string
  phone?: string
  secondaryEmail?: string
  secondaryPhone?: string
  website?: string
  businessAddress?: string
  billingAddress?: string
  taxId?: string
  notes?: string
  preferredContact?: 'email' | 'phone' | 'both'
}

// ==============================================
// CORE PROJECT INTERFACES
// ==============================================
export interface Project {
  id: string
  companyId: string
  name: string
  description?: string
  projectNumber?: string
  status: 'not_started' | 'in_progress' | 'on_track' | 'ahead_of_schedule' | 'behind_schedule' | 'on_hold' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  budget?: number
  spent?: number
  progress?: number
  startDate?: string
  endDate?: string
  actualStartDate?: string
  actualEndDate?: string
  estimatedHours?: number
  actualHours?: number
  
  // Enhanced JSONB fields
  location?: ProjectLocation
  client?: ProjectClient
  
  tags?: string[]
  projectManagerId?: string
  foremanId?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  
  // Related data (populated from joins)
  projectManager?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  foreman?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  creator?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

export interface ProjectSummary {
  id: string
  name: string
  description?: string
  projectNumber?: string
  status: Project['status']
  priority: Project['priority']
  progress?: number
  budget?: number
  spent?: number
  startDate?: string
  endDate?: string
  location?: ProjectLocation
  client?: ProjectClient
  tags?: string[]
  createdAt: string
  updatedAt: string
  
  // Basic team info for list view
  // projectManager?: {
  //   id: string
  //   firstName: string
  //   lastName: string
  // }

  // Keep creator reference since that still exists
  creator?: {
    id: string
    firstName: string
    lastName: string
  }
}

// ==============================================
// QUERY INTERFACES
// ==============================================
export interface ProjectFilters {
  status?: Project['status']
  priority?: Project['priority']
  search?: string
  location?: string  // Search by location
  client?: string    // Search by client
  // managerId?: string // Filter by project manager
  sortBy?: 'name' | 'created_at' | 'start_date' | 'progress' | 'priority' | 'status'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

// ==============================================
// PROJECT STATES
// ==============================================
export type ProjectsState = 
  | 'loading'        // Loading projects list
  | 'loaded'         // Projects loaded successfully
  | 'error'          // Error loading projects
  | 'empty'          // No projects found

export type ProjectState = 
  | 'loading'        // Loading single project
  | 'loaded'         // Project loaded
  | 'error'          // Error loading project
  | 'not_found'      // Project not found

// ==============================================
// API RESPONSE INTERFACES
// ==============================================
export interface GetProjectsResult {
  success: boolean
  message: string
  data: {
    projects: ProjectSummary[]
    pagination: {
      total: number
      page: number
      limit: number
      totalPages: number
    }
    filters: {
      status?: Project['status']
      priority?: Project['priority']
      search?: string
      location?: string
      client?: string
      // managerId?: string
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
    }
  }
  notifications?: {
    message: string
  }
}

export interface GetProjectResult {
  success: boolean
  message: string
  data: {
    project: Project
  }
  notifications?: {
    message: string
  }
}

export interface DeleteProjectResult {
  success: boolean
  message: string
  data: {
    deletedProjectId: string
  }
  notifications?: {
    message: string
  }
}

export interface MemberProjectSummary extends ProjectSummary {
  // Member-specific fields (populated when memberView=true)
  memberRole?: 'supervisor' | 'lead' | 'member'
  joinedAt?: string
  isActive?: boolean
  assignmentNotes?: string
}

export interface MemberProjectStats {
  total: number
  active: number
  completed: number
  supervisorRoles: number
  leadRoles: number
  averageProgress: number
}


// ==============================================
// ERROR TYPES
// ==============================================
export interface ProjectFieldError {
  field: string
  message: string
}

export interface ProjectFormErrors {
  name?: string
  description?: string
  projectNumber?: string
  status?: string
  priority?: string
  budget?: string
  startDate?: string
  endDate?: string
  actualStartDate?: string
  actualEndDate?: string
  estimatedHours?: string
  actualHours?: string
  spent?: string
  progress?: string
  projectManagerId?: string
  foremanId?: string
  
  // Location errors
  location?: string
  'location.address'?: string
  'location.coordinates'?: string
  locationSearch?: string
  selectedLocation?: string
  
  // Client errors
  client?: string
  'client.name'?: string
  'client.email'?: string
  'client.phone'?: string
  clientName?: string     // Form field aliases
  clientEmail?: string
  clientPhone?: string
  clientContactPerson?: string
  clientWebsite?: string
  clientNotes?: string
  
  tags?: string
  general?: string
}

// ==============================================
// UTILITY TYPES
// ==============================================
export interface ProjectStats {
  total: number
  byStatus: {
    not_started: number
    in_progress: number
    on_track: number
    ahead_of_schedule: number
    behind_schedule: number
    on_hold: number
    completed: number
    cancelled: number
  }
  byPriority: {
    low: number
    medium: number
    high: number
    urgent: number
  }
  totalBudget: number
  totalSpent: number
  averageProgress: number
  activeProjects: number
  upcomingDeadlines: number
}

// ==============================================
// LOCATION SUGGESTION TYPES (for Places API)
// ==============================================
export interface LocationSuggestion {
  place_id: string
  description: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
  types: string[]
}

export interface LocationDetails {
  place_id: string
  name: string
  formatted_address: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  address_components: Array<{
    long_name: string
    short_name: string
    types: string[]
  }>
}

// ==============================================
// LOCATION SUGGESTION TYPES FOR FREE VERSION (for Places API)
// ==============================================
export interface LocationSuggestionFree {
  place_id: string
  description: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
  types: string[]
  
  // Add optional coordinates for free version (Nominatim) support
  coordinates?: {
    lat: number
    lng: number
  }
  
  // Add optional address components for additional data
  address_components?: any
}

export interface LocationDetailsFree {
  place_id: string
  name: string
  formatted_address: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  address_components: Array<{
    long_name: string
    short_name: string
    types: string[]
  }>
}

// ==============================================
// PLACES API RESPONSE TYPES
// ==============================================
export interface PlacesAutocompleteResponse {
  success: boolean
  suggestions: LocationSuggestion[]
  message: string
}

export interface PlacesDetailsResponse {
  success: boolean
  place: LocationDetails
  message: string
}