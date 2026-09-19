/* Light motion for /workshops/.
   Progressive enhancement on purpose: the page is fully readable with this file
   blocked or JS off — nothing starts hidden in CSS unless `.js-motion` is set
   here first. No scroll-pinning and no horizontal card track: this page has to
   work for someone who arrived straight from a search result, not someone who
   has ridden the homepage acts down to it.
   D-037: scroll/decorative motion uses system ease, never a bounce. */
(() => {
  "use strict";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduce.matches || !("IntersectionObserver" in window)) return;

  document.documentElement.classList.add("js-motion");

  const targets = [...document.querySelectorAll("[data-rise]")];
  const reveal = (el) => el.classList.add("is-in");

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      reveal(entry.target);
      io.unobserve(entry.target);
    }
  }, { rootMargin: "0px 0px -12% 0px", threshold: 0.15 });

  targets.forEach((el, i) => {
    // a short stagger inside each group, capped so nothing waits noticeably
    el.style.setProperty("--rise-delay", `${Math.min(i % 6, 5) * 55}ms`);
    // Anything already on screen at load reveals now rather than waiting for the
    // observer's first callback — the hero must never animate in late.
    const box = el.getBoundingClientRect();
    if (box.top < window.innerHeight * 0.92) reveal(el);
    else io.observe(el);
  });

  /* FAILSAFE. Decoration must never be able to hide content. If the observer
     does not fire — a background tab, a hidden pane, an offscreen render, a
     browser quirk — everything still on hold is revealed anyway. Motion is a
     bonus; reading the page is not. */
  window.setTimeout(() => {
    targets.forEach(reveal);
    io.disconnect();
  }, 2500);

  // If the reader turns reduced-motion on mid-visit, stop hiding anything.
  reduce.addEventListener?.("change", (e) => {
    if (e.matches) document.documentElement.classList.remove("js-motion");
  });
})();
