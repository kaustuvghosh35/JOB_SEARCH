# Phase 2 — Resume in (upload → profile)

**Status:** ⬜ not started · **Est.:** 1–2 days · **Depends on:** Phase 1

## Goal
User uploads a PDF/DOCX, gets text extracted and a structured profile, lands on `/r/<resumeId>`.

## Tasks
- [ ] `resume/parsers`: `ResumeParser` interface + factory; `pdf.parser.ts` (`unpdf`/`pdf-parse`), `docx.parser.ts` (`mammoth`)
- [ ] Empty-text detection (scanned PDF) → clear error message (no OCR in v1)
- [ ] `ResumeModule`: controller, service, repository (only place touching Drizzle); DTO validation
- [ ] `POST /resumes` (multipart; pdf/docx only, ≤5 MB; store text + blob + `expiresAt`)
- [ ] `POST /resumes/text` (raw text, used later by chat) and `GET /resumes/:id`
- [ ] `profile/`: `generateObject` + shared Zod `Profile` schema (title, seniority, years, skills, location, summary) → saved to `profileJson`
- [ ] `cleanup/`: `@nestjs/schedule` hourly purge + purge at startup (resumes, cascades)
- [ ] Web: home page with upload drop zone (+ "or write it with AI" link, wired in Phase 5), progress/skeleton, error toasts; `r/[resumeId]` page shell showing the profile
- [ ] Don't log resume contents

## Exit criteria
- 3+ real resumes (different layouts/formats, incl. one DOCX) → correct profile
- Scanned PDF, oversized file, wrong type → friendly errors
- Expired rows are purged (test with tiny TTL)

## Notes
_(fill in)_
