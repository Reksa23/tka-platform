/* =========================================================
   GERBANG PEMBAHASAN
   Hero scroll · Transisi antar-bab · Popup highlight · Reveal soal
   ========================================================= */

(() => {
  "use strict";

  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion:reduce)");

  const nav = $("nav");
  const hero = $(".gerbang");
  const chapters = $$(".bacaan");

  root.classList.add("js");

  let ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;

    requestAnimationFrame(() => {
      ticking = false;
      const y = Math.max(0, scrollY);
      const h = hero ? hero.offsetHeight : 600;
      const max = root.scrollHeight - innerHeight;

      root.style.setProperty("--p", Math.min(1, y / (h * 0.75)).toFixed(3));
      root.style.setProperty("--sp", max > 0 ? Math.min(1, y / max).toFixed(4) : "0");
      placeTip();
    });
  }

  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll, { passive: true });

  const currentId = () => {
    const id = decodeURIComponent(location.hash.slice(1));
    return chapters.some((c) => c.id === id) ? id : chapters[0]?.id;
  };

  function syncNav() {
    if (!nav) return;
    const id = currentId();
    let active = null;

    $$("a", nav).forEach((a) => {
      const on = a.getAttribute("href") === "#" + id;
      if (on) {
        a.setAttribute("aria-current", "page");
        active = a;
      } else {
        a.removeAttribute("aria-current");
      }
    });

    if (active) {
      nav.scrollTo({
        left: active.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2,
        behavior: reduce.matches ? "auto" : "smooth"
      });
    }
  }

  function goTo(id) {
    const from = chapters.findIndex((c) => c.id === currentId());
    const to = chapters.findIndex((c) => c.id === id);

    const apply = () => {
      hideTip();
      location.hash = id;
      syncNav();
    };

    if (!document.startViewTransition || reduce.matches) {
      apply();
      return;
    }

    root.style.setProperty("--d", to >= from ? 1 : -1);
    root.classList.add("vt");

    document.startViewTransition(apply).finished.finally(() => {
      root.classList.remove("vt");
    });
  }

  document.addEventListener("click", (e) => {
    const a = e.target.closest?.('a[href^="#"]');
    if (!a || e.button || e.metaKey || e.ctrlKey || e.shiftKey) return;

    const id = a.getAttribute("href").slice(1);
    if (!chapters.some((c) => c.id === id)) return;

    e.preventDefault();

    if (id === currentId() && location.hash === "#" + id) {
      document.getElementById(id)?.scrollIntoView({ behavior: reduce.matches ? "auto" : "smooth" });
      return;
    }

    goTo(id);
  });

  addEventListener("hashchange", () => {
    hideTip();
    syncNav();
  });

  syncNav();
  onScroll();

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      let n = 0;
      entries.forEach((entry) => {
        const el = entry.target;
        if (entry.isIntersecting) {
          if (!el.classList.contains("in")) {
            el.style.setProperty("--i", Math.min(n++, 5));
            el.classList.add("in");
          }
        } else if (!entry.boundingClientRect.width) {
          el.classList.remove("in");
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });

    $$(".soal").forEach((s) => io.observe(s));
  } else {
    $$(".soal").forEach((s) => s.classList.add("in"));
  }

  const MARGIN = 10;
  const GAP = 12;
  const NAV_OFFSET = 76;

  const tip = document.createElement("div");
  tip.className = "tip-float";
  tip.setAttribute("role", "tooltip");
  document.body.appendChild(tip);

  let cur = null;
  let pt = null;

  $$(".hl:not([tabindex])").forEach((h) => (h.tabIndex = 0));

  function placeTip() {
    if (!cur) return;
    const rects = cur.getClientRects();
    if (!rects.length) return hideTip();

    let r = rects[0];
    if (pt) {
      for (const q of rects) {
        if (pt.x >= q.left - 6 && pt.x <= q.right + 6 && pt.y >= q.top - 6 && pt.y <= q.bottom + 6) {
          r = q;
          break;
        }
      }
    }

    const w = tip.offsetWidth;
    const h = tip.offsetHeight;
    const cx = r.left + r.width / 2;
    const left = Math.min(Math.max(MARGIN, cx - w / 2), innerWidth - w - MARGIN);
    const below = r.top - h - GAP < NAV_OFFSET;
    const top = below ? r.bottom + GAP : r.top - h - GAP;
    const fresh = !tip.classList.contains("on");

    if (fresh) tip.style.transition = "none";
    tip.style.translate = `${left}px ${top}px`;
    tip.style.setProperty("--ax", `${Math.min(Math.max(18, cx - left), w - 18)}px`);
    tip.dataset.side = below ? "b" : "t";
    if (fresh) {
      void tip.offsetWidth;
      tip.style.transition = "";
    }
  }

  function showTip(h, e) {
    const src = $(".tip", h);
    if (!src) return;
    if (cur !== h) {
      tip.innerHTML = src.innerHTML;
      cur = h;
    }
    pt = e ? { x: e.clientX, y: e.clientY } : null;
    placeTip();
    tip.classList.add("on");
  }

  function hideTip() {
    cur = null;
    tip.classList.remove("on");
  }

  document.addEventListener("pointerover", (e) => {
    const h = e.target.closest?.(".hl");
    if (h) showTip(h, e);
  }, { passive: true });

  document.addEventListener("pointerout", (e) => {
    if (e.pointerType === "touch") return;
    const h = e.target.closest?.(".hl");
    if (h && !h.contains(e.relatedTarget)) hideTip();
  }, { passive: true });

  document.addEventListener("pointerdown", (e) => {
    if (!e.target.closest?.(".hl")) hideTip();
  }, { passive: true });

  document.addEventListener("focusin", (e) => {
    const h = e.target.closest?.(".hl");
    if (h) showTip(h);
  });

  document.addEventListener("focusout", (e) => {
    if (e.target.closest?.(".hl")) hideTip();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideTip();
  });
})();
