# Phase 4 — Improve + export

**Status:** 🟡 code done, live LLM check pending (needs `ANTHROPIC_API_KEY`) · **Est.:** 1–2 days · **Depends on:** Phase 2

## Goal
Return an improved resume with before/after view and DOCX/PDF download.

## Tasks
- [x] Shared `ImprovedResume` schema + `ImprovedVersion` type
- [x] `improver/resume-improver.service.ts`: `generateText` + `Output.object`, prompt forbids invented facts, asks questions instead of guessing numbers, optional target role
- [x] `improver/fact-check.ts`: any number in the output that is absent from the original is added to `openQuestions` as "verify" (cheap guard against fabricated metrics)
- [x] `POST /resumes/:id/improve` (saves `resume_versions`), `GET /resumes/:id/improved`, `GET /resumes/:id/original`
- [x] `export/resume-export.service.ts`: DOCX (`docx`) and PDF (`pdfkit`), plain ATS-friendly B&W layout; `GET /resumes/:id/export?format=docx|pdf&versionId=`
- [x] Web: tabs (Jobs · Improved resume); before/after side by side, change notes, "check these" box, download buttons
- [x] Tests: export round-trips (DOCX via mammoth, PDF via unpdf), fact-check, versions service
- [ ] Live check: 3–5 real resumes reviewed for fabricated employers/metrics — **needs Anthropic key**
- [ ] Open the exported DOCX in Word and eyeball it

## Exit criteria
- [ ] No invented facts on test resumes (blocked on key)
- [x] DOCX/PDF contain all sections (automated); visual check in Word pending

## Notes
- "Diff" is a side-by-side before/after, not a token-level diff.
- Bullets in PDF use a "•" prefix without hanging indent.
