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
    if (stored === "dark" || stored === "light") {
      applyTheme(stored, false);
    } else {
      var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      applyTheme(prefersDark ? "dark" : "light", false);
    }
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
  }

  /* ---------------------------- scrollspy ---------------------------- */
  function initScrollspy() {
    var links = Array.prototype.slice.call(document.querySelectorAll("[data-nav-id]"));
    if (!links.length || !("IntersectionObserver" in window)) return;

    var byId = {};
    var sections = [];
    links.forEach(function (link) {
      var id = link.getAttribute("data-nav-id");
      var section = document.getElementById(id);
      if (section) {
        byId[id] = link;
        sections.push(section);
      }
    });
    if (!sections.length) return;

    var visible = {};
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        visible[entry.target.id] = entry.isIntersecting ? entry.intersectionRatio : 0;
      });
      var bestId = null;
      var bestRatio = 0;
      Object.keys(visible).forEach(function (id) {
        if (visible[id] > bestRatio) { bestRatio = visible[id]; bestId = id; }
      });
      links.forEach(function (link) { link.classList.remove("is-active"); });
      if (bestId && byId[bestId]) byId[bestId].classList.add("is-active");
    }, { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.2, 0.5, 1] });

    sections.forEach(function (section) { observer.observe(section); });
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
      return (value || "").toLowerCase().normalize ? (value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : (value || "").toLowerCase();
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
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  function boot() {
    initTheme();
    initNav();
    initScrollspy();
    initPublications();
  }
})();
