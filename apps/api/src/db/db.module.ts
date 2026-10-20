import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Global, Module } from '@nestjs/common';
import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { ENV } from '../config/config.module.js';
import type { Env } from '../config/env.js';
import * as schema from './schema/index.js';

export const DB = Symbol('DB');
export type Db = BetterSQLite3Database<typeof schema>;

const migrationsFolder = resolve(dirname(fileURLToPath(import.meta.url)), '../../drizzle');

export const openDb = (path: string): Db => {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const sqlite = new Database(path);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder });
  return db;
};

const createDb = (env: Env): Db => openDb(resolve(env.DATABASE_PATH));

@Global()
@Module({
  providers: [{ provide: DB, useFactory: createDb, inject: [ENV] }],
  exports: [DB],
})
export class DbModule {}
