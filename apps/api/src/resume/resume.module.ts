import { Module } from '@nestjs/common';
import { ProfileModule } from '../profile/profile.module.js';
import { ResumeController } from './resume.controller.js';
import { ResumeRepository } from './resume.repository.js';
import { ResumeService } from './resume.service.js';

@Module({
  imports: [ProfileModule],
  controllers: [ResumeController],
  providers: [ResumeService, ResumeRepository],
  exports: [ResumeService],
})
export class ResumeModule {}
