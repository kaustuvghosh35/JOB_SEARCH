import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CleanupRepository } from './cleanup.repository.js';
import { CleanupService } from './cleanup.service.js';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [CleanupService, CleanupRepository],
})
export class CleanupModule {}
