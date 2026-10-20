import { Module } from '@nestjs/common';
import { CleanupModule } from './cleanup/cleanup.module.js';
import { ConfigModule } from './config/config.module.js';
import { DbModule } from './db/db.module.js';
import { HealthController } from './health/health.controller.js';
import { JobsModule } from './jobs/jobs.module.js';
import { LlmModule } from './llm/llm.module.js';
import { ProfileModule } from './profile/profile.module.js';
import { ResumeModule } from './resume/resume.module.js';

@Module({
  imports: [ConfigModule, DbModule, LlmModule, ProfileModule, ResumeModule, JobsModule, CleanupModule],
  controllers: [HealthController],
})
export class AppModule {}
