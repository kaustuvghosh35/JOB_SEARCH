import { BadRequestException, Inject, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import {
  convertToModelMessages,
  createIdGenerator,
  generateText,
  streamText,
  toUIMessageStream,
  type LanguageModel,
  type UIMessage,
} from 'ai';
import { ENV } from '../config/config.module.js';
import type { Env } from '../config/env.js';
import { LLM_MODEL } from '../llm/llm.module.js';
import { providerOptions } from '../llm/provider-options.js';
import { VersionsService } from '../resume/improver/versions.service.js';
import { ResumeService, type ResumeView } from '../resume/resume.service.js';
import type { ImprovedVersion } from '@job-search/shared';
import { ChatRepository } from './chat.repository.js';
import { DRAFT_PROMPT, INTERVIEW_PROMPT, REFINE_PROMPT } from './prompts.js';

const MAX_MESSAGES = 200;
const MIN_USER_MESSAGES = 3;

const textOf = (m: UIMessage) =>
  m.parts
    .map((p) => (p.type === 'text' ? p.text : ''))
    .join('')
    .trim();

@Injectable()
export class ChatService {
  constructor(
    @Inject(LLM_MODEL) private readonly model: LanguageModel,
    @Inject(ENV) private readonly env: Env,
    @Inject(ChatRepository) private readonly repo: ChatRepository,
    @Inject(ResumeService) private readonly resumes: ResumeService,
    @Inject(VersionsService) private readonly versions: VersionsService,
  ) {}

  history(sessionId: string) {
    const session = this.repo.findSession(sessionId);
    if (!session || session.expiresAt.getTime() < Date.now()) return { messages: [] as UIMessage[], resumeId: null };
    return { messages: this.repo.messages(sessionId), resumeId: session.resumeId };
  }

  async stream(sessionId: string, message: UIMessage, resumeId: string | null) {
    this.requireKey();
    if (message.role !== 'user') throw new BadRequestException('Only user messages can be sent.');
    if (resumeId) this.resumes.getRow(resumeId);

    const session = this.repo.findSession(sessionId) ?? this.repo.createSession(sessionId, resumeId, this.expiry());
    const previous = this.repo.messages(sessionId);
    if (previous.length >= MAX_MESSAGES) throw new BadRequestException('This conversation is too long. Start a new one.');
    const messages = [...previous.filter((m) => m.id !== message.id), message];
    const linkedResume = resumeId ?? session.resumeId;

    const result = streamText({
      model: this.model,
      instructions: this.instructions(linkedResume),
      messages: await convertToModelMessages(messages),
      providerOptions,
    });
    void result.consumeStream();

    return toUIMessageStream({
      stream: result.stream,
      originalMessages: messages,
      generateMessageId: createIdGenerator({ prefix: 'msg', size: 16 }),
      onEnd: ({ messages: all }) => this.repo.saveMessages(sessionId, all, this.expiry()),
    });
  }

  async createResume(sessionId: string): Promise<ResumeView> {
    this.requireKey();
    const session = this.repo.findSession(sessionId);
    if (!session) throw new NotFoundException('Conversation not found.');
    const messages = this.repo.messages(sessionId);
    if (messages.filter((m) => m.role === 'user').length < MIN_USER_MESSAGES) {
      throw new BadRequestException('Tell me a bit more about your background first.');
    }
    const transcript = messages.map((m) => `${m.role === 'user' ? 'User' : 'Coach'}: ${textOf(m)}`).join('\n');
    const { text } = await generateText({ model: this.model, instructions: DRAFT_PROMPT, prompt: transcript, providerOptions });
    const resume = await this.resumes.createFromText(text);
    this.repo.linkResume(sessionId, resume.id);
    return resume;
  }

  async applyToResume(sessionId: string): Promise<ImprovedVersion> {
    const session = this.repo.findSession(sessionId);
    if (!session?.resumeId) throw new BadRequestException('Open this chat from a resume to apply it.');
    const messages = this.repo.messages(sessionId);
    if (!messages.some((m) => m.role === 'user')) throw new BadRequestException('Chat first, then apply the changes.');
    const transcript = messages.map((m) => `${m.role === 'user' ? 'User' : 'Coach'}: ${textOf(m)}`).join('\n');
    return this.versions.improve(session.resumeId, {
      extra: `Chat between the user and a resume coach. Apply the edits the user asked for or agreed to, and add any new facts the user stated.\n\n${transcript}`,
      revise: true,
    });
  }

  private instructions(resumeId: string | null): string {
    if (!resumeId) return INTERVIEW_PROMPT;
    const row = this.resumes.getRow(resumeId);
    let improved = '';
    try {
      improved = `\n\nLATEST IMPROVED VERSION (JSON):\n${JSON.stringify(this.versions.latest(resumeId).resume)}`;
    } catch (e) {
      if (!(e instanceof NotFoundException)) throw e;
    }
    return `${REFINE_PROMPT}\n\n--- CURRENT RESUME ---\n${row.originalText}${improved}`;
  }

  private expiry() {
    return new Date(Date.now() + this.env.RESUME_TTL_HOURS * 3_600_000);
  }

  private requireKey() {
    if (!this.env.GEMINI_API_KEY) throw new ServiceUnavailableException('GEMINI_API_KEY is not configured on the server.');
  }
}
