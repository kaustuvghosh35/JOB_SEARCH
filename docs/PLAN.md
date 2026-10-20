# Job Search POC — Master Plan

Progress lives in [PROGRESS.md](PROGRESS.md). Phase details live in [phases/](phases/).

## Context
A POC (for the author and friends) where someone uploads a resume (PDF/DOCX) or writes it with an AI chatbot, and the app:
1. returns an **improved resume**, and
2. finds **matching jobs from LinkedIn/Naukri** and links out to the original posting to apply.

Fire-and-forget: **no login, no user accounts**. Only `resumeId` and `sessionId` (unguessable UUIDs) identify data.

## Who does what
| Concern | Owner |
|---|---|
| Finding jobs (LinkedIn/Naukri postings + apply URLs) | **TinyFish** Search (Fetch optional) — nothing else |
| Understanding the resume (profile: title, skills, years, location) | **Gemini** via Vercel AI SDK |
| Improving/rewriting the resume, chat interview, refine follow-ups | **Gemini** via Vercel AI SDK |
| Job results → cards (title/company/location), de-dupe, match score | **Plain code** (parse TinyFish `title`/`snippet`, skill-keyword overlap) — no LLM on job data in v1 |

The LLM never browses or searches. TinyFish never sees the resume — it only gets search queries built from the profile (title, top skills, city).

## Stack
- **Backend:** NestJS (TypeScript) — hard requirement
- **Frontend:** Next.js + Tailwind + shadcn/ui
- **LLM:** Vercel AI SDK (`ai` + `@ai-sdk/google`), model `gemini-3-flash-preview` (env `GEMINI_MODEL`; thinking level low for speed, see `llm/provider-options.ts`)
  - `generateObject` + Zod for profile extraction and resume improvement
  - `streamText` for chat, piped from a Nest controller via `pipeUIMessageStreamToResponse` (v5) / `pipeDataStreamToResponse` (v4) — check installed version
  - Frontend `useChat` (`@ai-sdk/react`) against the Nest URL (CORS on)
- **Jobs:** TinyFish (`X-API-Key` = `TINYFISH_API_KEY`)
  - Search: `GET https://api.search.tinyfish.ai?query=…&location=…&recency_minutes=…` → `results[{position, site_name, title, snippet, url}]`; free up to 12,000 req/day
  - Fetch (optional): `POST https://api.fetch.tinyfish.ai {urls[≤10], format:"markdown"}`; free up to 1,000 URLs/day; per-URL failures arrive in `errors`
  - Agent API is paid/slow — not used in v1
  - Site-scoped queries (`site:linkedin.com/jobs …`, `site:naukri.com …`); operator support unverified → Phase 0
- **DB:** SQLite via Drizzle ORM (`drizzle-orm`, `better-sqlite3`, `drizzle-kit`), file `apps/api/data/app.db` (gitignored)

### Caveat on job sourcing
LinkedIn/Naukri ToS prohibit scraping. We only query a third-party search index and link out; skip Fetch on LinkedIn (login-walled). Fine for a private POC, revisit before productizing. Fallback if search quality is poor: deep-link pre-filled LinkedIn/Naukri search URLs.

## Data model (Drizzle / SQLite)
- `resumes` — id uuid, originalText, filename, fileBlob, profileJson, createdAt, expiresAt (TTL default 7d, env `RESUME_TTL_HOURS`)
- `resume_versions` — id, resumeId (FK cascade), improvedJson, changeNotes, createdAt
- `chat_sessions` — id uuid (= `sessionId`), resumeId nullable FK, createdAt, updatedAt, expiresAt
- `chat_messages` — id, sessionId (FK cascade), role, parts json, createdAt
- `job_search_cache` — queryHash, resultsJson, fetchedAt (TTL ~6–12h)
- Expired rows purged by an hourly `@nestjs/schedule` cron + once at startup.

