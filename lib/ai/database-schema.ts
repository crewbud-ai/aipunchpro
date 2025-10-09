// ==============================================
// lib/ai/database-schema.ts - Complete Database Schema for AI
// ==============================================

/**
 * This documents your database structure so AI understands
 * table relationships and can reason about data
 */

export interface TableSchema {
  name: string
  description: string
  columns: Record<string, {
    type: string
    description: string
    nullable?: boolean
    foreignKey?: {
      table: string
      column: string
    }
  }>
}

// ==============================================
// COMPLETE DATABASE SCHEMA
// ==============================================
export const DATABASE_SCHEMA: Record<string, TableSchema> = {
  
  companies: {
    name: 'companies',
    description: 'Company/organization information',
    columns: {
      id: { type: 'uuid', description: 'Unique company ID' },
      name: { type: 'string', description: 'Company name' },
      slug: { type: 'string', description: 'URL-friendly company identifier' },
      industry: { type: 'string', description: 'Industry type (e.g., construction, residential)' },
      size: { type: 'string', description: 'Company size (small, medium, large)' },
      created_at: { type: 'timestamp', description: 'When company was created' },
      updated_at: { type: 'timestamp', description: 'Last updated' },
    }
  },

  users: {
    name: 'users',
    description: 'User accounts (team members, admins, etc.)',
    columns: {
      id: { type: 'uuid', description: 'Unique user ID' },
      company_id: { 
        type: 'uuid', 
        description: 'Company this user belongs to',
        foreignKey: { table: 'companies', column: 'id' }
      },
      email: { type: 'string', description: 'User email address' },
      first_name: { type: 'string', description: 'First name' },
      last_name: { type: 'string', description: 'Last name' },
      role: { 
        type: 'enum', 
        description: 'User role: super_admin, admin, supervisor, member' 
      },
      phone: { type: 'string', description: 'Phone number', nullable: true },
      hourly_rate: { type: 'decimal', description: 'Hourly pay rate', nullable: true },
      hire_date: { type: 'date', description: 'Date hired', nullable: true },
      status: { 
        type: 'enum', 
        description: 'Employment status: active, inactive, on_leave' 
      },
      trade_specialty: { 
        type: 'string', 
        description: 'Trade skill (e.g., carpenter, electrician, plumber)',
        nullable: true 
      },
      permissions: { type: 'jsonb', description: 'Detailed permissions object' },
      created_at: { type: 'timestamp', description: 'Account creation date' },
      updated_at: { type: 'timestamp', description: 'Last updated' },
    }
  },

  projects: {
    name: 'projects',
    description: 'Main construction projects',
    columns: {
      id: { type: 'uuid', description: 'Unique project ID' },
      company_id: { 
        type: 'uuid', 
        description: 'Company owning this project',
        foreignKey: { table: 'companies', column: 'id' }
      },
      name: { type: 'string', description: 'Project name' },
      project_number: { type: 'string', description: 'Unique project number (e.g., PRJ-001)' },
      description: { type: 'text', description: 'Detailed project description', nullable: true },
      status: { 
        type: 'enum', 
        description: 'Project status: not_started, in_progress, on_track, ahead_of_schedule, behind_schedule, on_hold, completed, cancelled' 
      },
      priority: { 
        type: 'enum', 
        description: 'Priority level: low, medium, high, urgent' 
      },
      budget: { type: 'decimal', description: 'Total project budget', nullable: true },
      actual_cost: { type: 'decimal', description: 'Actual cost so far', nullable: true },
      progress: { type: 'integer', description: 'Completion percentage (0-100)', nullable: true },
      start_date: { type: 'date', description: 'Project start date', nullable: true },
      end_date: { type: 'date', description: 'Project end date', nullable: true },
      location: { type: 'jsonb', description: 'Project location (address, coordinates)', nullable: true },
      client: { type: 'jsonb', description: 'Client information', nullable: true },
      created_by: { 
        type: 'uuid', 
        description: 'User who created the project',
        foreignKey: { table: 'users', column: 'id' }
      },
      created_at: { type: 'timestamp', description: 'When project was created' },
      updated_at: { type: 'timestamp', description: 'Last updated' },
    }
  },

  project_members: {
    name: 'project_members',
    description: 'Team members assigned to projects (many-to-many relationship)',
    columns: {
      id: { type: 'uuid', description: 'Unique assignment ID' },
      project_id: { 
        type: 'uuid', 
        description: 'Project ID',
        foreignKey: { table: 'projects', column: 'id' }
      },
      user_id: { 
        type: 'uuid', 
        description: 'User ID',
        foreignKey: { table: 'users', column: 'id' }
      },
      assigned_at: { type: 'timestamp', description: 'When user was assigned' },
      assigned_by: { 
        type: 'uuid', 
        description: 'Admin who made the assignment',
        foreignKey: { table: 'users', column: 'id' }
      },
    }
  },

  schedule_projects: {
    name: 'schedule_projects',
    description: 'Scheduled tasks/sub-projects within main projects',
    columns: {
      id: { type: 'uuid', description: 'Unique schedule ID' },
      company_id: { 
        type: 'uuid',
        description: 'Company this schedule belongs to',
        foreignKey: { table: 'companies', column: 'id' }
      },
      project_id: { 
        type: 'uuid', 
        description: 'Parent project',
        foreignKey: { table: 'projects', column: 'id' }
      },
      name: { type: 'string', description: 'Task/schedule name' },
      description: { type: 'text', description: 'Task description', nullable: true },
      status: { 
        type: 'enum', 
        description: 'Status: planned, in_progress, completed, cancelled, delayed' 
      },
      priority: { type: 'enum', description: 'Priority: low, medium, high, urgent' },
      start_date: { type: 'date', description: 'Scheduled start date' },
      end_date: { type: 'date', description: 'Scheduled end date' },
      assigned_to_user_id: { 
        type: 'uuid', 
        description: 'User assigned to this task',
        foreignKey: { table: 'users', column: 'id' },
        nullable: true
      },
      trade_required: { type: 'string', description: 'Required trade specialty', nullable: true },
      created_at: { type: 'timestamp', description: 'Created' },
      updated_at: { type: 'timestamp', description: 'Updated' },
    }
  },

  time_entries: {
    name: 'time_entries',
    description: 'Clock in/out records for tracking work hours',
    columns: {
      id: { type: 'uuid', description: 'Unique time entry ID' },
      user_id: { 
        type: 'uuid', 
        description: 'User who clocked in',
        foreignKey: { table: 'users', column: 'id' }
      },
      company_id: { 
        type: 'uuid',
        description: 'Company this entry belongs to',
        foreignKey: { table: 'companies', column: 'id' }
      },
      project_id: { 
        type: 'uuid', 
        description: 'Project worked on',
        foreignKey: { table: 'projects', column: 'id' },
        nullable: true
      },
      schedule_project_id: { 
        type: 'uuid', 
        description: 'Schedule project worked on',
        foreignKey: { table: 'schedule_projects', column: 'id' },
        nullable: true
      },
      clock_in_time: { type: 'timestamp', description: 'When user clocked in' },
      clock_out_time: { type: 'timestamp', description: 'When user clocked out', nullable: true },
      total_hours: { type: 'decimal', description: 'Total hours worked', nullable: true },
      status: { 
        type: 'enum', 
        description: 'Status: clocked_in, clocked_out, pending, approved, rejected' 
      },
      notes: { type: 'text', description: 'Work notes', nullable: true },
      hourly_rate: { type: 'decimal', description: 'Pay rate at time of entry' },
      total_pay: { type: 'decimal', description: 'Total pay for this entry', nullable: true },
      created_at: { type: 'timestamp', description: 'Entry created' },
      updated_at: { type: 'timestamp', description: 'Entry updated' },
    }
  },

  punchlist_items: {
    name: 'punchlist_items',
    description: 'Issues or tasks that need to be completed/fixed',
    columns: {
      id: { type: 'uuid', description: 'Unique punchlist item ID' },
      company_id: { 
        type: 'uuid',
        description: 'Company this item belongs to',
        foreignKey: { table: 'companies', column: 'id' }
      },
      project_id: { 
        type: 'uuid',
        description: 'Project this item belongs to',
        foreignKey: { table: 'projects', column: 'id' }
      },
      schedule_project_id: { 
        type: 'uuid',
        description: 'Schedule project this item belongs to',
        foreignKey: { table: 'schedule_projects', column: 'id' },
        nullable: true
      },
      title: { type: 'string', description: 'Issue title' },
      description: { type: 'text', description: 'Detailed description' },
      status: { 
        type: 'enum', 
        description: 'Status: open, in_progress, completed, verified' 
      },
      priority: { type: 'enum', description: 'Priority: low, medium, high, critical' },
      assigned_to_user_id: { 
        type: 'uuid',
        description: 'User assigned to fix this item',
        foreignKey: { table: 'users', column: 'id' },
        nullable: true
      },
      due_date: { type: 'date', description: 'Due date', nullable: true },
      completed_at: { type: 'timestamp', description: 'When completed', nullable: true },
      created_at: { type: 'timestamp', description: 'Created' },
      updated_at: { type: 'timestamp', description: 'Updated' },
    }
  },
}

