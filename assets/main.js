(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Mobile nav */
  const nav = document.querySelector('.nav');
  const burger = document.querySelector('.nav .burger');
  if (burger) {
    burger.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* Reveal on enter */
  const reveals = document.querySelectorAll('.reveal');
  if (reduce) {
    reveals.forEach(el => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(el => io.observe(el));
  }

  /* Statement: words light up as you scroll through them */
  document.querySelectorAll('.statement').forEach(st => {
    const words = st.textContent.trim().split(/\s+/);
    st.innerHTML = words.map(w => `<span class="w">${w}</span>`).join(' ');
    const spans = st.querySelectorAll('.w');
    if (reduce) { spans.forEach(s => s.classList.add('on')); return; }
    const update = () => {
      const r = st.getBoundingClientRect();
      const vh = window.innerHeight;
      // progress from when the block enters lower 80% to when it reaches upper 30%
      const p = Math.min(1, Math.max(0, (vh * 0.8 - r.top) / (vh * 0.5)));
      const n = Math.round(p * spans.length);
      spans.forEach((s, i) => s.classList.toggle('on', i < n));
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
  });

  /* Scrubbed scene */
  document.querySelectorAll('.scene').forEach(scene => {
    const fill = scene.querySelector('.track .fill');
    const nodes = Array.from(scene.querySelectorAll('.node'));
    const screens = Array.from(scene.querySelectorAll('.screen'));
    const caps = Array.from(scene.querySelectorAll('.scene-caption span'));
    if (reduce) { nodes.forEach(n => n.classList.add('on')); return; }
    const steps = nodes.length;
    const pin = scene.querySelector('.pin');
    const inner = scene.querySelector('.pin-inner');
    // Fit: if the pinned content is taller than the viewport, scale it down
    const fit = () => {
      if (!inner) return;
      inner.style.transform = '';
      const avail = pin.clientHeight - 72 - 16;
      const need = inner.scrollHeight;
      const k = Math.min(1, avail / need);
      inner.style.transform = k < 1 ? `scale(${k.toFixed(3)})` : '';
    };
    fit();
    window.addEventListener('resize', fit);
    window.addEventListener('load', fit);
    const update = () => {
      const r = scene.getBoundingClientRect();
      const total = scene.offsetHeight - window.innerHeight;
      const p = Math.min(1, Math.max(0, -r.top / total));
      fill.style.width = (p * 100) + '%';
      const active = Math.min(steps - 1, Math.floor(p * steps + 0.0001));
      nodes.forEach((n, i) => n.classList.toggle('on', i <= active));
      screens.forEach((s, i) => {
        s.classList.toggle('on', i === active);
        s.classList.toggle('gone', i < active);
      });
      caps.forEach((c, i) => c.classList.toggle('on', i === active));
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  });
})();
