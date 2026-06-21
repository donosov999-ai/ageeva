/* Рендерер теста-опросника: /test.html?s=<slug> тянет тест из valya_tests (только enabled) и проводит квиз. */
(function () {
  var SB_URL = 'https://iuvvheeocobhiothfgei.supabase.co';
  var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1dnZoZWVvY29iaGlvdGhmZ2VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MTQ1ODcsImV4cCI6MjA5MjA5MDU4N30.IJ5i3UkC0GoIWGFnLKmc1UeX2iqn8LzNYfvEfj-3hIY';
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function ph(t) { return '<section class="section"><div class="container narrow center" style="padding:80px 24px"><span class="eyebrow">Тест</span><h2>' + esc(t) + '</h2><hr class="rule center"><p class="lead"><a href="/tests/" style="color:var(--rose-ink)">← Все тесты</a></p></div></section>'; }

  var test = null, answers = [];

  function render() {
    var root = document.getElementById('testRoot');
    var scale = (test.scale && test.scale.length) ? test.scale : ['Да, точно', 'Скорее да', 'Скорее нет', 'Нет'];
    var qs = test.questions || [];
    answers = qs.map(function () { return -1; });
    var h = '<section class="hero"><div class="container narrow center"><span class="eyebrow">Тест</span><h1>' + esc(test.title) + '</h1>' +
      (test.subtitle ? '<p class="lead">' + esc(test.subtitle) + '</p>' : '') + '</div></section>' +
      '<section class="section"><div class="container narrow">' +
      (test.intro ? '<p class="lead" style="margin-bottom:26px">' + esc(test.intro) + '</p>' : '') + '<form id="quizForm">';
    qs.forEach(function (q, i) {
      h += '<div class="qcard" data-i="' + i + '"><p class="qtext">' + (i + 1) + '. ' + esc(q.q) + '</p><div class="qopts">';
      scale.forEach(function (lab, o) { h += '<button type="button" class="qopt" data-i="' + i + '" data-o="' + o + '">' + esc(lab) + '</button>'; });
      h += '</div></div>';
    });
    h += '<div class="qsubmit"><button type="button" class="btn btn-primary btn-lg" id="quizGo">Показать результат →</button><p class="qhint" id="quizHint"></p></div>';
    h += '</form><div id="quizResult"></div></div></section>';
    root.innerHTML = h;
    root.querySelectorAll('.qopt').forEach(function (b) {
      b.addEventListener('click', function () {
        var i = +b.dataset.i, card = root.querySelector('.qcard[data-i="' + i + '"]');
        answers[i] = +b.dataset.o;
        card.querySelectorAll('.qopt').forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on'); card.classList.remove('miss');
      });
    });
    document.getElementById('quizGo').addEventListener('click', submit);
  }

  function submit() {
    var n = (test.scale && test.scale.length) || 4, qs = test.questions || [];
    for (var i = 0; i < qs.length; i++) {
      if (answers[i] < 0) {
        document.getElementById('quizHint').textContent = 'Остался вопрос ' + (i + 1) + ' — отметь ответ.';
        var c = document.querySelector('.qcard[data-i="' + i + '"]'); c.classList.add('miss');
        c.scrollIntoView({ behavior: 'smooth', block: 'center' }); return;
      }
    }
    var score = 0;
    qs.forEach(function (q, k) { var o = answers[k]; score += q.reverse ? o : (n - 1 - o); });
    var max = qs.length * (n - 1), bands = test.bands || [], band = bands[bands.length - 1];
    for (var b = 0; b < bands.length; b++) { if (score <= bands[b].max) { band = bands[b]; break; } }
    var pct = max ? Math.round(score / max * 100) : 0;
    var res = document.getElementById('quizResult');
    res.innerHTML = '<div class="qresult"><span class="eyebrow">Результат</span><h2>' + esc(band ? band.title : '') + '</h2>' +
      '<div class="qbar"><span style="width:' + pct + '%"></span></div><p class="qscore">' + score + ' из ' + max + '</p>' +
      '<p>' + esc(band ? band.text : '') + '</p>' +
      (test.help ? test.help : '') +
      '<div class="qcta"><p class="lead">Это один из «этажей» крепких отношений по Готтману. На курсе «Отношения длиною в жизнь» собираем всю картину — шаг за шагом.</p>' +
      '<div class="btn-row center"><a class="btn btn-primary btn-lg" href="/course.html">О курсе →</a><a class="btn btn-ghost btn-lg" href="/tests/">Другие тесты</a></div></div>' +
      '<button type="button" class="qretry" id="quizRetry">Пройти заново</button></div>';
    document.getElementById('quizHint').textContent = '';
    res.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('quizRetry').addEventListener('click', function () { render(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
    if (window.ym) { try { ym(109819083, 'reachGoal', 'test_done'); } catch (e) {} }
  }

  function mount() {
    var root = document.getElementById('testRoot'); if (!root) return;
    var slug = new URLSearchParams(location.search).get('s');
    if (!slug) { root.innerHTML = ph('Тест не указан'); return; }
    fetch(SB_URL + '/rest/v1/valya_tests?slug=eq.' + encodeURIComponent(slug) + '&enabled=eq.true&select=slug,title,subtitle,intro,scale,questions,bands,help', { headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY } })
      .then(function (r) { return r.json(); })
      .then(function (rows) {
        if (!rows || !rows.length) { root.innerHTML = ph('Тест не найден или выключен'); return; }
        test = rows[0];
        if (test.title) document.title = test.title + ' — тест · Отношения длиною в жизнь';
        render();
      })
      .catch(function () { root.innerHTML = ph('Не удалось загрузить тест'); });
  }
  if (document.readyState !== 'loading') mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
