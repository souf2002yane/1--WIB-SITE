/* =====================================================================
   SEH WORLD - shared extras (loaded on every page, does not change your
   existing code). Contains:
   1. HTTPS fallback            5. Form validation (client side)
   2. Cookie / storage banner   6. Cloudflare Turnstile (anti-spam)
   3. Plausible analytics       7. Dark-mode toggle button
   4. Legal footer links

   SERVER-SIDE VALIDATION (important): everything in this file runs in the
   visitor's browser, so a bot or a technical user can skip it. This site has
   no backend and only saves data in the visitor's own localStorage, so
   nothing here can be abused to reach a server. The day you add a backend
   (Cloudflare Worker, Netlify function, etc.) you MUST re-check every field
   there too (length, format, allowed characters) and verify the Turnstile
   token by calling https://challenges.cloudflare.com/turnstile/v0/siteverify
   with your SECRET key (the secret key must never be put in this file).
   ===================================================================== */
window.SEH_CONFIG = window.SEH_CONFIG || {
  // Cloudflare Turnstile PUBLIC site key (safe to be here). Leave "" until
  // you create the widget at https://dash.cloudflare.com/?to=/:account/turnstile
  turnstileSiteKey: "",
  // Domain registered in your Plausible account
  plausibleDomain: "souf2002yane.github.io"
};

