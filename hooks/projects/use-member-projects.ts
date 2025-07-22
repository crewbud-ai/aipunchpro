// ==============================================
// hooks/projects/use-member-projects.ts - CORRECTED VERSION (Replace your existing file)
// ==============================================

import { useState, useCallback, useEffect, useMemo } from 'react'
import { projectsApi } from '@/lib/api/projects'
import { 
  type ProjectFilters,
  type ProjectsState,
  type MemberProjectSummary,  // USING THIS TYPE
  type MemberProjectStats,
} from '@/types/projects'

// ==============================================
// HOOK INTERFACES (following your existing patterns)
// ==============================================
interface UseMemberProjectsState {
  projects: MemberProjectSummary[]  // CHANGED: Use MemberProjectSummary instead of ProjectSummary
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  filters: Omit<ProjectFilters, 'location' | 'client'> // Simplified for members
  state: ProjectsState
  error: string | null
}

interface UseMemberProjectsActions {
  loadProjects: (newFilters?: Partial<ProjectFilters>) => Promise<void>
  refreshProjects: () => Promise<void>
  updateFilters: (newFilters: Partial<ProjectFilters>) => void
  clearFilters: () => void
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  clearError: () => void
}

interface UseMemberProjectsReturn extends UseMemberProjectsState, UseMemberProjectsActions {
  // Computed properties (following your patterns)
  isLoading: boolean
  hasError: boolean
  isEmpty: boolean
  hasProjects: boolean
  projectStats: MemberProjectStats
}

// ==============================================
// MAIN HOOK (CORRECTED VERSION)
// ==============================================
export function useMemberProjects(): UseMemberProjectsReturn {
  // ==============================================
  // STATE (following your existing state patterns)
  // ==============================================
  const [projects, setProjects] = useState<MemberProjectSummary[]>([]) // CHANGED: Use MemberProjectSummary
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  })
  const [filters, setFilters] = useState<Omit<ProjectFilters, 'location' | 'client'>>({
    search: undefined,
    status: undefined,
    priority: undefined,
    sortBy: 'created_at',
    sortOrder: 'desc',
  })
  const [state, setState] = useState<ProjectsState>('loading')
  const [error, setError] = useState<string | null>(null)

  // ==============================================
  // COMPUTED PROPERTIES (following your patterns)
  // ==============================================
  const isLoading = state === 'loading'
  const hasError = state === 'error'
  const isEmpty = state === 'empty'
  const hasProjects = projects.length > 0

  // Project statistics (member-specific) - NOW WORKS WITH CORRECT TYPES
  const projectStats = useMemo<MemberProjectStats>(() => {
    const stats = {
      total: projects.length,
      active: projects.filter(p => p.status === 'in_progress').length,
      completed: projects.filter(p => p.status === 'completed').length,
      supervisorRoles: projects.filter(p => p.memberRole === 'supervisor').length, // NOW WORKS!
      leadRoles: projects.filter(p => p.memberRole === 'lead').length, // NOW WORKS!
      averageProgress: projects.length > 0 
        ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)
        : 0
    }
    return stats
  }, [projects])

  // ==============================================
  // ACTIONS (following your existing action patterns)
  // ==============================================
  const loadProjects = useCallback(async (newFilters?: Partial<ProjectFilters>) => {
    try {
      setState('loading')
      setError(null)

      const searchFilters = newFilters ? { ...filters, ...newFilters } : filters

      const response = await projectsApi.getMemberProjects({
        ...searchFilters,
        limit: pagination.limit,
        offset: (pagination.page - 1) * pagination.limit,
      })

      if (response.success) {
        // The API returns projects with member-specific fields when memberView=true
        // Cast to ensure TypeScript knows about the member fields
        const memberProjects = response.data.projects.map(project => ({
          ...project,
          // Ensure member fields are present (they come from the API transform)
          memberRole: (project as any).memberRole,
          joinedAt: (project as any).joinedAt,
          isActive: (project as any).isActive,
        })) as MemberProjectSummary[]

        setProjects(memberProjects)
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.totalPages,
        }))

        setState(memberProjects.length === 0 ? 'empty' : 'loaded')
      } else {
        throw new Error(response.message || 'Failed to load projects')
      }
    } catch (err) {
      console.error('Error loading member projects:', err)
      setError(err instanceof Error ? err.message : 'Failed to load projects')
      setState('error')
      setProjects([])
    }
  }, [filters, pagination.limit, pagination.page])

  const refreshProjects = useCallback(() => {
    return loadProjects()
  }, [loadProjects])

  const updateFilters = useCallback((newFilters: Partial<ProjectFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({
      search: undefined,
      status: undefined,
      priority: undefined,
      sortBy: 'created_at',
      sortOrder: 'desc',
    })
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [])

  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }, [])

  const setLimit = useCallback((limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }))
  }, [])

  const clearError = useCallback(() => {
    setError(null)
    setState('loading')
  }, [])

  // ==============================================
  // EFFECTS (following your existing effect patterns)
  // ==============================================
  useEffect(() => {
    loadProjects()
  }, [filters, pagination.page, pagination.limit])

  return {
    // Data
    projects,    // NOW TYPED AS MemberProjectSummary[]
    pagination,
    filters,
    state,
    error,
    projectStats,
    
    // Computed
    isLoading,
    hasError,
    isEmpty,
    hasProjects,
    
    // Actions
    loadProjects,
    refreshProjects,
    updateFilters,
    clearFilters,
    setPage,
    setLimit,
    clearError,
  }
}