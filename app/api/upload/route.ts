// ==============================================
// app/api/upload/route.ts - Generic File Upload Endpoint
// ==============================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// ==============================================
// UPLOAD CONFIGURATION
// ==============================================
const UPLOAD_CONFIG = {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedDocumentTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv'
    ],
    bucketName: 'project-files',
    
    // Folder structure based on category and type
    getFolderPath: (category: string, type: string, entityId?: string): string => {
        const timestamp = Date.now()
        
        switch (category) {
            case 'punchlist':
                return entityId 
                    ? `punchlist/${type}/${entityId}` 
                    : `punchlist/${type}/temp/${timestamp}`
            
            case 'project':
                return entityId 
                    ? `projects/${type}/${entityId}` 
                    : `projects/${type}/temp/${timestamp}`
            
            case 'team':
                return entityId 
                    ? `team/${type}/${entityId}` 
                    : `team/${type}/temp/${timestamp}`
                    
            case 'reports':
                return entityId 
                    ? `reports/${type}/${entityId}` 
                    : `reports/${type}/temp/${timestamp}`
                    
            default:
                return `uploads/${category}/${type}/temp/${timestamp}`
        }
    }
}

// ==============================================
// VALIDATION HELPERS
// ==============================================
function validateFileType(file: File, type: string): boolean {
    if (type === 'photos') {
        return UPLOAD_CONFIG.allowedImageTypes.includes(file.type)
    } else if (type === 'attachments' || type === 'documents') {
        return [...UPLOAD_CONFIG.allowedImageTypes, ...UPLOAD_CONFIG.allowedDocumentTypes].includes(file.type)
    }
    return true // Allow all types for other categories
}

function validateFileSize(file: File): boolean {
    return file.size <= UPLOAD_CONFIG.maxFileSize
}

// ==============================================
// POST /api/upload - Generic File Upload
// ==============================================
export async function POST(request: NextRequest) {
    try {
        // Get user info from middleware
        const userId = request.headers.get('x-user-id')
        const companyId = request.headers.get('x-company-id')

        if (!userId || !companyId) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Authentication required',
                    message: 'You must be logged in to upload files.',
                },
                { status: 401 }
            )
        }

        // Parse form data
        const formData = await request.formData()
        const file = formData.get('file') as File
        const type = formData.get('type') as string || 'attachments'
        const category = formData.get('category') as string || 'general'
        const entityId = formData.get('entityId') as string || undefined

        if (!file) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'No file provided',
                    message: 'Please select a file to upload.',
                },
                { status: 400 }
            )
        }

        // Validate file type
        if (!validateFileType(file, type)) {
            const allowedTypes = type === 'photos' 
                ? 'Images (JPG, PNG, GIF, WebP)' 
                : 'Images and Documents (PDF, Word, Excel, etc.)'
            
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid file type',
                    message: `Only ${allowedTypes} are allowed for ${type}.`,
                },
                { status: 400 }
            )
        }

        // Validate file size
        if (!validateFileSize(file)) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'File too large',
                    message: `File size must be less than ${UPLOAD_CONFIG.maxFileSize / (1024 * 1024)}MB.`,
                },
                { status: 400 }
            )
        }

        // Initialize Supabase client
        const supabase = createServerClient()

        // Generate unique filename
        const timestamp = Date.now()
        const randomString = Math.random().toString(36).substring(2, 15)
        const fileExtension = file.name.split('.').pop()
        const fileName = `${timestamp}-${randomString}.${fileExtension}`
        
        // Get folder path based on category and type
        const folderPath = UPLOAD_CONFIG.getFolderPath(category, type, entityId)
        const filePath = `${folderPath}/${fileName}`

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from(UPLOAD_CONFIG.bucketName)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            })

        if (error) {
            console.error('Supabase upload error:', error)
            return NextResponse.json(
                {
                    success: false,
                    error: 'Upload failed',
                    message: `Failed to upload file: ${error.message}`,
                },
                { status: 500 }
            )
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(UPLOAD_CONFIG.bucketName)
            .getPublicUrl(filePath)

        if (!urlData.publicUrl) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'URL generation failed',
                    message: 'Failed to get public URL for uploaded file.',
                },
                { status: 500 }
            )
        }

        return NextResponse.json(
            {
                success: true,
                url: urlData.publicUrl,
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                uploadPath: filePath,
                category,
                type,
                entityId,
                message: 'File uploaded successfully.',
            },
            { status: 200 }
        )

    } catch (error) {
        console.error('Error in upload endpoint:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                message: 'An unexpected error occurred during file upload.',
            },
            { status: 500 }
        )
    }
}

// ==============================================
// DELETE /api/upload - Generic File Deletion
// ==============================================
export async function DELETE(request: NextRequest) {
    try {
        // Get user info from middleware
        const userId = request.headers.get('x-user-id')
        const companyId = request.headers.get('x-company-id')

        if (!userId || !companyId) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Authentication required',
                    message: 'You must be logged in to delete files.',
                },
                { status: 401 }
            )
        }

        // Parse request body
        const { url } = await request.json()

        if (!url) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'No URL provided',
                    message: 'File URL is required for deletion.',
                },
                { status: 400 }
            )
        }

        // Initialize Supabase client
        const supabase = createServerClient()
        
        // Extract file path from URL
        const urlObj = new URL(url)
        const pathParts = urlObj.pathname.split(`/storage/v1/object/public/${UPLOAD_CONFIG.bucketName}/`)
        if (pathParts.length < 2) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid URL format',
                    message: 'Cannot extract file path from URL.',
                },
                { status: 400 }
            )
        }
        
        const filePath = pathParts[1]

        // Delete from Supabase Storage
        const { error } = await supabase.storage
            .from(UPLOAD_CONFIG.bucketName)
            .remove([filePath])

        if (error) {
            console.error('Supabase delete error:', error)
            return NextResponse.json(
                {
                    success: false,
                    error: 'Delete failed',
                    message: `Failed to delete file: ${error.message}`,
                },
                { status: 500 }
            )
        }

        return NextResponse.json(
            {
                success: true,
                message: 'File deleted successfully.',
            },
            { status: 200 }
        )

    } catch (error) {
        console.error('Error in delete endpoint:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                message: 'An unexpected error occurred during file deletion.',
            },
            { status: 500 }
        )
    }
}