# Phase 4 — Improve + export

**Status:** ⬜ not started · **Est.:** 1–2 days · **Depends on:** Phase 2 (independent of Phase 3)

## Goal
Return an improved resume with before/after view and DOCX/PDF download.

## Tasks
- [ ] Shared Zod `ImprovedResume` schema (sections, bullets, change notes, open questions)
- [ ] `resume-improver.service.ts`: `generateObject` with prompt rules — stronger action verbs, quantified bullets, ATS keywords, consistent formatting, **never invent facts**; flag gaps as questions
- [ ] `POST /resumes/:id/improve` → saves `resume_versions` row; list versions
- [ ] `resume-export.service.ts`: DOCX via `docx`, PDF via `pdfkit`; `GET /resumes/:id/export?format=docx|pdf` (latest or `versionId`)
- [ ] Web: "Improved resume" tab — before/after diff, change notes, open questions, download buttons, B&W clean typography
- [ ] Prompt evals: 3–5 sample resumes checked for fabricated employers/metrics

## Exit criteria
- Exported DOCX opens cleanly in Word; PDF renders properly
- No invented facts on test resumes (manual review)

## Notes
_(fill in)_
