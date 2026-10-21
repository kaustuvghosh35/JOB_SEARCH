# API reference

Base URL `http://localhost:4000`. JSON everywhere except uploads (multipart), downloads (binary) and chat (streamed). All ids are UUIDs; a malformed id returns 400.

## Endpoints

### Resumes

| Method and path | Input | Output | Notes |
|---|---|---|---|
| `POST /resumes` | multipart field `file` (PDF or DOCX, up to 5 MB) | `ResumeView` | 400 for wrong type, corrupt file, or no readable text (scanned). 503 if no Gemini key |
| `POST /resumes/text` | `{ text }` | `ResumeView` | 30 to 30,000 characters. Rough notes are fine |
| `GET /resumes/:id` | none | `ResumeView` | 404 if missing or expired |
| `GET /resumes/:id/original` | none | `{ text }` | The stored original text |
| `POST /resumes/:id/improve` | `{ targetRole?, extra?, revise? }` | `ImprovedVersion` | Creates a new version. `revise: true` builds on the latest version. `extra` up to 6,000 characters, role up to 120 |
| `GET /resumes/:id/improved` | none | `ImprovedVersion` | Newest version plus `previous`. 404 if none yet |
| `POST /resumes/:id/use-latest` | none | `ResumeView` | Rebuilds the job profile from the newest version. No version: returns the resume unchanged |
| `GET /resumes/:id/export` | `format=docx\|pdf`, optional `versionId` | file download | Newest version unless `versionId` is given |

`ResumeView` = `{ id, filename, profile, createdAt, expiresAt }`.
`ImprovedVersion` = `{ id, resumeId, createdAt, resume, previous }` where `resume` and `previous` are in the section format (see [ai-and-data.md](ai-and-data.md)). `previous` is `null` for the first version.

### Jobs

| Method and path | Input | Output |
|---|---|---|
| `GET /resumes/:id/jobs` | query `role`, `location`, `remote=true` (all optional) | `{ jobs: Job[], warnings: string[] }` |

`Job` = `{ id, title, company, location, snippet, source: linkedin\|naukri, applyUrl, score }`. A search that fails for one site still returns the other site's jobs, with a warning. All sites failing returns 503 or 502.

### Chat

| Method and path | Input | Output |
|---|---|---|
| `POST /chat` | `{ id: sessionId, message: {id, role:"user", parts[]}, resumeId? }` | Streamed AI message (SDK UI-message stream) |
| `GET /chat/:sessionId` | none | `{ messages, resumeId }` (empty list if unknown or expired) |
| `POST /chat/:sessionId/apply` | `{ targetRole? }` | `ImprovedVersion` |
| `POST /chat/:sessionId/resume` | none | `ResumeView` |

The last endpoint builds a resume from an interview-style chat that has no resume yet. The current UI does not use it, nor the interview prompt behind it. They remain available.

### Health

`GET /health` returns `{ status, resumes, geminiKey, tinyfishKey }`. The last two are booleans, never the keys.

### Errors

| Status | Meaning |
|---|---|
| 400 | Invalid input, unreadable file, text too short or long, chat too long |
| 404 | Resume, version or session not found or expired |
| 429 | Gemini free quota used up on every model |
| 502 | Gemini or TinyFish failed |
| 503 | A required API key is not configured |

## Modules and key functions

### config
- `loadEnv()` loads `.env`, validates with Zod and applies defaults. `ConfigModule` exposes the result under the `ENV` token.

### db
- `openDb(path)` creates the folder, opens SQLite in WAL mode with foreign keys on, and applies the SQL migrations from `apps/api/drizzle`. `DbModule` exposes it under the `DB` token. Tests call `openDb(':memory:')`.
- `schema/index.ts` defines the tables (see [ai-and-data.md](ai-and-data.md)).

### llm
- `LlmModule` builds one model object: the primary Gemini model wrapped with the fallback list (`withFallback` in `fallback-model.ts`).
- `provider-options.ts` sets Gemini's thinking level to low, which made rewrites roughly ten times faster with no visible quality loss.

### profile
- `ProfileService.extract(text)` asks Gemini for a structured profile. Fails with 503 if no key.

