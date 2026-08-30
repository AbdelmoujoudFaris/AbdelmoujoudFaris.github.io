/* ==========================================================================
   Landing page behaviour: mobile nav toggle, scroll-spy active link, and a
   lightweight molecular/constellation canvas background. Vanilla JS only —
   the theme's dark-mode toggle (#theme-toggle / #theme-icon) is already
   wired up globally by assets/js/_main.js.
   ========================================================================== */

(() => {
  "use strict";

  /* Mobile nav toggle
     ------------------------------------------------------------------ */
  const burger = document.getElementById("lp-nav-burger");
  const navLinks = document.getElementById("lp-nav-links");

  if (burger && navLinks) {
    burger.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", String(isOpen));
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* Logo lightbox: click a small institution logo to view it larger
     ------------------------------------------------------------------ */
  const lightbox = document.getElementById("lp-lightbox");
  const lightboxImg = document.getElementById("lp-lightbox-img");

  if (lightbox && lightboxImg) {
    let lastTrigger = null;

    const openLightbox = (trigger) => {
      const img = trigger.querySelector("img");
      if (!img) return;
      lastTrigger = trigger;
      lightboxImg.src = img.src;
      lightboxImg.alt = trigger.getAttribute("aria-label") || "";
      lightbox.hidden = false;
      document.body.style.overflow = "hidden";
      lightbox.querySelector(".lp-lightbox__close").focus();
    };

    const closeLightbox = () => {
      lightbox.hidden = true;
      lightboxImg.src = "";
      document.body.style.overflow = "";
      if (lastTrigger) lastTrigger.focus();
    };

    document.querySelectorAll(".lp-timeline__logo").forEach((btn) => {
      btn.addEventListener("click", () => openLightbox(btn));
    });

    lightbox.querySelectorAll("[data-lightbox-close]").forEach((el) => {
      el.addEventListener("click", closeLightbox);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
    });
  }

  /* Scroll-spy: highlight the nav link for the section in view
     ------------------------------------------------------------------ */
  const sections = Array.from(document.querySelectorAll(".lp-section, .lp-hero"));
  const navLinkByStale = document.querySelectorAll(".lp-nav__link");

  if (sections.length && navLinkByStale.length && "IntersectionObserver" in window) {
    const linkMap = new Map();
    navLinkByStale.forEach((link) => linkMap.set(link.dataset.navId, link));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const link = linkMap.get(entry.target.id);
          if (!link) return;
          if (entry.isIntersecting) {
            navLinkByStale.forEach((l) => l.classList.remove("is-active"));
            link.classList.add("is-active");
          }
        });
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
    );

    sections.forEach((section) => {
      if (section.id) observer.observe(section);
    });
  }

  /* Constellation background
     ------------------------------------------------------------------ */
  const canvas = document.getElementById("lp-constellation");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let width = 0;
  let height = 0;
  let nodes = [];
  let rafId = null;
  let running = false;

  const getLineColor = () => getComputedStyle(document.documentElement).getPropertyValue("--lp-particle-line").trim() || "rgba(90, 70, 150, 0.16)";
  const getNodeColor = () => getComputedStyle(document.documentElement).getPropertyValue("--lp-particle-node").trim() || "rgba(90, 70, 150, 0.35)";

  const nodeCountFor = (w, h) => {
    const area = w * h;
    const density = window.innerWidth < 768 ? 22000 : 14000;
    return Math.max(18, Math.min(90, Math.round(area / density)));
  };

  const createNodes = () => {
    const count = nodeCountFor(width, height);
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
    }));
  };

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth = canvas.offsetWidth || window.innerWidth;
    height = canvas.clientHeight = canvas.offsetHeight || window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    createNodes();
  };

  const linkDistance = 130;

  const drawFrame = () => {
    ctx.clearRect(0, 0, width, height);

    const lineColor = getLineColor();
    const nodeColor = getNodeColor();

    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < linkDistance) {
          ctx.globalAlpha = 1 - dist / linkDistance;
          ctx.strokeStyle = lineColor;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    ctx.globalAlpha = 1;
    ctx.fillStyle = nodeColor;
    nodes.forEach((n) => {
      ctx.beginPath();
      ctx.arc(n.x, n.y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const step = () => {
    nodes.forEach((n) => {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > width) n.vx *= -1;
      if (n.y < 0 || n.y > height) n.vy *= -1;
    });
    drawFrame();
    if (running) rafId = requestAnimationFrame(step);
  };

  const start = () => {
    if (running) return;
    running = true;
    rafId = requestAnimationFrame(step);
  };

  const stop = () => {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  };

  resize();

  if (prefersReducedMotion) {
    drawFrame();
  } else {
    start();
  }

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      if (prefersReducedMotion) drawFrame();
    }, 150);
  });

  document.addEventListener("visibilitychange", () => {
    if (prefersReducedMotion) return;
    if (document.hidden) {
      stop();
    } else {
      start();
    }
  });
})();
