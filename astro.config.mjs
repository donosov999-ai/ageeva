import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

// Сайт Вали на Astro. Цель: дизайн и URL 1:1 со статической версией.
// build.format:'file' → about.astro даёт /about.html (а не /about/), как сейчас.
// preact() — для нового редактора (admin) с живым превью (остров client:only).
export default defineConfig({
  site: 'https://ageeva.win',
  build: { format: 'file' },
  integrations: [preact()],
  // Без интеграции sitemap — sitemap.xml/robots.txt сохраняем как есть в public/.
});
