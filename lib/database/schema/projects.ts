// ==============================================
// src/lib/database/schema/projects.ts
// ==============================================

import { 
  pgTable, 
  uuid, 
  varchar, 
  text, 
  boolean, 
  timestamp, 
  integer, 
  decimal, 
  date, 
  time,
  jsonb, 
  point,
  inet,
  check,
  unique,
  index
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { companies } from './companies';
import { users } from './users';

// ==============================================
// PROJECTS TABLE (CONSTRUCTION PROJECTS)
// ==============================================
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  
  // Project Information
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  projectNumber: varchar('project_number', { length: 100 }),
  
  // Status & Priority
  status: varchar('status', { length: 50 }).default('planning'),
  priority: varchar('priority', { length: 50 }).default('medium'),
  
  // Financial
  budget: decimal('budget', { precision: 12, scale: 2 }),
  spent: decimal('spent', { precision: 12, scale: 2 }).default('0'),
  
  // Progress & Timeline
  progress: integer('progress').default(0),
  startDate: date('start_date'),
  endDate: date('end_date'),
  estimatedHours: integer('estimated_hours'),
  actualHours: integer('actual_hours').default(0),
  
  // Location & Details
  location: text('location'),
  address: text('address'),
  clientName: varchar('client_name', { length: 255 }),
  clientContact: text('client_contact'),
  
  // Team Management
  projectManagerId: uuid('project_manager_id').references(() => users.id),
  foremanId: uuid('foreman_id').references(() => users.id),
  
  // Metadata
  createdBy: uuid('created_by').references(() => users.id),
  tags: text('tags').array(),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  progressCheck: check('progress_check', sql`${table.progress} >= 0 AND ${table.progress} <= 100`),
  companyIdIdx: index('idx_projects_company_id').on(table.companyId),
  statusIdx: index('idx_projects_status').on(table.status),
  managerIdx: index('idx_projects_manager').on(table.projectManagerId),
  datesIdx: index('idx_projects_dates').on(table.startDate, table.endDate),
}));

// ==============================================
// PROJECT MEMBERS (TEAM ASSIGNMENTS)
// ==============================================
export const projectMembers = pgTable('project_members', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  
  // Role & Rates
  role: varchar('role', { length: 100 }),
  hourlyRate: decimal('hourly_rate', { precision: 8, scale: 2 }),
  overtimeRate: decimal('overtime_rate', { precision: 8, scale: 2 }),
  
  // Permissions
  canEdit: boolean('can_edit').default(false),
  canManageTasks: boolean('can_manage_tasks').default(false),
  canViewFinancials: boolean('can_view_financials').default(false),
  
  // Status
  isActive: boolean('is_active').default(true),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow(),
  leftAt: timestamp('left_at', { withTimezone: true }),
}, (table) => ({
  projectUserUnique: unique('project_user_unique').on(table.projectId, table.userId),
}));

// ==============================================
// TASKS TABLE (PUNCHLIST ITEMS)
// ==============================================
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  
  // Task Information
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  taskNumber: varchar('task_number', { length: 100 }),
  
  // Classification
  status: varchar('status', { length: 50 }).default('open'),
  priority: varchar('priority', { length: 50 }).default('medium'),
  category: varchar('category', { length: 100 }),
  trade: varchar('trade', { length: 100 }),
  
  // Assignment & Timeline
  assignedTo: uuid('assigned_to').references(() => users.id),
  estimatedHours: decimal('estimated_hours', { precision: 4, scale: 2 }),
  actualHours: decimal('actual_hours', { precision: 4, scale: 2 }).default('0'),
  dueDate: date('due_date'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  
  // Location & Details
  location: text('location'),
  floor: varchar('floor', { length: 50 }),
  room: varchar('room', { length: 100 }),
  coordinates: point('coordinates'),
  
  // Quality Control
  requiresInspection: boolean('requires_inspection').default(false),
  inspectedBy: uuid('inspected_by').references(() => users.id),
  inspectedAt: timestamp('inspected_at', { withTimezone: true }),
  inspectionNotes: text('inspection_notes'),
  
  // Dependencies (self-reference fixed)
  blockedBy: uuid('blocked_by'),
  blocksTasks: boolean('blocks_tasks').default(false),
  
  // Metadata
  createdBy: uuid('created_by').references(() => users.id),
  tags: text('tags').array(),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  companyIdIdx: index('idx_tasks_company_id').on(table.companyId),
  projectIdIdx: index('idx_tasks_project_id').on(table.projectId),
  assignedToIdx: index('idx_tasks_assigned_to').on(table.assignedTo),
  statusIdx: index('idx_tasks_status').on(table.status),
  dueDateIdx: index('idx_tasks_due_date').on(table.dueDate),
  categoryIdx: index('idx_tasks_category').on(table.category),
  blockedByIdx: index('idx_tasks_blocked_by').on(table.blockedBy),
}));

