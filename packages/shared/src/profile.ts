import { z } from 'zod';

export const seniorityLevels = ['intern', 'junior', 'mid', 'senior', 'lead', 'executive'] as const;

export const profileSchema = z.object({
  fullName: z.string().nullable(),
  headline: z.string().describe('Current or target job title, e.g. "Backend Engineer"'),
  seniority: z.enum(seniorityLevels),
  yearsOfExperience: z.number().min(0).max(60),
  skills: z.array(z.string()).describe('Most important first, max 25'),
  location: z.string().nullable().describe('City, country; null if unknown'),
  summary: z.string().describe('2 sentence factual summary taken only from the resume'),
});

export type Profile = z.infer<typeof profileSchema>;
