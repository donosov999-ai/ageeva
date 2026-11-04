// Статичные статьи сайта (markdown в src/content/articles/*.md). Черновики (draft: true) на сайт НЕ попадают;
// для локальной проверки: INCLUDE_DRAFTS=1 npm run build. Карта тем и ключей — valya/seo/KEYWORDS_30_TOPICS_04-11-2026.md
export const HUBS = {
  'privyazannost': { title: 'Почему я выбираю «не тех»', lead: 'Привычные сценарии, стили привязанности и то, как из них выходить.', module: 'М1–М2' },
  'govorit-i-slyshat': { title: 'Говорить и слышать', lead: 'Как говорить, чтобы тебя услышали, и как слушать, когда хочется защищаться.', module: 'М4' },
  'ssory-i-krizisy': { title: 'Ссоры и кризисы', lead: 'Как ссориться и мириться, не разрушая то, что вас связывает.', module: 'М5' },
  'semya-i-dengi': { title: 'Семья и деньги', lead: 'Дети, родственники, быт и деньги — то, о чём чаще всего спорят в паре.', module: 'М6' },
  'znakomstva-i-posle': { title: 'Знакомства и жизнь после', lead: 'Как знакомиться, выбирать и жить дальше после расставания.', module: 'М3' },
  'blizost': { title: 'Близость', lead: 'Желание, нежность и телесная близость в паре.', module: 'Бонус' },
};
const mods = import.meta.glob('../content/articles/*.md', { eager: true });
const withDrafts = process.env.INCLUDE_DRAFTS === '1';
export function allArticles() {
  return Object.entries(mods)
    .map(([p, m]) => ({ slug: p.split('/').pop().replace(/\.md$/, ''), ...m.frontmatter, Content: m.Content }))
    .filter((a) => withDrafts || !a.draft)
    .sort((a, b) => String(b.updated || b.date).localeCompare(String(a.updated || a.date)));
}
