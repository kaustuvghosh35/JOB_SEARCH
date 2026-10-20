import mammoth from 'mammoth';
import { extractText, getDocumentProxy } from 'unpdf';
import { normalizeResume, type ImprovedResume, type ResumeSection } from '@job-search/shared';
import { resumeToText } from '../improver/render-text.js';
import { ResumeExportService } from './resume-export.service.js';

const sec = (title: string, over: Partial<ResumeSection> = {}): ResumeSection => ({
  title,
  paragraph: null,
  entries: [],
  items: [],
  itemsStyle: 'bullets',
  ...over,
});

const summary = sec('Summary', { paragraph: 'Backend engineer with five years building Node.js services.' });
const experience = sec('Experience', {
  entries: [{ heading: 'Backend Engineer', subheading: 'Acme', period: '2021 - Present', bullets: ['Built a billing API in NestJS.', 'Cut p95 latency by tuning PostgreSQL queries.'] }],
});
const education = sec('Education', { entries: [{ heading: 'B.Tech Computer Science', subheading: 'NIT Trichy', period: '2016 - 2020', bullets: [] }] });
const skills = sec('Skills', { items: ['TypeScript', 'NestJS', 'PostgreSQL'], itemsStyle: 'inline' });
const certs = sec('Certifications', { items: ['AWS Cloud Practitioner'] });

const make = (sections: ResumeSection[]): ImprovedResume => ({
  fullName: 'Asha Rao',
  contact: ['asha@example.com', '+91 98000 00000'],
  sections,
  changeNotes: [],
  openQuestions: [],
});

const resume = make([summary, experience, education, skills, certs]);

const docxText = async (svc: ResumeExportService, r: ImprovedResume) => (await mammoth.extractRawText({ buffer: await svc.toDocx(r) })).value;

describe('ResumeExportService', () => {
  const svc = new ResumeExportService();

  it('writes a DOCX that contains every section', async () => {
    const value = await docxText(svc, resume);
    for (const s of ['Asha Rao', 'asha@example.com', 'SUMMARY', 'billing API', 'NIT Trichy', 'NestJS', 'CERTIFICATIONS', 'AWS Cloud Practitioner']) {
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

  it('follows any section order, titles and extra sections the AI chose', async () => {
    const r = make([sec('Profile', { paragraph: 'Hello.' }), education, skills, sec('Selected Projects', { items: ['Billing API'] }), experience]);
    const value = await docxText(svc, r);
    const order = ['PROFILE', 'EDUCATION', 'SKILLS', 'SELECTED PROJECTS', 'EXPERIENCE'].map((h) => value.indexOf(h));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);

    const pdf = await getDocumentProxy(new Uint8Array(await svc.toPdf(r)));
    const { text } = await extractText(pdf, { mergePages: true });
    expect(text.indexOf('EDUCATION')).toBeLessThan(text.indexOf('EXPERIENCE'));

    const plain = resumeToText(r);
    expect(plain.indexOf('SKILLS')).toBeLessThan(plain.indexOf('EXPERIENCE'));
  });

  it('does not leave a dangling comma when the company is unknown', async () => {
    const r = make([sec('Experience', { entries: [{ heading: 'Design Intern', subheading: null, period: '6 months', bullets: ['Worked on UI.'] }] })]);
    const value = await docxText(svc, r);
    expect(value).toContain('Design Intern');
    expect(value).not.toContain('Design Intern,');
  });
});

describe('normalizeResume', () => {
  it('converts a version saved in the old fixed-field shape', () => {
    const legacy = {
      fullName: 'Asha Rao',
      contact: [],
      summary: 'Backend engineer.',
      experience: [{ role: 'Engineer', company: 'Acme', period: '2021', bullets: ['Built things.'] }],
      education: [{ degree: 'B.Tech', school: 'NIT', period: null }],
      skills: ['TypeScript'],
      extras: [{ title: 'Certifications', items: ['AWS'] }],
      changeNotes: ['x'],
      openQuestions: [],
    };
    const r = normalizeResume(legacy);
    expect(r.sections.map((s) => s.title)).toEqual(['Summary', 'Experience', 'Education', 'Skills', 'Certifications']);
    expect(r.sections[1].entries[0]).toMatchObject({ heading: 'Engineer', subheading: 'Acme' });
    expect(r.sections[3]).toMatchObject({ items: ['TypeScript'], itemsStyle: 'inline' });
  });

  it('keeps the shape of a new version untouched', () => {
    expect(normalizeResume(resume)).toEqual(resume);
  });

  it('honours the short-lived sectionOrder field', () => {
    const r = normalizeResume({ summary: 's', experience: [{ role: 'E', company: 'C', period: null, bullets: [] }], skills: ['a'], sectionOrder: ['skills', 'experience'] });
    expect(r.sections.map((s) => s.title)).toEqual(['Skills', 'Experience', 'Summary']);
  });
});
