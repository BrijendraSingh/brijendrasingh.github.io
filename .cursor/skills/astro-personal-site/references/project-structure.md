# Astro Project Structure (Mr. Brij)

```
mr-brij/
├── .github/workflows/deploy.yml
├── public/
│   ├── resume.pdf
│   ├── images/blog/
│   ├── posts/              # legacy redirect HTML
│   ├── robots.txt
│   └── favicon.svg
├── src/
│   ├── config/site.ts
│   ├── content/
│   │   ├── config.ts
│   │   └── blog/
│   ├── components/
│   ├── layouts/
│   ├── pages/
│   └── styles/global.css
├── scripts/
│   └── generate-redirects.mjs
├── astro.config.mjs
├── tailwind.config.mjs
└── package.json
```

Legacy Jekyll source was migrated and removed. Post inventory lives in
`.cursor/skills/jekyll-to-astro-migration/references/post-migration-map.json`.
