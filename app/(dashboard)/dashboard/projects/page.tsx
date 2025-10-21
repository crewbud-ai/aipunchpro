// "use client"

// import { useState } from "react"
// import Link from "next/link"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Building2, Calendar, Users, DollarSign, Plus, Search, Filter, Grid3X3, List, MapPin, Clock } from "lucide-react"
// import { useProjects } from "@/hooks/projects"
// import { Skeleton } from "@/components/ui/skeleton"
// import { Alert, AlertDescription } from "@/components/ui/alert"

// export default function ProjectsPage() {
//   const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

//   const {
//     projects,
//     pagination,
//     filters,
//     isLoading,
//     hasError,
//     isEmpty,
//     hasProjects,
//     updateFilters,
//     clearFilters,
//     setPage,
//     error,
//     clearError,
//   } = useProjects()

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case "in_progress":
//         return "bg-blue-100 text-blue-800 border-blue-200"
//       case "not_started":
//         return "bg-gray-100 text-gray-800 border-gray-200"
//       case "on_track":
//         return "bg-green-100 text-green-800 border-green-200"
//       case "ahead_of_schedule":
//         return "bg-emerald-100 text-emerald-800 border-emerald-200"
//       case "behind_schedule":
//         return "bg-red-100 text-red-800 border-red-200"
//       case "on_hold":
//         return "bg-yellow-100 text-yellow-800 border-yellow-200"
//       case "completed":
//         return "bg-purple-100 text-purple-800 border-purple-200"
//       case "cancelled":
//         return "bg-gray-100 text-gray-600 border-gray-200"
//       default:
//         return "bg-gray-100 text-gray-800 border-gray-200"
//     }
//   }

//   const formatStatusLabel = (status: string) => {
//     switch (status) {
//       case 'not_started': return 'Not Started'
//       case 'in_progress': return 'In Progress'
//       case 'on_track': return 'On Track'
//       case 'ahead_of_schedule': return 'Ahead of Schedule'
//       case 'behind_schedule': return 'Behind Schedule'
//       case 'on_hold': return 'On Hold'
//       case 'completed': return 'Completed'
//       case 'cancelled': return 'Cancelled'
//       default: return status
//     }
//   }

//   const formatCurrency = (amount?: number) => {
//     if (!amount) return "$0"
//     return new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: 'USD',
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0,
//     }).format(amount)
//   }

//   const formatDate = (dateString?: string) => {
//     if (!dateString) return "Not set"
//     return new Date(dateString).toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric'
//     })
//   }

//   const getDaysUntilDeadline = (endDate?: string) => {
//     if (!endDate) return null
//     const today = new Date()
//     const deadline = new Date(endDate)
//     const diffTime = deadline.getTime() - today.getTime()
//     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
//     return diffDays
//   }

//   const getProgressColor = (progress?: number) => {
//     if (!progress) return 'bg-gray-300'
//     if (progress >= 90) return 'bg-green-500'
//     if (progress >= 70) return 'bg-blue-500'
//     if (progress >= 50) return 'bg-yellow-500'
//     if (progress >= 30) return 'bg-orange-500'
//     return 'bg-red-500'
//   }

//   // Loading skeleton
//   if (isLoading) {
//     return (
//       <div className="space-y-6">
//         <div className="flex items-center justify-between">
//           <div>
//             <Skeleton className="h-8 w-32 mb-2" />
//             <Skeleton className="h-4 w-64" />
//           </div>
//           <Skeleton className="h-10 w-32" />
//         </div>
//         <div className="flex gap-4">
//           <Skeleton className="h-10 flex-1" />
//           <Skeleton className="h-10 w-48" />
//         </div>
//         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
//           {Array.from({ length: 6 }).map((_, i) => (
//             <Card key={i}>
//               <CardHeader>
//                 <Skeleton className="h-6 w-3/4 mb-2" />
//                 <Skeleton className="h-4 w-full" />
//               </CardHeader>
//               <CardContent>
//                 <Skeleton className="h-20 w-full" />
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
//           <p className="text-gray-600">Manage all your construction projects in one place</p>
//         </div>
//         <Link href="/dashboard/projects/new">
//           <Button className="bg-orange-600 hover:bg-orange-700">
//             <Plus className="mr-2 h-4 w-4" />
//             New Project
//           </Button>
//         </Link>
//       </div>

