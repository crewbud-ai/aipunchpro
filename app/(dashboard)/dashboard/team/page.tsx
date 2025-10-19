// File: app/(dashboard)/dashboard/team/page.tsx

"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Clock,
  Users,
  Filter,
  Grid3X3,
  List,
  Edit,
  Eye,
  UserPlus,
  AlertCircle,
  RefreshCw
} from "lucide-react"
import Link from "next/link"

// Import our hooks and types
import { useTeamMembers } from "@/hooks/team-members"
import { TRADE_SPECIALTIES } from "@/types/team-members"
import { withPermission } from "@/lib/permissions"
import { formatPhone, getTeamMemberStatusConfig, getTradeLabel } from "@/utils/format-functions"

export default function TeamPage() {
  // State for UI controls
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTrade, setSelectedTrade] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Load team members
  const {
    teamMembers,
    isLoading,
    hasError,
    error,
    isEmpty,
    pagination,
    filters,
    // searchByName,
    filterByTrade,
    filterByStatus,
    refreshTeamMembers,
  } = useTeamMembers()

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value)
    // searchByName(value)
  }

  // Handle trade filter
  const handleTradeFilter = (value: string) => {
    setSelectedTrade(value)
    // if (value === "all") {
    //   filterByTrade(undefined)
    // } else {
    //   // Type assertion since we know the value comes from TRADE_SPECIALTIES
    //   filterByTrade(value as 'electrical' | 'plumbing' | 'framing' | 'drywall' | 'roofing' | 'concrete' | 'hvac' | 'general' | 'management' | 'safety')
    // }
  }

  // Handle status filter
  const handleStatusFilter = (value: string) => {
    setSelectedStatus(value)
    // filterByStatus(value === "all" ? undefined : (value as 'active' | 'inactive'))
  }

  // Helper functions
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }


  // Filter team members locally (in addition to server-side filtering)
  const filteredTeamMembers = teamMembers.filter((member) => {
    if (searchTerm && !searchTerm.trim()) return true

    const searchLower = searchTerm.toLowerCase()
    return (
      member.firstName.toLowerCase().includes(searchLower) ||
      member.lastName.toLowerCase().includes(searchLower) ||
      member.email.toLowerCase().includes(searchLower) ||
      member.jobTitle?.toLowerCase().includes(searchLower) ||
      getTradeLabel(member.tradeSpecialty).toLowerCase().includes(searchLower)
    )
  })

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4 xs:space-y-5 sm:space-y-6">
        {/* Header Skeleton - Mobile Responsive */}
        <div className="flex flex-col xs:flex-row xs:items-start xs:justify-between gap-3 xs:gap-4">
          <div className="flex-1 min-w-0">
            <Skeleton className="h-7 xs:h-8 sm:h-9 w-32 xs:w-40 sm:w-48 mb-1.5 xs:mb-2" />
            <Skeleton className="h-4 xs:h-5 w-64 xs:w-80 sm:w-96" />
          </div>
          <Skeleton className="h-9 xs:h-10 w-full xs:w-40 sm:w-48" />
        </div>

        {/* Filters Skeleton - Mobile Responsive */}
        <div className="flex flex-col space-y-2 xs:space-y-3 sm:space-y-0 sm:flex-row sm:gap-3 md:gap-4">
          <Skeleton className="h-9 xs:h-10 sm:h-11 flex-1" />
          <div className="grid grid-cols-2 gap-2 xs:gap-3 sm:grid-cols-none sm:flex">
            <Skeleton className="h-9 xs:h-10 sm:h-11 w-full sm:w-[160px] md:w-[180px]" />
            <Skeleton className="h-9 xs:h-10 sm:h-11 w-full sm:w-[160px] md:w-[180px]" />
          </div>
          <Skeleton className="h-9 xs:h-10 w-20 xs:w-24 self-end sm:self-auto" />
        </div>

        {/* Grid Skeleton - Mobile Responsive */}
        <div className="grid gap-3 xs:gap-4 sm:gap-5 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="p-4 xs:p-5 sm:p-6">
                <div className="flex items-start gap-3 xs:gap-4">
                  <Skeleton className="h-10 w-10 xs:h-12 xs:w-12 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5 xs:space-y-2 min-w-0">
                    <Skeleton className="h-4 xs:h-5 w-24 xs:w-28 sm:w-32" />
                    <Skeleton className="h-3 xs:h-4 w-20 xs:w-22 sm:w-24" />
                    <Skeleton className="h-5 xs:h-6 w-14 xs:w-16" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 xs:p-5 sm:p-6 pt-0">
                <div className="space-y-2 xs:space-y-2.5 sm:space-y-3">
                  <Skeleton className="h-3 xs:h-4 w-full" />
                  <Skeleton className="h-3 xs:h-4 w-full" />
                  <Skeleton className="h-3 xs:h-4 w-3/4" />
                  <Skeleton className="h-3 xs:h-4 w-2/3" />
                  <div className="pt-1 xs:pt-2">
                    <Skeleton className="h-3 xs:h-4 w-1/2" />
                  </div>
                  <div className="flex gap-1.5 xs:gap-2 pt-1 xs:pt-2">
                    <Skeleton className="h-8 xs:h-9 flex-1" />
                    <Skeleton className="h-8 xs:h-9 flex-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (hasError) {
    return (
      <div className="space-y-4 xs:space-y-5 sm:space-y-6">
        {/* Header - Mobile Responsive */}
        <div className="flex flex-col xs:flex-row xs:items-start xs:justify-between gap-3 xs:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold text-gray-900 truncate leading-tight">Team</h1>
            <p className="text-sm xs:text-base text-gray-600 mt-0.5 line-clamp-2 leading-snug xs:leading-normal">
              Manage your construction crew and track their progress
            </p>
          </div>
          {withPermission('team', 'add',
            <Link href="/dashboard/team/new" className="w-full xs:w-auto">
              <Button className="bg-orange-600 hover:bg-orange-700 w-full xs:w-auto h-9 xs:h-10">
                <Plus className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4" />
                <span className="text-sm xs:text-base">Add Team Member</span>
              </Button>
            </Link>
          )}
        </div>

        {/* Error Alert - Mobile Responsive */}
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 xs:h-5 xs:w-5 text-red-600" />
          <AlertDescription className="text-red-800 text-sm xs:text-base leading-snug xs:leading-normal">
            {error || "Failed to load team members. Please try again."}
          </AlertDescription>
        </Alert>

        {/* Retry Button - Mobile Responsive */}
        <div className="flex justify-center pt-2 xs:pt-3">
          <Button
            onClick={refreshTeamMembers}
            variant="outline"
            className="h-9 xs:h-10 w-full xs:w-auto"
          >
            <RefreshCw className="h-3.5 w-3.5 xs:h-4 xs:w-4 mr-1.5 xs:mr-2" />
            <span className="text-sm xs:text-base">Try Again</span>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl">
        <div className="space-y-4 xs:space-y-5 sm:space-y-6">
          {/* Header - Mobile Responsive */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Team</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Manage your construction crew and track their progress
              </p>
            </div>

            {withPermission('team', 'add',
              <Link href="/dashboard/team/new" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700">
                  <Plus className="mr-2 h-4 w-4" />
                  <span className="text-sm xs:text-base">Add Team Member</span>
                </Button>
              </Link>
            )}
          </div>

          {/* Search and Filters - Mobile Responsive */}
          <div className="flex flex-col space-y-2 xs:space-y-3 sm:space-y-0 sm:flex-row sm:gap-3 md:gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 xs:h-4 xs:w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search team members..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9 xs:pl-10 h-9 xs:h-10 sm:h-11 text-sm xs:text-base"
              />
            </div>

            {/* Filters Row - Mobile Responsive */}
            <div className="grid grid-cols-2 gap-2 xs:gap-3 sm:grid-cols-none sm:flex">
              {/* Trade Filter */}
              <Select value={selectedTrade} onValueChange={handleTradeFilter}>
                <SelectTrigger className="w-full sm:w-[160px] md:w-[180px] h-9 xs:h-10 sm:h-11 text-xs xs:text-sm">
                  <SelectValue placeholder="Filter by trade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Trades</SelectItem>
                  {TRADE_SPECIALTIES.map((trade) => (
                    <SelectItem key={trade.value} value={trade.value}>
                      {trade.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={selectedStatus} onValueChange={handleStatusFilter}>
                <SelectTrigger className="w-full sm:w-[160px] md:w-[180px] h-9 xs:h-10 sm:h-11 text-xs xs:text-sm">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View Mode Toggle - Mobile Responsive */}
            <div className="flex border rounded-md self-end sm:self-auto">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none h-9 xs:h-10 px-3 xs:px-4"
              >
                <Grid3X3 className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none h-9 xs:h-10 px-3 xs:px-4"
              >
                <List className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
              </Button>
            </div>
          </div>

          {/* Team Count - Mobile Responsive */}
          {teamMembers.length > 0 && (
            <div className="flex xs:flex-col flex-row xs:items-center justify-between gap-1.5 xs:gap-2 text-xs xs:text-sm text-gray-600">
              <div className="flex items-center gap-1.5 xs:gap-2">
                <span className="leading-snug">
                  Showing {filteredTeamMembers.length} of {teamMembers.length} team members
                </span>
              </div>
              {pagination && (
                <span className="leading-snug">
                  Page {Math.floor(pagination.offset / pagination.limit) + 1} of {Math.ceil(pagination.total / pagination.limit)}
                </span>
              )}
            </div>
          )}

          {/* Empty State - Mobile Responsive */}
          {isEmpty && !hasError && (
            <div className="text-center py-8 xs:py-10 sm:py-12 px-4">
              <Users className="mx-auto h-10 w-10 xs:h-12 xs:w-12 text-gray-400 mb-3 xs:mb-4" />
              <h3 className="text-base xs:text-lg font-medium text-gray-900 mb-1.5 xs:mb-2">
                No team members found
              </h3>
              <p className="text-sm xs:text-base text-gray-600 mb-4 xs:mb-6 max-w-md mx-auto leading-snug xs:leading-normal">
                {searchTerm || selectedTrade !== "all" || selectedStatus !== "all"
                  ? "Try adjusting your search criteria or filters."
                  : "Get started by adding your first team member."}
              </p>
              {!searchTerm && selectedTrade === "all" && selectedStatus === "all" && withPermission('team', 'add',
                <Link href="/dashboard/team/new" className="inline-block">
                  <Button className="bg-orange-600 hover:bg-orange-700 h-9 xs:h-10">
                    <UserPlus className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4" />
                    <span className="text-sm xs:text-base">Add Your First Team Member</span>
                  </Button>
                </Link>
              )}
            </div>
          )}

          {/* Team Members Grid - Mobile Responsive */}
          {filteredTeamMembers.length > 0 && viewMode === 'grid' && (
            <div className="grid gap-3 xs:gap-4 sm:gap-5 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTeamMembers.map((member) => (
                <Card key={member.id} className="hover:shadow-lg transition-shadow group">
                  <CardHeader className="p-4 xs:p-5 sm:p-6">
                    <div className="flex items-start gap-3 xs:gap-4">
                      <Avatar className="h-10 w-10 xs:h-12 xs:w-12 shrink-0">
                        <AvatarImage src={`/placeholder.svg?height=48&width=48`} />
                        <AvatarFallback className="bg-orange-100 text-orange-700 font-semibold text-sm xs:text-base">
                          {getInitials(member.firstName, member.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base xs:text-lg truncate leading-tight">
                          {member.firstName} {member.lastName}
                        </CardTitle>
                        <CardDescription className="truncate text-xs xs:text-sm mt-0.5">
                          {member.jobTitle || member.role}
                        </CardDescription>
                        <Badge
                          className={`${getTeamMemberStatusConfig(member.isActive, member.assignmentStatus).className} mt-1.5 xs:mt-2 text-xs`}
                          variant="secondary"
                        >
                          {getTeamMemberStatusConfig(member.isActive, member.assignmentStatus).label}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 xs:space-y-4 p-4 xs:p-5 sm:p-6 pt-0">
                    {/* Contact Info */}
                    <div className="space-y-1.5 xs:space-y-2 text-xs xs:text-sm">
                      <div className="flex items-center gap-1.5 xs:gap-2">
                        <Mail className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-600 truncate leading-snug">{member.email}</span>
                      </div>
                      {member.phone && (
                        <div className="flex items-center gap-1.5 xs:gap-2">
                          <Phone className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-600 leading-snug">{formatPhone(member.phone)}</span>
                        </div>
                      )}
                      {member.currentProject && (
                        <div className="flex items-center gap-1.5 xs:gap-2">
                          <MapPin className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-600 truncate leading-snug">
                            {member.currentProject.name}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 xs:gap-2">
                        <Clock className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-600 leading-snug">
                          {member.activeProjectCount || 0} active project{member.activeProjectCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Trade and Role */}
                    <div>
                      <p className="text-xs xs:text-sm font-medium leading-snug">
                        Trade: {getTradeLabel(member.tradeSpecialty)}
                      </p>
                    </div>

                    {/* Action Buttons - Mobile Responsive */}
                    <div className="flex gap-1.5 xs:gap-2">
                      <Link href={`/dashboard/team/${member.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full h-8 xs:h-9 text-xs xs:text-sm">
                          <Eye className="h-3 w-3 xs:h-3.5 xs:w-3.5 mr-1" />
                          <span className="hidden xs:inline">View Profile</span>
                          <span className="xs:hidden">View</span>
                        </Button>
                      </Link>
                      {withPermission('team', 'edit',
                        <Link href={`/dashboard/team/${member.id}/edit`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full h-8 xs:h-9 text-xs xs:text-sm">
                            <Edit className="h-3 w-3 xs:h-3.5 xs:w-3.5 mr-1" />
                            <span className="hidden xs:inline">Edit</span>
                            <span className="xs:hidden">Edit</span>
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Team Members List View - Mobile Responsive */}
          {filteredTeamMembers.length > 0 && viewMode === 'list' && (
            <div className="space-y-2 xs:space-y-3">
              {filteredTeamMembers.map((member) => (
                <Card key={member.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-3 xs:p-4">
                    <div className="flex items-center justify-between gap-3 xs:gap-4">
                      <div className="flex items-center gap-2.5 xs:gap-3 sm:gap-4 flex-1 min-w-0">
                        <Avatar className="h-9 w-9 xs:h-10 xs:w-10 shrink-0">
                          <AvatarImage src={`/placeholder.svg?height=40&width=40`} />
                          <AvatarFallback className="bg-orange-100 text-orange-700 font-semibold text-xs xs:text-sm">
                            {getInitials(member.firstName, member.lastName)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 xs:gap-3 mb-0.5 xs:mb-1 flex-wrap">
                            <h3 className="font-semibold text-sm xs:text-base text-gray-900 truncate leading-tight">
                              {member.firstName} {member.lastName}
                            </h3>
                            <Badge
                              className={`${getTeamMemberStatusConfig(member.isActive, member.assignmentStatus).className} text-xs shrink-0`}
                              variant="secondary"
                            >
                              {getTeamMemberStatusConfig(member.isActive, member.assignmentStatus).label}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 xs:gap-1.5 sm:gap-2 text-xs xs:text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3 xs:h-3.5 xs:w-3.5 shrink-0" />
                              <span className="truncate leading-snug">{member.email}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Trade:</span>
                              <span className="truncate leading-snug">{getTradeLabel(member.tradeSpecialty)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Projects:</span>
                              <span className="leading-snug">{member.activeProjectCount || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 shrink-0">
                        <Link href={`/dashboard/team/${member.id}`}>
                          <Button variant="outline" size="sm" className="h-8 w-8 xs:h-9 xs:w-9 p-0">
                            <Eye className="h-3 w-3 xs:h-3.5 xs:w-3.5" />
                          </Button>
                        </Link>
                        {withPermission('team', 'edit',
                          <Link href={`/dashboard/team/${member.id}/edit`}>
                            <Button variant="outline" size="sm" className="h-8 w-8 xs:h-9 xs:w-9 p-0">
                              <Edit className="h-3 w-3 xs:h-3.5 xs:w-3.5" />
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
      </div>
    </div>
  )
}