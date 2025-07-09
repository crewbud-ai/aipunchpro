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
    searchByName,
    filterByTrade,
    filterByStatus,
    refreshTeamMembers,
  } = useTeamMembers()

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value)
    searchByName(value)
  }

  // Handle trade filter
  const handleTradeFilter = (value: string) => {
    setSelectedTrade(value)
    if (value === "all") {
      filterByTrade(undefined)
    } else {
      // Type assertion since we know the value comes from TRADE_SPECIALTIES
      filterByTrade(value as 'electrical' | 'plumbing' | 'framing' | 'drywall' | 'roofing' | 'concrete' | 'hvac' | 'general' | 'management' | 'safety')
    }
  }

  // Handle status filter
  const handleStatusFilter = (value: string) => {
    setSelectedStatus(value)
    filterByStatus(value === "all" ? undefined : (value as 'active' | 'inactive'))
  }

  // Helper functions
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const getStatusColor = (isActive: boolean, assignmentStatus?: string) => {
    if (!isActive) {
      return "bg-gray-100 text-gray-800"
    }
    
    switch (assignmentStatus) {
      case "assigned":
        return "bg-green-100 text-green-800"
      case "not_assigned":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-blue-100 text-blue-800"
    }
  }

  const getStatusText = (isActive: boolean, assignmentStatus?: string) => {
    if (!isActive) return "Inactive"
    
    switch (assignmentStatus) {
      case "assigned":
        return "Active"
      case "not_assigned":
        return "Available"
      default:
        return "Active"
    }
  }

  const getTradeLabel = (tradeSpecialty?: string) => {
    if (!tradeSpecialty) return "General"
    const trade = TRADE_SPECIALTIES.find(t => t.value === tradeSpecialty)
    return trade?.label || tradeSpecialty
  }

  const formatPhone = (phone?: string) => {
    if (!phone) return "No phone"
    // Format +1XXXXXXXXXX to (XXX) XXX-XXXX
    if (phone.startsWith('+1') && phone.length === 12) {
      const number = phone.slice(2)
      return `(${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`
    }
    return phone
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
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-10 w-48" />
        </div>

        {/* Filters Skeleton */}
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-48" />
        </div>

        {/* Grid Skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Team</h1>
            <p className="text-gray-600">Manage your construction crew and track their progress</p>
          </div>
          {withPermission('team', 'add',
            <Link href="/dashboard/team/new">
              <Button className="bg-orange-600 hover:bg-orange-700">
                <Plus className="mr-2 h-4 w-4" />
                Add Team Member
              </Button>
            </Link>
          )}
        </div>

        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error || "Failed to load team members. Please try again."}
          </AlertDescription>
        </Alert>

        <div className="flex justify-center">
          <Button onClick={refreshTeamMembers} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team</h1>
          <p className="text-gray-600">Manage your construction crew and track their progress</p>
        </div>
        {withPermission('team', 'add',
          <Link href="/dashboard/team/new">
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Team Member
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
            placeholder="Search team members..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Trade Filter */}
        <Select value={selectedTrade} onValueChange={handleTradeFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
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
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
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

      {/* Team Count */}
      {teamMembers.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>
              Showing {filteredTeamMembers.length} of {teamMembers.length} team members
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
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No team members found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || selectedTrade !== "all" || selectedStatus !== "all"
              ? "Try adjusting your search criteria or filters."
              : "Get started by adding your first team member."}
          </p>
          {!searchTerm && selectedTrade === "all" && selectedStatus === "all" && withPermission('team', 'add',
            <Link href="/dashboard/team/new">
              <Button className="bg-orange-600 hover:bg-orange-700">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Your First Team Member
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Team Members Grid */}
      {filteredTeamMembers.length > 0 && viewMode === 'grid' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTeamMembers.map((member) => (
            <Card key={member.id} className="hover:shadow-lg transition-shadow group">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={`/placeholder.svg?height=48&width=48`} />
                    <AvatarFallback className="bg-orange-100 text-orange-700 font-semibold">
                      {getInitials(member.firstName, member.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">
                      {member.firstName} {member.lastName}
                    </CardTitle>
                    <CardDescription className="truncate">
                      {member.jobTitle || member.role}
                    </CardDescription>
                    <Badge 
                      className={getStatusColor(member.isActive, member.assignmentStatus)} 
                      variant="secondary"
                    >
                      {getStatusText(member.isActive, member.assignmentStatus)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Contact Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-600 truncate">{member.email}</span>
                  </div>
                  {member.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-600">{formatPhone(member.phone)}</span>
                    </div>
                  )}
                  {member.currentProject && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-600 truncate">
                        {member.currentProject.name}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-600">
                      {member.activeProjectCount || 0} active project{member.activeProjectCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Trade and Role */}
                <div>
                  <p className="text-sm font-medium">
                    Trade: {getTradeLabel(member.tradeSpecialty)}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Link href={`/dashboard/team/${member.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="h-3 w-3 mr-1" />
                      View Profile
                    </Button>
                  </Link>
                  {withPermission('team', 'edit',
                    <Link href={`/dashboard/team/${member.id}/edit`} className="flex-1">
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

      {/* Team Members List View */}
      {filteredTeamMembers.length > 0 && viewMode === 'list' && (
        <div className="space-y-3">
          {filteredTeamMembers.map((member) => (
            <Card key={member.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={`/placeholder.svg?height=40&width=40`} />
                      <AvatarFallback className="bg-orange-100 text-orange-700 font-semibold text-sm">
                        {getInitials(member.firstName, member.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {member.firstName} {member.lastName}
                        </h3>
                        <Badge 
                          className={getStatusColor(member.isActive, member.assignmentStatus)} 
                          variant="secondary"
                        >
                          {getStatusText(member.isActive, member.assignmentStatus)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{member.email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Trade:</span>
                          <span>{getTradeLabel(member.tradeSpecialty)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Projects:</span>
                          <span>{member.activeProjectCount || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Link href={`/dashboard/team/${member.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </Link>
                    {withPermission('team', 'edit',
                      <Link href={`/dashboard/team/${member.id}/edit`}>
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