### resume
- **`ResumeController`** validates input and calls services. Export streams the file with a download header.
- **`ResumeService`** owns resume rows:
  - `createFromFile`, `createFromText`: validate, then `save`.
  - `save`: extract profile, compute `expiresAt`, insert.
  - `get`, `getRow`: read, treating expired rows as missing.
  - `updateProfile`: used by "use latest".
- **`parsers/`**: `parseResumeFile` chooses `PdfParser` (unpdf) or `DocxParser` (mammoth), normalises whitespace and rejects near-empty text.
- **`ResumeRepository`**: insert, find by id, update profile.

### resume/improver
- **`ResumeImproverService.improve(input)`**: the one place that rewrites a resume. Builds the prompt from the original text, target role, previous role, extra details and base version, calls Gemini for structured output, and returns an `ImprovedResume`. Its system prompt holds the rules (no invented facts, free structure, tailoring, no placeholders).
- **`VersionsService`**:
  - `improve(resumeId, opts)`: orchestrates a rewrite (flow 2): loads prior version, calls the improver, fact-checks, stores the role, saves.
  - `latest(resumeId)`: newest version and the one before.
  - `export(resumeId, format, versionId?)`: renders a version to a file.
  - `useLatestForJobs(resumeId)`: re-extracts the profile from the newest version.
  - Every version read goes through `normalizeResume`, so old saved shapes still work.
- **`VersionRepository`**: insert, find by id, `latest(resumeId, skip)` (newest first, `skip` 1 gives the previous).
- **`fact-check.ts`**: `withFactWarnings` adds a "verify these figures" question for any number in the output that is not in the original, the extra details, or the base version.
- **`render-text.ts`**: `resumeToText` turns a resume into plain text. Used for the profile rebuild and the fact check.

### resume/export
- `ResumeExportService.toDocx` and `toPdf` both walk the same list of blocks built from the sections: name, contact line, then each section heading, paragraph, entries with bullets, and items. Black and white, one column, ATS-friendly. Empty company or school parts are skipped.

### jobs
- **`JobsController`** reads the query and calls `JobsService.search`.
- **`JobsService.search`** runs flow 6: build queries, cache or fetch, collect warnings, parse, dedupe, score, sort.
- **`query-builder.ts`**: `buildQueries(profile, filters)`.
- **`providers/tinyfish.provider.ts`**: `search({query, location})` calls TinyFish with the API key, a 15 second timeout, and validates the response shape. Implements `JobProvider`, so another source can replace it.
- **`hit-parser.ts`**: `detectSource`, `parseHit`, `dedupe`, `canonicalUrl`. All parsing is plain code, tested on real samples.
- **`scorer.ts`**: `scoreJob`. Whole-word matching, so "AWS" does not match "JAWS".
- **`cache.repository.ts`**: `get` and `set` keyed by a hash of query and location.

### chat
- **`ChatController`** validates the body with Zod and pipes the stream to the HTTP response.
- **`ChatService`**:
  - `stream`: loads history, builds instructions, streams the reply, saves on finish.
  - `history`: returns saved messages for the UI.
  - `applyToResume`: flow 4.
  - `createResume`: builds a resume text from a chat (needs three user messages) and saves it.
  - `instructions`: with a resume, the refine prompt plus the original text plus the latest version as JSON. Without one, the interview prompt.
- **`ChatRepository`**: sessions and messages. Saving a message updates it only if it belongs to the same session, so one session can never overwrite another's messages.
- **`prompts.ts`**: the three system prompts.

### cleanup
- `CleanupService.purge()` runs at startup and hourly via `@nestjs/schedule`. `CleanupRepository.purge` does the deletes.

### common
- `AiErrorFilter` turns provider errors into 429 or 502 with plain messages.
- `time.ts`: `hoursToMs`, `hoursFromNow`.

### health
- `HealthController.get`: counts resumes and reports which keys exist.

## Conventions

- Dependency injection uses explicit `@Inject(...)` everywhere, because the test runner does not emit decorator metadata.
- Files import each other with `.js` extensions (the project is ESM).
- Secrets are read only from the environment and are never logged or returned.
