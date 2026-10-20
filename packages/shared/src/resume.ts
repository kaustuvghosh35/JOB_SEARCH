import { z } from 'zod';

export const improvedResumeSchema = z.object({
  fullName: z.string().nullable(),
  contact: z.array(z.string()).describe('Email, phone, links exactly as in the original'),
  summary: z.string(),
  experience: z.array(
    z.object({
      role: z.string(),
      company: z.string(),
      period: z.string().nullable(),
      bullets: z.array(z.string()),
    }),
  ),
  education: z.array(z.object({ degree: z.string(), school: z.string(), period: z.string().nullable() })),
  skills: z.array(z.string()),
  extras: z.array(z.object({ title: z.string(), items: z.array(z.string()) })),
  changeNotes: z.array(z.string()).describe('What was changed and why'),
  openQuestions: z.array(z.string()).describe('Gaps the user should fill; never guess these'),
});

export type ImprovedResume = z.infer<typeof improvedResumeSchema>;

export type ResumeView = {
  id: string;
  filename: string | null;
  profile: import('./profile.js').Profile | null;
  createdAt: string;
  expiresAt: string;
};
