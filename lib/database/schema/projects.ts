// ==============================================
// src/lib/database/schema/projects.ts - Refined Project Entity Schema
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
  jsonb,
  check,
  index
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { companies } from './companies';
import { users } from './users';

// ==============================================
// TYPE DEFINITIONS FOR JSONB FIELDS
// ==============================================

// Location object structure
export interface ProjectLocation {
  address: string;                    // Full formatted address from Google Places
  displayName?: string;              // Short display name (e.g., "Downtown NYC")
  city?: string;                     // City name
  state?: string;                    // State/Province code (e.g., "NY", "CA")
  country?: string;                  // Country code (defaults to "US")
  zipCode?: string;                  // ZIP/Postal code
  coordinates?: {
    lat: number;                     // Latitude
    lng: number;                     // Longitude
  };
  placeId?: string;                  // Google Places ID for reference
  timezone?: string;                 // Timezone (e.g., "America/New_York")
}

// Client information object structure
export interface ProjectClient {
  name?: string;                     // Client/Company name
  contactPerson?: string;            // Main contact person name
  email?: string;                    // Primary contact email
  phone?: string;                    // Primary contact phone (E.164 format)
  secondaryEmail?: string;           // Secondary contact email
  secondaryPhone?: string;           // Secondary contact phone
  website?: string;                  // Client's website URL
  businessAddress?: string;          // Client's business address
  billingAddress?: string;           // Client's billing address (if different)
  taxId?: string;                    // Tax ID/EIN for invoicing
  notes?: string;                    // Additional client notes
  preferredContact?: 'email' | 'phone' | 'both'; // Preferred contact method
}

// ==============================================
// PROJECTS TABLE (REFINED SCHEMA)
// ==============================================
export const projects = pgTable('projects', {
  // Primary identification
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  
  // Core Project Information
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  projectNumber: varchar('project_number', { length: 100 }).unique(), // Made unique for auto-generation
  
  // Status & Priority Management
  status: varchar('status', { length: 50 }).default('not_started').notNull(),
  // Status options: not_started, in_progress, on_track, ahead_of_schedule, behind_schedule, on_hold, completed, cancelled
  priority: varchar('priority', { length: 50 }).default('medium').notNull(),
  // Priority options: low, medium, high, urgent
  
  // Financial Information
  budget: decimal('budget', { precision: 15, scale: 2 }), // Increased precision for large projects
  spent: decimal('spent', { precision: 15, scale: 2 }).default('0').notNull(),
  
  // Progress & Timeline
  progress: integer('progress').default(0).notNull(), // 0-100 percentage
  startDate: date('start_date'),
  endDate: date('end_date'),
  actualStartDate: date('actual_start_date'), // When work actually began
  actualEndDate: date('actual_end_date'),     // When work actually completed
  
  // Work Estimation
  estimatedHours: decimal('estimated_hours', { precision: 8, scale: 2 }), // Allow decimal hours
  actualHours: decimal('actual_hours', { precision: 8, scale: 2 }).default('0').notNull(),
  
  // Location Information (JSONB Object)
  location: jsonb('location').$type<ProjectLocation>(),
  
  // Client Information (JSONB Object)  
  client: jsonb('client').$type<ProjectClient>(),
  
  // Team Management References
  projectManagerId: uuid('project_manager_id').references(() => users.id),
  foremanId: uuid('foreman_id').references(() => users.id),
  
  // Additional Metadata
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  tags: text('tags').array().default(sql`'{}'`), // Default to empty array
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // Constraints
  progressCheck: check('progress_check', sql`${table.progress} >= 0 AND ${table.progress} <= 100`),
  budgetCheck: check('budget_check', sql`${table.budget} IS NULL OR ${table.budget} >= 0`),
  spentCheck: check('spent_check', sql`${table.spent} >= 0`),
  hoursCheck: check('hours_check', sql`${table.estimatedHours} IS NULL OR ${table.estimatedHours} >= 0`),
  actualHoursCheck: check('actual_hours_check', sql`${table.actualHours} >= 0`),
  dateLogicCheck: check('date_logic_check', sql`${table.startDate} IS NULL OR ${table.endDate} IS NULL OR ${table.endDate} >= ${table.startDate}`),
  
  // Performance Indexes
  companyIdIdx: index('idx_projects_company_id').on(table.companyId),
  statusIdx: index('idx_projects_status').on(table.status),
  priorityIdx: index('idx_projects_priority').on(table.priority),
  projectNumberIdx: index('idx_projects_project_number').on(table.projectNumber),
  managerIdx: index('idx_projects_manager').on(table.projectManagerId),
  foremanIdx: index('idx_projects_foreman').on(table.foremanId),
  createdByIdx: index('idx_projects_created_by').on(table.createdBy),
  datesIdx: index('idx_projects_dates').on(table.startDate, table.endDate),
  createdAtIdx: index('idx_projects_created_at').on(table.createdAt),
  progressIdx: index('idx_projects_progress').on(table.progress),
  
  // JSONB GIN Indexes for efficient querying of nested data
  locationGinIdx: index('idx_projects_location_gin').using('gin', table.location),
  clientGinIdx: index('idx_projects_client_gin').using('gin', table.client),
  tagsGinIdx: index('idx_projects_tags_gin').using('gin', table.tags),
  
  // Composite indexes for common query patterns
  companyStatusIdx: index('idx_projects_company_status').on(table.companyId, table.status),
  companyPriorityIdx: index('idx_projects_company_priority').on(table.companyId, table.priority),
  statusProgressIdx: index('idx_projects_status_progress').on(table.status, table.progress),
}));

