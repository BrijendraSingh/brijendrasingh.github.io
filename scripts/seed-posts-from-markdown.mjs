#!/usr/bin/env node
/**
 * One-time seed: import src/content/blog/*.md into SQLite (local dev).
 * Run after: npm run dev:api (or with data/ initialized via backend).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const blogDir = path.join(root, 'src/content/blog');
const dataDir = path.join(root, 'data');
const dbPath = path.join(dataDir, 'mr-brij.sqlite');
const migration = fs.readFileSync(path.join(root, 'migrations/0001_initial.sql'), 'utf8');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');
db.exec(migration);

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };
  const meta = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if (val.startsWith('[')) {
      meta[key] = val
        .replace(/^\[|\]$/g, '')
        .split(',')
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean);
    } else if (val === 'true' || val === 'false') {
      meta[key] = val === 'true';
    } else {
      meta[key] = val.replace(/^['"]|['"]$/g, '');
    }
  }
  return { meta, body: match[2] };
}

let admin = db.prepare(`SELECT id FROM users WHERE email = ?`).get('bps.brijendra@gmail.com');
if (!admin) {
  const r = db
    .prepare(
      `INSERT INTO users (email, display_name, oauth_provider, oauth_subject, role)
       VALUES (?, ?, 'google', 'seed-admin', 'admin')`
    )
    .run('bps.brijendra@gmail.com', 'Brijendra Singh');
  admin = { id: r.lastInsertRowid };
}

const files = fs.readdirSync(blogDir).filter((f) => f.endsWith('.md') && !f.startsWith('_'));
let imported = 0;

for (const file of files) {
  const slug = file.replace(/\.md$/, '');
  const existing = db
    .prepare(`SELECT id FROM posts WHERE slug = ? AND status = 'published'`)
    .get(slug);
  if (existing) continue;

  const raw = fs.readFileSync(path.join(blogDir, file), 'utf8');
  const { meta, body } = parseFrontmatter(raw);
  if (meta.draft === true) continue;

  const title = meta.title || slug;
  const description = meta.description || '';
  const pubDate = meta.pubDate || new Date().toISOString();
  const words = body.trim().split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(words / 200));

  const result = db
    .prepare(
      `INSERT INTO posts (slug, title, description, body_md, status, author_id, published_by,
       pub_date, published_at, reading_time, comments_disabled, updated_date)
       VALUES (?, ?, ?, ?, 'published', ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
    )
    .run(
      slug,
      title,
      description,
      body,
      admin.id,
      admin.id,
      pubDate,
      pubDate,
      readingTime,
      meta.commentsDisable ? 1 : 0
    );

  const tags = Array.isArray(meta.tags) ? meta.tags : [];
  for (const name of tags) {
    const tagSlug = slugify(name);
    let tag = db.prepare(`SELECT id FROM tags WHERE slug = ?`).get(tagSlug);
    if (!tag) {
      const tr = db.prepare(`INSERT INTO tags (name, slug) VALUES (?, ?)`).run(name, tagSlug);
      tag = { id: tr.lastInsertRowid };
    }
    db.prepare(`INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)`).run(
      result.lastInsertRowid,
      tag.id
    );
  }
  imported += 1;
  console.log(`Imported: ${slug}`);
}

console.log(`Done. ${imported} posts seeded into ${dbPath}`);
