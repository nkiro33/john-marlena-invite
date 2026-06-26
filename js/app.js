/* ============================================================
   John & Marlena — invitation behaviour
   ============================================================ */
(function () {
  "use strict";

  var CFG = window.CONFIG || {};

  /* ---------- 1. Apply location links (Page 4) ---------- */
  function applyLinks() {
    var loc = CFG.LOCATIONS || {};
    var church = document.getElementById("locChurch");
    var venue = document.getElementById("locVenue");
    if (church) church.href = loc.church || "#";
    if (venue) venue.href = loc.venue || "#";
  }

  /* ---------- 2. Swap in the full page images (over the blurred preview) ----------
     Each image is invisible until it finishes loading, then fades in over its
     low-quality preview. Full images are usually already cached by preloadFullPages(),
     so on a good line this is instant; on a poor line the blurred preview shows
     until the real image arrives. */
  function lazyLoad() {
    var imgs = document.querySelectorAll(".page-img[data-src]");
    imgs.forEach(function (img) {
      var reveal = function () { img.classList.add("loaded"); };
      img.addEventListener("load", reveal, { once: true });
      img.addEventListener("error", reveal, { once: true }); // never leave it blurred forever
      img.src = img.getAttribute("data-src");
      img.removeAttribute("data-src");
      if (img.complete && img.naturalWidth) reveal();        // cache hit (sync)
    });
  }

  /* ---------- 3. Reveal pages on scroll ---------- */
  function setupScrollReveal() {
    var wraps = document.querySelectorAll(".page-wrap");
    if (!("IntersectionObserver" in window)) {
      wraps.forEach(function (w) { w.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    wraps.forEach(function (w) { io.observe(w); });
  }

  /* ---------- 3b. Preload + ready gate ----------
     The seal can be tapped only once the envelope is fully drawn AND the tiny
     page previews are in (a second or two). At that moment every full-resolution
     page starts downloading in the background, so they are ready — or nearly so —
     by the time a guest taps. A safety timeout guarantees a single stuck asset
     can never lock anyone out of the invitation. */
  var ready = false;

  function markReady() {
    if (ready) return;
    ready = true;
    var env = document.getElementById("envelope");
    if (env) env.classList.remove("env-loading"); // reveal the complete envelope + seal + hint
    preloadFullPages();                            // begin streaming the big pages in
  }

  // warm the browser cache with the full-res pages so lazyLoad() is instant on open
  function preloadFullPages() {
    document.querySelectorAll(".page-img[data-src]").forEach(function (img) {
      var pre = new Image();
      pre.src = img.getAttribute("data-src");
    });
  }

  // resolve `done` once every item (an <img> element or a URL string) has settled
  function trackLoad(list, done) {
    var remaining = list.length;
    if (!remaining) { done(); return; }
    var tick = function () { if (--remaining <= 0) done(); };
    list.forEach(function (item) {
      if (typeof item === "string") {
        var im = new Image();
        im.onload = im.onerror = tick;
        im.src = item;
      } else if (item.complete && item.naturalWidth) {
        tick();
      } else {
        item.addEventListener("load", tick, { once: true });
        item.addEventListener("error", tick, { once: true });
      }
    });
  }

  function startLoading() {
    var gate = [].slice.call(document.querySelectorAll(".env-layer")); // body + shadow + flap
    var previews = ["page2", "page3", "page4", "page5"].map(function (p) {
      return "assets/" + p + "-lq.jpg";
    });
    trackLoad(gate.concat(previews), markReady);
    setTimeout(markReady, 9000); // safety net: never trap a guest behind a stuck asset
  }

  /* ---------- 4. Envelope opening sequence ---------- */
  var opened = false;
  function openEnvelope() {
    if (opened || !ready) return; // ignore taps until the envelope + previews are ready
    opened = true;

    startMusic();                     // the tap is a user gesture, so audio may play with sound

    var env = document.getElementById("envelope");
    var flash = document.getElementById("flash");

    lazyLoad();                       // start fetching pages 2–5

    // reduced-motion users get a quick, clean cross-fade (no flap / bloom to hide behind)
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      document.body.classList.remove("locked");
      document.body.classList.add("revealed");
      setupScrollReveal();
      setTimeout(function () {
        if (env && env.parentNode) env.style.display = "none";
      }, 400);
      return;
    }

    env.classList.add("opening");     // flap eases open a little, slowly

    // as the flap finishes opening, a soft warm light bloom rises from the seal
    // (bloom keyframes: fully opaque ~2300–2630ms, fades out by ~3200ms)
    setTimeout(function () { flash.classList.add("on"); }, 1700);

    // page 1 fades + scales in behind the bloom
    setTimeout(function () {
      document.body.classList.remove("locked");
      document.body.classList.add("revealed");
      setupScrollReveal();
    }, 2300);

    // hard-remove the envelope WHILE the bloom is fully opaque, so it can never
    // re-appear as the bloom clears — the bloom then dissolves to the page alone
    setTimeout(function () {
      env.classList.add("gone");
      if (env && env.parentNode) env.style.display = "none";
    }, 2480);

    setTimeout(function () {
      flash.classList.remove("on");
    }, 3300);
  }

  function bindEnvelope() {
    var env = document.getElementById("envelope");
    if (!env) return;
    env.addEventListener("click", openEnvelope);
    env.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openEnvelope(); }
    });
  }

  /* ---------- 4b. Background music ----------
     Started from openEnvelope() (a genuine tap), then gently faded up. The
     toggle lets guests mute/unmute at any time. */
  var MUSIC_VOLUME = 0.7;

  function startMusic() {
    var audio = document.getElementById("bgMusic");
    if (!audio) return;
    audio.volume = 0;                          // fade up from silence (ignored on iOS, which plays at system level)
    var p = audio.play();
    if (p && p.catch) p.catch(function () {});  // if a browser still blocks it, the mute button can start it
    var step = MUSIC_VOLUME / 30;               // ~1.5s fade
    var fade = setInterval(function () {
      var v = audio.volume + step;
      if (v >= MUSIC_VOLUME || audio.muted) { audio.volume = audio.muted ? audio.volume : MUSIC_VOLUME; clearInterval(fade); }
      else { audio.volume = v; }
    }, 50);
  }

  function bindAudio() {
    var audio = document.getElementById("bgMusic");
    var btn = document.getElementById("muteBtn");
    if (!audio || !btn) return;
    btn.addEventListener("click", function () {
      audio.muted = !audio.muted;
      btn.classList.toggle("muted", audio.muted);
      btn.setAttribute("aria-label", audio.muted ? "Unmute music" : "Mute music");
      if (!audio.muted && audio.paused) audio.play().catch(function () {}); // resume if it had been blocked
    });
  }

  /* ---------- 5. "Add another guest" toggles ---------- */
  function bindAddGuest() {
    document.querySelectorAll(".add-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var field = btn.closest(".field");
        field.classList.add("expanded");
        var input = field.querySelector("input");
        if (input) input.focus();
      });
    });
  }

  /* ---------- 6. Form submit → Google Sheets ---------- */
  function bindForm() {
    var form = document.getElementById("rsvpForm");
    if (!form) return;
    var status = document.getElementById("formStatus");
    var submitBtn = document.getElementById("submitBtn");

    function showStatus(msg, kind) {
      status.textContent = msg;
      status.className = "form-status show " + kind;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var g1 = (form.guest1.value || "").trim();
      if (!g1) { showStatus("Please enter at least one guest name.", "error"); return; }

      var endpoint = CFG.SHEETS_ENDPOINT || "";
      if (!endpoint || endpoint.indexOf("PASTE_") === 0) {
        showStatus("Form endpoint not configured yet.", "error");
        return;
      }

      var g2 = (form.guest2.value || "").trim();
      var g3 = (form.guest3.value || "").trim();

      var data = new URLSearchParams();
      data.append("guest1", g1);
      data.append("guest2", g2);
      data.append("guest3", g3);
      data.append("page", "RSVP");

      submitBtn.disabled = true;
      submitBtn.textContent = "SENDING…";

      function fail() {
        submitBtn.disabled = false;
        submitBtn.textContent = "SUBMIT";
        showStatus("We couldn’t confirm your reservation. Please try again later, or send us a private message.", "error");
      }

      // CORS mode (the form-urlencoded body is a "simple" request, so no preflight).
      // The endpoint returns Access-Control-Allow-Origin:*, so we can read the real
      // result and only confirm on a verified write — never a false success.
      fetch(endpoint, { method: "POST", body: data })
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          return res.json();
        })
        .then(function (out) {
          if (out && out.result === "success") {
            showSuccess([g1, g2, g3].filter(Boolean));
          } else {
            fail();
          }
        })
        .catch(fail);
    });
  }

  /* ---------- 7. Thank-you overlay (confirms the names) ---------- */
  function showSuccess(names) {
    var list = (names && names.length ? names : ["our guest"])
      .map(escapeHtml).join(" &middot; ");
    var el = document.createElement("div");
    el.className = "thankyou show";
    el.innerHTML =
      '<div class="ty-mono">John &amp; Marlena</div>' +
      '<div class="ty-rule"></div>' +
      "<h2>Thank You</h2>" +
      '<p class="ty-names">' + list + "</p>" +
      '<p class="ty-msg">Your reservation is confirmed. We can&rsquo;t wait to celebrate with you!</p>' +
      '<div class="ty-heart">&#10084;</div>';
    document.body.appendChild(el);
    document.body.classList.add("submitted");
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- init ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    applyLinks();
    bindEnvelope();
    bindAddGuest();
    bindForm();
    bindAudio();      // wire the mute / unmute toggle
    startLoading();   // preload assets, then unlock the seal when ready
  });
})();
