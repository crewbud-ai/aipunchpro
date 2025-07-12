// ==============================================
// app/(dashboard)/dashboard/punchlist/page.tsx - Main Punchlist Page
// ==============================================

"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Plus, 
  Search, 
  Calendar, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Camera,
  MapPin,
  Filter,
  Grid3X3,
  List,
  Eye,
  Edit,
  Play,
  XCircle,
  Pause,
  Building2,
  Users,
  RefreshCw,
  AlertCircle,
  Loader2
} from "lucide-react"
import Link from "next/link"

// Import our real hooks and types following established patterns
import { usePunchlistItems } from "@/hooks/punchlist-items"
import { useProjects } from "@/hooks/projects"
import { useTeamMembers } from "@/hooks/team-members"
import { 
  PUNCHLIST_STATUS_OPTIONS, 
  PUNCHLIST_PRIORITY_OPTIONS,
  ISSUE_TYPE_OPTIONS,
  TRADE_CATEGORY_OPTIONS,
  getPunchlistStatusColor,
  getPunchlistPriorityColor,
  getIssueTypeLabel,
  getTradeCategoryLabel
} from "@/types/punchlist-items"
import { withPermission } from "@/lib/permissions"

export default function PunchlistPage() {
  // ==============================================
  // STATE FOR UI CONTROLS
  // ==============================================
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // ==============================================
  // HOOKS FOR REAL DATA (Following team/schedule patterns)
  // ==============================================
  
  // Main punchlist items hook
  const {
    punchlistItems,
    isLoading,
    hasError,
    error,
    isEmpty,
    pagination,
    filters,
    filtersForm,
    // Actions
    loadPunchlistItems,
    refreshPunchlistItems,
    updateFilters,
    updateFiltersForm,
    applyFiltersForm,
    clearFilters,
    setPage,
    setLimit,
    // Enhanced search actions
    searchByTitle,
    filterByProject,
    filterByStatus,
    filterByPriority,
    filterByIssueType,
    filterByTrade,
    filterByAssignee,
    sortPunchlistItems,
  } = usePunchlistItems()

  // Projects for filtering (following schedule pattern)
  const { projects } = useProjects()

  // Team members for display and filtering
  const { teamMembers } = useTeamMembers()

  // ==============================================
  // COMPUTED VALUES
  // ==============================================
  
  // Active projects for filter dropdown
  const activeProjects = useMemo(() => {
    return projects.filter(project => 
      project.status === 'in_progress' || 
      project.status === 'not_started' || 
      project.status === 'on_track'
    )
  }, [projects])

  // ==============================================
  // UTILITY FUNCTIONS (Following established patterns)
  // ==============================================
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <AlertTriangle className="h-4 w-4" />
      case "assigned":
        return <User className="h-4 w-4" />
      case "in_progress":
        return <Play className="h-4 w-4" />
      case "pending_review":
        return <Clock className="h-4 w-4" />
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      case "rejected":
        return <XCircle className="h-4 w-4" />
      case "on_hold":
        return <Pause className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  const getAssignedMemberName = (assignedProjectMemberId?: string) => {
    if (!assignedProjectMemberId) return "Unassigned"
    
    const teamMember = teamMembers.find(member => 
      member.id === assignedProjectMemberId
    )
    return teamMember ? `${teamMember.firstName} ${teamMember.lastName}` : "Unknown"
  }

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    return project?.name || "Unknown Project"
  }

  // Filter punchlist items locally (in addition to server-side filtering)
  const filteredPunchlistItems = useMemo(() => {
    return punchlistItems.filter((item) => {
      // This provides additional client-side filtering if needed
      // Most filtering should be done server-side via the hooks
      return true
    })
  }, [punchlistItems])

  // ==============================================
  // LOADING STATE (Following team pattern)
  // ==============================================
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Filters Skeleton */}
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-48" />
        </div>

        {/* Items Skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // ==============================================
  // ERROR STATE (Following team pattern)
  // ==============================================
  if (hasError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Punchlist</h1>
            <p className="text-gray-600">Track and manage construction defects and completion items</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load punchlist items. {error || "Please try again."}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshPunchlistItems}
              className="ml-2"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // ==============================================
  // MAIN RENDER
  // ==============================================
  return (
    <div className="space-y-6">
      {/* Header (Following team pattern) */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Punchlist</h1>
          <p className="text-gray-600">Track and manage construction defects and completion items</p>
        </div>
        {withPermission('punchlist', 'add',
          <Link href="/dashboard/punchlist/new">
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </Link>
        )}
      </div>

      {/* Search and Filters (Following team/schedule pattern) */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search punchlist items..."
            value={filtersForm.search}
            onChange={(e) => {
              updateFiltersForm('search', e.target.value)
              searchByTitle(e.target.value)
            }}
            className="pl-10"
          />
        </div>

        {/* Project Filter */}
        <Select 
          value={filtersForm.projectId || "all"} 
          onValueChange={(value) => {
            updateFiltersForm('projectId', value === "all" ? "" : value)
            filterByProject(value === "all" ? undefined : value)
          }}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <Building2 className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All Projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {activeProjects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select 
          value={filtersForm.status || "all"} 
          onValueChange={(value) => {
            updateFiltersForm('status', value === "all" ? "" : value)
            filterByStatus(value === "all" ? undefined : value as any)
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {PUNCHLIST_STATUS_OPTIONS.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Priority Filter */}
        <Select 
          value={filtersForm.priority || "all"} 
          onValueChange={(value) => {
            updateFiltersForm('priority', value === "all" ? "" : value)
            filterByPriority(value === "all" ? undefined : value as any)
          }}
        >
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {PUNCHLIST_PRIORITY_OPTIONS.map((priority) => (
              <SelectItem key={priority.value} value={priority.value}>
                {priority.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* View Mode Toggle (Following team pattern) */}
        <div className="flex border rounded-md">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="rounded-r-none"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="rounded-l-none"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Punchlist Count (Following team pattern) */}
      {punchlistItems.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>
              Showing {filteredPunchlistItems.length} of {punchlistItems.length} punchlist item{punchlistItems.length !== 1 ? 's' : ''}
            </span>
          </div>
          {pagination && (
            <span>
              Page {Math.floor(pagination.offset / pagination.limit) + 1} of {Math.ceil(pagination.total / pagination.limit)}
            </span>
          )}
        </div>
      )}

      {/* Empty State (Following team pattern) */}
      {isEmpty && !hasError && (
        <div className="text-center py-12">
          <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No punchlist items found</h3>
          <p className="text-gray-600 mb-6">
            {filtersForm.search || filtersForm.projectId || filtersForm.status || filtersForm.priority
              ? "Try adjusting your search criteria or filters."
              : "Get started by adding your first punchlist item."}
          </p>
          {!filtersForm.search && !filtersForm.projectId && !filtersForm.status && !filtersForm.priority && withPermission('punchlist', 'add',
            <Link href="/dashboard/punchlist/new">
              <Button className="bg-orange-600 hover:bg-orange-700">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Punchlist Item
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Punchlist Items Grid View */}
      {filteredPunchlistItems.length > 0 && viewMode === 'grid' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPunchlistItems.map((item) => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(item.status)}
                    <Badge className={getPunchlistStatusColor(item.status)}>
                      {PUNCHLIST_STATUS_OPTIONS.find(s => s.value === item.status)?.label || item.status}
                    </Badge>
                  </div>
                  <Badge className={getPunchlistPriorityColor(item.priority)}>
                    {PUNCHLIST_PRIORITY_OPTIONS.find(p => p.value === item.priority)?.label || item.priority}
                  </Badge>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {item.title}
                </h3>

                {item.description && (
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {item.description}
                  </p>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">Project:</span>
                    <span className="text-gray-600 truncate">
                      {getProjectName(item.projectId)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">Assigned:</span>
                    <span className="text-gray-600 truncate">
                      {getAssignedMemberName(item.assignedProjectMemberId)}
                    </span>
                  </div>

                  {item.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">Location:</span>
                      <span className="text-gray-600 truncate">{item.location}</span>
                    </div>
                  )}

                  {item.dueDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">Due:</span>
                      <span className={`${isOverdue(item.dueDate) ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                        {formatDate(item.dueDate)}
                      </span>
                    </div>
                  )}

                  {item.issueType && (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">Type:</span>
                      <span className="text-gray-600">
                        {getIssueTypeLabel(item.issueType)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4">
                  <Link href={`/dashboard/punchlist/${item.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </Link>
                  {withPermission('punchlist', 'edit',
                    <Link href={`/dashboard/punchlist/${item.id}/edit`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Punchlist Items List View */}
      {filteredPunchlistItems.length > 0 && viewMode === 'list' && (
        <div className="space-y-3">
          {filteredPunchlistItems.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.status)}
                      <Badge className={getPunchlistStatusColor(item.status)}>
                        {PUNCHLIST_STATUS_OPTIONS.find(s => s.value === item.status)?.label || item.status}
                      </Badge>
                      <Badge className={getPunchlistPriorityColor(item.priority)}>
                        {PUNCHLIST_PRIORITY_OPTIONS.find(p => p.value === item.priority)?.label || item.priority}
                      </Badge>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate mb-1">
                        {item.title}
                      </h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          <span className="truncate">{getProjectName(item.projectId)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span className="truncate">{getAssignedMemberName(item.assignedProjectMemberId)}</span>
                        </div>
                        {item.dueDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span className={isOverdue(item.dueDate) ? 'text-red-600 font-medium' : ''}>
                              {formatDate(item.dueDate)}
                            </span>
                          </div>
                        )}
                        {item.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{item.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Link href={`/dashboard/punchlist/${item.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </Link>
                    {withPermission('punchlist', 'edit',
                      <Link href={`/dashboard/punchlist/${item.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-3 w-3" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}