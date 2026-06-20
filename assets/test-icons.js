/* Иконки тестов ageeva.win — аккуратные SVG вместо юникод-глифов.
   Подменяет содержимое .ico в карточках тестов (хаб /tests + витрина /free) по data-goal.
   JS отключён → остаётся юникод-глиф (graceful fallback). Цвет — rose-ink #9A5F57. */
(function () {
  var A = 'width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9A5F57" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display:block"';
  var ICONS = {
    // тип привязанности — связь двух
    attachment: '<svg ' + A + '><circle cx="9.4" cy="12" r="5.3"/><circle cx="14.6" cy="12" r="5.3"/></svg>',
    // привязанность, выбор и роль — треугольник
    triangle: '<svg ' + A + '><path d="M12 4.4L19.6 19H4.4Z"/><circle cx="12" cy="4.4" r="1.4" fill="#9A5F57" stroke="none"/><circle cx="19.6" cy="19" r="1.4" fill="#9A5F57" stroke="none"/><circle cx="4.4" cy="19" r="1.4" fill="#9A5F57" stroke="none"/></svg>',
    // 4 всадника — флаг
    horsemen: '<svg ' + A + '><path d="M7 3.4V20.6"/><path d="M7 4.6H17.4L13.4 8L17.4 11.4H7"/></svg>',
    // какой мужчина рядом — символ Марса
    alpha: '<svg ' + A + '><circle cx="10" cy="14" r="5.2"/><path d="M14.3 9.7L20 4"/><path d="M15 4H20V9"/></svg>',
    // эротический профиль — пламя
    erotic: '<svg ' + A + '><path d="M12 3.2c2.4 3 4 4.9 4 8.1a4 4 0 0 1-8 0c0-1.8 1-3.3 2.5-4.1-.2 1.4.6 2.3 1.5 2.5C11.2 8.4 11.5 5.8 12 3.2Z"/></svg>',
    // нарцисс — зеркало
    narc: '<svg ' + A + '><ellipse cx="12" cy="9" rx="5.2" ry="5.5"/><path d="M12 14.5V21"/><path d="M9 21h6"/></svg>',
    // узнай себя — опросник
    self: '<svg ' + A + '><rect x="6" y="4.6" width="12" height="15.4" rx="2"/><path d="M9.5 4.6V3.8a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v.8"/><path d="M9.5 10H15M9.5 13.5H15M9.5 17h3.6"/></svg>'
  };
  var MAP = {
    hub_attachment: 'attachment', hub_triangle: 'triangle', hub_horsemen: 'horsemen',
    hub_alpha: 'alpha', hub_erotic: 'erotic', hub_narc: 'narc', hub_self: 'self',
    free_triangle: 'triangle', free_horsemen: 'horsemen', free_alpha: 'alpha',
    free_erotic: 'erotic', free_narc: 'narc', free_self: 'self'
  };
  function run() {
    var cards = document.querySelectorAll('[data-goal]');
    for (var i = 0; i < cards.length; i++) {
      var key = MAP[cards[i].getAttribute('data-goal')];
      if (!key) continue;
      var ico = cards[i].querySelector('.ico');
      if (ico) { ico.innerHTML = ICONS[key]; ico.style.lineHeight = '0'; }
    }
  }
  if (document.readyState !== 'loading') run();
  else document.addEventListener('DOMContentLoaded', run);
})();
