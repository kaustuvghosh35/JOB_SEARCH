import { z } from 'zod';

export const jobSources = ['linkedin', 'naukri', 'other'] as const;

export const jobSchema = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string().nullable(),
  location: z.string().nullable(),
  snippet: z.string(),
  source: z.enum(jobSources),
  applyUrl: z.string().url(),
  score: z.number().min(0).max(100),
});

export type Job = z.infer<typeof jobSchema>;
