// ==============================================
// src/lib/database/schema/users.ts - Enhanced Users Schema with Permissions
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
  time,
  jsonb, 
  point,
  inet,
  index
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { companies } from './companies';

// ==============================================
// PERMISSION TYPES
// ==============================================
export interface UserPermissions {
  // Project Management
  projects: {
    create: boolean
    edit: boolean
    delete: boolean
    view: boolean
    viewAll: boolean        // Can see all company projects vs just assigned
  }
  
  // Team Management
  team: {
    add: boolean
    edit: boolean
    remove: boolean
    view: boolean
    assignToProjects: boolean
  }
  
  // Task Management
  tasks: {
    create: boolean
    edit: boolean
    delete: boolean
    assign: boolean
    complete: boolean
    view: boolean
  }
  
  // Financial
  financials: {
    view: boolean
    edit: boolean
    viewReports: boolean
  }
  
  // Files & Documents
  files: {
    upload: boolean
    delete: boolean
    view: boolean
    downloadAll: boolean
  }
  
  // Schedule Management
  schedule: {
    create: boolean
    edit: boolean
    view: boolean
  }
  
  // Punchlist
  punchlist: {
    create: boolean
    edit: boolean
    complete: boolean
    view: boolean
  }
  
  // Reports
  reports: {
    generate: boolean
    view: boolean
    export: boolean
  }
  
  // System Administration
  admin: {
    manageUsers: boolean
    systemSettings: boolean
    companySettings: boolean
  }
}

// ==============================================
// USERS TABLE (ENHANCED WITH TEAM MEMBER FIELDS)
// ==============================================
export const users = pgTable('users', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  
  // Authentication
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }),
  emailVerified: boolean('email_verified').default(false),
  phone: varchar('phone', { length: 50 }),
  
  // Profile Information
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  avatarUrl: text('avatar_url'),
  
  // Role & Permissions (Enhanced)
  role: varchar('role', { length: 50 }).notNull().default('member'),
  permissions: jsonb('permissions').$type<UserPermissions>().notNull().default(sql`'{}'`),
  
  // Employment Details (Enhanced)
  jobTitle: varchar('job_title', { length: 100 }),
  tradeSpecialty: varchar('trade_specialty', { length: 100 }), // NEW: carpentry, electrical, etc.
  hourlyRate: decimal('hourly_rate', { precision: 8, scale: 2 }),
  overtimeRate: decimal('overtime_rate', { precision: 8, scale: 2 }),
  startDate: date('start_date'),
  
  // Additional Team Member Information (NEW)
  certifications: text('certifications'), // OSHA, licenses, etc.
  emergencyContactName: varchar('emergency_contact_name', { length: 255 }), // NEW
  emergencyContactPhone: varchar('emergency_contact_phone', { length: 50 }), // NEW
  
  // Status & Activity
  isActive: boolean('is_active').default(true),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  timezone: varchar('timezone', { length: 50 }).default('UTC'),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  companyIdIdx: index('idx_users_company_id').on(table.companyId),
  emailIdx: index('idx_users_email').on(table.email),
  roleIdx: index('idx_users_role').on(table.role),
  activeIdx: index('idx_users_active').on(table.isActive),
  tradeSpecialtyIdx: index('idx_users_trade_specialty').on(table.tradeSpecialty), // NEW
}));

// ==============================================
// USER SESSIONS (SECURE SESSION MANAGEMENT)
// ==============================================
export const userSessions = pgTable('user_sessions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  
  // Session Data
  tokenHash: varchar('token_hash', { length: 255 }).unique().notNull(),
  refreshTokenHash: varchar('refresh_token_hash', { length: 255 }),
  
  // Device & Security Info
  deviceInfo: jsonb('device_info').default({}),
  ipAddress: inet('ip_address'),
  userAgent: text('user_agent'),
  
  // Session Management
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }).defaultNow(),
  isActive: boolean('is_active').default(true),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_sessions_user_id').on(table.userId),
  tokenHashIdx: index('idx_sessions_token_hash').on(table.tokenHash),
  expiresAtIdx: index('idx_sessions_expires_at').on(table.expiresAt),
}));

