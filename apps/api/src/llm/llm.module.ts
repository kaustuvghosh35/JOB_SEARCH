import { Global, Module } from '@nestjs/common';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { LanguageModel } from 'ai';
import { ENV } from '../config/config.module.js';
import type { Env } from '../config/env.js';

export const LLM_MODEL = Symbol('LLM_MODEL');

const createModel = (env: Env): LanguageModel => {
  const google = createGoogleGenerativeAI({ apiKey: env.GEMINI_API_KEY });
  return google(env.GEMINI_MODEL);
};

@Global()
@Module({
  providers: [{ provide: LLM_MODEL, useFactory: createModel, inject: [ENV] }],
  exports: [LLM_MODEL],
})
export class LlmModule {}
