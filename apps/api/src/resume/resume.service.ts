import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Profile } from '@job-search/shared';
import { hoursFromNow } from '../common/time.js';
import { ENV } from '../config/config.module.js';
import type { Env } from '../config/env.js';
import { ProfileService } from '../profile/profile.service.js';
import { parseResumeFile } from './parsers/parser.factory.js';
import { normalizeText, ResumeParseError } from './parsers/resume-parser.js';
import { ResumeRepository, type ResumeRow } from './resume.repository.js';

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_TEXT_CHARS = 30_000;
const MIN_TEXT_CHARS = 30;

export type ResumeView = Pick<ResumeRow, 'id' | 'filename' | 'profile' | 'createdAt' | 'expiresAt'>;

const toView = (r: ResumeRow): ResumeView => ({
  id: r.id,
  filename: r.filename,
  profile: r.profile,
  createdAt: r.createdAt,
  expiresAt: r.expiresAt,
});

@Injectable()
export class ResumeService {
  constructor(
    @Inject(ResumeRepository) private readonly repo: ResumeRepository,
    @Inject(ProfileService) private readonly profiles: ProfileService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async createFromFile(file: { buffer: Buffer; originalname: string; mimetype: string }): Promise<ResumeView> {
    let text: string;
    try {
      text = await parseResumeFile(file);
    } catch (e) {
      if (e instanceof ResumeParseError) throw new BadRequestException(e.message);
      throw e;
    }
    return this.save(text, file.originalname, file.buffer);
  }

  async createFromText(raw: string): Promise<ResumeView> {
    const text = normalizeText(raw);
    if (text.length < MIN_TEXT_CHARS) throw new BadRequestException('Write a little more about yourself (a few lines is enough).');
    if (text.length > MAX_TEXT_CHARS) throw new BadRequestException('Resume text is too long.');
    return this.save(text, null, null);
  }

  get(id: string): ResumeView {
    return toView(this.getRow(id));
  }

  updateProfile(id: string, profile: Profile): ResumeView {
    this.getRow(id);
    this.repo.updateProfile(id, profile);
    return this.get(id);
  }

  getRow(id: string): ResumeRow {
    const row = this.repo.findById(id);
    if (!row || row.expiresAt.getTime() < Date.now()) throw new NotFoundException('Resume not found or expired.');
    return row;
  }

  private async save(text: string, filename: string | null, fileBlob: Buffer | null): Promise<ResumeView> {
    const profile = await this.profiles.extract(text);
    const expiresAt = hoursFromNow(this.env.RESUME_TTL_HOURS);
    return toView(this.repo.create({ originalText: text, filename, fileBlob, profile, expiresAt }));
  }
}
