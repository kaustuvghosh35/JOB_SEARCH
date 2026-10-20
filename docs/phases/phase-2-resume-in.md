# Phase 2 — Resume in (upload → profile)

**Status:** ✅ done; verified live with Gemini (text and DOCX upload give correct profiles in ~4 s with thinking level low) · **Est.:** 1–2 days · **Depends on:** Phase 1

## Goal
User uploads a PDF/DOCX, gets text extracted and a structured profile, lands on `/r/<resumeId>`.

## Tasks
- [x] `resume/parsers`: `ResumeParser` interface; `pdf.parser.ts` (`unpdf`), `docx.parser.ts` (`mammoth`), `parseResumeFile` in `parser.factory.ts`
- [x] Empty-text detection (scanned PDF) → clear error (no OCR in v1)
- [x] `ResumeModule`: controller, service, repository (only place touching Drizzle for resumes)
- [x] `POST /resumes` (multipart; pdf/docx, ≤5 MB; stores text + blob + `expiresAt`), `POST /resumes/text`, `GET /resumes/:id`
- [x] `profile/ProfileService`: `generateText` + `Output.object(profileSchema)` (AI SDK v7; `generateObject` no longer used)
- [x] `cleanup/`: `@nestjs/schedule` hourly purge + purge at startup (resumes, sessions, job cache; FK cascade)
- [x] Web: home upload drop zone + paste-text box; `/r/[resumeId]` page shows profile
- [x] Resume contents never logged
- [x] Live check: 3 resumes (2 text, 1 DOCX) → correct profiles
- [ ] Try more real-world PDFs with complex layouts (columns, tables)

## Exit criteria
- [x] Sample resumes → correct profile
- [x] Scanned PDF, wrong type, corrupt file, short text, bad id → friendly 400s (unit tests + curl)
- [x] Expired rows purged incl. cascade (unit test `cleanup.repository.spec.ts`)
- [x] No-key case returns clear 503

## Notes
- `Express.Multer.File` type isn't available (tsconfig `types` list), so the controller uses a structural type.
- Vitest here doesn't emit decorator metadata, so tests construct classes directly; services use explicit `@Inject(...)` everywhere.
