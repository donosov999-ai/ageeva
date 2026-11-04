// Собирает dist/llms-full.txt — полный текст ключевых страниц в markdown для ИИ-ассистентов
// (спецификация llmstxt.org). Запускается после `astro build`, поэтому всегда свежий.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const SITE = 'https://ageeva.win';
const PAGES = ['index.html', 'about.html', 'free.html', 'help.html', 'tests/index.html',
  ...readdirSync(join(DIST, 'tests')).filter((f) => f.endsWith('-test.html')).map((f) => 'tests/' + f),
  ...readdirSync(join(DIST, 'test')).filter((f) => f.endsWith('.html')).sort().map((f) => 'test/' + f),
  ...(existsSync(join(DIST, 'stati')) ? readdirSync(join(DIST, 'stati')).filter((f) => f.endsWith('.html')).sort().map((f) => 'stati/' + f) : [])];

const dec = (s) => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'");
function toMarkdown(html) {
  let b = (html.split(/<body[^>]*>/)[1] || html).split('</body>')[0];
  b = b.replace(/<(script|style|noscript|svg|form|button|select|nav)[^>]*>[\s\S]*?<\/\1>/gi, '')
       .replace(/<header[^>]*class="site-header"[\s\S]*?<\/header>/i, '')
       .replace(/<footer[\s\S]*?<\/footer>/i, '')
       .replace(/<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi, (m, l, t) => '\n' + '#'.repeat(+l) + ' ' + t.replace(/<br[^>]*>/gi, ' ') + '\n')
       .replace(/<li[^>]*>/gi, '\n- ')
       .replace(/<\/(p|div|section|summary|details|ul|ol|tr)>/gi, '\n').replace(/<br[^>]*>/gi, '\n')
       .replace(/<[^>]+>/g, '');
  return dec(b).split('\n').map((l) => l.replace(/[ \t]+/g, ' ').trim()).filter(Boolean).join('\n').replace(/\n(#+ )/g, '\n\n$1');
}

let out = `# Валентина Агеева — психология отношений: полный текст ключевых страниц\n\n> Расширенный вариант ${SITE}/llms.txt. Собран автоматически при сборке сайта из опубликованных страниц. Автор: Валентина Агеева. Тесты — самонаблюдение по мотивам методик Джона Готтмана, не диагностика.\n`;
for (const p of PAGES) {
  if (!existsSync(join(DIST, p))) continue;
  const html = readFileSync(join(DIST, p), 'utf8');
  const title = (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || p;
  const url = p === 'index.html' ? SITE + '/' : p === 'tests/index.html' ? SITE + '/tests/' : `${SITE}/${p}`;
  out += `\n\n---\n\n<!-- ${url} -->\nSource: ${url}\nTitle: ${dec(title.trim())}\n\n${toMarkdown(html)}\n`;
}
writeFileSync(join(DIST, 'llms-full.txt'), out);
console.log(`llms-full.txt: ${PAGES.length} страниц, ${(out.length / 1024).toFixed(0)} КБ`);
