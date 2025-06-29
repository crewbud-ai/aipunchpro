// ==============================================
// src/lib/database/schema/scheduling.ts - Calendar & Schedule Management
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
// SCHEDULE EVENTS TABLE (CALENDAR MANAGEMENT)
// ==============================================
export const scheduleEvents = pgTable('schedule_events', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  
  // Event Information
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  eventType: varchar('event_type', { length: 50 }), // work, meeting, inspection, delivery, milestone
  
  // Timing
  startDatetime: timestamp('start_datetime', { withTimezone: true }).notNull(),
  endDatetime: timestamp('end_datetime', { withTimezone: true }).notNull(),
  isAllDay: boolean('is_all_day').default(false),
  timezone: varchar('timezone', { length: 50 }).default('UTC'),
  
  // Location & Details
  location: text('location'),
  address: text('address'),
  
  // Work Details
  trade: varchar('trade', { length: 100 }), // electrical, plumbing, etc.
  crew: varchar('crew', { length: 255 }), // Team/crew assigned
  estimatedWorkers: varchar('estimated_workers', { length: 50 }), // "2-3 electricians"
  
  // Recurrence Support
  isRecurring: boolean('is_recurring').default(false),
  recurrencePattern: jsonb('recurrence_pattern'), // {type: 'weekly', interval: 1, daysOfWeek: [1,2,3,4,5]}
  recurrenceEndDate: timestamp('recurrence_end_date', { withTimezone: true }),
  parentEventId: uuid('parent_event_id'), // Reference to original recurring event
  
  // Status & Management
  status: varchar('status', { length: 50 }).default('scheduled'), // scheduled, in_progress, completed, cancelled, rescheduled
  priority: varchar('priority', { length: 50 }).default('medium'), // low, medium, high, urgent
  
  // Weather & Conditions
  weatherDependent: boolean('weather_dependent').default(false),
  indoorWork: boolean('indoor_work').default(true),
  
  // Dependencies
  dependsOn: text('depends_on').array(), // Array of task/event IDs this depends on
  blocks: text('blocks').array(), // Array of task/event IDs this blocks
  
  // Notifications & Reminders
  reminderMinutes: varchar('reminder_minutes', { length: 20 }).default('60'), // Minutes before to remind
  notifyChanges: boolean('notify_changes').default(true),
  
  // Metadata
  createdBy: uuid('created_by').references(() => users.id),
  lastModifiedBy: uuid('last_modified_by').references(() => users.id),
  notes: text('notes'),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  // Indexes for performance
  companyIdIdx: index('idx_schedule_company_id').on(table.companyId),
  projectIdIdx: index('idx_schedule_project_id').on(table.projectId),
  datetimeIdx: index('idx_schedule_datetime').on(table.startDatetime, table.endDatetime),
  statusIdx: index('idx_schedule_status').on(table.status),
  eventTypeIdx: index('idx_schedule_event_type').on(table.eventType),
  tradeIdx: index('idx_schedule_trade').on(table.trade),
  priorityIdx: index('idx_schedule_priority').on(table.priority),
  createdByIdx: index('idx_schedule_created_by').on(table.createdBy),
  weatherDependentIdx: index('idx_schedule_weather_dependent').on(table.weatherDependent),
  isRecurringIdx: index('idx_schedule_is_recurring').on(table.isRecurring),
  parentEventIdx: index('idx_schedule_parent_event').on(table.parentEventId),
}));

// ==============================================
// SCHEDULE ATTENDEES TABLE (WHO'S ASSIGNED TO EVENTS)
// ==============================================
export const scheduleAttendees = pgTable('schedule_attendees', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  eventId: uuid('event_id').references(() => scheduleEvents.id, { onDelete: 'cascade' }),
  
  // Attendee Information (can be system users or project members)
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }), // For system users
  memberName: varchar('member_name', { length: 255 }), // For non-system team members
  memberEmail: varchar('member_email', { length: 255 }),
  memberPhone: varchar('member_phone', { length: 50 }),
  isSystemUser: boolean('is_system_user').default(false),
  
  // Role & Responsibility
  role: varchar('role', { length: 50 }).default('attendee'), // lead, attendee, observer, supervisor
  responsibility: text('responsibility'), // What they're responsible for
  
  // Attendance Tracking
  status: varchar('status', { length: 50 }).default('invited'), // invited, accepted, declined, tentative, no_response
  responseAt: timestamp('response_at', { withTimezone: true }),
  attendance: varchar('attendance', { length: 50 }), // present, absent, late, left_early
  
  // Check-in/Check-out
  checkedInAt: timestamp('checked_in_at', { withTimezone: true }),
  checkedOutAt: timestamp('checked_out_at', { withTimezone: true }),
  hoursWorked: varchar('hours_worked', { length: 20 }),
  
  // Notes & Comments
  notes: text('notes'),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  // Unique constraint
  eventUserUnique: unique('event_user_unique').on(table.eventId, table.userId),
  
  // Indexes
  eventIdIdx: index('idx_schedule_attendees_event_id').on(table.eventId),
  userIdIdx: index('idx_schedule_attendees_user_id').on(table.userId),
  statusIdx: index('idx_schedule_attendees_status').on(table.status),
  roleIdx: index('idx_schedule_attendees_role').on(table.role),
  attendanceIdx: index('idx_schedule_attendees_attendance').on(table.attendance),
  isSystemUserIdx: index('idx_schedule_attendees_is_system_user').on(table.isSystemUser),
}));