// ==============================================
// src/lib/database/schema/users.ts
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
// USERS TABLE (MULTI-ROLE SUPPORT)
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
  
  // Role & Permissions
  role: varchar('role', { length: 50 }).notNull().default('member'),
  permissions: jsonb('permissions').default({}),
  
  // Employment Details
  jobTitle: varchar('job_title', { length: 100 }),
  hourlyRate: decimal('hourly_rate', { precision: 8, scale: 2 }),
  overtimeRate: decimal('overtime_rate', { precision: 8, scale: 2 }),
  startDate: date('start_date'),
  
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