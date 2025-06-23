// ==============================================
// src/types/database.ts - Database Types
// ==============================================

export interface Company {
  id: string
  name: string
  slug: string
  industry?: string
  size?: string
  address?: string
  phone?: string
  website?: string
  logo_url?: string
  subscription_plan: string
  subscription_status: string
  trial_ends_at: string
  is_active: boolean
  max_users: number
  max_projects: number
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  company_id: string
  email: string
  password_hash?: string
  email_verified: boolean
  first_name: string
  last_name: string
  phone?: string
  avatar_url?: string
  role: 'super_admin' | 'admin' | 'manager' | 'member'
  permissions: Record<string, any>
  is_active: boolean
  last_login_at?: string
  created_at: string
  updated_at: string
  
  // Relations
  company?: Company
}

export interface UserSession {
  id: string
  user_id: string
  token_hash: string
  device_info?: Record<string, any>
  ip_address?: string
  expires_at: string
  created_at: string
}