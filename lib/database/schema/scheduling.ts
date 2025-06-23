// ==============================================
// src/lib/database/schema/scheduling.ts
// ==============================================

import { 
  pgTable, 
  uuid, 
  varchar, 
  text, 
  boolean, 
  timestamp, 
  jsonb,
  unique,
  index
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { companies } from './companies';
import { projects } from './projects';
import { users } from './users';

// ==============================================
// SCHEDULE MANAGEMENT
// ==============================================
export const scheduleEvents = pgTable('schedule_events', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  
  // Event Information
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  eventType: varchar('event_type', { length: 50 }),
  
  // Timing
  startDatetime: timestamp('start_datetime', { withTimezone: true }).notNull(),
  endDatetime: timestamp('end_datetime', { withTimezone: true }).notNull(),
  isAllDay: boolean('is_all_day').default(false),
  timezone: varchar('timezone', { length: 50 }).default('UTC'),
  
  // Location
  location: text('location'),
  address: text('address'),
  
  // Recurrence
  isRecurring: boolean('is_recurring').default(false),
  recurrencePattern: jsonb('recurrence_pattern'),
  
  // Status
  status: varchar('status', { length: 50 }).default('scheduled'),
  
  // Metadata
  createdBy: uuid('created_by').references(() => users.id),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  companyIdIdx: index('idx_schedule_company_id').on(table.companyId),
  projectIdIdx: index('idx_schedule_project_id').on(table.projectId),
  datetimeIdx: index('idx_schedule_datetime').on(table.startDatetime, table.endDatetime),
}));

// ==============================================
// SCHEDULE ATTENDEES
// ==============================================
export const scheduleAttendees = pgTable('schedule_attendees', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  eventId: uuid('event_id').references(() => scheduleEvents.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  
  // Attendance
  status: varchar('status', { length: 50 }).default('invited'),
  responseAt: timestamp('response_at', { withTimezone: true }),
  attendance: varchar('attendance', { length: 50 }),
  
  // Role
  role: varchar('role', { length: 50 }).default('attendee'),
}, (table) => ({
  eventUserUnique: unique('event_user_unique').on(table.eventId, table.userId),
}));