(function () {
  "use strict";
  var CFG = window.SEH_CONFIG;

  /* ---------- tiny safe localStorage helpers ---------- */
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }

  /* ---------- 1. HTTPS fallback (GitHub Pages also has "Enforce HTTPS") ---------- */
  if (location.protocol === "http:" && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") {
    location.replace("https://" + location.host + location.pathname + location.search + location.hash);
    return;
  }

  /* ---------- 3. Plausible (cookie-free analytics), only after consent ---------- */
  function loadPlausible() {
    if (document.getElementById("plausible-js") || !CFG.plausibleDomain) return;
    var s = document.createElement("script");
    s.id = "plausible-js";
    s.defer = true;
    s.setAttribute("data-domain", CFG.plausibleDomain);
    s.src = "https://plausible.io/js/script.js";
    document.head.appendChild(s);
  }

  /* ---------- 2. Cookie / storage banner ---------- */
  var KEY = "seh_cookie_consent";
  function closeBanner() {
    var b = document.getElementById("sehCookieBanner");
    if (b) b.parentNode.removeChild(b);
  }
  function choose(value) {
    lsSet(KEY, value);
    closeBanner();
    if (value === "accepted") loadPlausible();
  }
  function showBanner() {
    if (document.getElementById("sehCookieBanner")) return;
    var d = document.createElement("div");
    d.id = "sehCookieBanner";
    d.className = "seh-cookie";
    d.setAttribute("role", "dialog");
    d.setAttribute("aria-live", "polite");
    d.setAttribute("aria-label", "Cookie and storage notice");
    d.innerHTML =
      '<p><strong>Your privacy matters.</strong> This site saves your profile, points and theme only on your own device (browser storage). ' +
      'With your permission it also uses Plausible, a statistics tool that uses <u>no cookies</u> and collects no personal data. ' +
      'Details in our <a href="PRIVACY.html">Privacy Policy</a> (Moroccan law 09-08).</p>' +
      '<div class="seh-cookie-btns">' +
      '<button type="button" id="sehCookieRefuse" class="seh-cookie-refuse">Refuse</button>' +
      '<button type="button" id="sehCookieAccept" class="seh-cookie-accept">Accept</button>' +
      '</div>';
    document.body.appendChild(d);
    document.getElementById("sehCookieAccept").addEventListener("click", function () { choose("accepted"); });
    document.getElementById("sehCookieRefuse").addEventListener("click", function () { choose("refused"); });
  }

  /* ---------- 5. Validation helpers ---------- */
  var V = {
    name: function (s) { return /^[A-Za-z\u00C0-\u024F\u0600-\u06FF][A-Za-z\u00C0-\u024F\u0600-\u06FF '\-]{1,49}$/.test(s); },
    email: function (s) { return s.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s); },
    phone: function (s) { return /^0[567]\d{8}$/.test(s); },          // Moroccan mobile/landline: 05/06/07 + 8 digits
    age: function (s) { var n = Number(s); return s !== "" && Number.isInteger(n) && n >= 5 && n <= 120; },
    pass: function (s) { return s.length >= 8 && s.length <= 64 && /[A-Za-z\u00C0-\u024F\u0600-\u06FF]/.test(s) && /\d/.test(s); }
  };
  function val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ""; }
  var PASS_MSG = "Password must be 8-64 characters and contain at least one letter and one number 🔒";

  function showMsg(id, msg) {
    var el = document.getElementById(id);
    if (el) { el.style.display = "block"; el.textContent = msg; } else { alert(msg); }
  }
  function mark(ids, bad) {
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.classList.toggle("error", id === bad);
    });
  }

  /* ---------- 6. Cloudflare Turnstile ---------- */
  var tsReady = false, tsQueue = [];
  function renderTurnstile() {
    var holders = document.querySelectorAll(".seh-turnstile");
    for (var i = 0; i < holders.length; i++) {
      if (holders[i]._tsId === undefined && window.turnstile) {
        holders[i]._tsId = window.turnstile.render(holders[i], { sitekey: CFG.turnstileSiteKey, theme: "light" });
      }
    }
  }
  function initTurnstile() {
    if (!CFG.turnstileSiteKey || !document.querySelector(".seh-turnstile")) return;
    var s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true; s.defer = true;
    s.onload = function () { tsReady = true; renderTurnstile(); };
    document.head.appendChild(s);
  }
  // true when no key is configured (feature off) or when the visitor solved the challenge
  function turnstileOk(scopeId) {
    if (!CFG.turnstileSiteKey) return true;
    var scope = document.getElementById(scopeId);
    var holder = scope && scope.querySelector(".seh-turnstile");
    if (!holder) return true;
    if (!window.turnstile || holder._tsId === undefined) return false;
    return !!window.turnstile.getResponse(holder._tsId);
  }
  function resetTurnstile(scopeId) {
    var scope = document.getElementById(scopeId);
    var holder = scope && scope.querySelector(".seh-turnstile");
    if (holder && window.turnstile && holder._tsId !== undefined) window.turnstile.reset(holder._tsId);
  }

  /* wrap an existing global function with a validator (original code is kept) */
  function wrap(fnName, validator) {
    var original = window[fnName];
    if (typeof original !== "function") return;
    window[fnName] = function () {
      if (validator.apply(this, arguments) === false) return;
      return original.apply(this, arguments);
    };
  }

  function setupInfoForms() {
    /* Register - step 1 */
    wrap("goToStep2", function () {
      var ids = ["userName", "userFamily", "userPhone", "userAge", "userEmail", "userPass"];
      var fail = function (id, msg) { mark(ids, id); showMsg("errorMsg", msg); return false; };
      if (!V.name(val("userName"))) return fail("userName", "Please enter a valid first name (2-50 letters) ❌");
      if (val("userFamily") && !V.name(val("userFamily"))) return fail("userFamily", "Please enter a valid family name (letters only) ❌");
      if (!V.phone(val("userPhone"))) return fail("userPhone", "Phone must be 10 digits and start with 05, 06 or 07 📞");
      if (!V.age(val("userAge"))) return fail("userAge", "Please enter a valid age (5 to 120) ❌");
      if (!V.email(val("userEmail"))) return fail("userEmail", "Please enter a valid email address ❌");
      var pass = document.getElementById("userPass").value;
      if (!V.pass(pass)) return fail("userPass", PASS_MSG);
      if (val("userAbout").length > 200) return fail("userAbout", "'More information' is limited to 200 characters ❌");
      if (val("userAddress").length > 100) return fail("userAddress", "Address is limited to 100 characters ❌");
      if (!turnstileOk("step1")) return fail(null, "Please complete the security check first 🛡️");
      mark(ids, null);
      resetTurnstile("step1");
    });
    /* Login */
    wrap("doLogin", function () {
      var email = val("loginEmail");
      if (!V.email(email)) { showMsg("loginError", "Please enter a valid email address ❌"); return false; }
      if (!document.getElementById("loginPass").value) { showMsg("loginError", "Please enter your password ❌"); return false; }
      if (!turnstileOk("loginBox")) { showMsg("loginError", "Please complete the security check first 🛡️"); return false; }
      resetTurnstile("loginBox");
    });
    /* Reset password */
    wrap("saveNewPass", function () {
      if (!V.email(val("resetEmail"))) { alert("Please enter a valid email address ❌"); return false; }
      if (!V.pass(document.getElementById("newPass").value)) { alert(PASS_MSG); return false; }
    });
    /* Photo upload: only images, max 1.5 MB (it is stored in localStorage) */
    wrap("changePhoto", function (e) {
      var f = e && e.target && e.target.files && e.target.files[0];
      if (!f) return;
      if (!/^image\/(png|jpe?g|webp|gif)$/.test(f.type)) { alert("Please choose a PNG, JPG, WEBP or GIF image ❌"); e.target.value = ""; return false; }
      if (f.size > 1.5 * 1024 * 1024) { alert("Image is too big. Maximum size is 1.5 MB ❌"); e.target.value = ""; return false; }
    });
  }

  function setupIndexForm() {
    var box = document.getElementById("signBox");
    if (!box) return;
    var enter = box.querySelector("button");           // the green "Enter" button
    var buttons = box.querySelectorAll("button");
    for (var i = 0; i < buttons.length; i++) {
      if (/enter/i.test(buttons[i].textContent)) enter = buttons[i];
    }
    if (!enter) return;
    enter.addEventListener("click", function (e) {
      var n = (document.getElementById("signName") || {}).value || "";
      var p = (document.getElementById("signPass") || {}).value || "";
      var msg = "";
      if (!V.name(n.trim())) msg = "Please enter a valid name (2-50 letters) ❌";
      else if (!V.pass(p)) msg = PASS_MSG;
      else if (!turnstileOk("signBox")) msg = "Please complete the security check first 🛡️";
      if (msg) { e.preventDefault(); e.stopImmediatePropagation(); alert(msg); }
      else resetTurnstile("signBox");
    }, true);
  }

  function setupGameInputs() {
    /* Player names: max 20 chars, no HTML-special characters */
    document.addEventListener("input", function (e) {
      var t = e.target;
      if (t && t.matches && t.matches(".players input")) {
        t.value = t.value.replace(/[<>"'`&]/g, "").slice(0, 20);
      }
    });
  }

  /* ---------- 7. Dark-mode toggle ---------- */
  function setupThemeToggle() {
    if (document.body.classList.contains("about-page") || document.body.classList.contains("p404")) return;
    if (document.getElementById("themeToggle") || document.getElementById("sehThemeBtn")) return;
    var b = document.createElement("button");
    b.id = "sehThemeBtn";
    b.type = "button";
    b.className = "toggle-btn seh-theme-btn";
    b.setAttribute("aria-label", "Switch between light and dark mode");
    b.innerHTML = '<span class="icon sun">☀️</span><span class="icon moon">🌙</span>';
    document.body.appendChild(b);
    if (lsGet("theme") === "dark") document.body.classList.add("dark");
    b.addEventListener("click", function () {
      document.body.classList.toggle("dark");
      lsSet("theme", document.body.classList.contains("dark") ? "dark" : "light");
    });
  }

  /* ---------- boot ---------- */
  function boot() {
    var c = lsGet(KEY);
    if (c === "accepted") loadPlausible();
    else if (c !== "refused") showBanner();

    var link = document.getElementById("sehCookieSettings");
    if (link) link.addEventListener("click", function (e) { e.preventDefault(); lsSet(KEY, ""); showBanner(); });

    setupInfoForms();
    setupIndexForm();
    setupGameInputs();
    setupThemeToggle();
    initTurnstile();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
