import { Inject, Injectable } from '@nestjs/common';
import { desc, eq, sql } from 'drizzle-orm';
import type { ImprovedResume } from '@job-search/shared';
import { DB, type Db } from '../../db/db.module.js';
import { resumeVersions } from '../../db/schema/index.js';

export type VersionRow = Omit<typeof resumeVersions.$inferSelect, 'improved'> & { improved: ImprovedResume };

@Injectable()
export class VersionRepository {
  constructor(@Inject(DB) private readonly db: Db) {}

  create(resumeId: string, improved: ImprovedResume): VersionRow {
    return this.db.insert(resumeVersions).values({ resumeId, improved }).returning().get() as VersionRow;
  }

  findById(id: string): VersionRow | undefined {
    return this.db.select().from(resumeVersions).where(eq(resumeVersions.id, id)).get() as VersionRow | undefined;
  }

  latest(resumeId: string, skip = 0): VersionRow | undefined {
    return this.db
      .select()
      .from(resumeVersions)
      .where(eq(resumeVersions.resumeId, resumeId))
      .orderBy(desc(resumeVersions.createdAt), sql`rowid desc`)
      .limit(1)
      .offset(skip)
      .get() as VersionRow | undefined;
  }
}
