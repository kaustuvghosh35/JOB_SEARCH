import { relations, sql } from 'drizzle-orm';
import { blob, index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import type { Profile } from '@job-search/shared';

const id = () => text('id').primaryKey().$defaultFn(() => crypto.randomUUID());
const createdAt = () => integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`);
const expiresAt = () => integer('expires_at', { mode: 'timestamp_ms' }).notNull();

export const resumes = sqliteTable(
  'resumes',
  {
    id: id(),
    originalText: text('original_text').notNull(),
    filename: text('filename'),
    fileBlob: blob('file_blob', { mode: 'buffer' }),
    profile: text('profile', { mode: 'json' }).$type<Profile>(),
    createdAt: createdAt(),
    expiresAt: expiresAt(),
  },
  (t) => [index('resumes_expires_idx').on(t.expiresAt)],
);

export const resumeVersions = sqliteTable('resume_versions', {
  id: id(),
  resumeId: text('resume_id').notNull().references(() => resumes.id, { onDelete: 'cascade' }),
  improved: text('improved', { mode: 'json' }).notNull(),
  createdAt: createdAt(),
});

export const chatSessions = sqliteTable(
  'chat_sessions',
  {
    id: id(),
    resumeId: text('resume_id').references(() => resumes.id, { onDelete: 'cascade' }),
    createdAt: createdAt(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
    expiresAt: expiresAt(),
  },
  (t) => [index('chat_sessions_expires_idx').on(t.expiresAt)],
);

export const chatMessages = sqliteTable(
  'chat_messages',
  {
    id: id(),
    sessionId: text('session_id').notNull().references(() => chatSessions.id, { onDelete: 'cascade' }),
    role: text('role', { enum: ['user', 'assistant', 'system'] }).notNull(),
    parts: text('parts', { mode: 'json' }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index('chat_messages_session_idx').on(t.sessionId, t.createdAt)],
);

export const jobSearchCache = sqliteTable('job_search_cache', {
  queryHash: text('query_hash').primaryKey(),
  results: text('results', { mode: 'json' }).notNull(),
  fetchedAt: integer('fetched_at', { mode: 'timestamp_ms' }).notNull(),
});

export const resumesRelations = relations(resumes, ({ many }) => ({
  versions: many(resumeVersions),
  sessions: many(chatSessions),
}));
