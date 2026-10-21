import type { Profile } from '@job-search/shared';

export type JobFilters = { role?: string; location?: string; remote?: boolean };

export type PlannedQuery = { query: string; location?: string };

// TinyFish honours site: scoping; these paths limit results to individual job pages.
const SITE_SCOPES = ['site:linkedin.com/jobs/view', 'site:naukri.com/job-listings'];

const SENIORITY_WORD: Record<Profile['seniority'], string | null> = {
  intern: 'intern',
  junior: 'junior',
  mid: null,
  senior: 'senior',
  lead: 'lead',
  executive: null,
};

// Measured on 100 results per variant: adding seniority and years raised jobs whose stated experience range fits
// from 13 to 41 and whose title matches the seniority from 14 to 41, at a small cost in skill mentions.
const seniorityTerm = (profile: Profile, role: string) => {
  const word = SENIORITY_WORD[profile.seniority];
  if (!word) return null;
  const present = /\b(senior|sr\.?|lead|principal|junior|jr\.?|intern|associate|staff|head|director)\b/i.test(role);
  return present ? null : word;
};

const yearsTerm = (profile: Profile) => {
  const years = Math.floor(profile.yearsOfExperience);
  return years >= 1 ? `${years} years` : null;
};

export const buildQueries = (profile: Profile, filters: JobFilters = {}): PlannedQuery[] => {
  const role = filters.role?.trim() || profile.headline;
  const location = filters.location?.trim() || profile.location?.split(',')[0]?.trim() || undefined;
  const skills = profile.skills.slice(0, 3).join(' ');
  const remote = filters.remote ? 'remote' : '';

  return SITE_SCOPES.map((scope) => ({
    query: [scope, seniorityTerm(profile, role), role, skills, yearsTerm(profile), remote, location].filter(Boolean).join(' '),
    location,
  }));
};
