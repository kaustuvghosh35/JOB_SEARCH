# Phase 0 — Spike: de-risk the job source

**Status:** ✅ done for TinyFish (streaming check with a real model pending Anthropic key) · **Est.:** ½ day · **Depends on:** TinyFish API key (agent.tinyfish.ai/api-keys)

## Goal
Prove TinyFish Search returns usable LinkedIn/Naukri job links, and that Vercel AI SDK streaming can be piped from NestJS.

## Tasks
- [ ] Get `TINYFISH_API_KEY`; put in root `.env` (never commit)
- [x] Spike script: `scripts/tinyfish-spike.mjs` runs 5 profiles x 2 site-scoped queries, prints % of hits that parse as job pages, saves raw hits to `scratch/out/tinyfish-spike.json`
- [ ] Run it: `npm run build -w @job-search/api && node scripts/tinyfish-spike.mjs`
- [ ] Check if `site:` is honoured; if not, change `SITE_SCOPES` in `apps/api/src/jobs/query-builder.ts`
- [ ] Compare real title formats with `hit-parser.ts` patterns; replace synthetic fixtures in `jobs.spec.ts` with real ones
- [ ] Try Fetch on a few Naukri URLs (markdown); decide `TINYFISH_FETCH_ENRICH` on/off (not built yet). Skip LinkedIn
- [x] Nest → AI SDK streaming: verified with the SDK mock model in `llm.spec.ts` (`toUIMessageStream` + persistence). Real-model streaming to the browser still needs an Anthropic key

## Exit criteria
- ≥60% of results are real, current job pages with parseable title/company/location, **or** decision recorded to fall back to deep-link search URLs
- Fetch enrichment on/off decided

## Findings (2026-10-20, real key)
- `site:linkedin.com/jobs/view` and `site:naukri.com/job-listings` are honoured: 100/100 results were real job pages (5 profiles x 2 sites, India cities). Target was 60%.
- Title formats seen: LinkedIn "Title at Company", "Company hiring Title in Location", "Title - Company", plain title (company only in URL slug). Naukri "Title - Location - Company - N to M years of experience" (often truncated with "..."), or "Title - Location".
- Parser after rewrite: company found for 82/100, location for 53/100. Missing ones show as title only; Apply link always works.
- Fetch enrichment: not tried, not needed (snippets are already informative). `TINYFISH_FETCH_ENRICH` stays off and unbuilt.
- Nest → AI SDK streaming: verified with mock model; real-model streaming still needs an Anthropic key.
- Raw hits: `scratch/out/tinyfish-spike.json` (gitignored); 9 representative ones saved as `apps/api/src/jobs/fixtures/tinyfish-hits.json`.
