import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { loadEnv } from './config/env.js';

const env = loadEnv();
const app = await NestFactory.create(AppModule);
app.enableCors({ origin: env.WEB_ORIGIN, exposedHeaders: ['x-session-id'] });
await app.listen(env.PORT);
