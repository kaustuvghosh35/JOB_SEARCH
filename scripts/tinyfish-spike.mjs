// Phase 0 spike: run real TinyFish searches and report how many hits parse as LinkedIn/Naukri job pages.
// Usage: npm run build -w @job-search/api && node scripts/tinyfish-spike.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { parseHit } from '../apps/api/dist/jobs/hit-parser.js';
import { buildQueries } from '../apps/api/dist/jobs/query-builder.js';

try {
  process.loadEnvFile('.env');
} catch {}
const key = process.env.TINYFISH_API_KEY;
if (!key) {
  console.error('Set TINYFISH_API_KEY in .env first.');
  process.exit(1);
}

const profiles = [
  { headline: 'Backend Engineer', skills: ['Node.js', 'PostgreSQL', 'AWS'], location: 'Bengaluru, India' },
  { headline: 'Data Analyst', skills: ['SQL', 'Power BI', 'Python'], location: 'Pune, India' },
  { headline: 'Product Manager', skills: ['Roadmapping', 'SaaS', 'Analytics'], location: 'Mumbai, India' },
  { headline: 'Frontend Developer', skills: ['React', 'TypeScript', 'CSS'], location: 'Hyderabad, India' },
  { headline: 'DevOps Engineer', skills: ['Kubernetes', 'Terraform', 'AWS'], location: 'Delhi, India' },
];

const summary = [];
const raw = [];
for (const p of profiles) {
  for (const { query, location } of buildQueries({ ...p, skills: p.skills }, {})) {
    const url = new URL('https://api.search.tinyfish.ai');
    url.searchParams.set('query', query);
    if (location) url.searchParams.set('location', location);
    const res = await fetch(url, { headers: { 'X-API-Key': key } });
    if (!res.ok) {
      console.log(`${res.status} for: ${query}`);
      continue;
    }
    const { results = [] } = await res.json();
    const hits = results.map((r) => ({ title: r.title, snippet: r.snippet, url: r.url, siteName: r.site_name }));
    const jobs = hits.map(parseHit).filter(Boolean);
    const withCompany = jobs.filter((j) => j.company).length;
    summary.push({ query, results: hits.length, jobPages: jobs.length, withCompany });
    raw.push({ query, hits });
    console.log(`${jobs.length}/${hits.length} job pages (${withCompany} with company) :: ${query}`);
    for (const h of hits.slice(0, 3)) console.log(`   - ${h.title}\n     ${h.url}`);
  }
}

const total = summary.reduce((a, s) => a + s.results, 0);
const good = summary.reduce((a, s) => a + s.jobPages, 0);
console.log(`\nOverall: ${good}/${total} results parsed as job pages (${total ? Math.round((100 * good) / total) : 0}%). Target: >= 60%.`);
mkdirSync('scratch/out', { recursive: true });
writeFileSync('scratch/out/tinyfish-spike.json', JSON.stringify({ summary, raw }, null, 2));
console.log('Raw hits saved to scratch/out/tinyfish-spike.json (use them as test fixtures).');
