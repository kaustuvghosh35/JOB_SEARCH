# Progress Tracker

Legend: ⬜ not started · 🟡 in progress · ✅ done · ⛔ blocked

_Last updated: 2026-10-20 — planning complete, no code written yet._

| # | Phase | Est. | Status | Exit criteria (short) | Details |
|---|---|---|---|---|---|
| 0 | Spike: de-risk job source | ½ d | ✅ | ≥60% of TinyFish results are real, current job pages; Nest↔AI SDK streaming works | [phase-0](phases/phase-0-spike.md) |
| 1 | Foundations | 1 d | ✅ | App boots, DB migrates, B&W theme + Inter in place | [phase-1](phases/phase-1-foundations.md) |
| 2 | Resume in | 1–2 d | ✅ | 3+ real resumes parse to a correct profile | [phase-2](phases/phase-2-resume-in.md) |
| 3 | Jobs | 1–2 d | ✅ | Real resume → relevant jobs; Apply links open right postings | [phase-3](phases/phase-3-jobs.md) |
| 4 | Improve + export | 1–2 d | ✅ | DOCX/PDF opens cleanly; no invented facts | [phase-4](phases/phase-4-improve-export.md) |
| 5 | Chatbot | 1–2 d | ✅ | Refresh restores conversation; AI keeps context | [phase-5](phases/phase-5-chatbot.md) |
| 6 | Polish + share | 1 d | 🟡 | Friends can use it end-to-end | [phase-6](phases/phase-6-polish-share.md) |

Total ≈ 7–10 working days solo. Phases 3 and 4 are independent after Phase 2.

## How to update this file
- Flip the status emoji above when a phase starts/finishes, and tick tasks in the phase file.
- Add a dated line to the log below for anything notable (decisions, blockers, scope changes).
- Scope changes also go into [PLAN.md](PLAN.md).

## Log
- 2026-10-20 — Plan approved: NestJS + Next.js/shadcn, Vercel AI SDK (Claude) for resume work, TinyFish Search for jobs, SQLite/Drizzle, no auth, `sessionId` kept for chat history, B&W minimal design.

- 2026-10-20 — Phase 1 done. Phase 0 still blocked: no TINYFISH_API_KEY / ANTHROPIC_API_KEY. Moving to Phase 2 (needs Anthropic key to test profile extraction; code + tests first).

- 2026-10-20 — Phase 2 code done (6 unit tests pass, endpoint smoke OK). Live profile extraction untested: no Anthropic key. Moving to Phase 3 with fixture-based tests; real TinyFish title formats still unverified (Phase 0).

- 2026-10-20 — Phase 3 code done (19 API tests pass, web builds). Live TinyFish check pending. Moving to Phase 4.

- 2026-10-20 — Phase 4 code done (24 API tests pass, web builds). Live LLM check pending. Moving to Phase 5.

- 2026-10-20 — Phase 5 code done (31 API tests pass incl. mock-model streaming; web builds). Moving to Phase 6 polish; all live checks wait on API keys.

- 2026-10-20 — Phase 6 partly done: browser check passed (desktop + mobile), seeded demo shows jobs error state, before/after, DOCX/PDF downloads. All code phases built; 31 API tests pass. Remaining = things that need you: API keys, live checks, hosting choice.

- 2026-10-20 — TinyFish key added to `.env` (gitignored). Spike: 100% of hits are real job pages. Parser rewritten from real titles (38 API tests pass). Live jobs endpoint + UI verified. App running on :3000 (web) and :4000 (api).

- 2026-10-20 — LLM switched from Anthropic to Google Gemini (`@ai-sdk/google`, `GEMINI_API_KEY` in `.env`). Model `gemini-3-flash-preview` (3 s on a probe; 2.5 models are closed to new keys; 3.5/3.7/3.8 hung or were slow). Thinking level low: improve went 88 s → 4 s. Verified live: profile, improve, chat, chat→resume, DOCX upload, jobs. Prompts tightened against embellishment and `[NAME]` placeholders. Provider errors now return 502/429 instead of 500.

- 2026-10-20 — Bug: every AI call returned 500. Cause: free-tier Gemini quota (20 requests/day per model) exhausted on `gemini-3-flash-preview` by testing; error filter missed the SDK's `RetryError`. Fix: default `gemini-3.5-flash` plus model fallback chain, filter now returns a clear 429. 41 tests pass; profile (7 s), improve (16 s), chat verified live.

- 2026-10-20 — New: extra details + "build on current version" on the Improved tab; "Apply this chat to my resume" on the Chat tab (switches to the Improved tab with the new version). Verified live: chat fact "2 million transactions a day" appeared in the new version. 44 API tests pass.

## Needs from you (to finish)
1. Try your own real resumes (PDF with columns/tables especially) and read the improved text for embellishment
2. Hosting: run locally, or deploy (API needs a volume for SQLite)
3. Remote Gemini note: preview models can change or disappear; set `GEMINI_MODEL` in `.env` if one stops working

## Open questions / risks
- [ ] TinyFish Search quality for LinkedIn/Naukri job queries and `site:` operator support (Phase 0)
- [ ] AI SDK version installed → correct stream-pipe helper name (Phase 0)
- [ ] Hosting choice for sharing with friends (Phase 6)

- 2026-10-20 — UI restructure: `/studio` start page and `/studio/[resumeId]` workspace (chat + improved resume side by side, "Search jobs with this resume"). Jobs page is now jobs only. Job search uses the newest improved version via `use-latest`. 47 API tests pass; checked in the browser end to end (workspace → jobs with updated profile).

- 2026-10-21 — Studio start is now a single page (upload or type resume/notes) that auto-improves on arrival in the workspace. Verified in browser with rough notes → workspace → improved resume. 48 API tests pass.

- 2026-10-21 — Free-form resume sections. "Move experience below skills" failed because the format had fixed fields; replaced with a list of sections the AI fully controls (add/rename/reorder/split/merge). Verified live: one chat request renamed Summary to Profile, added Projects first, split Skills into two groups and moved Experience; page and DOCX match. Old versions are converted automatically. 52 API tests pass.

- 2026-10-21 — Root README rewritten for GitHub. Behaviour-neutral refactor (see decision 41; 55 tests pass, workspace, jobs, cache, export re-checked). Technical docs added under `docs/architecture/` (overview, flows, API, AI and data, web). Mermaid diagrams were written for GitHub rendering and not rendered locally.
