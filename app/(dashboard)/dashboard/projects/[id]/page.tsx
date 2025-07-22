// ==============================================
// UPDATED: app/(dashboard)/dashboard/projects/[id]/page.tsx
// Role-Based Project Details Page (Maintains existing design)
// ==============================================

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
  Target,
  Shield,
  Eye
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
import { ProjectTeamMembers } from "./components/team-member/ProjectTeamMembers"
import { ProjectTasks } from "./components/project-task/ProjectTasks"
import { ProjectFiles } from "./components/blueprints/ProjectFiles"

// ADDED: Import permission utilities
import { hasPermission, canUseFeature, withPermission, withFeature } from "@/lib/permissions"

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

  // ADDED: Permission checks
  const canEditProject = canUseFeature('editProject')
  const canDeleteProject = canUseFeature('deleteProject')
  const canViewFinancials = hasPermission('financials', 'view')
  const canAddTeam = hasPermission('team', 'add')
  const canViewTasks = hasPermission('tasks', 'view')
  const canViewFiles = hasPermission('files', 'view')
  const canViewFilesUpload = hasPermission('files', 'upload')
  const canViewReports = hasPermission('reports', 'view')
  const canManageUsers = hasPermission('admin', 'manageUsers')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleDeleteProject = async () => {
    try {
      await deleteProject(projectId)
      if (isDeleteSuccess) {
        router.push('/dashboard/projects')
      }
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
  }

  const handleDeleteDialogClose = () => {
    setShowDeleteDialog(false)
    resetDelete()
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (hasError || isNotFound) {
    return (
      <div className="container mx-auto py-12">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {isNotFound 
              ? 'Project not found or you do not have access to view it.'
              : error || 'Failed to load project details.'
            }
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!project) return null

  // MODIFIED: Available tabs based on permissions
  const availableTabs = [
    { id: 'overview', label: 'Overview', icon: Eye, show: true }, // Everyone can see overview
    { id: 'tasks', label: 'Tasks', icon: CheckCircle, show: canViewTasks },
    { id: 'team', label: 'Team', icon: Users, show: canAddTeam },
    { id: 'files', label: 'Files', icon: FileText, show: canViewFiles },
    { id: 'timeline', label: 'Timeline', icon: Calendar, show: hasPermission('schedule', 'view') },
    { id: 'reports', label: 'Reports', icon: TrendingUp, show: canViewReports }
  ].filter(tab => tab.show)

  // Ensure activeTab is valid for current user permissions
  if (!availableTabs.find(tab => tab.id === activeTab)) {
    setActiveTab('overview')
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/projects">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={getStatusColor(project.status)}>
                {project.status.replace('_', ' ').toUpperCase()}
              </Badge>
              {project.priority && (
                <Badge variant="secondary">
                  {project.priority.toUpperCase()} PRIORITY
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* MODIFIED: Action buttons with permission checks */}
        <div className="flex items-center gap-2">
          {withFeature('editProject', (
            <Button variant="outline" asChild>
              <Link href={`/dashboard/projects/${projectId}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          ))}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {}}>
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {}}>
                <Share className="mr-2 h-4 w-4" />
                Share Project
              </DropdownMenuItem>
              
              {withPermission('admin', 'companySettings', (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => {}}>
                    <Settings className="mr-2 h-4 w-4" />
                    Project Settings
                  </DropdownMenuItem>
                </>
              ))}

              {withFeature('deleteProject', (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Project
                  </DropdownMenuItem>
                </>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Progress Bar */}
      {/* <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium">Project Progress</span>
          <span>{project.progress}%</span>
        </div>
        <Progress value={project.progress} className="w-full" />
      </div> */}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Budget Card - Only show if user can view financials */}
        {withPermission('financials', 'view', (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(project.spent)}
              </div>
              <p className="text-xs text-muted-foreground">
                of {formatCurrency(project.budget)} budgeted
              </p>
              {isOverBudget && (
                <p className="text-xs text-red-600 mt-1">
                  Over budget by {formatCurrency((project.spent || 0) - (project.budget || 0))}
                </p>
              )}
            </CardContent>
          </Card>
        ), (
          // Show limited budget info for non-financial users
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progress</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{project.progress}%</div>
              <p className="text-xs text-muted-foreground">completed</p>
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {project.status.replace('_', ' ')}
            </div>
            <p className="text-xs text-muted-foreground">
              {progressStatus === 'ahead' && '🚀 Ahead of schedule'}
              {progressStatus === 'on_track' && '✅ On track'}
              {progressStatus === 'behind' && '⚠️ Behind schedule'}
              {progressStatus === 'not_started' && '⏳ Not started'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Timeline</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
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
            {withPermission('team', 'assignToProjects', (
              <Button variant="ghost" size="sm" className="mt-2 h-8 px-2">
                <Plus className="h-3 w-3 mr-1" />
                Add member
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* MODIFIED: Dynamic tabs based on permissions */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className={`grid w-full ${availableTabs.length == 4 ? 'grid-cols-4' : 'grid-cols-6'}`}>
          {availableTabs.map((tab) => {
            const IconComponent = tab.icon
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                <IconComponent className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            )
          })}
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
                    <p className="font-semibold">{project.projectNumber || "Not assigned"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Priority</label>
                    <p className="font-semibold capitalize">{project.priority}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Start Date</label>
                    <p className="font-semibold">{formatDate(project.startDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Target End Date</label>
                    <p className="font-semibold">{formatDate(project.endDate)}</p>
                  </div>
                </div>

                {project.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Description</label>
                    <p className="mt-1 text-sm text-gray-800">{project.description}</p>
                  </div>
                )}

                {project.tags && project.tags.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 mb-2 block">Tags</label>
                    <div className="flex flex-wrap gap-1">
                      {project.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Location and Client Information */}
            <Card>
              <CardHeader>
                <CardTitle>Location & Client</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasLocation && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Project Location</h4>
                        <p className="text-sm text-gray-600">{displayLocation}</p>
                        {projectLocation?.coordinates && (
                          <p className="text-xs text-gray-500 mt-1">
                            Coordinates: {projectLocation.coordinates.lat}, {projectLocation.coordinates.lng}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {hasClient && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Building2 className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium">Client Information</h4>
                        <p className="text-sm text-gray-600">{displayClient}</p>
                        
                        {clientContactInfo && (
                          <div className="mt-2 space-y-1">
                            {projectClient?.email && (
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Mail className="h-3 w-3" />
                                <a href={`mailto:${projectClient.email}`} className="hover:text-blue-600">
                                  {projectClient.email}
                                </a>
                              </div>
                            )}
                            {projectClient?.phone && (
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Phone className="h-3 w-3" />
                                <a href={`tel:${projectClient.phone}`} className="hover:text-blue-600">
                                  {projectClient.phone}
                                </a>
                              </div>
                            )}
                            {projectClient?.website && (
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Globe className="h-3 w-3" />
                                <a 
                                  href={projectClient.website.startsWith('http') ? projectClient.website : `https://${projectClient.website}`}
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="hover:text-blue-600"
                                >
                                  Website
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
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

        {/* MODIFIED: Conditionally rendered tabs */}
        {canViewTasks && (
          <TabsContent value="tasks">
            <ProjectTasks
              projectId={projectId}
              projectName={project.name}
              projectStatus={project.status}
            />
          </TabsContent>
        )}

        {canAddTeam && (
          <TabsContent value="team">
            <ProjectTeamMembers
              projectId={projectId}
              projectName={project?.name || "Project"}
              projectStatus={project?.status || ""}
            />
          </TabsContent>
        )}

        {canViewFiles && (
          <TabsContent value="files">
            <ProjectFiles
              projectId={projectId}
              projectName={project?.name || "Project"}
              projectStatus={project?.status || ""}
            />
          </TabsContent>
        )}

        {hasPermission('schedule', 'view') && (
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
        )}

        {canViewReports && (
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
                  {hasPermission('reports', 'generate') && (
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Generate Report
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* MODIFIED: Delete dialog with permission check */}
      {canDeleteProject && (
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
      )}
    </div>
  )
}