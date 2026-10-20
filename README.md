# Resume + Jobs POC

Upload a resume (or write one with AI) → improved resume + matching LinkedIn/Naukri jobs. Docs: [docs/PLAN.md](docs/PLAN.md), [docs/PROGRESS.md](docs/PROGRESS.md), [docs/DECISIONS.md](docs/DECISIONS.md).

## Run
```bash
npm install
cp .env.example .env   # fill ANTHROPIC_API_KEY and TINYFISH_API_KEY
npm run build -w @job-search/shared
npm run dev            # api :4000, web :3000
```

Without keys the app still boots: upload/chat return a clear 503, jobs show "TINYFISH_API_KEY is not configured".

## Useful commands
- `npm test -w @job-search/api` unit tests (parsers, jobs, export, chat with a mock model)
- `node scripts/seed-demo.mjs` insert a demo resume to preview the UI without keys (prints its id; open `/r/<id>`)
- `node scripts/tinyfish-spike.mjs` check real TinyFish search quality (needs key)
- `npm run db:generate -w @job-search/api` create a migration after editing `apps/api/src/db/schema` (applied on API boot)

## Layout
- `apps/api` NestJS + Drizzle/SQLite (resume, profile, jobs, chat, cleanup modules)
- `apps/web` Next.js + shadcn (black and white, Inter)
- `packages/shared` zod schemas shared by both
- Data auto-expires after `RESUME_TTL_HOURS` (default 7 days). Resume text is sent to Anthropic; only role/skills/city go to TinyFish.
