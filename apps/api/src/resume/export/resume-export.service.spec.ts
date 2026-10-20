import mammoth from 'mammoth';
import { extractText, getDocumentProxy } from 'unpdf';
import type { ImprovedResume } from '@job-search/shared';
import { ResumeExportService } from './resume-export.service.js';

const resume: ImprovedResume = {
  fullName: 'Asha Rao',
  contact: ['asha@example.com', '+91 98000 00000'],
  summary: 'Backend engineer with five years building Node.js services.',
  experience: [
    { role: 'Backend Engineer', company: 'Acme', period: '2021 - Present', bullets: ['Built a billing API in NestJS.', 'Cut p95 latency by tuning PostgreSQL queries.'] },
  ],
  education: [{ degree: 'B.Tech Computer Science', school: 'NIT Trichy', period: '2016 - 2020' }],
  skills: ['TypeScript', 'NestJS', 'PostgreSQL'],
  extras: [{ title: 'Certifications', items: ['AWS Cloud Practitioner'] }],
  changeNotes: [],
  openQuestions: [],
};

describe('ResumeExportService', () => {
  const svc = new ResumeExportService();

  it('writes a DOCX that contains every section', async () => {
    const { value } = await mammoth.extractRawText({ buffer: await svc.toDocx(resume) });
    for (const s of ['Asha Rao', 'asha@example.com', 'SUMMARY', 'billing API', 'NIT Trichy', 'NestJS', 'AWS Cloud Practitioner']) {
      expect(value).toContain(s);
    }
  });

  it('writes a valid PDF that contains the content', async () => {
    const buffer = await svc.toPdf(resume);
    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });
    for (const s of ['Asha Rao', 'billing API', 'NIT Trichy', 'TypeScript']) expect(text).toContain(s);
  });
});
