import { Controller, Get, Inject, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { JobsService } from './jobs.service.js';

@Controller('resumes/:id/jobs')
export class JobsController {
  constructor(@Inject(JobsService) private readonly jobs: JobsService) {}

  @Get()
  search(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('role') role?: string,
    @Query('location') location?: string,
    @Query('remote') remote?: string,
  ) {
    return this.jobs.search(id, { role, location, remote: remote === 'true' });
  }
}
