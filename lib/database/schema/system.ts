// ==============================================
// src/lib/database/schema/system.ts
// ==============================================

import { 
  pgTable, 
  uuid, 
  varchar, 
  text, 
  boolean, 
  timestamp, 
  jsonb,
  inet,
  index
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { companies } from './companies';
import { users } from './users';

// ==============================================
// AUDIT LOG (ACTIVITY TRACKING)
// ==============================================
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  
  // Event Information
  action: varchar('action', { length: 100 }).notNull(),
  resourceType: varchar('resource_type', { length: 50 }).notNull(),
  resourceId: uuid('resource_id'),
  
  // Change Details
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  changes: jsonb('changes'),
  
  // Context
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  ipAddress: inet('ip_address'),
  userAgent: text('user_agent'),
  
  // Metadata
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  companyIdIdx: index('idx_audit_company_id').on(table.companyId),
  actionIdx: index('idx_audit_action').on(table.action),
  resourceIdx: index('idx_audit_resource').on(table.resourceType, table.resourceId),
  userIdIdx: index('idx_audit_user_id').on(table.userId),
  createdAtIdx: index('idx_audit_created_at').on(table.createdAt),
}));

// ==============================================
// NOTIFICATIONS SYSTEM
// ==============================================
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  
  // Notification Content
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  
  // Context
  resourceType: varchar('resource_type', { length: 50 }),
  resourceId: uuid('resource_id'),
  
  // Delivery
  readAt: timestamp('read_at', { withTimezone: true }),
  emailSent: boolean('email_sent').default(false),
  emailSentAt: timestamp('email_sent_at', { withTimezone: true }),
  
  // Priority
  priority: varchar('priority', { length: 50 }).default('normal'),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
}, (table) => ({
  companyIdIdx: index('idx_notifications_company_id').on(table.companyId),
  userIdIdx: index('idx_notifications_user_id').on(table.userId),
  typeIdx: index('idx_notifications_type').on(table.type),
  readAtIdx: index('idx_notifications_read_at').on(table.readAt),
  createdAtIdx: index('idx_notifications_created_at').on(table.createdAt),
}));