# Resume Studio + Job Search

Upload or type your resume, improve it with AI, tailor it to a role, download it as DOCX or PDF, and find matching LinkedIn and Naukri jobs. Applying happens on the original job page; this app never submits anything for you.

## What it does

- **Bring your resume in any way.** Upload a PDF or DOCX, paste the text, or just type rough notes about yourself.
- **Improve it with AI.** Gemini rewrites the resume into a clean, ATS-friendly layout without inventing facts. Anything it cannot verify becomes a question for you, and any new number is flagged.
- **Tailor it freely.** Set the role you are aiming for, then chat or type requests: add, remove, rename, merge or reorder sections, group skills, lead with projects, re-aim the resume at another role.
- **Compare versions.** Every improvement is saved as a version. Switch between the improved resume and the previous version or your original upload.
- **Download.** Clean black-and-white DOCX and PDF.
- **Find jobs.** Searches LinkedIn and Naukri for your role, location, seniority, years of experience and top skills, ranks results by match, and links out to the real postings.

## Screens

| Page | Purpose |
|---|---|
| `/` | Quick upload, or go to the studio |
| `/studio` | Upload a file, or type or paste your resume or notes |
| `/studio/<id>` | Workspace: role and location bar, chat, improved resume, downloads, job search button |
| `/r/<id>` | Matching jobs with Apply buttons |

## How it works (short version)

```
Browser (Next.js)  ->  NestJS API  ->  SQLite (Drizzle)
                          |-> Google Gemini   resume reading, rewriting, chat
                          |-> TinyFish Search job discovery (LinkedIn, Naukri)
```

- Gemini does only resume work. TinyFish does only job search. Job results are parsed and scored by plain code.
- There are no accounts. A resume is identified by an unguessable id in the URL, and a chat by an id kept in your browser. Everything auto-deletes after 7 days.
- Details: [docs/architecture/](docs/architecture/README.md).

## Tech stack

| Area | Choice |
|---|---|
| API | NestJS 12 (TypeScript, ESM) |
| Web | Next.js 16, React 19, Tailwind 4, shadcn/ui |
| AI | Vercel AI SDK 7 with Google Gemini |
| Jobs | TinyFish Search API |
| Database | SQLite via Drizzle ORM (better-sqlite3) |
| Files | `unpdf` (PDF), `mammoth` (DOCX), `docx` and `pdfkit` (export) |
| Tests | Vitest |

## Getting started

### Prerequisites

- Node.js 22 or newer
- A Google Gemini API key ([Google AI Studio](https://aistudio.google.com/apikey))
- A TinyFish API key ([agent.tinyfish.ai/api-keys](https://agent.tinyfish.ai/api-keys))

### Install and run

```bash
npm install
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
# edit .env and fill GEMINI_API_KEY and TINYFISH_API_KEY
npm run build -w @job-search/shared
npm run dev
```

- Web: http://localhost:3000
- API: http://localhost:4000 (health check at `/health`)

The database file is created on first start at `apps/api/data/app.db`. Nothing to set up.

Without keys the app still starts. Resume and chat features answer with a clear "key not configured" message, and the job list shows the same for TinyFish.

### Configuration

Set these in the root `.env` (see `.env.example`).

| Variable | Default | Meaning |
|---|---|---|
| `GEMINI_API_KEY` | none | Google Gemini key |
| `GEMINI_MODEL` | `gemini-3.5-flash` | Primary model |
| `GEMINI_FALLBACK_MODELS` | `gemini-3.1-flash-lite,gemini-3-flash-preview,gemini-3.6-flash` | Tried in order when the primary is out of quota or unavailable |
| `TINYFISH_API_KEY` | none | TinyFish Search key |
| `DATABASE_PATH` | `data/app.db` | SQLite file, relative to `apps/api` |
| `RESUME_TTL_HOURS` | `168` | How long resumes, versions and chats are kept |
| `JOB_CACHE_TTL_HOURS` | `8` | How long identical job searches are cached |
| `PORT` | `4000` | API port |
| `WEB_ORIGIN` | `http://localhost:3000` | Allowed browser origin (CORS) |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | API address used by the web app |

Never commit `.env`. It is already in `.gitignore`.

## Useful commands

| Command | What it does |
|---|---|
| `npm run dev` | Start API and web together |
| `npm test -w @job-search/api` | Run the API unit tests |
| `npm run build` | Build shared package, API and web |
| `npm run db:generate -w @job-search/api` | Create a migration after editing `apps/api/src/db/schema`. Migrations apply automatically on API start |
| `node scripts/seed-demo.mjs` | Insert a demo resume so you can preview the UI without API keys. Prints its id |
| `node scripts/tinyfish-spike.mjs` | Check real TinyFish search quality (needs a key) |

## Project layout

```
apps/
  api/              NestJS API (resume, profile, jobs, chat, llm, cleanup, db modules)
  web/              Next.js app (studio, jobs page, shadcn components)
packages/
  shared/           Zod schemas and types used by both (profile, job, resume)
docs/
  architecture/     Technical documentation
  PLAN.md           Original plan and scope
  PROGRESS.md       Build log
  DECISIONS.md      Decisions made along the way, with reasons
scripts/            Demo seed and TinyFish check
```

## API overview

| Method and path | Purpose |
|---|---|
| `POST /resumes` | Upload a PDF or DOCX (multipart field `file`, up to 5 MB) |
| `POST /resumes/text` | Create from typed or pasted text |
| `GET /resumes/:id` | Resume summary and profile |
| `GET /resumes/:id/original` | Original text |
| `POST /resumes/:id/improve` | Create a new improved version (`targetRole`, `extra`, `revise`) |
| `GET /resumes/:id/improved` | Latest version and the one before it |
| `GET /resumes/:id/export?format=docx\|pdf` | Download a version |
| `POST /resumes/:id/use-latest` | Rebuild the job-search profile from the newest version |
| `GET /resumes/:id/jobs` | Search jobs (`role`, `location`, `remote`) |
| `POST /chat` | Send a chat message, streamed reply |
| `GET /chat/:sessionId` | Saved chat history |
| `POST /chat/:sessionId/apply` | Apply the chat to the resume as a new version |
| `GET /health` | Status and which keys are configured |

Full details are in [docs/architecture/api.md](docs/architecture/api.md).

## Privacy and limits

- Resume text is sent to Google Gemini. Only a search phrase (role, seniority, years, top three skills, location) is sent to TinyFish. Nothing is sent to employers.
- Data is stored in a local SQLite file and deleted after `RESUME_TTL_HOURS`. Anyone with a resume link can open it until then.
- The Gemini free tier allows only about 20 requests per day per model. The app falls back through the model list, but a busy day can still hit the limit. A paid key removes it.
- Job results come from a search index, so they can be stale or incomplete, and company or location may be missing on some cards. LinkedIn and Naukri terms of service restrict scraping. This app only queries a search service and links out, which suits a private project; review the terms before offering it publicly.
- There is no login, rate limiting or access control. Do not expose it publicly as is.

## Known gaps

- Scanned or image-only PDFs are not supported (no OCR).
- Resume text must be under 30,000 characters.
- Preview Gemini models can be renamed or retired. Change `GEMINI_MODEL` if one stops working.

## License

No license has been chosen yet. Add one before publishing if you want others to reuse the code.
