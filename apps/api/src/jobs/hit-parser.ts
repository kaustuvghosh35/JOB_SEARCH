import { createHash } from 'node:crypto';
import type { Job } from '@job-search/shared';
import type { SearchHit } from './providers/job-provider.js';

type Source = 'linkedin' | 'naukri';
type Parsed = { title: string; company: string | null; location: string | null };

const clean = (s: string) => s.replace(/\s+/g, ' ').trim();

export const detectSource = (rawUrl: string): Source | null => {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, '').replace(/^[a-z]{2}\./, '');
  if (host.endsWith('linkedin.com') && url.pathname.includes('/jobs/view')) return 'linkedin';
  if (host.endsWith('naukri.com') && url.pathname.includes('/job-listings')) return 'naukri';
  return null;
};

const stripSuffix = (title: string) => clean(title.replace(/\s*[|–—-]\s*(LinkedIn|Naukri\.com|Naukri)\s*$/i, ''));

const parseLinkedin = (raw: string): Parsed => {
  const t = stripSuffix(raw);
  const hiring = t.match(/^(.+?)\s+hiring\s+(.+?)(?:\s+in\s+(.+))?$/i);
  if (hiring) return { company: clean(hiring[1]), title: clean(hiring[2]), location: hiring[3] ? clean(hiring[3]) : null };
  const parts = t.split(/\s+[-–—]\s+/).map(clean);
  if (parts.length >= 3) return { title: parts[0], company: parts[1], location: parts[2] };
  if (parts.length === 2) return { title: parts[0], company: parts[1], location: null };
  return { title: t, company: null, location: null };
};

const parseNaukri = (raw: string): Parsed => {
  const t = stripSuffix(raw);
  const at = t.match(/^(.+?)\s+Job(?:s)?\s+in\s+(.+?)\s+at\s+(.+)$/i);
  if (at) return { title: clean(at[1]), location: clean(at[2]), company: clean(at[3]) };
  const parts = t.split(/\s+[-–—]\s+/).map(clean);
  if (parts.length >= 3) return { title: parts[0], company: parts[1], location: parts[2] };
  if (parts.length === 2) return { title: parts[0], company: parts[1], location: null };
  return { title: t, company: null, location: null };
};

export const canonicalUrl = (rawUrl: string): string => {
  const url = new URL(rawUrl);
  url.search = '';
  url.hash = '';
  return url.toString().replace(/\/$/, '');
};

export type ParsedHit = Omit<Job, 'score'>;

export const parseHit = (hit: SearchHit): ParsedHit | null => {
  const source = detectSource(hit.url);
  if (!source) return null;
  const parsed = source === 'linkedin' ? parseLinkedin(hit.title) : parseNaukri(hit.title);
  if (!parsed.title) return null;
  const applyUrl = canonicalUrl(hit.url);
  return {
    id: createHash('sha1').update(applyUrl).digest('hex').slice(0, 16),
    title: parsed.title,
    company: parsed.company,
    location: parsed.location,
    snippet: clean(hit.snippet).slice(0, 280),
    source,
    applyUrl,
  };
};

export const dedupe = (jobs: ParsedHit[]): ParsedHit[] => {
  const seen = new Set<string>();
  return jobs.filter((j) => {
    const key = `${j.title}|${j.company ?? ''}`.toLowerCase();
    if (seen.has(j.applyUrl) || seen.has(key)) return false;
    seen.add(j.applyUrl);
    seen.add(key);
    return true;
  });
};
