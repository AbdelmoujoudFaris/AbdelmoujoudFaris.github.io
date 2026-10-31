(function () {
  "use strict";

  var docEl = document.documentElement;
  var THEME_KEY = "af-theme";
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------- theme ---------------------------- */
  function applyTheme(theme, persist) {
    docEl.setAttribute("data-theme", theme);
    var btn = document.getElementById("theme-toggle");
    if (btn) {
      var dark = theme === "dark";
      btn.setAttribute("aria-pressed", dark ? "true" : "false");
      btn.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
    }
    if (persist) {
      try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* storage disabled */ }
    }
  }

  function initTheme() {
    var stored = null;
    try { stored = localStorage.getItem(THEME_KEY); } catch (e) { /* ignore */ }
    applyTheme(stored === "dark" ? "dark" : "light", false);

    var btn = document.getElementById("theme-toggle");
    if (btn) {
      btn.addEventListener("click", function () {
        var next = docEl.getAttribute("data-theme") === "dark" ? "light" : "dark";
        applyTheme(next, true);
      });
    }
  }

  /* ---------------------------- mobile nav ---------------------------- */
  function initNav() {
    var burger = document.getElementById("nav-burger");
    var nav = document.getElementById("site-nav");
    if (!burger || !nav) return;

    function close() {
      nav.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
      burger.setAttribute("aria-label", "Open menu");
    }

    burger.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) close();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") close();
    });

    document.addEventListener("click", function (event) {
      if (!nav.classList.contains("is-open")) return;
      if (nav.contains(event.target) || burger.contains(event.target)) return;
      close();
    });
  }

  /* ---------------------------- current page ---------------------------- */
  function initCurrentPage() {
    var links = Array.prototype.slice.call(document.querySelectorAll("[data-nav-id]"));
    if (!links.length) return;

    var path = window.location.pathname.replace(/\/+$/, "") || "/";
    var active = null;

    links.forEach(function (link) {
      var href = link.getAttribute("href") || "";
      href = href.split("#")[0].replace(/\/+$/, "") || "/";
      if (href === path) active = link;
      if (href === "/about" && path === "/") active = link;
    });

    links.forEach(function (link) {
      var isActive = link === active;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  /* ---------------------------- direct hash ---------------------------- */
  function initHashScroll() {
    if (!window.location.hash) return;
    var target = document.getElementById(window.location.hash.slice(1));
    if (!target) return;

    function scrollToTarget() {
      target.scrollIntoView({ block: "start", behavior: prefersReduced ? "auto" : "smooth" });
    }

    window.addEventListener("load", function () {
      window.setTimeout(scrollToTarget, 40);
    });
  }

  /* ---------------------------- direct hash ---------------------------- */
  function initHashScroll() {
    if (!window.location.hash) return;
    var target = document.getElementById(window.location.hash.slice(1));
    if (!target) return;

    function scrollToTarget() {
      target.scrollIntoView({ block: "start", behavior: prefersReduced ? "auto" : "smooth" });
    }

    window.addEventListener("load", function () {
      window.setTimeout(scrollToTarget, 40);
    });
  }

  /* ---------------------------- publications ---------------------------- */
  function initPublications() {
    var list = document.getElementById("pub-list");
    if (!list) return;

    var items = Array.prototype.slice.call(list.querySelectorAll(".pub-item"));
    var search = document.getElementById("pub-search");
    var year = document.getElementById("pub-year");
    var topic = document.getElementById("pub-topic");
    var sort = document.getElementById("pub-sort");
    var status = document.getElementById("pub-status");
    var empty = document.getElementById("pub-empty");
    var countEl = document.getElementById("pub-count");

    function normalise(value) {
      value = value || "";
      if (value.toLowerCase && value.toLowerCase().normalize) {
        return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      }
      return value.toLowerCase();
    }

    items.forEach(function (item) {
      item._searchText = normalise(item.getAttribute("data-search"));
      item._title = normalise(item.getAttribute("data-title"));
      item._year = item.getAttribute("data-year");
      item._category = item.getAttribute("data-category");
    });

    function apply() {
      var query = normalise(search ? search.value.trim() : "");
      var yearValue = year ? year.value : "";
      var topicValue = topic ? topic.value : "";
      var shown = 0;

      items.forEach(function (item) {
        var matches = (!query || item._searchText.indexOf(query) !== -1) &&
                      (!yearValue || item._year === yearValue) &&
                      (!topicValue || item._category === topicValue);
        item.hidden = !matches;
        if (matches) shown += 1;
      });

      var order = sort ? sort.value : "newest";
      var sorted = items.slice().sort(function (a, b) {
        if (order === "title") return a._title.localeCompare(b._title);
        var diff = parseInt(a._year, 10) - parseInt(b._year, 10);
        return order === "oldest" ? diff : -diff;
      });
      sorted.forEach(function (item) { list.appendChild(item); });

      if (status) {
        status.textContent = shown === items.length
          ? "Showing all " + items.length + " publications."
          : "Showing " + shown + " of " + items.length + " publications.";
      }
      if (countEl) countEl.textContent = items.length;
      if (empty) empty.hidden = shown !== 0;
    }

    var timer = null;
    if (search) {
      search.addEventListener("input", function () {
        window.clearTimeout(timer);
        timer = window.setTimeout(apply, prefersReduced ? 0 : 120);
      });
      search.addEventListener("search", apply);
    }
    [year, topic, sort].forEach(function (el) {
      if (el) el.addEventListener("change", apply);
    });

    apply();
  }

  /* ---------------------------- about: expand / collapse expertise ---------------------------- */
  function initExpertise() {
    var tools = document.querySelector("[data-xp-tools]");
    var groups = Array.prototype.slice.call(document.querySelectorAll("details.xp-group"));
    if (!tools || !groups.length) return;

    function make(label, open) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = label;
      btn.addEventListener("click", function () {
        groups.forEach(function (d) { d.open = open; });
      });
      tools.appendChild(btn);
    }

    make("Expand all", true);
    make("Collapse all", false);
  }

  /* ---------------------------- home: video modal ---------------------------- */
  function initVideoModal() {
    var links = Array.prototype.slice.call(document.querySelectorAll("[data-video]"));
    if (!links.length || typeof HTMLDialogElement === "undefined") return;

    var dialog = document.createElement("dialog");
    dialog.className = "video-modal";
    dialog.setAttribute("aria-label", "Video player");
    var close = document.createElement("button");
    close.type = "button";
    close.className = "video-modal__close";
    close.setAttribute("aria-label", "Close video");
    close.innerHTML = "&times;";
    var frame = document.createElement("div");
    frame.className = "video-modal__frame";
    dialog.appendChild(close);
    dialog.appendChild(frame);
    document.body.appendChild(dialog);

    function open(link, id) {
      var iframe = document.createElement("iframe");
      iframe.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0";
      iframe.title = link.getAttribute("aria-label").replace("Play video: ", "");
      iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
      iframe.allowFullscreen = true;
      frame.appendChild(iframe);
      dialog.showModal();
    }

    function shut() {
      if (dialog.open) dialog.close();
    }

    dialog.addEventListener("close", function () { frame.innerHTML = ""; });
    close.addEventListener("click", shut);
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) shut();
    });

    links.forEach(function (link) {
      link.addEventListener("click", function (event) {
        if (event.metaKey || event.ctrlKey || event.shiftKey) return;
        event.preventDefault();
        open(link, link.getAttribute("data-video"));
      });
    });
  }

  /* ---------------------------- home: muted autoplay of the hero video ---------------------------- */
  function initHeroVideo() {
    var frame = document.querySelector("iframe[data-autoplay-src]");
    if (!frame || prefersReduced) return;
    frame.src = frame.getAttribute("data-autoplay-src");
  }

  /* ---------------------------- boot ---------------------------- */
  function boot() {
    initTheme();
    initNav();
    initCurrentPage();
    initHashScroll();
    initPublications();
    initExpertise();
    initVideoModal();
    initHeroVideo();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
