#!/usr/bin/env node
/**
 * Generate static redirect HTML for legacy Jekyll /posts/ URLs.
 * Reads post-migration-map.json and writes public/posts/{date-slug}/index.html
 */
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const mapPath = join(
  __dirname,
  "../.cursor/skills/jekyll-to-astro-migration/references/post-migration-map.json"
);
const publicDir = join(__dirname, "../public/posts");

const posts = JSON.parse(readFileSync(mapPath, "utf8"));

for (const post of posts) {
  const oldSlug = post.oldPath.replace(/^\/posts\//, "").replace(/\/$/, "");
  const dir = join(publicDir, oldSlug);
  mkdirSync(dir, { recursive: true });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0; url=${post.newPath}">
  <link rel="canonical" href="${post.newPath}">
  <title>Redirecting…</title>
</head>
<body>
  <p>Redirecting to <a href="${post.newPath}">${post.title}</a>…</p>
</body>
</html>
`;
  writeFileSync(join(dir, "index.html"), html);
  console.log(`Created redirect: /posts/${oldSlug}/ → ${post.newPath}`);
}

console.log(`Done. ${posts.length} redirects generated.`);
