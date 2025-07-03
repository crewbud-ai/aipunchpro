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
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  
  // User Reference (all team members are system users now)
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  // Project-Specific Role
  role: varchar('role', { length: 100 }).notNull().default('member'),
  // Role options: 'project_manager', 'foreman', 'supervisor', 'member', 'subcontractor', 'inspector'
  
  // Project-Specific Rates (can override user's default rates)
  hourlyRate: decimal('hourly_rate', { precision: 8, scale: 2 }),
  overtimeRate: decimal('overtime_rate', { precision: 8, scale: 2 }),
  
  // Assignment Details
  assignedBy: uuid('assigned_by').references(() => users.id), // Who added this person to project
  notes: text('notes'), // Project-specific notes about this team member
  
  // Status & Timeline
  isActive: boolean('is_active').default(true),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  leftAt: timestamp('left_at', { withTimezone: true }),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // Unique constraint: one user can only have one active role per project
  projectUserUnique: unique('project_user_unique').on(table.projectId, table.userId),
  
  // Performance Indexes
  projectIdIdx: index('idx_project_members_project_id').on(table.projectId),
  userIdIdx: index('idx_project_members_user_id').on(table.userId),
  roleIdx: index('idx_project_members_role').on(table.role),
  isActiveIdx: index('idx_project_members_is_active').on(table.isActive),
  joinedAtIdx: index('idx_project_members_joined_at').on(table.joinedAt),
  assignedByIdx: index('idx_project_members_assigned_by').on(table.assignedBy),
  
  // Composite indexes for common queries
  projectRoleIdx: index('idx_project_members_project_role').on(table.projectId, table.role),
  projectActiveIdx: index('idx_project_members_project_active').on(table.projectId, table.isActive),
  userActiveIdx: index('idx_project_members_user_active').on(table.userId, table.isActive),
}));


// ==============================================
// PROJECT ROLE CONSTANTS
// ==============================================
export const PROJECT_ROLES = [
  'project_manager',
  'foreman', 
  'supervisor',
  'member',
  'subcontractor',
  'inspector',
  'client'
] as const;

export type ProjectRole = typeof PROJECT_ROLES[number];