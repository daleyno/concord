/* Concord: The school on the ridge — scroll, reveal and interaction logic */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = matchMedia('(max-width: 900px)');
  const SVG = 'http://www.w3.org/2000/svg';
  const person = i => `<svg viewBox="0 0 20 44" aria-hidden="true"><use href="#p-${i % 2 ? 'b' : 'a'}"/></svg>`;

  /* ---------- build generated graphics ---------- */
  // pictogram rows: one figure per `unit` pupils, last one partly filled
  $$('.picto').forEach(el => {
    const n = +el.dataset.n / +el.dataset.unit, full = Math.floor(n), rest = n - full;
    let h = '';
    for (let i = 0; i < full; i++) h += `<span style="--i:${i}">${person(i)}</span>`;
    if (rest > .02) h += `<span style="--i:${full}"><span class="ghost">${person(full)}</span><span class="part" style="clip-path:inset(0 ${(1 - rest) * 100}% 0 0)">${person(full)}</span></span>`;
    el.innerHTML = h;
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', `${el.dataset.n} pupils`);
  });

  // 10 x 10 waffles, filled from the bottom row up
  $$('.waffle').forEach(el => {
    const pct = +el.dataset.pct;
    let h = '';
    for (let i = 0; i < 100; i++) {
      const row = Math.floor(i / 10), col = i % 10, order = (9 - row) * 10 + col;
      h += `<span class="${order < pct ? 'fill' : ''}" style="--o:${order}">${person(i + row)}</span>`;
    }
    el.innerHTML = h;
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', `${pct} per cent`);
  });

  // Blair's 32 schools
  const blair = $('#blairGrid');
  if (blair) blair.innerHTML = Array.from({ length: 32 }, (_, i) => `<svg viewBox="0 0 44 36" style="--i:${i}" aria-hidden="true"><use href="#bldg${i < 3 ? '-w' : ''}"/></svg>`).join('');

  // grades taught
  const grades = $('#grades');
  if (grades) {
    const cols = ['K', 1, 2, 3, 4, 5, 6, 7, 8];
    const rows = [['1914', 'Grades 1 to 8', 1, 8], ['1928', 'K to 6', 0, 6], ['Today', 'K to 5', 0, 5]];
    let h = '<span></span><span class="l"></span>' + cols.map(c => `<span class="h">${c}</span>`).join('');
    rows.forEach(([y, l, a, b]) => {
      h += `<span class="y">${y}</span><span class="l">${l}</span>`;
      cols.forEach((_, i) => { h += `<span class="c">${i >= a && i <= b ? person(i) : '<i></i>'}</span>`; });
    });
    grades.innerHTML = h;
  }

  // the 1938 class: 6 artists, 20 classmates
  const people = $('#boardPeople');
  if (people) people.innerHTML = Array.from({ length: 26 }, (_, i) => person(i).replace('<svg', `<svg class="${i < 6 ? 'g' : ''}"`)).join('');

  // the school block, 8 x 2 lots
  const blockSvg = $('#blockSvg');
  const OWN = {
    1928: [2, 3, 4, 5, 10, 11, 12],
    1945: [0, 1, 2, 3, 4, 5, 6, 9, 10, 11, 12, 13, 14],
    2000: Array.from({ length: 16 }, (_, i) => i)
  };
  const BLOCK = { 1928: [1.93, 46], 1945: [3.44, 82], 2000: [4.21, 100] };
  if (blockSvg) {
    const X = 20, Y = 26, W = 35, H = 72;
    let h = `<text x="160" y="14" text-anchor="middle">S CONCORD ST</text>
      <text transform="translate(10 ${Y + H}) rotate(-90)" text-anchor="middle">7TH AVE S</text>
      <text transform="translate(314 ${Y + H}) rotate(-90)" text-anchor="middle">8TH AVE S</text>`;
    for (let i = 0; i < 16; i++) {
      const c = i % 8, r = Math.floor(i / 8), x = X + c * W, y = Y + r * H;
      h += `<rect class="lot" data-i="${i}" style="--i:${c + r * 2}" x="${x}" y="${y}" width="${W + .4}" height="${H + .4}"/>
        <use class="hs" style="--i:${c + r * 2}" href="#house" x="${x + 9}" y="${y + 22}" width="17" height="26"/>`;
    }
    h += `<rect class="b1913" x="${X + 3 * W + 8}" y="${Y + 8}" width="54" height="54"/>
      <rect class="b2000" x="${X + W + 12}" y="${Y + 14}" width="50" height="42"/>
      <rect class="b2000" x="${X + 5 * W + 4}" y="${Y + 14}" width="46" height="42"/>`;
    blockSvg.innerHTML = h;
  }

  /* ---------- number tweening ---------- */
  function tween(el, to, { from = 0, decimals = 0, dur = 1400 } = {}) {
    if (reduce) { el.textContent = to.toFixed(decimals); return; }
    const t0 = performance.now();
    (function step(t) {
      const k = clamp((t - t0) / dur), e = 1 - Math.pow(1 - k, 4);
      el.textContent = (from + (to - from) * e).toFixed(decimals);
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }

  let blockYear = 1928;
  function setBlock(year, animate = true) {
    const prev = BLOCK[blockYear];
    blockYear = year;
    blockSvg.dataset.year = year;
    $$('.lot', blockSvg).forEach(l => l.classList.toggle('own', OWN[year].includes(+l.dataset.i)));
    $$('.seg button').forEach(b => b.setAttribute('aria-selected', String(+b.dataset.y === year)));
    const [acres, pct] = BLOCK[year];
    $('#blockBar').style.transform = `scaleX(${pct / 100})`;
    if (animate) {
      tween($('#blockAcres'), acres, { from: prev[0], decimals: 2, dur: 800 });
      tween($('#blockPct'), pct, { from: prev[1], dur: 800 });
    } else { $('#blockAcres').textContent = acres.toFixed(2); $('#blockPct').textContent = pct; }
  }
  let blockTouched = false;
  if (blockSvg) {
    setBlock(1928, false);
    $$('.seg button').forEach(b => b.addEventListener('click', () => { blockTouched = true; setBlock(+b.dataset.y); }));
  }

  /* ---------- word splitting + reveal on scroll ---------- */
  $$('[data-reveal="words"]').forEach(el => {
    const text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.innerHTML = text.split(/\s+/).map((w, i) => `<span class="w" aria-hidden="true"><span style="--i:${i}">${w}</span></span>`).join(' ');
  });
  $$('[data-stagger]').forEach(g => [...g.children].forEach((c, i) => c.style.setProperty('--d', `${i * 0.09}s`)));
  $$('.tile').forEach((t, i) => t.style.setProperty('--i', i));

  const onReveal = el => {
    $$('[data-count]', el).concat(el.matches('[data-count]') ? [el] : []).forEach(n => {
      if (n.dataset.done) return; n.dataset.done = 1;
      tween(n, +n.dataset.count, { from: +(n.dataset.from || 0), decimals: +(n.dataset.decimals || 0) });
    });
    if (el.id === 'block' && !reduce) {
      setTimeout(() => !blockTouched && setBlock(1945), 1300);
      setTimeout(() => !blockTouched && setBlock(2000), 2900);
    }
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in'); io.unobserve(e.target); onReveal(e.target);
    }), { threshold: .12, rootMargin: '0px 0px -7% 0px' });
    $$('[data-reveal]').forEach(el => io.observe(el));
  } else $$('[data-reveal]').forEach(el => { el.classList.add('in'); onReveal(el); });

  /* ---------- hero ---------- */
  const hero = $('#top'), stick = $('.hero__stick'), word = $('#heroWord'), video = $('#heroVideo'), pauseBtn = $('#heroPause');
  function layoutHero() {
    // fit the wordmark to the measure, but never let it take more than ~a third of the height
    const avail = stick.clientWidth - 2 * parseFloat(getComputedStyle(stick).paddingLeft);
    word.style.fontSize = '200px';
    const perPx = word.getBoundingClientRect().width / 200;
    const size = small.matches ? avail / perPx : Math.min(avail / perPx, innerHeight * .4);
    word.style.fontSize = `${size}px`;
    if (!small.matches) {
      const top = word.offsetTop + word.offsetHeight + Math.max(14, innerHeight * .028);
      stick.style.setProperty('--ft', `${top}px`);
    }
  }
  // soft crossfade over the loop point: the last frame (empty yard) is not the first (children at play)
  let userPaused = false;
  video.addEventListener('timeupdate', () => {
    if (video.duration && video.currentTime > video.duration - .6) video.classList.add('fade');
  });
  video.addEventListener('ended', () => {
    video.currentTime = 0;
    const p = video.play(); if (p) p.catch(() => {});
    setTimeout(() => video.classList.remove('fade'), 120);
  });
  pauseBtn.addEventListener('click', () => {
    userPaused = !video.paused;
    userPaused ? video.pause() : video.play();
    pauseBtn.setAttribute('aria-pressed', String(userPaused));
    pauseBtn.setAttribute('aria-label', userPaused ? 'Play animation' : 'Pause animation');
  });
  if (reduce) { video.removeAttribute('autoplay'); video.pause(); userPaused = true; pauseBtn.setAttribute('aria-pressed', 'true'); pauseBtn.setAttribute('aria-label', 'Play animation'); }

  /* ---------- façade + retention hotspots ---------- */
  const facade = $('#facade'), fItems = $$('#facadeList li'), fDots = $$('#facadeArt .dot'), fN = $('#facadeN');
  let fIdx = -1;
  function setFacade(i) {
    if (i === fIdx) return; fIdx = i;
    fItems.forEach(li => li.classList.toggle('on', +li.dataset.i === i));
    fDots.forEach(d => d.classList.toggle('on', +d.dataset.i === i));
    fN.textContent = i + 1;
  }
  function gotoFacade(i) {
    if (small.matches) return setFacade(i);
    const total = facade.offsetHeight - innerHeight;
    scrollTo({ top: facade.offsetTop + total * ((i + .5) / 8), behavior: reduce ? 'auto' : 'smooth' });
  }
  fItems.forEach(li => $('button', li).addEventListener('click', () => gotoFacade(+li.dataset.i)));
  fDots.forEach(d => d.addEventListener('click', () => gotoFacade(+d.dataset.i)));
  setFacade(0);

  const keep = $('#keep');
  if (keep) {
    const notes = $$('.keep__notes li', keep), dots = $$('.dot', keep);
    const set = i => { notes.forEach(n => n.classList.toggle('on', +n.dataset.i === i)); dots.forEach(d => d.classList.toggle('on', +d.dataset.i === i)); };
    [...notes, ...dots].forEach(el => {
      const i = +el.dataset.i;
      ['mouseenter', 'focus', 'click'].forEach(ev => el.addEventListener(ev, () => set(i)));
    });
    set(0);
  }

  /* ---------- menu ---------- */
  const menu = $('#menu'), menuBtn = $('#menuBtn');
  function toggleMenu(open = !root.classList.contains('menu-open')) {
    root.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close contents' : 'Open contents');
    menu.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
    update();
  }
  menuBtn.addEventListener('click', () => toggleMenu());
  $$('.tile', menu).forEach(t => t.addEventListener('click', () => toggleMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') toggleMenu(false); });

  /* ---------- scroll-driven updates ---------- */
  const rail = $('.rail'), railTitle = $('#railTitle'), railTitleWrap = $('.rail__title');
  const sections = $$('[data-title]');
  const pins = $$('.pin');
  const reel = $('#portraits'), track = $('#reelTrack');
  const boardCover = $('#boardCover'), board = $('#board');
  const pan = $('#pan'), panImg = $('#panImg');
  const parallax = $$('[data-parallax]');
  const spinners = [$('#emblemSpin'), $('#colophonEmblem')].filter(Boolean);
  let currentTitle = '';

  function sizeReel() {
    if (small.matches) { reel.style.height = ''; return; }
    const extra = Math.max(0, track.scrollWidth - (innerWidth - parseFloat(getComputedStyle(root).getPropertyValue('--rail'))));
    reel.style.height = `${innerHeight + extra}px`;
    reel.dataset.extra = extra;
  }
  const pinProgress = el => {
    const r = el.getBoundingClientRect(), total = r.height - innerHeight;
    return total > 0 ? clamp(-r.top / total) : 0;
  };

  function update() {
    const vh = innerHeight, y = scrollY, max = root.scrollHeight - vh;
    rail.style.setProperty('--sp', max > 0 ? clamp(y / max) : 0);

    // which section is under the middle of the viewport
    let cur = sections[0];
    for (const s of sections) { if (s.getBoundingClientRect().top <= vh * .45) cur = s; else break; }
    const menuOpen = root.classList.contains('menu-open');
    rail.dataset.theme = menuOpen ? 'dark' : cur.dataset.theme;
    const title = menuOpen ? 'Contents' : cur.dataset.title;
    if (title !== currentTitle) {
      currentTitle = title;
      railTitleWrap.classList.add('swap');
      setTimeout(() => { railTitle.textContent = title; railTitleWrap.classList.remove('swap'); }, 220);
    }

    if (reduce) return;
    const mobile = small.matches;

    pins.forEach(p => {
      const r = p.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) return;
      const pr = mobile ? 0 : pinProgress(p);
      p.style.setProperty('--p', pr.toFixed(4));
      if (p === hero) stick.style.setProperty('--e', mobile ? 0 : ease(clamp(pr / .72)).toFixed(4));
      else if (p === facade && !mobile) setFacade(Math.min(7, Math.floor(pr * 8)));
      else if (p === reel && !mobile) track.style.transform = `translate3d(${-pr * (+reel.dataset.extra || 0)}px,0,0)`;
    });

    // keep the hero video from decoding when it is far off screen
    if (!userPaused) {
      const off = hero.getBoundingClientRect().bottom < -200;
      if (off && !video.paused) video.pause();
      else if (!off && video.paused) { const p = video.play(); if (p) p.catch(() => {}); }
    }

    // blackboard: the later chalkboard lifts away as the board crosses the middle of the screen
    if (board) {
      const r = board.getBoundingClientRect();
      boardCover.style.setProperty('--p', ease(clamp((vh * .82 - r.top) / (vh * .5))).toFixed(4));
    }
    // elevation drawing pans as it travels up the screen
    if (pan) {
      const r = pan.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh) {
        const k = clamp((vh - r.top) / (vh + r.height));
        const over = Math.max(0, panImg.offsetWidth - pan.clientWidth);
        panImg.style.transform = `translate3d(${-k * over}px,0,0)`;
      }
    }
    parallax.forEach(img => {
      const r = img.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      const k = (r.top + r.height / 2 - vh / 2) / vh;
      img.style.setProperty('--py', `${(k * -r.height * .1).toFixed(1)}px`);
    });
    spinners.forEach(s => {
      const r = s.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      s.style.setProperty('--r', (((r.top - vh / 2) / vh) * -40).toFixed(2));
    });
  }

  let ticking = false;
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; update(); }); } };
  const onResize = () => { layoutHero(); sizeReel(); update(); };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onResize);
  addEventListener('load', onResize);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(onResize);
  $$('.reel__panel img').forEach(i => i.addEventListener('load', onResize));
  onResize();
})();
