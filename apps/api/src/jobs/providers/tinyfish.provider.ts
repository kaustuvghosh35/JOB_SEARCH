import { Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { ENV } from '../../config/config.module.js';
import type { Env } from '../../config/env.js';
import { JobProviderError, type JobProvider, type SearchHit, type SearchRequest } from './job-provider.js';

const SEARCH_URL = 'https://api.search.tinyfish.ai';

const responseSchema = z.object({
  results: z.array(
    z.object({
      title: z.string().default(''),
      snippet: z.string().default(''),
      url: z.string(),
      site_name: z.string().default(''),
    }),
  ),
});

@Injectable()
export class TinyfishProvider implements JobProvider {
  constructor(@Inject(ENV) private readonly env: Env) {}

  async search({ query, location }: SearchRequest): Promise<SearchHit[]> {
    if (!this.env.TINYFISH_API_KEY) throw new JobProviderError('TINYFISH_API_KEY is not configured on the server.');
    const url = new URL(SEARCH_URL);
    url.searchParams.set('query', query);
    if (location) url.searchParams.set('location', location);

    const res = await fetch(url, {
      headers: { 'X-API-Key': this.env.TINYFISH_API_KEY },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new JobProviderError(`Job search failed (${res.status}).`);

    const parsed = responseSchema.safeParse(await res.json());
    if (!parsed.success) throw new JobProviderError('Job search returned an unexpected response.');
    return parsed.data.results.map((r) => ({ title: r.title, snippet: r.snippet, url: r.url, siteName: r.site_name }));
  }
}