export const emailVerifications = pgTable('email_verifications', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  
  // Token Data
  tokenHash: varchar('token_hash', { length: 255 }).unique().notNull(),
  
  // Status
  isUsed: boolean('is_used').default(false),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_email_verifications_user_id').on(table.userId),
  tokenHashIdx: index('idx_email_verifications_token_hash').on(table.tokenHash),
  expiresAtIdx: index('idx_email_verifications_expires_at').on(table.expiresAt),
}));

export const passwordResets = pgTable('password_resets', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  
  // Token Data
  tokenHash: varchar('token_hash', { length: 255 }).unique().notNull(),
  
  // Status
  isUsed: boolean('is_used').default(false),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_password_resets_user_id').on(table.userId),
  tokenHashIdx: index('idx_password_resets_token_hash').on(table.tokenHash),
  expiresAtIdx: index('idx_password_resets_expires_at').on(table.expiresAt),
}));

// ==============================================
// DEFAULT PERMISSION TEMPLATES
// ==============================================
export const DEFAULT_PERMISSIONS: Record<string, UserPermissions> = {
  super_admin: {
    projects: { create: true, edit: true, delete: true, view: true, viewAll: true },
    team: { add: true, edit: true, remove: true, view: true, assignToProjects: true },
    tasks: { create: true, edit: true, delete: true, assign: true, complete: true, view: true },
    financials: { view: true, edit: true, viewReports: true },
    files: { upload: true, delete: true, view: true, downloadAll: true },
    schedule: { create: true, edit: true, view: true },
    punchlist: { create: true, edit: true, complete: true, view: true },
    reports: { generate: true, view: true, export: true },
    admin: { manageUsers: true, systemSettings: true, companySettings: true }
  },
  
  admin: {
    projects: { create: true, edit: true, delete: true, view: true, viewAll: true },
    team: { add: true, edit: true, remove: true, view: true, assignToProjects: true },
    tasks: { create: true, edit: true, delete: true, assign: true, complete: true, view: true },
    financials: { view: true, edit: true, viewReports: true },
    files: { upload: true, delete: true, view: true, downloadAll: true },
    schedule: { create: true, edit: true, view: true },
    punchlist: { create: true, edit: true, complete: true, view: true },
    reports: { generate: true, view: true, export: true },
    admin: { manageUsers: false, systemSettings: false, companySettings: false }
  },
  
  supervisor: {
    projects: { create: false, edit: true, delete: false, view: true, viewAll: true },
    team: { add: true, edit: true, remove: false, view: true, assignToProjects: true },
    tasks: { create: true, edit: true, delete: true, assign: true, complete: true, view: true },
    financials: { view: false, edit: false, viewReports: false },
    files: { upload: true, delete: true, view: true, downloadAll: true },
    schedule: { create: true, edit: true, view: true },
    punchlist: { create: true, edit: true, complete: true, view: true },
    reports: { generate: false, view: true, export: false },
    admin: { manageUsers: false, systemSettings: false, companySettings: false }
  },
  
  member: {
    projects: { create: false, edit: false, delete: false, view: true, viewAll: false },
    team: { add: false, edit: false, remove: false, view: true, assignToProjects: false },
    tasks: { create: false, edit: false, delete: false, assign: false, complete: true, view: true },
    financials: { view: false, edit: false, viewReports: false },
    files: { upload: false, delete: false, view: true, downloadAll: false },
    schedule: { create: false, edit: false, view: true },
    punchlist: { create: true, edit: false, complete: true, view: true },
    reports: { generate: false, view: false, export: false },
    admin: { manageUsers: false, systemSettings: false, companySettings: false }
  }
};