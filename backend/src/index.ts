import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { configureSqliteApi, initializeDatabase } from './config/database.api.js';
import {
  initializeSqliteDatabase,
  sqliteGet,
  sqliteAll,
  sqliteRun,
} from './config/database.sqlite.js';
import { createHonoApp } from '../../worker/hono-app.js';

const PORT = parseInt(process.env.PORT || '3001', 10);

async function main() {
  configureSqliteApi({
    initialize: initializeSqliteDatabase,
    dbGet: sqliteGet,
    dbAll: sqliteAll,
    dbRun: sqliteRun,
  });
  await initializeDatabase();

  const app = createHonoApp('development');
  const nodeApp = express();
  nodeApp.use(cors({ origin: ['http://localhost:4321', 'http://localhost:8787'], credentials: true }));
  nodeApp.use(morgan('dev'));
  nodeApp.all('*', async (req, res) => {
    const url = `http://localhost${req.url}`;
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
    }
    let body: string | undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      body = await new Promise<string>((resolve) => {
        let data = '';
        req.on('data', (chunk) => (data += chunk));
        req.on('end', () => resolve(data));
      });
    }
    const response = await app.fetch(
      new Request(url, { method: req.method, headers, body: body || undefined })
    );
    res.status(response.status);
    response.headers.forEach((v, k) => res.setHeader(k, v));
    const text = await response.text();
    res.send(text);
  });

  nodeApp.listen(PORT, () => {
    console.log(`Mr Brij API running on http://localhost:${PORT}`);
  });
}

main().catch(console.error);
