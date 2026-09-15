(function () {
  const STORAGE_KEY = "ossatura.vitrine.theme";
  const ORDER = ["light", "dark", "system"];

  const ICONS = {
    light: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>',
    dark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5z"/></svg>',
    system: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>',
  };

  function readPref() {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "light" || v === "dark" || v === "system") return v;
    } catch (_) {}
    return "system";
  }

  function resolveTheme(pref) {
    if (pref === "light" || pref === "dark") return pref;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyTheme(pref) {
    const resolved = resolveTheme(pref);
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", resolved === "dark" ? "#12161C" : "#F2B705");
    }
    return resolved;
  }

  function setPref(pref) {
    try { localStorage.setItem(STORAGE_KEY, pref); } catch (_) {}
    applyTheme(pref);
    syncToggle(pref);
  }

  function labelFor(pref, resolved) {
    if (pref === "system") return `Thème système (${resolved === "dark" ? "sombre" : "clair"})`;
    return pref === "dark" ? "Thème sombre" : "Thème clair";
  }

  function syncToggle(pref) {
    const btn = document.querySelector(".theme-toggle");
    if (!btn) return;
    const resolved = resolveTheme(pref);
    btn.dataset.themePref = pref;
    btn.innerHTML = ICONS[pref === "system" ? "system" : resolved];
    const label = labelFor(pref, resolved);
    btn.setAttribute("aria-label", `${label} — cliquer pour changer`);
    btn.title = label;
  }

  function ensureToggle() {
    const nav = document.querySelector(".nav");
    if (!nav) return;
    let btn = nav.querySelector(".theme-toggle");
    if (!btn) {
      btn = document.createElement("button");
      btn.type = "button";
      btn.className = "theme-toggle";
      btn.setAttribute("aria-label", "Changer le thème");
      const burger = nav.querySelector(".burger");
      if (burger) nav.insertBefore(btn, burger);
      else nav.appendChild(btn);
    }
    if (btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const cur = readPref();
      const idx = ORDER.indexOf(cur);
      const next = ORDER[(idx < 0 ? 0 : idx + 1) % ORDER.length];
      setPref(next);
    });
  }

  const pref = readPref();
  applyTheme(pref);
  ensureToggle();
  syncToggle(pref);

  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystemChange = () => {
    if (readPref() === "system") applyTheme("system");
  };
  if (mq.addEventListener) mq.addEventListener("change", onSystemChange);
  else if (mq.addListener) mq.addListener(onSystemChange);

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Mobile nav */
  const nav = document.querySelector(".nav");
  const burger = document.querySelector(".nav .burger");
  const navPanel = document.querySelector(".nav-panel");
  const mqNav = window.matchMedia("(max-width:860px)");
  let backdrop = document.querySelector(".nav-backdrop");
  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.className = "nav-backdrop";
    backdrop.hidden = true;
    document.body.appendChild(backdrop);
  }

  function setNavOpen(open) {
    if (!nav || !burger) return;
    const mobile = mqNav.matches;
    const isOpen = open && mobile;
    nav.classList.toggle("open", isOpen);
    document.body.classList.toggle("nav-open", isOpen);
    backdrop.hidden = !isOpen;
    burger.setAttribute("aria-expanded", isOpen ? "true" : "false");
    burger.setAttribute("aria-label", isOpen ? "Fermer le menu" : "Ouvrir le menu");
  }

  if (burger && nav) {
    burger.addEventListener("click", (event) => {
      event.stopPropagation();
      setNavOpen(!nav.classList.contains("open"));
    });

    if (navPanel) {
      navPanel.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => setNavOpen(false));
      });
    }

    backdrop.addEventListener("click", () => setNavOpen(false));

    document.addEventListener("click", (event) => {
      if (!nav.classList.contains("open")) return;
      if (burger.contains(event.target)) return;
      if (navPanel && navPanel.contains(event.target)) return;
      setNavOpen(false);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("open")) {
        setNavOpen(false);
        burger.focus();
      }
    });

    const onNavBreakpoint = () => {
      if (!mqNav.matches) setNavOpen(false);
    };
    if (mqNav.addEventListener) mqNav.addEventListener("change", onNavBreakpoint);
    else if (mqNav.addListener) mqNav.addListener(onNavBreakpoint);
  }

  /* Reveal on enter */
  const reveals = document.querySelectorAll(".reveal");
  if (reduce) {
    reveals.forEach((el) => el.classList.add("in"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  }

  /* Statement: words light up as you scroll through them */
  document.querySelectorAll(".statement").forEach((st) => {
    const words = st.textContent.trim().split(/\s+/);
    st.innerHTML = words.map((w) => {
      const m = w.match(/^(Ossatura)([\.,;:—\-]?)$/);
      const inner = m
        ? `<span class="brand-mark">${m[1]}</span>${m[2] || ""}`
        : w.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return `<span class="w">${inner}</span>`;
    }).join(" ");
    const spans = st.querySelectorAll(".w");
    if (reduce) {
      spans.forEach((s) => s.classList.add("on"));
      return;
    }
    const update = () => {
      const r = st.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh * 0.8 - r.top) / (vh * 0.5)));
      const n = Math.round(p * spans.length);
      spans.forEach((s, i) => s.classList.toggle("on", i < n));
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
  });

  /* Scrubbed scene */
  document.querySelectorAll(".scene").forEach((scene) => {
    const fill = scene.querySelector(".track .fill");
    const nodes = Array.from(scene.querySelectorAll(".node"));
    const screens = Array.from(scene.querySelectorAll(".screen"));
    const caps = Array.from(scene.querySelectorAll(".scene-caption span"));
    if (reduce) {
      nodes.forEach((n) => n.classList.add("on"));
      return;
    }
    const steps = nodes.length;
    const pin = scene.querySelector(".pin");
    const inner = scene.querySelector(".pin-inner");
    const fit = () => {
      if (!inner) return;
      inner.style.transform = "";
      const avail = pin.clientHeight - 72 - 16;
      const need = inner.scrollHeight;
      const k = Math.min(1, avail / need);
      inner.style.transform = k < 1 ? `scale(${k.toFixed(3)})` : "";
    };
    fit();
    window.addEventListener("resize", fit);
    window.addEventListener("load", fit);
    const update = () => {
      const r = scene.getBoundingClientRect();
      const total = scene.offsetHeight - window.innerHeight;
      const p = Math.min(1, Math.max(0, -r.top / total));
      fill.style.width = p * 100 + "%";
      const active = Math.min(steps - 1, Math.floor(p * steps + 0.0001));
      nodes.forEach((n, i) => n.classList.toggle("on", i <= active));
      screens.forEach((s, i) => {
        s.classList.toggle("on", i === active);
        s.classList.toggle("gone", i < active);
      });
      caps.forEach((c, i) => c.classList.toggle("on", i === active));
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
  });
})();
