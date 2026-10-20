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

const stripNoise = (title: string) =>
  clean(
    title
      .replace(/\s*(\.{3}|…)\s*$/, '')
      .replace(/\s*[|–—-]\s*(LinkedIn|Naukri\.com|Naukri)\s*$/i, '')
      .replace(/\s*[-|–—]\s*Jobs?\s*$/i, '')
      .replace(/\s+jobs?\s*$/i, ''),
  );

const SEP = /\s+[-–—]\s+/;

const parseLinkedin = (raw: string): Parsed => {
  const t = stripNoise(raw);
  const hiring = t.match(/^(.+?)\s+hiring\s+(.+?)(?:\s+in\s+(.+))?$/i);
  if (hiring) return { company: clean(hiring[1]), title: clean(hiring[2]), location: hiring[3] ? clean(hiring[3]) : null };

  const at = t.match(/^(.+)\s+at\s+(.+?)(?:\s+[–—-]\s+(.+))?$/i);
  if (at) return { title: clean(at[1]), company: clean(at[2]), location: at[3] ? clean(at[3]) : null };

  return { title: t, company: null, location: null };
};

const companyFromLinkedinSlug = (url: URL): string | null => {
  const slug = url.pathname.split('/jobs/view/')[1]?.replace(/\/$/, '');
  const m = slug && decodeURIComponent(slug).match(/-at-(.+?)-\d{6,}$/);
  if (!m) return null;
  return m[1].split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const parseNaukri = (raw: string): Parsed => {
  const t = stripNoise(raw).replace(/\s*[-–—]\s*\d+\+?(?:\s*to\s*\d+)?(?:\s*years?\b.*)?$/i, '');
  const parts = t.split(SEP).map(clean).filter(Boolean);
  if (parts.length >= 3) {
    return { title: parts.slice(0, -2).join(' - '), location: parts.at(-2)!, company: parts.at(-1)! };
  }
  if (parts.length === 2) return { title: parts[0], location: parts[1], company: null };
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
  const slugCompany = source === 'linkedin' && !parsed.company ? companyFromLinkedinSlug(new URL(hit.url)) : null;
  let { title, company } = parsed;
  if (slugCompany) {
    company = slugCompany;
    const tail = title.match(/^(.+?)\s+[-–—]\s+([^-–—]+)$/);
    const flat = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (tail && flat(tail[2]) === flat(slugCompany)) {
      title = clean(tail[1]);
      company = clean(tail[2]);
    }
  }
  return {
    id: createHash('sha1').update(applyUrl).digest('hex').slice(0, 16),
    title,
    company,
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
