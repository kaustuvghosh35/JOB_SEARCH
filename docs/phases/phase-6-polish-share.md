# Phase 6 — Polish + share

**Status:** 🟡 partly done · **Est.:** 1 day · **Depends on:** Phases 3–5

## Goal
Friends can use it end-to-end without hand-holding.

## Tasks
- [x] Visual check in the browser (desktop + 375px mobile): home, results, improved before/after, chat. Strict B&W, Inter, hairline borders
- [x] Skeleton loaders, empty and error states (jobs, improved, chat, upload)
- [x] README: run steps, layout, migrations
- [x] `scripts/seed-demo.mjs` to preview the UI without API keys; `.claude/launch.json` for the dev servers
- [ ] Optional dark mode (skipped: light only, per decision 12)
- [ ] `ACCESS_CODE` guard (env var exists, not enforced yet; only needed if hosted publicly)
- [ ] Pick hosting and deploy (default: run locally; API needs a persistent volume for SQLite)
- [ ] Short note for friends: resume goes to Anthropic; data auto-expires after TTL
- [ ] Final end-to-end run with a real resume and both API keys

## Exit criteria
- Upload → jobs → Apply works; improved resume downloads; chat resumes after refresh — on the shared deployment (blocked on keys + hosting choice)

## Notes
- First tab click on the results page after load sometimes needed a second click in the preview browser; not reproduced as a bug, recheck with a real user session.
