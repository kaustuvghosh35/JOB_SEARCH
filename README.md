# Resume + Jobs POC

Upload a resume (or write one with AI) → improved resume + matching LinkedIn/Naukri jobs. Docs: [docs/PLAN.md](docs/PLAN.md), [docs/PROGRESS.md](docs/PROGRESS.md).

## Run
```bash
npm install
cp .env.example .env   # fill ANTHROPIC_API_KEY, TINYFISH_API_KEY
npm run build -w @job-search/shared
npm run dev            # api :4000, web :3000
```

## Layout
- `apps/api` NestJS + Drizzle/SQLite
- `apps/web` Next.js + shadcn
- `packages/shared` zod schemas shared by both

DB migrations: `npm run db:generate -w @job-search/api` (applied automatically on API boot).
