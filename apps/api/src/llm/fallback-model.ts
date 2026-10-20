import type { LanguageModelV4 } from '@ai-sdk/provider';
import { APICallError } from 'ai';

const SKIPPABLE = new Set([404, 429, 500, 502, 503, 504]);

const shouldSkip = (error: unknown) => APICallError.isInstance(error) && SKIPPABLE.has(error.statusCode ?? 0);

// Free-tier quotas are per model, so a 429 on one model can still be served by the next.
export const withFallback = (models: LanguageModelV4[], onSkip?: (modelId: string, error: unknown) => void): LanguageModelV4 => {
  const run = async <T>(call: (m: LanguageModelV4) => PromiseLike<T>): Promise<T> => {
    let last: unknown;
    for (const m of models) {
      try {
        return await call(m);
      } catch (error) {
        if (!shouldSkip(error)) throw error;
        onSkip?.(m.modelId, error);
        last = error;
      }
    }
    throw last;
  };

  return {
    specificationVersion: 'v4',
    provider: 'fallback',
    modelId: models[0].modelId,
    get supportedUrls() {
      return models[0].supportedUrls;
    },
    doGenerate: (options) => run((m) => m.doGenerate(options)),
    doStream: (options) => run((m) => m.doStream(options)),
  };
};
