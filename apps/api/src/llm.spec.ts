import { NotFoundException } from '@nestjs/common';
import { simulateReadableStream, type UIMessage } from 'ai';
import { MockLanguageModelV4 } from 'ai/test';
import { loadEnv } from './config/env.js';
import { ChatRepository } from './chat/chat.repository.js';
import { ChatService } from './chat/chat.service.js';
import { openDb } from './db/db.module.js';
import { resumes as resumesTable } from './db/schema/index.js';
import { ProfileService } from './profile/profile.service.js';
import { ResumeImproverService } from './resume/improver/resume-improver.service.js';
import type { VersionsService } from './resume/improver/versions.service.js';
import type { ResumeService } from './resume/resume.service.js';

const env = { ...loadEnv(), GEMINI_API_KEY: 'test' };
const noKey = { ...env, GEMINI_API_KEY: undefined };

const usage = {
  inputTokens: { total: 1, noCache: 1, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 1, text: 1, reasoning: undefined },
};
const finish = { unified: 'stop' as const, raw: undefined };

const jsonModel = (obj: unknown) =>
  new MockLanguageModelV4({
    doGenerate: async () => ({ content: [{ type: 'text', text: JSON.stringify(obj) }], finishReason: finish, usage, warnings: [] }),
  });

const textModel = (text: string) =>
  new MockLanguageModelV4({
    doGenerate: async () => ({ content: [{ type: 'text', text }], finishReason: finish, usage, warnings: [] }),
    doStream: async () => ({
      stream: simulateReadableStream({
        chunks: [
          { type: 'text-start', id: 't' },
          { type: 'text-delta', id: 't', delta: text },
          { type: 'text-end', id: 't' },
          { type: 'finish', finishReason: finish, usage },
        ],
      }),
    }),
  });

const userMsg = (id: string, text: string): UIMessage => ({ id, role: 'user', parts: [{ type: 'text', text }] });

const drain = async (stream: ReadableStream) => {
  const reader = stream.getReader();
  while (!(await reader.read()).done);
};

describe('ProfileService', () => {
  it('returns schema-valid structured output', async () => {
    const profile = {
      fullName: 'Asha Rao',
      headline: 'Backend Engineer',
      seniority: 'mid',
      yearsOfExperience: 5,
      skills: ['TypeScript'],
      location: null,
      summary: 'Builds APIs.',
    };
    const svc = new ProfileService(jsonModel(profile), env);
    await expect(svc.extract('resume text')).resolves.toEqual(profile);
  });

  it('fails clearly without an API key', async () => {
    await expect(new ProfileService(jsonModel({}), noKey).extract('x')).rejects.toThrow(/GEMINI_API_KEY/);
  });
});

describe('ResumeImproverService', () => {
  it('returns a validated ImprovedResume', async () => {
    const out = {
      fullName: 'Asha Rao',
      contact: [],
      summary: 's',
      experience: [],
      education: [],
      skills: [],
      extras: [],
      changeNotes: ['tightened bullets'],
      openQuestions: [],
    };
    await expect(new ResumeImproverService(jsonModel(out), env).improve({ original: 'text' })).resolves.toEqual(out);
  });
});

describe('ChatService', () => {
  const setup = (reply: string) => {
    const db = openDb(':memory:');
    const resume = db.insert(resumesTable).values({ originalText: 'Asha Rao', expiresAt: new Date(Date.now() + 1e6) }).returning().get();
    const resumes = {
      getRow: () => ({ originalText: 'Asha Rao, Backend Engineer' }),
      createFromText: async () => ({ id: resume.id }),
    } as unknown as ResumeService;
    const versions = { latest: () => { throw new Error('none'); } } as unknown as VersionsService;
    const repo = new ChatRepository(db);
    return { svc: new ChatService(textModel(reply), env, repo, resumes, versions), repo, resumeId: resume.id };
  };

  const sid = '11111111-1111-4111-8111-111111111111';

  it('streams a reply, persists both turns, and restores history', async () => {
    const { svc } = setup('What role are you targeting?');
    await drain(await svc.stream(sid, userMsg('u1', 'Help me write my resume'), null));

    const { messages } = svc.history(sid);
    expect(messages.map((m) => m.role)).toEqual(['user', 'assistant']);
    expect(JSON.stringify(messages[1].parts)).toContain('What role are you targeting?');

    await drain(await svc.stream(sid, userMsg('u2', 'Backend engineer'), null));
    expect(svc.history(sid).messages.map((m) => m.id).slice(0, 2)).toEqual(messages.map((m) => m.id));
    expect(svc.history(sid).messages).toHaveLength(4);
  });

  it('does not let one session overwrite another session\'s message ids', async () => {
    const { svc } = setup('ok');
    await drain(await svc.stream(sid, userMsg('same', 'mine'), null));
    const other = '22222222-2222-4222-8222-222222222222';
    await drain(await svc.stream(other, userMsg('same', 'theirs'), null));
    expect(JSON.stringify(svc.history(sid).messages[0].parts)).toContain('mine');
  });

  it('applies the chat to the linked resume by revising the latest version', async () => {
    const db = openDb(':memory:');
    const resume = db.insert(resumesTable).values({ originalText: 'Asha', expiresAt: new Date(Date.now() + 1e6) }).returning().get();
    const calls: unknown[] = [];
    const versions = { latest: () => { throw new NotFoundException('none'); }, improve: async (...a: unknown[]) => (calls.push(a), { id: 'v1' }) } as unknown as VersionsService;
    const repo = new ChatRepository(db);
    const svc = new ChatService(textModel('Sure, shortening it.'), env, repo, { getRow: () => resume } as unknown as ResumeService, versions);

    await drain(await svc.stream(sid, userMsg('u1', 'Please shorten my summary'), resume.id));
    await svc.applyToResume(sid);

    const [id, opts] = calls[0] as [string, { extra: string; revise: boolean }];
    expect(id).toBe(resume.id);
    expect(opts.revise).toBe(true);
    expect(opts.extra).toContain('User: Please shorten my summary');
  });

  it('refuses to apply a chat that is not linked to a resume', async () => {
    const { svc } = setup('ok');
    await drain(await svc.stream(sid, userMsg('u1', 'hi'), null));
    await expect(svc.applyToResume(sid)).rejects.toThrow(/Open this chat from a resume/);
  });

  it('refuses to create a resume from a too-short conversation', async () => {
    const { svc } = setup('ok');
    await drain(await svc.stream(sid, userMsg('u1', 'hi'), null));
    await expect(svc.createResume(sid)).rejects.toThrow(/more about your background/);
  });

  it('creates and links a resume from a long enough conversation', async () => {
    const { svc, repo, resumeId } = setup('RESUME TEXT');
    for (const [i, t] of ['one', 'two', 'three'].entries()) await drain(await svc.stream(sid, userMsg(`u${i}`, t), null));
    expect((await svc.createResume(sid)).id).toBe(resumeId);
    expect(repo.findSession(sid)?.resumeId).toBe(resumeId);
  });
});
