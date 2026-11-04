/* ageeva-app · VER 3 · 04.11.2026 */
/* ===========================================================
   Сайт Вали — конверсионные хуки (vanilla JS, без зависимостей)
   Верхний+нижний бар (все ширины, ужимание до иконок при скролле) · exit-intent ·
   sticky-CTA · Aa-размер · наверх · аналитика-цели
   © Отношения длиною в жизнь · ageeva.win
   =========================================================== */
(function () {
  "use strict";

  // ── КОНФИГ (заполнить!) ───────────────────────────────────
  var CFG = {
    tg: "valli790",   // Telegram Вали
    metrika: 109819083,   // Яндекс.Метрика — счётчик ageeva.win (цели идут через data-goal)
    course: "Отношения длиною в жизнь"
  };
  var TG_URL = "https://t.me/" + CFG.tg;

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

    // ── 1–4. БАРЫ (верхний + нижний, на всех ширинах; ужимание до иконок при скролле) ──────────
    var LANG = (document.documentElement.lang || "ru").slice(0, 2);
    if (!{ ru: 1, en: 1, es: 1 }[LANG]) LANG = "ru";
    var TX = {
      ru: { test: "Тест", tests: "Тесты", about: "Обо мне", write: "Написать", writeT: "Написать Вале в Telegram", up: "Наверх", aa: "Размер текста", aaT: "Крупнее текст", bar: "Быстрые действия" },
      en: { test: "Test", tests: "Tests", about: "About", write: "Write", writeT: "Message Valya on Telegram", up: "Back to top", aa: "Text size", aaT: "Larger text", bar: "Quick actions" },
      es: { test: "Test", tests: "Tests", about: "Sobre mí", write: "Escribir", writeT: "Escribir a Valya por Telegram", up: "Volver arriba", aa: "Tamaño del texto", aaT: "Texto más grande", bar: "Acciones rápidas" }
    }[LANG];
    var BASE = LANG === "ru" ? "" : "/" + LANG;
    var ICONS = {  // линейные иконки 24×24, тёплый скруглённый стиль
      test: "M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z",
      tests: "M9 6h11M9 12h11M9 18h11M4.5 6l1 1 2-2M4.5 12l1 1 2-2M4.5 18l1 1 2-2",
      about: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.4A4 4 0 0 1 19 10c0 5.6-7 10-7 10z",
      write: "M21 3L3 10.5l6 2.5 2.5 6zM9 13l12-10",
      gift: "M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7C10 4 7 4 7 6s3 1 5 1c2 0 5 1 5-1s-3-2-5 1",
      up: "M12 19V5M6 11l6-6 6 6"
    };
    function icon(n) { return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="' + ICONS[n] + '"/></svg>'; }
    function safe(fn) { try { return fn(); } catch (e) { return null; } }

    var header = document.querySelector(".site-header");
    var compact = false, frozen = false, lastY = window.pageYOffset || 0, acc = 0, TH = 10;

    // нижний бар: 4 действия (RU) / 3 (EN, ES — тесты пока только на русском)
    var items = [["free.html", "test", TX.test, TX.test, "free", "bar_test"]];
    if (LANG === "ru") items.push(["tests/", "tests", TX.tests, TX.tests, "tests", "bar_tests"]);
    items.push(["about.html", "about", TX.about, TX.about, "about", "bar_about"]);
    var bar = el("nav", { class: "mbar", "aria-label": TX.bar });
    bar.innerHTML = items.map(function (it) {
      var href = it[0] === "tests/" ? "/tests/" : BASE + "/" + it[0];
      return '<a href="' + href + '" data-p="' + it[4] + '" data-goal="' + it[5] + '" aria-label="' + it[3] + '" title="' + it[3] + '"><span class="mbar__i">' + icon(it[1]) + '</span><span class="mbar__t">' + it[2] + "</span></a>";
    }).join("") +
      '<a href="' + TG_URL + '" target="_blank" rel="noopener" data-goal="tg_click" aria-label="' + TX.writeT + '" title="' + TX.writeT + '"><span class="mbar__i">' + icon("write") + '</span><span class="mbar__t">' + TX.write + "</span></a>";
    document.body.appendChild(bar);
    var act = bar.querySelector('[data-p="' + page + '"]');
    if (act) act.classList.add("is-active");

    // верхний бар: иконки у ссылок (подпись прячется при ужимании), Aa и «наверх»
    var upBtn = null;
    if (header) {
      header.querySelectorAll(".nav-links a").forEach(function (a) {
        if (a.closest(".lang-switch")) return;
        var href = a.getAttribute("href") || "", key = null;
        if (a.classList.contains("nav-cta")) key = "test";
        else if (href.indexOf("about.html") > -1) key = "about";
        else if (href.indexOf("/tests") > -1 || href.indexOf("tests/") === 0) key = "tests";
        else if (href.indexOf("free.html") > -1) key = "gift";
        if (!key) return;
        var txt = a.textContent.replace(/\s+/g, " ").trim();
        a.classList.add("has-nb");
        a.setAttribute("aria-label", txt); a.setAttribute("title", txt);
        a.innerHTML = '<span class="nb-i">' + icon(key) + '</span><span class="nb-t"></span>';
        a.querySelector(".nb-t").textContent = txt;
      });
      var nav = header.querySelector(".nav");
      if (nav) {
        var tools = el("div", { class: "nav-tools" });
        tools.innerHTML =
          '<button type="button" class="nb-btn" id="aaBtn" aria-label="' + TX.aa + '" title="' + TX.aaT + '">Aa</button>' +
          '<button type="button" class="nb-btn" id="upBtn" aria-label="' + TX.up + '" title="' + TX.up + '">' + icon("up") + "</button>";
        nav.insertBefore(tools, nav.querySelector(".nav-toggle"));
        upBtn = tools.querySelector("#upBtn");
        var tgl = nav.querySelector(".nav-toggle");
        if (tgl) {
          if (!tgl.getAttribute("title")) tgl.setAttribute("title", "Menu");
          tgl.setAttribute("aria-expanded", "false");
          tgl.addEventListener("click", function () {   // inline-обработчик сайта уже переключил .open
            var nl = header.querySelector(".nav-links");
            tgl.setAttribute("aria-expanded", nl && nl.classList.contains("open") ? "true" : "false");
          });
        }
      }
    }

    // резерв высоты: контент не прыгает при ужимании, виджеты встают над баром
    var barH = 64, barHC = 52;
    function measure() {
      var was = compact;
      bar.classList.add("no-anim"); if (header) header.classList.add("no-anim");
      if (was) { bar.classList.remove("is-compact"); if (header) header.classList.remove("is-compact"); }
      var cs = getComputedStyle(bar), gap = parseFloat(cs.bottom) || 0;
      barH = Math.round(bar.offsetHeight + gap);
      if (header) document.documentElement.style.setProperty("--top-h", header.offsetHeight + "px");
      bar.classList.add("is-compact"); barHC = Math.round(bar.offsetHeight + (parseFloat(getComputedStyle(bar).bottom) || 0));
      if (!was) bar.classList.remove("is-compact");
      if (was && header) header.classList.add("is-compact");
      void bar.offsetHeight;
      bar.classList.remove("no-anim"); if (header) header.classList.remove("no-anim");
      document.documentElement.style.setProperty("--bar-h", barH + "px");
    }
    function syncCorners() {
      var o = window.ODVCorners;
      if (o && o.setBar) safe(function () { o.setBar(compact ? barHC : barH); });
    }
    function setCompact(v) {
      if (v === compact) return;
      compact = v;
      bar.classList.toggle("is-compact", v);
      if (header) header.classList.toggle("is-compact", v);
      syncCorners();
    }
    measure();
    var cornerPoll = 0, cornerTimer = setInterval(function () {
      syncCorners(); if (window.ODVCorners || ++cornerPoll > 40) clearInterval(cornerTimer);
    }, 500);
    var rz; window.addEventListener("resize", function () {
      clearTimeout(rz); rz = setTimeout(function () { measure(); syncCorners(); }, 150);
    });

    // при фокусе в поле ввода не ужимаем/разжимаем бары и не даём им перекрыть поле
    document.addEventListener("focusin", function (e) { if (e.target.matches && e.target.matches("input,textarea,select,[contenteditable]")) frozen = true; });
    document.addEventListener("focusout", function () { setTimeout(function () { frozen = false; lastY = window.pageYOffset || 0; acc = 0; }, 300); });

    function toTop() { window.scrollTo({ top: 0, behavior: "smooth" }); }
    if (upBtn) upBtn.addEventListener("click", toTop);

    function onScroll() {
      var y = window.pageYOffset || 0;
      if (upBtn) upBtn.classList.toggle("is-on", y > 400);
      if (stickyCTA) stickyCTA.classList.toggle("show", y > 700);
      if (frozen) { lastY = y; return; }
      if (y <= TH) { setCompact(false); lastY = y; acc = 0; return; }
      var d = y - lastY; if (!d) return;
      acc = (d > 0) === (acc > 0) ? acc + d : d;       // накапливаем в одну сторону, порог 10 px
      if (acc > TH) setCompact(true); else if (acc < -TH) setCompact(false);
      lastY = y;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // Aa — размер шрифта (память в localStorage, с защитой от запрета хранилища)
    function applyBig(v) { document.body.classList.toggle("text-lg", v); }
    var big = safe(function () { return localStorage.getItem("ageeva_textlg") === "1"; }) || false;
    applyBig(big);
    var aaBtn = document.getElementById("aaBtn");
    if (aaBtn) aaBtn.addEventListener("click", function () {
      big = !big; applyBig(big);
      safe(function () { localStorage.setItem("ageeva_textlg", big ? "1" : "0"); });
      aaBtn.setAttribute("aria-pressed", big ? "true" : "false");
    });

    // ── 5. STICKY-CTA на странице курса ────────────────────
    var stickyCTA = null;
    if (page === "course") {
      stickyCTA = el("div", { class: "ccta" });
      stickyCTA.innerHTML =
        '<span class="ccta__t">Курс «' + CFG.course + '»</span>' +
        '<a href="#tarify" class="btn btn-primary btn-sm cta-shine" data-goal="cta_zapis">Записаться →</a>';
      document.body.appendChild(stickyCTA);
    }

    // ── 6. EXIT-INTENT (десктоп, 15с, 1 раз/сессию) ────────
    var canExit = !("ontouchstart" in window) && window.innerWidth > 768 && !!document.querySelector(".site-header");
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
        '<a href="/free.html" class="btn btn-primary btn-lg" data-goal="exit_test">Пройти бесплатный тест →</a>' +
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
