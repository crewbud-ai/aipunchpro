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

export default function PunchlistPage() {
  // ==============================================
  // STATE
  // ==============================================
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

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

  const hasActiveFilters = useMemo(() => {
    return !!(
      filtersForm.search ||
      filtersForm.projectId ||
      filtersForm.status ||
      filtersForm.priority ||
      filtersForm.issueType ||
      filtersForm.tradeCategory
    )
  }, [filtersForm])

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
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
    <div className="space-y-4 xs:space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex xs:flex-col flex-row items-center xs:items-center xs:justify-between gap-3 xs:gap-4">
        <div className="w-full">
          <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold text-gray-900">Punchlist</h1>
          <p className="text-sm xs:text-base text-gray-600 mt-0.5">Track and manage construction defects and completion items</p>
        </div>
        {withPermission('punchlist', 'create',
          <Button className="bg-orange-600 hover:bg-orange-700 xs:w-full w-auto" asChild>
            <Link href="/dashboard/punchlist/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Link>
          </Button>
        )}
      </div>

      {/* Filters Bar */}
      <Card>
        <CardContent className="p-3 xs:p-4">
          <div className="flex flex-col space-y-3 xs:space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search punchlist items..."
                  value={filtersForm.search}
                  onChange={(e) => {
                    updateFiltersForm('search', e.target.value)
                    searchByTitle(e.target.value)
                  }}
                  className="pl-10 text-sm xs:text-base h-10 xs:h-11"
                />
              </div>
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-none md:flex gap-2 md:gap-4">
              {/* Project Filter */}
              <Select
                value={filtersForm.projectId || "all"}
                onValueChange={(value) => {
                  updateFiltersForm('projectId', value === "all" ? "" : value)
                  filterByProject(value === "all" ? undefined : value)
                }}
              >
                <SelectTrigger className="w-full md:w-[180px] text-sm xs:text-base h-10 xs:h-11">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {activeProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id} className="text-sm xs:text-base">
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
                <SelectTrigger className="w-full md:w-[160px] text-sm xs:text-base h-10 xs:h-11">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {PUNCHLIST_STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value} className="text-sm xs:text-base">
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
                <SelectTrigger className="w-full md:w-[140px] text-sm xs:text-base h-10 xs:h-11">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  {PUNCHLIST_PRIORITY_OPTIONS.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value} className="text-sm xs:text-base">
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters} className="col-span-2 sm:col-span-3 md:col-span-1 text-sm xs:text-base h-10 xs:h-11">
                  <Filter className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex justify-end mt-3 xs:mt-4 hidden">
            <div className="flex border border-gray-200 rounded-md">
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
        </CardContent>
      </Card>

      {/* Items Count */}
      {hasPunchlistItems && (
        <div className="flex xs:flex-col flex-row items-center xs:items-start justify-between gap-1 xs:gap-0 text-xs xs:text-sm text-gray-600">
          <span>
            Showing {punchlistItems.length} of {pagination.total} punchlist item{pagination.total !== 1 ? 's' : ''}
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
              onClick: clearFilters,
              variant: "outline",
              icon: Filter,
              show: hasActiveFilters,
            },
          ]}
        />
      )}

      {/* Grid View */}
      {hasPunchlistItems && viewMode === 'grid' && (
        <div className="grid gap-4 xs:gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {punchlistItems.map((item) => {
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
      )}

      {/* List View */}
      {hasPunchlistItems && viewMode === 'list' && (
        <div className="space-y-2 xs:space-y-3">
          {punchlistItems.map((item) => {
            const assignedInfo = getAssignedMembersInfo(item)
            return (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-3 xs:py-4 px-3 xs:px-4 sm:px-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    {/* Left Section */}
                    <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-3 sm:gap-4 flex-1 min-w-0">
                      {/* Status & Priority Badges */}
                      <div className="flex items-center gap-1.5 xs:gap-2 shrink-0 flex-wrap">
                        {getStatusIcon(item.status)}
                        <Badge className={getPunchlistStatusColor(item.status)}>
                          {PUNCHLIST_STATUS_OPTIONS.find(s => s.value === item.status)?.label || item.status}
                        </Badge>
                        <Badge className={getPunchlistPriorityColor(item.priority)}>
                          {PUNCHLIST_PRIORITY_OPTIONS.find(p => p.value === item.priority)?.label || item.priority}
                        </Badge>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm xs:text-base text-gray-900 truncate mb-1">
                          {item.title}
                        </h3>

                        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-1.5 xs:gap-2 text-xs xs:text-sm text-gray-600">
                          {/* Project */}
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3 shrink-0" />
                            <span className="truncate">{getProjectName(item.projectId)}</span>
                          </div>

                          {/* Team */}
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 shrink-0" />
                            {assignedInfo.count === 0 ? (
                              <span className="text-gray-500">Unassigned</span>
                            ) : assignedInfo.count === 1 ? (
                              <div className="flex items-center gap-1 min-w-0">
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

                          {/* Due Date */}
                          {item.dueDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 shrink-0" />
                              <span className={isOverdue(item.dueDate) ? 'text-red-600 font-medium' : ''}>
                                {formatDate(item.dueDate)}
                              </span>
                            </div>
                          )}

                          {/* Location */}
                          {item.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="truncate">{item.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Section - Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-start xs:self-auto">
                      <Button variant="outline" size="sm" className="flex-1 xs:flex-none" asChild>
                        <Link href={`/dashboard/punchlist/${item.id}`}>
                          <Eye className="h-3 w-3" />
                        </Link>
                      </Button>
                      {withPermission('punchlist', 'edit',
                        <Button variant="outline" size="sm" className="flex-1 xs:flex-none" asChild>
                          <Link href={`/dashboard/punchlist/${item.id}/edit`}>
                            <Edit className="h-3 w-3" />
                          </Link>
                        </Button>
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