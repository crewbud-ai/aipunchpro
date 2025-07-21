// ==============================================
// lib/database/services/project-files.ts - Project Files Database Service (Fixed to Match Your Patterns)
// ==============================================

import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { createBrowserClient } from '@/lib/supabase/client'
import type { CreateProjectFileInput } from '@/lib/validations/projects/project-files'

// ==============================================
// INTERFACES & TYPES
// ==============================================
interface CreateProjectFileData extends Omit<CreateProjectFileInput, 'file'> {
    companyId: string
    uploadedBy: string
    file: File
}

interface GetProjectFilesOptions {
    folder?: string
    category?: string
    status?: string
    search?: string
    sortBy?: 'name' | 'uploadedAt' | 'fileSize' | 'version'
    sortOrder?: 'asc' | 'desc'
    limit?: number
    offset?: number
}

// ==============================================
// PROJECT FILES DATABASE SERVICE
// ==============================================
export class ProjectFilesDatabaseService {
    private supabaseClient: ReturnType<typeof createServerClient>
    private enableLogging: boolean
    private enableCache: boolean

    constructor(enableLogging = false, enableCache = false) {
        this.enableLogging = enableLogging
        this.enableCache = enableCache

        // Initialize Supabase client (following your exact pattern)
        this.supabaseClient = createServerClient()
    }

    // ==============================================
    // LOGGING HELPER
    // ==============================================
    private log(message: string, data?: any) {
        if (this.enableLogging) {
            console.log(`[ProjectFilesService] ${message}`, data || '')
        }
    }

