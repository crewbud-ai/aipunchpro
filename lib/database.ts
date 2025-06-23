import { createClient } from "@supabase/supabase-js"

// Make sure these environment variables are set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create a single instance of the Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey)

// Type definitions for landing page data
export type NewsletterSubscriber = {
  id?: string
  email: string
  subscribed_at?: string
  source?: string
}

export type ContactSubmission = {
  id?: string
  first_name: string
  last_name: string
  email: string
  company?: string
  phone?: string
  message?: string
  submitted_at?: string
  status?: string
}
