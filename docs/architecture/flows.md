# Flows

Each flow names the browser action, the API calls and what is saved. File names are relative to `apps/api/src` or `apps/web`.

## 1. Create a resume (upload or type)

```mermaid
sequenceDiagram
  participant U as Browser (/studio)
  participant API as ResumeController
  participant S as ResumeService
  participant P as ProfileService
  participant G as Gemini
  participant DB as SQLite
  U->>API: POST /resumes (file) or POST /resumes/text
  API->>S: createFromFile / createFromText
  S->>S: file -> text (parsers) <br/> text -> normalize and length check
  S->>P: extract(text)
  P->>G: structured profile request
  G-->>P: profile
  S->>DB: insert resume (text, file blob, profile, expiresAt)
  API-->>U: resume id + profile
  U->>U: set autoImprove flag, go to /studio/<id>
```

- **File path:** `parseResumeFile` picks the PDF or DOCX parser by extension or MIME type, normalises whitespace, and rejects text shorter than 80 characters (that is how scanned PDFs are caught).
- **Text path:** 30 to 30,000 characters.
- **Order matters:** the profile is extracted before saving. If Gemini fails, nothing is stored.
- The original text is stored, and for uploads the original file bytes too.

## 2. First improve (automatic) and "Improve again"

```mermaid
sequenceDiagram
  participant U as VersionPanel
  participant V as VersionsService
  participant I as ResumeImproverService
  participant G as Gemini
  participant DB as SQLite
  U->>V: POST /resumes/:id/improve {targetRole, extra, revise}
  V->>DB: load resume + latest version (prior)
  V->>I: improve({original, targetRole, previousRole, extra, base?})
  I->>G: structured resume request
  G-->>I: sections, notes, questions
  V->>V: fact check numbers, attach targetRole
  V->>DB: insert new resume_versions row
  V-->>U: new version + previous version
```

- `base` is the latest version, sent only when `revise` is true and a version exists. The AI is then told to revise it instead of starting over.
- `previousRole` is the role the base was tailored for. If it differs from `targetRole`, the AI must redo the tailoring.
- `extra` is free text from the details box (or a chat transcript, see flow 4).
- On the first visit from the start page, the browser sees a sessionStorage flag and calls improve automatically. Later visits do not.
- The UI shows "Tailored for X" from the saved version's role. If the role box differs, the button becomes "Tailor for this role".

## 3. Chat (talking only)

```mermaid
sequenceDiagram
  participant U as ChatPanel
  participant C as ChatService
  participant DB as SQLite
  participant G as Gemini
  U->>U: sessionId from localStorage (create if missing)
  U->>C: GET /chat/:sessionId (load history)
  U->>C: POST /chat {id: sessionId, message, resumeId}
  C->>DB: find or create session, load all earlier messages
  C->>G: instructions + original + latest version + all messages (stream)
  G-->>U: streamed reply
  C->>DB: onEnd: save all messages, extend expiry
```

- The session id is made by the browser (`chat:<resumeId>` in localStorage) and never sent to Gemini. It only tells our server which saved messages to load.
- Gemini keeps no memory, so every request carries the whole history.
- The reply is plain text. **The resume does not change.**
- The reply is also saved when the browser disconnects early (`consumeStream`).
- A session stops accepting messages after 200.

## 4. Apply chat to the resume

```mermaid
sequenceDiagram
  participant U as ChatPanel
  participant C as ChatService
  participant V as VersionsService
  U->>C: POST /chat/:sessionId/apply {targetRole}
  C->>C: build transcript "User: ... / Coach: ..."
  C->>V: improve(resumeId, {targetRole, extra: transcript, revise: true})
  V-->>U: new version
  U->>U: remount VersionPanel, which loads the newest version
```

This is the same `improve` as flow 2. The transcript is passed as the "extra details", with an instruction to apply only what the user asked for or agreed to. Chat always builds on the latest version.

## 5. Download

`GET /resumes/:id/export?format=docx|pdf&versionId=…` loads the version (or the latest), normalises it, and builds the file on the fly with `ResumeExportService`. The file name comes from the resume's name. Nothing is cached.

## 6. Search jobs with this resume

```mermaid
sequenceDiagram
  participant W as Workspace page
  participant V as VersionsService
  participant G as Gemini
  participant J as JobsPage (/r/:id)
  participant JS as JobsService
  participant T as TinyFish
  W->>V: POST /resumes/:id/use-latest
  V->>G: extract profile from newest version text
  V->>V: save profile on the resume
  W->>J: go to /r/:id?role=...&location=...
  J->>JS: GET /resumes/:id/jobs?role&location&remote
  JS->>JS: build 2 queries (LinkedIn, Naukri)
  JS->>T: search each (or use cache)
  T-->>JS: titles, snippets, URLs
  JS->>JS: parse, remove duplicates, score, sort
  JS-->>J: jobs + warnings
```

**Job pipeline in detail**
1. `buildQueries` makes one query per site: `site:<scope> [seniority] <role> <top 3 skills> [<years> years] [remote] <location>`.
   - Role and location come from the filters, falling back to the profile.
   - Seniority is added only for intern, junior, senior or lead, and only if the role has no level word.
   - Years are added only when 1 or more.
2. For each query, `JobCacheRepository.get` returns saved hits if they are younger than the cache TTL. Otherwise `TinyfishProvider.search` calls TinyFish and the hits are cached.
3. Queries run in parallel and failures are isolated. One failing site becomes a warning. If all fail, the API returns 503 (key missing) or 502.
4. `parseHit` keeps only real job pages (LinkedIn `/jobs/view`, Naukri `/job-listings`), and extracts title, company and location with per-site patterns. The apply URL has its tracking parameters removed.
5. `dedupe` drops repeats by URL and by title plus company.
6. `scoreJob` ranks by skills (60%) and role words in the title (40%), using the profile's top 10 skills.
7. The result is sorted by score, highest first.

## 7. Expiry and cleanup

- Every resume has `expiresAt` (created + `RESUME_TTL_HOURS`). Reads treat an expired resume as missing even before it is deleted.
- Chat sessions have their own `expiresAt`, pushed forward on every message.
- `CleanupService` runs at startup and every hour. It deletes expired resumes (versions and linked chats go with them through foreign-key cascade), expired sessions, and job cache rows older than the cache TTL.

## 8. Model fallback and errors

```mermaid
flowchart LR
  R[AI request] --> M1[GEMINI_MODEL]
  M1 -->|ok| Done[Result]
  M1 -->|404, 429, 5xx| M2[Fallback 1]
  M2 -->|404, 429, 5xx| M3[Fallback 2 ...]
  M3 -->|all failed| E[AiErrorFilter]
  E -->|last error 429| Q[429 free quota message]
  E -->|otherwise| Bad[502 AI provider failed]
```

Other errors (for example a 400 from the provider) are not retried on another model. The first failure is reported.
