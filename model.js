/* Concord: All four sides — a small WebGL model of the school, textured from four elevation views.
   No library: a handful of textured quads, an orbit camera, and parts that slide apart. */
(() => {
  const root = document.getElementById('model');
  if (!root) return;
  const stage = root.querySelector('.model__stage'), canvas = root.querySelector('canvas');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: true });
  if (!gl) return; // the four views stay on the page as plain images

  /* ---------- texture sheet: where each crop of the four elevations sits (built from the supplied frames) ---------- */
  const SC = 1.5, SIZE = 2048;
  const TILE = {sChim: [6, 6, 388, 32], wWall: [66, 6, 165, 148], eWall: [588, 6, 260, 148], nWall: [6, 468, 44, 160], sWall: [1036, 468, 55, 197], nPav: [6, 867, 297, 250], wPav: [270, 867, 108, 258], ePav: [368, 867, 602, 258], sAnnex: [464, 867, 222, 345], wAnnex: [1038, 867, 507, 340], eAnnex: [1359, 867, 57, 343], wRoof: [6, 1131, 137, 78], eRoof: [608, 1131, 235, 78], sRoof: [6, 1248, 33, 129], wCowl: [1080, 1248, 336, 24], nRoof: [6, 1362, 20, 101], nCowl: [1108, 1362, 360, 52]};
  const uv = (t, px, py) => { const [ax, ay, x0, y0] = TILE[t]; return [(ax + (px - x0) * SC) / SIZE, (ay + (py - y0) * SC) / SIZE]; };

  /* ---------- geometry. Units: 1 = 100 px of the elevations. +X west, +Y up, +Z north ---------- */
  const HW = 3.365, HD = 1.7, WALL = 2.58, RISE = .62, RL = 1.775, EX = HW + .27, EZ = HD + .27, RIDGE = WALL + RISE;
  const STONE = [.62, .62, .61], BRICK = [.45, .45, .45], SLATE = [.33, .34, .35], CUT = [.26, .28, .29];
  const parts = {};
  const part = n => parts[n] || (parts[n] = { tri: [], line: [], off: [0, 0, 0] });
  function quad(name, p, n, tex, edges = true) {
    const P = part(name), t = tex.tile ? tex.px.map(q => uv(tex.tile, q[0], q[1])) : null, c = tex.col || [tex.cut ? 1 : 0, 0, 0]; // cut: drop the sky around a cut-out
    const idx = p.length === 3 ? [0, 1, 2] : [0, 1, 2, 0, 2, 3];
    idx.forEach(i => P.tri.push(...p[i], ...n, ...(t ? t[i] : [-1, -1]), ...c));
    if (edges) p.forEach((a, i) => P.line.push(...a, ...p[(i + 1) % p.length]));
  }
  function box(name, x0, x1, y0, y1, z0, z1, col, top = col) {
    const f = (p, n, c) => quad(name, p, n, { col: c });
    f([[x0, y1, z1], [x1, y1, z1], [x1, y0, z1], [x0, y0, z1]], [0, 0, 1], col);
    f([[x1, y1, z0], [x0, y1, z0], [x0, y0, z0], [x1, y0, z0]], [0, 0, -1], col);
    f([[x1, y1, z1], [x1, y1, z0], [x1, y0, z0], [x1, y0, z1]], [1, 0, 0], col);
    f([[x0, y1, z0], [x0, y1, z1], [x0, y0, z1], [x0, y0, z0]], [-1, 0, 0], col);
    f([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], [0, 1, 0], top);
  }
  const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]; // TL, TR, BR, BL in elevation pixels

  // the brick box: one elevation per wall
  quad('body', [[-HW, WALL, HD], [HW, WALL, HD], [HW, 0, HD], [-HW, 0, HD]], [0, 0, 1], { tile: 'nWall', px: rect(44, 160, 723, 418) });
  quad('body', [[HW, WALL, -HD], [-HW, WALL, -HD], [-HW, 0, -HD], [HW, 0, -HD]], [0, 0, -1], { tile: 'sWall', px: rect(55, 197, 718, 427) });
  quad('body', [[HW, WALL, HD], [HW, WALL, -HD], [HW, 0, -HD], [HW, 0, HD]], [1, 0, 0], { tile: 'wWall', px: rect(165, 148, 505, 420) });
  quad('body', [[-HW, WALL, -HD], [-HW, WALL, HD], [-HW, 0, HD], [-HW, 0, -HD]], [-1, 0, 0], { tile: 'eWall', px: rect(260, 148, 602, 420) });
  quad('body', [[-HW, WALL, -HD], [HW, WALL, -HD], [HW, WALL, HD], [-HW, WALL, HD]], [0, 1, 0], { col: CUT });
  for (let s = -HW - 2 * HD; s < HW; s += .3) {   // the cut top of the box is hatched, like the joins on the walls
    const a = Math.max(s, -HW), b = Math.min(s + 2 * HD, HW);
    part('body').line.push(a, WALL + .004, -HD + (a - s), b, WALL + .004, HD - (s + 2 * HD - b));
  }

  // the hip roof: each slope is an elevation of itself, so the photographs map onto the slopes directly
  const nN = [0, .954, .3], nW = [.316, .949, 0];
  quad('roof', [[-EX, WALL, EZ], [EX, WALL, EZ], [RL, RIDGE, 0], [-RL, RIDGE, 0]], nN, { tile: 'nRoof', px: [[20, 160], [747, 160], [560, 101], [205, 101]] });
  quad('roof', [[EX, WALL, -EZ], [-EX, WALL, -EZ], [-RL, RIDGE, 0], [RL, RIDGE, 0]], [0, .954, -.3], { tile: 'sRoof', px: [[33, 197], [741, 197], [560, 129], [220, 129]] });
  quad('roof', [[EX, WALL, EZ], [EX, WALL, -EZ], [RL, RIDGE, 0]], nW, { tile: 'wRoof', px: [[137, 148], [530, 148], [335, 78]] });
  quad('roof', [[-EX, WALL, -EZ], [-EX, WALL, EZ], [-RL, RIDGE, 0]], [-.316, .949, 0], { tile: 'eRoof', px: [[235, 148], [628, 148], [431, 78]] });
  quad('roof', [[-EX, WALL, EZ], [EX, WALL, EZ], [EX, WALL, -EZ], [-EX, WALL, -EZ]], [0, -1, 0], { col: CUT }, false);

  // three cowls on the ridge, modelled: a tapered base, a round neck, a hooded scoop whose mouth faces north, and a disc vane behind it
  const COWL = [.52, .52, .52], NECK = [.42, .42, .42], MOUTH = [.09, .09, .09];
  const HOOD = [[.15, .18], [.15, .42], [0, .42], [-.084, .403], [-.156, .356], [-.203, .284], [-.22, .2], [-.22, .18]]; // side profile, [z, y] above the ridge
  function fan(name, pts, n, col) {   // a flat many-sided face, outlined
    for (let i = 1; i < pts.length - 1; i++) quad(name, [pts[0], pts[i], pts[i + 1]], n, { col }, false);
    pts.forEach((a, i) => part(name).line.push(...a, ...pts[(i + 1) % pts.length]));
  }
  [-1.2, 0, 1.2].forEach(x => {
    const Y = RIDGE, w = .15, b0 = .15, b1 = .115, y0 = Y - .06, y1 = Y + .13;
    [[0, 1], [1, 0], [0, -1], [-1, 0]].forEach(([dx, dz]) => {   // base
      const c = (h, t, y) => [x + dx * h - dz * t, y, dz * h + dx * t];
      quad('cowls', [c(b1, -b1, y1), c(b1, b1, y1), c(b0, b0, y0), c(b0, -b0, y0)], [dx * .98, .18, dz * .98], { col: COWL });
    });
    quad('cowls', [[x - b1, y1, -b1], [x + b1, y1, -b1], [x + b1, y1, b1], [x - b1, y1, b1]], [0, 1, 0], { col: COWL }, false);
    for (let k = 0; k < 8; k++) {   // neck
      const a0 = k * Math.PI / 4, a1 = a0 + Math.PI / 4, am = a0 + Math.PI / 8, r = .1, p = (a, y) => [x + r * Math.cos(a), y, r * Math.sin(a)];
      quad('cowls', [p(a0, Y + .18), p(a1, Y + .18), p(a1, y1), p(a0, y1)], [Math.cos(am), 0, Math.sin(am)], { col: NECK }, false);
    }
    [-1, 1].forEach(sd => fan('cowls', HOOD.map(([z, y]) => [x + sd * w, Y + y, z]), [sd, 0, 0], COWL));   // hood: west and east sides
    for (let i = 1; i < HOOD.length; i++) {   // hood: top, curved back and underside; the north end is left open as the mouth
      const a = HOOD[i], b = HOOD[(i + 1) % HOOD.length];
      let nz = b[1] - a[1], ny = a[0] - b[0];
      if (nz * ((a[0] + b[0]) / 2 + .03) + ny * ((a[1] + b[1]) / 2 - .3) < 0) { nz = -nz; ny = -ny; }
      const l = Math.hypot(nz, ny);
      quad('cowls', [[x - w, Y + a[1], a[0]], [x + w, Y + a[1], a[0]], [x + w, Y + b[1], b[0]], [x - w, Y + b[1], b[0]]], [0, ny / l, nz / l], { col: COWL });
    }
    quad('cowls', [[x - w, Y + .42, .12], [x + w, Y + .42, .12], [x + w, Y + .18, .12], [x - w, Y + .18, .12]], [0, 0, 1], { col: MOUTH }, false);   // the dark mouth, set back
    [.25, .3, .35].forEach(y => quad('cowls', [[x - w, Y + y + .011, .125], [x + w, Y + y + .011, .125], [x + w, Y + y - .011, .125], [x - w, Y + y - .011, .125]], [0, .5, .87], { col: [.36, .36, .36] }, false));   // louvers
    [[-w, -w + .026, .18, .42], [w - .026, w, .18, .42], [-w, w, .394, .42], [-w, w, .18, .206]].forEach(([x0, x1, a, b]) =>   // the rim of the mouth
      quad('cowls', [[x + x0, Y + b, .151], [x + x1, Y + b, .151], [x + x1, Y + a, .151], [x + x0, Y + a, .151]], [0, 0, 1], { col: [.6, .6, .6] }, false));
    part('cowls').line.push(x - w, Y + .18, .151, x + w, Y + .18, .151, x + w, Y + .18, .151, x + w, Y + .42, .151, x + w, Y + .42, .151, x - w, Y + .42, .151, x - w, Y + .42, .151, x - w, Y + .18, .151);
    const zc = -.12, yc = Y + .52, r = .066, ring = z => Array.from({ length: 14 }, (_, k) => [x + r * Math.cos(k * Math.PI / 7), yc + r * Math.sin(k * Math.PI / 7), z]);
    const f = ring(zc + .012), g = ring(zc - .012);   // the disc vane: two faces and a rim, on a short stem
    fan('cowls', f, [0, .3, .95], COWL); fan('cowls', g, [0, .3, -.95], COWL);
    f.forEach((a, k) => { const n = (k + 1) % 14, am = (k + .5) * Math.PI / 7; quad('cowls', [a, f[n], g[n], g[k]], [Math.cos(am), Math.sin(am), 0], { col: NECK }, false); });
    box('cowls', x - .014, x + .014, Y + .37, yc - r + .012, zc - .012, zc + .012, NECK);
  });

  // the entrance pavilion and its stair, against the north wall
  const PX = .84, PZ = HD + .6, PH = 1.68;
  quad('entry', [[-PX, PH, PZ], [PX, PH, PZ], [PX, 0, PZ], [-PX, 0, PZ]], [0, 0, 1], { tile: 'nPav', px: rect(297, 250, 465, 418) });
  quad('entry', [[PX, PH, PZ], [PX, PH, HD], [PX, 0, HD], [PX, 0, PZ]], [1, 0, 0], { tile: 'wPav', px: rect(108, 258, 165, 420) });
  quad('entry', [[-PX, PH, HD], [-PX, PH, PZ], [-PX, 0, PZ], [-PX, 0, HD]], [-1, 0, 0], { tile: 'ePav', px: rect(602, 258, 658, 420) });
  quad('entry', [[-PX, PH, HD], [PX, PH, HD], [PX, PH, PZ], [-PX, PH, PZ]], [0, 1, 0], { col: STONE });
  quad('entry', [[PX, PH, HD], [-PX, PH, HD], [-PX, 0, HD], [PX, 0, HD]], [0, 0, -1], { col: CUT });
  for (let i = 0; i < 4; i++) {   // four steps: risers from the north view, treads plain
    const top = .26 - i * .065, z0 = PZ + i * .11, z1 = z0 + .11;
    quad('entry', [[-.5, top, z1], [.5, top, z1], [.5, 0, z1], [-.5, 0, z1]], [0, 0, 1], { tile: 'nPav', px: rect(331, 418 - top * 100, 431, 418) });
    quad('entry', [[-.5, top, z0], [.5, top, z0], [.5, top, z1], [-.5, top, z1]], [0, 1, 0], { col: [.72, .72, .71] });
  }
  [[-PX, -.5, 297, 331], [.5, PX, 431, 465]].forEach(([x0, x1, p0, p1]) => {   // the cheek walls either side
    box('entry', x0, x1, 0, .32, PZ, PZ + .5, STONE);
    quad('entry', [[x0, .32, PZ + .502], [x1, .32, PZ + .502], [x1, 0, PZ + .502], [x0, 0, PZ + .502]], [0, 0, 1], { tile: 'nPav', px: rect(p0, 386, p1, 418) }, false);
  });

  // the low annex on the south side
  const AX0 = -2.105, AX1 = 1.645, AZ = -HD - 2.08, AH = .85;
  quad('annex', [[AX1, AH, AZ], [AX0, AH, AZ], [AX0, 0, AZ], [AX1, 0, AZ]], [0, 0, -1], { tile: 'sAnnex', px: rect(222, 345, 597, 430) });
  quad('annex', [[AX1, AH, -HD], [AX1, AH, AZ], [AX1, 0, AZ], [AX1, 0, -HD]], [1, 0, 0], { tile: 'wAnnex', px: rect(507, 340, 713, 420) });
  quad('annex', [[AX0, AH, AZ], [AX0, AH, -HD], [AX0, 0, -HD], [AX0, 0, AZ]], [-1, 0, 0], { tile: 'eAnnex', px: rect(57, 343, 258, 420) });
  quad('annex', [[AX0, AH, -HD], [AX1, AH, -HD], [AX1, 0, -HD], [AX0, 0, -HD]], [0, 0, 1], { col: CUT });
  box('annex', AX0 - .07, AX1 + .07, AH, AH + .1, AZ - .07, -HD, SLATE);
  quad('annex', [[AX0 - .07, AH + .102, AZ - .07], [AX1 + .07, AH + .102, AZ - .07], [AX1 + .07, AH + .102, -HD], [AX0 - .07, AH + .102, -HD]], [0, 1, 0], { tile: 'sRoof', px: [[200, 196], [590, 196], [590, 133], [200, 133]] }, false);

  // the boiler chimney
  const CX = -.175, CZ = -HD - .3, CT = 3.7;
  box('chimney', CX - .16, CX + .16, 0, CT, CZ, -HD, BRICK, [.2, .2, .2]);
  const chim = { tile: 'sChim', px: rect(388, 32, 420, 332) }, c0 = CX - .162, c1 = CX + .162, cb = AH + .1;   // the photographed shaft, pale cap and all, on every side
  quad('chimney', [[c1, CT, CZ - .002], [c0, CT, CZ - .002], [c0, cb, CZ - .002], [c1, cb, CZ - .002]], [0, 0, -1], chim, false);
  quad('chimney', [[c0, CT, -HD + .002], [c1, CT, -HD + .002], [c1, cb, -HD + .002], [c0, cb, -HD + .002]], [0, 0, 1], chim, false);
  quad('chimney', [[c1, CT, -HD], [c1, CT, CZ], [c1, cb, CZ], [c1, cb, -HD]], [1, 0, 0], chim, false);
  quad('chimney', [[c0, CT, CZ], [c0, CT, -HD], [c0, cb, -HD], [c0, cb, CZ]], [-1, 0, 0], chim, false);

  // a drawing-board ground
  const G = part('ground');
  for (let i = -6; i <= 6; i++) G.line.push(i, 0, -7, i, 0, 6);
  for (let k = -7; k <= 6; k++) G.line.push(-6, 0, k, 6, 0, k);

  // how far each part travels when the building is taken apart
  const TRAVEL = { roof: [0, 1.5, 0], cowls: [0, 2.5, 0], entry: [0, 0, 1.7], annex: [0, 0, -1.9], chimney: [0, 0, -.55] };
  const LABELS = [
    ['roof', [.9, WALL + .42, 1], 'Hip roof'], ['cowls', [0, RIDGE + .62, 0], 'Three cowls'], ['entry', [0, PH, PZ], 'Entrance'],
    ['chimney', [CX, CT, CZ], 'Boiler chimney'], ['annex', [-.23, AH + .1, AZ], 'Annex']
  ];
  // Eight features of the design, each a box on one part of the model, with the view that shows it best:
  // box [min, max] in the part's own coordinates; view [yaw, pitch, zoom]; at: the point the camera looks at
  const FEATURES = [
    { part: 'roof', box: [[-EX, WALL - .02, -EZ], [EX, RIDGE + .02, EZ]], view: [.62, .6, 1.05], at: [0, 2.75, 0] },                     // hip roof
    { part: 'body', box: [[-HW - .04, 2.3, -HD - .04], [HW + .04, 2.6, HD + .04]], view: [.55, .1, 1.3], at: [.6, 2.1, HD] },           // cornice
    { part: 'body', box: [[HW - .06, .84, -HD], [HW + .06, 2.3, HD]], view: [1.22, .12, 1.55], at: [HW, 1.55, 0] },                      // banding, west wall
    { part: 'body', box: [[HW - .06, 0, -.36], [HW + .06, .78, .36]], view: [1.27, .08, 1.8], at: [HW, .7, 0] },                         // side door
    { part: 'cowls', box: [[-1.45, RIDGE - .08, -.26], [1.45, RIDGE + .62, .2]], view: [.5, .3, 1.9], at: [0, RIDGE + .25, 0] },         // three cowls
    { part: 'body', box: [[1.55, .9, HD - .06], [3.2, 2.3, HD + .06]], view: [.3, .08, 1.9], at: [2.38, 1.6, HD] },                      // sash windows
    { part: 'entry', box: [[-.87, 0, HD], [.87, 1.7, HD + 1.1]], view: [-.45, .12, 1.9], at: [0, .85, HD + .5] },                        // entrance
    { part: 'body', box: [[-HW - .04, 0, -HD - .04], [HW + .04, .82, HD + .04]], view: [.62, .1, 1.1], at: [0, 1.25, 0] }                 // raised base
  ];
  const COMPASS = [['N', [0, 0, 5.3]], ['S', [0, 0, -6.6]], ['W', [5.5, 0, -.5]], ['E', [-5.5, 0, -.5]]];

  /* ---------- GL setup ---------- */
  function program(vs, fs) {
    const p = gl.createProgram();
    [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]].forEach(([t, src]) => {
      const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      gl.attachShader(p, s);
    });
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  }
  let solid, wire;
  try {
    solid = program(
      `attribute vec3 aPos, aNrm, aCol; attribute vec2 aUv; uniform mat4 uMVP; uniform vec3 uOff;
       varying vec3 vNrm, vCol, vPos; varying vec2 vUv;
       void main(){ vNrm = aNrm; vCol = aCol; vUv = aUv; vPos = aPos; gl_Position = uMVP * vec4(aPos + uOff, 1.); }`,
      `#ifdef GL_FRAGMENT_PRECISION_HIGH
       precision highp float;
       #else
       precision mediump float;
       #endif
       uniform sampler2D uTex; uniform float uSketch, uTexel, uFocus, uHot; uniform vec3 uLight, uBoxA, uBoxB;
       varying vec3 vNrm, vCol, vPos; varying vec2 vUv;
       float lum(vec2 p){ return dot(texture2D(uTex, p).rgb, vec3(.299, .587, .114)); }
       float hash(vec3 p){ p = fract(p * .3183099 + .1); p *= 17.; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
       float noise(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f);
         return mix(mix(mix(hash(i), hash(i + vec3(1., 0., 0.)), f.x), mix(hash(i + vec3(0., 1., 0.)), hash(i + vec3(1., 1., 0.)), f.x), f.y),
                    mix(mix(hash(i + vec3(0., 0., 1.)), hash(i + vec3(1., 0., 1.)), f.x), mix(hash(i + vec3(0., 1., 1.)), hash(i + vec3(1., 1., 1.)), f.x), f.y), f.z); }
       void main(){
         float d = max(dot(normalize(vNrm), uLight), 0.);
         vec3 fill = vec3(.075, .125, .14) * (.8 + .55 * d), ink = vec3(.93, .9, .83), c;
         if (vUv.x < 0.) {   // surfaces with no photograph: weathered, streaked and grainy, so they sit with the ones that have
           float blotch = noise(vPos * 5.) * .6 + noise(vPos * 13.) * .3 + noise(vPos * 31.) * .1;
           float streak = noise(vec3(vPos.x * 18., vPos.y * 2.2, vPos.z * 18.));
           vec3 tone = vCol * (.62 + .5 * d) * (.72 + .52 * blotch) * (.88 + .24 * streak) + (noise(vPos * 44.) - .5) * .09;
           c = mix(tone, fill, uSketch);
         }
         else {
           vec3 photo = texture2D(uTex, vUv).rgb;
           if (vCol.r > .5 && dot(photo, vec3(.299, .587, .114)) > .7) discard;
           photo *= .84 + .22 * d;
           float e = 0.;
           if (uSketch > .01) {   // a line drawing made from the photograph: its edges, inked
             float t = uTexel;
             float a = lum(vUv + vec2(-t, -t)), b = lum(vUv + vec2(0., -t)), cc = lum(vUv + vec2(t, -t));
             float l = lum(vUv + vec2(-t, 0.)), r = lum(vUv + vec2(t, 0.));
             float g = lum(vUv + vec2(-t, t)), h = lum(vUv + vec2(0., t)), i = lum(vUv + vec2(t, t));
             e = smoothstep(.14, .5, length(vec2(cc + 2. * r + i - a - 2. * l - g, g + 2. * h + i - a - 2. * b - cc)));
           }
           c = mix(photo, mix(fill, ink, e), uSketch);
         }
         c += (hash(vec3(gl_FragCoord.xy, 3.)) - .5) * .055 * (1. - uSketch);   // film grain over the whole print
         // a feature is being read: it stays at full strength, everything else sinks into shadow
         float inside = uHot * step(uBoxA.x, vPos.x) * step(vPos.x, uBoxB.x) * step(uBoxA.y, vPos.y) * step(vPos.y, uBoxB.y) * step(uBoxA.z, vPos.z) * step(vPos.z, uBoxB.z);
         c = mix(c, mix(c * .36 + .015, c * 1.06, inside), uFocus);
         gl_FragColor = vec4(c, 1.);
       }`);
    wire = program(
      `attribute vec3 aPos; uniform mat4 uMVP; uniform vec3 uOff; void main(){ gl_Position = uMVP * vec4(aPos + uOff, 1.); }`,
      `precision mediump float; uniform vec4 uColor; void main(){ gl_FragColor = uColor; }`);
  } catch (err) { console.warn('Concord model: shaders unavailable', err); return; }
  const U = (p, n) => gl.getUniformLocation(p, n), A = (p, n) => gl.getAttribLocation(p, n);
  Object.values(parts).forEach(P => {
    P.n = P.tri.length / 11; P.ln = P.line.length / 3;
    P.vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, P.vb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(P.tri), gl.STATIC_DRAW);
    P.lb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, P.lb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(P.line), gl.STATIC_DRAW);
  });

  /* ---------- camera ---------- */
  const persp = (fov, asp, n, f) => { const t = 1 / Math.tan(fov / 2); return [t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, 2 * f * n / (n - f), 0]; };
  const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const nrm = a => { const l = Math.hypot(...a) || 1; return a.map(v => v / l); }, dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  function lookAt(eye, at) {
    const z = nrm(sub3(eye, at)), x = nrm(crs([0, 1, 0], z)), y = crs(z, x);
    return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, eye), -dot(y, eye), -dot(z, eye), 1];
  }
  const mul = (a, b) => { const o = new Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3]; return o; };

  // cur eases toward tgt every frame
  const cur = { yaw: .62, pitch: .24, apart: reduce ? 0 : 1, flat: 0, sketch: 0, focus: 0, zoom: 1, cx: 0, cy: 0, cz: 0 }, tgt = { ...cur, apart: 0 };
  let hot = -1, shown = -1;   // the feature selected, and the one still fading on screen
  let mvp = null, eyeDir = [0, 0, 1], W = 1, H = 1, live = false, inView = false, touched = false, raf = 0;

  function frame() {
    raf = 0;
    let moving = false;
    for (const k in cur) {
      const d = tgt[k] - cur[k];
      if (Math.abs(d) > .0004) { cur[k] += d * (reduce ? 1 : k === 'apart' ? .07 : .12); moving = true; } else cur[k] = tgt[k];
    }
    if (!touched && !reduce && inView) { tgt.yaw += .0018; moving = true; } // a slow turn until someone takes hold
    draw();
    if (moving && inView) request();
  }
  const request = () => { if (!raf && live) raf = requestAnimationFrame(frame); };

  function draw() {
    const asp = W / H, e = cur.apart;
    const fov = (26 - 19 * cur.flat) * Math.PI / 180;                           // an elevation is a long lens from far away
    const dist = 16.2 * (1 + .56 * e) * Math.max(1, 1.22 / asp) * Math.tan(13 * Math.PI / 180) / Math.tan(fov / 2) / cur.zoom;
    const at = [cur.cx, 1.68 + .9 * e + cur.cy, -.35 + cur.cz], cp = Math.cos(cur.pitch);
    const eye = [at[0] + dist * Math.sin(cur.yaw) * cp, at[1] + dist * Math.sin(cur.pitch), at[2] + dist * Math.cos(cur.yaw) * cp];
    mvp = mul(persp(fov, asp, dist * .2, dist * 3), lookAt(eye, at)); eyeDir = sub3(eye, at);
    for (const n in TRAVEL) parts[n].off = TRAVEL[n].map(v => v * e);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);

    gl.useProgram(solid);
    gl.uniformMatrix4fv(U(solid, 'uMVP'), false, mvp);
    gl.uniform1f(U(solid, 'uSketch'), cur.sketch); gl.uniform1f(U(solid, 'uTexel'), 1.4 / SIZE);
    gl.uniform3fv(U(solid, 'uLight'), nrm([.45, .8, .55]));
    const F = shown >= 0 ? FEATURES[shown] : null;
    gl.uniform1f(U(solid, 'uFocus'), F ? cur.focus : 0);
    if (F) { gl.uniform3fv(U(solid, 'uBoxA'), F.box[0]); gl.uniform3fv(U(solid, 'uBoxB'), F.box[1]); }
    gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1, 1); gl.disable(gl.BLEND);
    const at4 = [['aPos', 3, 0], ['aNrm', 3, 3], ['aUv', 2, 6], ['aCol', 3, 8]];
    for (const n in parts) {
      const P = parts[n]; if (!P.n) continue;
      gl.bindBuffer(gl.ARRAY_BUFFER, P.vb);
      at4.forEach(([name, size, o]) => { const l = A(solid, name); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, size, gl.FLOAT, false, 44, o * 4); });
      gl.uniform3fv(U(solid, 'uOff'), P.off); gl.uniform1f(U(solid, 'uHot'), F && F.part === n ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, P.n);
    }
    gl.disable(gl.POLYGON_OFFSET_FILL);

    gl.useProgram(wire);
    gl.uniformMatrix4fv(U(wire, 'uMVP'), false, mvp);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    const lp = A(wire, 'aPos');
    for (const n in parts) {
      const P = parts[n], ground = n === 'ground', a = ground ? .16 : .1 + .75 * cur.sketch;
      const c = ground ? [.79, .63, .39] : [.93, .9, .83];
      gl.bindBuffer(gl.ARRAY_BUFFER, P.lb); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 3, gl.FLOAT, false, 0, 0);
      gl.uniform3fv(U(wire, 'uOff'), P.off); gl.uniform4f(U(wire, 'uColor'), c[0] * a, c[1] * a, c[2] * a, a);
      gl.drawArrays(gl.LINES, 0, P.ln);
    }
    if (F && cur.focus > .01) {   // the frame around the feature being read
      const a = cur.focus;
      gl.bindBuffer(gl.ARRAY_BUFFER, frameBuf); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 3, gl.FLOAT, false, 0, 0);
      gl.uniform3fv(U(wire, 'uOff'), parts[F.part].off); gl.uniform4f(U(wire, 'uColor'), .87 * a, .56 * a, .44 * a, a);
      gl.drawArrays(gl.LINES, 0, 24);
    }
    place();
  }

  const frameBuf = gl.createBuffer();
  function frameFor(F) {   // the twelve edges of a feature's box, a touch proud of the surface
    const [a, b] = F.box, g = .035, x0 = a[0] - g, y0 = a[1] - g, z0 = a[2] - g, x1 = b[0] + g, y1 = b[1] + g, z1 = b[2] + g, v = [];
    [[y0, z0], [y0, z1], [y1, z0], [y1, z1]].forEach(([y, z]) => v.push(x0, y, z, x1, y, z));
    [[x0, z0], [x0, z1], [x1, z0], [x1, z1]].forEach(([x, z]) => v.push(x, y0, z, x, y1, z));
    [[x0, y0], [x0, y1], [x1, y0], [x1, y1]].forEach(([x, y]) => v.push(x, y, z0, x, y, z1));
    gl.bindBuffer(gl.ARRAY_BUFFER, frameBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.DYNAMIC_DRAW);
  }

  /* ---------- labels that ride on the model ---------- */
  const layer = root.querySelector('.model__labels'), read = root.querySelector('.model__read');
  const tags = LABELS.map(([p, pos, text], i) => { const el = document.createElement('span'); el.className = 'mtag'; el.innerHTML = `<b>0${i + 1}</b><i>${text}</i>`; layer.appendChild(el); return { el, p, pos }; });
  const hotTag = document.createElement('span'); hotTag.className = 'mtag mtag--hot'; hotTag.style.opacity = 0; layer.appendChild(hotTag);
  const marks = COMPASS.map(([t, pos]) => { const el = document.createElement('span'); el.className = 'mcompass'; el.textContent = t; layer.appendChild(el); return { el, pos }; });
  const WIND = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
  function project(p) {
    const x = mvp[0] * p[0] + mvp[4] * p[1] + mvp[8] * p[2] + mvp[12], y = mvp[1] * p[0] + mvp[5] * p[1] + mvp[9] * p[2] + mvp[13], w = mvp[3] * p[0] + mvp[7] * p[1] + mvp[11] * p[2] + mvp[15];
    return [(x / w * .5 + .5) * W, (1 - (y / w * .5 + .5)) * H];
  }
  function place() {
    const show = Math.min(1, Math.max(0, (cur.apart - .3) / .4));
    tags.forEach(t => {
      const o = parts[t.p].off, [x, y] = project([t.pos[0] + o[0], t.pos[1] + o[1], t.pos[2] + o[2]]);
      t.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`; t.el.style.opacity = (show * (1 - cur.focus)).toFixed(2);
    });
    if (shown >= 0) {
      const F = FEATURES[shown], o = parts[F.part].off, [x, y] = project([(F.box[0][0] + F.box[1][0]) / 2 + o[0], F.box[1][1] + o[1], (F.box[0][2] + F.box[1][2]) / 2 + o[2]]);
      hotTag.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`; hotTag.style.opacity = cur.focus.toFixed(2);
    }
    marks.forEach(m => {   // compass points on the far side of the building sit back
      const [x, y] = project(m.pos);
      m.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`;
      m.el.style.opacity = dot(m.pos, eyeDir) < 0 ? .3 : 1;
    });
    const deg = ((Math.round(-cur.yaw * 180 / Math.PI) % 360) + 360) % 360; // the camera at north is bearing 0, at west 270
    read.textContent = `Seen from the ${WIND[Math.round(deg / 45) % 8]} · ${String(deg).padStart(3, '0')}°`;
  }

  /* ---------- controls ---------- */
  const viewBtns = [...root.querySelectorAll('[data-view]')], slider = root.querySelector('#modelApart');
  const VIEW = { N: 0, W: Math.PI / 2, S: Math.PI, E: -Math.PI / 2 };
  const pick = (btns, on) => btns.forEach(b => b.setAttribute('aria-pressed', String(b === on)));
  function take() { touched = true; stage.classList.add('is-touched'); }
  viewBtns.forEach(b => b.addEventListener('click', () => {
    take(); pick(viewBtns, b);
    const y = VIEW[b.dataset.view], turns = Math.round((cur.yaw - y) / (2 * Math.PI)); // go the short way round
    tgt.yaw = y + turns * 2 * Math.PI; tgt.pitch = .03; tgt.flat = 1; tgt.zoom = 1; tgt.cx = tgt.cy = tgt.cz = 0; request();
  }));
  // the eight features: choosing one turns the model to it, frames it and leaves it lit while the rest dims; choosing it again lets go
  const featBtns = [...root.querySelectorAll('[data-feature]')];
  featBtns.forEach((b, i) => b.addEventListener('click', () => {
    if (!live) return;
    take(); pick(viewBtns, null);
    if (hot === i) { hot = -1; pick(featBtns, null); tgt.focus = 0; tgt.zoom = 1; tgt.cx = tgt.cy = tgt.cz = 0; return request(); }
    hot = shown = i; pick(featBtns, b);
    const F = FEATURES[i], [yaw, pitch, zoom] = F.view;
    frameFor(F); hotTag.innerHTML = `<b>0${i + 1}</b><i>${b.querySelector('strong').textContent}</i>`;
    tgt.yaw = yaw + Math.round((cur.yaw - yaw) / (2 * Math.PI)) * 2 * Math.PI; tgt.pitch = pitch; tgt.flat = 0; tgt.zoom = zoom; tgt.focus = 1;
    tgt.cx = F.at[0]; tgt.cy = F.at[1] - 1.68; tgt.cz = F.at[2] + .35;
    request();
  }));
  slider.addEventListener('input', () => { take(); tgt.apart = slider.value / 100; request(); });

  let drag = null;
  canvas.addEventListener('pointerdown', e => {
    drag = { x: e.clientX, y: e.clientY, yaw: tgt.yaw, pitch: tgt.pitch, mouse: e.pointerType === 'mouse' };
    canvas.setPointerCapture(e.pointerId); take(); pick(viewBtns, null); tgt.flat = 0; stage.classList.add('is-dragging');
    if (tgt.pitch < .12) tgt.pitch = drag.pitch = .28;
    request();
  });
  canvas.addEventListener('pointermove', e => {
    if (!drag) return;
    tgt.yaw = drag.yaw - (e.clientX - drag.x) * .008;
    if (drag.mouse) tgt.pitch = Math.min(1.25, Math.max(.02, drag.pitch + (e.clientY - drag.y) * .006)); // on touch, up and down stays with the page
    request();
  });
  ['pointerup', 'pointercancel'].forEach(t => canvas.addEventListener(t, () => { drag = null; stage.classList.remove('is-dragging'); }));
  canvas.addEventListener('keydown', e => {
    const k = { ArrowLeft: [-.2, 0], ArrowRight: [.2, 0], ArrowUp: [0, .1], ArrowDown: [0, -.1] }[e.key];
    if (!k) return;
    e.preventDefault(); take(); pick(viewBtns, null); tgt.flat = 0;
    tgt.yaw += k[0]; tgt.pitch = Math.min(1.25, Math.max(.02, tgt.pitch + k[1])); request();
  });

  /* ---------- sizing, loading, start ---------- */
  function resize() {
    const r = stage.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    if (live) draw();
  }
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage); else addEventListener('resize', resize);

  let asked = false;
  function load() {
    if (asked) return; asked = true;
    const img = new Image();
    img.onload = () => {
      const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      live = true; root.classList.add('model--live'); resize(); request();
    };
    // Opened straight from disk (file://), browsers refuse to hand a local image file to WebGL, so the same sheet is
    // loaded from a script as a data URI instead. Served over http, the plain JPEG is used.
    if (location.protocol === 'file:') {
      const sc = document.createElement('script');
      sc.src = 'assets/model/atlas.js'; sc.onload = () => { img.src = window.CONCORD_ATLAS; };
      document.head.appendChild(sc);
    } else img.src = 'assets/model/atlas.jpg';
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) load(); }), { rootMargin: '150% 0px' }).observe(root);
    // the building comes together the first time it is seen; off screen it stops drawing
    new IntersectionObserver(es => es.forEach(e => { inView = e.isIntersecting; if (inView) request(); }), { threshold: .25 }).observe(stage);
  } else { inView = true; load(); }
})();
