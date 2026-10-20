# Project

Job-search POC: resume upload/chat → improved resume + LinkedIn/Naukri job links. NestJS API (`apps/api`) + Next.js web (`apps/web`).

- Plan: `docs/PLAN.md`. Progress: `docs/PROGRESS.md` (update after each task/phase). Phase tasks: `docs/phases/`.
- Decisions made without asking go in `docs/DECISIONS.md` (append, dated). Don't ask the user for technical decisions; decide and log.
- Claude (AI SDK) does resume work only. TinyFish does job search only. Job data is parsed by plain code.
- If `vp`/`fd`/`rg` are not installed, use `npm`/PowerShell/Grep tool and log it in `docs/DECISIONS.md`.

# Response Style

Reader has ADHD: small working memory, hard to start, needs visible progress.

1. First line = the answer or the action. Context after, if at all.
2. Bullets > prose. Simple words, short sentences, abbreviations ok. No emojis.
3. ≤10 lines of prose (code/output doesn't count). Past 5 list items, group or split.
4. No preamble, closer, filler, restating, hedging or tangents.
5. No recap or re-printing of edits. While work is open, name state + next ("3 of 5 done: X. Next: Y"). Done → one `Next:` line, then stop.
6. Proposing a change → show the diff, not the full file.
7. Errors: cause + fix.
8. Ask only when there's a real decision; don't offer follow-ups. Questions → numbered options, recommended first and marked, one line each.
9. Say "I don't know" rather than guess. Push back when I'm wrong.
10. Ask only for decisions that are mine (product, design, destructive). Technical issues: figure them out.
11. Estimates only for unstarted work, in real units ("~15 min").

Go long only when: asked to explain (headers ok); destructive action (confirm first); 3rd "still broken" turn (name the likely wrong assumption).

# Code Comments

Default none. Write one only for a why the code can't say, something load-bearing that looks deletable, a removal condition, or a public API contract the types don't carry. One line; never restate code or narrate a diff. A comment that repeats a doc, or needs a paragraph, is an edit to that doc instead.

# Commands

1. `fd` not `find`, `rg` not `grep`, `vp` not `pnpm`/`npm`/`yarn` (`vp install`, `vp add`, `vpx`).
2. Run package.json scripts with `vpr <script>`. `vp <name>` runs Vite+'s built-in and skips the script (`vp check` ≠ `vpr check`).

# Git

Commit, push, pull, fetch, branch and open PRs without asking, unless I say otherwise. Confirm anything that deletes or rewrites history.

# Token Budget

Every tool call re-sends the whole context, so the number of turns drives usage.

1. Batch independent reads, searches and checks into one call.
2. Read a file whole, once, with Read; no `sed -n`/`head` slices. Don't re-read unless it changed.
3. Edit with Edit/Write, not python or `sed -i`.
4. Check a library's skill or docs before reading `node_modules/**/dist`.
5. A tool fails twice in a row → stop retrying it blindly. Find the cause or switch to another way to get the same result, then carry on.

## Cloudflare CLI - cf - v20260928

`cf` is Cloudflare's current CLI and covers the whole Cloudflare platform. Prefer it over Wrangler: create projects with `cf init`, develop with `cf dev`, deploy with `cf deploy`, and manage account resources with `cf <product> …` (for example `cf d1 list`).

Wrangler is only for projects that already use it – a `wrangler.jsonc`, `wrangler.json` or `wrangler.toml` file – or when the user asks for it. Keep using Wrangler in those projects unless asked to migrate, and use `cf migrate` in this case.

`cf` commands differ from Wrangler's; check `cf --help` or `cf cli search <what you want to do>` instead of guessing. If a `cf` command fails in a project that doesn't use Wrangler, don't fall back to Wrangler (including `npx wrangler`) without offering to report it.
