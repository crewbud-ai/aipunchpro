// ==============================================
// src/lib/database/schema/companies.ts
// ==============================================

import { 
  pgTable, 
  uuid, 
  varchar, 
  text, 
  boolean, 
  timestamp, 
  integer,
  check,
  index
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ==============================================
// COMPANIES TABLE (TENANT ISOLATION)
// ==============================================
export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  
  // Basic Information
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  
  // Business Details
  industry: varchar('industry', { length: 100 }),
  size: varchar('size', { length: 50 }), // 1-10, 11-50, 51-200, 201-500, 500+
  address: text('address'),
  phone: varchar('phone', { length: 50 }),
  website: varchar('website', { length: 255 }),
  logoUrl: text('logo_url'),
  
  // Subscription Management
  subscriptionPlan: varchar('subscription_plan', { length: 50 }).default('trial'),
  subscriptionStatus: varchar('subscription_status', { length: 50 }).default('active'),
  trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }).default(sql`NOW() + INTERVAL '14 days'`),
  
  // Business Limits
  maxUsers: integer('max_users').default(10),
  maxProjects: integer('max_projects').default(5),
  maxStorageGb: integer('max_storage_gb').default(1),
  
  // Super Admin Controls
  isActive: boolean('is_active').default(true),
  notes: text('notes'),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  slugCheck: check('companies_slug_check', sql`${table.slug} ~ '^[a-z0-9\\-]+$'`),
  slugIdx: index('idx_companies_slug').on(table.slug),
  subscriptionStatusIdx: index('idx_companies_subscription_status').on(table.subscriptionStatus),
}));