//       {/* Error State */}
//       {hasError && (
//         <Alert variant="destructive">
//           <AlertDescription className="flex items-center justify-between">
//             {error}
//             <Button variant="outline" size="sm" onClick={clearError}>
//               Dismiss
//             </Button>
//           </AlertDescription>
//         </Alert>
//       )}

//       {/* Search and Filters */}
//       <div className="flex flex-col sm:flex-row gap-4">
//         <div className="relative flex-1">
//           <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
//           <Input
//             placeholder="Search projects by name, location, or client..."
//             value={filters.search || ''}
//             onChange={(e) => updateFilters({ search: e.target.value })}
//             className="pl-10"
//           />
//         </div>

//         <div className="flex gap-2">
//           <Select 
//             value={filters.status || 'all'} 
//             onValueChange={(value) => updateFilters({ status: value === 'all' ? undefined : value as any })}
//           >
//             <SelectTrigger className="w-[160px]">
//               <SelectValue placeholder="Status" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="all">All Status</SelectItem>
//               <SelectItem value="not_started">Not Started</SelectItem>
//               <SelectItem value="in_progress">In Progress</SelectItem>
//               <SelectItem value="on_track">On Track</SelectItem>
//               <SelectItem value="ahead_of_schedule">Ahead of Schedule</SelectItem>
//               <SelectItem value="behind_schedule">Behind Schedule</SelectItem>
//               <SelectItem value="on_hold">On Hold</SelectItem>
//               <SelectItem value="completed">Completed</SelectItem>
//               <SelectItem value="cancelled">Cancelled</SelectItem>
//             </SelectContent>
//           </Select>

//           <Select 
//             value={filters.sortBy || 'created_at'} 
//             onValueChange={(value) => updateFilters({ sortBy: value as any })}
//           >
//             <SelectTrigger className="w-[140px]">
//               <SelectValue placeholder="Sort by" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="created_at">Created Date</SelectItem>
//               <SelectItem value="name">Name</SelectItem>
//               <SelectItem value="start_date">Start Date</SelectItem>
//               <SelectItem value="end_date">End Date</SelectItem>
//               <SelectItem value="progress">Progress</SelectItem>
//               <SelectItem value="budget">Budget</SelectItem>
//             </SelectContent>
//           </Select>

//           {/* Clear Filters */}
//           {(filters.search || filters.status) && (
//             <Button variant="outline" onClick={clearFilters}>
//               <Filter className="mr-2 h-4 w-4" />
//               Clear
//             </Button>
//           )}

//           {/* View Mode Toggle */}
//           <div className="flex border border-gray-200 rounded-md">
//             <Button
//               variant={viewMode === 'grid' ? 'default' : 'ghost'}
//               size="sm"
//               onClick={() => setViewMode('grid')}
//               className="rounded-r-none"
//             >
//               <Grid3X3 className="h-4 w-4" />
//             </Button>
//             <Button
//               variant={viewMode === 'list' ? 'default' : 'ghost'}
//               size="sm"
//               onClick={() => setViewMode('list')}
//               className="rounded-l-none"
//             >
//               <List className="h-4 w-4" />
//             </Button>
//           </div>
//         </div>
//       </div>

//       {/* Projects Count */}
//       {hasProjects && (
//         <div className="flex items-center justify-between text-sm text-gray-600">
//           <span>
//             Showing {projects.length} of {pagination.total} projects
//           </span>
//           <span>
//             Page {pagination.page} of {pagination.totalPages}
//           </span>
//         </div>
//       )}

//       {/* Empty State */}
//       {isEmpty && !hasError && (
//         <div className="text-center py-12">
//           <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
//           <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
//           <p className="text-gray-600 mb-6">
//             {filters.search || filters.status
//               ? "Try adjusting your search criteria or filters."
//               : "Get started by creating your first construction project."}
//           </p>
//           {!filters.search && !filters.status && (
//             <Link href="/dashboard/projects/new">
//               <Button className="bg-orange-600 hover:bg-orange-700">
//                 <Plus className="mr-2 h-4 w-4" />
//                 Create Your First Project
//               </Button>
//             </Link>
//           )}
//         </div>
//       )}

