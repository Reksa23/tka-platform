(() => {
  "use strict";

  const reduce = matchMedia("(prefers-reduced-motion: reduce)");

  // Native cross-document View Transitions are preferred. This is only the
  // fallback for browsers that do not support them.
  document.addEventListener("click", (e) => {
    const link = e.target.closest?.("a[data-page-link]");
    if (!link || reduce.matches) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin) return;
    if ("startViewTransition" in document) return;

    e.preventDefault();
    document.documentElement.classList.add("page-leaving");
    setTimeout(() => { location.href = url.href; }, 420);
  });
})();
