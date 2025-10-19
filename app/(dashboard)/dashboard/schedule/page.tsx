"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  Plus,
  Search,
  Filter,
  LayoutGrid,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  Eye,
  Edit2,
  Play,
  CheckCircle,
  Building2
} from "lucide-react"
import Link from "next/link"

// Import real hooks following the existing pattern
import { useScheduleProjects } from "@/hooks/schedule-projects"
import { useProjects } from "@/hooks/projects"
import { useTeamMembers } from "@/hooks/team-members"
import { formatTime12Hour, getPriorityConfig, getStatusConfig } from "@/utils/format-functions"

export default function SchedulePage() {
  // ==============================================
  // HOOKS FOR REAL DATA
  // ==============================================

  // Schedule projects hook (following projects pattern)
  const {
    scheduleProjects,
    isLoading,
    isError,
    error,
    isEmpty,
    hasScheduleProjects,
    totalPages,
    currentPage,
    hasNextPage,
    hasPrevPage,
    filters,
    filtersForm,
    loadScheduleProjects,
    refreshScheduleProjects,
    updateFilters,
    updateFiltersForm,
    applyFiltersForm,
    clearFilters,
    setPage,
    searchByTitle,
    filterByProject,
    filterByStatus,
    filterByPriority,
    filterByTrade,
    filterByDateRange,
    sortScheduleProjects,
  } = useScheduleProjects()

  // Projects for filtering
  const { projects } = useProjects()

  // Team members for display
  const { teamMembers } = useTeamMembers()

  // ==============================================
  // LOCAL STATE
  // ==============================================

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [viewMode, setViewMode] = useState<"list" | "calendar">("calendar")

  // ==============================================
  // COMPUTED VALUES
  // ==============================================

  // Calendar utilities
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days = []

    // Previous month days
    const prevMonth = new Date(currentYear, currentMonth - 1, 0)
    const prevMonthDays = prevMonth.getDate()

    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push({
        date: prevMonthDays - i,
        isCurrentMonth: false,
        dateString: new Date(currentYear, currentMonth - 1, prevMonthDays - i).toISOString().split('T')[0]
      })
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: day,
        isCurrentMonth: true,
        dateString: new Date(currentYear, currentMonth, day).toISOString().split('T')[0]
      })
    }

    // Next month days to fill the grid
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: day,
        isCurrentMonth: false,
        dateString: new Date(currentYear, currentMonth + 1, day).toISOString().split('T')[0]
      })
    }

    return days
  }, [currentMonth, currentYear, daysInMonth, firstDayOfMonth])

  // Get tasks for specific date
  const getTasksForDate = (dateString: string) => {
    return scheduleProjects.filter(task => task.startDate === dateString)
  }

  // Filter tasks for selected date in list view
  const filteredScheduleForDate = useMemo(() => {
    return scheduleProjects.filter(item => item.startDate === selectedDate)
  }, [scheduleProjects, selectedDate])

  // Active projects for filter dropdown
  const activeProjects = useMemo(() => {
    return projects.filter(project =>
      project.status === 'in_progress' ||
      project.status === 'not_started' ||
      project.status === 'on_track'
    )
  }, [projects])

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today.toISOString().split('T')[0])
  }

  // ==============================================
  // EVENT HANDLERS
  // ==============================================

  const handleSearch = (searchTerm: string) => {
    updateFiltersForm('search', searchTerm)
    // Apply search with a small delay for better UX
    setTimeout(() => {
      applyFiltersForm()
    }, 300)
  }

  const handleFilterChange = (key: string, value: string) => {
    updateFiltersForm(key as any, value)
    applyFiltersForm()
  }

  const handleViewModeChange = (mode: string) => {
    setViewMode(mode as "list" | "calendar")
  }

  const handleDateSelect = (dateString: string) => {
    setSelectedDate(dateString)
    if (viewMode === "calendar") {
      setViewMode("list")
    }
  }

  // ==============================================
  // EFFECTS
  // ==============================================

  // Load initial data
  useEffect(() => {
    loadScheduleProjects()
  }, [])

  // ==============================================
  // LOADING STATES
  // ==============================================

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="w-full sm:w-auto">
            <Skeleton className="h-8 sm:h-9 w-36 sm:w-48 mb-2" />
            <Skeleton className="h-4 sm:h-5 w-full sm:w-96" />
          </div>
          <Skeleton className="h-10 w-full sm:w-32" />
        </div>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col space-y-3 sm:space-y-4 md:flex-row md:space-y-0 md:space-x-4">
              <Skeleton className="h-10 flex-1" />
              <div className="grid grid-cols-3 gap-2 md:gap-0 md:flex md:space-x-4">
                <Skeleton className="h-10 w-full md:w-32" />
                <Skeleton className="h-10 w-full md:w-32" />
                <Skeleton className="h-10 w-full md:w-32" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 sm:p-6">
                <Skeleton className="h-5 sm:h-6 w-3/4 mb-3 sm:mb-4" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // ==============================================
  // ERROR STATES
  // ==============================================

  if (isError) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Schedule</h1>
            <p className="text-sm sm:text-base text-gray-600">Manage crew schedules and project timelines</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm sm:text-base">
            {error || "Failed to load schedule data. Please try again."}
          </AlertDescription>
        </Alert>

        <div className="flex justify-center">
          <Button onClick={() => refreshScheduleProjects()} variant="outline" className="w-full sm:w-auto">
            <Loader2 className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Schedule</h1>
              <p className="text-sm sm:text-base text-gray-600">Manage crew schedules and project timelines</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none" asChild>
                <Link href="/dashboard/schedule/new">
                  <Plus className="mr-2 h-4 w-4" />
                  New Schedule
                </Link>
              </Button>
            </div>
          </div>

          {/* Filters Bar */}
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col space-y-3 sm:space-y-4 md:flex-row md:space-y-0 md:space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search schedules..."
                      value={filtersForm.search}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-none md:flex gap-2 md:gap-4">
                  <Select
                    value={filtersForm.projectId || "all"}
                    onValueChange={(value) => handleFilterChange('projectId', value === "all" ? "" : value)}
                  >
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="All Projects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Projects</SelectItem>
                      {activeProjects.map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filtersForm.status || "all"}
                    onValueChange={(value) => handleFilterChange('status', value === "all" ? "" : value)}
                  >
                    <SelectTrigger className="w-full md:w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="delayed">Delayed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={filtersForm.priority || "all"}
                    onValueChange={(value) => handleFilterChange('priority', value === "all" ? "" : value)}
                  >
                    <SelectTrigger className="w-full md:w-[140px]">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="col-span-2 sm:col-span-3 md:col-span-1">
                    <Tabs value={viewMode} onValueChange={handleViewModeChange}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="calendar" className="text-xs sm:text-sm">
                          <CalendarDays className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Calendar</span>
                        </TabsTrigger>
                        <TabsTrigger value="list" className="text-xs sm:text-sm">
                          <LayoutGrid className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                          <span className="hidden sm:inline">List</span>
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <Tabs value={viewMode} onValueChange={handleViewModeChange}>

            {/* Calendar View */}
            <TabsContent value="calendar" className="space-y-4 sm:space-y-6">
              <div className="grid gap-4 sm:gap-6 lg:grid-cols-4">

                {/* Calendar Sidebar */}
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                        Calendar
                      </CardTitle>
                      <Button variant="ghost" size="sm" onClick={goToToday}>
                        Today
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 p-4 sm:p-6 pt-0">

                    {/* Month Navigation */}
                    <div className="flex items-center justify-between">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigateMonth("prev")}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <h3 className="font-medium text-sm sm:text-base">
                        {currentDate.toLocaleDateString('en-US', {
                          month: 'long',
                          year: 'numeric'
                        })}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigateMonth("next")}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1 text-xs">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                        <div key={day} className="p-1 sm:p-2 text-center font-medium text-gray-500">
                          {day}
                        </div>
                      ))}

                      {calendarDays.map((day, index) => {
                        const tasksForDay = getTasksForDate(day.dateString)
                        const isSelected = selectedDate === day.dateString
                        const isToday = day.dateString === new Date().toISOString().split('T')[0]

                        return (
                          <button
                            key={index}
                            onClick={() => handleDateSelect(day.dateString)}
                            className={`
                          p-1 sm:p-2 text-xs sm:text-sm relative hover:bg-gray-100 rounded transition-colors
                          ${!day.isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}
                          ${isSelected ? 'bg-orange-100 text-orange-900 font-medium' : ''}
                          ${isToday ? 'bg-blue-100 text-blue-900 font-medium' : ''}
                        `}
                          >
                            {day.date}
                            {tasksForDay.length > 0 && (
                              <div className="absolute bottom-0.5 sm:bottom-1 left-1/2 transform -translate-x-1/2">
                                <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Schedule Items for Selected Date */}
                <div className="lg:col-span-3 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h2 className="text-lg sm:text-xl font-semibold">
                      {new Date(selectedDate).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </h2>
                    <Badge variant="outline" className="self-start sm:self-auto">
                      {filteredScheduleForDate.length} tasks scheduled
                    </Badge>
                  </div>

                  {filteredScheduleForDate.length > 0 ? (
                    filteredScheduleForDate.map((item) => (
                      <Card key={item.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <h3 className="text-base sm:text-lg font-semibold break-words">{item.title}</h3>
                                <Badge className={getStatusConfig(item.status).color}>
                                  {getStatusConfig(item.status).label}
                                </Badge>
                                <Badge className={`${getPriorityConfig(item.priority).color} ${getPriorityConfig(item.priority).bgColor}`}>
                                  {getPriorityConfig(item.priority).label}
                                </Badge>
                              </div>

                              {item.project && (
                                <div className="flex items-center gap-2 mb-3">
                                  <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                  <span className="text-sm sm:text-base text-gray-600 truncate">{item.project.name}</span>
                                </div>
                              )}

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-sm">
                                {(item.startTime || item.endTime) && (
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                    <span className="truncate">
                                      {item.startTime && formatTime12Hour(item.startTime)}
                                      {item.startTime && item.endTime && " - "}
                                      {item.endTime && formatTime12Hour(item.endTime)}
                                    </span>
                                  </div>
                                )}

                                {item.location && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                    <span className="truncate">{item.location}</span>
                                  </div>
                                )}

                                {item.assignedMembers && item.assignedMembers.length > 0 && (
                                  <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                    <span>{item.assignedMembers.length} crew members</span>
                                  </div>
                                )}
                              </div>

                              {item.assignedMembers && item.assignedMembers.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-sm font-medium mb-1">Assigned Crew:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {item.assignedMembers.map((member, index) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {member.user.firstName} {member.user.lastName}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex sm:flex-col gap-2 sm:ml-4">
                              <Button variant="outline" size="sm" className="flex-1 sm:flex-none" asChild>
                                <Link href={`/dashboard/schedule/${item.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button variant="outline" size="sm" className="flex-1 sm:flex-none" asChild>
                                <Link href={`/dashboard/schedule/${item.id}/edit`}>
                                  <Edit2 className="h-4 w-4" />
                                </Link>
                              </Button>
                              {item.status === "planned" && (
                                <Button size="sm" className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700">
                                  <Play className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="p-8 sm:p-12 text-center">
                        <Calendar className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No tasks scheduled</h3>
                        <p className="text-sm sm:text-base text-gray-600 mb-4">No tasks are scheduled for this date.</p>
                        <Button className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto" asChild>
                          <Link href="/dashboard/schedule/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Schedule Task
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* List View */}
            <TabsContent value="list" className="space-y-4">
              {hasScheduleProjects ? (
                <>
                  {scheduleProjects.map((item) => (
                    <Card key={item.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <h3 className="text-base sm:text-lg font-semibold break-words">{item.title}</h3>
                              <Badge className={getStatusConfig(item.status).color}>
                                {getStatusConfig(item.status).label}
                              </Badge>
                              <Badge className={`${getPriorityConfig(item.priority).color} ${getPriorityConfig(item.priority).bgColor}`}>
                                {getPriorityConfig(item.priority).label}
                              </Badge>
                            </div>

                            {item.project && (
                              <div className="flex items-center gap-2 mb-3">
                                <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                <span className="text-sm sm:text-base text-gray-600 truncate">{item.project.name}</span>
                              </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                <span>
                                  {new Date(item.startDate).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                              </div>

                              {(item.startTime || item.endTime) && (
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                  <span className="truncate">
                                    {item.startTime && formatTime12Hour(item.startTime)}
                                    {item.startTime && item.endTime && " - "}
                                    {item.endTime && formatTime12Hour(item.endTime)}
                                  </span>
                                </div>
                              )}

                              {item.location && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                  <span className="truncate">{item.location}</span>
                                </div>
                              )}
                              {item.assignedMembers && (
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                  <span>{item.assignedMembers.length} crew members</span>
                                </div>
                              )}
                            </div>

                            {item.assignedMembers && item.assignedMembers.length > 0 && (
                              <div className="mt-3">
                                <p className="text-sm font-medium mb-1">Assigned Crew:</p>
                                <div className="flex flex-wrap gap-1">
                                  {item.assignedMembers.map((member, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {member.user.firstName} {member.user.lastName}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex sm:flex-col gap-2 sm:ml-4">
                            <Button variant="outline" size="sm" className="flex-1 sm:flex-none" asChild>
                              <Link href={`/dashboard/schedule/${item.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1 sm:flex-none" asChild>
                              <Link href={`/dashboard/schedule/${item.id}/edit`}>
                                <Edit2 className="h-4 w-4" />
                              </Link>
                            </Button>
                            {item.status === "planned" && (
                              <Button size="sm" className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700">
                                <Play className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <p className="text-sm text-gray-700 text-center sm:text-left">
                        Page {currentPage} of {totalPages}
                      </p>
                      <div className="flex gap-2 justify-center sm:justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(currentPage - 1)}
                          disabled={!hasPrevPage}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(currentPage + 1)}
                          disabled={!hasNextPage}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : isEmpty ? (
                <Card>
                  <CardContent className="p-8 sm:p-12 text-center">
                    <CalendarDays className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No schedules found</h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-4">
                      {Object.values(filters).some(v => v && v !== '')
                        ? "No schedules match your current filters. Try adjusting your search criteria."
                        : "Get started by creating your first schedule."}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <Button className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto" asChild>
                        <Link href="/dashboard/schedule/new">
                          <Plus className="mr-2 h-4 w-4" />
                          Create Schedule
                        </Link>
                      </Button>
                      {Object.values(filters).some(v => v && v !== '') && (
                        <Button variant="outline" className="w-full sm:w-auto" onClick={clearFilters}>
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}