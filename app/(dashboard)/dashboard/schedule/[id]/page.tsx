"use client"

import { useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  MapPin,
  Building2,
  AlertCircle,
  Edit2,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  User,
  Phone,
  Mail,
  Briefcase,
  Target,
  FileText,
  Activity,
  TrendingUp,
  Loader2
} from "lucide-react"

// Import real hooks following the existing pattern
import { useScheduleProject } from "@/hooks/schedule-projects"

export default function ScheduleProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const scheduleId = params.id as string

  // ==============================================
  // HOOKS FOR REAL DATA
  // ==============================================
  
  const {
    scheduleProject,
    dependentSchedules,
    isLoading,
    isError,
    error,
    isNotFound,
    hasScheduleProject,
    hasDependentSchedules,
    loadScheduleProject,
    refreshScheduleProject,
    updateStatus,
  } = useScheduleProject(scheduleId)

  // ==============================================
  // LOCAL STATE
  // ==============================================
  
  const [activeTab, setActiveTab] = useState("overview")
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  // ==============================================
  // COMPUTED VALUES
  // ==============================================
  
  const statusActions = useMemo(() => {
    if (!scheduleProject) return []
    
    const actions = []
    
    switch (scheduleProject.status) {
      case 'planned':
        actions.push({
          label: 'Start Task',
          icon: Play,
          action: () => handleStatusUpdate('in_progress'),
          variant: 'default',
          className: 'bg-green-600 hover:bg-green-700'
        })
        break
      case 'in_progress':
        actions.push({
          label: 'Complete Task',
          icon: CheckCircle,
          action: () => handleStatusUpdate('completed'),
          variant: 'default',
          className: 'bg-green-600 hover:bg-green-700'
        })
        actions.push({
          label: 'Mark as Delayed',
          icon: Pause,
          action: () => handleStatusUpdate('delayed'),
          variant: 'outline'
        })
        break
      case 'delayed':
        actions.push({
          label: 'Resume Task',
          icon: Play,
          action: () => handleStatusUpdate('in_progress'),
          variant: 'default',
          className: 'bg-orange-600 hover:bg-orange-700'
        })
        actions.push({
          label: 'Complete Task',
          icon: CheckCircle,
          action: () => handleStatusUpdate('completed'),
          variant: 'default',
          className: 'bg-green-600 hover:bg-green-700'
        })
        break
      case 'completed':
        actions.push({
          label: 'Reopen Task',
          icon: Play,
          action: () => handleStatusUpdate('in_progress'),
          variant: 'outline'
        })
        break
    }
    
    return actions
  }, [scheduleProject])

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  // ==============================================
  // EVENT HANDLERS
  // ==============================================
  
  const handleStatusUpdate = async (newStatus: string) => {
    if (!scheduleProject) return
    
    try {
      setIsUpdatingStatus(true)
      await updateStatus({
        id: scheduleProject.id,
        status: newStatus as any,
        progressPercentage: newStatus === 'completed' ? 100 : undefined
      })
      await refreshScheduleProject()
    } catch (error) {
      console.error('Failed to update status:', error)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // ==============================================
  // LOADING STATES
  // ==============================================
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="flex-1">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // ==============================================
  // ERROR STATES
  // ==============================================
  
  if (isError || isNotFound) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/schedule">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Schedule Not Found</h1>
            <p className="text-gray-600">The schedule you're looking for could not be found.</p>
          </div>
        </div>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || "This schedule project doesn't exist or you don't have permission to view it."}
          </AlertDescription>
        </Alert>
        
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/dashboard/schedule">
              Back to Schedule
            </Link>
          </Button>
          <Button variant="outline" onClick={() => loadScheduleProject(scheduleId)}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!hasScheduleProject || !scheduleProject) {
    return null
  }

  // ==============================================
  // MAIN RENDER
  // ==============================================
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/schedule">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900 truncate">
              {scheduleProject.title}
            </h1>
            <Badge className={getStatusColor(scheduleProject.status)}>
              {formatStatusLabel(scheduleProject.status)}
            </Badge>
            <Badge className={getPriorityColor(scheduleProject.priority)}>
              {formatPriorityLabel(scheduleProject.priority)}
            </Badge>
          </div>
          
          {scheduleProject.project && (
            <div className="flex items-center gap-2 text-gray-600">
              <Building2 className="h-4 w-4" />
              <span>{scheduleProject.project.name}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {statusActions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant as any}
              size="sm"
              onClick={action.action}
              disabled={isUpdatingStatus}
              className={action.className}
            >
              {isUpdatingStatus ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <action.icon className="mr-2 h-4 w-4" />
              )}
              {action.label}
            </Button>
          ))}
          
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/schedule/${scheduleProject.id}/edit`}>
              <Edit2 className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Main Content Area */}
        <div className="md:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Task Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Task Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {scheduleProject.description && (
                    <div>
                      <h4 className="font-medium mb-2">Description</h4>
                      <p className="text-gray-600">{scheduleProject.description}</p>
                    </div>
                  )}

                  {scheduleProject.location && (
                    <div>
                      <h4 className="font-medium mb-2">Location</h4>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{scheduleProject.location}</span>
                      </div>
                    </div>
                  )}

                  {scheduleProject.tradeRequired && (
                    <div>
                      <h4 className="font-medium mb-2">Trade Required</h4>
                      <Badge variant="outline">
                        {scheduleProject.tradeRequired.charAt(0).toUpperCase() + scheduleProject.tradeRequired.slice(1)}
                      </Badge>
                    </div>
                  )}

                  {scheduleProject.notes && (
                    <div>
                      <h4 className="font-medium mb-2">Notes</h4>
                      <p className="text-gray-600 bg-gray-50 p-3 rounded">{scheduleProject.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Completion</span>
                      <span className="font-medium">{scheduleProject.progressPercentage}%</span>
                    </div>
                    <Progress value={scheduleProject.progressPercentage} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {scheduleProject.estimatedHours && (
                      <div>
                        <p className="text-gray-600">Estimated Hours</p>
                        <p className="font-medium">{scheduleProject.estimatedHours} hrs</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-600">Actual Hours</p>
                      <p className="font-medium">{scheduleProject.actualHours} hrs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dependencies */}
              {hasDependentSchedules && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Dependencies
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dependentSchedules.map((dep) => (
                        <div
                          key={dep.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded"
                        >
                          <div>
                            <p className="font-medium">{dep.title}</p>
                            <p className="text-sm text-gray-600">{dep.project.name}</p>
                          </div>
                          <Badge className={getStatusColor(dep.status)}>
                            {formatStatusLabel(dep.status)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="team" className="space-y-6">
              {/* Assigned Team Members */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Assigned Team Members
                  </CardTitle>
                  <CardDescription>
                    {scheduleProject.assignedMembers?.length || 0} team members assigned to this task
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {scheduleProject.assignedMembers && scheduleProject.assignedMembers.length > 0 ? (
                    <div className="space-y-4">
                      {scheduleProject.assignedMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-4 p-4 border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">
                                {member.user.firstName} {member.user.lastName}
                              </h4>
                              {member.user.tradeSpecialty && (
                                <Badge variant="outline" className="text-xs">
                                  {member.user.tradeSpecialty}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No team members assigned</h3>
                      <p className="text-gray-600 mb-4">This task hasn't been assigned to any team members yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              {/* Activity Log */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Activity Log
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No activity yet</h3>
                    <p className="text-gray-600">Activity will appear here as the task progresses.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          
          {/* Schedule Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Date</p>
                <p className="font-medium">{formatDate(scheduleProject.startDate)}</p>
              </div>

              {(scheduleProject.startTime || scheduleProject.endTime) && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Time</p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">
                      {scheduleProject.startTime && formatTime(scheduleProject.startTime)}
                      {scheduleProject.startTime && scheduleProject.endTime && " - "}
                      {scheduleProject.endTime && formatTime(scheduleProject.endTime)}
                    </span>
                  </div>
                </div>
              )}

              {scheduleProject.startDate !== scheduleProject.endDate && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">End Date</p>
                  <p className="font-medium">{formatDate(scheduleProject.endDate)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Creator Info */}
          {scheduleProject.creator && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Created By
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {scheduleProject.creator.firstName} {scheduleProject.creator.lastName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatDateTime(scheduleProject.createdAt)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <Badge className={getStatusColor(scheduleProject.status)}>
                  {formatStatusLabel(scheduleProject.status)}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Priority</span>
                <Badge className={getPriorityColor(scheduleProject.priority)}>
                  {formatPriorityLabel(scheduleProject.priority)}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium">{scheduleProject.progressPercentage}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Team Size</span>
                <span className="font-medium">{scheduleProject.assignedMembers?.length || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}