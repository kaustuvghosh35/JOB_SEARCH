export type SearchHit = { title: string; snippet: string; url: string; siteName: string };

export type SearchRequest = { query: string; location?: string };

export interface JobProvider {
  search(req: SearchRequest): Promise<SearchHit[]>;
}

export const JOB_PROVIDER = Symbol('JOB_PROVIDER');

export class JobProviderError extends Error {}
