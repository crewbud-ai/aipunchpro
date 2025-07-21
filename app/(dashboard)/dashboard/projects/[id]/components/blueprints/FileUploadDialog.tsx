// ==============================================
// app/(dashboard)/dashboard/projects/[id]/components/FileUploadDialog.tsx
// ==============================================

"use client"

import React, { useState, useCallback, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertCircle,
  CheckCircle,
  Upload,
  X,
  File,
  FileImage,
  FileType,
  FileText,
  Video,
  Sheet,
  Loader2,
  Camera,
  FolderOpen,
  Tag,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ==============================================
// INTERFACES
// ==============================================
interface FileUploadDialogProps {
  projectId: string
  projectName: string
  isOpen: boolean
  onClose: () => void
  onSuccess: (files: any[]) => void
}

interface PendingFile {
  file: File
  id: string
  folder: string
  category: string
  version: string
  description: string
  tags: string[]
  isPublic: boolean
}

// ==============================================
// CONSTANTS
// ==============================================
const FOLDER_OPTIONS = [
  { value: 'blueprints', label: 'Blueprints', description: 'Architectural drawings and plans' },
  { value: 'documents', label: 'Documents', description: 'General project documents' },
  { value: 'photos', label: 'Photos', description: 'Progress photos and images' },
  { value: 'contracts', label: 'Contracts', description: 'Legal contracts and agreements' },
  { value: 'reports', label: 'Reports', description: 'Project reports and analysis' },
  { value: 'general', label: 'General', description: 'Miscellaneous files' },
]

const CATEGORY_OPTIONS = [
  { value: 'architectural', label: 'Architectural' },
  { value: 'structural', label: 'Structural' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'mechanical', label: 'Mechanical' },
  { value: 'progress', label: 'Progress' },
  { value: 'legal', label: 'Legal' },
  { value: 'administrative', label: 'Administrative' },
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_FILES = 10
const ALLOWED_FILE_TYPES = ['application/pdf'] // Only PDF files allowed
const ALLOWED_FILE_EXTENSIONS = ['.pdf'] // Only PDF extensions

// ==============================================
// UTILITY FUNCTIONS
// ==============================================
const getFileIcon = (file: File) => {
  if (file.type.startsWith('image/')) {
    return { icon: FileImage, color: 'text-blue-600' }
  } else if (file.type === 'application/pdf') {
    return { icon: FileType, color: 'text-red-600' }
  } else if (file.type.includes('spreadsheet') || file.type.includes('excel')) {
    return { icon: Sheet, color: 'text-green-600' }
  } else if (file.type.startsWith('video/')) {
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

const generateFileId = () => Math.random().toString(36).substring(2, 15)

// ==============================================
// MAIN COMPONENT
// ==============================================
export const FileUploadDialog: React.FC<FileUploadDialogProps> = ({
  projectId,
  projectName,
  isOpen,
  onClose,
  onSuccess,
}) => {
  // ==============================================
  // STATE
  // ==============================================
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  // Default settings
  const [defaultFolder, setDefaultFolder] = useState('documents') // Default to documents for PDFs
  const [defaultCategory, setDefaultCategory] = useState('none') // Use 'none' instead of empty string
  const [defaultIsPublic, setDefaultIsPublic] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ==============================================
  // EVENT HANDLERS
  // ==============================================
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFilesSelected(droppedFiles)
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    handleFilesSelected(selectedFiles)
  }, [])

  const handleFilesSelected = useCallback((files: File[]) => {
    setError(null)
    
    // Validate file count
    if (pendingFiles.length + files.length > MAX_FILES) {
      setError(`Maximum ${MAX_FILES} files allowed`)
      return
    }

    // Validate and process files
    const validFiles: PendingFile[] = []
    const errors: string[] = []

    files.forEach((file, index) => {
      // Check file type - only allow PDFs
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
        if (!ALLOWED_FILE_EXTENSIONS.includes(fileExtension)) {
          errors.push(`"${file.name}" is not a PDF file. Only PDF files are allowed.`)
          return
        }
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`"${file.name}" is too large (max ${formatFileSize(MAX_FILE_SIZE)})`)
        return
      }

      // Check for duplicates
      const isDuplicate = pendingFiles.some(pf => 
        pf.file.name === file.name && pf.file.size === file.size
      )
      if (isDuplicate) {
        errors.push(`"${file.name}" is already selected`)
        return
      }

      // Add valid file
      validFiles.push({
        file,
        id: generateFileId(),
        folder: defaultFolder,
        category: defaultCategory || 'none', // Fix: use 'none' instead of empty string
        version: '',
        description: '',
        tags: [],
        isPublic: defaultIsPublic,
      })
    })

    if (errors.length > 0) {
      setError(errors.join('; '))
    }

    if (validFiles.length > 0) {
      setPendingFiles(prev => [...prev, ...validFiles])
    }
  }, [pendingFiles, defaultFolder, defaultCategory, defaultIsPublic])

  const removePendingFile = useCallback((fileId: string) => {
    setPendingFiles(prev => prev.filter(pf => pf.id !== fileId))
  }, [])

  const updatePendingFile = useCallback((fileId: string, updates: Partial<PendingFile>) => {
    setPendingFiles(prev => 
      prev.map(pf => pf.id === fileId ? { 
        ...pf, 
        ...updates,
        // Ensure category is never empty string
        category: updates.category === '' ? 'none' : (updates.category || pf.category)
      } : pf)
    )
  }, [])

  const handleUpload = useCallback(async () => {
    if (pendingFiles.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i)
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Mock successful upload - replace with actual API call
      const uploadedFiles = pendingFiles.map(pf => ({
        id: pf.id,
        projectId,
        name: pf.file.name,
        originalName: pf.file.name,
        fileUrl: URL.createObjectURL(pf.file), // Mock URL
        fileType: pf.file.name.split('.').pop() || '',
        fileSize: pf.file.size,
        mimeType: pf.file.type,
        folder: pf.folder,
        category: pf.category || undefined,
        version: pf.version || undefined,
        description: pf.description || undefined,
        tags: pf.tags,
        isPublic: pf.isPublic,
        status: 'active',
        uploadedBy: 'current-user-id',
        uploadedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        uploader: {
          firstName: 'Current',
          lastName: 'User',
        },
      }))

      setSuccess(true)
      setTimeout(() => {
        onSuccess(uploadedFiles)
        handleClose()
      }, 1500)

    } catch (error) {
      console.error('Upload failed:', error)
      setError('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }, [pendingFiles, projectId, onSuccess])

  const handleClose = useCallback(() => {
    if (isUploading) return
    
    setPendingFiles([])
    setDragActive(false)
    setUploadProgress(0)
    setError(null)
    setSuccess(false)
    onClose()
  }, [isUploading, onClose])

  // ==============================================
  // RENDER
  // ==============================================
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Files
          </DialogTitle>
          <DialogDescription>
            Upload files and documents to {projectName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Display */}
          {success && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Files uploaded successfully!
              </AlertDescription>
            </Alert>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading files...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Default Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Default Settings</CardTitle>
              <CardDescription>
                These settings will be applied to all uploaded files
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Default Folder */}
                <div className="space-y-2">
                  <Label>Default Folder</Label>
                  <Select
                    value={defaultFolder}
                    onValueChange={setDefaultFolder}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FOLDER_OPTIONS.map((folder) => (
                        <SelectItem key={folder.value} value={folder.value}>
                          <div>
                            <div className="font-medium">{folder.label}</div>
                            <div className="text-xs text-gray-500">{folder.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Default Category */}
                <div className="space-y-2">
                  <Label>Default Category</Label>
                  <Select
                    value={defaultCategory}
                    onValueChange={setDefaultCategory}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No category</SelectItem>
                      {CATEGORY_OPTIONS.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Default Visibility */}
                <div className="space-y-2">
                  <Label>Default Visibility</Label>
                  <Select
                    value={defaultIsPublic ? 'public' : 'private'}
                    onValueChange={(value) => setDefaultIsPublic(value === 'public')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* File Drop Zone */}
          <Card>
            <CardContent className="p-6">
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer",
                  dragActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400",
                  isUploading && "pointer-events-none opacity-50"
                )}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <FileType className="mx-auto h-12 w-12 text-red-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Drop PDF files here or click to browse
                </h3>
                <p className="text-gray-600 mb-4">
                  Upload up to {MAX_FILES} PDF files, max {formatFileSize(MAX_FILE_SIZE)} each
                </p>
                <p className="text-sm text-gray-500">
                  Only PDF files are supported (.pdf)
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,application/pdf"
                onChange={handleFileInput}
                className="hidden"
                disabled={isUploading}
              />
            </CardContent>
          </Card>

          {/* Selected Files */}
          {pendingFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Selected Files ({pendingFiles.length})
                </CardTitle>
                <CardDescription>
                  Review and customize settings for each file
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingFiles.map((pendingFile) => {
                  const fileConfig = getFileIcon(pendingFile.file)
                  const FileIcon = fileConfig.icon

                  return (
                    <div
                      key={pendingFile.id}
                      className="flex items-start gap-4 p-4 border rounded-lg"
                    >
                      {/* File Icon & Info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`p-2 rounded ${fileConfig.color.replace('text-', 'bg-').replace('-600', '-100')}`}>
                          <FileIcon className={`h-4 w-4 ${fileConfig.color}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm truncate">
                            {pendingFile.file.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatFileSize(pendingFile.file.size)}
                          </div>
                        </div>
                      </div>

                      {/* File Settings */}
                      <div className="grid grid-cols-3 gap-2 min-w-0 flex-1">
                        <Select
                          value={pendingFile.folder}
                          onValueChange={(value) => 
                            updatePendingFile(pendingFile.id, { folder: value })
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FOLDER_OPTIONS.map((folder) => (
                              <SelectItem key={folder.value} value={folder.value}>
                                {folder.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          value={pendingFile.category}
                          onValueChange={(value) => 
                            updatePendingFile(pendingFile.id, { category: value })
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No category</SelectItem>
                            {CATEGORY_OPTIONS.map((category) => (
                              <SelectItem key={category.value} value={category.value}>
                                {category.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Input
                          placeholder="Version"
                          value={pendingFile.version}
                          onChange={(e) => 
                            updatePendingFile(pendingFile.id, { version: e.target.value })
                          }
                          className="h-8 text-xs"
                        />
                      </div>

                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePendingFile(pendingFile.id)}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                        disabled={isUploading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={pendingFiles.length === 0 || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload {pendingFiles.length} File{pendingFiles.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}