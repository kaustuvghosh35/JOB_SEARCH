import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { AiErrorFilter } from './common/ai-error.filter.js';
import { loadEnv } from './config/env.js';

const env = loadEnv();
const app = await NestFactory.create(AppModule);
app.useGlobalFilters(new AiErrorFilter());
app.enableCors({ origin: env.WEB_ORIGIN, exposedHeaders: ['x-session-id'] });
await app.listen(env.PORT);
