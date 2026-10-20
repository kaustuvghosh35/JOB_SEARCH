import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  WEB_ORIGIN: z.string().default('http://localhost:3000'),
  DATABASE_PATH: z.string().default('data/app.db'),
  RESUME_TTL_HOURS: z.coerce.number().default(168),
  JOB_CACHE_TTL_HOURS: z.coerce.number().default(8),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-3.5-flash'),
  GEMINI_FALLBACK_MODELS: z.string().default('gemini-3.1-flash-lite,gemini-3-flash-preview,gemini-3.6-flash'),
  TINYFISH_API_KEY: z.string().optional(),
  TINYFISH_FETCH_ENRICH: z.stringbool().default(false),
  ACCESS_CODE: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

for (const file of ['.env', '../../.env']) {
  try {
    process.loadEnvFile(file);
  } catch {
    // file absent: fall back to real environment variables
  }
}

export const loadEnv = (): Env => envSchema.parse(process.env);
