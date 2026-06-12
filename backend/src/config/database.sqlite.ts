import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../../../data');
const dbPath = path.join(dataDir, 'mr-brij.sqlite');

let db: Database.Database | null = null;

export async function initializeSqliteDatabase(): Promise<void> {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY)`);
  const migrationsDir = path.resolve(__dirname, '../../../migrations');
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();
  for (const file of migrationFiles) {
    const applied = db.prepare('SELECT 1 FROM schema_migrations WHERE name = ?').get(file);
    if (applied) continue;
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    db.exec(sql);
    db.prepare('INSERT INTO schema_migrations (name) VALUES (?)').run(file);
  }
}

function getDb(): Database.Database {
  if (!db) throw new Error('SQLite database not initialized.');
  return db;
}

export async function sqliteGet<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T | undefined> {
  const row = getDb().prepare(sql).get(...params) as T | undefined;
  return row;
}

export async function sqliteAll<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  return getDb().prepare(sql).all(...params) as T[];
}

export async function sqliteRun(
  sql: string,
  params: unknown[] = []
): Promise<{ lastID: number; changes: number }> {
  const result = getDb().prepare(sql).run(...params);
  return { lastID: Number(result.lastInsertRowid), changes: result.changes };
}
