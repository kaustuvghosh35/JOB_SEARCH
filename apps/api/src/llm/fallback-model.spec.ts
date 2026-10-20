import { generateText } from 'ai';
import { APICallError } from 'ai';
import { MockLanguageModelV4 } from 'ai/test';
import { withFallback } from './fallback-model.js';

const usage = {
  inputTokens: { total: 1, noCache: 1, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 1, text: 1, reasoning: undefined },
};
const ok = (text: string) =>
  new MockLanguageModelV4({
    modelId: text,
    doGenerate: async () => ({ content: [{ type: 'text', text }], finishReason: { unified: 'stop', raw: undefined }, usage, warnings: [] }),
  });
const failing = (statusCode: number) =>
  new MockLanguageModelV4({
    doGenerate: async () => {
      throw new APICallError({ message: 'boom', url: 'x', requestBodyValues: {}, statusCode });
    },
  });

describe('withFallback', () => {
  it('uses the next model when the first is out of quota', async () => {
    const skipped: string[] = [];
    const model = withFallback([failing(429), ok('second')], (id) => skipped.push(id));
    const { text } = await generateText({ model, prompt: 'hi', maxRetries: 0 });
    expect(text).toBe('second');
    expect(skipped).toHaveLength(1);
  });

  it('does not hide client errors', async () => {
    const model = withFallback([failing(400), ok('second')]);
    await expect(generateText({ model, prompt: 'hi', maxRetries: 0 })).rejects.toThrow('boom');
  });

  it('throws the last error when every model fails', async () => {
    const model = withFallback([failing(429), failing(404)]);
    await expect(generateText({ model, prompt: 'hi', maxRetries: 0 })).rejects.toThrow('boom');
  });
});
