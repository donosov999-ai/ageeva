/* Форма заявки на курс: клик по тарифу → модалка (имя + выбор канала + контакт) → valya_lead_add (база + письмо Вале) → «спасибо».
   Кнопки тарифов помечены data-apply + data-tier. href на t.me остаётся фолбэком, если JS выключен. */
(function () {
  var SB_URL = 'https://iuvvheeocobhiothfgei.supabase.co';
  var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1dnZoZWVvY29iaGlvdGhmZ2VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MTQ1ODcsImV4cCI6MjA5MjA5MDU4N30.IJ5i3UkC0GoIWGFnLKmc1UeX2iqn8LzNYfvEfj-3hIY';
  var TG = 'https://t.me/valli790';
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  // каналы связи: подпись поля + placeholder
  var CHANS = [
    { k: 'Telegram', label: 'Твой Telegram', ph: '@username или ссылка' },
    { k: 'MAX', label: 'Твой MAX', ph: 'телефон или @ник в MAX (мессенджер)' },
    { k: 'Телефон', label: 'Твой телефон', ph: '+7 999 123-45-67' },
    { k: 'Email', label: 'Твой email', ph: 'email@почта.ру' }
  ];

  var modal = null, currentTier = '', channel = 'Telegram';

  function build() {
    modal = document.createElement('div');
    modal.className = 'capply-ov';
    modal.innerHTML = '<div class="capply" role="dialog" aria-modal="true">' +
      '<button class="capply-x" type="button" aria-label="Закрыть">×</button>' +
      '<h3>Запись на курс</h3>' +
      '<p class="capply-tier" id="capplyTier"></p>' +
      '<form id="capplyForm" novalidate>' +
      '<input type="text" id="capplyHp" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;opacity:0;height:0;width:0">' +
      '<label for="capplyName">Как тебя зовут</label><input id="capplyName" type="text" placeholder="Имя" autocomplete="name">' +
      '<label style="margin-top:14px">Как удобнее, чтобы Валя связалась?</label>' +
      '<div class="capply-chans" id="capplyChans">' +
      CHANS.map(function (c, i) { return '<button type="button" class="capply-ch' + (i === 0 ? ' on' : '') + '" data-ch="' + c.k + '">' + c.k + '</button>'; }).join('') +
      '</div>' +
      '<label for="capplyContact" id="capplyCLabel">Твой Telegram <span class="capply-req">*</span></label>' +
      '<input id="capplyContact" type="text" placeholder="@username или ссылка" autocomplete="off">' +
      '<label class="capply-chk"><input type="checkbox" id="capplyConsent"> <span>Согласна на обработку данных и <a href="/privacy.html" target="_blank" rel="noopener">политику конфиденциальности</a></span></label>' +
      '<button type="submit" class="btn btn-primary btn-lg" id="capplyGo">Отправить заявку →</button>' +
      '<p class="capply-msg" id="capplyMsg"></p>' +
      '</form></div>';
    document.body.appendChild(modal);
    modal.querySelector('.capply-x').addEventListener('click', close);
    modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
    modal.querySelector('#capplyForm').addEventListener('submit', submit);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    modal.querySelector('#capplyChans').addEventListener('click', function (e) {
      var b = e.target.closest('.capply-ch'); if (!b) return;
      channel = b.getAttribute('data-ch');
      modal.querySelectorAll('.capply-ch').forEach(function (x) { x.classList.toggle('on', x === b); });
      var c = CHANS.filter(function (x) { return x.k === channel; })[0] || CHANS[0];
      document.getElementById('capplyCLabel').innerHTML = esc(c.label) + ' <span class="capply-req">*</span>';
      var inp = document.getElementById('capplyContact'); inp.placeholder = c.ph; inp.focus();
    });
  }

  function open(tier) {
    if (!modal) build();
    currentTier = tier || ''; channel = 'Telegram';
    document.getElementById('capplyTier').innerHTML = tier ? ('Тариф: <b>' + esc(tier) + '</b>') : '';
    var msg = document.getElementById('capplyMsg'); if (msg) { msg.textContent = ''; msg.className = 'capply-msg'; }
    modal.classList.add('show');
    setTimeout(function () { var n = document.getElementById('capplyName'); if (n) n.focus(); }, 60);
    if (window.ym) { try { ym(109819083, 'reachGoal', 'course_apply_open'); } catch (e) {} }
  }
  function close() { if (modal) modal.classList.remove('show'); }

  function submit(e) {
    e.preventDefault();
    if (document.getElementById('capplyHp').value) return;
    var name = (document.getElementById('capplyName').value || '').trim();
    var contactRaw = (document.getElementById('capplyContact').value || '').trim();
    var inp = document.getElementById('capplyContact');
    var msg = document.getElementById('capplyMsg');
    if (contactRaw.length < 3) {
      msg.textContent = 'Оставь контакт — без него Вале некуда ответить.'; msg.className = 'capply-msg bad';
      inp.classList.add('miss'); inp.focus(); return;
    }
    inp.classList.remove('miss');
    if (!document.getElementById('capplyConsent').checked) { msg.textContent = 'Отметь согласие на обработку данных.'; msg.className = 'capply-msg bad'; return; }
    var contact = channel + ': ' + contactRaw;
    var btn = document.getElementById('capplyGo'); btn.disabled = true; var old = btn.textContent; btn.textContent = 'Отправляю…';
    fetch(SB_URL + '/rest/v1/rpc/valya_lead_add', {
      method: 'POST',
      headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_name: name, p_contact: contact, p_source: 'course' + (currentTier ? (' · ' + currentTier) : ''), p_result: currentTier || null, p_consent: true })
    })
      .then(function (r) { if (!r.ok) throw 0; return r.text(); })
      .then(function () {
        var box = modal.querySelector('.capply');
        var viaTg = channel === 'Telegram';
        box.innerHTML = '<button class="capply-x" type="button" aria-label="Закрыть">×</button>' +
          '<h3>Спасибо' + (name ? (', ' + esc(name)) : '') + '!</h3>' +
          '<p>Заявка у Валентины — она свяжется с тобой в <b>' + esc(channel) + '</b> в ближайшее время, подтвердит место и пришлёт ссылку на оплату.</p>' +
          (viaTg
            ? '<p style="color:var(--muted);font-size:.95rem;margin-top:14px">Хочешь — напиши ей сразу, так быстрее:</p><a href="' + TG + '" target="_blank" rel="noopener" class="btn btn-primary btn-lg" data-goal="course_apply_tg" style="width:100%">Написать в Telegram →</a>'
            : '<button type="button" class="btn btn-primary btn-lg capply-close" style="width:100%;margin-top:14px">Хорошо</button>');
        box.querySelector('.capply-x').addEventListener('click', close);
        var cl = box.querySelector('.capply-close'); if (cl) cl.addEventListener('click', close);
        if (window.ym) { try { ym(109819083, 'reachGoal', 'course_apply_sent'); } catch (e) {} }
      })
      .catch(function () { btn.disabled = false; btn.textContent = old; msg.textContent = 'Не удалось отправить. Напиши Вале в Telegram — кнопка в углу экрана.'; msg.className = 'capply-msg bad'; });
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-apply]');
    if (t) { e.preventDefault(); open(t.getAttribute('data-tier') || ''); }
  });
})();