// ==============================================
// HELPER: Format schema for AI prompt
// ==============================================
export function formatDatabaseSchemaForAI(): string {
  let schema = '# DATABASE STRUCTURE\n\n'
  schema += 'Here is your complete database schema. Understanding these tables and relationships will help you reason about data.\n\n'
  
  Object.values(DATABASE_SCHEMA).forEach(table => {
    schema += `## ${table.name}\n`
    schema += `${table.description}\n\n`
    schema += `**Columns:**\n`
    
    Object.entries(table.columns).forEach(([columnName, column]) => {
      let line = `- **${columnName}** (${column.type}): ${column.description}`
      if (column.foreignKey) {
        line += ` → References ${column.foreignKey.table}.${column.foreignKey.column}`
      }
      if (column.nullable) {
        line += ` (nullable)`
      }
      schema += line + '\n'
    })
    
    schema += '\n'
  })
  
  // Add relationship diagram
  schema += `## KEY RELATIONSHIPS\n\n`
  schema += `- **companies** → has many → **users** (company_id)\n`
  schema += `- **companies** → has many → **projects** (company_id)\n`
  schema += `- **projects** → has many → **project_members** (project_id)\n`
  schema += `- **users** → has many → **project_members** (user_id)\n`
  schema += `- **projects** → has many → **schedule_projects** (project_id)\n`
  schema += `- **projects** → has many → **time_entries** (project_id)\n`
  schema += `- **users** → has many → **time_entries** (user_id)\n`
  schema += `- **projects** → has many → **punchlist_items** (project_id)\n\n`
  
  return schema
}

// ==============================================
// HELPER: Get table relationships
// ==============================================
export function getTableRelationships(tableName: string): string[] {
  const relationships: string[] = []
  const table = DATABASE_SCHEMA[tableName]
  
  if (!table) return relationships
  
  // Find foreign keys in this table
  Object.entries(table.columns).forEach(([columnName, column]) => {
    if (column.foreignKey) {
      relationships.push(
        `${tableName}.${columnName} → ${column.foreignKey.table}.${column.foreignKey.column}`
      )
    }
  })
  
  // Find tables that reference this table
  Object.values(DATABASE_SCHEMA).forEach(otherTable => {
    Object.entries(otherTable.columns).forEach(([columnName, column]) => {
      if (column.foreignKey?.table === tableName) {
        relationships.push(
          `${otherTable.name}.${columnName} → ${tableName}.${column.foreignKey.column}`
        )
      }
    })
  })
  
  return relationships
}