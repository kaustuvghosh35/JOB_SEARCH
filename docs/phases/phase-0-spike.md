# Phase 0 — Spike: de-risk the job source

**Status:** ⬜ not started · **Est.:** ½ day · **Depends on:** TinyFish API key (agent.tinyfish.ai/api-keys)

## Goal
Prove TinyFish Search returns usable LinkedIn/Naukri job links, and that Vercel AI SDK streaming can be piped from NestJS.

## Tasks
- [ ] Get `TINYFISH_API_KEY`; store in local `.env` (never commit)
- [ ] Throwaway script (`scratch/tinyfish-spike.ts`) calling Search with ~10 real queries:
  - [ ] `site:linkedin.com/jobs …` and `site:naukri.com …`
  - [ ] India locations (`location` param) and `recency_minutes`
  - [ ] Check if `site:` operator is honoured; try alternatives (domain words, `domain_type`)
- [ ] Record per query: result count, % real job pages, % current, title format per site (`Role - Company - Location | LinkedIn`?)
- [ ] Try Fetch on a few Naukri URLs (markdown) — useful? blocked? Skip LinkedIn
- [ ] Mini Nest controller streaming `streamText` to the response; verify with `useChat` or curl; note the correct helper for the installed `ai` version
- [ ] Write findings below and update PLAN.md if a decision changes

## Exit criteria
- ≥60% of results are real, current job pages with parseable title/company/location **or** decision recorded to fall back to deep-link search URLs
- Fetch enrichment: on/off decision recorded
- Streaming from Nest confirmed

## Findings
_(fill in)_
