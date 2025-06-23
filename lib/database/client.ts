// ==============================================
// src/lib/database/client.ts - Core Database Client (Auth methods moved to services)
// ==============================================

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { createBrowserClient } from '@/lib/supabase/client'
import { env } from '@/lib/env'
import * as schema from './schema'

// PostgreSQL connection for Drizzle (server-side only)
let queryClient: postgres.Sql | null = null

function getPostgresClient() {
  if (!queryClient && env.DATABASE_URL) {
    queryClient = postgres(env.DATABASE_URL)
  }
  return queryClient
}

// Drizzle client (server-side only)
export function getDrizzleClient() {
  const client = getPostgresClient()
  if (!client) {
    throw new Error('Database URL not configured for Drizzle operations')
  }
  return drizzle(client, { schema })
}

// Server-side database operations (Supabase)
export function getServerDatabase() {
  return createServerClient()
}

// Admin database operations (bypasses RLS)
export function getAdminDatabase() {
  return createAdminClient()
}

// Client-side database operations (Supabase)
export function getClientDatabase() {
  return createBrowserClient()
}

// Core DatabaseClient - focused on general operations
export class DatabaseClient {
  private supabaseClient: ReturnType<typeof createServerClient>
  private drizzleClient?: ReturnType<typeof getDrizzleClient>
  
  constructor(isServer = false, isAdmin = false, useDrizzle = false) {
    if (isServer && isAdmin) {
      this.supabaseClient = createAdminClient()
    } else if (isServer) {
      this.supabaseClient = createServerClient()
    } else {
      this.supabaseClient = createBrowserClient()
    }
    
    // Only initialize Drizzle on server-side
    if (useDrizzle && isServer) {
      this.drizzleClient = getDrizzleClient()
    }
  }
  
  // Drizzle operations (type-safe, server-side only)
  get db() {
    if (!this.drizzleClient) {
      throw new Error('Drizzle client not initialized. Use server-side with useDrizzle=true')
    }
    return this.drizzleClient
  }
  
  // Raw Supabase client access for complex operations
  get supabase() {
    return this.supabaseClient
  }
  
  // ==============================================
  // GENERAL UTILITY METHODS
  // ==============================================
  
  // Transaction wrapper for complex operations
  async transaction<T>(operation: (client: typeof this.supabaseClient) => Promise<T>): Promise<T> {
    return await operation(this.supabaseClient)
  }
  
  // Generic create operation
  async create<T>(table: string, data: any): Promise<T> {
    const { data: result, error } = await this.supabaseClient
      .from(table)
      .insert([{
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single()
    
    if (error) throw error
    return result
  }
  
  // Generic update operation
  async update<T>(table: string, id: string, data: any): Promise<T> {
    const { data: result, error } = await this.supabaseClient
      .from(table)
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return result
  }
  
  // Generic delete operation
  async delete(table: string, id: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from(table)
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
  
  // Generic find by ID
  async findById<T>(table: string, id: string): Promise<T | null> {
    const { data, error } = await this.supabaseClient
      .from(table)
      .select('*')
      .eq('id', id)
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw error
    }
    return data
  }
  
  // Generic find with conditions
  async find<T>(table: string, conditions: Record<string, any>): Promise<T[]> {
    let query = this.supabaseClient.from(table).select('*')
    
    Object.entries(conditions).forEach(([key, value]) => {
      query = query.eq(key, value)
    })
    
    const { data, error } = await query
    
    if (error) throw error
    return data || []
  }
}

// Export schema for type inference
export { schema }