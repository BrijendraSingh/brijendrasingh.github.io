import { env } from 'cloudflare:workers';
import type { D1Database } from '@cloudflare/workers-types';
import { configureD1Api, initializeDatabase } from '../../../backend/src/config/database.api.js';
import {
  setD1Database,
  initializeD1Database,
  d1Get,
  d1All,
  d1Run,
} from '../../../backend/src/config/database.d1.js';

let mode: 'd1' | 'api' | 'unset' = 'unset';

function getCloudflareDb(): D1Database | undefined {
  return (env as { DB?: D1Database }).DB;
}

export async function initServerDb(): Promise<void> {
  if (mode !== 'unset') return;

  const db = getCloudflareDb();
  if (db) {
    setD1Database(db);
    configureD1Api({
      initialize: initializeD1Database,
      dbGet: d1Get,
      dbAll: d1All,
      dbRun: d1Run,
    });
    mode = 'd1';
    await initializeDatabase();
    return;
  }

  if (import.meta.env.DEV) {
    mode = 'api';
    return;
  }

  throw new Error('Database not configured. D1 binding required in production.');
}

export function usesApiFallback(): boolean {
  return mode === 'api';
}

export async function fetchApi<T>(path: string): Promise<T> {
  const base = import.meta.env.DEV ? 'http://localhost:3001' : '';
  const res = await fetch(`${base}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  const json = (await res.json()) as { success: boolean; data: T };
  return json.data;
}
