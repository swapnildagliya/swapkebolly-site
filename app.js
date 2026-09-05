(() => {
  "use strict";

  // Paste the Web3Forms access key here; empty = mailto fallback.
  const FORM_ACCESS_KEY = "";

  const root = document.documentElement;
  const body = document.body;
  const progressBar = document.querySelector("#progressBar");
  const topbar = document.querySelector("#topbar");
  const topbarContext = document.querySelector("#topbarContext");
  const menu = document.querySelector("#menu");
  const menuButton = document.querySelector("#menuButton");
  const main = document.querySelector("#content");
  const hero = document.querySelector(".hero");
  const heroFigure = document.querySelector("#heroFigure");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const year = document.querySelector("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  const previewLinks = [...document.querySelectorAll("[data-preview]")];
  const previewPanels = [...document.querySelectorAll("[data-preview-panel]")];

  const setPreview = (name) => {
    previewLinks.forEach((link) => link.classList.toggle("is-active", link.dataset.preview === name));
    previewPanels.forEach((panel) => {
      const active = panel.dataset.previewPanel === name;
      panel.classList.toggle("is-active", active);
      panel.setAttribute("aria-hidden", String(!active));
    });
  };

  previewLinks.forEach((link) => {
    link.addEventListener("mouseenter", () => setPreview(link.dataset.preview));
    link.addEventListener("focus", () => setPreview(link.dataset.preview));
  });
  if (previewLinks[0]) setPreview(previewLinks[0].dataset.preview);

  const selectIntentLinks = [...document.querySelectorAll("[data-select-intent]")];
  const enquiryForm = document.querySelector("#enquiryForm");
  const intentPrompt = document.querySelector("#intentPrompt");
  const smartGroups = [...document.querySelectorAll("[data-smart-for]")];

  const intentCopy = {
    "Join a class": {
      title: "Come to Shoonya. I’ll save you a count.",
      text: "Tell me what you have danced before and what you want to try. For the actual timetable, Shoonya is still the official source.",
      labels: {
        people: "Dance experience / level"
      },
      placeholders: {
        people: "Beginner, rusty, Kathak curious, Bhangra hungry..."
      }
    },
    "Invite Swapnil to teach": {
      title: "Tell me about the room.",
      text: "Dance school, festival, team day, brave private group. I need the people, level, time and how much context you want with the choreography.",
      labels: {
        place: "City / venue",
        date: "Date or window",
        people: "People / level",
        format: "Workshop format"
      },
      placeholders: {
        people: "20 beginners, 12 trained dancers, mixed festival crowd...",
        format: "60 min, 90 min, 2 days, lecture-demo, showcase..."
      }
    },
    "Host a workshop intensive": {
      title: "Let’s build the full thing.",
      text: "Useful for schools and festivals: several sessions, technique, choreography and maybe a small showcase if the room is ready.",
      labels: {
        date: "Dates / duration",
        people: "Group size + level",
        format: "Ideal structure"
      },
      placeholders: {
        people: "Advanced dancers, open level, youth group, mixed adults...",
        format: "2 days, 5 days, 180 min masterclass, showcase..."
      }
    },
    "Book a performance": {
      title: "Stage, timing, audience. Then we move.",
      text: "Tell me what the event is, what kind of performance you imagine and whether this is solo, company, ceremony, festival or chaos-with-purpose.",
      labels: {
        place: "Venue / stage",
        date: "Event date",
        people: "Audience / context",
        format: "Performance format"
      },
      placeholders: {
        people: "Wedding guests, theatre audience, public square, corporate event...",
        format: "Solo, company, 10 min, 30 min, opening act..."
      }
    },
    "Build a festival moment": {
      title: "A festival needs more than a slot.",
      text: "Use this for workshops, performances, participatory moments, hosting, programming or the weird beautiful glue between them.",
      labels: {
        place: "Festival / city",
        date: "Festival dates",
        people: "Audience / participants",
        format: "What needs building?"
      },
      placeholders: {
        people: "Families, dancers, public crowd, school groups...",
        format: "Workshop series, stage moment, public dance, programme support..."
      }
    },
    "Discuss choreography": {
      title: "What are we making move?",
      text: "A show, a group, a single impossible transition, a music video, a wedding sangeet, a company piece. Give me the shape.",
      labels: {
        place: "City / rehearsal place",
        date: "Timeline",
        people: "Bodies involved",
        format: "Choreography need"
      },
      placeholders: {
        people: "Solo, 8 dancers, 40 students, family group...",
        format: "Stage piece, sangeet, video, school show..."
      }
    },
    "Discuss design or visual work": {
      title: "Same brain, different tab.",
      text: "Tell me if this is a website, poster, social campaign, festival identity or a visual mess that needs a spine.",
      labels: {
        place: "Where will it live?",
        format: "Design need"
      },
      placeholders: {
        format: "Website, social posts, poster, campaign, identity..."
      }
    },
    "Something else": {
      title: "Excellent. Weird door accepted.",
      text: "Give me the useful context and I’ll figure out where to put the energy."
    }
  };

  const setInputState = (container, hidden) => {
    container.classList.toggle("is-form-hidden", hidden);
    container.querySelectorAll("input, textarea, select").forEach((input) => {
      input.disabled = hidden;
    });
  };

  const resetSmartLabels = () => {
    enquiryForm?.querySelector('[data-field-label="place"]') && (enquiryForm.querySelector('[data-field-label="place"]').textContent = "City / venue");
    enquiryForm?.querySelector('[data-field-label="date"]') && (enquiryForm.querySelector('[data-field-label="date"]').textContent = "Date, if there is one");
    enquiryForm?.querySelector('[data-field-label="people"]') && (enquiryForm.querySelector('[data-field-label="people"]').textContent = "People / level");
    enquiryForm?.querySelector('[data-field-label="format"]') && (enquiryForm.querySelector('[data-field-label="format"]').textContent = "Format");
    const people = enquiryForm?.querySelector('[name="people"]');
    const format = enquiryForm?.querySelector('[name="format"]');
    if (people) people.placeholder = "20 beginners, 12 trained dancers, 300 festival humans...";
    if (format) format.placeholder = "60 min, 2 days, showcase, lecture-demo...";
  };

  const updateIntentUI = (intent) => {
    const selected = intent || "";
    const copy = intentCopy[selected];

    smartGroups.forEach((group) => {
      const allowed = group.dataset.smartFor.split(",").map((item) => item.trim());
      setInputState(group, selected && !allowed.includes(selected));
    });

    resetSmartLabels();
    if (copy?.labels) {
      Object.entries(copy.labels).forEach(([field, label]) => {
        const target = enquiryForm?.querySelector(`[data-field-label="${field}"]`);
        if (target) target.textContent = label;
      });
    }
    if (copy?.placeholders) {
      Object.entries(copy.placeholders).forEach(([field, placeholder]) => {
        const target = enquiryForm?.querySelector(`[name="${field}"]`);
        if (target) target.placeholder = placeholder;
      });
    }

    if (intentPrompt) {
      intentPrompt.querySelector("strong").textContent = copy?.title || "Choose your doorway.";
      intentPrompt.querySelector("span").textContent = copy?.text || "I’ll keep the form short and ask for the useful bits.";
    }
  };

  selectIntentLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const intent = link.dataset.selectIntent;
      if (!intent) return;
      const choice = document.querySelector(`#enquiryForm input[name="intent"][value="${CSS.escape(intent)}"]`);
      if (choice) {
        choice.checked = true;
        updateIntentUI(intent);
      }
    });
  });

  enquiryForm?.querySelectorAll('input[name="intent"]').forEach((choice) => {
    choice.addEventListener("change", () => updateIntentUI(choice.value));
  });
  updateIntentUI(enquiryForm?.querySelector('input[name="intent"]:checked')?.value || "");

  const enquiryHelper = document.querySelector("#enquiryHelper");
  const enquirySubmit = document.querySelector("#enquirySubmit");
  const helperCopy = {
    mailto: "This opens your email app with everything neatly packed. Nothing disappears into a mysterious form void.",
    keyed: "Sent straight to Swapnil — expect a reply within a few days.",
    sending: "Sending…",
    error: "That didn’t send — opening your email app instead."
  };

  const buildMessage = (data) => {
    const intent = String(data.get("intent") || "Website enquiry");
    const styles = data.getAll("style").map(String).filter(Boolean);
    const lines = [
      `Hello Swapnil,`,
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
    return { intent, lines };
  };

  const sendByMailto = (data) => {
    const { intent, lines } = buildMessage(data);
    const subject = encodeURIComponent(`Website enquiry — ${intent}`);
    const bodyText = encodeURIComponent(lines.join("\n"));
    window.location.href = `mailto:info@shoonyadance.com?subject=${subject}&body=${bodyText}`;
  };

  if (enquiryHelper) enquiryHelper.textContent = FORM_ACCESS_KEY ? helperCopy.keyed : helperCopy.mailto;

  enquiryForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!enquiryForm.reportValidity()) return;

    const data = new FormData(enquiryForm);

    if (!FORM_ACCESS_KEY) {
      sendByMailto(data);
      return;
    }

    if (data.get("botcheck")) return; // honeypot tripped, silently drop

    const { intent, lines } = buildMessage(data);
    const submitLabel = enquirySubmit?.querySelector("span");
    const originalLabel = submitLabel?.textContent;

    if (enquirySubmit) enquirySubmit.disabled = true;
    if (submitLabel) submitLabel.textContent = "Sending";
    if (enquiryHelper) enquiryHelper.textContent = helperCopy.sending;

    fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        access_key: FORM_ACCESS_KEY,
        subject: `Website enquiry — ${intent}`,
        from_name: String(data.get("name") || "Website enquiry"),
        name: String(data.get("name") || ""),
        email: String(data.get("email") || ""),
        intent,
        message: lines.join("\n"),
        botcheck: ""
      })
    })
      .then((response) => response.json().then((json) => ({ ok: response.ok, json })))
      .then(({ ok, json }) => {
        if (!ok || !json?.success) throw new Error(json?.message || "Web3Forms request failed");
        if (submitLabel) submitLabel.textContent = "Sent";
        if (enquiryHelper) enquiryHelper.textContent = helperCopy.keyed;
      })
      .catch(() => {
        if (submitLabel) submitLabel.textContent = originalLabel || "Prepare my message";
        if (enquirySubmit) enquirySubmit.disabled = false;
        if (enquiryHelper) enquiryHelper.textContent = helperCopy.error;
        sendByMailto(data);
      });
  });

  let menuWasOpenedFrom = null;
  let activeSectionIsDark = false;

  const getMenuFocusables = () => [menuButton, ...menu.querySelectorAll("a[href], button:not([disabled])")].filter(Boolean);

  const setMenu = (open) => {
    menuButton.setAttribute("aria-expanded", String(open));
    menu.setAttribute("aria-hidden", String(!open));
    menu.classList.toggle("is-open", open);
    body.classList.toggle("menu-open", open);
    main?.toggleAttribute("inert", open);
    topbar.classList.toggle("is-light", !open && activeSectionIsDark);

    if (open) {
      menuWasOpenedFrom = document.activeElement;
      window.setTimeout(() => getMenuFocusables()[1]?.focus(), 80);
    } else if (menuWasOpenedFrom instanceof HTMLElement) {
      menuWasOpenedFrom.focus();
      menuWasOpenedFrom = null;
    }
  };

  menuButton?.addEventListener("click", () => {
    setMenu(menuButton.getAttribute("aria-expanded") !== "true");
  });

  menu?.addEventListener("click", (event) => {
    if (event.target.closest("a")) setMenu(false);
  });

  document.addEventListener("keydown", (event) => {
    const isOpen = menuButton?.getAttribute("aria-expanded") === "true";
    if (!isOpen) return;

    if (event.key === "Escape") {
      event.preventDefault();
      setMenu(false);
      return;
    }

    if (event.key === "Tab") {
      const focusables = getMenuFocusables();
      if (!focusables.length) return;
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

  const parallaxItems = [...document.querySelectorAll(".parallax")];
  const revealItems = [...document.querySelectorAll(".reveal")];
  let revealObserver = null;
  const enableReducedMotionState = () => {
    revealObserver?.disconnect();
    revealObserver = null;
    revealItems.forEach((item) => item.classList.add("is-visible"));
    parallaxItems.forEach((item) => {
      item.style.transform = "";
    });
    if (heroFigure) {
      heroFigure.style.setProperty("--rx", "0deg");
      heroFigure.style.setProperty("--ry", "0deg");
    }
  };

  if ("IntersectionObserver" in window && !reduceMotion.matches) {
    revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8%", threshold: 0.08 });
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    enableReducedMotionState();
  }

  const darkSections = new Set(["classes", "gather", "watch"]);
  const contextSections = document.querySelectorAll("[data-context]");
  if ("IntersectionObserver" in window) {
    const contextObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;
      const section = visible.target;
      topbarContext.textContent = section.dataset.context || "Everything is choreography";
      activeSectionIsDark = darkSections.has(section.id);
      if (menuButton.getAttribute("aria-expanded") !== "true") {
        topbar.classList.toggle("is-light", activeSectionIsDark);
      }
    }, { rootMargin: "-38% 0px -48%", threshold: [0, 0.2, 0.5] });
    contextSections.forEach((section) => contextObserver.observe(section));
  }

  let scrollTicking = false;
  const updateScrollEffects = () => {
    const scrollMax = Math.max(1, root.scrollHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, window.scrollY / scrollMax));
    progressBar.style.transform = `scaleX(${progress})`;

    if (!reduceMotion.matches) {
      const viewportCenter = window.innerHeight / 2;
      parallaxItems.forEach((item) => {
        const rect = item.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > window.innerHeight + 200) return;
        const offset = (rect.top + rect.height / 2 - viewportCenter) * -0.035;
        item.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
      });
    }

    scrollTicking = false;
  };

  const requestScrollUpdate = () => {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(updateScrollEffects);
  };

  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", requestScrollUpdate, { passive: true });
  requestScrollUpdate();

  if (hero && heroFigure && window.matchMedia("(pointer: fine)").matches && !reduceMotion.matches) {
    let pointerTicking = false;
    let pointerX = 0;
    let pointerY = 0;

    const updateHeroPointer = () => {
      const rect = hero.getBoundingClientRect();
      const x = Math.max(-1, Math.min(1, (pointerX - rect.left) / rect.width * 2 - 1));
      const y = Math.max(-1, Math.min(1, (pointerY - rect.top) / rect.height * 2 - 1));
      heroFigure.style.setProperty("--rx", `${(-y * 1.5).toFixed(2)}deg`);
      heroFigure.style.setProperty("--ry", `${(x * 2.4).toFixed(2)}deg`);
      pointerTicking = false;
    };

    hero.addEventListener("pointermove", (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (pointerTicking) return;
      pointerTicking = true;
      window.requestAnimationFrame(updateHeroPointer);
    });

    hero.addEventListener("pointerleave", () => {
      heroFigure.style.setProperty("--rx", "0deg");
      heroFigure.style.setProperty("--ry", "0deg");
    });
  }

  reduceMotion.addEventListener?.("change", (event) => {
    if (event.matches) enableReducedMotionState();
  });
})();