//       {/* Projects Grid */}
//       {hasProjects && viewMode === 'grid' && (
//         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
//           {projects.map((project) => {
//             const daysUntilDeadline = getDaysUntilDeadline(project.endDate)

//             return (
//               <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
//                 <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group h-full">
//                   <CardHeader className="pb-3">
//                     <div className="flex items-start justify-between">
//                       <div className="flex-1 min-w-0">
//                         <CardTitle className="text-lg group-hover:text-orange-600 transition-colors truncate">
//                           {project.name}
//                         </CardTitle>
//                         <CardDescription className="mt-1 line-clamp-2">
//                           {project.description || "No description provided"}
//                         </CardDescription>
//                       </div>
//                       <Badge className={getStatusColor(project.status)} variant="outline">
//                         {formatStatusLabel(project.status)}
//                       </Badge>
//                     </div>
//                   </CardHeader>

//                   <CardContent className="space-y-4">
//                     {/* Progress Bar */}
//                     {project.progress !== undefined && (
//                       <div>
//                         <div className="flex justify-between text-sm mb-2">
//                           <span className="text-gray-600">Progress</span>
//                           <span className="font-medium">{project.progress}%</span>
//                         </div>
//                         <div className="w-full bg-gray-200 rounded-full h-2">
//                           <div 
//                             className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(project.progress)}`}
//                             style={{ width: `${project.progress}%` }} 
//                           />
//                         </div>
//                       </div>
//                     )}

//                     {/* Project Stats - 2 items per row */}
//                     <div className="grid grid-cols-2 gap-3 text-sm">
//                       <div className="flex items-center gap-2">
//                         <DollarSign className="h-4 w-4 text-gray-400 flex-shrink-0" />
//                         <div className="min-w-0 flex-1">
//                           <p className="font-medium text-gray-900 truncate">
//                             {formatCurrency(project.spent)} / {formatCurrency(project.budget)}
//                           </p>
//                           <p className="text-gray-600 text-xs">Budget</p>
//                         </div>
//                       </div>

//                       <div className="flex items-center gap-2">
//                         <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
//                         <div className="min-w-0 flex-1">
//                           <p className="font-medium text-gray-900 truncate">
//                             {formatDate(project.startDate)}
//                           </p>
//                           <p className="text-gray-600 text-xs">Start Date</p>
//                         </div>
//                       </div>

//                       {project.endDate && (
//                         <div className="flex items-center gap-2 col-span-1">
//                           <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
//                           <div className="min-w-0 flex-1">
//                             <p className="font-medium text-gray-900 truncate">
//                               {formatDate(project.endDate)}
//                             </p>
//                             <p className={`text-xs ${
//                               daysUntilDeadline !== null && daysUntilDeadline < 0 
//                                 ? 'text-red-600' 
//                                 : daysUntilDeadline !== null && daysUntilDeadline <= 7
//                                 ? 'text-orange-600'
//                                 : 'text-gray-600'
//                             }`}>
//                               {daysUntilDeadline !== null && daysUntilDeadline < 0 
//                                 ? `${Math.abs(daysUntilDeadline)} days overdue`
//                                 : daysUntilDeadline !== null && daysUntilDeadline <= 7
//                                 ? `${daysUntilDeadline} days left`
//                                 : 'End Date'
//                               }
//                             </p>
//                           </div>
//                         </div>
//                       )}

//                       {/* If we have both location and client, they go on second row */}
//                       {project.location && (
//                         <div className="flex items-center gap-2">
//                           <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
//                           <div className="min-w-0 flex-1">
//                             <p className="font-medium text-gray-900 truncate">
//                               {project.location.displayName || project.location.address}
//                             </p>
//                             <p className="text-gray-600 text-xs">Location</p>
//                           </div>
//                         </div>
//                       )}

