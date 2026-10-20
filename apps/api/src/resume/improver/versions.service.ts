import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ImprovedVersion } from '@job-search/shared';
import { ProfileService } from '../../profile/profile.service.js';
import { ResumeService, type ResumeView } from '../resume.service.js';
import { resumeToText } from './render-text.js';
import { ResumeExportService } from '../export/resume-export.service.js';
import { withFactWarnings } from './fact-check.js';
import { ResumeImproverService } from './resume-improver.service.js';
import { VersionRepository, type VersionRow } from './version.repository.js';

export type ExportFormat = 'docx' | 'pdf';

export type ImproveOptions = { targetRole?: string; extra?: string; revise?: boolean };

const toVersion = (v: VersionRow, previous: VersionRow | undefined = undefined): ImprovedVersion => ({
  id: v.id,
  resumeId: v.resumeId,
  createdAt: v.createdAt.toISOString(),
  resume: v.improved,
  previous: previous?.improved ?? null,
});

@Injectable()
export class VersionsService {
  constructor(
    @Inject(ResumeService) private readonly resumes: ResumeService,
    @Inject(ResumeImproverService) private readonly improver: ResumeImproverService,
    @Inject(VersionRepository) private readonly versions: VersionRepository,
    @Inject(ResumeExportService) private readonly exporter: ResumeExportService,
    @Inject(ProfileService) private readonly profiles: ProfileService,
  ) {}

  async useLatestForJobs(resumeId: string): Promise<ResumeView> {
    const latest = this.versions.latest(resumeId);
    if (!latest) return this.resumes.get(resumeId);
    const profile = await this.profiles.extract(resumeToText(latest.improved));
    return this.resumes.updateProfile(resumeId, profile);
  }

  async improve(resumeId: string, opts: ImproveOptions = {}): Promise<ImprovedVersion> {
    const row = this.resumes.getRow(resumeId);
    const extra = opts.extra?.trim() || undefined;
    const prior = this.versions.latest(resumeId);
    const base = opts.revise ? prior?.improved : undefined;
    const improved = await this.improver.improve({
      original: row.originalText,
      targetRole: opts.targetRole?.trim() || undefined,
      extra,
      base,
    });
    const known = [row.originalText, extra, base && JSON.stringify(base)].filter(Boolean).join('\n');
    return toVersion(this.versions.create(resumeId, withFactWarnings(known, improved)), prior);
  }

  latest(resumeId: string): ImprovedVersion {
    this.resumes.getRow(resumeId);
    const v = this.versions.latest(resumeId);
    if (!v) throw new NotFoundException('No improved version yet.');
    return toVersion(v, this.versions.latest(resumeId, 1));
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
