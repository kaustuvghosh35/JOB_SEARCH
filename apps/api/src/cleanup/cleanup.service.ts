import { Inject, Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ENV } from '../config/config.module.js';
import type { Env } from '../config/env.js';
import { CleanupRepository } from './cleanup.repository.js';

@Injectable()
export class CleanupService implements OnModuleInit {
  private readonly logger = new Logger(CleanupService.name);

  constructor(
    @Inject(CleanupRepository) private readonly repo: CleanupRepository,
    @Inject(ENV) private readonly env: Env,
  ) {}

  onModuleInit() {
    this.purge();
  }

  @Cron(CronExpression.EVERY_HOUR)
  purge() {
    const now = new Date();
    const cacheCutoff = new Date(now.getTime() - this.env.JOB_CACHE_TTL_HOURS * 3_600_000);
    const removed = this.repo.purge(now, cacheCutoff);
    if (removed.resumes || removed.sessions || removed.jobCache) this.logger.log(`purged ${JSON.stringify(removed)}`);
  }
}
