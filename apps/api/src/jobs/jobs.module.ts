import { Module } from '@nestjs/common';
import { ResumeModule } from '../resume/resume.module.js';
import { JobCacheRepository } from './cache.repository.js';
import { JobsController } from './jobs.controller.js';
import { JobsService } from './jobs.service.js';
import { JOB_PROVIDER } from './providers/job-provider.js';
import { TinyfishProvider } from './providers/tinyfish.provider.js';

@Module({
  imports: [ResumeModule],
  controllers: [JobsController],
  providers: [JobsService, JobCacheRepository, { provide: JOB_PROVIDER, useClass: TinyfishProvider }],
})
export class JobsModule {}
