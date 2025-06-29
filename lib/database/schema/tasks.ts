// ==============================================
// src/lib/database/schema/tasks.ts - Task Management & Punchlist
// ==============================================

import { 
  pgTable, 
  uuid, 
  varchar, 
  text, 
  boolean, 
  timestamp, 
  decimal, 
  date,
  point,
  index
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { companies } from './companies';
import { projects } from './projects';
import { users } from './users';

// ==============================================
// TASKS TABLE (PUNCHLIST ITEMS & WORK ITEMS)
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
  status: varchar('status', { length: 50 }).default('open'), // open, in_progress, completed, cancelled
  priority: varchar('priority', { length: 50 }).default('medium'), // low, medium, high
  category: varchar('category', { length: 100 }), // punchlist, regular_work, inspection, etc.
  trade: varchar('trade', { length: 100 }), // electrical, plumbing, hvac, drywall, etc.
  
  // Assignment & Timeline
  assignedTo: uuid('assigned_to'), // Can reference project_members.id instead of users.id
  assignedToName: varchar('assigned_to_name', { length: 255 }), // For non-system users
  estimatedHours: decimal('estimated_hours', { precision: 4, scale: 2 }),
  actualHours: decimal('actual_hours', { precision: 4, scale: 2 }).default('0'),
  dueDate: date('due_date'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  
  // Location & Details
  location: text('location'),
  floor: varchar('floor', { length: 50 }),
  room: varchar('room', { length: 100 }),
  coordinates: point('coordinates'), // GPS coordinates for outdoor work
  
  // Quality Control & Inspection
  requiresInspection: boolean('requires_inspection').default(false),
  inspectedBy: uuid('inspected_by').references(() => users.id),
  inspectedAt: timestamp('inspected_at', { withTimezone: true }),
  inspectionNotes: text('inspection_notes'),
  inspectionPassed: boolean('inspection_passed'),
  
  // Task Dependencies
  blockedBy: uuid('blocked_by'), // Self-reference to other tasks
  blocksTasks: boolean('blocks_tasks').default(false),
  dependencyNotes: text('dependency_notes'),
  
  // Progress & Notes
  progressNotes: text('progress_notes'),
  contractorNotes: text('contractor_notes'), // Notes from general contractor
  workerNotes: text('worker_notes'), // Notes from assigned worker
  
  // Metadata
  createdBy: uuid('created_by').references(() => users.id),
  tags: text('tags').array(),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  // Indexes for performance
  companyIdIdx: index('idx_tasks_company_id').on(table.companyId),
  projectIdIdx: index('idx_tasks_project_id').on(table.projectId),
  assignedToIdx: index('idx_tasks_assigned_to').on(table.assignedTo),
  statusIdx: index('idx_tasks_status').on(table.status),
  priorityIdx: index('idx_tasks_priority').on(table.priority),
  categoryIdx: index('idx_tasks_category').on(table.category),
  tradeIdx: index('idx_tasks_trade').on(table.trade),
  dueDateIdx: index('idx_tasks_due_date').on(table.dueDate),
  blockedByIdx: index('idx_tasks_blocked_by').on(table.blockedBy),
  createdByIdx: index('idx_tasks_created_by').on(table.createdBy),
  createdAtIdx: index('idx_tasks_created_at').on(table.createdAt),
  requiresInspectionIdx: index('idx_tasks_requires_inspection').on(table.requiresInspection),
}));