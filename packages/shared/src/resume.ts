import { z } from 'zod';

export const entrySchema = z.object({
  heading: z.string().describe('Main line of the entry, e.g. a job title or degree'),
  subheading: z.string().nullable().describe('Second part of the heading, e.g. company or school; null if unknown'),
  period: z.string().nullable(),
  bullets: z.array(z.string()),
});

export const sectionSchema = z.object({
  title: z.string().describe('Section heading as it should appear, e.g. "Profile", "Experience", "Selected Projects"'),
  paragraph: z.string().nullable().describe('Free text for this section, or null'),
  entries: z.array(entrySchema).describe('Dated or titled entries such as jobs, degrees, projects; empty if not used'),
  items: z.array(z.string()).describe('Simple list items such as skills or certifications; empty if not used'),
  itemsStyle: z.enum(['bullets', 'inline']).describe('"inline" joins items with commas (good for skills), "bullets" lists them'),
});

export const improvedResumeSchema = z.object({
  fullName: z.string().nullable(),
  contact: z.array(z.string()).describe('Email, phone, links exactly as in the original'),
  sections: z
    .array(sectionSchema)
    .describe('The resume body in display order. Any sections, titles and order are allowed; tailor them to what the user wants.'),
  changeNotes: z.array(z.string()).describe('What was changed and why'),
  openQuestions: z.array(z.string()).describe('Gaps the user should fill; never guess these'),
});

export type ResumeEntry = z.infer<typeof entrySchema>;
export type ResumeSection = z.infer<typeof sectionSchema>;
export type ImprovedResume = z.infer<typeof improvedResumeSchema>;

type Legacy = {
  fullName?: string | null;
  contact?: string[];
  summary?: string;
  experience?: { role: string; company: string; period: string | null; bullets: string[] }[];
  education?: { degree: string; school: string; period: string | null }[];
  skills?: string[];
  extras?: { title: string; items: string[] }[];
  sectionOrder?: string[];
  changeNotes?: string[];
  openQuestions?: string[];
};

const emptySection = (title: string): ResumeSection => ({ title, paragraph: null, entries: [], items: [], itemsStyle: 'bullets' });

// Versions saved before sections existed used fixed fields; convert them so every consumer sees one shape.
export const normalizeResume = (raw: unknown): ImprovedResume => {
  const r = (raw ?? {}) as Legacy & { sections?: ResumeSection[] };
  const base = {
    fullName: r.fullName ?? null,
    contact: r.contact ?? [],
    changeNotes: r.changeNotes ?? [],
    openQuestions: r.openQuestions ?? [],
  };
  if (Array.isArray(r.sections)) return { ...base, sections: r.sections };

  const named: Record<string, ResumeSection[]> = {
    summary: r.summary ? [{ ...emptySection('Summary'), paragraph: r.summary }] : [],
    experience: r.experience?.length
      ? [
          {
            ...emptySection('Experience'),
            entries: r.experience.map((e) => ({ heading: e.role, subheading: e.company || null, period: e.period, bullets: e.bullets })),
          },
        ]
      : [],
    education: r.education?.length
      ? [
          {
            ...emptySection('Education'),
            entries: r.education.map((e) => ({ heading: e.degree, subheading: e.school || null, period: e.period, bullets: [] })),
          },
        ]
      : [],
    skills: r.skills?.length ? [{ ...emptySection('Skills'), items: r.skills, itemsStyle: 'inline' }] : [],
    extras: (r.extras ?? []).map((x) => ({ ...emptySection(x.title), items: x.items })),
  };
  const order = [...(r.sectionOrder ?? []), 'summary', 'experience', 'education', 'skills', 'extras'];
  const sections = [...new Set(order)].flatMap((k) => named[k] ?? []);
  return { ...base, sections };
};

export const entryHeading = (e: Pick<ResumeEntry, 'heading' | 'subheading'>) => [e.heading, e.subheading].filter(Boolean).join(', ');

export type ImprovedVersion = {
  id: string;
  resumeId: string;
  createdAt: string;
  resume: ImprovedResume;
  previous: ImprovedResume | null;
};

export type ResumeView = {
  id: string;
  filename: string | null;
  profile: import('./profile.js').Profile | null;
  createdAt: string;
  expiresAt: string;
};
