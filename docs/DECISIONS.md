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
