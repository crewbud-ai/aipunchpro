// ==============================================
// src/lib/database/schema/files.ts - File Management
// ==============================================

import { 
  pgTable, 
  uuid, 
  varchar, 
  text, 
  boolean, 
  timestamp,
  integer,
  index
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { projects } from './projects';
import { tasks } from './tasks';
import { users } from './users';

// ==============================================
// PROJECT FILES TABLE (BLUEPRINTS, DOCUMENTS, PHOTOS)
// ==============================================
export const projectFiles = pgTable('project_files', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  
  // File Information
  name: varchar('name', { length: 255 }).notNull(),
  originalName: varchar('original_name', { length: 255 }), // Original filename before processing
  fileUrl: text('file_url').notNull(),
  fileType: varchar('file_type', { length: 50 }), // pdf, jpg, png, dwg, etc.
  fileSize: integer('file_size'), // in bytes
  mimeType: varchar('mime_type', { length: 100 }),
  
  // Organization & Categorization
  folder: varchar('folder', { length: 255 }).default('general'), // blueprints, documents, photos, contracts
  category: varchar('category', { length: 100 }), // architectural, structural, electrical, mechanical
  version: varchar('version', { length: 50 }), // v1.0, rev-a, final, etc.
  description: text('description'),
  tags: text('tags').array(),
  
  // Access Control
  isPublic: boolean('is_public').default(false),
  requiresApproval: boolean('requires_approval').default(false),
  isApproved: boolean('is_approved').default(true),
  
  // File Status
  status: varchar('status', { length: 50 }).default('active'), // active, archived, deleted
  
  // Metadata
  uploadedBy: uuid('uploaded_by').references(() => users.id),
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  
  // Timestamps
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  // Indexes
  projectIdIdx: index('idx_project_files_project_id').on(table.projectId),
  uploadedByIdx: index('idx_project_files_uploaded_by').on(table.uploadedBy),
  folderIdx: index('idx_project_files_folder').on(table.folder),
  categoryIdx: index('idx_project_files_category').on(table.category),
  fileTypeIdx: index('idx_project_files_file_type').on(table.fileType),
  statusIdx: index('idx_project_files_status').on(table.status),
  uploadedAtIdx: index('idx_project_files_uploaded_at').on(table.uploadedAt),
  isPublicIdx: index('idx_project_files_is_public').on(table.isPublic),
}));

// ==============================================
// TASK ATTACHMENTS TABLE (PHOTOS, DOCUMENTS SPECIFIC TO TASKS)
// ==============================================
export const taskAttachments = pgTable('task_attachments', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  taskId: uuid('task_id').references(() => tasks.id, { onDelete: 'cascade' }),
  
  // File Information
  fileName: varchar('file_name', { length: 255 }).notNull(),
  originalName: varchar('original_name', { length: 255 }),
  fileUrl: text('file_url').notNull(),
  fileType: varchar('file_type', { length: 50 }), // jpg, png, pdf, etc.
  fileSize: integer('file_size'),
  mimeType: varchar('mime_type', { length: 100 }),
  
  // Context & Purpose
  attachmentType: varchar('attachment_type', { length: 50 }), // before_photo, after_photo, issue_photo, document
  description: text('description'),
  stage: varchar('stage', { length: 50 }), // start, progress, completion, issue
  
  // Location & Timestamp Data (for photos)
  latitude: varchar('latitude', { length: 20 }),
  longitude: varchar('longitude', { length: 20 }),
  deviceInfo: text('device_info'), // Camera/device information
  
  // Metadata
  uploadedBy: uuid('uploaded_by').references(() => users.id),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow(),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  // Indexes
  taskIdIdx: index('idx_task_attachments_task_id').on(table.taskId),
  uploadedByIdx: index('idx_task_attachments_uploaded_by').on(table.uploadedBy),
  attachmentTypeIdx: index('idx_task_attachments_type').on(table.attachmentType),
  fileTypeIdx: index('idx_task_attachments_file_type').on(table.fileType),
  uploadedAtIdx: index('idx_task_attachments_uploaded_at').on(table.uploadedAt),
  stageIdx: index('idx_task_attachments_stage').on(table.stage),
}));