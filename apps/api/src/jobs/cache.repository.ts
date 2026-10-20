import { createHash } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DB, type Db } from '../db/db.module.js';
import { jobSearchCache } from '../db/schema/index.js';
import type { SearchHit, SearchRequest } from './providers/job-provider.js';

export const hashRequest = (req: SearchRequest) =>
  createHash('sha256').update(JSON.stringify([req.query.toLowerCase(), req.location?.toLowerCase() ?? ''])).digest('hex');

@Injectable()
export class JobCacheRepository {
  constructor(@Inject(DB) private readonly db: Db) {}

  get(req: SearchRequest, maxAgeMs: number): SearchHit[] | null {
    const row = this.db.select().from(jobSearchCache).where(eq(jobSearchCache.queryHash, hashRequest(req))).get();
    if (!row || Date.now() - row.fetchedAt.getTime() > maxAgeMs) return null;
    return row.results as SearchHit[];
  }

  set(req: SearchRequest, hits: SearchHit[]): void {
    const values = { queryHash: hashRequest(req), results: hits, fetchedAt: new Date() };
    this.db.insert(jobSearchCache).values(values).onConflictDoUpdate({ target: jobSearchCache.queryHash, set: values }).run();
  }
}
