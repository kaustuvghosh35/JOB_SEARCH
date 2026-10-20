import { Inject, Injectable } from '@nestjs/common';
import { lt } from 'drizzle-orm';
import { DB, type Db } from '../db/db.module.js';
import { chatSessions, jobSearchCache, resumes } from '../db/schema/index.js';

@Injectable()
export class CleanupRepository {
  constructor(@Inject(DB) private readonly db: Db) {}

  purge(now: Date, jobCacheMaxAge: Date): { resumes: number; sessions: number; jobCache: number } {
    return {
      resumes: this.db.delete(resumes).where(lt(resumes.expiresAt, now)).run().changes,
      sessions: this.db.delete(chatSessions).where(lt(chatSessions.expiresAt, now)).run().changes,
      jobCache: this.db.delete(jobSearchCache).where(lt(jobSearchCache.fetchedAt, jobCacheMaxAge)).run().changes,
    };
  }
}
