import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  WEB_ORIGIN: z.string().default('http://localhost:3000'),
  DATABASE_PATH: z.string().default('data/app.db'),
  RESUME_TTL_HOURS: z.coerce.number().default(168),
  JOB_CACHE_TTL_HOURS: z.coerce.number().default(8),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default('claude-sonnet-5-5'),
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