//                       {project.client?.name && (
//                         <div className="flex items-center gap-2">
//                           <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
//                           <div className="min-w-0 flex-1">
//                             <p className="font-medium text-gray-900 truncate">{project.client.name}</p>
//                             <p className="text-gray-600 text-xs">Client</p>
//                           </div>
//                         </div>
//                       )}
//                     </div>

//                     {/* View Project Button */}
//                     <div className="pt-4">
//                       <Button 
//                         variant="outline" 
//                         className="w-full group-hover:bg-orange-50 group-hover:border-orange-200 group-hover:text-orange-700"
//                       >
//                         View Project
//                       </Button>
//                     </div>
//                   </CardContent>
//                 </Card>
//               </Link>
//             )
//           })}
//         </div>
//       )}

//       {/* Projects List View */}
//       {hasProjects && viewMode === 'list' && (
//         <div className="space-y-4">
//           {projects.map((project) => {
//             const daysUntilDeadline = getDaysUntilDeadline(project.endDate)

//             return (
//               <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
//                 <Card className="hover:shadow-md transition-all duration-200 cursor-pointer">
//                   <CardContent className="p-6">
//                     <div className="flex items-center justify-between">
//                       <div className="flex-1 min-w-0">
//                         <div className="flex items-center gap-3 mb-2">
//                           <h3 className="text-lg font-semibold text-gray-900 truncate">
//                             {project.name}
//                           </h3>
//                           <Badge className={getStatusColor(project.status)} variant="outline">
//                             {formatStatusLabel(project.status)}
//                           </Badge>
//                           {daysUntilDeadline !== null && daysUntilDeadline <= 7 && daysUntilDeadline >= 0 && (
//                             <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
//                               Due Soon
//                             </Badge>
//                           )}
//                           {daysUntilDeadline !== null && daysUntilDeadline < 0 && (
//                             <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
//                               Overdue
//                             </Badge>
//                           )}
//                         </div>

//                         <p className="text-gray-600 mb-3 line-clamp-1">
//                           {project.description || "No description provided"}
//                         </p>

//                         <div className="flex items-center flex-wrap gap-4 text-sm text-gray-600">
//                           <div className="flex items-center gap-1">
//                             <DollarSign className="h-4 w-4" />
//                             <span>{formatCurrency(project.spent)} / {formatCurrency(project.budget)}</span>
//                           </div>
//                           <div className="flex items-center gap-1">
//                             <Calendar className="h-4 w-4" />
//                             <span>{formatDate(project.startDate)}</span>
//                           </div>
//                           {project.endDate && (
//                             <div className="flex items-center gap-1">
//                               <Clock className="h-4 w-4" />
//                               <span>{formatDate(project.endDate)}</span>
//                             </div>
//                           )}
//                           {project.location && (
//                             <div className="flex items-center gap-1">
//                               <MapPin className="h-4 w-4" />
//                               <span className="truncate">
//                                 {project.location.displayName || project.location.address}
//                               </span>
//                             </div>
//                           )}
//                           {project.client?.name && (
//                             <div className="flex items-center gap-1">
//                               <Building2 className="h-4 w-4" />
//                               <span className="truncate">{project.client.name}</span>
//                             </div>
//                           )}
//                         </div>
//                       </div>

//                       <div className="flex items-center gap-4">
//                         {/* Progress */}
//                         {project.progress !== undefined && (
//                           <div className="text-center min-w-[80px]">
//                             <div className="text-2xl font-bold text-gray-900">
//                               {project.progress}%
//                             </div>
//                             <div className="text-xs text-gray-600">Complete</div>
//                             <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
//                               <div 
//                                 className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(project.progress)}`}
//                                 style={{ width: `${project.progress}%` }} 
//                               />
//                             </div>
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   </CardContent>
//                 </Card>
//               </Link>
//             )
//           })}
//         </div>
//       )}

//       {/* Pagination */}
//       {hasProjects && pagination.totalPages > 1 && (
//         <div className="flex items-center justify-center gap-2">
//           <Button
//             variant="outline"
//             onClick={() => setPage(pagination.page - 1)}
//             disabled={pagination.page === 1}
//           >
//             Previous
//           </Button>

