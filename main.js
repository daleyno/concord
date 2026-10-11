/* Concord: The school on the ridge — scroll, reveal and interaction logic */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = matchMedia('(max-width: 900px), (max-width: 1180px) and (orientation: portrait)'); // phones, and tablets held upright

  /* ---------- number tweening ---------- */
  function tween(el, to, { from = 0, decimals = 0, dur = 1400, sep = false } = {}) {
    const fmt = v => (sep ? Math.round(v).toLocaleString('en-US') : v.toFixed(decimals));
    if (reduce) { el.textContent = fmt(to); return; }
    const t0 = performance.now();
    (function step(t) {
      const k = clamp((t - t0) / dur), e = 1 - Math.pow(1 - k, 4);
      el.textContent = fmt(from + (to - from) * e);
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }

  /* ---------- students on the roll: the enrollment chart ---------- */
  // Two drawings of the same chart: a wide one, and an upright one for narrow screens so nothing scrolls sideways.
  const rollSvg = $('#rollSvg'), rollEl = $('#roll');
  const ROLL = [
    { y: 1914, n: 240, label: '1914 THE FIRST YEAR', short: '1914', img: 'roll-1914', pd: .35 },
    { y: 1958.5, n: 516, label: '1958-59 THE PEAK', short: '1958-59', img: 'roll-1958', pd: 1.5, peak: true },
    { y: 2014, n: 412, label: '2014 IMMERSION ERA', short: '2014', img: 'roll-2014', pd: 2.6 },
    { y: 2022, n: 329, label: '2022 LATEST COUNT', short: '2022', img: 'roll-2022', pd: 2.9 }
  ];
  const ROLL_EVENTS = [[1932, '1932 ANNEX CLOSES'], [1960, '1960 SIX PORTABLES'], [1971, '1971 GYM ADDED'], [2009, '2009 IMMERSION']];
  // num / lab / thumb: where each big figure, its label and its round photograph sit
  const ROLL_WIDE = {
    w: 900, h: 540, x0: 70, xw: 780, base: 470, yh: 430, grid: [70, 850, 858], axis: 60, step: 10, ly: 489, r: 6.5,
    bldg: [36, 279.3, 360, 194.7], band: [52, 8, 262], port: [20, 14, 10, 12, 8, 22],
    num: [[28, 250, 'start'], [436, 100, 'start'], [684, 214, 'start'], [806, 300, 'end']],
    lab: [[28, 265], [436, 38], [684, 229], [806, 315]], thumb: [[68, 168, 34], [322, 56, 36], [742, 84, 32], [790, 372, 32]], evY: [508, 524, 508, 524]
  };
  const ROLL_TALL = {
    w: 360, h: 430, x0: 34, xw: 284, base: 400, yh: 340, grid: [34, 318, 322], axis: 28, step: 20, ly: 415, r: 5,
    bldg: [14, 321, 150, 81.1], band: [70, 6, 250], port: [9, 6.5, 5, 5.5, 4, 11],
    num: [[66, 287, 'start'], [170, 98, 'start'], [262, 128, 'start'], [318, 243, 'end']],
    lab: [[66, 299], [170, 58], [262, 91], [318, 255]]
  };
  let rollCompact = null;
  function drawRoll() {
    if (!rollSvg) return;
    const compact = $('.roll__scroll', rollEl).clientWidth < 720;
    if (compact === rollCompact) return;
    rollCompact = compact;
    const c = compact ? ROLL_TALL : ROLL_WIDE, f = v => v.toFixed(1);
    const X = y => c.x0 + (y - 1905) / 122 * c.xw, Y = n => c.base - n / 560 * c.yh;
    let h = '';
    for (let n = 100; n <= 500; n += 100) h += `<line class="rl-grid" x1="${c.grid[0]}" x2="${c.grid[1]}" y1="${f(Y(n))}" y2="${f(Y(n))}"/><text x="${c.grid[2]}" y="${f(Y(n) + 3)}">${n}</text>`;
    h += `<image class="rl-bldg" href="assets/img/building-1914.png" x="${c.bldg[0]}" y="${c.bldg[1]}" width="${c.bldg[2]}" height="${c.bldg[3]}"/>`;
    h += `<rect class="rl-band" x="${f(X(1999.5) - 3)}" y="${c.band[0]}" width="6" height="${c.base - c.band[0]}"/><text transform="translate(${f(X(1999.5) - c.band[1])} ${c.band[2]}) rotate(-90)" text-anchor="middle">1999-2000: AT E. C. HUGHES</text>`;
    h += `<line class="rl-axis" x1="${c.axis}" x2="${c.grid[1]}" y1="${c.base}" y2="${c.base}"/>`;
    for (let y = 1910; y <= 2020; y += 10) {
      h += `<line class="rl-axis" x1="${f(X(y))}" x2="${f(X(y))}" y1="${c.base}" y2="${c.base + 6}"/>`;
      if (y % c.step === 0) h += `<text x="${f(X(y))}" y="${c.ly}" text-anchor="middle">${y}</text>`;
    }
    ROLL_EVENTS.forEach(([y, t], e) => {
      h += compact ? `<circle class="rl-ev" cx="${f(X(y))}" cy="${c.base}" r="3.2"/>`
                   : `<line class="rl-axis" x1="${f(X(y))}" x2="${f(X(y))}" y1="494" y2="${c.evY[e]}"/><text x="${f(X(y) + 4)}" y="${c.evY[e]}">${t}</text>`;
    });
    const [px, sx, sy, pw, ph, py] = c.port;
    h += '<g class="rl-port">' + [0, 1, 2, 3, 4, 5].map(q => `<rect x="${f(X(1960) - px + (q % 3) * sx)}" y="${c.base - py + Math.floor(q / 3) * sy}" width="${pw}" height="${ph}"/>`).join('') + '</g>';
    h += `<path class="rl-line" pathLength="1" d="M${ROLL.map(p => `${f(X(p.y))} ${f(Y(p.n))}`).join('L')}"/>`;
    ROLL.forEach((p, q) => {
      const x = f(X(p.y)), y = f(Y(p.n)), [nx, ny, anchor] = c.num[q], [lx, ly] = c.lab[q], t = c.thumb && c.thumb[q];
      h += `<g class="pt${p.peak ? ' pt--peak' : ''}" tabindex="0" style="--pd:${p.pd}s" role="img" aria-label="${p.label.toLowerCase()}: ${p.n} students">
        <line class="rl-drop" x1="${x}" x2="${x}" y1="${y}" y2="${c.base}"/>
        ${t ? `<g class="thumb"><image href="assets/img/${p.img}.png" x="${t[0] - t[2]}" y="${t[1] - t[2]}" width="${2 * t[2]}" height="${2 * t[2]}"/><circle class="ring" cx="${t[0]}" cy="${t[1]}" r="${t[2]}"/></g>` : ''}
        <text class="num${p.peak ? ' num--peak' : ''}" x="${nx}" y="${ny}" text-anchor="${anchor}" data-count="${p.n}" data-delay="${p.pd * 1000}">${p.n}</text>
        <text x="${lx}" y="${ly}" text-anchor="${anchor}">${compact ? p.short : p.label}</text>
        <circle class="dot" cx="${x}" cy="${y}" r="${c.r}"/>
      </g>`;
    });
    rollSvg.setAttribute('viewBox', `0 0 ${c.w} ${c.h}`);
    rollSvg.innerHTML = h;
    rollEl.classList.toggle('roll--compact', compact);
  }
  drawRoll();

  /* ---------- the river moved: before / after slider ---------- */
  const compare = $('#compare');
  let compareTouched = false;
  const setCompare = v => compare.style.setProperty('--pos', `${v}%`);
  if (compare) {
    const range = $('input', compare);
    range.addEventListener('input', () => { compareTouched = true; setCompare(range.value); });
  }
  function hintCompare() {
    // one slow sweep so it is obvious the map can be dragged
    const range = $('input', compare), keys = [50, 26, 66, 50], t0 = performance.now(), dur = 2400;
    (function step(t) {
      if (compareTouched) return;
      const k = clamp((t - t0) / dur) * (keys.length - 1), i = Math.min(keys.length - 2, Math.floor(k));
      const v = keys[i] + (keys[i + 1] - keys[i]) * ease(k - i);
      range.value = v; setCompare(v);
      if (k < keys.length - 1) requestAnimationFrame(step);
    })(t0);
  }

  /* ---------- buying the block: three squares to scale ---------- */
  const squares = $('#squares');
  const ACRES = { 1928: 1.93, 1945: 3.44, 2000: 4.21 };
  let blockYear = 1928, blockTouched = false;
  function setBlock(year, animate = true) {
    const prev = ACRES[blockYear];
    blockYear = year;
    squares.dataset.year = year;
    $$('.seg button').forEach(b => b.setAttribute('aria-selected', String(+b.dataset.y === year)));
    if (animate) tween($('#blockAcres'), ACRES[year], { from: prev, decimals: 2, dur: 800 });
    else $('#blockAcres').textContent = ACRES[year].toFixed(2);
  }
  if (squares) {
    setBlock(reduce ? 2000 : 1928, false);
    $$('.seg button').forEach(b => b.addEventListener('click', () => { blockTouched = true; setBlock(+b.dataset.y); }));
  }

  /* ---------- word splitting + reveal on scroll ---------- */
  $$('[data-reveal="words"]').forEach(el => {
    const text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.innerHTML = text.split(/\s+/).map((w, i) => `<span class="w" aria-hidden="true"><span style="--i:${i}">${w}</span></span>`).join(' ');
  });
  $$('[data-stagger]').forEach(g => [...g.children].forEach((c, i) => c.style.setProperty('--d', `${i * 0.09}s`)));
  $$('.menu__list > li').forEach((li, i) => li.style.setProperty('--i', i));

  const onReveal = el => {
    $$('[data-count]', el).concat(el.matches('[data-count]') ? [el] : []).forEach(n => {
      if (n.dataset.done) return; n.dataset.done = 1;
      const run = () => tween(n, +n.dataset.count, { from: +(n.dataset.from || 0), decimals: +(n.dataset.decimals || 0), sep: !!n.dataset.sep });
      n.dataset.delay && !reduce ? setTimeout(run, +n.dataset.delay) : run();
    });
    if (reduce) return;
    if (el.id === 'squares') {
      setTimeout(() => !blockTouched && setBlock(1945), 1300);
      setTimeout(() => !blockTouched && setBlock(2000), 2900);
    }
    if (compare && el.contains(compare)) setTimeout(hintCompare, 500);
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

  /* ---------- reading the facade + retention hotspots ---------- */
  // a frame of full color travels to the feature being read: [centre x, centre y, half width, half height] as fractions of the drawing
  const LENS = [
    [.52, .25, .2, .1],     // 1 hip roof
    [.15, .29, .15, .11],   // 2 cornice
    [.3, .47, .16, .14],    // 3 banding
    [.106, .86, .07, .11],  // 4 side door
    [.54, .13, .21, .13],   // 5 three cowls
    [.86, .57, .11, .15],   // 6 sash windows
    [.7, .74, .12, .2],     // 7 entrance
    [.44, .9, .4, .075]     // 8 raised base
  ];
  const facade = $('#facade'), fItems = $$('#facadeList li'), fImg = $('#facadeImg'), lens = $('#lens'), lensTag = $('#lensTag'), fN = $('#facadeN');
  let fIdx = -1;
  function setFacade(i) {
    if (i === fIdx) return; fIdx = i;
    fItems.forEach(li => li.classList.toggle('on', +li.dataset.i === i));
    ['--cx', '--cy', '--rx', '--ry'].forEach((p, k) => fImg.style.setProperty(p, LENS[i][k]));
    fN.textContent = i + 1;
    lensTag.innerHTML = `<b>0${i + 1}</b><i>${$('strong', fItems[i]).textContent}</i>`;
    lens.classList.toggle('lens--r', LENS[i][0] > .6); // keep the tag inside the drawing on the right-hand features
    lensTag.classList.remove('pop'); lens.classList.remove('pulse');
    void lens.offsetWidth; // restart the two keyframe animations
    lensTag.classList.add('pop'); lens.classList.add('pulse');
  }
  function gotoFacade(i) {
    if (small.matches) return setFacade(i);
    const total = facade.offsetHeight - innerHeight;
    scrollTo({ top: facade.offsetTop + total * ((i + .5) / 8), behavior: reduce ? 'auto' : 'smooth' });
  }
  fItems.forEach(li => $('button', li).addEventListener('click', () => gotoFacade(+li.dataset.i)));
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
  $$('a', menu).forEach(a => a.addEventListener('click', () => toggleMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') toggleMenu(false); });

  /* ---------- films ---------- */
  // The climb is played by scrolling on wide screens; on small screens, and with reduced motion, it sits in
  // the page and behaves like the chapter 2 film: it plays while in view.
  const move = $('#climb'), climbV = $('#moveClimb');
  const scrubbing = () => !small.matches && !reduce;
  function seekTo(v, t) {
    v._t = t;
    if (v.readyState < 2 || v.seeking || Math.abs(v.currentTime - t) < .03) return;
    v.currentTime = t;
  }
  [climbV].forEach(v => {
    // a scroll can land while a seek is still in flight; catch up to the latest target when it finishes
    v.addEventListener('seeked', () => { if (scrubbing() && v._t != null && Math.abs(v.currentTime - v._t) > .03) v.currentTime = v._t; });
    v.addEventListener('loadeddata', () => { if (scrubbing() && v._t != null) seekTo(v, v._t); });
  });
  const inviewVideos = $$('video[data-inview]');
  if (reduce) inviewVideos.forEach(v => { v.controls = true; });
  if ('IntersectionObserver' in window) {
    const near = new IntersectionObserver(es => es.forEach(e => {   // start buffering a screen or two ahead
      if (e.isIntersecting) { e.target.preload = 'auto'; near.unobserve(e.target); }
    }), { rootMargin: '200% 0px' });
    const seen = new IntersectionObserver(es => es.forEach(e => {
      const v = e.target;
      if (v.hasAttribute('data-scrub') && scrubbing()) return;
      if (!e.isIntersecting) return v.pause();
      if (reduce || v.dataset.userPaused) return;
      if (v.ended) v.currentTime = 0;
      const p = v.play(); if (p) p.catch(() => {});
    }), { threshold: .4 });
    inviewVideos.forEach(v => { near.observe(v); seen.observe(v); });
  }
  $$('.vpause').forEach(btn => {
    const v = $('video', btn.parentElement);
    btn.addEventListener('click', () => {
      const pause = !v.paused;
      pause ? (v.dataset.userPaused = 1, v.pause()) : (delete v.dataset.userPaused, v.play());
      btn.setAttribute('aria-pressed', String(pause));
      btn.setAttribute('aria-label', pause ? 'Play film' : 'Pause film');
    });
  });
  function layoutMove() {
    const stacked = !scrubbing();
    if (move.classList.contains('move--static') === stacked) return;
    move.classList.toggle('move--static', stacked);
    climbV.pause(); if (stacked) climbV.currentTime = 0;
  }

  /* ---------- the move: drawn map ---------- */
  const mapG = $('#mapG'), mgRoute = $('#mgRoute'), mgReveal = $('#mgReveal'), mgWalker = $('#mgWalker'), mgZoom = $('#mgZoom');
  const mgLen = mgRoute ? mgRoute.getTotalLength() : 0;
  function drawMap(p) {
    // p: 0 as the map enters, 1 once it is well into view. The dotted route is walked from the old school to the new.
    const walked = clamp((p - .12) / .7), pt = mgRoute.getPointAtLength(walked * mgLen), s = 1 + .12 * ease(p);
    mgReveal.setAttribute('stroke-dashoffset', (1 - walked).toFixed(4));
    mgWalker.setAttribute('cx', pt.x.toFixed(1)); mgWalker.setAttribute('cy', pt.y.toFixed(1));
    mgZoom.setAttribute('transform', `translate(${(424 * (1 - s)).toFixed(2)} ${(290 * (1 - s)).toFixed(2)}) scale(${s.toFixed(4)})`);
    mapG.classList.toggle('arrived', walked > .96);
  }
  if (mapG) mapG.classList.add('arrived'); // the finished drawing is the fallback; scrolling replays it

  /* ---------- scroll-driven updates ---------- */
  const rail = $('.rail'), railTitle = $('#railTitle'), railTitleWrap = $('.rail__title'), railNext = $('#railNext');
  const sections = $$('[data-title]');
  const pins = $$('.pin');
  const reel = $('#portraits'), track = $('#reelTrack');
  const board = $('#board'), boardStage = board && board.parentElement;
  if (boardStage && reduce) boardStage.style.setProperty('--p', 1);
  const pan = $('#pan'), panImg = $('#panImg');
  const parallax = $$('[data-parallax]');
  const emblems = [$('#emblemSpin'), $('#colophonEmblem')].filter(Boolean);
  let currentTitle = '', curIdx = 0;
  // the arrow at the foot of the rail steps to the next section; on the last one it turns and goes back to the cover
  railNext.addEventListener('click', () => {
    if (root.classList.contains('menu-open')) toggleMenu(false);
    const next = sections[curIdx + 1], bar = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0; // the top bar on phones
    scrollTo({ top: next ? Math.ceil(next.getBoundingClientRect().top + scrollY) - bar : 0, behavior: reduce ? 'auto' : 'smooth' });
  });

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
    curIdx = sections.indexOf(cur);
    const atEnd = curIdx === sections.length - 1;
    if (railNext.classList.contains('up') !== atEnd) {
      railNext.classList.toggle('up', atEnd);
      railNext.setAttribute('aria-label', atEnd ? 'Back to the cover' : 'Next section');
    }
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
      else if (p === move && !mobile) seekTo(climbV, clamp((pr - .04) / .88) * ((climbV.duration || 8) - .05));
    });

    // keep the hero video from decoding when it is far off screen
    if (!userPaused) {
      const off = hero.getBoundingClientRect().bottom < -200;
      if (off && !video.paused) video.pause();
      else if (!off && video.paused) { const p = video.play(); if (p) p.catch(() => {}); }
    }

    if (mapG) {
      const r = mapG.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh) drawMap(clamp((vh * .92 - r.top) / (vh * .62)));
    }
    // blackboard: the later chalkboard lifts away, and the 52-year bar fills, as the board crosses the middle of the screen
    if (board) {
      const r = board.getBoundingClientRect();
      boardStage.style.setProperty('--p', ease(clamp((vh * .82 - r.top) / (vh * .5))).toFixed(4));
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
    // the emblem eases up to full size as it comes into view: a slight zoom for emphasis, no rotation
    emblems.forEach(s => {
      const r = s.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      s.style.setProperty('--z', (.9 + .1 * ease(clamp((vh - r.top) / (vh * .8)))).toFixed(4));
    });
  }

  let ticking = false;
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; update(); }); } };
  const onResize = () => { layoutHero(); layoutMove(); drawRoll(); sizeReel(); update(); };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onResize);
  addEventListener('load', onResize);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(onResize);
  $$('.reel__panel img').forEach(i => i.addEventListener('load', onResize));
  onResize();
})();
