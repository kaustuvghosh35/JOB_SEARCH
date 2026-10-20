import { ServiceUnavailableException } from '@nestjs/common';
import type { Profile } from '@job-search/shared';
import { loadEnv } from '../config/env.js';
import { openDb } from '../db/db.module.js';
import type { ResumeService } from '../resume/resume.service.js';
import { JobCacheRepository } from './cache.repository.js';
import { dedupe, detectSource, parseHit } from './hit-parser.js';
import { JobProviderError, type JobProvider, type SearchHit } from './providers/job-provider.js';
import { buildQueries } from './query-builder.js';
import { scoreJob } from './scorer.js';
import { JobsService } from './jobs.service.js';

const profile: Profile = {
  fullName: 'Asha Rao',
  headline: 'Backend Engineer',
  seniority: 'mid',
  yearsOfExperience: 5,
  skills: ['TypeScript', 'NestJS', 'PostgreSQL', 'Docker', 'AWS'],
  location: 'Bengaluru, India',
  summary: 'x',
};

const hit = (title: string, url: string, snippet = ''): SearchHit => ({ title, url, snippet, siteName: '' });

const LI = 'https://in.linkedin.com/jobs/view/backend-engineer-at-acme-3912345?trk=public_jobs';
const NK = 'https://www.naukri.com/job-listings-backend-engineer-acme-bengaluru-3-to-6-years-123456';

describe('detectSource', () => {
  it('recognises job pages and rejects others', () => {
    expect(detectSource(LI)).toBe('linkedin');
    expect(detectSource(NK)).toBe('naukri');
    expect(detectSource('https://www.linkedin.com/company/acme')).toBeNull();
    expect(detectSource('https://example.com/jobs/view/1')).toBeNull();
    expect(detectSource('not a url')).toBeNull();
  });
});

describe('parseHit', () => {
  it('parses LinkedIn "Company hiring Title in Location"', () => {
    const j = parseHit(hit('Acme hiring Backend Engineer in Bengaluru, Karnataka, India | LinkedIn', LI))!;
    expect(j).toMatchObject({ company: 'Acme', title: 'Backend Engineer', location: 'Bengaluru, Karnataka, India', source: 'linkedin' });
    expect(j.applyUrl).not.toContain('trk=');
  });

  it('parses dash-separated titles', () => {
    const j = parseHit(hit('Backend Engineer - Acme - Bengaluru | LinkedIn', LI))!;
    expect(j).toMatchObject({ title: 'Backend Engineer', company: 'Acme', location: 'Bengaluru' });
  });

  it('parses Naukri "Title Job in Location at Company"', () => {
    const j = parseHit(hit('Backend Engineer Job in Bengaluru at Acme - Naukri.com', NK))!;
    expect(j).toMatchObject({ title: 'Backend Engineer', location: 'Bengaluru', company: 'Acme', source: 'naukri' });
  });

  it('keeps the raw title when the pattern is unknown', () => {
    const j = parseHit(hit('Backend Engineer', NK))!;
    expect(j).toMatchObject({ title: 'Backend Engineer', company: null, location: null });
  });

  it('drops non job pages', () => {
    expect(parseHit(hit('Acme | LinkedIn', 'https://www.linkedin.com/company/acme'))).toBeNull();
  });
});

describe('dedupe', () => {
  it('removes same url and same title+company', () => {
    const a = parseHit(hit('Backend Engineer - Acme - Pune | LinkedIn', LI))!;
    const b = { ...a, id: 'other', applyUrl: 'https://www.linkedin.com/jobs/view/2' };
    expect(dedupe([a, a, b])).toHaveLength(1);
  });
});

describe('scoreJob', () => {
  it('ranks matching skills and title higher', () => {
    const good = parseHit(hit('Backend Engineer - Acme - Pune | LinkedIn', LI, 'TypeScript NestJS PostgreSQL Docker'))!;
    const bad = parseHit(hit('Sales Manager - Foo - Pune | LinkedIn', LI, 'Negotiation and CRM'))!;
    expect(scoreJob(good, profile)).toBeGreaterThan(80);
    expect(scoreJob(bad, profile)).toBe(0);
  });

  it('does not match skill substrings', () => {
    const j = parseHit(hit('Cloud Engineer - Acme - Pune | LinkedIn', LI, 'JAWS and Dockerfile expertise'))!;
    expect(scoreJob(j, profile)).toBeLessThan(30);
  });
});

describe('buildQueries', () => {
  it('scopes per site and applies filters', () => {
    const [li, nk] = buildQueries(profile, { remote: true });
    expect(li.query).toContain('site:linkedin.com/jobs/view');
    expect(li.query).toContain('Backend Engineer');
    expect(li.query).toContain('remote');
    expect(li.location).toBe('Bengaluru');
    expect(nk.query).toContain('site:naukri.com');
    expect(buildQueries(profile, { role: 'SRE', location: 'Pune' })[0].query).toMatch(/SRE.*Pune$/);
  });
});

describe('JobsService', () => {
  const resumes = { getRow: () => ({ profile }) } as unknown as ResumeService;
  const env = { ...loadEnv(), JOB_CACHE_TTL_HOURS: 8 };
  const make = (provider: JobProvider) => new JobsService(resumes, provider, new JobCacheRepository(openDb(':memory:')), env);

  it('returns scored, deduped jobs and caches provider calls', async () => {
    let calls = 0;
    const provider: JobProvider = {
      search: async ({ query }) => {
        calls++;
        return query.includes('linkedin')
          ? [hit('Acme hiring Backend Engineer in Pune | LinkedIn', LI, 'TypeScript NestJS')]
          : [hit('Backend Engineer Job in Pune at Acme - Naukri.com', NK, 'PostgreSQL')];
      },
    };
    const svc = make(provider);
    const first = await svc.search('id', {});
    expect(first.jobs).toHaveLength(1);
    expect(first.jobs[0].score).toBeGreaterThan(0);
    await svc.search('id', {});
    expect(calls).toBe(2);
  });

  it('keeps results with a warning when one query fails', async () => {
    const provider: JobProvider = {
      search: async ({ query }) => {
        if (query.includes('naukri')) throw new JobProviderError('Job search failed (500).');
        return [hit('Acme hiring Backend Engineer in Pune | LinkedIn', LI)];
      },
    };
    const res = await make(provider).search('id', {});
    expect(res.jobs).toHaveLength(1);
    expect(res.warnings).toEqual(['Job search failed (500).']);
  });

  it('maps a missing key to 503', async () => {
    const provider: JobProvider = {
      search: async () => {
        throw new JobProviderError('TINYFISH_API_KEY is not configured on the server.');
      },
    };
    await expect(make(provider).search('id', {})).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
