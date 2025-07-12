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

  // ==============================================
  // UTILITY FUNCTIONS
  // ==============================================
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "planned":
        return "bg-blue-100 text-blue-800"
      case "in_progress":
        return "bg-orange-100 text-orange-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "delayed":
        return "bg-red-100 text-red-800"
      case "cancelled":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
      case "critical":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatStatusLabel = (status: string) => {
    switch (status) {
      case "planned":
        return "Planned"
      case "in_progress":
        return "In Progress"
      case "completed":
        return "Completed"
      case "delayed":
        return "Delayed"
      case "cancelled":
        return "Cancelled"
      default:
        return status
    }
  }

  const formatPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return "High"
      case "critical":
        return "Critical"
      case "medium":
        return "Medium"
      case "low":
        return "Low"
      default:
        return priority
    }
  }

  const formatTime = (time: string) => {
    if (!time) return ""
    return new Date(`1970-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <div className="grid grid-cols-3 gap-4">
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Schedule</h1>
            <p className="text-gray-600">Manage crew schedules and project timelines</p>
          </div>
        </div>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || "Failed to load schedule data. Please try again."}
          </AlertDescription>
        </Alert>
        
        <div className="flex justify-center">
          <Button onClick={() => refreshScheduleProjects()} variant="outline">
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Schedule</h1>
          <p className="text-gray-600">Manage crew schedules and project timelines</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/schedule/new">
              <Plus className="mr-2 h-4 w-4" />
              New Schedule
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
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
            
            <Select 
              value={filtersForm.projectId || "all"} 
              onValueChange={(value) => handleFilterChange('projectId', value === "all" ? "" : value)}
            >
              <SelectTrigger className="w-[180px]">
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
              <SelectTrigger className="w-[140px]">
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
              <SelectTrigger className="w-[140px]">
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

            <Tabs value={viewMode} onValueChange={handleViewModeChange}>
              <TabsList>
                <TabsTrigger value="calendar">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Calendar
                </TabsTrigger>
                <TabsTrigger value="list">
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  List
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={viewMode} onValueChange={handleViewModeChange}>
        
        {/* Calendar View */}
        <TabsContent value="calendar" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-4">
            
            {/* Calendar Sidebar */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Calendar
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={goToToday}>
                    Today
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Month Navigation */}
                <div className="flex items-center justify-between">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => navigateMonth("prev")}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h3 className="font-medium">
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
                    <div key={day} className="p-2 text-center font-medium text-gray-500">
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
                          p-2 text-sm relative hover:bg-gray-100 rounded transition-colors
                          ${!day.isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}
                          ${isSelected ? 'bg-orange-100 text-orange-900 font-medium' : ''}
                          ${isToday ? 'bg-blue-100 text-blue-900 font-medium' : ''}
                        `}
                      >
                        {day.date}
                        {tasksForDay.length > 0 && (
                          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
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
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {new Date(selectedDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </h2>
                <Badge variant="outline">
                  {filteredScheduleForDate.length} tasks scheduled
                </Badge>
              </div>

              {filteredScheduleForDate.length > 0 ? (
                filteredScheduleForDate.map((item) => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{item.title}</h3>
                            <Badge className={getStatusColor(item.status)}>
                              {formatStatusLabel(item.status)}
                            </Badge>
                            <Badge className={getPriorityColor(item.priority)}>
                              {formatPriorityLabel(item.priority)}
                            </Badge>
                          </div>

                          {item.project && (
                            <div className="flex items-center gap-2 mb-3">
                              <Building2 className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">{item.project.name}</span>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            {(item.startTime || item.endTime) && (
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span>
                                  {item.startTime && formatTime(item.startTime)}
                                  {item.startTime && item.endTime && " - "}
                                  {item.endTime && formatTime(item.endTime)}
                                </span>
                              </div>
                            )}
                            
                            {item.location && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-gray-400" />
                                <span>{item.location}</span>
                              </div>
                            )}
                            
                            {item.assignedMembers && item.assignedMembers.length > 0 && (
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-gray-400" />
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

                        <div className="flex gap-2 ml-4">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/schedule/${item.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/schedule/${item.id}/edit`}>
                              <Edit2 className="h-4 w-4" />
                            </Link>
                          </Button>
                          {item.status === "planned" && (
                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
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
                  <CardContent className="p-12 text-center">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks scheduled</h3>
                    <p className="text-gray-600 mb-4">No tasks are scheduled for this date.</p>
                    <Button className="bg-orange-600 hover:bg-orange-700" asChild>
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
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{item.title}</h3>
                          <Badge className={getStatusColor(item.status)}>
                            {formatStatusLabel(item.status)}
                          </Badge>
                          <Badge className={getPriorityColor(item.priority)}>
                            {formatPriorityLabel(item.priority)}
                          </Badge>
                        </div>

                        {item.project && (
                          <div className="flex items-center gap-2 mb-3">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">{item.project.name}</span>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>
                              {new Date(item.startDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          
                          {(item.startTime || item.endTime) && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span>
                                {item.startTime && formatTime(item.startTime)}
                                {item.startTime && item.endTime && " - "}
                                {item.endTime && formatTime(item.endTime)}
                              </span>
                            </div>
                          )}
                          
                          {item.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <span>{item.location}</span>
                            </div>
                          )}
                          {item.assignedMembers && (
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-400" />
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

                      <div className="flex gap-2 ml-4">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/schedule/${item.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/schedule/${item.id}/edit`}>
                            <Edit2 className="h-4 w-4" />
                          </Link>
                        </Button>
                        {item.status === "planned" && (
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
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
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
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
              <CardContent className="p-12 text-center">
                <CalendarDays className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No schedules found</h3>
                <p className="text-gray-600 mb-4">
                  {Object.values(filters).some(v => v && v !== '') 
                    ? "No schedules match your current filters. Try adjusting your search criteria." 
                    : "Get started by creating your first schedule."}
                </p>
                <div className="flex gap-2 justify-center">
                  <Button className="bg-orange-600 hover:bg-orange-700" asChild>
                    <Link href="/dashboard/schedule/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Schedule
                    </Link>
                  </Button>
                  {Object.values(filters).some(v => v && v !== '') && (
                    <Button variant="outline" onClick={clearFilters}>
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
  )
}