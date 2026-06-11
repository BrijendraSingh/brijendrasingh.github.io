// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import rehypeMermaid from 'rehype-mermaid';
import { rehypeWrapTables } from './src/lib/rehype-wrap-tables.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://brijendrasingh.github.io',
  base: '/',
  output: 'static',

  markdown: {
    syntaxHighlight: {
      type: 'shiki',
      excludeLangs: ['mermaid'],
    },
    rehypePlugins: [rehypeWrapTables, [rehypeMermaid, { strategy: 'img-svg' }]],
  },

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [sitemap(), mdx()],
});
