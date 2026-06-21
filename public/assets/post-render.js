/* Рендерер отдельной статьи блога: /post.html?s=<slug> тянет пост из valya_posts и рисует в стилях сайта. */
(function () {
  var SB_URL = 'https://iuvvheeocobhiothfgei.supabase.co';
  var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1dnZoZWVvY29iaGlvdGhmZ2VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MTQ1ODcsImV4cCI6MjA5MjA5MDU4N30.IJ5i3UkC0GoIWGFnLKmc1UeX2iqn8LzNYfvEfj-3hIY';
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function escAttr(s) { return esc(s).replace(/"/g, '&quot;'); }
  function paras(t) { return String(t || '').split(/\n{2,}/).map(function (p) { return '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>'; }).join(''); }
  function fmtDate(d) { try { return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return ''; } }
  function ph(text) { return '<section class="section"><div class="container narrow center" style="padding:90px 24px"><span class="eyebrow">Блог</span><h2>' + esc(text) + '</h2><hr class="rule center"><p class="lead"><a href="blog.html" style="color:var(--rose-ink)">← Все статьи</a></p></div></section>'; }

  function mount() {
    var root = document.getElementById('postRoot');
    if (!root) return;
    var slug = new URLSearchParams(location.search).get('s');
    if (!slug) { root.innerHTML = ph('Статья не указана'); return; }
    fetch(SB_URL + '/rest/v1/valya_posts?slug=eq.' + encodeURIComponent(slug) + '&published=eq.true&select=title,cover_url,excerpt,body,published_at', { headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY } })
      .then(function (r) { return r.json(); })
      .then(function (rows) {
        if (!rows || !rows.length) { root.innerHTML = ph('Статья не найдена'); return; }
        var p = rows[0];
        if (p.title) document.title = p.title + ' — Отношения длиною в жизнь';
        root.innerHTML =
          '<section class="hero"><div class="container narrow center"><span class="eyebrow">Блог</span><h1>' + esc(p.title) + '</h1></div></section>' +
          '<section class="section"><div class="container narrow">' +
          (p.cover_url ? '<img src="' + escAttr(p.cover_url) + '" alt="" style="display:block;width:100%;border-radius:18px;margin-bottom:28px">' : '') +
          '<div class="story">' + (p.excerpt ? '<p class="lead">' + esc(p.excerpt) + '</p>' : '') + paras(p.body) + '</div>' +
          '<div class="btn-row center" style="margin-top:38px"><a class="btn btn-ghost btn-lg" href="blog.html">← Все статьи</a><a class="btn btn-primary btn-lg" href="free.html">Пройти бесплатный тест →</a></div>' +
          '</div></section>';
      })
      .catch(function () { root.innerHTML = ph('Не удалось загрузить статью'); });
  }
  if (document.readyState !== 'loading') mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
