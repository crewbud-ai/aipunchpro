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
import { hasPermission } from "@/lib/permissions"
import { formatDate } from "@/utils/format-functions"

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
            <TableCell className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                    <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm sm:text-base text-gray-900 truncate">{file.originalName}</p>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">{file.description || 'No description'}</p>
                    </div>
                </div>
            </TableCell>
            <TableCell className="p-3 sm:p-4">
                <Badge variant="outline" className="text-xs">{file.version || '1.0'}</Badge>
            </TableCell>
            <TableCell className="text-right p-3 sm:p-4 text-xs sm:text-sm">
                {(file.fileSize / (1024 * 1024)).toFixed(2)} MB
            </TableCell>
            <TableCell className="p-3 sm:p-4 text-xs sm:text-sm">
                <span className="hidden sm:inline">
                    {file.uploadedAt ? format(new Date(file.uploadedAt), 'MMM d, yyyy') : 'Unknown'}
                </span>
                <span className="sm:hidden">
                    {file.uploadedAt ? format(new Date(file.uploadedAt), 'MMM d') : 'Unknown'}
                </span>
            </TableCell>
            <TableCell className="p-3 sm:p-4">
                <Badge variant={file.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                    {file.status}
                </Badge>
            </TableCell>
            <TableCell className="p-3 sm:p-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" disabled={isDeleting} className="h-8 w-8 p-0">
                            {isDeleting ? (
                                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                            ) : (
                                <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4" />
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="text-sm">
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


    // Permissions
    const canViewFilesUpload = hasPermission('files', 'upload')

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
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <Card>
                <CardHeader className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                        <div className="flex-1 min-w-0">
                            <CardTitle className="text-base sm:text-lg">Project Blueprints</CardTitle>
                            <CardDescription className="text-sm">
                                Manage PDF blueprints and architectural drawings for {projectName}
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRefresh}
                                disabled={isLoading}
                                className="flex-1 sm:flex-none text-xs sm:text-sm"
                            >
                                <RefreshCw className={cn("h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2", isLoading && "animate-spin")} />
                                Refresh
                            </Button>
                            {canViewFilesUpload && (
                                <Button onClick={() => setIsUploadDialogOpen(true)} className="flex-1 sm:flex-none text-xs sm:text-sm">
                                    <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                    <span className="hidden sm:inline">Upload Blueprint</span>
                                    <span className="sm:hidden">Upload</span>
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Stats and Search */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 pt-4">
                        <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                            <span>{fileCount} {fileCount === 1 ? 'file' : 'files'}</span>
                            <span>•</span>
                            <span>{blueprintFiles.length} {blueprintFiles.length === 1 ? 'blueprint' : 'blueprints'}</span>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <div className="relative flex-1 sm:flex-none">
                                <Search className="absolute left-3 top-1/2 h-3 w-3 sm:h-4 sm:w-4 -translate-y-1/2 text-gray-400" />
                                <Input
                                    placeholder="Search blueprints..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8 sm:pl-9 w-full sm:w-64 text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>

                {/* Error Alert */}
                {error && (
                    <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                        <Alert variant="destructive" className="text-sm">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <span className="flex-1">{error}</span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearError}
                                    className="text-xs w-full sm:w-auto sm:ml-2"
                                >
                                    Dismiss
                                </Button>
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                )}

                {/* Files Table */}
                <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                    {isLoading ? (
                        <div className="space-y-3 sm:space-y-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-2 sm:gap-4">
                                    <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded flex-shrink-0" />
                                    <Skeleton className="h-3 sm:h-4 flex-1" />
                                    <Skeleton className="h-3 sm:h-4 w-16 sm:w-20 hidden sm:block" />
                                    <Skeleton className="h-3 sm:h-4 w-12 sm:w-16 hidden sm:block" />
                                    <Skeleton className="h-3 sm:h-4 w-16 sm:w-24 hidden md:block" />
                                </div>
                            ))}
                        </div>
                    ) : filteredFiles.length === 0 ? (
                        <div className="text-center py-8 sm:py-12 px-4">
                            <HardDrive className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                                No blueprints found
                            </h3>
                            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                                {searchTerm
                                    ? "No blueprints match your search."
                                    : "This project doesn't have any blueprints yet."
                                }
                            </p>
                            {canViewFilesUpload && (
                                <Button onClick={() => setIsUploadDialogOpen(true)} className="text-sm w-full sm:w-auto">
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload First Blueprint
                                </Button>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden md:block rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-sm">Blueprint</TableHead>
                                            <TableHead className="text-sm">Version</TableHead>
                                            <TableHead className="text-right text-sm">Size</TableHead>
                                            <TableHead className="text-sm">Uploaded</TableHead>
                                            <TableHead className="text-sm">Status</TableHead>
                                            <TableHead className="w-20 text-sm">Actions</TableHead>
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

                            {/* Mobile Card View */}
                            <div className="md:hidden space-y-3">
                                {filteredFiles.map((file) => (
                                    <Card key={file.id} className="p-3">
                                        <div className="space-y-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-start gap-2 flex-1 min-w-0">
                                                    <FileText className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-medium text-sm truncate">{file.originalName}</h4>
                                                        <p className="text-xs text-gray-600">v{file.version || '1.0'}</p>
                                                    </div>
                                                </div>
                                                <Badge variant={file.status === 'active' ? 'default' : 'secondary'} className="text-xs flex-shrink-0">
                                                    {file.status === 'active' ? 'Active' : 'Archived'}
                                                </Badge>
                                            </div>

                                            <div className="flex items-center justify-between text-xs text-gray-600">
                                                <span>{(file.fileSize / (1024 * 1024)).toFixed(2)}</span>
                                                <span>{formatDate(file.uploadedAt)}</span>
                                            </div>

                                            <div className="flex items-center gap-2 pt-2 border-t">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleViewFile(file)}
                                                    className="flex-1 text-xs"
                                                >
                                                    <Eye className="h-3 w-3 mr-1" />
                                                    View
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDownloadFile(file)}
                                                    className="flex-1 text-xs"
                                                >
                                                    <Download className="h-3 w-3 mr-1" />
                                                    Download
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDeleteFile(file)}
                                                    disabled={deletingFileId === file.id}
                                                    className="flex-shrink-0"
                                                >
                                                    {deletingFileId === file.id ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-3 w-3 text-red-600" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </>
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
                <AlertDialogContent className="w-[95vw] max-w-[95vw] sm:w-full sm:max-w-lg">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base sm:text-lg">Delete Blueprint</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm">
                            Are you sure you want to delete "{fileToDelete?.originalName}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                        <AlertDialogCancel onClick={handleCancelDelete} className="w-full sm:w-auto text-sm">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            className="bg-red-600 hover:bg-red-700 w-full sm:w-auto text-sm"
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