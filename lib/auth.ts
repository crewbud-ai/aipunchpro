import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Only browser client here
export const createBrowserClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey)
}

// Keep all your types here
export type User = {
  id: string
  company_id: string
  email: string
  first_name: string
  last_name: string
  role: "admin" | "manager" | "member"
  phone?: string
  avatar_url?: string
  is_active: boolean
}

export type Company = {
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
}

export type Project = {
  id: string
  company_id: string
  name: string
  description?: string
  status: "planning" | "active" | "on_hold" | "completed"
  priority: "low" | "medium" | "high"
  budget?: number
  spent: number
  progress: number
  start_date?: string
  end_date?: string
  location?: string
  project_manager_id?: string
  created_by: string
  created_at: string
  updated_at: string
}

export type Task = {
  id: string
  company_id: string
  project_id: string
  title: string
  description?: string
  status: "open" | "in_progress" | "completed" | "cancelled"
  priority: "low" | "medium" | "high"
  trade?: string
  location?: string
  assigned_to?: string
  created_by: string
  due_date?: string
  completed_at?: string
  created_at: string
  updated_at: string
}

export type TimeEntry = {
  id: string
  company_id: string
  user_id: string
  project_id: string
  task_id?: string
  date: string
  start_time?: string
  end_time?: string
  break_minutes: number
  total_hours: number
  overtime_hours: number
  hourly_rate?: number
  overtime_rate?: number
  description?: string
  status: "pending" | "approved" | "rejected"
  approved_by?: string
  approved_at?: string
  created_at: string
}