// ==============================================
// HELPER FUNCTIONS FOR JSONB OPERATIONS
// ==============================================

/**
 * Create a ProjectLocation object from Google Places API response
 */
export function createProjectLocation(
  address: string,
  coordinates?: { lat: number; lng: number },
  placeId?: string,
  displayName?: string
): ProjectLocation {
  const location: ProjectLocation = {
    address,
    displayName: displayName || extractDisplayName(address),
    country: 'US', // Default to US since we're filtering US-only locations
  };

  if (coordinates) {
    location.coordinates = coordinates;
  }

  if (placeId) {
    location.placeId = placeId;
  }

  // Parse address components
  const addressComponents = parseUSAddress(address);
  if (addressComponents) {
    location.city = addressComponents.city;
    location.state = addressComponents.state;
    location.zipCode = addressComponents.zipCode;
  }

  return location;
}

/**
 * Create a ProjectClient object
 */
export function createProjectClient(
  name?: string,
  email?: string,
  phone?: string,
  contactPerson?: string,
  website?: string,
  notes?: string
): ProjectClient {
  const client: ProjectClient = {};

  if (name) client.name = name;
  if (email) client.email = email;
  if (phone) client.phone = phone;
  if (contactPerson) client.contactPerson = contactPerson;
  if (website) client.website = website;
  if (notes) client.notes = notes;

  // Set preferred contact method
  if (email && phone) {
    client.preferredContact = 'both';
  } else if (email) {
    client.preferredContact = 'email';
  } else if (phone) {
    client.preferredContact = 'phone';
  }

  return client;
}

/**
 * Extract display name from full address (first meaningful part)
 */
function extractDisplayName(address: string): string {
  const parts = address.split(',').map(part => part.trim());
  
  // If first part looks like a street address (contains numbers), use second part
  if (parts.length > 1 && /\d/.test(parts[0])) {
    return parts[1];
  }
  
  // Otherwise use first part
  return parts[0];
}

/**
 * Parse US address to extract city, state, ZIP
 */
