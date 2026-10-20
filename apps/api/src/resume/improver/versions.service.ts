import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ImprovedVersion } from '@job-search/shared';
import { ResumeService } from '../resume.service.js';
import { ResumeExportService } from '../export/resume-export.service.js';
import { withFactWarnings } from './fact-check.js';
import { ResumeImproverService } from './resume-improver.service.js';
import { VersionRepository, type VersionRow } from './version.repository.js';

export type ExportFormat = 'docx' | 'pdf';

const toVersion = (v: VersionRow): ImprovedVersion => ({
  id: v.id,
  resumeId: v.resumeId,
  createdAt: v.createdAt.toISOString(),
  resume: v.improved,
});

@Injectable()
export class VersionsService {
  constructor(
    @Inject(ResumeService) private readonly resumes: ResumeService,
    @Inject(ResumeImproverService) private readonly improver: ResumeImproverService,
    @Inject(VersionRepository) private readonly versions: VersionRepository,
    @Inject(ResumeExportService) private readonly exporter: ResumeExportService,
  ) {}

  async improve(resumeId: string, targetRole?: string): Promise<ImprovedVersion> {
    const row = this.resumes.getRow(resumeId);
    const improved = await this.improver.improve(row.originalText, targetRole?.trim() || undefined);
    return toVersion(this.versions.create(resumeId, withFactWarnings(row.originalText, improved)));
  }

  latest(resumeId: string): ImprovedVersion {
    this.resumes.getRow(resumeId);
    const v = this.versions.latest(resumeId);
    if (!v) throw new NotFoundException('No improved version yet.');
    return toVersion(v);
  }

  async export(resumeId: string, format: ExportFormat, versionId?: string) {
    const version = versionId ? this.find(resumeId, versionId) : this.latest(resumeId);
    const buffer = format === 'docx' ? await this.exporter.toDocx(version.resume) : await this.exporter.toPdf(version.resume);
    const name = (version.resume.fullName ?? 'resume').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'resume';
    return {
      buffer,
      filename: `${name}-improved.${format}`,
      contentType:
        format === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/pdf',
    };
  }

  private find(resumeId: string, versionId: string): ImprovedVersion {
    this.resumes.getRow(resumeId);
    const v = this.versions.findById(versionId);
    if (!v || v.resumeId !== resumeId) throw new NotFoundException('Version not found.');
    return toVersion(v);
  }
}
