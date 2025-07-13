// ==============================================
// app/(dashboard)/dashboard/punchlist/page.tsx - UPDATED for Multiple Assignments
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
import { toast } from "@/hooks/use-toast" // ✅ ADD: Toast instead of alert
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
  Users, // ✅ UPDATED: Users icon for multiple assignments
  RefreshCw,
  AlertCircle,
  Loader2,
  Crown, // ✅ ADD: For primary assignee
  Shield, // ✅ ADD: For inspector
  UserCheck // ✅ ADD: For supervisor
} from "lucide-react"
import Link from "next/link"

// Import our real hooks and types
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
  getTradeCategoryLabel,
  type PunchlistItemAssignment // ✅ ADD: Import assignment type
} from "@/types/punchlist-items"
import { withPermission } from "@/lib/permissions"

export default function PunchlistPage() {
  // ==============================================
  // STATE FOR UI CONTROLS
  // ==============================================
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // ==============================================
  // HOOKS FOR REAL DATA
  // ==============================================
  
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

  const { projects } = useProjects()
  const { teamMembers } = useTeamMembers()

  // ==============================================
  // COMPUTED VALUES
  // ==============================================
  
  const activeProjects = useMemo(() => {
    return projects.filter(project => 
      project.status === 'in_progress' || 
      project.status === 'not_started' || 
      project.status === 'on_track'
    )
  }, [projects])

  // ==============================================
  // ✅ UPDATED: Utility functions for multiple assignments
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

  // ✅ UPDATED: Get assigned members info - works with both full objects and summary data
  const getAssignedMembersInfo = (item: any) => {
    // Handle full assignment objects (from detail view)
    if (item.assignedMembers && Array.isArray(item.assignedMembers)) {
      const assignedMembers = item.assignedMembers
      
      if (assignedMembers.length === 0) {
        return {
          count: 0,
          display: "Unassigned",
          primary: null,
          hasMultiple: false
        }
      }

      const primaryAssignee = assignedMembers.find((member: any) => member.role === 'primary')
      const count = assignedMembers.length

      if (count === 1) {
        const member = assignedMembers[0]
        const name = member.user 
          ? `${member.user.firstName} ${member.user.lastName}`
          : "Unknown User"
        
        return {
          count: 1,
          display: name,
          primary: member,
          hasMultiple: false
        }
      }

      // Multiple assignments
      const primaryName = primaryAssignee?.user 
        ? `${primaryAssignee.user.firstName} ${primaryAssignee.user.lastName}`
        : "Unknown Primary"

      return {
        count,
        display: `${primaryName} +${count - 1} more`,
        primary: primaryAssignee,
        hasMultiple: true
      }
    }

    // Handle summary data with assignedMemberNames (from list view)
    if (item.assignedMemberNames && Array.isArray(item.assignedMemberNames)) {
      const names = item.assignedMemberNames
      const count = item.assignedMemberCount || names.length

      if (count === 0) {
        return {
          count: 0,
          display: "Unassigned",
          primary: null,
          hasMultiple: false
        }
      }

      if (count === 1) {
        return {
          count: 1,
          display: names[0] || "Unknown User",
          primary: null, // No role info in summary
          hasMultiple: false
        }
      }

      // Multiple assignments
      const primaryName = names[0] || "Unknown"
      return {
        count,
        display: `${primaryName} +${count - 1} more`,
        primary: null, // No role info in summary
        hasMultiple: true
      }
    }

    // Fallback for unassigned
    return {
      count: 0,
      display: "Unassigned",
      primary: null,
      hasMultiple: false
    }
  }

  const getProjectName = (projectId: string) => {
    console.log(projectId, 'projectId')
    console.log(projects, 'projects')
    const project = projects.find(p => p.id === projectId)
    return project?.name || "Unknown Project"
  }

  // ✅ UPDATED: Get role icon for assignments
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'primary': return <Crown className="h-3 w-3 text-orange-600" />
      case 'secondary': return <User className="h-3 w-3 text-blue-600" />
      case 'inspector': return <Shield className="h-3 w-3 text-purple-600" />
      case 'supervisor': return <UserCheck className="h-3 w-3 text-green-600" />
      default: return <User className="h-3 w-3 text-gray-600" />
    }
  }

  // Filter punchlist items locally
  const filteredPunchlistItems = useMemo(() => {
    return punchlistItems.filter((item) => {
      return true // Most filtering should be done server-side
    })
  }, [punchlistItems])

  // ==============================================
  // LOADING STATE
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
  // ERROR STATE
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
              onClick={() => {
                refreshPunchlistItems()
                toast({
                  title: "Refreshing",
                  description: "Reloading punchlist items...",
                })
              }}
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
      {/* Header */}
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

      {/* Search and Filters */}
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

        {/* View Mode Toggle */}
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

      {/* Punchlist Count */}
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

      {/* Empty State */}
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

      {filteredPunchlistItems.length > 0 && viewMode === 'grid' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPunchlistItems.map((item) => {
            const assignedInfo = getAssignedMembersInfo(item) // ✅ FIXED: Pass the whole item
            
            return (
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

                    {/* ✅ UPDATED: Team assignment display */}
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">Team:</span>
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        {assignedInfo.count === 0 ? (
                          <span className="text-gray-500">Unassigned</span>
                        ) : assignedInfo.count === 1 ? (
                          <div className="flex items-center gap-1">
                            {assignedInfo.primary && getRoleIcon(assignedInfo.primary.role)}
                            <span className="text-gray-600 truncate">{assignedInfo.display}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-600 text-xs bg-gray-100 px-2 py-1 rounded-full">
                              {assignedInfo.count} members
                            </span>
                            {assignedInfo.primary && (
                              <div className="flex items-center gap-1">
                                {getRoleIcon(assignedInfo.primary.role)}
                                <span className="text-gray-600 text-xs truncate">
                                  {assignedInfo.primary.user?.firstName}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
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
            )
          })}
        </div>
      )}

      {filteredPunchlistItems.length > 0 && viewMode === 'list' && (
        <div className="space-y-3">
          {filteredPunchlistItems.map((item) => {
            const assignedInfo = getAssignedMembersInfo(item) // ✅ FIXED: Pass the whole item
            
            return (
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
                          
                          {/* ✅ UPDATED: Team display in list view */}
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {assignedInfo.count === 0 ? (
                              <span className="text-gray-500">Unassigned</span>
                            ) : assignedInfo.count === 1 ? (
                              <div className="flex items-center gap-1">
                                {assignedInfo.primary && getRoleIcon(assignedInfo.primary.role)}
                                <span className="truncate">{assignedInfo.display}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <span className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                                  {assignedInfo.count}
                                </span>
                                {assignedInfo.primary && getRoleIcon(assignedInfo.primary.role)}
                                <span className="truncate text-xs">
                                  {assignedInfo.primary?.user?.firstName || assignedInfo.display.split(' ')[0]}
                                </span>
                              </div>
                            )}
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
            )
          })}
        </div>
      )}
    </div>
  )
}