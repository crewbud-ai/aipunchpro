import { defineConfig } from 'drizzle-kit'
import { env } from './lib/env'

export default defineConfig({
  schema: './lib/database/schema/index.ts',
  out: './lib/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
  tablesFilter: ['!auth.*'], // Exclude Supabase auth tables
})