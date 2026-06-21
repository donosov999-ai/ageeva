/* Рендерер страниц-конструктора Вали.
   Страница /p/?s=<slug> тянет контент из valya_pages на лету и рисует блоки в стилях сайта.
   window.PageRender.blocksToHtml(blocks) переиспользуется в живом превью админки. */
(function () {
  var SB_URL = 'https://iuvvheeocobhiothfgei.supabase.co';
  var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1dnZoZWVvY29iaGlvdGhmZ2VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MTQ1ODcsImV4cCI6MjA5MjA5MDU4N30.IJ5i3UkC0GoIWGFnLKmc1UeX2iqn8LzNYfvEfj-3hIY';

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function escAttr(s) { return esc(s).replace(/"/g, '&quot;'); }
  function paras(t) { return String(t || '').split(/\n{2,}/).map(function (p) { return '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>'; }).join(''); }
  function leadParas(t) { return String(t || '').split(/\n{2,}/).map(function (p) { return '<p class="lead">' + esc(p).replace(/\n/g, '<br>') + '</p>'; }).join(''); }
  function lines(v) { if (Array.isArray(v)) return v; return String(v || '').split(/\n+/); }
  function liList(v) { return lines(v).filter(function (x) { return String(x).trim(); }).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join(''); }
  function btn(text, url, kind) { if (!text) return ''; return '<a class="btn ' + (kind || 'btn-primary') + ' btn-lg" href="' + escAttr(url || '#') + '"' + (/^https?:/.test(url || '') ? ' target="_blank" rel="noopener"' : '') + '>' + esc(text) + '</a>'; }
  function eyebrow(t) { return t ? '<span class="eyebrow">' + esc(t) + '</span>' : ''; }

  function videoEmbed(url) {
    url = String(url || '').trim();
    var yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
    if (yt) return 'https://www.youtube.com/embed/' + yt[1];
    return url;
  }

  var R = {
    hero: function (b) {
      var hasPhoto = b.photo && String(b.photo).trim();
      return '<section class="hero"><div class="container"' + (hasPhoto ? '' : ' style="grid-template-columns:1fr;max-width:760px;text-align:center"') + '>' +
        '<div>' + eyebrow(b.eyebrow) + '<h1>' + esc(b.title || '').replace(/\n/g, '<br>') + '</h1>' +
        (b.subtitle ? '<p class="lead"' + (hasPhoto ? '' : ' style="margin-left:auto;margin-right:auto"') + '>' + esc(b.subtitle) + '</p>' : '') +
        (b.btnText ? '<div class="btn-row"' + (hasPhoto ? '' : ' style="justify-content:center"') + '>' + btn(b.btnText, b.btnUrl) + '</div>' : '') + '</div>' +
        (hasPhoto ? '<div class="photo photo--portrait"><img src="' + escAttr(b.photo) + '" alt=""></div>' : '') +
        '</div></section>';
    },
    text: function (b) {
      return '<section class="section"><div class="container narrow center">' + eyebrow(b.eyebrow) +
        (b.heading ? '<h2>' + esc(b.heading) + '</h2>' : '') + '<hr class="rule center">' + leadParas(b.body) + '</div></section>';
    },
    list: function (b) {
      return '<section class="section bg-cream2"><div class="container center">' + eyebrow(b.eyebrow) +
        (b.heading ? '<h2>' + esc(b.heading) + '</h2>' : '') + '<hr class="rule center"><ul class="pain">' + liList(b.items) + '</ul></div></section>';
    },
    textphoto: function (b) {
      var ph = '<div class="photo ' + (b.round ? 'photo--round' : 'photo--portrait') + '">' + (b.photo ? '<img src="' + escAttr(b.photo) + '" alt="">' : '') + '</div>';
      var txt = '<div>' + eyebrow(b.eyebrow) + (b.heading ? '<h2>' + esc(b.heading) + '</h2>' : '') + '<hr class="rule">' + paras(b.body) + '</div>';
      return '<section class="section"><div class="container grid grid-2" style="align-items:center">' + (b.side === 'right' ? txt + ph : ph + txt) + '</div></section>';
    },
    cards: function (b) {
      var items = (b.items || []).map(function (c) {
        return '<a class="card"' + (c.url ? ' href="' + escAttr(c.url) + '"' : '') + '>' + (c.ico ? '<span class="ico">' + esc(c.ico) + '</span>' : '') +
          '<h3>' + esc(c.title) + '</h3><p>' + esc(c.text) + '</p>' + (c.url ? '<span class="more">Подробнее →</span>' : '') + '</a>';
      }).join('');
      var cols = (b.items || []).length >= 3 ? 'grid-3' : 'grid-2';
      return '<section class="section bg-blush"><div class="container">' + (b.heading ? '<div class="center">' + eyebrow(b.eyebrow) + '<h2>' + esc(b.heading) + '</h2><hr class="rule center"></div>' : '') +
        '<div class="grid ' + cols + '" style="margin-top:30px">' + items + '</div></div></section>';
    },
    cta: function (b) {
      return '<section class="section"><div class="container"><div class="cta-band">' + eyebrow(b.eyebrow) +
        '<h2>' + esc(b.title) + '</h2>' + (b.text ? '<p>' + esc(b.text) + '</p>' : '') +
        (b.btnText ? '<div class="btn-row center">' + btn(b.btnText, b.btnUrl) + '</div>' : '') + '</div></div></section>';
    },
    prices: function (b) {
      var items = (b.items || []).map(function (p) {
        return '<div class="price' + (p.featured ? ' price--featured' : '') + '">' + (p.featured && p.badge ? '<span class="price__badge">' + esc(p.badge) + '</span>' : '') +
          '<h3>' + esc(p.name) + '</h3>' + (p.tag ? '<div class="tag">' + esc(p.tag) + '</div>' : '') +
          '<ul>' + liList(p.features) + '</ul><div class="amount">' + esc(p.amount) + '</div>' + btn(p.btnText || 'Выбрать', p.btnUrl, p.featured ? 'btn-primary' : 'btn-ghost') + '</div>';
      }).join('');
      return '<section class="section bg-cream2"><div class="container">' + (b.heading ? '<div class="center">' + eyebrow(b.eyebrow) + '<h2>' + esc(b.heading) + '</h2><hr class="rule center"></div>' : '') +
        '<div class="prices" style="margin-top:36px">' + items + '</div></div></section>';
    },
    faq: function (b) {
      var items = (b.items || []).map(function (q, i) { return '<details' + (i === 0 ? ' open' : '') + '><summary>' + esc(q.q) + '</summary><p>' + esc(q.a).replace(/\n/g, '<br>') + '</p></details>'; }).join('');
      return '<section class="section bg-blush"><div class="container">' + (b.heading ? '<div class="center">' + eyebrow(b.eyebrow) + '<h2>' + esc(b.heading) + '</h2><hr class="rule center"></div>' : '') +
        '<div class="faq" style="margin-top:24px">' + items + '</div></div></section>';
    },
    reviews: function (b) {
      var items = (b.items || []).map(function (r) { return '<div class="quote"><p>«' + esc(r.body) + '»</p><div class="who">— ' + esc(r.author || 'участница') + '</div></div>'; }).join('');
      return '<section class="section bg-cream2"><div class="container center">' + eyebrow(b.eyebrow) + (b.heading ? '<h2>' + esc(b.heading) + '</h2>' : '') +
        '<div class="quotes" style="margin-top:30px;text-align:left">' + items + '</div></div></section>';
    },
    steps: function (b) {
      var items = (b.items || []).map(function (s) { return '<div class="step"><h3>' + esc(s.title) + '</h3>' + (s.text ? '<p>' + esc(s.text) + '</p>' : '') + '</div>'; }).join('');
      return '<section class="section bg-blush"><div class="container">' + (b.heading ? '<div class="center">' + eyebrow(b.eyebrow) + '<h2>' + esc(b.heading) + '</h2><hr class="rule center"></div>' : '') +
        '<div class="steps" style="margin-top:30px">' + items + '</div></div></section>';
    },
    forwhom: function (b) {
      return '<section class="section"><div class="container"><div class="cols2">' +
        '<div class="panel yes"><h3>' + esc(b.yesTitle || 'Тебе сюда, если') + '</h3><ul>' + liList(b.yes) + '</ul></div>' +
        '<div class="panel no"><h3>' + esc(b.noTitle || 'Кому НЕ подойдёт') + '</h3><ul>' + liList(b.no) + '</ul></div>' +
        '</div></div></section>';
    },
    video: function (b) {
      var src = videoEmbed(b.url);
      if (!src) return '';
      return '<section class="section"><div class="container narrow">' + (b.caption ? '<div class="center"><h2>' + esc(b.caption) + '</h2><hr class="rule center"></div>' : '') +
        '<div style="position:relative;padding-bottom:56.25%;height:0;border-radius:16px;overflow:hidden;box-shadow:var(--shadow-sm);margin-top:18px"><iframe src="' + escAttr(src) + '" style="position:absolute;inset:0;width:100%;height:100%;border:0" allowfullscreen loading="lazy"></iframe></div></div></section>';
    }
  };

  function blocksToHtml(blocks) {
    if (!blocks || !blocks.length) return '';
    return blocks.map(function (b) { try { return (R[b && b.type] ? R[b.type](b) : ''); } catch (e) { return ''; } }).join('');
  }

  function placeholder(text) {
    return '<section class="section"><div class="container narrow center" style="padding:90px 24px"><span class="eyebrow">Отношения длиною в жизнь</span><h2>' + esc(text) + '</h2><hr class="rule center"><p class="lead"><a href="/" style="color:var(--rose-ink)">На главную →</a></p></div></section>';
  }

  function mount() {
    var root = document.getElementById('pageRoot');
    if (!root) return;
    var slug = new URLSearchParams(location.search).get('s');
    if (!slug) { root.innerHTML = placeholder('Страница не указана'); return; }
    fetch(SB_URL + '/rest/v1/valya_pages?slug=eq.' + encodeURIComponent(slug) + '&published=eq.true&select=title,blocks', { headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY } })
      .then(function (r) { return r.json(); })
      .then(function (rows) {
        if (!rows || !rows.length) { root.innerHTML = placeholder('Страница не найдена'); return; }
        var pg = rows[0];
        if (pg.title) document.title = pg.title + ' — Отношения длиною в жизнь';
        var html = blocksToHtml(pg.blocks);
        root.innerHTML = html || placeholder('Пустая страница');
      })
      .catch(function () { root.innerHTML = placeholder('Не удалось загрузить страницу'); });
  }

  window.PageRender = { blocksToHtml: blocksToHtml, esc: esc };
  if (document.getElementById('pageRoot')) {
    if (document.readyState !== 'loading') mount(); else document.addEventListener('DOMContentLoaded', mount);
  }
})();
