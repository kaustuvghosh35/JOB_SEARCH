import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module.js';
import { DbModule } from './db/db.module.js';
import { HealthController } from './health/health.controller.js';
import { LlmModule } from './llm/llm.module.js';

@Module({
  imports: [ConfigModule, DbModule, LlmModule],
  controllers: [HealthController],
})
export class AppModule {}
