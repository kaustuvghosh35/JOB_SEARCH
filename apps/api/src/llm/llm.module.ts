import { Global, Module } from '@nestjs/common';
import { createAnthropic } from '@ai-sdk/anthropic';
import type { LanguageModel } from 'ai';
import { ENV } from '../config/config.module.js';
import type { Env } from '../config/env.js';

export const LLM_MODEL = Symbol('LLM_MODEL');

const createModel = (env: Env): LanguageModel => {
  const anthropic = createAnthropic({ apiKey: env.ANTHROPIC_API_KEY });
  return anthropic(env.ANTHROPIC_MODEL);
};

@Global()
@Module({
  providers: [{ provide: LLM_MODEL, useFactory: createModel, inject: [ENV] }],
  exports: [LLM_MODEL],
})
export class LlmModule {}
