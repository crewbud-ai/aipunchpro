// ==============================================
// src/lib/database/schema/punchlist-items.ts
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
  unique,
  index
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { projects } from './projects';
import { users } from './users';
import { companies } from './companies';
import { projectMembers } from './project-members';
import { scheduleProjects } from './schedule-projects';

// ==============================================
// PUNCHLIST STATUS & PRIORITY ENUMS
// ==============================================
export const PUNCHLIST_STATUS = [
  'open',
  'assigned',
  'in_progress',
  'completed',
  'rejected'
] as const;

export const PUNCHLIST_PRIORITY = [
  'low',
  'medium',
  'high', 
  'critical'
] as const;

export const ISSUE_TYPE = [
  'defect',
  'incomplete',
  'change_request',
  'safety',
  'quality',
  'rework'
] as const;

export const TRADE_CATEGORY = [
  'electrical',
  'plumbing',
  'framing',
  'drywall',
  'roofing',
  'concrete',
  'hvac',
  'general',
  'management',
  'safety',
  'cleanup'
] as const;

// ==============================================
// PUNCHLIST ITEMS TABLE
// ==============================================
export const punchlistItems = pgTable('punchlist_items', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  relatedScheduleProjectId: uuid('related_schedule_project_id').references(() => scheduleProjects.id, { onDelete: 'set null' }), // nullable for standalone issues
  
  // Issue Details
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  issueType: varchar('issue_type', { length: 50 }).default('defect').notNull(),
  
  // Location & Context
  location: text('location'),
  roomArea: varchar('room_area', { length: 100 }),
  
  // Assignment (Links to single project_member ID)
  assignedProjectMemberId: uuid('assigned_project_member_id').references(() => projectMembers.id, { onDelete: 'set null' }),
  tradeCategory: varchar('trade_category', { length: 100 }),
  reportedBy: uuid('reported_by').references(() => users.id).notNull(),
  
  // Priority & Status
  priority: varchar('priority', { length: 50 }).default('medium').notNull(),
  status: varchar('status', { length: 50 }).default('open').notNull(),
  
  // Media & Documentation
  photos: text('photos').array(), // Array of file URLs
  attachments: text('attachments').array(), // Array of file URLs
  
  // Scheduling & Estimates
  dueDate: date('due_date'),
  estimatedHours: decimal('estimated_hours', { precision: 6, scale: 2 }),
  actualHours: decimal('actual_hours', { precision: 6, scale: 2 }).default('0'),
  
  // Resolution Details
  resolutionNotes: text('resolution_notes'),
  rejectionReason: text('rejection_reason'), // If status is 'rejected'
  
  // Quality Control
  requiresInspection: boolean('requires_inspection').default(false),
  inspectedBy: uuid('inspected_by').references(() => users.id),
  inspectedAt: timestamp('inspected_at', { withTimezone: true }),
  inspectionPassed: boolean('inspection_passed'),
  inspectionNotes: text('inspection_notes'),
  
  // Metadata
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  assignedAt: timestamp('assigned_at', { withTimezone: true }),
}, (table) => ({
  // Performance Indexes
  companyIdIdx: index('idx_punchlist_items_company_id').on(table.companyId),
  projectIdIdx: index('idx_punchlist_items_project_id').on(table.projectId),
  relatedScheduleProjectIdIdx: index('idx_punchlist_items_related_schedule_project_id').on(table.relatedScheduleProjectId),
  assignedProjectMemberIdIdx: index('idx_punchlist_items_assigned_project_member_id').on(table.assignedProjectMemberId),
  statusIdx: index('idx_punchlist_items_status').on(table.status),
  priorityIdx: index('idx_punchlist_items_priority').on(table.priority),
  issueTypeIdx: index('idx_punchlist_items_issue_type').on(table.issueType),
  tradeCategoryIdx: index('idx_punchlist_items_trade_category').on(table.tradeCategory),
  reportedByIdx: index('idx_punchlist_items_reported_by').on(table.reportedBy),
  dueDateIdx: index('idx_punchlist_items_due_date').on(table.dueDate),
  createdAtIdx: index('idx_punchlist_items_created_at').on(table.createdAt),
  requiresInspectionIdx: index('idx_punchlist_items_requires_inspection').on(table.requiresInspection),
  inspectedByIdx: index('idx_punchlist_items_inspected_by').on(table.inspectedBy),
  
  // Composite indexes for common queries
  projectStatusIdx: index('idx_punchlist_items_project_status').on(table.projectId, table.status),
  companyStatusIdx: index('idx_punchlist_items_company_status').on(table.companyId, table.status),
  assignedMemberStatusIdx: index('idx_punchlist_items_assigned_member_status').on(table.assignedProjectMemberId, table.status),
  priorityStatusIdx: index('idx_punchlist_items_priority_status').on(table.priority, table.status),
  dueDateStatusIdx: index('idx_punchlist_items_due_date_status').on(table.dueDate, table.status),
}));

// ==============================================
// INFER TYPES FROM SCHEMA
// ==============================================
export type PunchlistItem = typeof punchlistItems.$inferSelect;
export type NewPunchlistItem = typeof punchlistItems.$inferInsert;

// ==============================================
// PUNCHLIST STATUS & TYPE EXPORTS
// ==============================================
export type PunchlistStatus = typeof PUNCHLIST_STATUS[number];
export type PunchlistPriority = typeof PUNCHLIST_PRIORITY[number];
export type IssueType = typeof ISSUE_TYPE[number];
export type TradeCategory = typeof TRADE_CATEGORY[number];

// ==============================================
// PUNCHLIST ITEM CALCULATED STATUS (APPLICATION LEVEL)
// ==============================================
export const PUNCHLIST_ITEM_CALCULATED_STATUS = [
  'overdue',        // Due date passed and not completed
  'due_today',      // Due date is today
  'due_soon',       // Due date within next 3 days
  'on_track',       // Has due date and within timeline
  'no_due_date'     // No due date set
] as const;

export type PunchlistItemCalculatedStatus = typeof PUNCHLIST_ITEM_CALCULATED_STATUS[number];

// Helper function to calculate punchlist item timeline status
export const calculatePunchlistItemTimelineStatus = (
  dueDate: Date | null, 
  status: PunchlistStatus
): PunchlistItemCalculatedStatus => {
  if (status === 'completed') return 'on_track';
  if (!dueDate) return 'no_due_date';
  
  const today = new Date();
  const dueDateObj = new Date(dueDate);
  const diffTime = dueDateObj.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'overdue';
  if (diffDays === 0) return 'due_today';
  if (diffDays <= 3) return 'due_soon';
  return 'on_track';
};