//           <div className="flex items-center gap-1">
//             {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
//               const pageNumber = i + 1
//               return (
//                 <Button
//                   key={pageNumber}
//                   variant={pagination.page === pageNumber ? "default" : "outline"}
//                   size="sm"
//                   onClick={() => setPage(pageNumber)}
//                 >
//                   {pageNumber}
//                 </Button>
//               )
//             })}
//           </div>

//           <Button
//             variant="outline"
//             onClick={() => setPage(pagination.page + 1)}
//             disabled={pagination.page === pagination.totalPages}
//           >
//             Next
//           </Button>
//         </div>
//       )}
//     </div>
//   )
// }

// ==============================================
// app/(dashboard)/dashboard/projects/page.tsx - PROPER PERMISSION-BASED VERSION
// ==============================================

"use client"

import { useCallback, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PermissionGuard, RoleGuard } from "@/components/ui/permission-guard"
import { Building2, Calendar, Users, DollarSign, Plus, Search, Filter, Grid3X3, List, MapPin, Clock, UserCheck, Crown, TrendingUp, X } from "lucide-react"
import { useProjects } from "@/hooks/projects/use-projects"
import { useMemberProjects } from "@/hooks/projects/use-member-projects"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { hasPermission, withPermission } from "@/lib/permissions"
import { formatCurrency, formatDate, formatStatusLabel, getDaysUntilDeadline, getProgressColor, getRoleColor, getStatusColor } from "@/utils/format-functions"

