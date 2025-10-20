// ==============================================
// app/(dashboard)/dashboard/punchlist/page.tsx - Professional Punchlist Management
// ==============================================

"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
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
  Crown,
  Shield,
  UserCheck,
  X,
} from "lucide-react"
import Link from "next/link"

// Hooks and Types
import { usePunchlistItems } from "@/hooks/punchlist-items"
import { useProjects } from "@/hooks/projects"
import { useTeamMembers } from "@/hooks/team-members"
import {
  PUNCHLIST_STATUS_OPTIONS,
  PUNCHLIST_PRIORITY_OPTIONS,
  getIssueTypeLabel,
  getPunchlistStatusColor,
  getPunchlistPriorityColor,
} from "@/types/punchlist-items"
import { hasPermission, withPermission } from "@/lib/permissions"
import { EmptyState } from "@/components/shared/EmptyState"
import { cn } from "@/lib/utils"
import { formatDate } from "@/utils/format-functions"

export default function PunchlistPage() {
  // ==============================================
  // STATE
  // ==============================================
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Add local filter states for smooth client-side filtering
  const [localSearchTerm, setLocalSearchTerm] = useState('')
  const [localProjectFilter, setLocalProjectFilter] = useState('all')
  const [localStatusFilter, setLocalStatusFilter] = useState('all')
  const [localPriorityFilter, setLocalPriorityFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  // ==============================================
  // PERMISSIONS
  // ==============================================
  const canCreatePunchlist = hasPermission('punchlist', 'create')
  const canEditPunchlist = hasPermission('punchlist', 'edit')

  // ==============================================
  // HOOKS
  // ==============================================
  const {
    punchlistItems,
    isLoading,
    hasError,
    error,
    isEmpty,
    pagination,
    filtersForm,
    hasPunchlistItems,

    // Actions
    refreshPunchlistItems,
    updateFiltersForm,
    clearFilters,

    // Enhanced search actions
    searchByTitle,
    filterByProject,
    filterByStatus,
    filterByPriority,
    filterByIssueType,
    filterByTrade,
  } = usePunchlistItems()

  const { projects, isLoading: isProjectsLoading } = useProjects()
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


  // filtering
  const filteredPunchlistItems = useMemo(() => {
    let filtered = punchlistItems

    // Search filter
    if (localSearchTerm.trim()) {
      const searchLower = localSearchTerm.toLowerCase().trim()
      filtered = filtered.filter(item => {
        const titleMatch = item.title?.toLowerCase().includes(searchLower)
        const descriptionMatch = item.description?.toLowerCase().includes(searchLower)
        const locationMatch = item.location?.toLowerCase().includes(searchLower)
        const projectNameMatch = item.project?.name.toLowerCase().includes(searchLower)
        const issueTypeMatch = getIssueTypeLabel(item.issueType)?.toLowerCase().includes(searchLower)

        return titleMatch || descriptionMatch || locationMatch || projectNameMatch || issueTypeMatch
      })
    }

    // Project filter
    if (localProjectFilter !== 'all') {
      filtered = filtered.filter(item => item.projectId === localProjectFilter)
    }

    // Status filter
    if (localStatusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === localStatusFilter)
    }

    // Priority filter
    if (localPriorityFilter !== 'all') {
      filtered = filtered.filter(item => item.priority === localPriorityFilter)
    }

    return filtered
  }, [punchlistItems, localSearchTerm, localProjectFilter, localStatusFilter, localPriorityFilter])

  const hasActiveFilters = useMemo(() => {
    return localSearchTerm || localProjectFilter !== 'all' || localStatusFilter !== 'all' || localPriorityFilter !== 'all'
  }, [localSearchTerm, localProjectFilter, localStatusFilter, localPriorityFilter])

  // ==============================================
  // EVENT HANDLERS
  // ==============================================
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchTerm(e.target.value)
  }

  const handleProjectFilterChange = (value: string) => {
    setLocalProjectFilter(value)
  }

  const handleStatusFilterChange = (value: string) => {
    setLocalStatusFilter(value)
  }

  const handlePriorityFilterChange = (value: string) => {
    setLocalPriorityFilter(value)
  }

  const handleClearAllFilters = () => {
    setLocalSearchTerm('')
    setLocalProjectFilter('all')
    setLocalStatusFilter('all')
    setLocalPriorityFilter('all')
  }

  // ==============================================
  // COMPUTED VALUES
  // ==============================================
  const displayedPunchlistItems = filteredPunchlistItems
  const punchlistItemsCount = filteredPunchlistItems.length


  // ==============================================
  // UTILITY FUNCTIONS
  // ==============================================
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open": return <AlertTriangle className="h-4 w-4" />
      case "assigned": return <User className="h-4 w-4" />
      case "in_progress": return <Play className="h-4 w-4" />
      case "pending_review": return <Clock className="h-4 w-4" />
      case "completed": return <CheckCircle className="h-4 w-4" />
      case "rejected": return <XCircle className="h-4 w-4" />
      case "on_hold": return <Pause className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  const getAssignedMembersInfo = (item: any) => {
    // Handle full assignment objects
    if (item.assignedMembers && Array.isArray(item.assignedMembers)) {
      const assignedMembers = item.assignedMembers

      if (assignedMembers.length === 0) {
        return { count: 0, display: "Unassigned", primary: null, hasMultiple: false }
      }

      const primaryAssignee = assignedMembers.find((member: any) => member.role === 'primary')
      const count = assignedMembers.length

      if (count === 1) {
        const member = assignedMembers[0]
        const name = member.user
          ? `${member.user.firstName} ${member.user.lastName}`
          : "Unknown User"
        return { count: 1, display: name, primary: member, hasMultiple: false }
      }

      const primaryName = primaryAssignee?.user
        ? `${primaryAssignee.user.firstName} ${primaryAssignee.user.lastName}`
        : "Unknown Primary"

      return {
        count,
        display: `${primaryName} +${count - 1}`,
        primary: primaryAssignee,
        hasMultiple: true
      }
    }

    // Handle summary data with assignedMemberNames
    if (item.assignedMemberNames && Array.isArray(item.assignedMemberNames)) {
      const names = item.assignedMemberNames
      const count = item.assignedMemberCount || names.length

      if (count === 0) {
        return { count: 0, display: "Unassigned", primary: null, hasMultiple: false }
      }

      if (count === 1) {
        return { count: 1, display: names[0] || "Unknown User", primary: null, hasMultiple: false }
      }

      const primaryName = names[0] || "Unknown"
      return { count, display: `${primaryName} +${count - 1}`, primary: null, hasMultiple: true }
    }

    return { count: 0, display: "Unassigned", primary: null, hasMultiple: false }
  }

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    return project?.name || "Unknown Project"
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'primary': return <Crown className="h-3 w-3 text-orange-600" />
      case 'secondary': return <User className="h-3 w-3 text-blue-600" />
      case 'inspector': return <Shield className="h-3 w-3 text-purple-600" />
      case 'supervisor': return <UserCheck className="h-3 w-3 text-green-600" />
      default: return <User className="h-3 w-3 text-gray-600" />
    }
  }

  // ==============================================
  // LOADING STATE
  // ==============================================
  if (isLoading) {
    return (
      <div className="space-y-4 xs:space-y-5 sm:space-y-6">
        <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3 xs:gap-4">
          <div className="w-full xs:w-auto">
            <Skeleton className="h-7 xs:h-8 w-40 xs:w-48 mb-1.5 xs:mb-2" />
            <Skeleton className="h-4 w-64 xs:w-96" />
          </div>
          <Skeleton className="h-10 w-full xs:w-32" />
        </div>

        {/* Filters Skeleton */}
        <Card>
          <CardContent className="p-3 xs:p-4">
            <div className="flex flex-col gap-3 xs:gap-4 md:flex-row">
              <Skeleton className="h-10 xs:h-11 flex-1" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-none md:flex gap-2 md:gap-4">
                <Skeleton className="h-10 xs:h-11 w-full md:w-48" />
                <Skeleton className="h-10 xs:h-11 w-full md:w-48" />
                <Skeleton className="h-10 xs:h-11 w-full md:w-48" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items Skeleton */}
        <div className="grid gap-4 xs:gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 xs:p-5 sm:p-6">
                <Skeleton className="h-5 xs:h-6 w-3/4 mb-1.5 xs:mb-2" />
                <Skeleton className="h-4 w-full mb-3 xs:mb-4" />
                <div className="space-y-1.5 xs:space-y-2">
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
      <div className="space-y-4 xs:space-y-5 sm:space-y-6">
        <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3 xs:gap-4">
          <div>
            <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold text-gray-900">Punchlist</h1>
            <p className="text-sm xs:text-base text-gray-600 mt-0.5">Track and manage construction defects and completion items</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-3.5 w-3.5 xs:h-4 xs:w-4 shrink-0" />
          <AlertDescription className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-4 text-xs xs:text-sm">
            <span>Failed to load punchlist items. {error || "Please try again."}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshPunchlistItems}
              className="w-full xs:w-auto shrink-0"
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
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl">
        <div className="space-y-4 xs:space-y-5 sm:space-y-6">
          {/* Header */}
          <div className="flex sm:flex-row sm:justify-between sm:items-center flex-col gap-3 sm:gap-4">
            <div >
              <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold text-gray-900">Punchlist</h1>
              <p className="text-sm xs:text-base text-gray-600 mt-0.5">Track and manage construction defects and completion items</p>
            </div>
            {withPermission('punchlist', 'create',
              <Button className="bg-orange-600 hover:bg-orange-700 w-auto xs:w-full" asChild>
                <Link href="/dashboard/punchlist/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Link>
              </Button>
            )}
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4 space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search punchlist items..."
                  value={localSearchTerm}
                  onChange={handleSearchChange}
                  className="pl-10 pr-10 h-11 text-base"
                />
                {localSearchTerm && (
                  <button
                    onClick={() => setLocalSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Filter Toggle Button - Mobile */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="w-full sm:hidden h-10"
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters {hasActiveFilters && `(${[localProjectFilter !== 'all', localStatusFilter !== 'all', localPriorityFilter !== 'all'].filter(Boolean).length})`}
              </Button>

              {/* Filters Row - Desktop Always Show, Mobile Toggle */}
              <div className={`${showFilters ? 'flex' : 'hidden'} sm:flex flex-col sm:flex-row gap-3`}>
                {/* Project Filter */}
                <Select value={localProjectFilter} onValueChange={handleProjectFilterChange}>
                  <SelectTrigger className="h-10 sm:h-11 text-base">
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
                <Select value={localStatusFilter} onValueChange={handleStatusFilterChange}>
                  <SelectTrigger className="h-10 sm:h-11 text-base">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {PUNCHLIST_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Priority Filter */}
                <Select value={localPriorityFilter} onValueChange={handlePriorityFilterChange}>
                  <SelectTrigger className="h-10 sm:h-11 text-base">
                    <SelectValue placeholder="All Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    {PUNCHLIST_PRIORITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* View Mode Toggle - Desktop Only */}
                <div className="hidden md:flex border rounded-md">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-r-none h-full"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-l-none h-full"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={handleClearAllFilters}
                    className="h-10 sm:h-11"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>


          {/* Items Count */}
          {hasPunchlistItems && (
            <div className="flex xs:flex-col flex-row items-center xs:items-start justify-between gap-1 xs:gap-0 text-xs xs:text-sm text-gray-600">
              <span>
                Showing {punchlistItemsCount} of {pagination.total} punchlist item{pagination.total !== 1 ? 's' : ''}
              </span>
              {pagination && (
                <span>
                  Page {Math.floor(pagination.offset / pagination.limit) + 1} of {Math.ceil(pagination.total / pagination.limit)}
                </span>
              )}
            </div>
          )}

          {/* Empty State */}
          {isEmpty && !hasError && (
            <EmptyState
              icon={AlertTriangle}
              title={hasActiveFilters ? "No punchlist items found" : "No punchlist items yet"}
              description={
                hasActiveFilters
                  ? "No items match your current filters. Try adjusting your search criteria."
                  : "No Punchlist Item found."
              }
              actions={[
                {
                  label: "Add Punchlist Item",
                  href: "/dashboard/punchlist/new",
                  icon: Plus,
                  show: !hasActiveFilters && canCreatePunchlist,
                },
                {
                  label: "Clear Filters",
                  onClick: handleClearAllFilters, // Use your new handler instead of clearFilters
                  variant: "outline",
                  icon: Filter,
                  show: Boolean(hasActiveFilters), // Convert to boolean explicitly
                },
              ]}
            />
          )}

          {punchlistItemsCount > 0 ? (
            <div className={cn(
              "grid gap-4",
              viewMode === 'grid' ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
            )}>
              {displayedPunchlistItems.map((item) => {
                const assignedInfo = getAssignedMembersInfo(item)

                return (
                  <Card key={item.id} className="hover:shadow-lg transition-shadow group">
                    <CardContent className="p-4 xs:p-5 sm:p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-2 xs:mb-3 gap-2">
                        <div className="flex items-center gap-1.5 xs:gap-2 flex-wrap">
                          {getStatusIcon(item.status)}
                          <Badge className={getPunchlistStatusColor(item.status)}>
                            {PUNCHLIST_STATUS_OPTIONS.find(s => s.value === item.status)?.label || item.status}
                          </Badge>
                        </div>
                        <Badge className={cn("shrink-0", getPunchlistPriorityColor(item.priority))}>
                          {PUNCHLIST_PRIORITY_OPTIONS.find(p => p.value === item.priority)?.label || item.priority}
                        </Badge>
                      </div>

                      {/* Title */}
                      <h3 className="text-base xs:text-lg font-semibold text-gray-900 mb-1.5 xs:mb-2 line-clamp-2 leading-snug">
                        {item.title}
                      </h3>

                      {/* Description */}
                      {item.description && (
                        <p className="text-gray-600 mb-3 xs:mb-4 line-clamp-2 text-xs xs:text-sm leading-snug">
                          {item.description}
                        </p>
                      )}

                      {/* Details */}
                      <div className="space-y-1.5 xs:space-y-2 text-xs xs:text-sm">
                        {/* Project */}
                        <div className="flex items-center gap-1.5 xs:gap-2">
                          <Building2 className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-gray-400 shrink-0" />
                          <span className="font-medium">Project:</span>
                          <span className="text-gray-600 truncate">
                            {getProjectName(item.projectId)}
                          </span>
                        </div>

                        {/* Team Assignment */}
                        <div className="flex items-center gap-1.5 xs:gap-2">
                          <Users className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-gray-400 shrink-0" />
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

                        {/* Location */}
                        {item.location && (
                          <div className="flex items-center gap-1.5 xs:gap-2">
                            <MapPin className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-gray-400 shrink-0" />
                            <span className="font-medium">Location:</span>
                            <span className="text-gray-600 truncate">{item.location}</span>
                          </div>
                        )}

                        {/* Due Date */}
                        {item.dueDate && (
                          <div className="flex items-center gap-1.5 xs:gap-2">
                            <Calendar className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-gray-400 shrink-0" />
                            <span className="font-medium">Due:</span>
                            <span className={`${isOverdue(item.dueDate) ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                              {formatDate(item.dueDate)}
                            </span>
                          </div>
                        )}

                        {/* Issue Type */}
                        {item.issueType && (
                          <div className="flex items-center gap-1.5 xs:gap-2">
                            <AlertTriangle className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-gray-400 shrink-0" />
                            <span className="font-medium">Type:</span>
                            <span className="text-gray-600">
                              {getIssueTypeLabel(item.issueType)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-3 xs:mt-4">
                        <Button variant="outline" size="sm" className="flex-1 text-xs xs:text-sm" asChild>
                          <Link href={`/dashboard/punchlist/${item.id}`}>
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Link>
                        </Button>
                        {withPermission('punchlist', 'edit',
                          <Button variant="outline" size="sm" className="flex-1 text-xs xs:text-sm" asChild>
                            <Link href={`/dashboard/punchlist/${item.id}/edit`}>
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Link>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                {hasActiveFilters ? (
                  <>
                    <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No punchlist items found</h3>
                    <p className="text-gray-600 mb-4">
                      No items match your current filters. Try adjusting your search criteria.
                    </p>
                    <div className="flex gap-2 justify-center">
                      {canCreatePunchlist && (
                        <Button className="bg-orange-600 hover:bg-orange-700" asChild>
                          <Link href="/dashboard/punchlist/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Punchlist Item
                          </Link>
                        </Button>
                      )}
                      <Button variant="outline" onClick={handleClearAllFilters}>
                        Clear Filters
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No punchlist items yet</h3>
                    <p className="text-gray-600 mb-4">
                      Get started by creating your first punchlist item.
                    </p>
                    {canCreatePunchlist && (
                      <Button className="bg-orange-600 hover:bg-orange-700" asChild>
                        <Link href="/dashboard/punchlist/new">
                          <Plus className="mr-2 h-4 w-4" />
                          Create Punchlist Item
                        </Link>
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}