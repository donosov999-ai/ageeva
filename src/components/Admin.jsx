/* Новый редактор контента для Вали — Preact-остров.
   Бэкенд тот же Supabase (те же таблицы/RPC/логин valentina). Новое: живое превью,
   drag-drop фото, чистые разделы. Самодостаточно: свой fetch, без cms.js. */
import { useState, useEffect, useRef } from 'preact/hooks';

const SB_URL = 'https://iuvvheeocobhiothfgei.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1dnZoZWVvY29iaGlvdGhmZ2VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MTQ1ODcsImV4cCI6MjA5MjA5MDU4N30.IJ5i3UkC0GoIWGFnLKmc1UeX2iqn8LzNYfvEfj-3hIY';

const H = () => ({ apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json' });
function parse(r) { return r.text().then((t) => { const j = t ? JSON.parse(t) : null; if (!r.ok) throw (j && (j.message || j.error)) || ('HTTP ' + r.status); return j; }); }
function rpc(fn, args) { return fetch(SB_URL + '/rest/v1/rpc/' + fn, { method: 'POST', headers: H(), body: JSON.stringify(args || {}) }).then(parse); }
function sel(path) { return fetch(SB_URL + '/rest/v1/' + path, { headers: H() }).then(parse); }

const MAIN_FIELDS = [
  { k: 'idx_hero_title', label: 'Первый экран — заголовок', rows: 3, hint: 'перенос строки = перенос на сайте' },
  { k: 'idx_hero_lead', label: 'Первый экран — подзаголовок', rows: 3 },
  { k: 'idx_who_body', label: 'Блок «Кто я» — текст про себя', rows: 8, hint: 'пустая строка между абзацами = новый абзац' },
  { k: 'idx_pain', label: 'Блок «Тебе знакомо?» — список', rows: 9, hint: 'один пункт = одна строка' },
  { k: 'idx_why', label: 'Блок «Почему мне можно верить» — текст', rows: 6, hint: 'пустая строка = новый абзац' },
  { k: 'idx_notfit', label: 'Блок «Кому курс НЕ подойдёт» — список', rows: 6, hint: 'один пункт = одна строка' },
  { k: 'idx_proof_num', label: 'Соцпруф — число', input: true },
  { k: 'idx_proof_cap', label: 'Соцпруф — подпись', rows: 2 },
  { k: 'idx_cta_eyebrow', label: 'Финал — метка (статус набора)', input: true },
  { k: 'idx_cta_title', label: 'Финал — заголовок', input: true },
  { k: 'idx_cta_text', label: 'Финал — текст', rows: 2 },
];
const MAIN_KEYS = MAIN_FIELDS.map((f) => f.k);

// Схема блоков конструктора. f.ta=textarea, f.lines=массив строк, f.img=фото, f.bool, f.sel, f.rep=повторитель.
const BLOCK_TYPES = [
  { type: 'hero', label: 'Hero — шапка', fields: [{ k: 'eyebrow', l: 'Метка (мелкая)' }, { k: 'title', l: 'Заголовок', ta: 2 }, { k: 'subtitle', l: 'Подзаголовок', ta: 2 }, { k: 'btnText', l: 'Кнопка — текст' }, { k: 'btnUrl', l: 'Кнопка — ссылка' }, { k: 'photo', l: 'Фото справа', img: 1 }] },
  { type: 'text', label: 'Текст', fields: [{ k: 'eyebrow', l: 'Метка' }, { k: 'heading', l: 'Заголовок' }, { k: 'body', l: 'Текст', ta: 5 }] },
  { type: 'list', label: 'Список', fields: [{ k: 'eyebrow', l: 'Метка' }, { k: 'heading', l: 'Заголовок' }, { k: 'items', l: 'Пункты', lines: 1 }] },
  { type: 'textphoto', label: 'Текст + фото', fields: [{ k: 'eyebrow', l: 'Метка' }, { k: 'heading', l: 'Заголовок' }, { k: 'body', l: 'Текст', ta: 4 }, { k: 'photo', l: 'Фото', img: 1 }, { k: 'side', l: 'Фото слева/справа', sel: ['left', 'right'] }, { k: 'round', l: 'Круглое фото', bool: 1 }] },
  { type: 'cta', label: 'Призыв (баннер)', fields: [{ k: 'eyebrow', l: 'Метка' }, { k: 'title', l: 'Заголовок' }, { k: 'text', l: 'Текст', ta: 2 }, { k: 'btnText', l: 'Кнопка — текст' }, { k: 'btnUrl', l: 'Кнопка — ссылка' }] },
  { type: 'cards', label: 'Карточки', fields: [{ k: 'eyebrow', l: 'Метка' }, { k: 'heading', l: 'Заголовок' }, { k: 'items', l: 'Карточки', rep: [{ k: 'ico', l: 'Значок (эмодзи)' }, { k: 'title', l: 'Заголовок' }, { k: 'text', l: 'Текст', ta: 2 }, { k: 'url', l: 'Ссылка' }] }] },
  { type: 'prices', label: 'Тарифы / цена', fields: [{ k: 'eyebrow', l: 'Метка' }, { k: 'heading', l: 'Заголовок' }, { k: 'items', l: 'Тарифы', rep: [{ k: 'name', l: 'Название' }, { k: 'tag', l: 'Подпись' }, { k: 'features', l: 'Пункты', lines: 1 }, { k: 'amount', l: 'Цена' }, { k: 'btnText', l: 'Кнопка' }, { k: 'btnUrl', l: 'Ссылка' }, { k: 'featured', l: 'Выделить', bool: 1 }, { k: 'badge', l: 'Бейдж' }] }] },
  { type: 'faq', label: 'FAQ', fields: [{ k: 'eyebrow', l: 'Метка' }, { k: 'heading', l: 'Заголовок' }, { k: 'items', l: 'Вопросы', rep: [{ k: 'q', l: 'Вопрос' }, { k: 'a', l: 'Ответ', ta: 2 }] }] },
  { type: 'reviews', label: 'Отзывы', fields: [{ k: 'eyebrow', l: 'Метка' }, { k: 'heading', l: 'Заголовок' }, { k: 'items', l: 'Отзывы', rep: [{ k: 'body', l: 'Текст', ta: 3 }, { k: 'author', l: 'Подпись' }] }] },
  { type: 'steps', label: 'Шаги / программа', fields: [{ k: 'eyebrow', l: 'Метка' }, { k: 'heading', l: 'Заголовок' }, { k: 'items', l: 'Шаги', rep: [{ k: 'title', l: 'Заголовок шага' }, { k: 'text', l: 'Описание', ta: 2 }] }] },
  { type: 'forwhom', label: 'Кому подойдёт / нет', fields: [{ k: 'yesTitle', l: 'Заголовок «да»' }, { k: 'yes', l: 'Пункты «да»', lines: 1 }, { k: 'noTitle', l: 'Заголовок «нет»' }, { k: 'no', l: 'Пункты «нет»', lines: 1 }] },
  { type: 'video', label: 'Видео', fields: [{ k: 'caption', l: 'Подпись (необязательно)' }, { k: 'url', l: 'Ссылка YouTube/embed' }] },
];
const BLOCK_LABEL = {}; BLOCK_TYPES.forEach((t) => { BLOCK_LABEL[t.type] = t.label; });

const TABS = [
  ['main', 'Главная'], ['about', 'Обо мне'], ['reviews', 'Отзывы'],
  ['posts', 'Блог'], ['pages', 'Страницы'], ['photos', 'Фото'], ['leads', 'Заявки'],
];

// многоабзацный текст → JSX (для превью)
function Paras({ text }) {
  const parts = String(text || '').split(/\n{2,}/);
  return parts.map((p, i) => (
    <p key={i}>{p.split('\n').map((line, j) => (j > 0 ? [<br />, line] : line))}</p>
  ));
}
function Lines({ text }) {
  return String(text || '').split('\n').map((line, j) => (j > 0 ? [<br />, line] : line));
}
function slugify(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9а-яё]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'post'; }

export default function Admin() {
  const [view, setView] = useState('login');
  const [u, setU] = useState('valentina');
  const [p, setP] = useState('');
  const [lgErr, setLgErr] = useState('');
  const [lgBusy, setLgBusy] = useState(false);
  const [tab, setTab] = useState('main');
  const [toast, setToast] = useState(null);
  const toastT = useRef(0);

  const [settings, setSettings] = useState({});
  const [reviews, setReviews] = useState(null);
  const [about, setAbout] = useState(null);
  const [posts, setPosts] = useState(null);
  const [leads, setLeads] = useState(null);
  const [pages, setPages] = useState(null);
  const [editing, setEditing] = useState(null);

  function flash(msg, kind) {
    setToast({ msg, kind });
    clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setToast(null), 2600);
  }
  const creds = () => ({ u: sessionStorage.va_u || '', p: sessionStorage.va_p || '' });
  function call(fn, args) { const c = creds(); return rpc(fn, { ...(args || {}), p_user: c.u, p_pass: c.p }); }
  function authFail() { flash('Сессия истекла, войди заново', 'bad'); logout(); }

  function loadAll() {
    sel('valya_settings?select=key,value').then((rows) => {
      const m = {}; (rows || []).forEach((r) => { m[r.key] = r.value; }); setSettings(m);
    }).catch(() => {});
    call('valya_reviews_all').then(setReviews).catch(authFail);
    call('valya_about_all').then(setAbout).catch(authFail);
    call('valya_posts_all').then(setPosts).catch(authFail);
    call('valya_leads_all').then(setLeads).catch(() => setLeads([]));
    call('valya_pages_all').then(setPages).catch(() => setPages([]));
  }
  function loadPages() { call('valya_pages_all').then(setPages).catch(() => setPages([])); }

  useEffect(() => {
    const c = creds();
    if (c.u && c.p) {
      rpc('valya_login', { p_user: c.u, p_pass: c.p }).then((ok) => {
        if (ok === true) { setView('app'); loadAll(); } else { sessionStorage.removeItem('va_u'); sessionStorage.removeItem('va_p'); }
      }).catch(() => {});
    }
  }, []);

  function doLogin(e) {
    e.preventDefault();
    setLgErr(''); setLgBusy(true);
    rpc('valya_login', { p_user: u.trim(), p_pass: p }).then((ok) => {
      setLgBusy(false);
      if (ok === true) { sessionStorage.va_u = u.trim(); sessionStorage.va_p = p; setView('app'); loadAll(); }
      else setLgErr('Неверный логин или пароль');
    }).catch(() => { setLgBusy(false); setLgErr('Ошибка связи. Попробуй ещё раз.'); });
  }
  function logout() { sessionStorage.removeItem('va_u'); sessionStorage.removeItem('va_p'); setView('login'); setP(''); }

  // ---- settings (главная + блог + фото) ----
  const setKey = (k, v) => setSettings((s) => ({ ...s, [k]: v }));
  function saveKeys(keys, okMsg) {
    Promise.all(keys.map((k) => call('valya_setting_set', { p_key: k, p_value: settings[k] || '' })))
      .then(() => flash(okMsg || 'Сохранено — обнови сайт', 'ok')).catch(() => flash('Не удалось сохранить', 'bad'));
  }

  // ---- фото / картинки ----
  function fileToDataUrl(file, maxPx, cb) {
    if (!file) return;
    if (!/^image\//.test(file.type || '')) { flash('Нужна картинка (jpg/png)', 'bad'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = maxPx; let w = img.width, h = img.height;
        if (w > max || h > max) { if (w >= h) { h = Math.round(h * max / w); w = max; } else { w = Math.round(w * max / h); h = max; } }
        const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        cv.getContext('2d').drawImage(img, 0, 0, w, h);
        let url = cv.toDataURL('image/jpeg', 0.82);
        if (url.length > 1500000) url = cv.toDataURL('image/jpeg', 0.68);
        cb(url);
      };
      img.onerror = () => flash('Не удалось прочитать фото', 'bad');
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }
  function handleFile(file, key) {
    fileToDataUrl(file, 1280, (url) => {
      flash('Сохраняю фото…', '');
      call('valya_setting_set', { p_key: key, p_value: url })
        .then(() => { setKey(key, url); flash('Фото обновлено — обнови сайт', 'ok'); })
        .catch(() => flash('Не удалось сохранить', 'bad'));
    });
  }
  function uploadCover(file, idx) {
    fileToDataUrl(file, 1000, (url) => { patch(setPosts, idx, 'cover_url', url); flash('Обложка загружена — нажми «Сохранить»', 'ok'); });
  }

  // ---- списки: review / about / post ----
  function blankReview() { return { _new: true, body: '', author: 'участница первого потока', sort: (reviews ? reviews.length + 1 : 1), published: true }; }
  function blankAbout() { return { _new: true, heading: '', body: '', sort: (about ? about.length + 1 : 1), published: true }; }
  function blankPost() { return { _new: true, title: '', excerpt: '', body: '', cover_url: '', slug: '', published: false }; }

  const patch = (setList, idx, field, val) => setList((list) => list.map((it, i) => (i === idx ? { ...it, [field]: val } : it)));
  const drop = (setList, idx) => setList((list) => list.filter((_, i) => i !== idx));
  function reorder(list, setList, rpcSave, idx, dir) {
    const j = idx + dir;
    if (j < 0 || j >= list.length) return;
    const arr = list.slice();
    const tmp = arr[idx]; arr[idx] = arr[j]; arr[j] = tmp;
    const next = arr.map((it, i) => ({ ...it, sort: i + 1 }));
    setList(next);
    Promise.all(next.filter((it) => it.id).map((it) => rpcSave(it).catch(() => {}))).then(() => flash('Порядок изменён — обнови сайт', 'ok'));
  }
  const rpcSaveReview = (it) => call('valya_review_save', { p_id: it.id, p_body: it.body, p_author: it.author, p_sort: it.sort | 0, p_published: !!it.published });
  const rpcSaveAbout = (it) => call('valya_about_save', { p_id: it.id, p_heading: it.heading, p_body: it.body, p_sort: it.sort | 0, p_published: !!it.published });

  function saveReview(it, idx) {
    if (!it.body || !it.body.trim()) { flash('Текст отзыва пустой', 'bad'); return; }
    call('valya_review_save', { p_id: it.id || null, p_body: it.body, p_author: it.author, p_sort: it.sort | 0, p_published: !!it.published })
      .then((id) => { patch(setReviews, idx, 'id', id || it.id); patch(setReviews, idx, '_new', false); flash('Отзыв сохранён', 'ok'); })
      .catch(() => flash('Не удалось сохранить', 'bad'));
  }
  function delReview(it, idx) { if (!confirm('Удалить этот отзыв?')) return; if (!it.id) { drop(setReviews, idx); return; } call('valya_review_delete', { p_id: it.id }).then(() => drop(setReviews, idx)).catch(() => flash('Не удалось удалить', 'bad')); }

  function saveAbout(it, idx) {
    if (!it.body || !it.body.trim()) { flash('Текст пустой', 'bad'); return; }
    call('valya_about_save', { p_id: it.id || null, p_heading: it.heading, p_body: it.body, p_sort: it.sort | 0, p_published: !!it.published })
      .then((id) => { patch(setAbout, idx, 'id', id || it.id); patch(setAbout, idx, '_new', false); flash('Сохранено', 'ok'); })
      .catch(() => flash('Не удалось сохранить', 'bad'));
  }
  function delAbout(it, idx) { if (!confirm('Удалить этот блок?')) return; if (!it.id) { drop(setAbout, idx); return; } call('valya_about_delete', { p_id: it.id }).then(() => drop(setAbout, idx)).catch(() => flash('Не удалось удалить', 'bad')); }

  function savePost(it, idx) {
    if (!it.title || !it.title.trim()) { flash('Нужен заголовок', 'bad'); return; }
    const slug = (it.slug && it.slug.trim()) ? it.slug.trim() : (slugify(it.title) + '-' + Math.random().toString(36).slice(2, 6));
    call('valya_post_save', { p_id: it.id || null, p_slug: slug, p_title: it.title, p_cover: it.cover_url, p_excerpt: it.excerpt, p_body: it.body, p_published: !!it.published })
      .then((id) => { patch(setPosts, idx, 'id', id || it.id); patch(setPosts, idx, 'slug', slug); patch(setPosts, idx, '_new', false); flash('Запись сохранена', 'ok'); })
      .catch(() => flash('Не удалось сохранить (возможно, адрес занят)', 'bad'));
  }
  function delPost(it, idx) { if (!confirm('Удалить эту запись?')) return; if (!it.id) { drop(setPosts, idx); return; } call('valya_post_delete', { p_id: it.id }).then(() => drop(setPosts, idx)).catch(() => flash('Не удалось удалить', 'bad')); }

  function delLead(it, idx) { if (!confirm('Удалить эту заявку?')) return; call('valya_lead_delete', { p_id: it.id }).then(() => drop(setLeads, idx)).catch(() => flash('Не удалось удалить', 'bad')); }

  // ---- страницы-конструктор ----
  function newPage() { setEditing({ slug: '', title: '', published: false, blocks: [] }); }
  function openPage(pg) { setEditing({ id: pg.id, slug: pg.slug, title: pg.title || '', published: !!pg.published, blocks: Array.isArray(pg.blocks) ? pg.blocks : [] }); }
  function savePage() {
    const e = editing; if (!e) return;
    if (!e.slug || !e.slug.trim()) { flash('Укажи адрес страницы', 'bad'); return; }
    call('valya_page_save', { p_id: e.id || null, p_slug: e.slug, p_title: e.title, p_blocks: e.blocks, p_published: !!e.published })
      .then((id) => { flash('Страница сохранена', 'ok'); setEditing({ ...e, id: id || e.id }); loadPages(); })
      .catch(() => flash('Не удалось сохранить (возможно, адрес занят)', 'bad'));
  }
  function delPage(pg) { if (!confirm('Удалить страницу?')) return; call('valya_page_delete', { p_id: pg.id }).then(() => { loadPages(); if (editing && editing.id === pg.id) setEditing(null); flash('Страница удалена', 'ok'); }).catch(() => flash('Не удалось удалить', 'bad')); }
  const setBlocks = (fn) => setEditing((e) => ({ ...e, blocks: fn(e.blocks) }));
  const addBlock = (type) => setBlocks((bl) => [...bl, { type }]);
  const updateBlock = (idx, nb) => setBlocks((bl) => bl.map((b, i) => (i === idx ? nb : b)));
  const removeBlock = (idx) => setBlocks((bl) => bl.filter((_, i) => i !== idx));
  const moveBlock = (idx, dir) => setBlocks((bl) => { const j = idx + dir; if (j < 0 || j >= bl.length) return bl; const a = bl.slice(); const t = a[idx]; a[idx] = a[j]; a[j] = t; return a; });

  // ============== РЕНДЕР ==============
  if (view === 'login') {
    return (
      <form class="ed-login" onSubmit={doLogin}>
        <h1>Вход в админку</h1>
        <p>Отношения длиною в жизнь</p>
        <label>Логин</label>
        <input value={u} onInput={(e) => setU(e.target.value)} autocomplete="username" autocapitalize="off" />
        <label style="margin-top:10px">Пароль</label>
        <input type="password" value={p} onInput={(e) => setP(e.target.value)} autocomplete="current-password" />
        <button class="ed-btn ed-p" style="width:100%;margin-top:14px" disabled={lgBusy}>{lgBusy ? 'Проверяю…' : 'Войти'}</button>
        <div class="ed-err">{lgErr}</div>
      </form>
    );
  }

  return (
    <div class="ed-shell">
      <aside class="ed-side">
        <div class="ed-brand">Контент сайта</div>
        {TABS.map(([id, label]) => (
          <button key={id} class={'ed-nav' + (tab === id ? ' on' : '')} onClick={() => setTab(id)}>{label}</button>
        ))}
        <button class="ed-nav ed-out" onClick={logout}>Выйти</button>
      </aside>

      <main class="ed-main">
        {tab === 'main' && (
          <Section title="Главная страница" hint="Печатай слева — справа сразу видно, как будет на сайте.">
            <div class="ed-split">
              <div class="ed-form">
                {MAIN_FIELDS.map((f) => (
                  <div class="ed-field" key={f.k}>
                    <label>{f.label}</label>
                    {f.input
                      ? <input value={settings[f.k] || ''} onInput={(e) => setKey(f.k, e.target.value)} />
                      : <textarea rows={f.rows} value={settings[f.k] || ''} onInput={(e) => setKey(f.k, e.target.value)} />}
                    {f.hint && <div class="ed-hint">{f.hint}</div>}
                  </div>
                ))}
                <button class="ed-btn ed-p" onClick={() => saveKeys(MAIN_KEYS, 'Тексты главной сохранены — обнови сайт')}>Сохранить тексты главной</button>
              </div>
              <Preview>
                <section class="hero"><div class="container"><div>
                  <span class="eyebrow">Психология отношений</span>
                  <h1><Lines text={settings.idx_hero_title} /></h1>
                  <p class="lead">{settings.idx_hero_lead}</p>
                </div></div></section>
                <section class="section"><div class="container narrow">
                  <span class="eyebrow">Кто я</span><h2>Меня зовут Валентина</h2><hr class="rule" />
                  <Paras text={settings.idx_who_body} />
                </div></section>
                <section class="section bg-cream2"><div class="container center">
                  <span class="eyebrow">Тебе знакомо?</span><h2>Если ты в отношениях, где…</h2><hr class="rule" />
                  <ul class="pain">{(settings.idx_pain || '').split(/\n+/).filter((x) => x.trim()).map((li, i) => <li key={i}>{li}</li>)}</ul>
                </div></section>
                <section class="section"><div class="container narrow center">
                  <span class="eyebrow">Почему мне можно верить</span><hr class="rule" />
                  {(settings.idx_why || '').split(/\n{2,}/).filter((x) => x.trim()).map((p, i) => <p class="lead" key={i}>{p}</p>)}
                </div></section>
                <section class="section bg-blush"><div class="container narrow">
                  <div class="panel no"><h3>Кому НЕ подойдёт</h3>
                  <ul>{(settings.idx_notfit || '').split(/\n+/).filter((x) => x.trim()).map((li, i) => <li key={i}>{li}</li>)}</ul></div>
                </div></section>
                <section class="section bg-cream2"><div class="container center">
                  <div class="bignum">{settings.idx_proof_num}</div>
                  <p class="lead narrow">{settings.idx_proof_cap}</p>
                </div></section>
                <section class="section"><div class="container"><div class="cta-band">
                  <span class="eyebrow">{settings.idx_cta_eyebrow}</span>
                  <h2>{settings.idx_cta_title}</h2><p>{settings.idx_cta_text}</p>
                </div></div></section>
              </Preview>
            </div>
          </Section>
        )}

        {tab === 'about' && (
          <Section title="Обо мне" hint="Каждый блок — необязательный подзаголовок и текст. Пустая строка = новый абзац.">
            <button class="ed-btn ed-g" onClick={() => setAbout((l) => [...(l || []), blankAbout()])}>+ Добавить блок</button>
            {about == null ? <Loading /> : about.length === 0 ? <Empty t="Пока нет блоков." /> : about.map((it, idx) => (
              <div class={'ed-card' + (it.published ? '' : ' off')} key={it.id || 'n' + idx}>
                <div class="ed-split">
                  <div class="ed-form">
                    <div class="ed-field"><label>Подзаголовок (необязательно)</label><input value={it.heading || ''} onInput={(e) => patch(setAbout, idx, 'heading', e.target.value)} /></div>
                    <div class="ed-field"><label>Текст</label><textarea rows="6" value={it.body || ''} onInput={(e) => patch(setAbout, idx, 'body', e.target.value)} /></div>
                    <div class="ed-field ed-narrow"><label>Порядок</label><input type="number" value={it.sort == null ? 0 : it.sort} onInput={(e) => patch(setAbout, idx, 'sort', parseInt(e.target.value, 10) || 0)} /></div>
                    <CardFoot it={it} onPub={(v) => patch(setAbout, idx, 'published', v)} onDel={() => delAbout(it, idx)} onSave={() => saveAbout(it, idx)} onUp={idx > 0 ? () => reorder(about, setAbout, rpcSaveAbout, idx, -1) : null} onDown={idx < about.length - 1 ? () => reorder(about, setAbout, rpcSaveAbout, idx, 1) : null} />
                  </div>
                  <Preview small><div class="story">{it.heading && <h2>{it.heading}</h2>}<hr class="rule" /><Paras text={it.body} /></div></Preview>
                </div>
              </div>
            ))}
          </Section>
        )}

        {tab === 'reviews' && (
          <Section title="Отзывы" hint="С галочкой «Показывать» — появляются на главной. Порядок: меньше = выше.">
            <button class="ed-btn ed-g" onClick={() => setReviews((l) => [blankReview(), ...(l || [])])}>+ Добавить отзыв</button>
            {reviews == null ? <Loading /> : reviews.length === 0 ? <Empty t="Пока нет отзывов." /> : reviews.map((it, idx) => (
              <div class={'ed-card' + (it.published ? '' : ' off')} key={it.id || 'n' + idx}>
                <div class="ed-split">
                  <div class="ed-form">
                    <div class="ed-field"><label>Текст отзыва</label><textarea rows="4" value={it.body || ''} onInput={(e) => patch(setReviews, idx, 'body', e.target.value)} /></div>
                    <div class="ed-row">
                      <div class="ed-field"><label>Подпись</label><input value={it.author || ''} onInput={(e) => patch(setReviews, idx, 'author', e.target.value)} /></div>
                      <div class="ed-field ed-narrow"><label>Порядок</label><input type="number" value={it.sort == null ? 0 : it.sort} onInput={(e) => patch(setReviews, idx, 'sort', parseInt(e.target.value, 10) || 0)} /></div>
                    </div>
                    <CardFoot it={it} pubLabel="Показывать на сайте" onPub={(v) => patch(setReviews, idx, 'published', v)} onDel={() => delReview(it, idx)} onSave={() => saveReview(it, idx)} onUp={idx > 0 ? () => reorder(reviews, setReviews, rpcSaveReview, idx, -1) : null} onDown={idx < reviews.length - 1 ? () => reorder(reviews, setReviews, rpcSaveReview, idx, 1) : null} />
                  </div>
                  <Preview small><div class="quote"><p>«{it.body}»</p><div class="who">— {it.author || 'участница первого потока'}</div></div></Preview>
                </div>
              </div>
            ))}
          </Section>
        )}

        {tab === 'posts' && (
          <Section title="Блог" hint="Шапка раздела + записи. С галочкой «Опубликовать» — видны на сайте.">
            <div class="ed-card">
              <div class="ed-split">
                <div class="ed-form">
                  <div class="ed-field"><label>Шапка блога — заголовок</label><input value={settings.blog_title || ''} onInput={(e) => setKey('blog_title', e.target.value)} /></div>
                  <div class="ed-field"><label>Шапка блога — подзаголовок</label><textarea rows="3" value={settings.blog_lead || ''} onInput={(e) => setKey('blog_lead', e.target.value)} /></div>
                  <button class="ed-btn ed-p" onClick={() => saveKeys(['blog_title', 'blog_lead'], 'Шапка блога сохранена')}>Сохранить шапку</button>
                </div>
                <Preview small><section class="hero"><div class="container center"><span class="eyebrow">Блог</span><h1>{settings.blog_title}</h1><p class="lead">{settings.blog_lead}</p></div></section></Preview>
              </div>
            </div>
            <button class="ed-btn ed-g" onClick={() => setPosts((l) => [blankPost(), ...(l || [])])}>+ Добавить запись</button>
            {posts == null ? <Loading /> : posts.length === 0 ? <Empty t="Пока нет записей." /> : posts.map((it, idx) => (
              <div class={'ed-card' + (it.published ? '' : ' off')} key={it.id || 'n' + idx}>
                <div class="ed-split">
                  <div class="ed-form">
                    <div class="ed-field"><label>Заголовок</label><input value={it.title || ''} onInput={(e) => patch(setPosts, idx, 'title', e.target.value)} /></div>
                    <div class="ed-field"><label>Краткое описание (необязательно)</label><textarea rows="2" value={it.excerpt || ''} onInput={(e) => patch(setPosts, idx, 'excerpt', e.target.value)} /></div>
                    <div class="ed-field"><label>Текст записи</label><textarea rows="6" value={it.body || ''} onInput={(e) => patch(setPosts, idx, 'body', e.target.value)} /></div>
                    <div class="ed-field"><label>Обложка (необязательно)</label>
                      {it.cover_url && <img src={it.cover_url} alt="" style="display:block;width:100%;max-height:120px;object-fit:cover;border-radius:10px;border:1px solid var(--line);margin-bottom:8px" />}
                      <div style="display:flex;gap:8px;align-items:stretch">
                        <input style="flex:1;min-width:0" placeholder="ссылка https://… или загрузи →" value={it.cover_url || ''} onInput={(e) => patch(setPosts, idx, 'cover_url', e.target.value)} />
                        <button type="button" class="ed-btn ed-g ed-sm" style="margin:0;white-space:nowrap" onClick={(e) => e.currentTarget.parentNode.querySelector('input[type=file]').click()}>📷 Файл</button>
                        <input type="file" accept="image/*" style="display:none" onChange={(e) => { uploadCover(e.target.files && e.target.files[0], idx); e.target.value = ''; }} />
                      </div>
                    </div>
                    <div class="ed-field"><label>Адрес статьи (для ссылки)</label>
                      <div style="display:flex;gap:8px;align-items:stretch">
                        <input style="flex:1;min-width:0" placeholder="заполнится из заголовка при сохранении" value={it.slug || ''} onInput={(e) => patch(setPosts, idx, 'slug', e.target.value)} />
                        {it.slug && <a class="ed-btn ed-g ed-sm" style="margin:0;text-decoration:none;display:inline-flex;align-items:center" href={'/post.html?s=' + encodeURIComponent(it.slug)} target="_blank" rel="noopener">↗</a>}
                      </div>
                    </div>
                    <CardFoot it={it} pubLabel="Опубликовать" onPub={(v) => patch(setPosts, idx, 'published', v)} onDel={() => delPost(it, idx)} onSave={() => savePost(it, idx)} />
                  </div>
                  <Preview small><article class="bcard">{it.cover_url && <div class="bcard-img"><img src={it.cover_url} alt="" /></div>}<div class="bcard-body"><h2>{it.title}</h2>{it.excerpt && <p class="bcard-lead">{it.excerpt}</p>}<div class="bcard-text"><Paras text={it.body} /></div></div></article></Preview>
                </div>
              </div>
            ))}
          </Section>
        )}

        {tab === 'photos' && (
          <Section title="Фото" hint="Перетащи картинку на рамку или нажми «Заменить». Сожмётся и сразу встанет на сайт.">
            <div class="ed-photos">
              <PhotoCard title="Главное фото" note="главная + курс" round={false} src={settings.photo_hero || '/assets/photo-hero.jpg'} onFile={(f) => handleFile(f, 'photo_hero')} />
              <PhotoCard title="Фото «Обо мне»" note="страница «Обо мне»" round={false} src={settings.photo_about || '/assets/photo-about.jpg'} onFile={(f) => handleFile(f, 'photo_about')} />
              <PhotoCard title="Круглое «Кто я»" note="главная + курс" round={true} src={settings.photo_round || '/assets/photo-round2.jpg'} onFile={(f) => handleFile(f, 'photo_round')} />
            </div>
          </Section>
        )}

        {tab === 'leads' && (
          <Section title="Заявки" hint="Контакты с формы теста. Отвечай в Telegram/на почту. Спам можно удалить.">
            {leads == null ? <Loading /> : leads.length === 0 ? <Empty t="Пока нет заявок." /> : leads.map((it, idx) => (
              <div class="ed-card ed-lead" key={it.id}>
                <div>
                  <b>{it.name || '(без имени)'}</b> · <span class="ed-contact">{it.contact}</span>
                  <div class="ed-lead-meta">Тип: {it.test_result || '—'} · источник: {it.source || '—'} · {it.created_at ? new Date(it.created_at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}</div>
                </div>
                <button class="ed-btn ed-d ed-sm" onClick={() => delLead(it, idx)}>Удалить</button>
              </div>
            ))}
          </Section>
        )}

        {tab === 'pages' && (
          <Section title="Страницы (конструктор)" hint="Собери лендинг из блоков. Адрес даёт ссылку /p.html?s=<адрес> — её можно слать в рекламу и сторис, страница появляется сразу.">
            {!editing ? (
              <div>
                <button class="ed-btn ed-g" onClick={newPage}>+ Новая страница</button>
                {pages == null ? <Loading /> : pages.length === 0 ? <Empty t="Пока нет страниц. Нажми «Новая страница»." /> : pages.map((pg) => (
                  <div class={'ed-card ed-lead' + (pg.published ? '' : ' off')} key={pg.id}>
                    <div>
                      <b>{pg.title || pg.slug}</b> {pg.published ? '' : <span style="color:var(--muted);font-size:12px">(черновик)</span>}
                      <div class="ed-lead-meta">/p.html?s={pg.slug} · блоков: {Array.isArray(pg.blocks) ? pg.blocks.length : 0}</div>
                    </div>
                    <span style="display:flex;gap:6px;flex-wrap:wrap">
                      <button class="ed-btn ed-g ed-sm" onClick={() => openPage(pg)}>Открыть</button>
                      <a class="ed-btn ed-g ed-sm" href={'/p.html?s=' + encodeURIComponent(pg.slug)} target="_blank" rel="noopener" style="text-decoration:none">↗</a>
                      <button class="ed-btn ed-g ed-sm" onClick={() => { if (navigator.clipboard) navigator.clipboard.writeText(location.origin + '/p.html?s=' + pg.slug); flash('Ссылка скопирована', 'ok'); }}>Ссылка</button>
                      <button class="ed-btn ed-d ed-sm" onClick={() => delPage(pg)}>Удалить</button>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <button class="ed-btn ed-g" onClick={() => { setEditing(null); loadPages(); }}>← К списку</button>
                <div class="ed-split">
                  <div class="ed-form">
                    <div class="ed-row">
                      <div class="ed-field"><label>Адрес (латиницей, напр. potok2)</label><input value={editing.slug} onInput={(e) => setEditing({ ...editing, slug: e.target.value })} /></div>
                      <div class="ed-field"><label>Заголовок вкладки</label><input value={editing.title} onInput={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
                    </div>
                    <label class="ed-chk" style="margin:2px 0 12px"><input type="checkbox" checked={editing.published} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} /> Опубликовать (иначе черновик)</label>
                    {editing.blocks.map((b, idx) => (
                      <div class="ed-card" key={idx}>
                        <div class="ed-foot" style="margin:0 0 8px">
                          <b style="font-size:13px">{BLOCK_LABEL[b.type] || b.type}</b>
                          <span class="ed-spacer" />
                          <button type="button" class="ed-btn ed-g ed-sm" style="margin:0;padding:6px 10px" disabled={idx === 0} onClick={() => moveBlock(idx, -1)}>↑</button>
                          <button type="button" class="ed-btn ed-g ed-sm" style="margin:0;padding:6px 10px" disabled={idx === editing.blocks.length - 1} onClick={() => moveBlock(idx, 1)}>↓</button>
                          <button type="button" class="ed-btn ed-d ed-sm" style="margin:0;padding:6px 10px" onClick={() => removeBlock(idx)}>✕</button>
                        </div>
                        <BlockForm block={b} onChange={(nb) => updateBlock(idx, nb)} onImg={(file, cb) => fileToDataUrl(file, 1280, cb)} />
                      </div>
                    ))}
                    <div class="ed-addblock">
                      <span style="font-size:13px;color:var(--muted);margin-right:4px">+ блок:</span>
                      {BLOCK_TYPES.map((t) => <button key={t.type} type="button" class="ed-btn ed-g ed-sm" style="margin:0 6px 6px 0" onClick={() => addBlock(t.type)}>{t.label}</button>)}
                    </div>
                    <button class="ed-btn ed-p" style="margin-top:10px;width:100%" onClick={savePage}>Сохранить страницу</button>
                  </div>
                  <div class="ed-preview"><div class="ed-preview-tag">превью страницы</div><div class="ed-preview-body" dangerouslySetInnerHTML={{ __html: (typeof window !== 'undefined' && window.PageRender ? window.PageRender.blocksToHtml(editing.blocks) : '') }} /></div>
                </div>
              </div>
            )}
          </Section>
        )}
      </main>

      {toast && <div class={'ed-toast ' + (toast.kind || '')}>{toast.msg}</div>}
    </div>
  );
}

function Section({ title, hint, children }) {
  return (<div class="ed-section"><h1 class="ed-h1">{title}</h1>{hint && <p class="ed-subhint">{hint}</p>}{children}</div>);
}
function Preview({ children, small }) {
  return (<div class={'ed-preview' + (small ? ' sm' : '')}><div class="ed-preview-tag">превью</div><div class="ed-preview-body">{children}</div></div>);
}
function CardFoot({ it, pubLabel, onPub, onDel, onSave, onUp, onDown }) {
  return (
    <div class="ed-foot">
      <label class="ed-chk"><input type="checkbox" checked={!!it.published} onChange={(e) => onPub(e.target.checked)} /> {pubLabel || 'Показывать на сайте'}</label>
      {(onUp !== undefined || onDown !== undefined) && (
        <span style="display:flex;gap:4px;margin-left:6px">
          <button type="button" class="ed-btn ed-g ed-sm" style="margin:0;padding:6px 11px" disabled={!onUp} onClick={onUp || undefined} title="Выше">↑</button>
          <button type="button" class="ed-btn ed-g ed-sm" style="margin:0;padding:6px 11px" disabled={!onDown} onClick={onDown || undefined} title="Ниже">↓</button>
        </span>
      )}
      <span class="ed-spacer" />
      <button class="ed-btn ed-d ed-sm" onClick={onDel}>Удалить</button>
      <button class="ed-btn ed-p ed-sm" onClick={onSave}>Сохранить</button>
    </div>
  );
}
function PhotoCard({ title, note, round, src, onFile }) {
  const [over, setOver] = useState(false);
  const inp = useRef(null);
  return (
    <div class={'ed-photo' + (over ? ' over' : '')}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); onFile(e.dataTransfer.files && e.dataTransfer.files[0]); }}>
      <div class="ed-photo-t">{title}<span>{note}</span></div>
      <img src={src} alt="" class={round ? 'rnd' : ''} />
      <input type="file" accept="image/*" ref={inp} style="display:none" onChange={(e) => { onFile(e.target.files && e.target.files[0]); e.target.value = ''; }} />
      <button class="ed-btn ed-p ed-sm" onClick={() => inp.current.click()}>Заменить</button>
      <div class="ed-photo-hint">или перетащи сюда</div>
    </div>
  );
}
function Loading() { return <div class="ed-empty">Загружаю…</div>; }
function Empty({ t }) { return <div class="ed-empty">{t}</div>; }

function BlockForm({ block, onChange, onImg }) {
  const schema = BLOCK_TYPES.find((t) => t.type === block.type);
  if (!schema) return null;
  const set = (k, v) => onChange({ ...block, [k]: v });
  return (
    <div>
      {schema.fields.map((f) => (
        <div class="ed-field" key={f.k}>
          <label>{f.l}</label>
          {f.ta ? <textarea rows={f.ta} value={block[f.k] || ''} onInput={(e) => set(f.k, e.target.value)} />
            : f.lines ? <textarea rows="4" placeholder="по одному пункту на строку" value={Array.isArray(block[f.k]) ? block[f.k].join('\n') : (block[f.k] || '')} onInput={(e) => set(f.k, e.target.value.split('\n'))} />
              : f.bool ? <label class="ed-chk"><input type="checkbox" checked={!!block[f.k]} onChange={(e) => set(f.k, e.target.checked)} /> да</label>
                : f.sel ? <select value={block[f.k] || f.sel[0]} onChange={(e) => set(f.k, e.target.value)}>{f.sel.map((o) => <option value={o} key={o}>{o}</option>)}</select>
                  : f.img ? <ImgField val={block[f.k]} onPick={(file) => onImg(file, (url) => set(f.k, url))} onClear={() => set(f.k, '')} />
                    : f.rep ? <RepeaterField items={Array.isArray(block[f.k]) ? block[f.k] : []} sub={f.rep} onChange={(items) => set(f.k, items)} />
                      : <input value={block[f.k] || ''} onInput={(e) => set(f.k, e.target.value)} />}
        </div>
      ))}
    </div>
  );
}
function ImgField({ val, onPick, onClear }) {
  return (
    <div>
      {val && <img src={val} alt="" style="display:block;max-height:90px;border-radius:8px;border:1px solid var(--line);margin-bottom:6px" />}
      <div style="display:flex;gap:6px">
        <button type="button" class="ed-btn ed-g ed-sm" style="margin:0" onClick={(e) => e.currentTarget.parentNode.querySelector('input').click()}>📷 Загрузить</button>
        {val && <button type="button" class="ed-btn ed-d ed-sm" style="margin:0" onClick={onClear}>Убрать</button>}
        <input type="file" accept="image/*" style="display:none" onChange={(e) => { onPick(e.target.files && e.target.files[0]); e.target.value = ''; }} />
      </div>
    </div>
  );
}
function RepeaterField({ items, sub, onChange }) {
  const upd = (i, nb) => onChange(items.map((x, k) => (k === i ? nb : x)));
  const swap = (i, j) => { if (j < 0 || j >= items.length) return; const a = items.slice(); const t = a[i]; a[i] = a[j]; a[j] = t; onChange(a); };
  return (
    <div class="ed-rep">
      {items.map((it, i) => (
        <div class="ed-rep-item" key={i}>
          <div class="ed-foot" style="margin:0 0 6px"><span style="font-size:12px;color:var(--muted)">#{i + 1}</span><span class="ed-spacer" /><button type="button" class="ed-btn ed-g ed-sm" style="margin:0;padding:5px 9px" disabled={i === 0} onClick={() => swap(i, i - 1)}>↑</button><button type="button" class="ed-btn ed-g ed-sm" style="margin:0;padding:5px 9px" disabled={i === items.length - 1} onClick={() => swap(i, i + 1)}>↓</button><button type="button" class="ed-btn ed-d ed-sm" style="margin:0;padding:5px 9px" onClick={() => onChange(items.filter((_, k) => k !== i))}>✕</button></div>
          {sub.map((f) => (
            <div class="ed-field" key={f.k}>
              <label>{f.l}</label>
              {f.ta ? <textarea rows={f.ta} value={it[f.k] || ''} onInput={(e) => upd(i, { ...it, [f.k]: e.target.value })} />
                : f.lines ? <textarea rows="3" placeholder="по одному на строку" value={Array.isArray(it[f.k]) ? it[f.k].join('\n') : (it[f.k] || '')} onInput={(e) => upd(i, { ...it, [f.k]: e.target.value.split('\n') })} />
                  : f.bool ? <label class="ed-chk"><input type="checkbox" checked={!!it[f.k]} onChange={(e) => upd(i, { ...it, [f.k]: e.target.checked })} /> да</label>
                    : <input value={it[f.k] || ''} onInput={(e) => upd(i, { ...it, [f.k]: e.target.value })} />}
            </div>
          ))}
        </div>
      ))}
      <button type="button" class="ed-btn ed-g ed-sm" style="margin:0" onClick={() => onChange([...items, {}])}>+ добавить</button>
    </div>
  );
}
