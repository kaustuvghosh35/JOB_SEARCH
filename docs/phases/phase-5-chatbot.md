# Phase 5 — Chatbot

**Status:** 🟡 code done, live LLM check pending (needs `ANTHROPIC_API_KEY`) · **Est.:** 1–2 days · **Depends on:** Phases 2 and 4

## Goal
Conversational resume builder and refiner with server-persisted history by `sessionId`.

## Tasks
- [x] `chat/chat.repository.ts` for `chat_sessions` / `chat_messages` (ordered by createdAt + rowid; upsert guarded so a session cannot overwrite another session's message ids)
- [x] `POST /chat` `{id: sessionId, message, resumeId?}`: loads history, `streamText`, `toUIMessageStream({onEnd})` persists, `pipeUIMessageStreamToResponse`; `consumeStream()` so the reply is saved even if the client disconnects
- [x] `GET /chat/:sessionId` → `{messages, resumeId}`
- [x] Prompts (`chat/prompts.ts`): interview mode (one question at a time, no invention), refine mode (resume + latest improved version injected as data), draft mode
- [x] `POST /chat/:sessionId/resume` → LLM drafts resume text from the transcript → `ResumeService.createFromText` → links session
- [x] Web: `/chat` page ("Write it with AI", linked from home) and a Chat tab on `/r/[id]`; `useChat` with `initialMessages`; `sessionId` in localStorage; "Create resume" appears after 3 user turns
- [x] Tests with the SDK mock model: streaming, persistence + history restore, cross-session id isolation, resume creation, profile/improver structured output
- [ ] Live check: interview produces a resume with no invented details; refresh restores conversation in the browser — **needs Anthropic key**
- [ ] Expired session purge covered by cleanup test (cascade tested in Phase 2)

## Exit criteria
- [x] History restored from `sessionId` (API-level test); AI sees earlier turns (messages reloaded from DB each request)
- [ ] Browser refresh check and no-fabrication check (blocked on key)

## Notes
- AI SDK v7 API used: `instructions`, `toUIMessageStream`, `pipeUIMessageStreamToResponse` (not the deprecated result methods). `Output.object` replaces `generateObject`.
- Session id is client-generated (`crypto.randomUUID()`); server creates the session on first message. Fits the no-login model.
- Chat messages are capped at 200 per session.
