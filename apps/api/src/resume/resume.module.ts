import { Module } from '@nestjs/common';
import { ProfileModule } from '../profile/profile.module.js';
import { ResumeExportService } from './export/resume-export.service.js';
import { ResumeImproverService } from './improver/resume-improver.service.js';
import { VersionRepository } from './improver/version.repository.js';
import { VersionsService } from './improver/versions.service.js';
import { ResumeController } from './resume.controller.js';
import { ResumeRepository } from './resume.repository.js';
import { ResumeService } from './resume.service.js';

@Module({
  imports: [ProfileModule],
  controllers: [ResumeController],
  providers: [
    ResumeService,
    ResumeRepository,
    ResumeImproverService,
    VersionRepository,
    VersionsService,
    ResumeExportService,
  ],
  exports: [ResumeService, VersionsService],
})
export class ResumeModule {}