export default function ProjectsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [localSearchTerm, setLocalSearchTerm] = useState('')
  const [statusSearch, setStatusSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Instead of checking role, check ACTUAL PERMISSIONS
  const canViewAllProjects = hasPermission('projects', 'viewAll')
  const canCreateProjects = hasPermission('projects', 'create')



  // Use different hooks based on PERMISSIONS, not role
  const adminHookResult = useProjects()
  const memberHookResult = useMemberProjects()

  // Use the appropriate hook based on permissions
  const hookResult = canViewAllProjects ? adminHookResult : memberHookResult

  const {
    projectsByStatus
  } = useProjects();

  const {
    projects: apiProjects,
    pagination,
    filters,
    isLoading,
    hasError,
    isEmpty,
    hasProjects,
    updateFilters,
    clearFilters,
    setPage,
    error,
    clearError,
    state,
  } = hookResult

  // Get project stats (only for users without viewAll permission)
  const projectStats = !canViewAllProjects ? memberHookResult.projectStats : undefined


  const filteredProjects = useMemo(() => {
    if (!localSearchTerm.trim() && !statusSearch.trim()) {
      return apiProjects // No search term, return all
    }

    const searchLower = localSearchTerm.toLowerCase().trim() || statusSearch.toLowerCase().trim()

    return apiProjects.filter(project => {
      // Search across multiple fields
      const nameMatch = project.name?.toLowerCase().includes(searchLower)
      const numberMatch = project.projectNumber?.toLowerCase().includes(searchLower)
      const locationMatch = project.location?.address?.toLowerCase().includes(searchLower)
      const cityMatch = project.location?.city?.toLowerCase().includes(searchLower)
      const statusMatch = project.status?.toLowerCase().includes(searchLower)

      return nameMatch || numberMatch || locationMatch || cityMatch || statusMatch
    })
  }, [apiProjects, localSearchTerm, statusSearch])


  const handleSearchChange = useCallback((e: any) => {
    setLocalSearchTerm(e.target.value) // Just update state, no API call!
  }, [])

  const handleClearSearch = useCallback(() => {
    setLocalSearchTerm('')
  }, [])

  // ==============================================
  // FILTER HANDLERS
  // ==============================================
  const handleStatusFilter = useCallback((status: any) => {
    if (status === 'all') {
      setStatusSearch('')
    } else {
      setStatusSearch(status)
    }
  }, [projectsByStatus, updateFilters])

  const handleClearAllFilters = useCallback(() => {
    setLocalSearchTerm('')
    setStatusSearch('')
  }, [clearFilters])



  // ==============================================
  // COMPUTED VALUES
  // ==============================================
  const hasActiveFilters = filters.status || filters.priority || localSearchTerm || statusSearch
  const displayedProjects = filteredProjects
  const projectCount = filteredProjects.length

  // Loading state
  if (isLoading || state === 'loading') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Member Stats Skeleton - PERMISSION-BASED */}
        <PermissionGuard condition={!canViewAllProjects}>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-12 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        </PermissionGuard>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (hasError || state === 'error') {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertDescription>
            {error || "Failed to load projects. Please try again."}
          </AlertDescription>
        </Alert>
        <Button onClick={clearError} variant="outline">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl">
        <div className="space-y-4 xs:space-y-5 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {canViewAllProjects ? "Projects" : "My Projects"}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                {canViewAllProjects
                  ? "Manage and track all your construction projects"
                  : "Projects you're assigned to work on"}
              </p>
            </div>

            {/* Create Project Button - Using your permission system */}
            <PermissionGuard category="projects" permission="create">
              <Link href="/dashboard/projects/new" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700">
                  <Plus className="mr-2 h-4 w-4" />
                  <span className="text-sm xs:text-base">New Project</span>
                </Button>
              </Link>
            </PermissionGuard>
          </div>

          {/* Member Stats Cards - PERMISSION-BASED */}
          <PermissionGuard condition={!canViewAllProjects && !!projectStats}>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Total Projects */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">My Projects</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{projectStats?.total}</div>
                  <p className="text-xs text-muted-foreground">
                    {projectStats?.active} active, {projectStats?.completed} completed
                  </p>
                </CardContent>
              </Card>

              {/* Active Projects */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Work</CardTitle>
                  <Clock className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{projectStats?.active}</div>
                  <p className="text-xs text-muted-foreground">
                    Currently in progress
                  </p>
                </CardContent>
              </Card>

              {/* Leadership Roles */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Leadership Roles</CardTitle>
                  <Crown className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {(projectStats?.supervisorRoles || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {projectStats?.supervisorRoles} supervisor
                  </p>
                </CardContent>
              </Card>

              {/* Average Progress */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{projectStats?.averageProgress}%</div>
                  <p className="text-xs text-muted-foreground">
                    Across all projects
                  </p>
                </CardContent>
              </Card>
            </div>
          </PermissionGuard>

          {/* Filters & Search */}
          <Card>
            <CardContent className="p-4 space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, number, client, or location..."
                  value={localSearchTerm}
                  onChange={handleSearchChange}
                  className="pl-10 pr-10 h-11 text-base"
                />
                {localSearchTerm && (
                  <button
                    onClick={handleClearSearch}
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
                Filters {hasActiveFilters && `(${[filters.status, filters.priority, localSearchTerm].filter(Boolean).length})`}
              </Button>

              {/* Filters Row - Desktop Always Show, Mobile Toggle */}
              <div className={`${showFilters ? 'flex' : 'hidden'} sm:flex flex-col sm:flex-row gap-3`}>
                {/* Status Filter */}
                <Select
                  value={filters.status}
                  onValueChange={handleStatusFilter}
                >
                  <SelectTrigger className="h-10 sm:h-11 text-base">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Toggle - Desktop Only */}
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

          {/* Projects Count */}
          {hasProjects && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Showing {projectCount} of {pagination.total} projects
              </span>
              <span>
                Page {pagination.page} of {pagination.totalPages}
              </span>
            </div>
          )}

          {/* Empty State - PERMISSION-BASED */}
          {(isEmpty || state === 'empty') && !hasError && (
            <Card>
              <CardContent className="text-center py-12">
                <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {canViewAllProjects ? "No projects found" : "No assigned projects"}
                </h3>
                <p className="text-gray-600 mb-6">
                  {filters.search || filters.status
                    ? "Try adjusting your search criteria or filters."
                    : canViewAllProjects
                      ? "Get started by creating your first construction project."
                      : "You haven't been assigned to any projects yet. Contact your supervisor for project assignments."
                  }
                </p>
                {canViewAllProjects && !filters.search && !filters.status && (
                  <PermissionGuard category="projects" permission="create">
                    <Link href="/dashboard/projects/new">
                      <Button className="bg-orange-600 hover:bg-orange-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Your First Project
                      </Button>
                    </Link>
                  </PermissionGuard>
                )}
              </CardContent>
            </Card>
          )}

          {/* Projects Grid */}
          {projectCount > 0 ? (
            <div className={`grid gap-4 sm:gap-6 ${viewMode === 'grid'
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              : 'grid-cols-1'
              }`}>
              {displayedProjects.map((project: any) => {
                const daysUntilDeadline = getDaysUntilDeadline(project.endDate)

                return (
                  <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
                    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group h-full">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg group-hover:text-orange-600 transition-colors truncate">
                              {project.name}
                            </CardTitle>
                            <CardDescription className="mt-1 line-clamp-2">
                              {project.description || "No description provided"}
                            </CardDescription>
                          </div>
                          <Badge className={getStatusColor(project.status)}>
                            {formatStatusLabel(project.status)}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {/* Project Details */}
                        <div className="grid grid-cols-3 justify-between gap-4 text-sm">
                          {/* Timeline */}
                          <div className="col-span-2">
                            <div className="flex items-center text-gray-600">
                              <Calendar className="mr-2 h-4 w-4" />
                              Timeline
                            </div>
                            <div className="font-medium">
                              {formatDate(project.startDate)} - {formatDate(project.endDate)}
                            </div>
                            {daysUntilDeadline !== null && (
                              <div className={`text-xs ${daysUntilDeadline < 0
                                ? 'text-red-600'
                                : daysUntilDeadline < 30
                                  ? 'text-yellow-600'
                                  : 'text-green-600'
                                }`}>
                                {daysUntilDeadline < 0
                                  ? `${Math.abs(daysUntilDeadline)} days overdue`
                                  : `${daysUntilDeadline} days remaining`
                                }
                              </div>
                            )}
                          </div>

                          {/* Location */}
                          <div className="space-y-1">
                            <div className="flex items-center text-gray-600">
                              <MapPin className="mr-2 h-4 w-4" />
                              Location
                            </div>
                            <div className="font-medium text-sm">
                              {project.location?.address ? (
                                <span className="line-clamp-2">{project.location.address}</span>
                              ) : (
                                <span className="text-gray-500 italic">Not specified</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Progress & Budget Row */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          {/* Progress */}
                          {project.progress !== undefined && (
                            <div className="text-center min-w-[80px]">
                              <div className="text-2xl font-bold text-gray-900">
                                {project.progress}%
                              </div>
                              <div className="text-xs text-gray-600">Complete</div>
                              <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                                <div
                                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(project.progress)}`}
                                  style={{ width: `${project.progress}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Budget - PERMISSION-BASED */}
                          <PermissionGuard category="financials" permission="view">
                            {project.budget && (
                              <div className="text-center">
                                <div className="flex items-center text-gray-600">
                                  <DollarSign className="mr-1 h-4 w-4" />
                                  Budget
                                </div>
                                <div className="font-bold text-green-600">
                                  {formatCurrency(project.budget)}
                                </div>
                              </div>
                            )}
                          </PermissionGuard>

                          {/* Project Number */}
                          {project.projectNumber && (
                            <div className="text-center">
                              <div className="text-xs text-gray-500">Project #</div>
                              <div className="font-medium text-sm">{project.projectNumber}</div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                {hasActiveFilters ? (
                  <>
                    <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
                    <p className="text-gray-600 mb-4">
                      No projects match your current filters. Try adjusting your search criteria.
                    </p>
                    <div className="flex gap-2 justify-center">
                      {withPermission('projects', 'create',
                        <Button className="bg-orange-600 hover:bg-orange-700" asChild>
                          <Link href="/dashboard/projects/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Project
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
                    <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
                    <p className="text-gray-600 mb-4">
                      Get started by creating your first construction project.
                    </p>
                    {withPermission('projects', 'create',
                      <Button className="bg-orange-600 hover:bg-orange-700" asChild>
                        <Link href="/dashboard/projects/new">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Project
                        </Link>
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}


        </div>
      </div>
    </div>
  )
}