// ==============================================
// app/(dashboard)/dashboard/projects/[id]/components/blueprints/FileUploadDialog.tsx
// ==============================================

"use client"

import React, { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  X,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
  CloudUpload,
  FileIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useProjectFiles } from "@/hooks/projects/use-project-files"

// ==============================================
// INTERFACES & TYPES
// ==============================================
interface FileUploadDialogProps {
  projectId: string
  projectName: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: (file: any) => void
}

interface PendingFile {
  file: File
  id: string
  description: string
  version: string
}

// ==============================================
// CONSTANTS
// ==============================================
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_FILE_TYPES = ['application/pdf'] // Only PDF files allowed
const ALLOWED_FILE_EXTENSIONS = ['.pdf'] // Only PDF extensions

// ==============================================
// UTILITY FUNCTIONS
// ==============================================
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
  // HOOKS
  // ==============================================
  const { uploadFile, isUploading, uploadProgress, error, clearError } = useProjectFiles()

  // ==============================================
  // STATE
  // ==============================================
  const [pendingFile, setPendingFile] = useState<PendingFile | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ==============================================
  // COMPUTED PROPERTIES
  // ==============================================
  const hasError = error || localError
  const currentError = error || localError

  // ==============================================
  // HANDLERS
  // ==============================================
  const handleClose = useCallback(() => {
    if (isUploading) return // Don't close while uploading
    
    setPendingFile(null)
    setLocalError(null)
    setSuccess(false)
    clearError()
    onClose()
  }, [isUploading, clearError, onClose])

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return `"${file.name}" is not a PDF file. Only PDF files are allowed.`
    }

    // Check file extension
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!ALLOWED_FILE_EXTENSIONS.includes(fileExtension)) {
      return `"${file.name}" is not a PDF file. Only PDF files are allowed.`
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `"${file.name}" is too large (max ${formatFileSize(MAX_FILE_SIZE)})`
    }

    return null
  }, [])

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0] // Only take the first file
    
    setLocalError(null)
    setSuccess(false)

    const validationError = validateFile(file)
    if (validationError) {
      setLocalError(validationError)
      return
    }

    setPendingFile({
      file,
      id: generateFileId(),
      description: '',
      version: '1.0',
    })
  }, [validateFile])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files)
  }, [handleFileSelect])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect])

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

  const updateFileData = useCallback((updates: Partial<PendingFile>) => {
    setPendingFile(prev => prev ? { ...prev, ...updates } : null)
  }, [])

  const removePendingFile = useCallback(() => {
    setPendingFile(null)
    setLocalError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleUpload = useCallback(async () => {
    if (!pendingFile) return

    setLocalError(null)
    setSuccess(false)

    try {
      const uploadedFile = await uploadFile(
        projectId,
        pendingFile.file,
        pendingFile.description,
        pendingFile.version
      )

      if (uploadedFile) {
        setSuccess(true)
        onSuccess?.(uploadedFile)
        
        // Auto-close after success
        setTimeout(() => {
          handleClose()
        }, 1500)
      }
    } catch (err: any) {
      setLocalError(err.message || 'Upload failed')
    }
  }, [pendingFile, projectId, uploadFile, onSuccess, handleClose])

  // ==============================================
  // RENDER
  // ==============================================
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Blueprint</DialogTitle>
          <DialogDescription>
            Upload a PDF blueprint for {projectName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Drop Zone */}
          {!pendingFile && (
            <Card
              className={cn(
                "border-2 border-dashed transition-colors cursor-pointer",
                dragActive 
                  ? "border-blue-500 bg-blue-50" 
                  : "border-gray-300 hover:border-gray-400"
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <CloudUpload className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Drop your PDF here, or click to browse
                </p>
                <p className="text-sm text-gray-600">
                  Only PDF files up to {formatFileSize(MAX_FILE_SIZE)} are allowed
                </p>
              </CardContent>
            </Card>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleInputChange}
            className="hidden"
          />

          {/* Selected File */}
          {pendingFile && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <FileIcon className="h-8 w-8 text-red-600" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {pendingFile.file.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatFileSize(pendingFile.file.size)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removePendingFile}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* File Details Form */}
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="version">Version</Label>
                    <Input
                      id="version"
                      value={pendingFile.version}
                      onChange={(e) => updateFileData({ version: e.target.value })}
                      placeholder="e.g., 1.0, Rev A"
                      disabled={isUploading}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={pendingFile.description}
                      onChange={(e) => updateFileData({ description: e.target.value })}
                      placeholder="Brief description of this blueprint..."
                      rows={3}
                      disabled={isUploading}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* Success Message */}
          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Blueprint uploaded successfully! The dialog will close shortly.
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {hasError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {currentError}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!pendingFile || isUploading || success}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : success ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Uploaded
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Blueprint
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}