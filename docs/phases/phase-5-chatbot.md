# Phase 5 — Chatbot

**Status:** ⬜ not started · **Est.:** 1–2 days · **Depends on:** Phases 2 and 4

## Goal
Conversational resume builder and refiner with server-persisted history by `sessionId`.

## Tasks
- [ ] `chat/` repository for `chat_sessions` / `chat_messages` (TTL + cleanup shared with Phase 2 job)
- [ ] `POST /chat`: body `{sessionId?, resumeId?, message}`; create session if missing (return `sessionId` in response header); load history; `streamText`; persist assistant message in `onFinish`; pipe via the AI SDK helper confirmed in Phase 0
- [ ] `GET /chat/:sessionId` → history for `initialMessages`
- [ ] System prompts: (a) interview mode — section-by-section (experience, skills, education), builds a draft; (b) refine mode — resume text injected as context ("more concise", "target a backend role")
- [ ] "Create resume" action: saves the draft as a `resumes` row (no blob) → flows into jobs/improve/export
- [ ] Web: Chat tab + "write it with AI" entry on home; `useChat` with `initialMessages`; `sessionId` in URL/localStorage; streaming UI, B&W minimal styling
- [ ] Guardrail: assistant asks rather than fabricates

## Exit criteria
- Refresh restores the conversation; AI remembers earlier turns
- Short interview produces a resume with no invented details
- Expired sessions are purged

## Notes
_(fill in)_
