import { z } from 'zod'

const envSchema = z.object({
  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required'),
  
  // Authentication & Security
  NEXTAUTH_SECRET: z.string().min(32, 'NextAuth secret must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url('Invalid NextAuth URL'),
  CSRF_SECRET: z.string().min(32, 'CSRF secret must be at least 32 characters'),
  
  // Email Configuration
  RESEND_API_KEY: z.string().min(1, 'Resend API key is required'),
  CONTACT_EMAIL: z.string().email('Invalid contact email'),
  FROM_EMAIL: z.string().email('Invalid from email'),
  
  // Application Configuration
  NEXT_PUBLIC_APP_URL: z.string().url('Invalid app URL'),
  NEXT_PUBLIC_APP_NAME: z.string().default('CrewBudAI'),
  NEXT_PUBLIC_APP_VERSION: z.string().default('1.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Google Maps & Places API Configuration (Optional)
  GOOGLE_PLACES_API_KEY: z.string().optional(),
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().optional(),
  
  // Business Configuration
  CLIENT_NAME: z.string().optional(),
  CLIENT_EMAIL: z.string().email().optional(),
  DEFAULT_TRIAL_DAYS: z.string().transform(Number).default('14'),
  MAX_USERS_TRIAL: z.string().transform(Number).default('10'),
  MAX_PROJECTS_TRIAL: z.string().transform(Number).default('5'),
  
  // Development
  DATABASE_URL: z.string().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  ENABLE_QUERY_LOGGING: z.string().transform(val => val === 'true').default('false'),
})

export type Env = z.infer<typeof envSchema>

// Validate environment variables
function validateEnv(): Env {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('\n')
      throw new Error(`❌ Invalid environment variables:\n${missingVars}`)
    }
    throw error
  }
}

export const env = validateEnv()

// Development helper to check required vars
export function checkEnvironment() {
  const requiredForDev = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'RESEND_API_KEY',
  ]
  
  const missing = requiredForDev.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:')
    missing.forEach(key => console.error(`  - ${key}`))
    console.error('\n📝 Please check your .env.local file')
    process.exit(1)
  }
  
  // Check optional Google API keys
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    console.warn('⚠️  Google Places API key not configured - location autocomplete will use fallback data')
  }
  
  console.log('✅ Environment variables validated successfully')
}