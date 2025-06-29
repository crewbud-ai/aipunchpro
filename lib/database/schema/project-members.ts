// ==============================================
// src/lib/database/schema/project-members.ts - Team Management
// ==============================================

import { 
  pgTable, 
  uuid, 
  varchar, 
  text,
  boolean, 
  timestamp,
  decimal,
  unique,
  index
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { projects } from './projects';
import { users } from './users';

// ==============================================
// PROJECT MEMBERS TABLE (TEAM ASSIGNMENTS)
// ==============================================
export const projectMembers = pgTable('project_members', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  
  // User Reference (optional for non-system team members)
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  
  // Non-system team member info (for MVP approach)
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  isSystemUser: boolean('is_system_user').default(false),
  
  // Role & Rates
  role: varchar('role', { length: 100 }), // electrician, plumber, foreman, etc.
  hourlyRate: decimal('hourly_rate', { precision: 8, scale: 2 }),
  overtimeRate: decimal('overtime_rate', { precision: 8, scale: 2 }),
  
  // Permissions (for future system users)
  canEdit: boolean('can_edit').default(false),
  canManageTasks: boolean('can_manage_tasks').default(false),
  canViewFinancials: boolean('can_view_financials').default(false),
  
  // Contact & Emergency Info
  emergencyContact: text('emergency_contact'),
  notes: text('notes'),
  
  // Status & Timeline
  isActive: boolean('is_active').default(true),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow(),
  leftAt: timestamp('left_at', { withTimezone: true }),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  // Unique constraint for system users
  projectUserUnique: unique('project_user_unique').on(table.projectId, table.userId),
  
  // Indexes
  projectIdIdx: index('idx_project_members_project_id').on(table.projectId),
  userIdIdx: index('idx_project_members_user_id').on(table.userId),
  roleIdx: index('idx_project_members_role').on(table.role),
  isActiveIdx: index('idx_project_members_is_active').on(table.isActive),
  isSystemUserIdx: index('idx_project_members_is_system_user').on(table.isSystemUser),
  joinedAtIdx: index('idx_project_members_joined_at').on(table.joinedAt),
}));