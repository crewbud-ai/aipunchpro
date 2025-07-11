// ==============================================
// lib/database/schema/schedule-projects.ts - UPDATED WITH PROPER FOREIGN KEYS
// ==============================================

import {
  pgTable,
  uuid,
  varchar,
  text,
  date,
  time,
  decimal,
  timestamp,
  index
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { companies } from './companies';
import { projects } from './projects';
import { users } from './users';

// ==============================================
// SCHEDULE STATUS & PRIORITY CONSTANTS
// ==============================================
export const SCHEDULE_STATUS = [
  'planned',
  'in_progress', 
  'completed',
  'delayed',
  'cancelled'
] as const;

export const SCHEDULE_PRIORITY = [
  'low',
  'medium',
  'high',
  'critical'
] as const;

export const TRADE_REQUIRED = [
  'electrical',
  'plumbing',
  'framing',
  'drywall',
  'roofing',
  'concrete',
  'hvac',
  'general',
  'management',
  'safety'
] as const;

// ==============================================
// SCHEDULE PROJECTS TABLE - NEW SYSTEM
// ==============================================
export const scheduleProjects = pgTable('schedule_projects', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  
  // Company & Project Relations - FIXED: Proper foreign key references
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  
  // Work Details
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  
  // Timing
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  startTime: time('start_time'),
  endTime: time('end_time'),
  
  // Assignment (Links to project_members IDs)
  assignedProjectMemberIds: text('assigned_project_member_ids').array().notNull(),
  tradeRequired: varchar('trade_required', { length: 100 }),
  
  // Status & Priority
  status: varchar('status', { length: 50 }).default('planned').notNull(),
  priority: varchar('priority', { length: 50 }).default('medium').notNull(),
  progressPercentage: decimal('progress_percentage', { precision: 5, scale: 2 }).default('0').notNull(),
  
  // Work Estimates
  estimatedHours: decimal('estimated_hours', { precision: 6, scale: 2 }),
  actualHours: decimal('actual_hours', { precision: 6, scale: 2 }).default('0'),
  
  // Dependencies
  dependsOn: text('depends_on').array(), // Array of other schedule_project IDs
  
  // Location & Details
  location: text('location'),
  notes: text('notes'),
  
  // Metadata - FIXED: Proper foreign key reference for created_by
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
}, (table) => ({
  // Performance Indexes
  companyIdIdx: index('idx_schedule_projects_company_id').on(table.companyId),
  projectIdIdx: index('idx_schedule_projects_project_id').on(table.projectId),
  statusIdx: index('idx_schedule_projects_status').on(table.status),
  priorityIdx: index('idx_schedule_projects_priority').on(table.priority),
  startDateIdx: index('idx_schedule_projects_start_date').on(table.startDate),
  endDateIdx: index('idx_schedule_projects_end_date').on(table.endDate),
  tradeRequiredIdx: index('idx_schedule_projects_trade_required').on(table.tradeRequired),
  createdByIdx: index('idx_schedule_projects_created_by').on(table.createdBy),
  createdAtIdx: index('idx_schedule_projects_created_at').on(table.createdAt),
  
  // Composite indexes for common queries
  projectStatusIdx: index('idx_schedule_projects_project_status').on(table.projectId, table.status),
  companyStatusIdx: index('idx_schedule_projects_company_status').on(table.companyId, table.status),
  dateRangeIdx: index('idx_schedule_projects_date_range').on(table.startDate, table.endDate),
}));

// ==============================================
// INFER TYPES FROM SCHEMA
// ==============================================
export type ScheduleProject = typeof scheduleProjects.$inferSelect;
export type NewScheduleProject = typeof scheduleProjects.$inferInsert;

// ==============================================
// SCHEDULE STATUS & PRIORITY TYPE EXPORTS
// ==============================================
export type ScheduleStatus = typeof SCHEDULE_STATUS[number];
export type SchedulePriority = typeof SCHEDULE_PRIORITY[number];
export type TradeRequired = typeof TRADE_REQUIRED[number];