    // ==============================================
    // FILE UPLOAD TO SUPABASE STORAGE
    // ==============================================
    private async uploadFileToStorage(file: File, projectId: string): Promise<{
        fileName: string
        fileUrl: string
        filePath: string
    }> {
        // Generate unique filename
        const timestamp = Date.now()
        const randomString = Math.random().toString(36).substring(2, 15)
        const fileExtension = file.name.split('.').pop()
        const fileName = `${timestamp}-${randomString}.${fileExtension}`

        // Create folder path for blueprints
        const folderPath = `projects/blueprints/${projectId}`
        const filePath = `${folderPath}/${fileName}`

        this.log('Uploading file to Supabase Storage', { fileName, filePath })

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await this.supabaseClient.storage
            .from('project-files')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            })

        if (uploadError) {
            this.log('Supabase upload error', uploadError)
            throw new Error(`Failed to upload file: ${uploadError.message}`)
        }

        // Get public URL
        const { data: urlData } = this.supabaseClient.storage
            .from('project-files')
            .getPublicUrl(filePath)

        if (!urlData.publicUrl) {
            throw new Error('Failed to get public URL for uploaded file')
        }

        return {
            fileName,
            fileUrl: urlData.publicUrl,
            filePath,
        }
    }

    // ==============================================
    // CREATE PROJECT FILE
    // ==============================================
    async createProjectFile(data: CreateProjectFileData) {
        this.log('Creating project file', { projectId: data.projectId })

        try {
            // Upload file to Supabase Storage
            const { fileName, fileUrl } = await this.uploadFileToStorage(data.file, data.projectId)

            // Get file extension
            const fileExtension = data.file.name.split('.').pop() || 'pdf'

            // Insert file record into database (following your pattern)
            const { data: newFile, error } = await this.supabaseClient
                .from('project_files')
                .insert({
                    project_id: data.projectId,
                    name: fileName,
                    original_name: data.file.name,
                    file_url: fileUrl,
                    file_type: fileExtension,
                    file_size: data.file.size,
                    mime_type: data.file.type,
                    folder: data.folder,
                    category: data.category,
                    version: data.version,
                    description: data.description,
                    tags: data.tags,
                    is_public: data.isPublic,
                    uploaded_by: data.uploadedBy,
                    status: 'active',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .select()
                .single()

            if (error) throw error

            this.log('Project file created successfully', { fileId: newFile.id })
            return newFile

        } catch (error) {
            this.log('Error creating project file', error)
            throw error
        }
    }

    // ==============================================
    // GET PROJECT FILES
    // ==============================================
    async getProjectFiles(projectId: string, options: GetProjectFilesOptions = {}) {
        this.log('Getting project files', { projectId, options })

        try {
            // Build base query (following your pattern)
            let query = this.supabaseClient
                .from('project_files')
                .select(`
          *,
          uploader:users!project_files_uploaded_by_users_id_fk(
            id,
            first_name,
            last_name,
            email
          )
        `)
                .eq('project_id', projectId)
                .eq('status', 'active')

            // Apply filters
            if (options.folder) {
                query = query.eq('folder', options.folder)
            }

            if (options.category) {
                query = query.eq('category', options.category)
            }

            if (options.search) {
                query = query.or(`original_name.ilike.%${options.search}%,description.ilike.%${options.search}%,version.ilike.%${options.search}%`)
            }

            // Apply sorting
            const sortField = options.sortBy || 'uploaded_at'
            const sortOrder = options.sortOrder || 'desc'

            if (sortField === 'name') {
                query = query.order('original_name', { ascending: sortOrder === 'asc' })
            } else if (sortField === 'uploadedAt') {
                query = query.order('uploaded_at', { ascending: sortOrder === 'asc' })
            } else if (sortField === 'fileSize') {
                query = query.order('file_size', { ascending: sortOrder === 'asc' })
            } else if (sortField === 'version') {
                query = query.order('version', { ascending: sortOrder === 'asc' })
            }

            // Apply pagination
            const limit = options.limit || 50
            const offset = options.offset || 0

            const { data: files, error, count } = await query
                .range(offset, offset + limit - 1)
                .limit(limit)

            if (error) throw error

            // Get total count for pagination
            const { count: totalCount, error: countError } = await this.supabaseClient
                .from('project_files')
                .select('*', { count: 'exact', head: true })
                .eq('project_id', projectId)
                .eq('status', 'active')

            if (countError) throw countError

            this.log('Project files retrieved', { count: files?.length || 0, totalCount })

            return {
                files: files || [],
                totalCount: totalCount || 0,
            }

        } catch (error) {
            this.log('Error getting project files', error)
            throw error
        }
    }

    // ==============================================
    // GET PROJECT FILE BY ID
    // ==============================================
    async getProjectFileById(fileId: string, projectId: string) {
        this.log('Getting project file by ID', { fileId, projectId })

        try {
            const { data: file, error } = await this.supabaseClient
                .from('project_files')
                .select(`
          *,
          uploader:users!project_files_uploaded_by_users_id_fk(
            id,
            first_name,
            last_name,
            email
          )
        `)
                .eq('id', fileId)
                .eq('project_id', projectId)
                .single()

            if (error) {
                if (error.code === 'PGRST116') { // not found
                    throw new Error('Project file not found')
                }
                throw error
            }

            this.log('Project file retrieved by ID', { fileId })
            return file

        } catch (error) {
            this.log('Error getting project file by ID', error)
            throw error
        }
    }

    // ==============================================
    // UPDATE PROJECT FILE
    // ==============================================
    async updateProjectFile(
        fileId: string,
        projectId: string,
        updates: {
            version?: string
            description?: string
            isPublic?: boolean
            tags?: string[]
            status?: string
        }
    ): Promise<void> {
        this.log('Updating project file', { fileId, projectId, updates })

        try {
            const { error } = await this.supabaseClient
                .from('project_files')
                .update({
                    ...updates,
                    is_public: updates.isPublic, // Map camelCase to snake_case
                    updated_at: new Date().toISOString()
                })
                .eq('id', fileId)
                .eq('project_id', projectId)

            if (error) throw error

            this.log('Project file updated successfully', { fileId })

        } catch (error) {
            this.log('Error updating project file', error)
            throw error
        }
    }

    // ==============================================
    // DELETE PROJECT FILE
    // ==============================================
    async deleteProjectFile(fileId: string, projectId: string): Promise<void> {
        this.log('Permanently deleting project file', { fileId, projectId })

        try {
            // Get file details first for storage cleanup
            const file = await this.getProjectFileById(fileId, projectId)

            if (!file) {
                throw new Error('Project file not found')
            }

            console.log('Full file URL:', file.file_url)

            // Extract file path from URL for storage deletion
            const url = new URL(file.file_url)
            console.log('URL pathname:', url.pathname)

            let filePath = ''

            if (url.pathname.includes('/storage/v1/object/public/project-files/')) {
                // Extract everything after the bucket name
                filePath = url.pathname.split('/storage/v1/object/public/project-files/')[1]
            } else if (url.pathname.includes('/project-files/')) {
                // Alternative URL format
                filePath = url.pathname.split('/project-files/')[1]
            } else {
                // Fallback - try to construct from known structure
                filePath = `projects/blueprints/${projectId}/${file.name}`
            }

            console.log('Extracted file path for deletion:', filePath)

            // Delete from Supabase Storage FIRST
            const { error: storageError } = await this.supabaseClient.storage
                .from('project-files')
                .remove([filePath])

            if (storageError) {
                console.error('Storage deletion failed:', storageError)
                throw new Error(`Failed to delete file from storage: ${storageError.message}`)
            }

            console.log('File deleted from storage successfully')

            // PERMANENTLY delete from database (not just status update)
            const { error: dbError } = await this.supabaseClient
                .from('project_files')
                .delete()
                .eq('id', fileId)
                .eq('project_id', projectId)

            if (dbError) {
                throw new Error(`Failed to delete file from database: ${dbError.message}`)
            }

            console.log('File permanently deleted from database')
            this.log('Project file permanently deleted', { fileId })

        } catch (error) {
            this.log('Error deleting project file', error)
            console.error('Full deletion error:', error)
            throw error
        }
    }

    // ==============================================
    // CHECK PROJECT FILE EXISTS
    // ==============================================
    async checkProjectFileExists(fileId: string, projectId: string): Promise<boolean> {
        this.log('Checking if project file exists', { fileId, projectId })

        try {
            const { data: file, error } = await this.supabaseClient
                .from('project_files')
                .select('id')
                .eq('id', fileId)
                .eq('project_id', projectId)
                .eq('status', 'active')
                .single()

            if (error && error.code !== 'PGRST116') { // PGRST116 = not found
                throw error
            }

            const exists = !!file
            this.log('Project file exists check result', { fileId, exists })
            return exists

        } catch (error) {
            this.log('Error checking project file exists', error)
            throw error
        }
    }
}