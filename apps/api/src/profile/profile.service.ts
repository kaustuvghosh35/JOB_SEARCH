import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { generateText, Output, type LanguageModel } from 'ai';
import { profileSchema, type Profile } from '@job-search/shared';
import { ENV } from '../config/config.module.js';
import type { Env } from '../config/env.js';
import { LLM_MODEL } from '../llm/llm.module.js';
import { providerOptions } from '../llm/provider-options.js';

const SYSTEM = `You extract a structured profile from a resume.
Use only facts present in the resume. Never guess a value: use null where the schema allows it.
"headline" is the person's current or most recent job title; if they are a fresher, use their target role.
If the resume gives both a company designation (such as Associate Consultant) and the functional role they actually do (such as UI/API Developer), use the functional role, because the headline is used to search for jobs. For the same text always make the same choice.
"skills" are concrete tools, languages, frameworks and domains, most important first.
Write the summary without gendered pronouns (use the person's name or "they").`;

@Injectable()
export class ProfileService {
  constructor(
    @Inject(LLM_MODEL) private readonly model: LanguageModel,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async extract(resumeText: string): Promise<Profile> {
    if (!this.env.GEMINI_API_KEY) {
      throw new ServiceUnavailableException('GEMINI_API_KEY is not configured on the server.');
    }
    const { output } = await generateText({
      model: this.model,
      output: Output.object({ schema: profileSchema }),
      system: SYSTEM,
      prompt: resumeText,
      providerOptions,
    });
    return output;
  }
}
