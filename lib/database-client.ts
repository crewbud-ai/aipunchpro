import { createBrowserClient } from "./auth"

export const supabase = createBrowserClient()

// Company operations
export const createCompany = async (companyData: {
  name: string
  slug: string
  industry?: string
  size?: string
}) => {
  const { data, error } = await supabase.from("companies").insert([companyData]).select().single()

  if (error) throw error
  return data
}

export const getCompany = async (companyId: string) => {
  const { data, error } = await supabase.from("companies").select("*").eq("id", companyId).single()

  if (error) throw error
  return data
}

// User operations
export const createUser = async (userData: {
  company_id: string
  email: string
  first_name: string
  last_name: string
  role: string
  phone?: string
}) => {
  const { data, error } = await supabase.from("users").insert([userData]).select().single()

  if (error) throw error
  return data
}

export const getCompanyUsers = async (companyId: string) => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .order("first_name")

  if (error) throw error
  return data
}

// Project operations
export const createProject = async (projectData: {
  company_id: string
  name: string
  description?: string
  budget?: number
  start_date?: string
  end_date?: string
  location?: string
  project_manager_id?: string
  created_by: string
}) => {
  const { data, error } = await supabase.from("projects").insert([projectData]).select().single()

  if (error) throw error
  return data
}

export const getCompanyProjects = async (companyId: string) => {
  const { data, error } = await supabase
    .from("projects")
    .select(`
      *,
      project_manager:users!projects_project_manager_id_fkey(first_name, last_name),
      created_by_user:users!projects_created_by_fkey(first_name, last_name)
    `)
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

// Task operations
export const createTask = async (taskData: {
  company_id: string
  project_id: string
  title: string
  description?: string
  priority: string
  trade?: string
  location?: string
  assigned_to?: string
  created_by: string
  due_date?: string
}) => {
  const { data, error } = await supabase.from("tasks").insert([taskData]).select().single()

  if (error) throw error
  return data
}

export const getCompanyTasks = async (companyId: string) => {
  const { data, error } = await supabase
    .from("tasks")
    .select(`
      *,
      project:projects(name),
      assigned_user:users!tasks_assigned_to_fkey(first_name, last_name),
      created_by_user:users!tasks_created_by_fkey(first_name, last_name)
    `)
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

// Time tracking operations
export const createTimeEntry = async (timeData: {
  company_id: string
  user_id: string
  project_id: string
  task_id?: string
  date: string
  total_hours: number
  overtime_hours?: number
  hourly_rate?: number
  overtime_rate?: number
  description?: string
}) => {
  const { data, error } = await supabase.from("time_entries").insert([timeData]).select().single()

  if (error) throw error
  return data
}

export const getCompanyTimeEntries = async (companyId: string, startDate?: string, endDate?: string) => {
  let query = supabase
    .from("time_entries")
    .select(`
      *,
      user:users(first_name, last_name, role),
      project:projects(name)
    `)
    .eq("company_id", companyId)

  if (startDate) query = query.gte("date", startDate)
  if (endDate) query = query.lte("date", endDate)

  const { data, error } = await query.order("date", { ascending: false })

  if (error) throw error
  return data
}

// File upload operations
export const uploadFile = async (file: File, bucket: string, path: string) => {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file)

  if (error) throw error
  return data
}

export const getFileUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)

  return data.publicUrl
}
