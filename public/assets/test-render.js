/* Рендерер теста: /test.html?s=<slug>. Соло + парный режим (передай телефон → сравнение). */
(function () {
  var SB_URL = 'https://iuvvheeocobhiothfgei.supabase.co';
  var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1dnZoZWVvY29iaGlvdGhmZ2VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MTQ1ODcsImV4cCI6MjA5MjA5MDU4N30.IJ5i3UkC0GoIWGFnLKmc1UeX2iqn8LzNYfvEfj-3hIY';
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function ph(t) { return '<section class="section"><div class="container narrow center" style="padding:80px 24px"><span class="eyebrow">Тест</span><h2>' + esc(t) + '</h2><hr class="rule center"><p class="lead"><a href="/tests/" style="color:var(--rose-ink)">← Все тесты</a></p></div></section>'; }

  var test = null, answers = [], result1 = null, isPartner = false;

  function scale() { return (test.scale && test.scale.length) ? test.scale : ['Да, точно', 'Скорее да', 'Скорее нет', 'Нет']; }
  function maxScore() { return (test.questions || []).length * (scale().length - 1); }
  function bandFor(score) {
    var bands = test.bands || [], band = bands[bands.length - 1];
    for (var b = 0; b < bands.length; b++) { if (score <= bands[b].max) { band = bands[b]; break; } }
    return band;
  }

  function render(partner) {
    var root = document.getElementById('testRoot'), sc = scale(), qs = test.questions || [];
    answers = qs.map(function () { return -1; });
    var note = partner
      ? '<p class="lead" style="color:var(--rose-ink)"><strong>Отвечает партнёр.</strong> Те же вопросы — честно, как чувствуешь ты. В конце вы увидите, насколько совпадаете.</p>'
      : (test.subtitle ? '<p class="lead">' + esc(test.subtitle) + '</p>' : '');
    var h = '<section class="hero"><div class="container narrow center"><span class="eyebrow">' + (partner ? 'Тест · вдвоём' : 'Тест') + '</span><h1>' + esc(test.title) + '</h1>' + note + '</div></section>' +
      '<section class="section"><div class="container narrow">' +
      (!partner && test.intro ? '<p class="lead" style="margin-bottom:26px">' + esc(test.intro) + '</p>' : '') + '<form id="quizForm">';
    qs.forEach(function (q, i) {
      h += '<div class="qcard" data-i="' + i + '"><p class="qtext">' + (i + 1) + '. ' + esc(q.q) + '</p><div class="qopts">';
      sc.forEach(function (lab, o) { h += '<button type="button" class="qopt" data-i="' + i + '" data-o="' + o + '">' + esc(lab) + '</button>'; });
      h += '</div></div>';
    });
    h += '<div class="qsubmit"><button type="button" class="btn btn-primary btn-lg" id="quizGo">' + (partner ? 'Показать сравнение →' : 'Показать результат →') + '</button><p class="qhint" id="quizHint"></p></div>';
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

  function compute() {
    var sc = scale(), n = sc.length, qs = test.questions || [], score = 0;
    qs.forEach(function (q, k) { var o = answers[k]; score += q.reverse ? o : (n - 1 - o); });
    return score;
  }
  function validate() {
    var qs = test.questions || [];
    for (var i = 0; i < qs.length; i++) {
      if (answers[i] < 0) {
        document.getElementById('quizHint').textContent = 'Остался вопрос ' + (i + 1) + ' — отметь ответ.';
        var c = document.querySelector('.qcard[data-i="' + i + '"]'); c.classList.add('miss');
        c.scrollIntoView({ behavior: 'smooth', block: 'center' }); return false;
      }
    }
    return true;
  }

  function submit() {
    if (!validate()) return;
    var score = compute(), max = maxScore(), band = bandFor(score), pct = max ? Math.round(score / max * 100) : 0;
    document.getElementById('quizHint').textContent = '';
    if (isPartner) { showPair(result1, { score: score, band: band, pct: pct }); return; }
    showSolo(score, band, pct);
  }

  function showSolo(score, band, pct) {
    var max = maxScore(), res = document.getElementById('quizResult');
    var pairBtn = test.pair ? '<button type="button" class="btn btn-ghost btn-lg" id="quizPair">Сравнить с партнёром →</button>' : '';
    res.innerHTML = '<div class="qresult"><span class="eyebrow">Результат</span><h2>' + esc(band ? band.title : '') + '</h2>' +
      '<div class="qbar"><span style="width:' + pct + '%"></span></div><p class="qscore">' + score + ' из ' + max + '</p>' +
      '<p>' + esc(band ? band.text : '') + '</p>' + (test.help ? test.help : '') +
      '<div class="qcta"><p class="lead">Это один из «этажей» крепких отношений по Готтману. На курсе «Отношения длиною в жизнь» собираем всю картину — шаг за шагом.</p>' +
      '<div class="btn-row center"><a class="btn btn-primary btn-lg" href="/course.html">О курсе →</a>' + pairBtn + '<a class="btn btn-ghost btn-lg" href="/tests/">Другие тесты</a></div></div>' +
      '<button type="button" class="qretry" id="quizRetry">Пройти заново</button></div>';
    res.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('quizRetry').addEventListener('click', function () { isPartner = false; result1 = null; render(false); window.scrollTo({ top: 0, behavior: 'smooth' }); });
    var pb = document.getElementById('quizPair');
    if (pb) pb.addEventListener('click', function () { result1 = { score: score, band: band, pct: pct }; showInterlude(); });
    if (window.ym) { try { ym(109819083, 'reachGoal', 'test_done'); } catch (e) {} }
  }

  function showInterlude() {
    var res = document.getElementById('quizResult');
    res.innerHTML = '<div class="qresult"><span class="eyebrow">Теперь — вдвоём</span><h2>Передай телефон партнёру</h2>' +
      '<p>Твой ответ сохранён. Пусть партнёр ответит на те же вопросы — честно, как чувствует он. Подсматривать в твой результат не нужно: в конце вы увидите сравнение — где совпадаете, а где есть о чём поговорить.</p>' +
      '<div class="btn-row center"><button type="button" class="btn btn-primary btn-lg" id="quizPartnerGo">Партнёр готов — начать →</button></div>' +
      '<button type="button" class="qretry" id="quizBack">← Вернуться к моему результату</button></div>';
    res.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('quizPartnerGo').addEventListener('click', function () { isPartner = true; render(true); window.scrollTo({ top: 0, behavior: 'smooth' }); });
    document.getElementById('quizBack').addEventListener('click', function () { showSolo(result1.score, result1.band, result1.pct); });
  }

  function pairVerdict(s1, s2, max) {
    var diff = Math.abs(s1 - s2), avg = (s1 + s2) / 2;
    var close = diff <= max * 0.2, bothHigh = avg >= max * 0.66, bothLow = avg <= max * 0.4;
    if (!close) return { t: 'Вы видите это по-разному', x: 'Между вашими ответами заметная разница — а это частый тихий источник недопонимания: каждый уверен, что «всё очевидно», только очевидно по-разному. Это не приговор. Спросите друг друга: «а что для тебя за этим стоит?» — и просто послушайте, не споря. Половина напряжения растворяется, когда видишь картину глазами другого.' };
    if (bothHigh) return { t: 'Вы созвучны — и оба сильны', x: 'По этой теме вы смотрите в одну сторону, и у обоих крепко. Это ваш общий ресурс — на нём держится остальное. Берегите и не принимайте за данность.' };
    if (bothLow) return { t: 'Обоюдная зона роста', x: 'Вы чувствуете похоже — и обоим есть куда расти. Хорошая новость: вы в одной лодке и заодно, а вдвоём двигаться куда легче, чем поодиночке. С этого и начните.' };
    return { t: 'Вы на одной волне', x: 'Ваши взгляды на эту тему близки — это уже половина дела. Есть к чему приложить усилия, но вы понимаете друг друга, и это главное.' };
  }

  function bar(label, score, max, title) {
    var pct = max ? Math.round(score / max * 100) : 0;
    return '<div class="pairrow"><div class="pairhead"><span class="pairwho">' + esc(label) + '</span><span class="pairband">' + esc(title || '') + '</span></div>' +
      '<div class="qbar"><span style="width:' + pct + '%"></span></div><div class="pairscore">' + score + ' из ' + max + '</div></div>';
  }

  function showPair(r1, r2) {
    var max = maxScore(), v = pairVerdict(r1.score, r2.score, max), res = document.getElementById('quizResult');
    var share = 'Прошли тест «' + (test.title || '') + '» вдвоём у Валентины: я — «' + (r1.band ? r1.band.title : '') + '», партнёр — «' + (r2.band ? r2.band.title : '') + '». ageeva.win';
    res.innerHTML = '<div class="qresult"><span class="eyebrow">Вы вдвоём</span><h2>' + esc(v.t) + '</h2>' +
      '<div class="pairbars">' + bar('Ты', r1.score, max, r1.band ? r1.band.title : '') + bar('Партнёр', r2.score, max, r2.band ? r2.band.title : '') + '</div>' +
      '<p>' + esc(v.x) + '</p>' +
      '<div class="qcta"><p class="lead">Сравнить ответы — это уже разговор, который сближает. А собрать из таких разговоров крепкую систему на годы — это курс «Отношения длиною в жизнь».</p>' +
      '<div class="btn-row center"><a class="btn btn-primary btn-lg" href="/course.html">О курсе →</a><button type="button" class="btn btn-ghost btn-lg" id="quizShare">Поделиться →</button></div></div>' +
      '<button type="button" class="qretry" id="quizRetry">Пройти заново</button></div>';
    res.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('quizRetry').addEventListener('click', function () { isPartner = false; result1 = null; render(false); window.scrollTo({ top: 0, behavior: 'smooth' }); });
    document.getElementById('quizShare').addEventListener('click', function () {
      if (navigator.share) navigator.share({ text: share }).catch(function () {});
      else window.open('https://t.me/share/url?url=' + encodeURIComponent('https://ageeva.win/test.html?s=' + test.slug) + '&text=' + encodeURIComponent(share), '_blank');
    });
    if (window.ym) { try { ym(109819083, 'reachGoal', 'test_pair_done'); } catch (e) {} }
  }

  function mount() {
    var root = document.getElementById('testRoot'); if (!root) return;
    var slug = new URLSearchParams(location.search).get('s');
    if (!slug) { root.innerHTML = ph('Тест не указан'); return; }
    fetch(SB_URL + '/rest/v1/valya_tests?slug=eq.' + encodeURIComponent(slug) + '&enabled=eq.true&select=slug,title,subtitle,intro,scale,questions,bands,help,pair', { headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY } })
      .then(function (r) { return r.json(); })
      .then(function (rows) {
        if (!rows || !rows.length) { root.innerHTML = ph('Тест не найден или выключен'); return; }
        test = rows[0];
        if (test.title) document.title = test.title + ' — тест · Отношения длиною в жизнь';
        render(false);
      })
      .catch(function () { root.innerHTML = ph('Не удалось загрузить тест'); });
  }
  if (document.readyState !== 'loading') mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
