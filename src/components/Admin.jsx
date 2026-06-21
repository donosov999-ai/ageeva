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
  { k: 'idx_proof_num', label: 'Соцпруф — число', input: true },
  { k: 'idx_proof_cap', label: 'Соцпруф — подпись', rows: 2 },
  { k: 'idx_cta_eyebrow', label: 'Финал — метка (статус набора)', input: true },
  { k: 'idx_cta_title', label: 'Финал — заголовок', input: true },
  { k: 'idx_cta_text', label: 'Финал — текст', rows: 2 },
];
const MAIN_KEYS = MAIN_FIELDS.map((f) => f.k);
const TABS = [
  ['main', 'Главная'], ['about', 'Обо мне'], ['reviews', 'Отзывы'],
  ['posts', 'Блог'], ['photos', 'Фото'], ['leads', 'Заявки'],
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
  }

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
  function blankPost() { return { _new: true, title: '', excerpt: '', body: '', cover_url: '', published: false }; }

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
    call('valya_post_save', { p_id: it.id || null, p_slug: null, p_title: it.title, p_cover: it.cover_url, p_excerpt: it.excerpt, p_body: it.body, p_published: !!it.published })
      .then((id) => { patch(setPosts, idx, 'id', id || it.id); patch(setPosts, idx, '_new', false); flash('Запись сохранена', 'ok'); })
      .catch(() => flash('Не удалось сохранить', 'bad'));
  }
  function delPost(it, idx) { if (!confirm('Удалить эту запись?')) return; if (!it.id) { drop(setPosts, idx); return; } call('valya_post_delete', { p_id: it.id }).then(() => drop(setPosts, idx)).catch(() => flash('Не удалось удалить', 'bad')); }

  function delLead(it, idx) { if (!confirm('Удалить эту заявку?')) return; call('valya_lead_delete', { p_id: it.id }).then(() => drop(setLeads, idx)).catch(() => flash('Не удалось удалить', 'bad')); }

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
