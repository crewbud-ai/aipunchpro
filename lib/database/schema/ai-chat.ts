// ==============================================
// lib/database/schema/ai-chat.ts - AI Chat Schema
// ==============================================

import { pgTable, uuid, varchar, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { companies } from './companies'
import { users } from './users'

// ==============================================
// AI CONVERSATIONS TABLE
// ==============================================
export const aiConversations = pgTable('ai_conversations', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).default('New Conversation').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('idx_ai_conversations_user_id').on(table.userId),
  companyIdIdx: index('idx_ai_conversations_company_id').on(table.companyId),
  createdAtIdx: index('idx_ai_conversations_created_at').on(table.createdAt),
}))

// ==============================================
// AI MESSAGES TABLE
// ==============================================
export const aiMessages = pgTable('ai_messages', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  conversationId: uuid('conversation_id').references(() => aiConversations.id, { onDelete: 'cascade' }).notNull(),
  role: varchar('role', { length: 20 }).notNull(), // 'user' | 'assistant' | 'system'
  content: text('content').notNull(),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  conversationIdIdx: index('idx_ai_messages_conversation_id').on(table.conversationId),
  createdAtIdx: index('idx_ai_messages_created_at').on(table.createdAt),
}))

// ==============================================
// TYPE EXPORTS
// ==============================================
export type AIConversation = typeof aiConversations.$inferSelect
export type NewAIConversation = typeof aiConversations.$inferInsert
export type AIMessage = typeof aiMessages.$inferSelect
export type NewAIMessage = typeof aiMessages.$inferInsert