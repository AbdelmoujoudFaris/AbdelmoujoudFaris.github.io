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

  /* ---------------------------- boot ---------------------------- */
  function boot() {
    initTheme();
    initNav();
    initCurrentPage();
    initHashScroll();
    initPublications();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
