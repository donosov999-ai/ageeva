/* ===========================================================
   Сайт Вали — конверсионные хуки (vanilla JS, без зависимостей)
   Бот-бар (моб) · dock (десктоп) · exit-intent · sticky-CTA ·
   back-to-top · Aa-размер · аналитика-цели
   Автор: Denis Onosov (ODV999) · конфиденциально
   =========================================================== */
(function () {
  "use strict";

  // ── КОНФИГ (заполнить!) ───────────────────────────────────
  var CFG = {
    tg: "ageeva_valya",   // ⚠️ ПОДТВЕРДИТЬ: Telegram-юзернейм Вали (сейчас по аналогии с IG)
    metrika: null,        // ⚠️ ВСТАВИТЬ: ID счётчика Яндекс.Метрики (число). Пока null — цели копятся вхолостую
    course: "Отношения длиною в жизнь"
  };
  var TG_URL = "https://t.me/" + CFG.tg +
    "?text=" + encodeURIComponent("Здравствуйте! Вопрос по курсу «" + CFG.course + "»");

  // ── Аналитика: одна точка ────────────────────────────────
  function track(goal, params) {
    try {
      if (CFG.metrika && window.ym) window.ym(CFG.metrika, "reachGoal", goal, params || {});
      if (window.gtag) window.gtag("event", goal, params || {});
      (window.dataLayer = window.dataLayer || []).push({ event: goal });
    } catch (e) {}
  }

  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (html != null) n.innerHTML = html;
    return n;
  }

  // какая страница
  var path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  var page = path.replace(".html", "") || "index";

  document.addEventListener("DOMContentLoaded", function () {

    // ── 1. МОБ. НИЖНИЙ БАР: Тест · Курс · Telegram ──────────
    var bar = el("nav", { class: "mbar", "aria-label": "Быстрые действия" });
    bar.innerHTML =
      '<a href="free.html" data-p="free" data-goal="bar_test"><span class="mbar__i">✦</span>Тест</a>' +
      '<a href="course.html" data-p="course" data-goal="bar_course"><span class="mbar__i">❤</span>Курс</a>' +
      '<a href="' + TG_URL + '" target="_blank" rel="noopener" data-goal="tg_click"><span class="mbar__i">✈</span>Telegram</a>';
    document.body.appendChild(bar);
    var act = bar.querySelector('[data-p="' + page + '"]');
    if (act) act.classList.add("is-active");

    // ── 2. ДЕСКТОП DOCK: TG · Aa · ↑ ───────────────────────
    var dock = el("div", { class: "dock" });
    dock.innerHTML =
      '<a class="dock__b" href="' + TG_URL + '" target="_blank" rel="noopener" title="Написать в Telegram" data-goal="tg_click">✈</a>' +
      '<button class="dock__b" id="aaBtn" title="Крупнее текст" aria-label="Размер текста">Aa</button>' +
      '<button class="dock__b dock__up" id="upBtn" title="Наверх" aria-label="Наверх">↑</button>';
    document.body.appendChild(dock);

    // ── 3. BACK-TO-TOP (моб. отдельная кнопка над баром) ────
    var upM = el("button", { class: "to-top", "aria-label": "Наверх" }, "↑");
    document.body.appendChild(upM);
    function toTop() { window.scrollTo({ top: 0, behavior: "smooth" }); }
    upM.addEventListener("click", toTop);
    document.getElementById("upBtn").addEventListener("click", toTop);
    function onScroll() {
      var y = window.pageYOffset;
      upM.classList.toggle("show", y > 600);
      dock.classList.toggle("show", y > 400);
      if (stickyCTA) stickyCTA.classList.toggle("show", y > 700);
    }
    window.addEventListener("scroll", onScroll, { passive: true });

    // ── 4. Aa — размер шрифта (память в localStorage) ──────
    function applyBig(v) { document.body.classList.toggle("text-lg", v); }
    var big = localStorage.getItem("ageeva_textlg") === "1";
    applyBig(big);
    document.getElementById("aaBtn").addEventListener("click", function () {
      big = !big; applyBig(big);
      localStorage.setItem("ageeva_textlg", big ? "1" : "0");
    });

    // ── 5. STICKY-CTA на странице курса ────────────────────
    var stickyCTA = null;
    if (page === "course") {
      stickyCTA = el("div", { class: "ccta" });
      stickyCTA.innerHTML =
        '<span class="ccta__t">Курс «' + CFG.course + '»</span>' +
        '<a href="#tarify" class="btn btn-primary btn-sm" data-goal="cta_zapis">Записаться →</a>';
      document.body.appendChild(stickyCTA);
    }

    // ── 6. EXIT-INTENT (десктоп, 15с, 1 раз/сессию) ────────
    var canExit = !("ontouchstart" in window) && window.innerWidth > 768;
    if (canExit && !sessionStorage.getItem("ageeva_exit") && page !== "free") {
      var armed = false;
      setTimeout(function () { armed = true; }, 15000);
      document.addEventListener("mouseout", function (e) {
        if (!armed || e.relatedTarget || e.clientY > 40) return;
        showExit();
      });
    }
    function showExit() {
      if (sessionStorage.getItem("ageeva_exit")) return;
      sessionStorage.setItem("ageeva_exit", "1");
      track("exit_intent");
      var ov = el("div", { class: "exit-ov" });
      ov.innerHTML =
        '<div class="exit-bx" role="dialog" aria-modal="true">' +
        '<button class="exit-x" aria-label="Закрыть">×</button>' +
        '<h3>Не уходи с пустыми руками</h3>' +
        '<p>Пройди бесплатный тест на тип привязанности — за 5 минут поймёшь, почему ты реагируешь именно так. В подарок PDF-гайд.</p>' +
        '<a href="free.html" class="btn btn-primary btn-lg" data-goal="exit_test">Пройти бесплатный тест →</a>' +
        '</div>';
      document.body.appendChild(ov);
      requestAnimationFrame(function () { ov.classList.add("show"); });
      function close() { ov.classList.remove("show"); setTimeout(function () { ov.remove(); }, 250); }
      ov.querySelector(".exit-x").addEventListener("click", close);
      ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
    }

    // ── 7. АНАЛИТИКА: делегирование по data-goal ───────────
    document.addEventListener("click", function (e) {
      var t = e.target.closest("[data-goal]");
      if (t) track(t.getAttribute("data-goal"));
    });
    // формы → lead
    document.querySelectorAll("form").forEach(function (f) {
      f.addEventListener("submit", function () { track("lead_form"); });
    });
  });
})();
