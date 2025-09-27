// ==============================================
// src/lib/database/schema/time-tracking.ts - Time & Payroll Management
// ==============================================

import { 
  pgTable, 
  uuid, 
  varchar, 
  text, 
  timestamp, 
  decimal, 
  date,
  time,
  integer,
  point,
  index,
  boolean
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { companies } from './companies';
import { projects } from './projects';
import { users } from './users';
import { scheduleProjects } from './schedule-projects';

// ==============================================
// TIME ENTRIES TABLE (WORK TIME TRACKING)
// ==============================================
export const timeEntries = pgTable('time_entries', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  
  // Schedule Project Reference (for clock in/out to specific schedule items)
  scheduleProjectId: uuid('schedule_project_id').references(() => scheduleProjects.id, { onDelete: 'set null' }),
  
  // Worker Information
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }), // For system users
  workerName: varchar('worker_name', { length: 255 }), // For non-system workers
  isSystemUser: boolean('is_system_user').default(false),
  
  // Time Details (PERFECT for clock in/out)
  date: date('date').notNull(),
  startTime: time('start_time'), // CLOCK IN time
  endTime: time('end_time'),     // CLOCK OUT time
  breakMinutes: integer('break_minutes').default(0),
  
  // Calculated Hours
  regularHours: decimal('regular_hours', { precision: 4, scale: 2 }).default('0'),
  overtimeHours: decimal('overtime_hours', { precision: 4, scale: 2 }).default('0'),
  doubleTimeHours: decimal('double_time_hours', { precision: 4, scale: 2 }).default('0'),
  totalHours: decimal('total_hours', { precision: 4, scale: 2 }).notNull(),
  
  // Rates & Calculation
  regularRate: decimal('regular_rate', { precision: 8, scale: 2 }),
  overtimeRate: decimal('overtime_rate', { precision: 8, scale: 2 }),
  doubleTimeRate: decimal('double_time_rate', { precision: 8, scale: 2 }),
  totalPay: decimal('total_pay', { precision: 10, scale: 2 }),
  
  // Work Description & Context
  description: text('description'),
  workType: varchar('work_type', { length: 100 }), // installation, repair, cleanup, inspection
  trade: varchar('trade', { length: 100 }), // electrical, plumbing, etc.
  
  // Location Tracking (for mobile/field work)
  clockInLocation: point('clock_in_location'),
  clockOutLocation: point('clock_out_location'),
  workLocation: text('work_location'), // Description of work area
  
  // UPDATED: Status includes session tracking
  // Values: 'clocked_in', 'clocked_out', 'pending', 'approved', 'rejected', 'modified'
  status: varchar('status', { length: 50 }).default('clocked_out'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  rejectionReason: text('rejection_reason'),
  
  // Equipment & Materials Used
  equipmentUsed: text('equipment_used').array(),
  materialsUsed: text('materials_used').array(),
  
  // Weather & Conditions (for outdoor work)
  weatherConditions: varchar('weather_conditions', { length: 100 }),
  temperatureF: integer('temperature_f'),
  workConditions: text('work_conditions'), // Notes about working conditions
  
  // Safety & Compliance
  safetyIncidents: text('safety_incidents'),
  ppe: text('ppe').array(), // Personal Protective Equipment used
  
  // Quality & Progress Notes
  workCompleted: text('work_completed'),
  issuesEncountered: text('issues_encountered'),
  nextSteps: text('next_steps'),
  qualityRating: integer('quality_rating'), // 1-5 rating
  
  // Metadata
  createdBy: uuid('created_by').references(() => users.id),
  lastModifiedBy: uuid('last_modified_by').references(() => users.id),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  // Indexes for performance
  companyIdIdx: index('idx_time_entries_company_id').on(table.companyId),
  projectIdIdx: index('idx_time_entries_project_id').on(table.projectId),
  scheduleProjectIdIdx: index('idx_time_entries_schedule_project_id').on(table.scheduleProjectId),
  userIdIdx: index('idx_time_entries_user_id').on(table.userId),
  dateIdx: index('idx_time_entries_date').on(table.date),
  statusIdx: index('idx_time_entries_status').on(table.status),
  workTypeIdx: index('idx_time_entries_work_type').on(table.workType),
  tradeIdx: index('idx_time_entries_trade').on(table.trade),
  approvedByIdx: index('idx_time_entries_approved_by').on(table.approvedBy),
  submittedAtIdx: index('idx_time_entries_submitted_at').on(table.submittedAt),
  isSystemUserIdx: index('idx_time_entries_is_system_user').on(table.isSystemUser),
}));