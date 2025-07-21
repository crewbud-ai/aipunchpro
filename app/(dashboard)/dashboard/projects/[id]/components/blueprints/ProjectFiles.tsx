// ==============================================
// app/(dashboard)/dashboard/projects/[id]/components/ProjectFiles.tsx
// ==============================================

"use client"

import React, { useState, useMemo, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
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
  Plus,
  Upload,
  FileText,
  Image,
  Download,
  Eye,
  Edit2,
  Trash2,
  MoreVertical,
  Search,
  Filter,
  Folder,
  FolderOpen,
  File,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Loader2,
  Calendar,
  User,
  HardDrive,
  Tag,
  Camera,
  Paperclip,
  FileImage,
  FileType,
  Sheet,
  Video,
  X,
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

// Import hooks and types (we'll need to create these)
// import { useProjectFiles } from "@/hooks/project-files"
// import { useFileUpload } from "@/hooks/file-upload"
// import type { ProjectFile } from "@/types/project-files"

// Import dialogs
import { FileUploadDialog } from "./FileUploadDialog"
import { FileDetailsDialog } from "./FileDetailsDialog"

// ==============================================
// INTERFACES & TYPES
// ==============================================
interface ProjectFilesProps {
  projectId: string
  projectName: string
  projectStatus: string
}

// Temporary interface until we create proper types
interface ProjectFile {
  id: string
  projectId: string
  name: string
  originalName: string
  fileUrl: string
  fileType: string
  fileSize: number
  mimeType: string
  folder: string
  category?: string
  version?: string
  description?: string
  tags?: string[]
  isPublic: boolean
  status: string
  uploadedBy: string
  uploadedAt: string
  createdAt: string
  updatedAt: string
  uploader?: {
    firstName: string
    lastName: string
  }
}

interface FileRowProps {
  file: ProjectFile
  onView: (file: ProjectFile) => void
  onEdit: (file: ProjectFile) => void
  onDownload: (file: ProjectFile) => void
  onDelete: (file: ProjectFile) => void
  isDeleting: boolean
}

// ==============================================
// UTILITY FUNCTIONS
// ==============================================
const getFileIcon = (fileType: string, mimeType: string) => {
  if (mimeType?.startsWith('image/')) {
    return { icon: FileImage, color: 'text-blue-600' }
  } else if (mimeType === 'application/pdf') {
    return { icon: FileType, color: 'text-red-600' }
  } else if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel')) {
    return { icon: Sheet, color: 'text-green-600' }
  } else if (mimeType?.startsWith('video/')) {
    return { icon: Video, color: 'text-purple-600' }
  } else {
    return { icon: FileText, color: 'text-gray-600' }
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getFolderConfig = (folder: string) => {
  switch (folder) {
    case 'blueprints':
      return { label: 'Blueprints', color: 'bg-blue-100 text-blue-800', icon: FileText }
    case 'documents':
      return { label: 'Documents', color: 'bg-gray-100 text-gray-800', icon: FileText }
    case 'photos':
      return { label: 'Photos', color: 'bg-green-100 text-green-800', icon: Camera }
    case 'contracts':
      return { label: 'Contracts', color: 'bg-purple-100 text-purple-800', icon: FileText }
    case 'reports':
      return { label: 'Reports', color: 'bg-orange-100 text-orange-800', icon: FileText }
    default:
      return { label: 'General', color: 'bg-gray-100 text-gray-800', icon: File }
  }
}

// ==============================================
// FILE ROW COMPONENT
// ==============================================
const FileRow: React.FC<FileRowProps> = ({ 
  file, 
  onView, 
  onEdit, 
  onDownload, 
  onDelete, 
  isDeleting 
}) => {
  const fileConfig = getFileIcon(file.fileType, file.mimeType)
  const FileIcon = fileConfig.icon

  return (
    <TableRow className="hover:bg-gray-50/50">
      {/* File Info */}
      <TableCell className="max-w-xs">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${fileConfig.color.replace('text-', 'bg-').replace('-600', '-100')}`}>
            <FileIcon className={`h-4 w-4 ${fileConfig.color}`} />
          </div>
          <div className="min-w-0 flex-1">
            <button
              onClick={() => onView(file)}
              className="font-medium text-gray-900 hover:text-blue-600 text-left truncate block w-full"
            >
              {file.name}
            </button>
            {file.description && (
              <p className="text-xs text-gray-600 truncate mt-1">
                {file.description}
              </p>
            )}
          </div>
        </div>
      </TableCell>

      {/* Version */}
      <TableCell>
        {file.version ? (
          <Badge variant="secondary" className="text-xs">
            {file.version}
          </Badge>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        )}
      </TableCell>

      {/* Size */}
      <TableCell className="text-right">
        <span className="text-sm font-mono">{formatFileSize(file.fileSize)}</span>
      </TableCell>

      {/* Uploaded */}
      <TableCell>
        <div className="space-y-1">
          <div className="text-sm">{format(new Date(file.uploadedAt), 'MMM d, yyyy')}</div>
          {file.uploader && (
            <div className="text-xs text-gray-500">
              by {file.uploader.firstName} {file.uploader.lastName}
            </div>
          )}
        </div>
      </TableCell>

      {/* Status */}
      <TableCell>
        <Badge variant={file.status === 'active' ? 'default' : 'secondary'}>
          {file.status}
        </Badge>
      </TableCell>

      {/* Actions */}
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(file)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDownload(file)}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(file)}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Info
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(file)}
              className="text-red-600"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}

// ==============================================
// MAIN PROJECT FILES COMPONENT
// ==============================================
export const ProjectFiles: React.FC<ProjectFilesProps> = ({
  projectId,
  projectName,
  projectStatus,
}) => {
  // ==============================================
  // STATE
  // ==============================================
  const [searchTerm, setSearchTerm] = useState("")
  
  // Dialog states
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null)

  // Temporary loading states (replace with actual hooks)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Mock data (replace with actual hook data)
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([])

  // ==============================================
  // COMPUTED VALUES
  // ==============================================
  const filteredFiles = useMemo(() => {
    return projectFiles.filter(file => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        if (!file.name.toLowerCase().includes(searchLower) &&
            !(file.description?.toLowerCase().includes(searchLower))) {
          return false
        }
      }

      return true
    })
  }, [projectFiles, searchTerm])

  const fileStats = useMemo(() => {
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const stats = {
      total: projectFiles.length,
      totalSize: projectFiles.reduce((sum, file) => sum + file.fileSize, 0),
      recent: projectFiles.filter(file => new Date(file.uploadedAt) > oneWeekAgo).length,
    }

    return stats
  }, [projectFiles])

  // ==============================================
  // EVENT HANDLERS
  // ==============================================
  const handleViewFile = useCallback((file: ProjectFile) => {
    setSelectedFile(file)
    setIsDetailsDialogOpen(true)
  }, [])

  const handleEditFile = useCallback((file: ProjectFile) => {
    // Navigate to edit or open edit modal
    console.log('Edit file:', file)
  }, [])

  const handleDownloadFile = useCallback((file: ProjectFile) => {
    // Implement download functionality
    const link = document.createElement('a')
    link.href = file.fileUrl
    link.download = file.originalName || file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [])

  const handleDeleteFile = useCallback(async (file: ProjectFile) => {
    if (window.confirm(`Are you sure you want to delete "${file.name}"?`)) {
      setDeletingFileId(file.id)
      try {
        // Implement delete API call
        await new Promise(resolve => setTimeout(resolve, 1000)) // Mock delay
        setProjectFiles(prev => prev.filter(f => f.id !== file.id))
        console.log('File deleted:', file)
      } catch (error) {
        console.error('Failed to delete file:', error)
        setError('Failed to delete file. Please try again.')
      } finally {
        setDeletingFileId(null)
      }
    }
  }, [])

  const handleUploadSuccess = useCallback((newFiles: ProjectFile[]) => {
    setProjectFiles(prev => [...prev, ...newFiles])
    setIsUploadDialogOpen(false)
  }, [])

  const handleDialogClose = useCallback(() => {
    setIsUploadDialogOpen(false)
    setIsDetailsDialogOpen(false)
    setSelectedFile(null)
  }, [])

  const handleRefresh = useCallback(async () => {
    setIsLoading(true)
    try {
      // Implement refresh logic
      await new Promise(resolve => setTimeout(resolve, 1000)) // Mock delay
    } catch (error) {
      console.error('Failed to refresh files:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ==============================================
  // RENDER
  // ==============================================
  
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error loading project files: {error}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Project Blueprints
          </h2>
          <p className="text-sm text-gray-600">
            Blueprint PDFs and technical drawings for {projectName}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button onClick={() => setIsUploadDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Blueprint
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{fileStats.total}</div>
            <div className="text-xs text-gray-600">Total Blueprints</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-700">
              {formatFileSize(fileStats.totalSize)}
            </div>
            <div className="text-xs text-gray-600">Total Size</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-700">
              {fileStats.recent}
            </div>
            <div className="text-xs text-gray-600">Recent Uploads</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search blueprints..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Clear Search */}
            {searchTerm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchTerm("")}
              >
                Clear Search
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Files Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Blueprints ({filteredFiles.length})
          </CardTitle>
          <CardDescription>
            Blueprint PDFs and technical drawings for this project
          </CardDescription>
        </CardHeader>
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
                      onEdit={handleEditFile}
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

      {/* Dialogs */}
      <FileUploadDialog
        projectId={projectId}
        projectName={projectName}
        isOpen={isUploadDialogOpen}
        onClose={handleDialogClose}
        onSuccess={handleUploadSuccess}
      />

      {selectedFile && (
        <FileDetailsDialog
          file={selectedFile}
          isOpen={isDetailsDialogOpen}
          onClose={handleDialogClose}
          onEdit={handleEditFile}
          onDownload={handleDownloadFile}
        />
      )}
    </div>
  )
}