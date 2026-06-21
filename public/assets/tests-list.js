/* Подмешивает включённые тесты из valya_tests в сетку #dynTests (на /free и /tests/). */
(function () {
  var box = document.getElementById('dynTests');
  if (!box) return;
  var SB_URL = 'https://iuvvheeocobhiothfgei.supabase.co';
  var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1dnZoZWVvY29iaGlvdGhmZ2VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MTQ1ODcsImV4cCI6MjA5MjA5MDU4N30.IJ5i3UkC0GoIWGFnLKmc1UeX2iqn8LzNYfvEfj-3hIY';
  var ICO = { know: '◈', warmth: '❀', bid: '⇄', trust: '✦', commit: '∞', conflict: '⚡', flood: '≈', repair: '✛', influence: '⚖', filter: '◐', gridlock: '▦', distance: '◌', compromise: '⚭', meaning: '✷', passion: '❤', emotions: '♡', home: '⌂', origin: '❁', balance: '☯', intimacy: '❥' };
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  fetch(SB_URL + '/rest/v1/valya_tests?enabled=eq.true&order=sort_order&select=slug,title,subtitle,goal', { headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY } })
    .then(function (r) { return r.json(); })
    .then(function (rows) {
      if (!rows || !rows.length) return;
      box.innerHTML = rows.map(function (t) {
        var ico = ICO[t.goal] || '❖';
        return '<a href="/test.html?s=' + encodeURIComponent(t.slug) + '" class="card" data-goal="gott_' + esc(t.slug) + '">' +
          '<span class="ico">' + ico + '</span><h3>' + esc(t.title) + '</h3>' +
          '<p>' + esc(t.subtitle || '') + '</p><span class="more">Пройти тест →</span></a>';
      }).join('');
    })
    .catch(function () {});
})();
