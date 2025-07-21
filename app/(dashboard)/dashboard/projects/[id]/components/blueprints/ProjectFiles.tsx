// ==============================================
// app/(dashboard)/dashboard/projects/[id]/components/blueprints/ProjectFiles.tsx
// ==============================================

"use client"

import React, { useState, useMemo, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
} from "@/components/ui/alert-dialog"
import {
  Upload,
  Download,
  Eye,
  Edit2,
  Trash2,
  MoreVertical,
  Search,
  RefreshCw,
  AlertCircle,
  HardDrive,
  FileText,
  Loader2,
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

// Import hooks and components
import { useProjectFiles } from "@/hooks/projects/use-project-files"
import { projectFilesApi } from "@/lib/api/project-files"
import { FileUploadDialog } from "./FileUploadDialog"

// ==============================================
// INTERFACES & TYPES
// ==============================================
interface ProjectFilesProps {
  projectId: string
  projectName: string
  projectStatus: string
}

// ==============================================
// FILE ROW COMPONENT
// ==============================================
const FileRow: React.FC<{
  file: any
  onView: (file: any) => void
  onDownload: (file: any) => void
  onDelete: (file: any) => void
  isDeleting: boolean
}> = ({ file, onView, onDownload, onDelete, isDeleting }) => {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-red-600" />
          <div>
            <p className="font-medium text-gray-900">{file.originalName}</p>
            <p className="text-sm text-gray-600">{file.description || 'No description'}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline">{file.version || '1.0'}</Badge>
      </TableCell>
      <TableCell className="text-right">
        {(file.fileSize / (1024 * 1024)).toFixed(2)} MB
      </TableCell>
      <TableCell>
        {file.uploadedAt ? format(new Date(file.uploadedAt), 'MMM d, yyyy') : 'Unknown'}
      </TableCell>
      <TableCell>
        <Badge variant={file.status === 'active' ? 'default' : 'secondary'}>
          {file.status}
        </Badge>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" disabled={isDeleting}>
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MoreVertical className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(file)}>
              <Eye className="h-4 w-4 mr-2" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDownload(file)}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(file)}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}

// ==============================================
// MAIN COMPONENT
// ==============================================
export const ProjectFiles: React.FC<ProjectFilesProps> = ({
  projectId,
  projectName,
  projectStatus,
}) => {
  // ==============================================
  // HOOKS
  // ==============================================
  const {
    files,
    isLoading,
    error,
    hasFiles,
    fileCount,
    blueprintFiles,
    loadFiles,
    deleteFile,
    clearError,
  } = useProjectFiles()

  // ==============================================
  // STATE
  // ==============================================
  const [searchTerm, setSearchTerm] = useState("")
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null)
  
  // Delete confirmation dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<any | null>(null)

  // ==============================================
  // COMPUTED PROPERTIES
  // ==============================================
  const filteredFiles = useMemo(() => {
    if (!searchTerm) return blueprintFiles

    return blueprintFiles.filter(file =>
      file.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.version?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [blueprintFiles, searchTerm])

  // ==============================================
  // EFFECTS
  // ==============================================
  useEffect(() => {
    if (projectId) {
      loadFiles(projectId)
    }
  }, [projectId, loadFiles])

  // ==============================================
  // HANDLERS
  // ==============================================
  const handleRefresh = useCallback(() => {
    loadFiles(projectId)
  }, [projectId, loadFiles])

  const handleDialogClose = useCallback(() => {
    setIsUploadDialogOpen(false)
  }, [])

  const handleUploadSuccess = useCallback((file: any) => {
    // File is already added to the list by the hook, but let's refresh to be safe
    loadFiles(projectId)
    setIsUploadDialogOpen(false)
  }, [loadFiles, projectId])

  const handleViewFile = useCallback((file: any) => {
    // Open file in new tab
    window.open(file.fileUrl, '_blank')
  }, [])

  const handleDownloadFile = useCallback(async (file: any) => {
    try {
      await projectFilesApi.downloadProjectFile(file)
    } catch (error) {
      console.error('Download error:', error)
    }
  }, [])

  const handleDeleteFile = useCallback((file: any) => {
    setFileToDelete(file)
    setIsDeleteDialogOpen(true)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (!fileToDelete) return

    setDeletingFileId(fileToDelete.id)
    try {
      await deleteFile(projectId, fileToDelete.id)
    } catch (error) {
      console.error('Delete error:', error)
    } finally {
      setDeletingFileId(null)
      setIsDeleteDialogOpen(false)
      setFileToDelete(null)
    }
  }, [deleteFile, projectId, fileToDelete])

  const handleCancelDelete = useCallback(() => {
    setIsDeleteDialogOpen(false)
    setFileToDelete(null)
  }, [])

  // ==============================================
  // RENDER
  // ==============================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Project Blueprints</CardTitle>
              <CardDescription>
                Manage PDF blueprints and architectural drawings for {projectName}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                Refresh
              </Button>
              <Button onClick={() => setIsUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Blueprint
              </Button>
            </div>
          </div>

          {/* Stats and Search */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>{fileCount} {fileCount === 1 ? 'file' : 'files'}</span>
              <span>•</span>
              <span>{blueprintFiles.length} {blueprintFiles.length === 1 ? 'blueprint' : 'blueprints'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search blueprints..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Error Alert */}
        {error && (
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearError}
                  className="ml-2"
                >
                  Dismiss
                </Button>
              </AlertDescription>
            </Alert>
          </CardContent>
        )}

        {/* Files Table */}
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-12">
              <HardDrive className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No blueprints found
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm
                  ? "No blueprints match your search."
                  : "This project doesn't have any blueprints yet."
                }
              </p>
              <Button onClick={() => setIsUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload First Blueprint
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Blueprint</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead className="text-right">Size</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFiles.map((file) => (
                    <FileRow
                      key={file.id}
                      file={file}
                      onView={handleViewFile}
                      onDownload={handleDownloadFile}
                      onDelete={handleDeleteFile}
                      isDeleting={deletingFileId === file.id}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <FileUploadDialog
        projectId={projectId}
        projectName={projectName}
        isOpen={isUploadDialogOpen}
        onClose={handleDialogClose}
        onSuccess={handleUploadSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blueprint</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{fileToDelete?.originalName}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deletingFileId === fileToDelete?.id}
            >
              {deletingFileId === fileToDelete?.id ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}