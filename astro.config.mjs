// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';
import rehypeMermaid from 'rehype-mermaid';
import { rehypeWrapTables } from './src/lib/rehype-wrap-tables.mjs';

export default defineConfig({
  site: 'https://mr-brij.bps-brijendra.workers.dev',
  base: '/',
  output: 'server',
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
      configPath: 'worker/wrangler.toml',
    },
  }),

  markdown: {
    syntaxHighlight: {
      type: 'shiki',
      excludeLangs: ['mermaid'],
    },
    rehypePlugins: [rehypeWrapTables, [rehypeMermaid, { strategy: 'img-svg' }]],
  },

  vite: {
    plugins: [tailwindcss()],
    ssr: {
      noExternal: ['@mr-brij/shared'],
    },
    server: {
      proxy: {
        '/api': { target: 'http://localhost:3001', changeOrigin: true },
        '/auth': { target: 'http://localhost:3001', changeOrigin: true },
        '/health': { target: 'http://localhost:3001', changeOrigin: true },
      },
    },
  },

  integrations: [react(), sitemap(), mdx()],
});
