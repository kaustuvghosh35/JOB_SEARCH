import type { Profile } from '@job-search/shared';
import type { ParsedHit } from './hit-parser.js';

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const containsTerm = (haystack: string, term: string) =>
  new RegExp(`(?<![\\p{L}\\p{N}])${escapeRe(term)}(?![\\p{L}\\p{N}])`, 'iu').test(haystack);

const STOP = new Set(['and', 'the', 'of', 'for', 'a', 'in', 'at', 'to']);
const tokens = (s: string) => s.toLowerCase().split(/[^\p{L}\p{N}+#.]+/u).filter((t) => t.length > 1 && !STOP.has(t));

export const scoreJob = (job: ParsedHit, profile: Profile): number => {
  const text = `${job.title} ${job.snippet}`;
  const skills = profile.skills.slice(0, 10);
  const skillRatio = skills.length ? skills.filter((s) => containsTerm(text, s)).length / Math.min(skills.length, 5) : 0;

  const wanted = tokens(profile.headline);
  const titleRatio = wanted.length ? wanted.filter((t) => containsTerm(job.title, t)).length / wanted.length : 0;

  return Math.round(100 * (0.6 * Math.min(skillRatio, 1) + 0.4 * titleRatio));
};
