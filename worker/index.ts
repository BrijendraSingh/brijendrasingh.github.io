import { configureD1Api, initializeDatabase } from '../backend/src/config/database.api.js';
import {
  setD1Database,
  initializeD1Database,
  d1Get,
  d1All,
  d1Run,
} from '../backend/src/config/database.d1.js';
import { createHonoApp } from './hono-app.js';
import { syncProcessEnvFromBindings } from './env-bindings.js';
import astroWorker from '../dist/server/entry.mjs';
import type { Hono } from 'hono';

let honoApp: Hono | null = null;

async function getApiApp(env: Env): Promise<Hono> {
  if (honoApp) return honoApp;

  syncProcessEnvFromBindings(env);

  setD1Database(env.DB);
  configureD1Api({
    initialize: initializeD1Database,
    dbGet: d1Get,
    dbAll: d1All,
    dbRun: d1Run,
  });
  await initializeDatabase();
  honoApp = createHonoApp('production');
  return honoApp;
}

function isApiRoute(pathname: string): boolean {
  return pathname === '/health' || pathname.startsWith('/api') || pathname.startsWith('/auth');
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (isApiRoute(url.pathname)) {
      const app = await getApiApp(env);
      return app.fetch(request, env, ctx);
    }
    return astroWorker.fetch(request, env, ctx);
  },
};
