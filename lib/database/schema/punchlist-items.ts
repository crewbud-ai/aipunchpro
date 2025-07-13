// ==============================================
// src/lib/database/schema/punchlist-items.ts - UPDATED WITH MULTIPLE ASSIGNMENTS
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
  'pending_review',
  'completed',
  'rejected',
  'on_hold'
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
  'general',
  'electrical',
  'plumbing',
  'hvac',
  'framing',
  'drywall',
  'flooring',
  'painting',
  'roofing',
  'concrete',
  'masonry',
  'landscaping',
  'cleanup'
] as const;

// ==============================================
// ASSIGNMENT ROLES
// ==============================================
export const ASSIGNMENT_ROLE = [
  'primary',      // Main responsible person
  'secondary',    // Helper/assistant
  'inspector',    // Quality control
  'supervisor'    // Oversight
] as const;

export type AssignmentRole = typeof ASSIGNMENT_ROLE[number];

// ==============================================
// PUNCHLIST ITEMS TABLE (UPDATED)
// ==============================================
export const punchlistItems = pgTable('punchlist_items', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  relatedScheduleProjectId: uuid('related_schedule_project_id').references(() => scheduleProjects.id, { onDelete: 'set null' }),
  
  // Issue Details
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  issueType: varchar('issue_type', { length: 50 }).default('defect').notNull(),
  
  // Location & Context
  location: text('location'),
  roomArea: varchar('room_area', { length: 100 }),
  
  // REMOVED: Single assignment field
  // assignedProjectMemberId: uuid('assigned_project_member_id')... // REMOVED
  
  tradeCategory: varchar('trade_category', { length: 100 }),
  reportedBy: uuid('reported_by').references(() => users.id).notNull(),
  
  // Priority & Status
  priority: varchar('priority', { length: 50 }).default('medium').notNull(),
  status: varchar('status', { length: 50 }).default('open').notNull(),
  
  // Media & Documentation
  photos: text('photos').array().default([]),
  attachments: text('attachments').array().default([]),
  
  // Scheduling & Estimates
  dueDate: date('due_date'),
  estimatedHours: decimal('estimated_hours', { precision: 6, scale: 2 }),
  actualHours: decimal('actual_hours', { precision: 6, scale: 2 }).default('0'),
  
  // Resolution Details
  resolutionNotes: text('resolution_notes'),
  rejectionReason: text('rejection_reason'),
  
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
}, (table) => ({
  // Performance Indexes
  companyIdIdx: index('idx_punchlist_items_company_id').on(table.companyId),
  projectIdIdx: index('idx_punchlist_items_project_id').on(table.projectId),
  relatedScheduleProjectIdIdx: index('idx_punchlist_items_related_schedule_project_id').on(table.relatedScheduleProjectId),
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
  priorityStatusIdx: index('idx_punchlist_items_priority_status').on(table.priority, table.status),
  dueDateStatusIdx: index('idx_punchlist_items_due_date_status').on(table.dueDate, table.status),
}));

// ==============================================
// NEW: PUNCHLIST ITEM ASSIGNMENTS TABLE
// ==============================================
export const punchlistItemAssignments = pgTable('punchlist_item_assignments', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  punchlistItemId: uuid('punchlist_item_id').references(() => punchlistItems.id, { onDelete: 'cascade' }).notNull(),
  projectMemberId: uuid('project_member_id').references(() => projectMembers.id, { onDelete: 'cascade' }).notNull(),
  
  // Assignment Details
  role: varchar('role', { length: 50 }).default('primary').notNull(), // primary, secondary, inspector, supervisor
  assignedAt: timestamp('assigned_at', { withTimezone: true }).defaultNow().notNull(),
  assignedBy: uuid('assigned_by').references(() => users.id).notNull(),
  
  // Status tracking for individual assignments
  isActive: boolean('is_active').default(true).notNull(),
  removedAt: timestamp('removed_at', { withTimezone: true }),
  removedBy: uuid('removed_by').references(() => users.id),
  
  // Metadata
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // Unique constraint: One person can only have one active assignment per punchlist item
  uniqueActiveMemberPerItem: unique('unique_active_member_per_punchlist_item')
    .on(table.punchlistItemId, table.projectMemberId, table.isActive),
    
  // Performance indexes
  companyIdIdx: index('idx_punchlist_assignments_company_id').on(table.companyId),
  punchlistItemIdIdx: index('idx_punchlist_assignments_punchlist_item_id').on(table.punchlistItemId),
  projectMemberIdIdx: index('idx_punchlist_assignments_project_member_id').on(table.projectMemberId),
  roleIdx: index('idx_punchlist_assignments_role').on(table.role),
  assignedByIdx: index('idx_punchlist_assignments_assigned_by').on(table.assignedBy),
  isActiveIdx: index('idx_punchlist_assignments_is_active').on(table.isActive),
  assignedAtIdx: index('idx_punchlist_assignments_assigned_at').on(table.assignedAt),
  
  // Composite indexes for common queries
  punchlistActiveIdx: index('idx_punchlist_assignments_punchlist_active')
    .on(table.punchlistItemId, table.isActive),
  memberActiveIdx: index('idx_punchlist_assignments_member_active')
    .on(table.projectMemberId, table.isActive),
  companyActiveIdx: index('idx_punchlist_assignments_company_active')
    .on(table.companyId, table.isActive),
}));

// ==============================================
// INFER TYPES FROM SCHEMA
// ==============================================
export type PunchlistItem = typeof punchlistItems.$inferSelect;
export type NewPunchlistItem = typeof punchlistItems.$inferInsert;
export type PunchlistItemAssignment = typeof punchlistItemAssignments.$inferSelect;
export type NewPunchlistItemAssignment = typeof punchlistItemAssignments.$inferInsert;

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