/* Supabase CMS bridge for ageeva.win
   Публичное чтение (отзывы, блог) + RPC для админки. Без SDK, чистый fetch.
   anon-ключ публичный и защищён RLS — записи только через SECURITY DEFINER функции с проверкой пароля. */
(function () {
  var SB = {
    URL: "https://iuvvheeocobhiothfgei.supabase.co",
    KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1dnZoZWVvY29iaGlvdGhmZ2VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MTQ1ODcsImV4cCI6MjA5MjA5MDU4N30.IJ5i3UkC0GoIWGFnLKmc1UeX2iqn8LzNYfvEfj-3hIY"
  };

  SB.headers = function (extra) {
    var h = { apikey: SB.KEY, Authorization: "Bearer " + SB.KEY };
    if (extra) for (var k in extra) h[k] = extra[k];
    return h;
  };

  function parse(r) {
    return r.text().then(function (t) {
      var j = t ? JSON.parse(t) : null;
      if (!r.ok) throw (j && (j.message || j.error)) || "HTTP " + r.status;
      return j;
    });
  }

  SB.rpc = function (fn, args) {
    return fetch(SB.URL + "/rest/v1/rpc/" + fn, {
      method: "POST",
      headers: SB.headers({ "Content-Type": "application/json" }),
      body: JSON.stringify(args || {})
    }).then(parse);
  };

  SB.select = function (path) {
    return fetch(SB.URL + "/rest/v1/" + path, { headers: SB.headers() }).then(parse);
  };

  SB.esc = function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  };

  SB.paras = function (t) {
    return String(t || "").split(/\n{2,}/).map(function (p) {
      return "<p>" + SB.esc(p).replace(/\n/g, "<br>") + "</p>";
    }).join("");
  };

  /* ---------- Публичный рендер ---------- */

  // Отзывы на главной → #reviewsBox. При ошибке/пустоте — оставляем статичную рыбу в HTML.
  function renderReviews() {
    var box = document.getElementById("reviewsBox");
    if (!box) return;
    SB.select("valya_reviews?select=body,author,sort&published=eq.true&order=sort.asc,created_at.asc")
      .then(function (rows) {
        if (!rows || !rows.length) return;
        box.innerHTML = rows.map(function (r) {
          return '<div class="quote"><p>«' + SB.esc(r.body) + '»</p><div class="who">— ' +
            SB.esc(r.author || "участница первого потока") + "</div></div>";
        }).join("");
      })
      .catch(function () { /* оставляем фолбэк */ });
  }

  // Блог → #blogList
  function renderPosts() {
    var box = document.getElementById("blogList");
    if (!box) return;
    var empty = '<p class="blog-empty">Первые материалы уже готовятся. А пока — загляни в Instagram или пройди тест.</p>';
    SB.select("valya_posts?select=slug,title,cover_url,excerpt,published_at&published=eq.true&order=published_at.desc")
      .then(function (rows) {
        if (!rows || !rows.length) { box.innerHTML = empty; return; }
        box.innerHTML = rows.map(function (p) {
          var href = "post.html?s=" + encodeURIComponent(p.slug || "");
          var cover = p.cover_url
            ? '<a href="' + href + '" class="bcard-img"><img src="' + SB.esc(p.cover_url) + '" alt="" loading="lazy"></a>' : "";
          return '<article class="bcard">' + cover +
            '<div class="bcard-body">' +
            '<h2><a href="' + href + '" style="color:inherit">' + SB.esc(p.title) + "</a></h2>" +
            (p.excerpt ? '<p class="bcard-lead">' + SB.esc(p.excerpt) + "</p>" : "") +
            '<a href="' + href + '" class="more" style="color:var(--rose-ink);font-weight:700;display:inline-block;margin-top:6px">Читать →</a>' +
            "</div></article>";
        }).join("");
      })
      .catch(function () { box.innerHTML = empty; });
  }

  // Блоки «Обо мне» → #aboutBlocks. При ошибке/пустоте — оставляем статичный текст в HTML.
  function renderAbout() {
    var box = document.getElementById("aboutBlocks");
    if (!box) return;
    SB.select("valya_about?select=heading,body,sort&published=eq.true&order=sort.asc,created_at.asc")
      .then(function (rows) {
        if (!rows || !rows.length) return;
        box.innerHTML = rows.map(function (b) {
          var h = (b.heading && b.heading.trim())
            ? "<h2>" + SB.esc(b.heading) + '</h2><hr class="rule">' : "";
          return h + SB.paras(b.body);
        }).join("");
      })
      .catch(function () { /* оставляем фолбэк */ });
  }

  // Настройки: тексты шапки блога (#blogTitle/#blogLead) + фото (#photoHero/#photoAbout/#photoRound)
  function renderSettings() {
    var TEXT = { blogTitle:"blog_title", blogLead:"blog_lead",
      idxHeroLead:"idx_hero_lead", idxProofNum:"idx_proof_num", idxProofCap:"idx_proof_cap",
      idxCtaEyebrow:"idx_cta_eyebrow", idxCtaTitle:"idx_cta_title", idxCtaText:"idx_cta_text" };
    var IMG = { photoHero:"photo_hero", photoAbout:"photo_about", photoRound:"photo_round" };
    var BR = { idxHeroTitle:"idx_hero_title" };                 // \n → <br>
    var PARAS = { idxWhoBody:"idx_who_body" };                  // \n\n → <p>
    var LEAD = { idxWhy:"idx_why" };                            // \n\n → <p class="lead">
    var LIST = { idxPain:"idx_pain", idxNotfit:"idx_notfit" };  // строка → <li>
    var keys = [], els = {};
    [TEXT, IMG, BR, PARAS, LEAD, LIST].forEach(function (mp) {
      Object.keys(mp).forEach(function (id) { var e = document.getElementById(id); if (e) { els[id] = e; keys.push(mp[id]); } });
    });
    if (!keys.length) return;
    SB.select("valya_settings?select=key,value&key=in.(" + keys.join(",") + ")")
      .then(function (rows) {
        var m = {}; (rows || []).forEach(function (r) { m[r.key] = r.value; });
        Object.keys(TEXT).forEach(function (id) { if (els[id] && m[TEXT[id]] != null) els[id].textContent = m[TEXT[id]]; });
        Object.keys(IMG).forEach(function (id) { if (els[id] && m[IMG[id]]) els[id].src = m[IMG[id]]; });
        Object.keys(BR).forEach(function (id) { if (els[id] && m[BR[id]] != null) els[id].innerHTML = SB.esc(m[BR[id]]).replace(/\n/g, "<br>"); });
        Object.keys(PARAS).forEach(function (id) { if (els[id] && m[PARAS[id]] != null) els[id].innerHTML = SB.paras(m[PARAS[id]]); });
        Object.keys(LEAD).forEach(function (id) { if (els[id] && m[LEAD[id]] != null) els[id].innerHTML = String(m[LEAD[id]]).split(/\n{2,}/).map(function (p) { return '<p class="lead">' + SB.esc(p).replace(/\n/g, "<br>") + "</p>"; }).join(""); });
        Object.keys(LIST).forEach(function (id) { if (els[id] && m[LIST[id]] != null) els[id].innerHTML = String(m[LIST[id]]).split(/\n+/).filter(function (x) { return x.trim(); }).map(function (li) { return "<li>" + SB.esc(li) + "</li>"; }).join(""); });
      })
      .catch(function () {});
  }

  function renderAll() { renderReviews(); renderPosts(); renderAbout(); renderSettings(); }

  window.SB = SB;
  if (document.readyState !== "loading") renderAll();
  else document.addEventListener("DOMContentLoaded", renderAll);
})();