// ==============================================
// TASK ATTACHMENTS (IMAGES & FILES)
// ==============================================
export const taskAttachments = pgTable('task_attachments', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  taskId: uuid('task_id').references(() => tasks.id, { onDelete: 'cascade' }),
  
  // File Information
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileUrl: text('file_url').notNull(),
  fileType: varchar('file_type', { length: 50 }),
  fileSize: integer('file_size'),
  mimeType: varchar('mime_type', { length: 100 }),
  
  // Context
  attachmentType: varchar('attachment_type', { length: 50 }),
  description: text('description'),
  
  // Metadata
  uploadedBy: uuid('uploaded_by').references(() => users.id),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow(),
});

// ==============================================
// TIME TRACKING
// ==============================================
export const timeEntries = pgTable('time_entries', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  taskId: uuid('task_id').references(() => tasks.id, { onDelete: 'set null' }),
  
  // Time Details
  date: date('date').notNull(),
  startTime: time('start_time'),
  endTime: time('end_time'),
  breakMinutes: integer('break_minutes').default(0),
  
  // Calculated Hours
  regularHours: decimal('regular_hours', { precision: 4, scale: 2 }).default('0'),
  overtimeHours: decimal('overtime_hours', { precision: 4, scale: 2 }).default('0'),
  totalHours: decimal('total_hours', { precision: 4, scale: 2 }).notNull(),
  
  // Rates & Calculation
  hourlyRate: decimal('hourly_rate', { precision: 8, scale: 2 }),
  overtimeRate: decimal('overtime_rate', { precision: 8, scale: 2 }),
  totalPay: decimal('total_pay', { precision: 10, scale: 2 }),
  
  // Description & Context
  description: text('description'),
  workType: varchar('work_type', { length: 100 }),
  
  // Approval Workflow
  status: varchar('status', { length: 50 }).default('pending'),
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  rejectionReason: text('rejection_reason'),
  
  // Location tracking
  clockInLocation: point('clock_in_location'),
  clockOutLocation: point('clock_out_location'),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  companyIdIdx: index('idx_time_entries_company_id').on(table.companyId),
  userIdIdx: index('idx_time_entries_user_id').on(table.userId),
  projectIdIdx: index('idx_time_entries_project_id').on(table.projectId),
  dateIdx: index('idx_time_entries_date').on(table.date),
  statusIdx: index('idx_time_entries_status').on(table.status),
}));

// ==============================================
// PROJECT FILES & DOCUMENTS
// ==============================================
export const projectFiles = pgTable('project_files', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  
  // File Information
  name: varchar('name', { length: 255 }).notNull(),
  fileUrl: text('file_url').notNull(),
  fileType: varchar('file_type', { length: 50 }),
  fileSize: integer('file_size'),
  mimeType: varchar('mime_type', { length: 100 }),
  
  // Organization
  folder: varchar('folder', { length: 255 }).default('general'),
  version: varchar('version', { length: 50 }),
  description: text('description'),
  tags: text('tags').array(),
  
  // Access Control
  isPublic: boolean('is_public').default(false),
  
  // Metadata
  uploadedBy: uuid('uploaded_by').references(() => users.id),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow(),
});