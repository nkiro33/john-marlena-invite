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

  /* ---------- 2. Lazy-load page images ---------- */
  function lazyLoad() {
    var imgs = document.querySelectorAll(".page-img[data-src]");
    imgs.forEach(function (img) {
      img.src = img.getAttribute("data-src");
      img.removeAttribute("data-src");
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

  /* ---------- 4. Envelope opening sequence ---------- */
  var opened = false;
  function openEnvelope() {
    if (opened) return;
    opened = true;

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

      fetch(endpoint, { method: "POST", mode: "no-cors", body: data })
        .then(function () {
          showSuccess([g1, g2, g3].filter(Boolean));
        })
        .catch(function () {
          // no-cors hides app errors; a thrown error here means a real network failure
          submitBtn.disabled = false;
          submitBtn.textContent = "SUBMIT";
          showStatus("Network error — please try again.", "error");
        });
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
  });
})();
