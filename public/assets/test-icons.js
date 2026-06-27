/* Иконки тестов ageeva.win — единый набор аккуратных outline-SVG (один стиль линий).
   Покрывает и статичные карточки (хаб /tests, /free — по data-goal=hub_/free_),
   и динамические тесты Готтмана (через window.testIconSVG(goal), зовётся из tests-list.js).
   JS отключён → остаётся юникод-глиф (graceful fallback). Линия — rose-ink #9A5F57. */
(function () {
  var A = 'width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9A5F57" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display:block"';
  function s(inner) { return '<svg ' + A + '>' + inner + '</svg>'; }
  var ICONS = {
    attachment: s('<circle cx="9.4" cy="12" r="5.3"/><circle cx="14.6" cy="12" r="5.3"/>'),
    triangle: s('<path d="M12 4.4L19.6 19H4.4Z"/><circle cx="12" cy="4.4" r="1.4" fill="#9A5F57" stroke="none"/><circle cx="19.6" cy="19" r="1.4" fill="#9A5F57" stroke="none"/><circle cx="4.4" cy="19" r="1.4" fill="#9A5F57" stroke="none"/>'),
    horsemen: s('<path d="M7 3.4V20.6"/><path d="M7 4.6H17.4L13.4 8L17.4 11.4H7"/>'),
    alpha: s('<circle cx="10" cy="14" r="5.2"/><path d="M14.3 9.7L20 4"/><path d="M15 4H20V9"/>'),
    erotic: s('<path d="M12 3.2c2.4 3 4 4.9 4 8.1a4 4 0 0 1-8 0c0-1.8 1-3.3 2.5-4.1-.2 1.4.6 2.3 1.5 2.5C11.2 8.4 11.5 5.8 12 3.2Z"/>'),
    narc: s('<ellipse cx="12" cy="9" rx="5.2" ry="5.5"/><path d="M12 14.5V21"/><path d="M9 21h6"/>'),
    self: s('<rect x="6" y="4.6" width="12" height="15.4" rx="2"/><path d="M9.5 4.6V3.8a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v.8"/><path d="M9.5 10H15M9.5 13.5H15M9.5 17h3.6"/>'),
    map: s('<path d="M3.5 6.5 9 4.5l6 2 5.5-2v13l-5.5 2-6-2-5.5 2Z"/><path d="M9 4.5v13M15 6.5v13"/>'),
    heart: s('<path d="M12 20C6.5 16.2 4 12.8 4 9.6 4 7.3 5.9 5.6 8.1 5.6c1.6 0 3 .9 3.9 2.2.9-1.3 2.3-2.2 3.9-2.2C18.1 5.6 20 7.3 20 9.6c0 3.2-2.5 6.6-8 10.4Z"/>'),
    warmth: s('<path d="M11.4 18.2C6.6 14.9 4.4 12 4.4 9.2 4.4 7.2 6 5.7 7.9 5.7c1.4 0 2.7.8 3.5 2 .5-.8 1.3-1.4 2.2-1.7"/><path d="M18.5 4v3.4M16.8 5.7h3.4"/><path d="M17.6 11.2c-.5.7-1.2 1.5-2.2 2.4"/>'),
    chat: s('<path d="M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v7a1.5 1.5 0 0 1-1.5 1.5H9l-5 4Z"/><path d="M8.5 9.7h.01M12 9.7h.01M15.5 9.7h.01"/>'),
    trust: s('<path d="M12 3 5 5.7v5c0 4.3 3 7.4 7 9.3 4-1.9 7-5 7-9.3v-5Z"/><path d="M9 11.6l2.2 2.2L15 10.2"/>'),
    link: s('<rect x="3.4" y="9" width="9.6" height="6" rx="3"/><rect x="11" y="9" width="9.6" height="6" rx="3"/>'),
    bolt: s('<path d="M13 3 5 13.5h5.5L9 21l9-11h-5.5Z"/>'),
    waves: s('<path d="M3 8c1.8-2.2 3.7-2.2 5.5 0s3.7 2.2 5.5 0 3.7-2.2 5.5 0M3 13c1.8-2.2 3.7-2.2 5.5 0s3.7 2.2 5.5 0 3.7-2.2 5.5 0M3 18c1.8-2.2 3.7-2.2 5.5 0s3.7 2.2 5.5 0 3.7-2.2 5.5 0"/>'),
    repair: s('<path d="M12 20C6.5 16.2 4 12.8 4 9.6 4 7.3 5.9 5.6 8.1 5.6c1.6 0 3 .9 3.9 2.2.9-1.3 2.3-2.2 3.9-2.2C18.1 5.6 20 7.3 20 9.6c0 3.2-2.5 6.6-8 10.4Z"/><path d="M12 9.4v4.2M9.9 11.5h4.2"/>'),
    scale: s('<path d="M12 4.5v14.7M7.5 19.2h9"/><path d="M5 8.2l7-2 7 2"/><path d="M2.7 8.2 5 12.7l2.3-4.5M16.7 8.2 19 12.7l2.3-4.5"/>'),
    filter: s('<path d="M4 5.5h16l-6.2 7.3V19l-3.6-2v-4.2Z"/>'),
    knot: s('<circle cx="12" cy="12" r="8.2"/><path d="M6.2 6.2 17.8 17.8"/>'),
    apart: s('<circle cx="6.6" cy="8" r="2.3"/><path d="M3.1 19v-1c0-2 1.6-3.4 3.5-3.4S10 16 10 18v1"/><circle cx="17.4" cy="8" r="2.3"/><path d="M14 19v-1c0-2 1.6-3.4 3.5-3.4S21 16 21 18v1"/>'),
    handshake: s('<path d="M3 12h6.5M7 9.2 10 12l-3 2.8M21 12h-6.5M17 9.2 14 12l3 2.8"/>'),
    star: s('<path d="M12 3.6l2.5 5.3 5.8.6-4.3 3.9 1.2 5.7L12 16.6l-5.2 2.5 1.2-5.7L3.7 9.5l5.8-.6Z"/>'),
    faceheart: s('<circle cx="12" cy="11.5" r="8"/><path d="M12 15.2s-3-1.8-3-3.7c0-1 .8-1.7 1.6-1.7.6 0 1.1.3 1.4.8.3-.5.8-.8 1.4-.8.8 0 1.6.7 1.6 1.7C15 13.4 12 15.2 12 15.2Z"/>'),
    tree: s('<circle cx="12" cy="5" r="2.2"/><circle cx="6.5" cy="18" r="2.2"/><circle cx="17.5" cy="18" r="2.2"/><path d="M12 7.2v3.3M6.5 15.8v-3a1.5 1.5 0 0 1 1.5-1.5h8a1.5 1.5 0 0 1 1.5 1.5v3"/>'),
    home: s('<path d="M4 11 12 4.5 20 11M6 9.7V19.5h12V9.7"/><path d="M10 19.5v-4.5h4v4.5"/>'),
    sparkheart: s('<path d="M12 20.4C6.7 16.7 4.3 13.3 4.3 10.1 4.3 8 6 6.4 8 6.4c1.5 0 2.9.9 3.9 2.1 1-1.2 2.4-2.1 3.9-2.1 2 0 3.8 1.6 3.8 3.7"/><path d="M16.5 14l1 1.8 1.8 1-1.8 1-1 1.8-1-1.8-1.8-1 1.8-1Z"/>'),
    shieldperson: s('<path d="M12 3 5 5.7v5c0 4.3 3 7.4 7 9.3 4-1.9 7-5 7-9.3v-5Z"/><circle cx="12" cy="10" r="1.7"/><path d="M9.2 15c0-1.6 1.2-2.5 2.8-2.5s2.8.9 2.8 2.5"/>'),
    solvable: s('<circle cx="12" cy="12" r="8.2"/><path d="M12 3.8v16.4"/><path d="M9 12l3-3 3 3-3 3Z"/>')
  };
  // динамические тесты Готтмана: goal → иконка
  var GOAL = {
    know: 'map', warmth: 'warmth', bid: 'chat', trust: 'trust', commit: 'link',
    conflict: 'bolt', flood: 'waves', repair: 'repair', influence: 'scale', filter: 'filter',
    gridlock: 'knot', distance: 'apart', compromise: 'handshake', meaning: 'star', passion: 'heart',
    emotions: 'faceheart', home: 'home', origin: 'tree', balance: 'solvable', intimacy: 'sparkheart', respect: 'shieldperson'
  };
  // статичные карточки: data-goal → иконка
  var MAP = {
    hub_attachment: 'attachment', hub_triangle: 'triangle', hub_horsemen: 'horsemen',
    hub_alpha: 'alpha', hub_erotic: 'erotic', hub_narc: 'narc', hub_self: 'self',
    free_triangle: 'triangle', free_horsemen: 'horsemen', free_alpha: 'alpha',
    free_erotic: 'erotic', free_narc: 'narc', free_self: 'self'
  };
  function iconFor(key) {
    if (!key) return '';
    var name = MAP[key] || GOAL[key] || null;
    return (name && ICONS[name]) ? ICONS[name] : '';
  }
  window.testIconSVG = iconFor;
  function run() {
    var cards = document.querySelectorAll('[data-goal]');
    for (var i = 0; i < cards.length; i++) {
      var svg = iconFor(cards[i].getAttribute('data-goal'));
      if (!svg) continue;
      var ico = cards[i].querySelector('.ico');
      if (ico) { ico.innerHTML = svg; ico.style.lineHeight = '0'; }
    }
  }
  window.applyTestIcons = run;
  if (document.readyState !== 'loading') run();
  else document.addEventListener('DOMContentLoaded', run);
})();
