import { Global, Logger, Module } from '@nestjs/common';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { LanguageModelV4 } from '@ai-sdk/provider';
import type { LanguageModel } from 'ai';
import { ENV } from '../config/config.module.js';
import type { Env } from '../config/env.js';
import { withFallback } from './fallback-model.js';

export const LLM_MODEL = Symbol('LLM_MODEL');

const createModel = (env: Env): LanguageModel => {
  const google = createGoogleGenerativeAI({ apiKey: env.GEMINI_API_KEY });
  const ids = [env.GEMINI_MODEL, ...env.GEMINI_FALLBACK_MODELS.split(',').map((s) => s.trim()).filter(Boolean)];
  const logger = new Logger('LLM');
  return withFallback(
    ids.map((id) => google(id) as LanguageModelV4),
    (id, error) => logger.warn(`${id} unavailable, trying next model: ${error instanceof Error ? error.message.slice(0, 80) : error}`),
  );
};

@Global()
@Module({
  providers: [{ provide: LLM_MODEL, useFactory: createModel, inject: [ENV] }],
  exports: [LLM_MODEL],
})
export class LlmModule {}