## Code structure (modular)
```
JOB_SEARCH/
├─ docs/                            # this plan + progress
├─ apps/
│  ├─ api/                          # NestJS
│  │  ├─ drizzle.config.ts
│  │  └─ src/
│  │     ├─ main.ts, app.module.ts
│  │     ├─ config/                 # typed env config (zod-validated)
│  │     ├─ db/                     # DbModule (Drizzle provider), schema/*.ts, migrations/
│  │     ├─ llm/                    # LlmModule: model provider + prompt helpers
│  │     ├─ resume/                 # controller, service, repository, dto
│  │     │  ├─ parsers/             # pdf.parser.ts, docx.parser.ts, ResumeParser interface + factory
│  │     │  ├─ resume-improver.service.ts
│  │     │  └─ resume-export.service.ts
│  │     ├─ profile/                # text → structured profile
│  │     ├─ jobs/                   # controller, service (query build, de-dupe, scoring)
│  │     │  ├─ providers/           # job-provider.interface.ts, tinyfish.provider.ts
│  │     │  └─ cache.repository.ts
│  │     ├─ chat/                   # controller, service, session/message repository
│  │     ├─ cleanup/                # TTL purge cron
│  │     └─ common/
│  └─ web/                          # Next.js
│     ├─ app/ (page.tsx, r/[resumeId]/page.tsx)
│     ├─ components/ui/             # shadcn
│     ├─ features/{upload,chat,jobs,resume}/
│     └─ lib/api.ts
└─ packages/shared/                 # zod schemas + types (Profile, Job, ImprovedResume)
```
Rules: controllers thin → services hold logic → repositories are the only code touching Drizzle; modules export only their service; providers/parsers behind interfaces + Nest DI.

## Endpoints
`POST /resumes` (multipart) · `POST /resumes/text` · `GET /resumes/:id` · `POST /resumes/:id/improve` · `GET /resumes/:id/export?format=docx|pdf` · `GET /resumes/:id/jobs` (filters: location, remote, role) · `POST /chat` (streaming; optional `sessionId`, `resumeId`) · `GET /chat/:sessionId`

## Flow
1. **Upload**: file → text → Gemini extracts profile → save → redirect `/r/<id>`.
2. **Jobs**: 2–3 queries from profile (title + top skills + location; editable filters) → TinyFish → deterministic parse to `{title, company, location, snippet, source, applyLinks[]}` → de-dupe → keyword score → cards with **Apply ↗** (new tab, `rel="noopener noreferrer"`).
3. **Improve**: rewrite (action verbs, quantified bullets, ATS keywords) **without inventing facts**; flag gaps as questions; before/after + DOCX/PDF.
4. **Chat**: client sends `{sessionId, newMessage}`; server loads history, `streamText`, persists reply in `onFinish`; `GET /chat/:sessionId` hydrates `initialMessages`. Same mechanism powers "refine my resume" follow-ups. "Create resume" saves the draft as a `resumes` row (no blob) and joins the normal flow.

## Design (minimal, black & white)
- Monochrome: white bg, near-black text `#0a0a0a`, grays `#e5e5e5` / `#737373`; primary button solid black; no accent colors. shadcn `neutral` base with grayscale tokens.
- **Inter** for UI (via `next/font/google`), optional Geist Mono for small metadata. Large tight headings, line-height 1.6, ~720px reading width / ~960px job lists.
- Hairline 1px borders, 6–8px radius, no shadows/gradients. Job card = title, company · location, one-line snippet, source label, black **Apply ↗**.
- Home = headline + upload drop zone + "or write it with AI". Results = tabs (Jobs · Improved resume · Chat). Skeleton loaders, clear empty/error states. AA+ contrast, visible focus.

## Scope
**In:** B&W site · PDF/DOCX upload (text-based, ≤5 MB) or chat-built resume · profile extraction · TinyFish job discovery with Apply link-outs · AI-improved resume with before/after + DOCX/PDF · persisted chat by `sessionId` + refine follow-ups · SQLite/Drizzle with TTL cleanup · modular Nest + Next · local run (optional free-tier deploy).

**Out (v1):** login/accounts/payments · auto-apply or any LinkedIn/Naukri account interaction · direct scraping · TinyFish Agent · OCR · multiple resume templates · cover letters · job alerts, saved-jobs tracker, analytics · rate limiting · i18n · extra job providers beyond the interface.

## Caveats
- Results depend on TinyFish's index; may be stale or non-job pages (hence the Phase 0 spike).
- Resume text goes to Google Gemini; only derived queries go to TinyFish.
- Re-check TinyFish free limits at implementation time.
- Anyone with a resume URL can view it until TTL expiry (UUIDs unguessable; fine for POC).
- Optional shared access-code env var if deployed publicly (guards API credits).

## Env vars
`GEMINI_API_KEY`, `GEMINI_MODEL`, `TINYFISH_API_KEY`, `DATABASE_PATH`, `RESUME_TTL_HOURS`, (optional) `ACCESS_CODE`
