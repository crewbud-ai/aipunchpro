// ==============================================
// src/lib/database/schema/system.ts - System Tables (Notifications & Audit Logs)
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
// AUDIT LOGS (ACTIVITY TRACKING)
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
  type: varchar('type', { length: 50 }).default('info'), // info, success, warning, error
  category: varchar('category', { length: 50 }), // project, task, schedule, system
  
  // Notification Data
  data: jsonb('data'), // Additional data for the notification
  actionUrl: text('action_url'), // URL to navigate when notification is clicked
  
  // Status & Tracking
  isRead: boolean('is_read').default(false),
  isArchived: boolean('is_archived').default(false),
  priority: varchar('priority', { length: 20 }).default('normal'), // low, normal, high, urgent
  
  // Delivery
  deliveryMethod: varchar('delivery_method', { length: 50 }).default('in_app'), // in_app, email, sms
  sentAt: timestamp('sent_at', { withTimezone: true }),
  readAt: timestamp('read_at', { withTimezone: true }),
  
  // Expiration
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  
  // Metadata
  createdBy: uuid('created_by').references(() => users.id),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  companyIdIdx: index('idx_notifications_company_id').on(table.companyId),
  userIdIdx: index('idx_notifications_user_id').on(table.userId),
  typeIdx: index('idx_notifications_type').on(table.type),
  categoryIdx: index('idx_notifications_category').on(table.category),
  isReadIdx: index('idx_notifications_is_read').on(table.isRead),
  isArchivedIdx: index('idx_notifications_is_archived').on(table.isArchived),
  priorityIdx: index('idx_notifications_priority').on(table.priority),
  createdAtIdx: index('idx_notifications_created_at').on(table.createdAt),
  expiresAtIdx: index('idx_notifications_expires_at').on(table.expiresAt),
}));