/* Swapnil Dagliya — Fable 5 Motion Concept
   The choreographer: measures scroll, hands each scene its progress (--p),
   and lets CSS do the dancing. No libraries. */
(() => {
  "use strict";

  const root = document.documentElement;
  const body = document.body;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

  const progressBar = document.querySelector("#progressBar");
  const topbar = document.querySelector("#topbar");
  const topbarAct = document.querySelector("#topbarAct");
  const topbarContext = document.querySelector("#topbarContext");
  const menu = document.querySelector("#menu");
  const menuButton = document.querySelector("#menuButton");
  const main = document.querySelector("#content");

  const year = document.querySelector("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  // Start the show immediately; the scrolling provides the entrance choreography.
  body.classList.add("is-loaded", "is-settled");

  /* ---------------- Scene progress engine ---------------- */

  const scenes = [...document.querySelectorAll("[data-scene]")].map((el) => ({
    el,
    targets: [...el.querySelectorAll('.hero__depth, .hero__lights, .hero__eyebrow, .hero__line, .hero__dancer, .hero__note, .hero__cue, .hero__place, .nts-track, .bdy-figure, .inv-track, .inv-rail i, .watch__iris')],
    top: 0,
    span: 1,
    phases: Number(el.dataset.phases || 0),
    lastP: -1,
    lastPhase: -1
  }));

  const driftEls = [...document.querySelectorAll(".drift")].map((el) => {
    el.style.setProperty("--driftpx", `${Number(el.dataset.drift || 0) * 5}px`);
    return { el, lastE: 99 };
  });

  const inviteTrack = document.querySelector("#inviteTrack");
  const inviteViewport = inviteTrack?.parentElement;

  const measure = () => {
    const scrollY = window.scrollY;
    scenes.forEach((scene) => {
      const rect = scene.el.getBoundingClientRect();
      scene.top = rect.top + scrollY;
      scene.span = Math.max(1, scene.el.offsetHeight - scene.el.querySelector(".scene__pin").offsetHeight);
      // Keep the highlighted cutout inside the stage, including its 1.06 scale.
      scene.el.querySelectorAll(".bdy-figure").forEach(figure => {
        const width = figure.offsetWidth;
        const gutter = scene.el.clientWidth * .03;
        figure.style.setProperty("--cue-min", `${gutter - figure.offsetLeft + width * .03}px`);
        figure.style.setProperty("--cue-max", `${scene.el.clientWidth - gutter - figure.offsetLeft - width * 1.03}px`);
      });
    });
    if (inviteTrack && inviteViewport) {
      const shift = Math.max(0, inviteTrack.scrollWidth - inviteViewport.clientWidth);
      inviteTrack.style.setProperty("--shift", `${shift}px`);
    }
  };

  const clamp01 = (value) => Math.min(1, Math.max(0, value));

  const updateScenes = () => {
    const scrollY = window.scrollY;
    const vh = window.innerHeight;

    scenes.forEach((scene) => {
      if (scrollY + vh < scene.top - vh || scrollY > scene.top + scene.span + vh * 2) return;
      const p = clamp01((scrollY - scene.top) / scene.span);
      if (Math.abs(p - scene.lastP) > 0.0008) {
        scene.lastP = p;
        scene.el.style.setProperty("--p", p.toFixed(4));
        scene.targets.forEach(target => target.style.setProperty("--progress", p.toFixed(4)));
      }
      if (scene.phases) {
        const phase = Math.min(scene.phases - 1, Math.floor(p * scene.phases));
        if (phase !== scene.lastPhase) {
          scene.lastPhase = phase;
          scene.el.dataset.phase = String(phase);
        }
      }
    });

    driftEls.forEach((item) => {
      const rect = item.el.getBoundingClientRect();
      if (rect.bottom < -200 || rect.top > vh + 200) return;
      const e = Math.max(-1, Math.min(1, (rect.top + rect.height / 2 - vh / 2) / vh));
      if (Math.abs(e - item.lastE) > 0.004) {
        item.lastE = e;
        item.el.style.setProperty("--e", e.toFixed(3));
      }
    });
  };

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      const scrollMax = Math.max(1, root.scrollHeight - window.innerHeight);
      progressBar.style.transform = `scaleX(${clamp01(window.scrollY / scrollMax)})`;
      if (!reduceMotion.matches) updateScenes();
      ticking = false;
    });
  };

  let resizeTimer = 0;
  const onResize = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      measure();
      onScroll();
    }, 120);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("load", () => { measure(); onScroll(); });
  measure();
  onScroll();

  /* ---------------- Act tracking (house lights) ---------------- */

  const darkThemes = new Set(["dark"]);
  const acts = document.querySelectorAll("[data-act-name]");
  if ("IntersectionObserver" in window) {
    const actObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      const section = visible.target;
      body.dataset.act = section.id === "overture" ? "overture" : section.id;
      topbarAct.textContent = section.dataset.actName || "";
      topbarContext.textContent = section.dataset.context || "";
      const isInk = !darkThemes.has(section.dataset.theme);
      topbar.classList.toggle("is-ink", isInk && !menu.classList.contains("is-open"));
      body.classList.toggle(
        "spot-on",
        !isInk && finePointer.matches && !reduceMotion.matches
      );
    }, { rootMargin: "-38% 0px -48%", threshold: [0, 0.15, 0.4] });
    acts.forEach((section) => actObserver.observe(section));
  }

  /* ---------------- Follow spot ---------------- */

  const followspot = document.querySelector("#followspot");
  if (followspot && finePointer.matches && !reduceMotion.matches) {
    let targetX = -1000; let targetY = -1000;
    let spotX = -1000; let spotY = -1000;
    let spotRunning = false;

    const stepSpot = () => {
      spotX += (targetX - spotX) * 0.08;
      spotY += (targetY - spotY) * 0.08;
      followspot.style.transform = `translate3d(${spotX.toFixed(1)}px, ${spotY.toFixed(1)}px, 0)`;
      if (Math.abs(targetX - spotX) + Math.abs(targetY - spotY) > 0.5) {
        window.requestAnimationFrame(stepSpot);
      } else {
        spotRunning = false;
      }
    };

    window.addEventListener("pointermove", (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
      if (!spotRunning) {
        spotRunning = true;
        window.requestAnimationFrame(stepSpot);
      }
    }, { passive: true });
  }

  /* ---------------- Hero camera tilt (--mx/--my) ---------------- */

  const heroPin = document.querySelector("#hero");
  if (heroPin && finePointer.matches && !reduceMotion.matches) {
    let tiltPending = false;
    window.addEventListener("pointermove", (event) => {
      if (tiltPending) return;
      tiltPending = true;
      window.requestAnimationFrame(() => {
        heroPin.style.setProperty("--mx", ((event.clientX / window.innerWidth) * 2 - 1).toFixed(3));
        heroPin.style.setProperty("--my", ((event.clientY / window.innerHeight) * 2 - 1).toFixed(3));
        tiltPending = false;
      });
    }, { passive: true });
  }

  /* ---------------- Programme — scene-selection reel ----------------
     Scrolling scrubs the seven scenes. The scene engine above already sets
     data-phase (0..6) on #programme via data-phases="7", so this module just
     renders whatever phase the engine reports. */

  const srlFrame = document.querySelector("#srlFrame");
  const srlStrip = document.querySelector("#srlStrip");
  const srlSection = document.querySelector("#programme");

  if (srlFrame && srlStrip && srlSection) {
    const SCENES = [
      ["I",   "Learn with me, weekly", "Shoonya Dance Centre · Ghent","Nine classes a week, six forms, one studio.",                   "assets/swapnil-bhangra-001.jpg",              "62% 40%", "#classes"],
      ["II",  "Catch me live",         "Festivals · squares · stages","Festivals, street stages and theatre nights — come find me.",        "assets/swapnil-bollywood-001.jpg",            "50% 40%", "#live"],
      ["III", "Invite me to teach",    "60 min – 5 days",             "A taster, a masterclass, or a multi-day intensive.",            "assets/media/garba-crowd-poster.jpg",         "50% 38%", "#workshops", "assets/media/garba-crowd.mp4"],
      ["IV",  "Book a performance",    "Stage · sangeet · square",    "Or commission the choreography a room needs.",                  "assets/media/hero-loop-poster.jpg",           "50% 42%", "#stage", "assets/media/hero-loop.mp4"],
      ["V",   "Stay for dinner",       "Cookwithswapke",              "Vegetarian, generous — the interval is part of the show.",      "assets/cookwithswapke/complete-thali-1200.jpg","50% 50%", "#table"],
      ["∞",   "Just say hello",        "The form adapts",             "Tell me what you came for; the form does the rest.",            "assets/swapnil-gold-1000.jpg",                "50% 26%", "#hello"],
    ];
    const N = SCENES.length;
    const pad = (n) => String(n).padStart(2, "0");

    SCENES.forEach((o, i) => {
      const bg = document.createElement("div");
      bg.className = "srl__bg" + (i === 0 ? " is-on" : "");
      bg.style.backgroundImage = `url('${o[4]}')`;   // doubles as the video's poster
      bg.style.backgroundPosition = o[5];
      if (o[7]) {                                    // this scene plays a film
        bg.classList.add("srl__bg--video");
        const v = document.createElement("video");
        v.src = o[7];
        v.muted = true; v.loop = true; v.playsInline = true;
        v.preload = "metadata";                      // don't pull the file until it's needed
        v.setAttribute("aria-hidden", "true");
        bg.appendChild(v);
      }
      srlFrame.appendChild(bg);
    });
    srlStrip.innerHTML = SCENES.map((o, i) =>
      `<button class="srl__cell${i === 0 ? " is-on" : ""}" type="button" data-i="${i}" role="tab" aria-label="${o[1]}"><i>${o[0]}</i><img src="${o[4]}" alt="" style="object-position:${o[5]}" loading="lazy" decoding="async"></button>`
    ).join("");
    document.querySelector("#srlScrub").innerHTML = SCENES.map((_, i) => `<i class="${i === 0 ? "is-on" : ""}"></i>`).join("");

    const bgs = [...srlFrame.querySelectorAll(".srl__bg")];
    const cells = [...srlStrip.querySelectorAll(".srl__cell")];
    const dots = [...document.querySelectorAll("#srlScrub i")];
    const cap = document.querySelector("#srlCaption");
    const out = {
      chapter: document.querySelector("#srlChapter"),
      kicker: document.querySelector("#srlKicker"),
      title: document.querySelector("#srlTitle"),
      syn: document.querySelector("#srlSyn"),
      select: document.querySelector("#srlSelect"),
    };
    let current = -1;

    const showScene = (i) => {
      if (i === current || !SCENES[i]) return;
      const o = SCENES[i];
      bgs.forEach((b, j) => {
        const live = j === i;
        b.classList.toggle("is-on", live);
        const v = b.querySelector("video");        // only the on-screen scene plays
        if (v) { if (live && !reduceMotion.matches) { v.play().catch(() => {}); } else { v.pause(); } }
      });
      cells.forEach((c, j) => c.classList.toggle("is-on", j === i));
      dots.forEach((d, j) => d.classList.toggle("is-on", j === i));
      cap.classList.add("is-swapping");
      window.setTimeout(() => {
        out.chapter.textContent = `SCENE ${pad(i + 1)} / ${pad(N)}`;
        out.kicker.textContent = o[2];
        out.title.textContent = o[1];
        out.syn.textContent = o[3];
        out.select.setAttribute("href", o[6]);
        cap.classList.remove("is-swapping");
      }, 200);
      const cell = cells[i], rail = srlStrip.parentElement;
      const offset = cell.offsetLeft + cell.offsetWidth / 2 - rail.clientWidth / 2;
      srlStrip.style.transform =
        `translateX(${-Math.max(0, Math.min(offset, srlStrip.scrollWidth - rail.clientWidth))}px)`;
      current = i;
    };
    showScene(0);

    // the scene engine writes data-phase; mirror it into the reel
    new MutationObserver(() => showScene(Number(srlSection.dataset.phase || 0)))
      .observe(srlSection, { attributes: true, attributeFilter: ["data-phase"] });

    // tapping a frame previews that scene (the button below is what navigates)
    cells.forEach((cell, i) => {
      cell.addEventListener("click", () => {
        const span = srlSection.offsetHeight - window.innerHeight;
        window.scrollTo({
          top: srlSection.offsetTop + span * ((i + 0.5) / N),
          behavior: reduceMotion.matches ? "auto" : "smooth"
        });
      });
      cell.addEventListener("mouseenter", () => { if (finePointer.matches) showScene(i); });
    });
  }

  /* ---------------- Menu ---------------- */

  let menuOpenedFrom = null;
  const getMenuFocusables = () => [menuButton, ...menu.querySelectorAll("a[href]")].filter(Boolean);

  const setMenu = (open) => {
    menuButton.setAttribute("aria-expanded", String(open));
    menu.setAttribute("aria-hidden", String(!open));
    menu.classList.toggle("is-open", open);
    body.classList.toggle("menu-open", open);
    main?.toggleAttribute("inert", open);
    if (open) {
      topbar.classList.remove("is-ink");
      menuOpenedFrom = document.activeElement;
      window.setTimeout(() => getMenuFocusables()[1]?.focus(), 90);
    } else {
      if (menuOpenedFrom instanceof HTMLElement) menuOpenedFrom.focus();
      menuOpenedFrom = null;
    }
  };

  menuButton?.addEventListener("click", () => {
    setMenu(menuButton.getAttribute("aria-expanded") !== "true");
  });
  menu?.addEventListener("click", (event) => {
    if (event.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", (event) => {
    if (menuButton?.getAttribute("aria-expanded") !== "true") return;
    if (event.key === "Escape") {
      event.preventDefault();
      setMenu(false);
      return;
    }
    if (event.key === "Tab") {
      const focusables = getMenuFocusables();
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  /* ---------------- Reveals ---------------- */

  const revealItems = document.querySelectorAll(".reveal, .plate");
  if ("IntersectionObserver" in window && !reduceMotion.matches) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8%", threshold: 0.08 });
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  /* ---------------- Stage: video reel (native links; inline embed when hosted) ---------------- */

  const screenStage = document.querySelector("#screenStage");
  if (screenStage) {
    const screenTitle = document.querySelector("#screenTitle");
    const screenSub = document.querySelector("#screenSub");
    const screenLabel = document.querySelector("#screenNowLabel");
    const reelItems = [...document.querySelectorAll(".reel__item")];
    // YouTube blocks inline embeds from file:// (no web origin → error 153).
    // Hosted (http/https): intercept the link and play inline. Local file: let it open YouTube.
    const canEmbed = location.protocol !== "file:";
    let stageEl = screenStage;

    const setNow = (id, title, sub) => {
      reelItems.forEach((el) => el.classList.toggle("is-active", el.dataset.video === id));
      if (title != null && screenTitle) screenTitle.textContent = title;
      if (sub != null && screenSub) screenSub.textContent = sub;
    };

    const playInline = (id, title, sub) => {
      const frame = document.createElement("iframe");
      frame.className = "screen__frame";
      frame.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
      frame.title = `${title} — Swapnil Dagliya`;
      frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      frame.allowFullscreen = true;
      const wrap = document.createElement("div");
      wrap.className = "screen__stage screen__stage--playing";
      wrap.appendChild(frame);
      stageEl.replaceWith(wrap);
      stageEl = wrap;
      if (screenLabel) screenLabel.textContent = "Now playing";
      setNow(id, title, sub);
    };

    const select = (event, id, title, sub) => {
      setNow(id, title, sub);        // reflect the choice either way (fixes stale state on file://)
      if (!canEmbed) return;         // let the native link open YouTube in a new tab
      event.preventDefault();
      playInline(id, title, sub);
    };

    screenStage.addEventListener("click", (event) => {
      const meta = reelItems.find((el) => el.dataset.video === screenStage.dataset.video);
      const title = meta?.dataset.title || screenTitle?.textContent || "Swapnil Dagliya";
      const sub = meta?.dataset.sub != null ? meta.dataset.sub : (screenSub?.textContent || "");
      select(event, screenStage.dataset.video, title, sub);
    });
    reelItems.forEach((el) => el.addEventListener("click", (event) =>
      select(event, el.dataset.video, el.dataset.title, el.dataset.sub)));
  }

  /* ---------------- The eight doors (smart enquiry form) ---------------- */

  const enquiryForm = document.querySelector("#enquiryForm");
  const intentPrompt = document.querySelector("#intentPrompt");
  const smartGroups = [...document.querySelectorAll("[data-smart-for]")];
  const cameo = document.querySelector("#cameo");

  const defaultLabels = {
    place: "City / venue",
    date: "Date, if there is one",
    people: "People / level",
    format: "Format"
  };
  const defaultPlaceholders = {
    people: "20 beginners, 12 trained dancers, 300 festival humans…",
    format: "60 min, 2 days, showcase, lecture-demo…"
  };

  const intentCopy = {
    "Learn with you": {
      title: "Come to Shoonya. I’ll save you a count.",
      text: "Tell me what you have danced before and what you want to try. The timetable on Shoonya stays the official source.",
      labels: { people: "Dance experience / level" },
      placeholders: { people: "Beginner, rusty, Kathak curious, Bhangra hungry…" }
    },
    "Invite you to teach": {
      title: "Tell me about the room.",
      text: "Dance school, festival, team day, brave private group — I need the people, the level, the time, and how wild we are allowed to get.",
      labels: { place: "City / venue", date: "Date or window", people: "People / level", format: "Workshop format" },
      placeholders: {
        people: "20 beginners, 12 trained dancers, mixed festival crowd…",
        format: "60 min, 90 min, 2 days, lecture-demo, showcase…"
      }
    },
    "Book a performance": {
      title: "Stage, timing, audience. Then we move.",
      text: "Tell me what the event is and what you imagine: solo, group, ceremony, festival, or chaos-with-purpose.",
      labels: { place: "Venue / stage", date: "Event date", people: "Audience / context", format: "Performance format" },
      placeholders: {
        people: "Wedding guests, theatre audience, public square, corporate event…",
        format: "Solo, company, 10 min, 30 min, opening act…"
      }
    },
    "Build a festival moment": {
      title: "A festival needs more than a slot.",
      text: "Workshops, performances, participatory moments, hosting, programming — or the beautiful glue between them.",
      labels: { place: "Festival / city", date: "Festival dates", people: "Audience / participants", format: "What needs building?" },
      placeholders: {
        people: "Families, dancers, public crowd, school groups…",
        format: "Workshop series, stage moment, public dance, programme support…"
      }
    },
    "Commission choreography": {
      title: "What are we making move?",
      text: "A show, a group, a single impossible transition, a music video, a wedding sangeet, a school production. Give me the shape.",
      labels: { place: "City / rehearsal place", date: "Timeline", people: "Bodies involved", format: "Choreography need" },
      placeholders: {
        people: "Solo, 8 dancers, 40 students, family group…",
        format: "Stage piece, sangeet, video, school show…"
      }
    },
    "Shop": {
      title: "Which one caught your eye?",
      text: "The shop isn’t live yet — tell me what you’d buy and I’ll message you the moment it’s ready."
    },
    "Surprise you": {
      title: "Excellent. The weird door is my favourite door.",
      text: "Give me the useful context and I’ll figure out where to put the energy."
    }
  };

  const setGroupState = (group, hidden) => {
    group.classList.toggle("is-form-hidden", hidden);
    group.querySelectorAll("input, textarea, select").forEach((input) => {
      input.disabled = hidden;
    });
  };

  const playCameo = () => {
    if (!cameo || reduceMotion.matches) return;
    cameo.classList.remove("play");
    void cameo.offsetWidth;
    cameo.classList.add("play");
  };
  cameo?.addEventListener("animationend", () => cameo.classList.remove("play"));

  const updateIntentUI = (intent) => {
    const copy = intentCopy[intent];

    smartGroups.forEach((group) => {
      const allowed = group.dataset.smartFor.split(",").map((item) => item.trim());
      setGroupState(group, Boolean(intent) && !allowed.includes(intent));
    });

    Object.entries(defaultLabels).forEach(([field, label]) => {
      const target = enquiryForm?.querySelector(`[data-field-label="${field}"]`);
      if (target) target.textContent = (copy?.labels && copy.labels[field]) || label;
    });
    Object.entries(defaultPlaceholders).forEach(([field, placeholder]) => {
      const target = enquiryForm?.querySelector(`[name="${field}"]`);
      if (target) target.placeholder = (copy?.placeholders && copy.placeholders[field]) || placeholder;
    });

    if (intentPrompt) {
      intentPrompt.querySelector("strong").textContent = copy?.title || "Choose your doorway.";
      intentPrompt.querySelector("span").textContent = copy?.text || "The form re-choreographs itself around your answer.";
    }
  };

  enquiryForm?.querySelectorAll('input[name="intent"]').forEach((choice) => {
    choice.addEventListener("change", () => {
      updateIntentUI(choice.value);
      if (choice.value === "Surprise you") playCameo();
    });
  });
  updateIntentUI(enquiryForm?.querySelector('input[name="intent"]:checked')?.value || "");

  [...document.querySelectorAll("[data-select-intent]")].forEach((link) => {
    link.addEventListener("click", () => {
      const intent = link.dataset.selectIntent;
      const choice = document.querySelector(`#enquiryForm input[name="intent"][value="${CSS.escape(intent)}"]`);
      if (choice) {
        choice.checked = true;
        updateIntentUI(intent);
      }
      const product = link.dataset.product;
      if (product) {
        const message = enquiryForm?.querySelector('textarea[name="message"]');
        if (message && !message.value.trim()) {
          message.value = `I’d love the “${product}” when it’s ready — put me on the list?`;
        }
      }
    });
  });

  /* The ending. Nothing is transmitted from this page and no address is published on it:
     we compose the message, hand it over as copyable text, and point at the Shoonya
     contact form — which is the one channel that actually reaches Swapnil. */

  const enquiryDone = document.querySelector("#enquiryDone");
  const enquirySummary = document.querySelector("#enquirySummary");
  const enquiryCopy = document.querySelector("#enquiryCopy");
  const enquiryStatus = document.querySelector("#enquiryStatus");
  const enquiryHint = enquiryStatus?.textContent || "";

  enquiryForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!enquiryForm.reportValidity()) return;

    const data = new FormData(enquiryForm);
    const intent = String(data.get("intent") || "Website enquiry");
    const styles = data.getAll("style").map(String).filter(Boolean);
    const lines = [
      `Website enquiry — ${intent}`,
      "",
      "Hello Swapnil,",
      "",
      `I would like to: ${intent}`,
      `Useful flavours: ${styles.length ? styles.join(", ") : "Not specified"}`,
      `Name: ${data.get("name") || ""}`,
      `Email: ${data.get("email") || ""}`,
      `City / venue: ${data.get("place") || "Not specified"}`,
      `Date: ${data.get("date") || "Not specified"}`,
      `People / level: ${data.get("people") || "Not specified"}`,
      `Format: ${data.get("format") || "Not specified"}`,
      "",
      String(data.get("message") || "")
    ];
    const summary = lines.join("\n");

    if (!enquiryDone || !enquirySummary) return;
    enquirySummary.textContent = summary;
    enquiryForm.hidden = false;
    enquiryDone.hidden = false;

    if (enquiryStatus) {
      enquiryStatus.textContent = enquiryHint;
      enquiryStatus.classList.remove("is-copied");
    }

    enquiryDone.scrollIntoView({
      behavior: reduceMotion.matches ? "auto" : "smooth",
      block: "center"
    });
    window.setTimeout(() => enquiryDone.focus({ preventScroll: true }), reduceMotion.matches ? 0 : 420);
  });

  enquiryCopy?.addEventListener("click", async () => {
    const text = enquirySummary?.textContent || "";
    if (!text) return;

    let copied = false;
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
    } catch (error) {
      /* Older Safari / non-secure contexts: fall back to a selection + execCommand. */
      try {
        const range = document.createRange();
        range.selectNodeContents(enquirySummary);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        copied = document.execCommand("copy");
      } catch (fallbackError) {
        copied = false;
      }
    }

    if (!enquiryStatus) return;
    enquiryStatus.classList.toggle("is-copied", copied);
    enquiryStatus.textContent = copied
      ? "Copied. Now open the contact form and paste it into the message field."
      : "Copy didn’t take — select the text above and copy it by hand, then open the contact form.";
    window.setTimeout(() => {
      enquiryStatus.classList.remove("is-copied");
      enquiryStatus.textContent = enquiryHint;
    }, 6000);
  });

  /* Dev helper for audits: ?at=<sectionId>[@progress] scrolls straight to a
     scene state, e.g. ?at=body@0.5 lands mid-Act-I. Inert without the param. */
  const atParam = new URLSearchParams(window.location.search).get("at");
  if (atParam) {
    window.addEventListener("load", () => {
      window.setTimeout(() => {
        const [id, frac] = atParam.split("@");
        const target = document.getElementById(id);
        if (!target) return;
        const top = target.getBoundingClientRect().top + window.scrollY;
        const span = Math.max(0, target.offsetHeight - window.innerHeight);
        window.scrollTo({ top: top + span * (Number(frac) || 0), behavior: "instant" });
      }, 400);
    });
  }

  /* ---------------- Notes — the credit roll ----------------
     The track's translateY is driven by the engine's --p; this module pads the track so the
     first credit sits on the reader line at p=0 and the last at p=1, then lights whichever
     credit is crossing the line and ticks the giant year behind it. */
  const ntsRoll = document.querySelector("#ntsRoll");
  const ntsTrack = document.querySelector("#ntsTrack");
  const ntsYear = document.querySelector("#ntsYear");
  if (ntsRoll && ntsTrack && ntsYear) {
    const credits = [...ntsTrack.querySelectorAll(".nts-credit")];
    const YEARS = ["2005", "2009", "2008", "2012", "2013", "2011", "2017", "2017", "now", "2024"];
    const section = ntsRoll.closest("[data-scene]");
    let ntsLit = -1, ntsTick = false;

    const ntsMeasure = () => {
      if (reduceMotion.matches) { ntsTrack.style.paddingTop = "0px"; ntsTrack.style.paddingBottom = "0px"; return; }
      const rh = ntsRoll.clientHeight, first = credits[0], last = credits[credits.length - 1];
      ntsTrack.style.paddingTop = "0px"; ntsTrack.style.paddingBottom = "0px";
      const firstMid = first.offsetTop + first.offsetHeight / 2;
      const lastMid = last.offsetTop + last.offsetHeight / 2;
      ntsTrack.style.paddingTop = (rh / 2 - firstMid) + "px";
      ntsTrack.style.paddingBottom = (rh / 2) + "px";
      section.style.setProperty("--nts-travel", Math.max(0, lastMid - firstMid) + "px");
    };
    const ntsFrame = () => {
      if (reduceMotion.matches) { ntsTick = false; return; }
      const mid = ntsRoll.getBoundingClientRect().top + ntsRoll.clientHeight / 2;
      let best = 0, bestD = 1e9;
      credits.forEach((c, i) => { const b = c.getBoundingClientRect(); const d = Math.abs(b.top + b.height / 2 - mid); if (d < bestD) { bestD = d; best = i; } });
      if (best !== ntsLit) {
        credits.forEach((c, i) => c.classList.toggle("is-lit", i === best));
        ntsYear.textContent = YEARS[best]; ntsLit = best;
      }
      ntsTick = false;
    };
    {
      ntsMeasure();
      window.addEventListener("scroll", () => { if (!ntsTick) { ntsTick = true; window.requestAnimationFrame(ntsFrame); } }, { passive: true });
      window.addEventListener("resize", () => { ntsMeasure(); ntsFrame(); }, { passive: true });
      window.addEventListener("load", () => { ntsMeasure(); ntsFrame(); });
      ntsFrame();
    }
  }

  /* ---------------- Act II — the call sheet (build day columns) ---------------- */
  const p2Days = document.querySelector("#p2Days");
  if (p2Days) {
    const P2L = {
      bollyfolk: "https://www.shoonyadance.com/bollyfolk-danslessen-in-gent",
      yoga: "https://www.shoonyadance.com/yoga-lessen-in-gent",
      technique: "https://www.shoonyadance.com/indian-dance-in-belgium",
      bhangra: "https://www.shoonyadance.com/bhangra-danslessen-in-gent",
      semi: "https://www.shoonyadance.com/kathak-danslessen-in-gent",
      bollywood: "https://www.shoonyadance.com/bollywood-danslessen-in-gent",
    };
    // SOURCE OF TRUTH: Swapnil, direct. Nine classes / six forms / three days.
    const STARTER = "New? Enter via the 4-week Starter Series or a seasonal intensive.";
    const P2DAYS = [
      { name: "Tuesday", dow: 2, calls: [
        ["18:30", "Bollyfolk", "Film-dance joy, folk roots.", P2L.bollyfolk, "Level 2", false],
        ["19:35", "Yoga", "Breath, pranayama, a softer landing.", P2L.yoga, "Open level", true],
        ["20:40", "Indian Dance Technique", "Footwork, hands, rhythm — the grammar.", P2L.technique, "Open level", true]] },
      { name: "Wednesday", dow: 3, calls: [
        ["17:20", "Yoga", "Breath, pranayama, a softer landing.", P2L.yoga, "Open level", true],
        ["18:30", "Bollyfolk", "Film-dance joy, folk roots.", P2L.bollyfolk, "Open level", true],
        ["19:30", "Bhangra", "Shoulders up, mood up.", P2L.bhangra, "Level 2", false, STARTER],
        ["20:30", "Indian Semi-Classical", "Kathak vocabulary — a quieter thunder.", P2L.semi, "Level 2", false, STARTER]] },
      { name: "Thursday", dow: 4, calls: [
        ["18:30", "Bollywood", "Thumkas, mudras, no room for shy.", P2L.bollywood, "Level 2", false],
        ["19:30", "Bollywood", "Technique, timing, performance quality.", P2L.bollywood, "Level 3", false]] },
    ];
    const p2Today = new Date().getDay();
    p2Days.innerHTML = P2DAYS.map((d) => `
      <div class="p2-day${d.dow === p2Today ? " is-today" : ""}">
        <div class="p2-dayhead"><h3>${d.name}</h3><span>${d.dow === p2Today ? "Today" : d.calls.length + " calls"}</span></div>
        ${d.calls.map((c) => `<a class="p2-call${c[5] ? " is-open" : ""}" href="${c[3]}" target="_blank" rel="noopener noreferrer">
          <time>${c[0]}</time><strong>${c[1]}<b class="p2-lvl">${c[4]}</b></strong><small>${c[2]}${c[6] ? `<u class="p2-wayin">${c[6]}</u>` : ""}</small></a>`).join("")}
      </div>`).join("");
  }

  /* ---------------- Act IV — the folk showreel ----------------
     Four repertoire clips play as one continuous reel, each fetched only when reached,
     auto-advancing on `ended`, with a 4-chapter progress bar. Pauses when off screen. */
  const rlVideo = document.querySelector("#rlVideo");
  const rlScreen = document.querySelector("#rlScreen");
  const rlChapters = document.querySelector("#rlChapters");
  if (rlVideo && rlScreen && rlChapters) {
    const RL = [
      ["rajvaadi", "Rajvaadi Odhni", "Bollywood folk", "ABC — a bollywood company"],
      ["tippani", "Tippani", "Gujarat folk", "sticks, parasols, a live audience"],
      ["kalbeliya", "Kalbeliya", "Rajasthan folk", "ABC at Cultuurmarkt"],
      ["hojagiri", "Hojagiri", "Tripura folk", "balance is the whole trick"],
      ["ghoomar", "Ghoomar", "Rajasthan folk", "the skirt keeps the count"],
      ["garba", "Garba", "Gujarat folk", "the crowd is the choreography"],
    ];
    const rlTc = document.querySelector("#rlTc"), rlForm = document.querySelector("#rlForm"),
          rlTitle = document.querySelector("#rlTitle"), rlSub = document.querySelector("#rlSub");
    rlChapters.innerHTML = RL.map((r, i) =>
      `<button class="rl-chapter${i === 0 ? " is-on" : ""}" type="button" role="tab" data-i="${i}">
         <span class="rl-bar"><i></i></span><em>${r[1]}</em><small>${r[2]}</small></button>`).join("");
    const rlChips = [...rlChapters.querySelectorAll(".rl-chapter")];
    const rlPad = (n) => String(n).padStart(2, "0");
    let rlCur = -1;
    const rlPlay = (i, autoplay) => {
      const r = RL[i]; rlCur = i;
      rlChips.forEach((c, j) => { c.classList.toggle("is-on", j === i); c.classList.toggle("is-done", j < i);
        c.querySelector(".rl-bar i").style.width = j < i ? "100%" : "0%"; });
      rlTc.textContent = `REEL ${rlPad(i + 1)} / ${rlPad(RL.length)}`;
      rlForm.textContent = r[2]; rlTitle.textContent = r[1]; rlSub.textContent = r[3];
      rlVideo.poster = `assets/media/reel/${r[0]}.jpg`;
      rlVideo.src = `assets/media/reel/${r[0]}.mp4`;      // only this section is fetched
      if (autoplay !== false && !reduceMotion.matches) rlVideo.play().catch(() => {});
    };
    rlVideo.addEventListener("timeupdate", () => {
      if (!rlVideo.duration) return;
      const bar = rlChips[rlCur]?.querySelector(".rl-bar i");
      if (bar) bar.style.width = (rlVideo.currentTime / rlVideo.duration * 100).toFixed(1) + "%";
    });
    rlVideo.addEventListener("ended", () => rlPlay((rlCur + 1) % RL.length, true));
    rlChips.forEach((c, i) => c.addEventListener("click", () => rlPlay(i, true)));
    rlPlay(0, false);
    if ("IntersectionObserver" in window && !reduceMotion.matches) {
      new IntersectionObserver((es) => es.forEach((e) => {
        if (e.isIntersecting) rlVideo.play().catch(() => {}); else rlVideo.pause();
      }), { threshold: 0.35 }).observe(rlScreen);
    }
  }

  /* ---------------- Act III — lobby cards (per-card 3D tilt) ----------------
     The engine already sets --p on the section (so the track slides). This measures the
     scroll width into --inv-shift and tilts each card by its distance from screen centre. */
  const invTrack = document.querySelector("#invTrack");
  if (invTrack) {
    const invSection = invTrack.closest("[data-scene]");
    const invCards = [...invTrack.querySelectorAll(".inv-card")];
    const invClamp = (v, a, b) => Math.max(a, Math.min(b, v));
    let invTick = false;
    const invMeasure = () => {
      const viewport = invTrack.parentElement.clientWidth;
      invSection.style.setProperty("--inv-shift", Math.max(0, invTrack.scrollWidth - viewport) + "px");
    };
    const invFrame = () => {
      if (reduceMotion.matches) { invTick = false; return; }
      const mid = window.innerWidth / 2;
      invCards.forEach((c) => {
        const b = c.getBoundingClientRect();
        const t = invClamp(((b.left + b.width / 2) - mid) / (window.innerWidth * 0.55), -1.6, 1.6);
        c.style.setProperty("--t", t.toFixed(3));
        c.style.setProperty("--a", Math.min(1, Math.abs(t)).toFixed(3));
      });
      invTick = false;
    };
    invMeasure();
    window.addEventListener("scroll", () => { if (!invTick) { invTick = true; window.requestAnimationFrame(invFrame); } }, { passive: true });
    window.addEventListener("resize", () => { invMeasure(); invFrame(); }, { passive: true });
    window.addEventListener("load", () => { invMeasure(); invFrame(); });
    invFrame();
  }

  /* ---------------- Interlude — the tour board (date-gated) ----------------
     Split-flap departure board of upcoming dates. Events whose END has passed drop off
     automatically, so the board never shows a date that's already gone by. */
  const lbBoard = document.querySelector("#lbBoard");
  if (lbBoard) {
    // [date, month, CITY, name, programme, info-label, href, startISO, endISO]
    const DATES = [
      [
            "11-25",
            "Sep",
            "BRUSSELS",
            "Garba Miniseries",
            "Fri 11, 18 & 25 Sep · 19:30–21:30 · with For the Love of Bollywood",
            "Register ↗",
            "https://www.fortheloveofbollywood.be/workshops",
            "2026-09-11",
            "2026-09-25"
      ],
      [
            "13",
            "Sep",
            "GHENT",
            "Open Door Day",
            "Free tasters with me: Yoga 11:00 · Indian Dance Technique 12:00 · Bollyfolk 15:00",
            "Details ↗",
            "https://www.shoonyadance.com/calendar/opendeurdag-gratis-dansen-gent-13-september",
            "2026-09-13",
            "2026-09-13"
      ],
      [
            "02-04",
            "Oct",
            "TOULOUSE",
            "Bollywood Vibes Festival",
            "Teaching Lavani (Sat) & Garba (Sun) · performing in the Friday show",
            "Details ↗",
            "https://www.helloasso.com/associations/les-perles-de-jaffna/evenements/festival-bollywood-vibes",
            "2026-10-02",
            "2026-10-04"
      ],
      [
            "07-08",
            "Nov",
            "GHENT",
            "Sangam",
            "A Bollywood Company premiere · €20",
            "ABC ↗",
            "https://performances.shoonyadance.com/sangam/",
            "2026-11-07",
            "2026-11-08"
      ],
      [
            "22-24",
            "Jan",
            "GHENT",
            "Indian Dance Winter Intensive 2027",
            "Save the date — Bhangra & Jhoomar, Semi-Classical, Group Choreography, Garba & Dandiya Raas, Khoriya",
            "Ask me ↓",
            "#hello",
            "2027-01-22",
            "2027-01-24"
      ]
];
    // keep only events that haven't finished yet (compare on date, ignore time)
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const upcoming = DATES.filter((d) => new Date(d[8] + "T23:59:59") >= today);
    const lbReduce = reduceMotion.matches;
    const lbFlap = (word, row) => [...word].map((ch, i) => ch === " "
      ? `<span class="lb-cell gap"></span>`
      : `<span class="lb-cell" style="--d:${lbReduce ? 0 : (row * 0.22 + i * 0.05).toFixed(2)}s">${ch}</span>`).join("");
    if (!upcoming.length) {
      lbBoard.innerHTML = `<p class="lb-empty">No dates on the board right now — <a href="#hello" style="color:var(--marigold)">ask me where I’ll be next</a>.</p>`;
    } else {
      lbBoard.innerHTML = upcoming.map((d, i) => {
        const ext = d[6].startsWith("#") ? "" : ' target="_blank" rel="noopener noreferrer"';
        return `<a class="lb-row" href="${d[6]}"${ext}${d[6] === "#hello" ? ' data-select-intent="Learn with you"' : ""}>
          <time datetime="${d[7]}"><b>${d[0]}</b>${d[1]}</time><time class="sr-only" datetime="${d[8]}">Ends ${d[8]}</time>
          <span class="lb-flap" aria-label="${d[2]}">${lbFlap(d[2], i)}</span>
          <span class="lb-what"><strong>${d[3]}</strong><span>${d[4]}</span></span>
          <span class="lb-status">${d[5]}</span></a>`;
      }).join("");
      if ("IntersectionObserver" in window) {
        new IntersectionObserver((es, o) => es.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add("is-live"); o.unobserve(e.target); }
        }), { threshold: 0.15 }).observe(lbBoard);
      } else { lbBoard.classList.add("is-live"); }
    }
  }

  document.querySelectorAll('#lbBoard [data-select-intent]').forEach(link => {
    link.addEventListener('click', () => {
      const choice = enquiryForm.querySelector('input[value="Learn with you"]');
      choice.checked = true; choice.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });

  /* ---------------- Act V — the thali (dish ring) ---------------- */
  const thPlate = document.querySelector("#thPlate");
  if (thPlate) {
    const THDISHES = [
      ["palak-paneer", "palak paneer"], ["chole-coconut-milk", "chole + coconut milk"],
      ["spinach-pakora", "spinach pakora"], ["misal-prep", "misal"], ["pohe", "pohe"],
      ["bhel", "bhel"], ["appam", "appam"], ["baati", "baati"], ["chakli", "chakli"], ["fafda", "fafda"],
    ];
    const thPicked = document.querySelector("#thPicked"),
          thCentreImg = document.querySelector("#thCentreImg"), thCentreCap = document.querySelector("#thCentreCap");
    thPlate.style.setProperty("--n", THDISHES.length);
    const thFrag = document.createDocumentFragment();
    THDISHES.forEach((d, i) => {
      const fig = document.createElement("figure");
      fig.className = "th-katori"; fig.style.setProperty("--i", i);
      fig.innerHTML = `<button type="button" aria-label="${d[1]}"><img src="assets/cookwithswapke/round/${d[0]}.jpg" alt="${d[1]}" width="600" height="600" loading="lazy" decoding="async"></button>`;
      thFrag.appendChild(fig);
    });
    thPlate.appendChild(thFrag);
    const thKatoris = [...thPlate.querySelectorAll(".th-katori")];
    const thSetRadius = () => thPlate.style.setProperty("--r", (thPlate.clientWidth * 0.355).toFixed(1) + "px");
    thSetRadius();
    window.addEventListener("resize", thSetRadius, { passive: true });
    window.addEventListener("load", thSetRadius);
    const TH_REST = { src: "assets/cookwithswapke/round/complete-thali.jpg", cap: "the full thali" };
    const thServe = (i) => {
      const d = THDISHES[i];
      thKatoris.forEach((k, j) => k.classList.toggle("is-on", j === i));
      thPicked.textContent = d[1];
      thCentreImg.src = `assets/cookwithswapke/round/${d[0]}.jpg`; thCentreImg.alt = d[1]; thCentreCap.textContent = d[1];
    };
    const thClear = () => {
      thKatoris.forEach((k) => k.classList.remove("is-on"));
      thPicked.textContent = "pick a plate";
      thCentreImg.src = TH_REST.src; thCentreImg.alt = "A complete vegetarian thali"; thCentreCap.textContent = TH_REST.cap;
    };
    thKatoris.forEach((k, i) => {
      const b = k.querySelector("button");
      b.addEventListener("mouseenter", () => thServe(i));
      b.addEventListener("focus", () => thServe(i));
      b.addEventListener("click", () => thServe(i));
    });
    thPlate.addEventListener("mouseleave", thClear);
  }

  reduceMotion.addEventListener?.("change", () => {
    revealItems.forEach(item => item.classList.add("is-visible"));
    document.querySelectorAll("video").forEach(video => video.pause());
    body.classList.add("is-loaded", "is-settled");
    scenes.forEach(scene => { scene.lastP = -1; scene.lastPhase = -1; });
    window.dispatchEvent(new Event("resize"));
    measure(); onScroll();
  });
})();
