"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  MapPin,
  Building2,
  Users,
  Clock,
  FileText,
  Camera,
  Phone,
  Mail,
  Globe,
  MoreHorizontal,
  Plus,
  Download,
  Share,
  Settings,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Target
} from "lucide-react"
import { useProject } from "@/hooks/projects"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Loader2 } from "lucide-react"
import { useDeleteProject } from "@/hooks/projects/use-delete-project"
import { ProjectStatusManager } from "@/components/projects/ProjectStatusManager"
import { ProjectTeamMembers } from "./components/ProjectTeamMembers"

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const [activeTab, setActiveTab] = useState("overview")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)


  const {
    project,
    isLoading,
    hasError,
    error,
    isNotFound,
    projectLocation,
    projectClient,
    hasLocation,
    hasClient,
    isOverBudget,
    budgetUtilization,
    progressStatus,
    daysUntilDeadline,
    isOverdue,
    displayLocation,
    displayClient,
    clientContactInfo,
    refreshProject
  } = useProject(projectId)

  const {
    isLoading: isDeleting,
    isSuccess: isDeleteSuccess,
    deleteProject,
    reset: resetDelete,
  } = useDeleteProject()

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "not_started":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "on_track":
        return "bg-green-100 text-green-800 border-green-200"
      case "ahead_of_schedule":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "behind_schedule":
        return "bg-red-100 text-red-800 border-red-200"
      case "on_hold":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "completed":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "cancelled":
        return "bg-gray-100 text-gray-600 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatStatusLabel = (status: string) => {
    switch (status) {
      case 'not_started': return 'Not Started'
      case 'in_progress': return 'In Progress'
      case 'on_track': return 'On Track'
      case 'ahead_of_schedule': return 'Ahead of Schedule'
      case 'behind_schedule': return 'Behind Schedule'
      case 'on_hold': return 'On Hold'
      case 'completed': return 'Completed'
      case 'cancelled': return 'Cancelled'
      default: return status
    }
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return "$0"
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set"
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getProgressColor = (progress?: number) => {
    if (!progress) return 'bg-gray-300'
    if (progress >= 90) return 'bg-green-500'
    if (progress >= 70) return 'bg-blue-500'
    if (progress >= 50) return 'bg-yellow-500'
    if (progress >= 30) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const handleDeleteProject = async () => {
    if (!projectId) return
    await deleteProject(projectId)
    setShowDeleteDialog(false)
  }
  const handleDeleteDialogClose = () => {
    setShowDeleteDialog(false)
    if (isDeleteSuccess) {
      resetDelete()
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Error states
  if (isNotFound) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Building2 className="h-12 w-12 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Project Not Found</h2>
        <p className="text-gray-600 mb-6">The project you're looking for doesn't exist or has been deleted.</p>
        <Link href="/dashboard/projects">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </Link>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/projects">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Project Details</h1>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!project) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/projects">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <Badge className={getStatusColor(project.status)} variant="outline">
                {formatStatusLabel(project.status)}
              </Badge>
              {isOverdue && (
                <Badge variant="destructive">
                  Overdue
                </Badge>
              )}
              {daysUntilDeadline !== null && daysUntilDeadline <= 7 && daysUntilDeadline > 0 && (
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  Due in {daysUntilDeadline} days
                </Badge>
              )}
            </div>
            <p className="text-gray-600 mt-1">{project.description || "No description provided"}</p>
          </div>
        </div>

        <div className="flex items-end gap-2">
          <ProjectStatusManager
            project={{
              id: project.id,
              status: project.status,
              name: project.name
            }}
            onStatusChange={(newStatus) => {
              refreshProject()
            }}
          />
          <Button variant="outline" >
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Link href={`/dashboard/projects/${projectId}/edit`}>
            <Button variant="outline" >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Project Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileText className="mr-2 h-4 w-4" />
                Generate Report
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 cursor-pointer"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.progress || 0}%</div>
            <Progress value={project.progress || 0} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {progressStatus === 'ahead' && '🟢 Ahead of schedule'}
              {progressStatus === 'on_track' && '🟡 On track'}
              {progressStatus === 'behind' && '🔴 Behind schedule'}
              {progressStatus === 'not_started' && '⚪ Not started'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(project.spent)}</div>
            <p className="text-xs text-muted-foreground">
              of {formatCurrency(project.budget)} budget
            </p>
            <div className="mt-2">
              <Progress
                value={budgetUtilization}
                className={isOverBudget ? "progress-destructive" : ""}
              />
            </div>
            <p className={`text-xs mt-2 ${isOverBudget ? 'text-red-600' : 'text-muted-foreground'}`}>
              {budgetUtilization.toFixed(1)}% utilized
              {isOverBudget && " (Over budget!)"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Timeline</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {daysUntilDeadline !== null
                ? daysUntilDeadline < 0
                  ? `${Math.abs(daysUntilDeadline)} days`
                  : `${daysUntilDeadline} days`
                : "No deadline"
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {daysUntilDeadline !== null
                ? daysUntilDeadline < 0
                  ? "overdue"
                  : "remaining"
                : "End date not set"
              }
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Ends: {formatDate(project.endDate)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">members assigned</p>
            <Button variant="ghost" size="sm" className="mt-2 h-8 px-2">
              <Plus className="h-3 w-3 mr-1" />
              Add member
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Project Information */}
            <Card>
              <CardHeader>
                <CardTitle>Project Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Project Number</label>
                    <p className="text-sm text-gray-900">{project.projectNumber || "Not assigned"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Created</label>
                    <p className="text-sm text-gray-900">{formatDate(project.createdAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Start Date</label>
                    <p className="text-sm text-gray-900">{formatDate(project.startDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">End Date</label>
                    <p className="text-sm text-gray-900">{formatDate(project.endDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Estimated Hours</label>
                    <p className="text-sm text-gray-900">{project.estimatedHours || "Not set"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Actual Hours</label>
                    <p className="text-sm text-gray-900">{project.actualHours || "0"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location & Client */}
            <Card>
              <CardHeader>
                <CardTitle>Location & Client</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasLocation && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <label className="text-sm font-medium text-gray-600">Project Location</label>
                    </div>
                    <p className="text-sm text-gray-900">{displayLocation}</p>
                    {projectLocation?.coordinates && (
                      <Button variant="ghost" size="sm" className="mt-2">
                        View on Map
                      </Button>
                    )}
                  </div>
                )}

                {hasClient && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <label className="text-sm font-medium text-gray-600">Client</label>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{displayClient}</p>
                    {projectClient?.email && (
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="h-3 w-3 text-gray-400" />
                        <a href={`mailto:${projectClient.email}`} className="text-sm text-blue-600 hover:underline">
                          {projectClient.email}
                        </a>
                      </div>
                    )}
                    {projectClient?.phone && (
                      <div className="flex items-center gap-2 mt-1">
                        <Phone className="h-3 w-3 text-gray-400" />
                        <a href={`tel:${projectClient.phone}`} className="text-sm text-blue-600 hover:underline">
                          {projectClient.phone}
                        </a>
                      </div>
                    )}
                    {projectClient?.website && (
                      <div className="flex items-center gap-2 mt-1">
                        <Globe className="h-3 w-3 text-gray-400" />
                        <a href={projectClient.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                          Website
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {!hasLocation && !hasClient && (
                  <p className="text-sm text-gray-500">No location or client information available.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Project created</p>
                    <p className="text-xs text-gray-600">{formatDate(project.createdAt)}</p>
                  </div>
                </div>
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No recent activity</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
              <CardDescription>Manage project tasks and milestones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
                <p className="text-gray-600 mb-4">Start organizing your project by creating tasks.</p>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Task
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <ProjectTeamMembers
            projectId={projectId}
            projectName={project?.name || "Project"}
            projectStatus={project?.status || ""}
          />
        </TabsContent>

        <TabsContent value="files">
          <Card>
            <CardHeader>
              <CardTitle>Project Files</CardTitle>
              <CardDescription>Documents, images, and other project files</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No files uploaded</h3>
                <p className="text-gray-600 mb-4">Upload documents, blueprints, photos, and other project files.</p>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Files
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Project Timeline</CardTitle>
              <CardDescription>View project schedule and milestones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Timeline coming soon</h3>
                <p className="text-gray-600">Visual timeline and milestone tracking will be available here.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Project Reports</CardTitle>
              <CardDescription>Analytics and performance reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No reports generated</h3>
                <p className="text-gray-600 mb-4">Generate detailed reports on project progress and performance.</p>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={handleDeleteDialogClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{project.name}"? This action cannot be undone.
              All associated tasks, files, and data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : isDeleteSuccess ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Deleted! Redirecting...
                </>
              ) : (
                'Delete Project'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}