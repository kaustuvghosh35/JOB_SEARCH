import { NotFoundException } from '@nestjs/common';
import type { ImprovedResume } from '@job-search/shared';
import { openDb } from '../../db/db.module.js';
import { resumes } from '../../db/schema/index.js';
import { ResumeExportService } from '../export/resume-export.service.js';
import type { ResumeService } from '../resume.service.js';
import { unsupportedNumbers } from './fact-check.js';
import type { ResumeImproverService } from './resume-improver.service.js';
import { VersionRepository } from './version.repository.js';
import { VersionsService } from './versions.service.js';

const original = 'Asha Rao. Backend Engineer at Acme since 2021. Reduced latency by 30%. Managed a team of 4.';

const improved = (bullet: string): ImprovedResume => ({
  fullName: 'Asha Rao',
  contact: [],
  summary: 'Backend engineer.',
  experience: [{ role: 'Backend Engineer', company: 'Acme', period: '2021 - Present', bullets: [bullet] }],
  education: [],
  skills: [],
  extras: [],
  changeNotes: [],
  openQuestions: [],
});

describe('unsupportedNumbers', () => {
  it('flags numbers that are not in the original', () => {
    expect(unsupportedNumbers(original, improved('Cut latency by 30% for a team of 4.'))).toEqual([]);
    expect(unsupportedNumbers(original, improved('Cut latency by 45% and saved $2,000.'))).toEqual(expect.arrayContaining(['45', '2000']));
  });
});

describe('VersionsService', () => {
  const setup = (out: ImprovedResume) => {
    const db = openDb(':memory:');
    const row = db.insert(resumes).values({ originalText: original, expiresAt: new Date(Date.now() + 1e6) }).returning().get();
    const svc = new VersionsService(
      { getRow: () => row } as unknown as ResumeService,
      { improve: async () => out } as unknown as ResumeImproverService,
      new VersionRepository(db),
      new ResumeExportService(),
    );
    return { svc, row };
  };

  it('saves a version, adds fact warnings, and returns the latest', async () => {
    const { svc, row } = setup(improved('Cut latency by 45%.'));
    const v = await svc.improve(row.id);
    expect(v.resume.openQuestions[0]).toMatch(/45/);
    expect((await svc.improve(row.id)).id).not.toBe(v.id);
    expect(svc.latest(row.id).resume.experience[0].bullets[0]).toBe('Cut latency by 45%.');
  });

  it('404s before any version and exports with a clean filename', async () => {
    const { svc, row } = setup(improved('Led a team of 4.'));
    expect(() => svc.latest(row.id)).toThrow(NotFoundException);
    await svc.improve(row.id);
    const file = await svc.export(row.id, 'pdf');
    expect(file.filename).toBe('Asha-Rao-improved.pdf');
    expect(file.buffer.subarray(0, 5).toString()).toBe('%PDF-');
  });
});
