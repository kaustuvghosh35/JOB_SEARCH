# Phase 4 — Improve + export

**Status:** ✅ done; verified live with Gemini (~4 s). Output stays close to the source after a stricter prompt; mild phrasing embellishments remain possible, so the "check these" box matters · **Est.:** 1–2 days · **Depends on:** Phase 2

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
- [x] Live check on 2 resumes. First run invented "high-traffic", "collaborated with cross-functional teams"; prompt tightened (no new duties, scale words, tools); second run clean of those
- [ ] Review more resumes for subtle embellishment
- [ ] Open the exported DOCX in Word and eyeball it

## Exit criteria
- [x] No invented facts on the two live test resumes (numbers fact-checked automatically; wording reviewed by hand)
- [x] DOCX/PDF contain all sections (automated); visual check in Word pending

## Notes
- "Diff" is a side-by-side before/after, not a token-level diff.
- Bullets in PDF use a "•" prefix without hanging indent.
