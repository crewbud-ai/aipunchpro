// ==============================================
// src/lib/database/schema/projects.ts - Core Project Entity
// ==============================================

import { 
  pgTable, 
  uuid, 
  varchar, 
  text, 
  integer, 
  decimal, 
  date, 
  timestamp,
  check,
  index
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { companies } from './companies';
import { users } from './users';

// ==============================================
// PROJECTS TABLE (MAIN PROJECT ENTITY)
// ==============================================
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  
  // Project Information
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  projectNumber: varchar('project_number', { length: 100 }),
  
  // Status & Priority
  status: varchar('status', { length: 50 }).default('planning'), // planning, active, on_hold, completed
  priority: varchar('priority', { length: 50 }).default('medium'), // low, medium, high
  
  // Financial Information
  budget: decimal('budget', { precision: 12, scale: 2 }),
  spent: decimal('spent', { precision: 12, scale: 2 }).default('0'),
  
  // Progress & Timeline
  progress: integer('progress').default(0), // 0-100 percentage
  startDate: date('start_date'),
  endDate: date('end_date'),
  estimatedHours: integer('estimated_hours'),
  actualHours: integer('actual_hours').default(0),
  
  // Location & Client Details
  location: text('location'),
  address: text('address'),
  clientName: varchar('client_name', { length: 255 }),
  clientContact: text('client_contact'),
  
  // Team Management References
  projectManagerId: uuid('project_manager_id').references(() => users.id),
  foremanId: uuid('foreman_id').references(() => users.id),
  
  // Metadata
  createdBy: uuid('created_by').references(() => users.id),
  tags: text('tags').array(),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  // Constraints
  progressCheck: check('progress_check', sql`${table.progress} >= 0 AND ${table.progress} <= 100`),
  
  // Indexes for performance
  companyIdIdx: index('idx_projects_company_id').on(table.companyId),
  statusIdx: index('idx_projects_status').on(table.status),
  priorityIdx: index('idx_projects_priority').on(table.priority),
  managerIdx: index('idx_projects_manager').on(table.projectManagerId),
  foremanIdx: index('idx_projects_foreman').on(table.foremanId),
  createdByIdx: index('idx_projects_created_by').on(table.createdBy),
  datesIdx: index('idx_projects_dates').on(table.startDate, table.endDate),
  createdAtIdx: index('idx_projects_created_at').on(table.createdAt),
  progressIdx: index('idx_projects_progress').on(table.progress),
}));