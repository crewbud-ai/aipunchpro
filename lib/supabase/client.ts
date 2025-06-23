import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr'
import { env } from '@/lib/env'

// Singleton client for browser usage
let supabaseClient: ReturnType<typeof createSupabaseBrowserClient> | null = null

export function createBrowserClient() {
  if (!supabaseClient) {
    supabaseClient = createSupabaseBrowserClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  }
  
  return supabaseClient
}

// Export singleton instance
export const supabase = createBrowserClient()