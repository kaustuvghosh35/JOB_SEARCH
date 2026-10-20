import { openDb } from '../db/db.module.js';
import { chatMessages, chatSessions, resumes } from '../db/schema/index.js';
import { CleanupRepository } from './cleanup.repository.js';

describe('CleanupRepository', () => {
  it('purges expired resumes with their chat data and keeps live ones', () => {
    const db = openDb(':memory:');
    const past = new Date(Date.now() - 1000);
    const future = new Date(Date.now() + 3_600_000);
    const mk = (expiresAt: Date) => db.insert(resumes).values({ originalText: 'x', expiresAt }).returning().get();
    const expired = mk(past);
    const live = mk(future);
    const session = db.insert(chatSessions).values({ resumeId: expired.id, expiresAt: future }).returning().get();
    db.insert(chatMessages).values({ sessionId: session.id, role: 'user', parts: [] }).run();

    const removed = new CleanupRepository(db).purge(new Date(), new Date(0));

    expect(removed.resumes).toBe(1);
    expect(db.select().from(resumes).all().map((r) => r.id)).toEqual([live.id]);
    expect(db.select().from(chatSessions).all()).toHaveLength(0);
    expect(db.select().from(chatMessages).all()).toHaveLength(0);
  });
});
