# Phase 1 — Foundations

**Status:** ✅ done (2026-10-20) · **Est.:** 1 day · **Depends on:** Phase 0 decisions

## Goal
Runnable skeleton: monorepo, API + web booting, DB migrated, monochrome theme.

## Tasks
- [x] `git init`, `.gitignore`, root npm workspaces
- [x] `apps/api`: Nest 12 scaffold (ESM); zod-validated `config/`; CORS for web origin
- [x] `apps/api/src/db`: `DbModule` (Drizzle + better-sqlite3), schema for `resumes`, `resume_versions`, `chat_sessions`, `chat_messages`, `job_search_cache`; `drizzle.config.ts`; migration `drizzle/0000_*.sql` applied on boot
- [x] `apps/api/src/llm`: `LlmModule` exposing Anthropic model via AI SDK (`claude-sonnet-5-5`)
- [x] `packages/shared`: zod `Profile`, `Job`, `ImprovedResume`
- [x] `apps/web`: Next 16 + Tailwind 4 + shadcn (neutral, grayscale tokens, no red/blue); Inter + Geist Mono; centered 720px layout
- [x] `.env.example`, root README
- [x] `GET /health` + web page showing API status

## Exit criteria
- [x] Both apps build; API boots, migrates a fresh DB, `/health` returns ok
- [x] Theme is strictly black/white/gray with Inter

## Notes
- Installed: ai 7.0.x, @ai-sdk/anthropic 4.x, @ai-sdk/react 4.x, drizzle-orm 0.45, Next 16.4, Nest 12. These are newer than the plan assumed: check `node_modules/ai/docs/` before using `generateObject`/`pipeUIMessageStreamToResponse` (Phase 2/5).
- `.npmrc` sets `legacy-peer-deps=true` (npm arborist crashed on peer resolution otherwise).
- Visual check of the web page in a browser not done yet (build only).
