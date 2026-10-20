# Phase 3 — Jobs (profile → apply links)

**Status:** ⬜ not started · **Est.:** 1–2 days · **Depends on:** Phase 2 (and Phase 0 findings)

## Goal
From a profile, show relevant LinkedIn/Naukri jobs with **Apply ↗** buttons that open the original postings.

## Tasks
- [ ] `jobs/providers/job-provider.interface.ts` + `tinyfish.provider.ts` (Search; optional Fetch behind a feature flag, Naukri/other only — never LinkedIn)
- [ ] Query builder: 2–3 queries from profile (title + top skills + location), site-scoped per source, user-overridable filters (location, remote, role)
- [ ] Deterministic parsers per site → `{title, company, location, snippet, source, applyLinks[]}`; drop/flag unparseable rows
- [ ] Filter non-job pages; de-dupe by URL/title+company
- [ ] Keyword/skill-overlap match score vs. profile (no LLM)
- [ ] `cache.repository.ts` + `job_search_cache` (TTL 6–12h, hash of normalized query)
- [ ] `GET /resumes/:id/jobs`
- [ ] Web: Jobs tab — cards (title, company · location, snippet, source label, score, black Apply ↗ with `rel="noopener noreferrer"`), filters, skeletons, empty/error states
- [ ] Unit tests for parsers/scorer using saved sample TinyFish responses (fixtures from Phase 0)

## Exit criteria
- A real resume yields relevant jobs; spot-check 10 Apply links land on correct, live postings
- Repeat search hits cache
- Provider failure → graceful message, not a crash

## Notes
_(fill in)_
