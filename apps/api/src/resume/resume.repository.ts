import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { Profile } from '@job-search/shared';
import { DB, type Db } from '../db/db.module.js';
import { resumes } from '../db/schema/index.js';

export type ResumeRow = typeof resumes.$inferSelect;

export type NewResume = {
  originalText: string;
  filename: string | null;
  fileBlob: Buffer | null;
  profile: Profile;
  expiresAt: Date;
};

@Injectable()
export class ResumeRepository {
  constructor(@Inject(DB) private readonly db: Db) {}

  create(data: NewResume): ResumeRow {
    return this.db.insert(resumes).values(data).returning().get();
  }

  findById(id: string): ResumeRow | undefined {
    return this.db.select().from(resumes).where(eq(resumes.id, id)).get();
  }
}
