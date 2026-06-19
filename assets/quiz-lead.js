/* Лид-захват на тестах ageeva.win.
   «Отправить результат Валентине в Telegram» → запись в valya_leads (Supabase) с согласием на ПДн.
   Самодостаточно: свой fetch к Supabase, свои стили, без зависимостей и без cms.js.
   Подключение в тесте: <div id="quizLead"></div> + <script src="../assets/quiz-lead.js" defer></script> */
(function () {
  var SB_URL = "https://iuvvheeocobhiothfgei.supabase.co";
  var SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1dnZoZWVvY29iaGlvdGhmZ2VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MTQ1ODcsImV4cCI6MjA5MjA5MDU4N30.IJ5i3UkC0GoIWGFnLKmc1UeX2iqn8LzNYfvEfj-3hIY";

  function rpc(fn, args) {
    return fetch(SB_URL + "/rest/v1/rpc/" + fn, {
      method: "POST",
      headers: { apikey: SB_KEY, Authorization: "Bearer " + SB_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(args || {})
    }).then(function (r) {
      return r.text().then(function (t) {
        var j = t ? JSON.parse(t) : null;
        if (!r.ok) throw (j && (j.message || j.error)) || ("HTTP " + r.status);
        return j;
      });
    });
  }

  function slug() {
    var m = (location.pathname.split("/").pop() || "test").replace(/\.html$/, "");
    return m || "test";
  }

  // Лучшее усилие: подхватить текст результата со страницы (контейнеры у тестов разные)
  function grabResult() {
    var el = document.querySelector(".result-box, #result, .result-card, #resultBox, [id*='result'], [class*='result']");
    if (!el) return null;
    var t = (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
    return t ? t.slice(0, 600) : null;
  }

  function injectStyles() {
    if (document.getElementById("qlead-css")) return;
    var s = document.createElement("style");
    s.id = "qlead-css";
    s.textContent =
      ".qlead{background:#FBF3EC;border:1px solid #E7D3C7;border-radius:16px;padding:26px 24px;max-width:560px;margin:0 auto;text-align:center}" +
      ".qlead h3{font-family:'Playfair Display',Georgia,serif;font-size:22px;color:#7A4A43;margin:0 0 8px;line-height:1.2}" +
      ".qlead p.qlsub{font-size:15px;line-height:1.5;color:#6B5D57;margin:0 0 16px}" +
      ".qlead form{display:flex;flex-direction:column;gap:12px;text-align:left}" +
      ".qlead input[type=text]{padding:13px 15px;font-size:15px;border:1px solid #D9C3B6;border-radius:10px;background:#fff;color:#2a2320;width:100%;box-sizing:border-box}" +
      ".qlead .qlhp{position:absolute;left:-9999px;opacity:0;height:0;width:0;padding:0;border:0}" +
      ".qlconsent{display:flex;align-items:flex-start;gap:9px;font-size:13px;line-height:1.4;color:#6B5D57}" +
      ".qlconsent input{margin-top:3px;width:auto;flex:0 0 auto}" +
      ".qlconsent a{color:#9A5F57}" +
      ".qlead button{padding:14px 18px;font-size:15px;font-weight:700;border:none;border-radius:10px;background:#BE7E75;color:#fff;cursor:pointer}" +
      ".qlead button:hover{background:#9A5F57}" +
      ".qlead button:disabled{opacity:.6;cursor:default}" +
      ".qlmsg{display:none;font-size:14px;margin:4px 0 0;text-align:center}" +
      "@media(max-width:560px){.qlead{padding:22px 18px}}";
    document.head.appendChild(s);
  }

  function init() {
    var box = document.getElementById("quizLead");
    if (!box) return;
    injectStyles();
    box.innerHTML =
      '<div class="qlead">' +
      "<h3>📲 Хочешь разбор результата?</h3>" +
      '<p class="qlsub">Оставь свой Telegram — Валентина посмотрит твой результат и пришлёт персональный разбор: что он значит и что с этим делать.</p>' +
      '<form id="qleadForm" autocomplete="off">' +
      '<input type="text" id="qlhp" class="qlhp" tabindex="-1" aria-hidden="true" autocomplete="off">' +
      '<input type="text" id="qlContact" placeholder="@username в Telegram или телефон" required>' +
      '<label class="qlconsent"><input type="checkbox" id="qlConsent"> <span>Согласна на обработку персональных данных по <a href="../privacy.html" target="_blank" rel="noopener">политике конфиденциальности</a></span></label>' +
      '<button type="submit" id="qlBtn">Отправить результат Валентине →</button>' +
      '<p id="qlMsg" class="qlmsg"></p>' +
      "</form></div>";

    var form = document.getElementById("qleadForm");
    var btn = document.getElementById("qlBtn");
    var msg = document.getElementById("qlMsg");
    function show(t, ok) { msg.textContent = t; msg.style.display = "block"; msg.style.color = ok ? "#0F6E56" : "#B23A3A"; }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (document.getElementById("qlhp").value) return; // honeypot
      var contact = document.getElementById("qlContact").value.trim();
      if (contact.length < 3) { show("Впиши Telegram или телефон, чтобы Валентина смогла ответить.", false); return; }
      if (!document.getElementById("qlConsent").checked) { show("Отметь согласие на обработку данных — без него не могу принять заявку.", false); return; }
      btn.disabled = true; btn.textContent = "Отправляю…";
      rpc("valya_lead_add", { p_name: "", p_contact: contact, p_source: "test:" + slug(), p_result: grabResult(), p_consent: true })
        .then(function () {
          show("Готово! Валентина напишет тебе в Telegram с разбором. 💛", true);
          document.getElementById("qlContact").disabled = true;
          btn.style.display = "none";
        })
        .catch(function () {
          btn.disabled = false; btn.textContent = "Отправить результат Валентине →";
          show("Не получилось отправить. Попробуй ещё раз или напиши в Telegram @valli790.", false);
        });
    });
  }

  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
