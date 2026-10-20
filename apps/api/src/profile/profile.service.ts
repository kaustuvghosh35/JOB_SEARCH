import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { generateText, Output, type LanguageModel } from 'ai';
import { profileSchema, type Profile } from '@job-search/shared';
import { ENV } from '../config/config.module.js';
import type { Env } from '../config/env.js';
import { LLM_MODEL } from '../llm/llm.module.js';

const SYSTEM = `You extract a structured profile from a resume.
Use only facts present in the resume. Never guess a value: use null where the schema allows it.
"headline" is the person's current or most recent job title; if they are a fresher, use their target role.
"skills" are concrete tools, languages, frameworks and domains, most important first.`;

@Injectable()
export class ProfileService {
  constructor(
    @Inject(LLM_MODEL) private readonly model: LanguageModel,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async extract(resumeText: string): Promise<Profile> {
    if (!this.env.ANTHROPIC_API_KEY) {
      throw new ServiceUnavailableException('ANTHROPIC_API_KEY is not configured on the server.');
    }
    const { output } = await generateText({
      model: this.model,
      output: Output.object({ schema: profileSchema }),
      system: SYSTEM,
      prompt: resumeText,
    });
    return output;
  }
}
