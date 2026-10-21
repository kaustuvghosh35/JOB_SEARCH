import { BadGatewayException, BadRequestException, Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { Job } from '@job-search/shared';
import { hoursToMs } from '../common/time.js';
import { ENV } from '../config/config.module.js';
import type { Env } from '../config/env.js';
import { ResumeService } from '../resume/resume.service.js';
import { JobCacheRepository } from './cache.repository.js';
import { dedupe, parseHit } from './hit-parser.js';
import { JOB_PROVIDER, JobProviderError, type JobProvider, type SearchHit } from './providers/job-provider.js';
import { buildQueries, type JobFilters } from './query-builder.js';
import { scoreJob } from './scorer.js';

export type JobsResult = { jobs: Job[]; warnings: string[] };

@Injectable()
export class JobsService {
  constructor(
    @Inject(ResumeService) private readonly resumes: ResumeService,
    @Inject(JOB_PROVIDER) private readonly provider: JobProvider,
    @Inject(JobCacheRepository) private readonly cache: JobCacheRepository,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async search(resumeId: string, filters: JobFilters): Promise<JobsResult> {
    const { profile } = this.resumes.getRow(resumeId);
    if (!profile) throw new BadRequestException('This resume has no profile yet.');

    const maxAge = hoursToMs(this.env.JOB_CACHE_TTL_HOURS);
    const outcomes = await Promise.allSettled(
      buildQueries(profile, filters).map(async (req): Promise<SearchHit[]> => {
        const cached = this.cache.get(req, maxAge);
        if (cached) return cached;
        const hits = await this.provider.search(req);
        this.cache.set(req, hits);
        return hits;
      }),
    );

    const warnings: string[] = [];
    const hits: SearchHit[] = [];
    for (const o of outcomes) {
      if (o.status === 'fulfilled') hits.push(...o.value);
      else warnings.push(o.reason instanceof JobProviderError ? o.reason.message : 'A job search request failed.');
    }
    if (!hits.length && warnings.length === outcomes.length) {
      const message = warnings[0];
      throw message.includes('not configured') ? new ServiceUnavailableException(message) : new BadGatewayException(message);
    }

    const jobs = dedupe(hits.map(parseHit).filter((j) => j !== null))
      .map((j) => ({ ...j, score: scoreJob(j, profile) }))
      .sort((a, b) => b.score - a.score);
    return { jobs, warnings };
  }
}
