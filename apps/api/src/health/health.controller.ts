import { Controller, Get, Inject } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { ENV } from '../config/config.module.js';
import type { Env } from '../config/env.js';
import { DB, type Db } from '../db/db.module.js';

@Controller('health')
export class HealthController {
  constructor(
    @Inject(DB) private readonly db: Db,
    @Inject(ENV) private readonly env: Env,
  ) {}

  @Get()
  get() {
    const row = this.db.get<{ n: number }>(sql`select count(*) as n from resumes`);
    return {
      status: 'ok',
      resumes: row?.n ?? 0,
      geminiKey: Boolean(this.env.GEMINI_API_KEY),
      tinyfishKey: Boolean(this.env.TINYFISH_API_KEY),
    };
  }
}
