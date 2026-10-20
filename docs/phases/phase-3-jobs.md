# Phase 3 — Jobs (profile → apply links)

**Status:** 🟡 code done, live check pending (needs `TINYFISH_API_KEY` + Phase 0 spike) · **Est.:** 1–2 days · **Depends on:** Phase 2

## Goal
From a profile, show relevant LinkedIn/Naukri jobs with **Apply ↗** buttons that open the original postings.

## Tasks
- [x] `jobs/providers/job-provider.ts` interface + `tinyfish.provider.ts` (Search only; Fetch enrichment not built, flag `TINYFISH_FETCH_ENRICH` reserved)
- [x] `query-builder.ts`: one site-scoped query per source from role + top 3 skills + city; filters role/location/remote
- [x] `hit-parser.ts`: per-site title parsers (LinkedIn "Co hiring Title in Loc", dash formats; Naukri "Title Job in Loc at Co"); non-job URLs dropped; tracking params stripped
- [x] De-dupe by URL and title+company
- [x] `scorer.ts`: skill + title keyword overlap (word-boundary), 0–100, no LLM
- [x] `cache.repository.ts` + `job_search_cache` (TTL `JOB_CACHE_TTL_HOURS`, per query)
- [x] `GET /resumes/:id/jobs?role&location&remote`; partial failures become `warnings`, total failure → 502/503
- [x] Web: jobs panel (filters, skeletons, empty/error states) and job cards with Apply ↗ (`rel="noopener noreferrer"`)
- [x] 13 unit tests (parser, scorer, query builder, service incl. cache + failure paths)
- [ ] Live check with real TinyFish responses; adjust `SITE_SCOPES` and title patterns (`query-builder.ts`, `hit-parser.ts`)

## Exit criteria
- [ ] Real resume yields relevant jobs; 10 Apply links spot-checked (blocked on key)
- [x] Repeat search hits cache (unit test)
- [x] Provider failure → message, not a crash (unit test)

## Notes
- Title patterns are best guesses from common search-result formats; fixtures are synthetic. Re-record fixtures from real responses after the spike.
