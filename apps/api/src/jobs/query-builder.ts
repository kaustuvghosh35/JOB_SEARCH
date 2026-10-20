import type { Profile } from '@job-search/shared';

export type JobFilters = { role?: string; location?: string; remote?: boolean };

export type PlannedQuery = { query: string; location?: string };

// site: scoping is unverified against TinyFish; adjust here after the Phase 0 spike.
const SITE_SCOPES = ['site:linkedin.com/jobs/view', 'site:naukri.com/job-listings'];

export const buildQueries = (profile: Profile, filters: JobFilters = {}): PlannedQuery[] => {
  const role = filters.role?.trim() || profile.headline;
  const location = filters.location?.trim() || profile.location?.split(',')[0]?.trim() || undefined;
  const skills = profile.skills.slice(0, 3).join(' ');
  const remote = filters.remote ? 'remote' : '';

  return SITE_SCOPES.map((scope) => ({
    query: [scope, role, skills, remote, location].filter(Boolean).join(' '),
    location,
  }));
};
