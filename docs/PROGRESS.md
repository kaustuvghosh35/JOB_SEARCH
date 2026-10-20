# Progress Tracker

Legend: ⬜ not started · 🟡 in progress · ✅ done · ⛔ blocked

_Last updated: 2026-10-20 — planning complete, no code written yet._

| # | Phase | Est. | Status | Exit criteria (short) | Details |
|---|---|---|---|---|---|
| 0 | Spike: de-risk job source | ½ d | ⬜ | ≥60% of TinyFish results are real, current job pages; Nest↔AI SDK streaming works | [phase-0](phases/phase-0-spike.md) |
| 1 | Foundations | 1 d | ✅ | App boots, DB migrates, B&W theme + Inter in place | [phase-1](phases/phase-1-foundations.md) |
| 2 | Resume in | 1–2 d | 🟡 | 3+ real resumes parse to a correct profile | [phase-2](phases/phase-2-resume-in.md) |
| 3 | Jobs | 1–2 d | 🟡 | Real resume → relevant jobs; Apply links open right postings | [phase-3](phases/phase-3-jobs.md) |
| 4 | Improve + export | 1–2 d | 🟡 | DOCX/PDF opens cleanly; no invented facts | [phase-4](phases/phase-4-improve-export.md) |
| 5 | Chatbot | 1–2 d | 🟡 | Refresh restores conversation; AI keeps context | [phase-5](phases/phase-5-chatbot.md) |
| 6 | Polish + share | 1 d | ⬜ | Friends can use it end-to-end | [phase-6](phases/phase-6-polish-share.md) |

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

## Open questions / risks
- [ ] TinyFish Search quality for LinkedIn/Naukri job queries and `site:` operator support (Phase 0)
- [ ] AI SDK version installed → correct stream-pipe helper name (Phase 0)
- [ ] Hosting choice for sharing with friends (Phase 6)
