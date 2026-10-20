# Decisions Log

Decisions made autonomously (per user instruction: decide, don't ask, log here). Newest last. Review anytime; flag any to reverse.

| # | Date | Decision | Why | Reversible? |
|---|---|---|---|---|
| 1 | 2026-10-20 | `CLAUDE.md` = user's pasted style/commands/git/token rules verbatim + a short project section on top | User asked for CLAUDE.md "based on the below contents" | Yes |
| 2 | 2026-10-20 | Use `npm` workspaces, not `vp`/`pnpm` | `vp`, `fd`, `rg` are not installed (checked); installing Vite+ means running a downloaded install script, not worth it for a POC. CLAUDE.md says use `vp` when available | Yes: swap to `vp` later, lockfile regenerates |
| 3 | 2026-10-20 | Use the Grep/Glob tools instead of `rg`/`fd` | Same reason: not installed | Yes |
| 4 | 2026-10-20 | `git init` and commit per task on `main`; no remote/PR until user adds one | CLAUDE.md allows commits without asking; no remote exists | Yes |
| 5 | 2026-10-20 | Run Phase 1 (foundations) first; Phase 0 TinyFish spike is blocked on API key, so only prep its script now | No `TINYFISH_API_KEY` / `ANTHROPIC_API_KEY` in env. Phase 0's streaming check is folded into Phase 1/5 | Yes |
| 6 | 2026-10-20 | Never invent or hardcode API keys; keys read from `.env` (gitignored), `.env.example` documents them | Security | No |
| 7 | 2026-10-20 | Cloudflare `cf` section kept in CLAUDE.md but unused; hosting decision deferred to Phase 6 (default: run locally) | `cf` not installed; no hosting requested yet | Yes |
| 8 | 2026-10-20 | `.npmrc` with `legacy-peer-deps=true` | npm 10 arborist crashes (`edgesOut`) resolving vitest/vite peers in `apps/api` | Yes |
| 9 | 2026-10-20 | Pin `@nestjs/schedule` ^12 | v6 peers on Nest 10/11 only; Nest scaffold is v12 | Yes |
| 10 | 2026-10-20 | API port 4000, web port 3000; env loaded via `process.loadEnvFile` from `apps/api/.env` or root `.env` | No `@nestjs/config` dependency needed | Yes |
| 11 | 2026-10-20 | Removed `cacheComponents`/`partialPrefetching` from Next config template | Experimental; friction for a client-fetching app | Yes |
| 12 | 2026-10-20 | shadcn theme: red/blue tokens (destructive, sidebar-primary) replaced with grays; light theme only | User asked strictly black & white | Yes |
| 14 | 2026-10-20 | AI SDK v7 APIs: `generateText` + `Output.object` (not `generateObject`), `instructions`/`system` (kept `system` in profile/improver; deprecated alias), `toUIMessageStream` + `pipeUIMessageStreamToResponse` | Installed `ai@7`; docs bundled in `node_modules/ai/docs` | Yes |
| 15 | 2026-10-20 | Chat `sessionId` is generated client-side (UUID in localStorage) and the server creates the session on first message | Simplest fit for useChat's `id` and no-login model | Yes |
| 16 | 2026-10-20 | Added number "fact check" on improved resumes: figures not in the original are listed under "Check these before you send it" | Cheap guard against fabricated metrics beyond prompt rules | Yes |
| 17 | 2026-10-20 | Job pipeline uses synthetic fixtures for title patterns until a TinyFish key allows real ones | No key available; Phase 0 spike still pending | Yes |
| 18 | 2026-10-20 | TinyFish key stored in root `.env` only (gitignored, verified with `git check-ignore`); never written to docs, code or commits | User supplied it for this app | Yes |
| 19 | 2026-10-20 | Hit parser rewritten from real TinyFish titles; LinkedIn company falls back to the URL slug; dashes in LinkedIn titles are kept (not split) | Real titles differ from the guessed formats | Yes |
| 20 | 2026-10-20 | Kept the two-query design (one LinkedIn, one Naukri), no Fetch enrichment | 100% job-page hit rate and useful snippets make Fetch unnecessary | Yes |
| 21 | 2026-10-20 | LLM provider: Anthropic → Google Gemini (`@ai-sdk/google`; env `GEMINI_API_KEY`, `GEMINI_MODEL`); Gemini key stored only in gitignored `.env` | User request | Yes (provider is isolated in `llm/llm.module.ts`) |
| 22 | 2026-10-20 | Default model `gemini-3-flash-preview` | Probed with the key: 2.5 models return 404 for new users; 3.5/3.7/3.8-flash and flash-latest timed out; this one answers in ~3 s. Preview models may be retired, hence the env override | Yes |
| 23 | 2026-10-20 | Thinking level `low` for all LLM calls (`llm/provider-options.ts`) | Improve took 88 s with default thinking, 4 s with low, with no visible quality loss | Yes |
| 24 | 2026-10-20 | Global `AiErrorFilter`: provider failures → 502, rate limit → 429 with a plain message | Raw provider errors surfaced as 500 | Yes |
| 25 | 2026-10-20 | Prompts forbid new duties/scale words/placeholders; interview asks name first; profile summary uses no gendered pronouns | Gemini embellished ("high-traffic", "cross-functional") and wrote `[NAME]` | Yes |
| 26 | 2026-10-20 | Naukri parser: a trailing known Indian city is treated as location, company left empty | Real titles like "Title - Skills - Pune" put the city in the company slot | Yes |
| 27 | 2026-10-20 | Default model now `gemini-3.5-flash` with automatic fallback to `gemini-3.1-flash-lite, gemini-3-flash-preview, gemini-3.6-flash` (`GEMINI_FALLBACK_MODELS`) on 404/429/5xx (`llm/fallback-model.ts`) | Free tier allows ~20 requests/day per model; `gemini-3-flash-preview` ran out during testing and every AI call failed with a 500. Quotas are per model, so fallbacks multiply the daily budget. Supersedes decision 22 | Yes |
| 28 | 2026-10-20 | `AiErrorFilter` also unwraps the SDK's `RetryError` and returns 429 with a plain "free quota used up" message | The 500 came from the filter missing `RetryError` | Yes |
| 13 | 2026-10-20 | Config/DB/LLM are `@Global()` Nest modules injected via symbols `ENV`, `DB`, `LLM_MODEL` | Keeps feature modules free of import wiring | Yes |
