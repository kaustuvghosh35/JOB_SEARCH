import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { generateText, Output, type LanguageModel } from 'ai';
import { improvedResumeSchema, type ImprovedResume } from '@job-search/shared';
import { ENV } from '../../config/config.module.js';
import type { Env } from '../../config/env.js';
import { LLM_MODEL } from '../../llm/llm.module.js';

export const IMPROVER_SYSTEM = `You are an expert resume editor for ATS-friendly resumes.
Rewrite the resume to be clearer, more concise and more impactful.

Rules:
- Use ONLY facts in the source resume. Never invent employers, titles, dates, degrees, skills, tools, numbers or achievements.
- Keep contact details exactly as given.
- Start each bullet with a strong action verb; keep bullets to one or two lines; prefer results over duties.
- Where a number would strengthen a bullet but the source has none, do NOT make one up: keep the bullet as is and add a question to "openQuestions" (e.g. "How many users did the payments service handle?").
- Use standard section content: summary, experience (newest first), education, skills, extras (projects, certifications, etc.).
- Weave in role-relevant keywords only if the resume already supports them.
- "changeNotes": 4-8 short notes on what you changed and why.
- Write in the same language as the source.`;

@Injectable()
export class ResumeImproverService {
  constructor(
    @Inject(LLM_MODEL) private readonly model: LanguageModel,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async improve(originalText: string, targetRole?: string): Promise<ImprovedResume> {
    if (!this.env.ANTHROPIC_API_KEY) {
      throw new ServiceUnavailableException('ANTHROPIC_API_KEY is not configured on the server.');
    }
    const { output } = await generateText({
      model: this.model,
      output: Output.object({ schema: improvedResumeSchema }),
      system: IMPROVER_SYSTEM,
      prompt: targetRole ? `Target role: ${targetRole}\n\nResume:\n${originalText}` : `Resume:\n${originalText}`,
    });
    return output;
  }
}
