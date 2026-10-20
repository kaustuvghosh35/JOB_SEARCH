import { Inject, Injectable } from '@nestjs/common';
import { asc, eq, sql } from 'drizzle-orm';
import type { UIMessage } from 'ai';
import { DB, type Db } from '../db/db.module.js';
import { chatMessages, chatSessions } from '../db/schema/index.js';

export type SessionRow = typeof chatSessions.$inferSelect;

@Injectable()
export class ChatRepository {
  constructor(@Inject(DB) private readonly db: Db) {}

  findSession(id: string): SessionRow | undefined {
    return this.db.select().from(chatSessions).where(eq(chatSessions.id, id)).get();
  }

  createSession(id: string, resumeId: string | null, expiresAt: Date): SessionRow {
    return this.db.insert(chatSessions).values({ id, resumeId, expiresAt }).returning().get();
  }

  linkResume(id: string, resumeId: string): void {
    this.db.update(chatSessions).set({ resumeId }).where(eq(chatSessions.id, id)).run();
  }

  messages(sessionId: string): UIMessage[] {
    return this.db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(asc(chatMessages.createdAt), sql`rowid`)
      .all()
      .map((m) => ({ id: m.id, role: m.role, parts: m.parts }) as UIMessage);
  }

  saveMessages(sessionId: string, messages: UIMessage[], expiresAt: Date): void {
    this.db.transaction((tx) => {
      for (const m of messages) {
        tx.insert(chatMessages)
          .values({ id: m.id, sessionId, role: m.role, parts: m.parts })
          .onConflictDoUpdate({
            target: chatMessages.id,
            set: { parts: m.parts },
            setWhere: eq(chatMessages.sessionId, sessionId),
          })
          .run();
      }
      tx.update(chatSessions).set({ updatedAt: new Date(), expiresAt }).where(eq(chatSessions.id, sessionId)).run();
    });
  }
}