function parseUSAddress(address: string): { city?: string; state?: string; zipCode?: string } | null {
  // Expected format: "123 Main St, New York, NY 10001, USA"
  const parts = address.split(',').map(part => part.trim());
  
  if (parts.length < 3) return null;
  
  const city = parts[parts.length - 3];
  const stateZipPart = parts[parts.length - 2];
  
  // Extract state and ZIP from "NY 10001" format
  const stateZipMatch = stateZipPart.match(/^([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);
  
  if (stateZipMatch) {
    return {
      city: city,
      state: stateZipMatch[1],
      zipCode: stateZipMatch[2],
    };
  }
  
  return { city };
}

// ==============================================
// SQL HELPER FUNCTIONS FOR QUERYING JSONB
// ==============================================

/**
 * Search projects by location (address, city, state, or display name)
 */
export function searchByLocation(searchTerm: string) {
  const term = `%${searchTerm}%`;
  return sql`
    (location->>'address' ILIKE ${term} OR 
     location->>'city' ILIKE ${term} OR 
     location->>'state' ILIKE ${term} OR
     location->>'displayName' ILIKE ${term})
  `;
}

/**
 * Search projects by client information
 */
export function searchByClient(searchTerm: string) {
  const term = `%${searchTerm}%`;
  return sql`
    (client->>'name' ILIKE ${term} OR 
     client->>'email' ILIKE ${term} OR 
     client->>'contactPerson' ILIKE ${term} OR
     client->>'phone' ILIKE ${term})
  `;
}

/**
 * Get projects within a certain radius (requires coordinates in location)
 */
export function getProjectsWithinRadius(centerLat: number, centerLng: number, radiusKm: number) {
  return sql`
    location->'coordinates' IS NOT NULL AND
    (
      6371 * acos(
        cos(radians(${centerLat})) * 
        cos(radians(CAST(location->'coordinates'->>'lat' AS FLOAT))) * 
        cos(radians(CAST(location->'coordinates'->>'lng' AS FLOAT)) - radians(${centerLng})) + 
        sin(radians(${centerLat})) * 
        sin(radians(CAST(location->'coordinates'->>'lat' AS FLOAT)))
      )
    ) <= ${radiusKm}
  `;
}

/**
 * Filter projects by specific state
 */
export function filterByState(stateCode: string) {
  return sql`location->>'state' = ${stateCode}`;
}

/**
 * Filter projects by city
 */
export function filterByCity(cityName: string) {
  return sql`location->>'city' ILIKE ${cityName}`;
}

/**
 * Get projects with client email for notifications
 */
export function hasClientEmail() {
  return sql`client->>'email' IS NOT NULL AND client->>'email' != ''`;
}

/**
 * Get projects with coordinates for mapping
 */
export function hasCoordinates() {
  return sql`location->'coordinates' IS NOT NULL`;
}

// ==============================================
// PROJECT STATUS AND PRIORITY ENUMS
// ==============================================

export const PROJECT_STATUSES = [
  'not_started',
  'in_progress', 
  'on_track',
  'ahead_of_schedule',
  'behind_schedule',
  'on_hold',
  'completed',
  'cancelled'
] as const;

export const PROJECT_PRIORITIES = [
  'low',
  'medium', 
  'high',
  'urgent'
] as const;

export type ProjectStatus = typeof PROJECT_STATUSES[number];
export type ProjectPriority = typeof PROJECT_PRIORITIES[number];

// ==============================================
// COMMON QUERY BUILDERS
// ==============================================

/**
 * Build WHERE clause for project filtering
 */
export function buildProjectFilters(filters: {
  status?: ProjectStatus[];
  priority?: ProjectPriority[];
  managerId?: string;
  clientName?: string;
  location?: string;
  hasCoordinates?: boolean;
  dateRange?: { start: string; end: string };
}) {
  const conditions = [];

  if (filters.status?.length) {
    conditions.push(sql`status = ANY(${filters.status})`);
  }

  if (filters.priority?.length) {
    conditions.push(sql`priority = ANY(${filters.priority})`);
  }

  if (filters.managerId) {
    conditions.push(sql`project_manager_id = ${filters.managerId}`);
  }

  if (filters.clientName) {
    conditions.push(searchByClient(filters.clientName));
  }

  if (filters.location) {
    conditions.push(searchByLocation(filters.location));
  }

  if (filters.hasCoordinates) {
    conditions.push(hasCoordinates());
  }

  if (filters.dateRange) {
    conditions.push(sql`
      (start_date >= ${filters.dateRange.start} AND start_date <= ${filters.dateRange.end}) OR
      (end_date >= ${filters.dateRange.start} AND end_date <= ${filters.dateRange.end}) OR
      (start_date <= ${filters.dateRange.start} AND end_date >= ${filters.dateRange.end})
    `);
  }

  return conditions.length > 0 ? sql`WHERE ${sql.join(conditions, sql` AND `)}` : sql``;
}