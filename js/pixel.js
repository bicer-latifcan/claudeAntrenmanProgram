// Minik prosedürel piksel sanatı motoru.
// Şekiller düşük çözünürlüklü bir ızgaraya "malzeme + gölge" olarak çizilir,
// sonra renk rampalarıyla boyanır. Her kare aynı kurallarla çizildiği için animasyon tutarlı kalır.

export const RAMP = {
  dark:   ['#140d0e', '#1f1617', '#2c2123', '#3b2c29', '#4f3b33'],
  orange: ['#7a4a30', '#a85e36', '#cc7640', '#e5904e', '#f0b472'],
  cream:  ['#b98a60', '#dcae80', '#efcc9f', '#f9e3c3', '#fff3e2'],
  tail:   ['#1d1616', '#2f2524', '#463935', '#5f504a', '#7a6a62'],
  paw:    ['#120c0c', '#1d1515', '#2a2020', '#382b29', '#46362f'],
  pink:   ['#b95a62', '#d9737a', '#ee9196', '#f7b0b2', '#ffd0cf'],
  iris:   ['#6d5320', '#9c7a2e', '#c89a3c', '#e3bb55', '#f3d77a'],
  ear:    ['#7d464b', '#a85f65', '#cc8283', '#e4a4a0', '#f4c4bd'],
  blush:  ['#e0707e', '#ec8894', '#f5a0aa', '#fbb8bf', '#ffd0d4'],
  // Tarçın ve eşyalar
  tabby:  ['#7a3f1f', '#9a5228', '#b8672f', '#cf7c3a', '#e39448'],
  ginger: ['#b0612e', '#d27a3a', '#ec944a', '#f7b064', '#ffcc8a'],
  top:    ['#2f7f70', '#48a892', '#6cc9b1', '#98e3cd', '#c8f3e5'],
  shorts: ['#3b2a63', '#55408c', '#7159b3', '#9480d1', '#b8a8e6'],
  shoe:   ['#b89aa6', '#d8c2cb', '#f1e6ea', '#fff7fa', '#ffffff'],
  band:   ['#c2335f', '#e04f7c', '#ff6f98', '#ff97b5', '#ffc1d3'],
  metal:  ['#2a2733', '#4a4658', '#6f6a82', '#9a95ae', '#c9c5d9'],
  wood:   ['#6b4430', '#8a5a3c', '#a8744f', '#c99269', '#e3b58c'],
  mat:    ['#b56ab5', '#cc86cc', '#e0a3e0', '#efc3ef', '#f8def8'],
};
// M.PAINT pikselleri, desen türü (kind) ile bu rampalardan birini kullanır
export const PAINT = ['cream', 'top', 'shorts', 'shoe', 'band', 'metal', 'wood', 'mat', 'cream', 'pink', 'ginger', 'tabby'];
export const INK = '#271a1f';      // dış çizgi
export const WHITE = '#fff8f0';

export const M = {
  EMPTY: 0, FUR: 1, HEAD: 2, RUFF: 3, CREAM: 4, TAIL: 5, PAWK: 6, PAWG: 7, EARIN: 8,
  IRIS: 9, PUPIL: 10, SHINE: 11, PINK: 12, BLUSH: 13, LINE: 14, FAR: 15, MOUTH: 16, TONGUE: 17,
  SOLID: 18, // rengi doğrudan verilen piksel (eşyalar vb.)
  PAINT: 19, // kind → PAINT listesindeki rampa (kıyafet, dambıl, mobilya)
};
const FLUFFY = new Set([M.FUR, M.HEAD, M.RUFF, M.TAIL, M.FAR]);

/* ---------- gürültü ---------- */
export function hash(x, y, s = 0) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 982451653)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
export function vnoise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export const fbm = (x, y, s) => vnoise(x, y, s) * 0.65 + vnoise(x * 2.1, y * 2.1, s + 17) * 0.35;

/* ---------- ızgara ---------- */
export class Grid {
  constructor(w, h) {
    this.w = w; this.h = h; const n = w * h;
    this.m = new Uint8Array(n);     // malzeme
    this.s = new Float32Array(n);   // gölge 0..1
    this.lx = new Float32Array(n);  // parçanın kendi koordinatı (desen parçayla birlikte hareket etsin)
    this.ly = new Float32Array(n);
    this.k = new Uint8Array(n);     // desen türü (parçaya özel)
    this.solid = new Array(n);      // M.SOLID için renk
    this.col = new Array(n);
    this.fx = [];                   // dış çizginin üstüne çizilen pikseller (bıyık vb.)
  }
  clear() { this.m.fill(0); this.fx.length = 0; }
  inside(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  get(x, y) { return this.inside(x, y) ? this.m[y * this.w + x] : 0; }
  put(x, y, mat, shade, o, color) {
    x = Math.floor(x); y = Math.floor(y);
    if (!this.inside(x, y)) return;
    const i = y * this.w + x;
    this.m[i] = mat; this.s[i] = shade;
    this.lx[i] = (x + 0.5 - (o?.ox ?? 0)) / (o?.sc ?? 1);
    this.ly[i] = (y + 0.5 - (o?.oy ?? 0)) / (o?.sc ?? 1);
    this.k[i] = o?.kind ?? 0;
    if (color) this.solid[i] = color;
  }
  overlay(x, y, color) { this.fx.push([Math.round(x), Math.round(y), color]); }
}

/* ---------- ışık: sol üstten ---------- */
const LX = -0.55, LY = -0.83;
function lightShade(nx, ny, bias = 0) {
  const z = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
  return Math.max(0, Math.min(1, 0.5 + 0.34 * (nx * LX + ny * LY) + 0.18 * (z - 0.5) + bias));
}

/* ---------- şekiller ---------- */
export function ellipse(g, cx, cy, rx, ry, mat, o = {}, bias = 0, color) {
  const oo = { ox: cx, oy: cy, ...o };
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const u = (x + 0.5 - cx) / rx, v = (y + 0.5 - cy) / ry;
      if (u * u + v * v <= 1) g.put(x, y, mat, lightShade(u, v, bias), oo, color);
    }
}
export function tri(g, ax, ay, bx, by, cx, cy, mat, o = {}, bias = 0, color) {
  const minX = Math.floor(Math.min(ax, bx, cx)), maxX = Math.ceil(Math.max(ax, bx, cx));
  const minY = Math.floor(Math.min(ay, by, cy)), maxY = Math.ceil(Math.max(ay, by, cy));
  const mx = (ax + bx + cx) / 3, my = (ay + by + cy) / 3, rr = Math.max(maxX - minX, maxY - minY) / 2 || 1;
  const s = (px, py, x1, y1, x2, y2) => (px - x2) * (y1 - y2) - (x1 - x2) * (py - y2);
  for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
    const px = x + 0.5, py = y + 0.5;
    const d1 = s(px, py, ax, ay, bx, by), d2 = s(px, py, bx, by, cx, cy), d3 = s(px, py, cx, cy, ax, ay);
    if (!(((d1 < 0) || (d2 < 0) || (d3 < 0)) && ((d1 > 0) || (d2 > 0) || (d3 > 0))))
      g.put(x, y, mat, lightShade((px - mx) / rr * 0.8, (py - my) / rr * 0.8, bias), { ox: mx, oy: my, ...o }, color);
  }
}
// kapsül (uzuv): A'dan B'ye, yarıçap r0→r1
export function limb(g, ax, ay, bx, by, r0, r1, mat, o = {}, bias = 0, color) {
  const minX = Math.floor(Math.min(ax, bx) - Math.max(r0, r1)), maxX = Math.ceil(Math.max(ax, bx) + Math.max(r0, r1));
  const minY = Math.floor(Math.min(ay, by) - Math.max(r0, r1)), maxY = Math.ceil(Math.max(ay, by) + Math.max(r0, r1));
  const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1;
  for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
    const px = x + 0.5, py = y + 0.5;
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L2));
    const qx = ax + dx * t, qy = ay + dy * t, r = r0 + (r1 - r0) * t;
    const ex = px - qx, ey = py - qy, d2 = ex * ex + ey * ey;
    if (d2 <= r * r) g.put(x, y, mat, lightShade(ex / r, ey / r, bias), { ox: ax, oy: ay, ...o }, color);
  }
}
// ikinci dereceden eğri boyunca kalınlaşan/incelen tüp (kuyruk)
export function tube(g, p0, p1, p2, r0, r1, mat, o = {}, bias = 0, color) {
  const N = 28; let prev = p0;
  for (let i = 1; i <= N; i++) {
    const t = i / N, a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t;
    const p = [a * p0[0] + b * p1[0] + c * p2[0], a * p0[1] + b * p1[1] + c * p2[1]];
    const tt = (i - 1) / N;
    limb(g, prev[0], prev[1], p[0], p[1], r0 + (r1 - r0) * tt, r0 + (r1 - r0) * t, mat, { ox: p0[0], oy: p0[1], ...o }, bias, color);
    prev = p;
  }
}
export function rect(g, x, y, w, h, mat, o = {}, color) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) g.put(x + i, y + j, mat, 0.6, { ox: x, oy: y, ...o }, color);
}
export function px(g, x, y, mat, color) { g.put(x, y, mat, 0.6, null, color); }
export function line(g, x0, y0, x1, y1, color) { // 1px bindirme çizgisi (bıyık)
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) g.overlay(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, color);
}

/* ---------- boyama ---------- */
function ramp(name, s, x, y) {
  const r = RAMP[name];
  const d = (hash(x, y, 91) - 0.5) * 0.16;           // tüy dokusu için hafif titreşim
  const i = Math.max(0, Math.min(r.length - 1, Math.floor((s + d) * r.length)));
  return r[i];
}

// Desen fonksiyonları dışarıdan verilebilir (kedi türüne göre)
export function shade(g, patterns = {}, opts = {}) {
  const { w, h, m } = g;
  // 1) tüylü kenar: boş piksel, tüylü bir komşunun yanındaysa bazen tüy olur
  if (opts.fluff !== false) {
    const add = [];
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const i = y * w + x; if (m[i]) continue;
      const nb = [i - 1, i + 1, i - w, i + w].find(j => FLUFFY.has(m[j]));
      if (nb === undefined) continue;
      if (hash(Math.round(g.lx[nb] * 3) + x * 0, Math.round(g.ly[nb] * 3), 77) < (opts.fluffAmount ?? 0.2)) add.push([i, nb]);
    }
    for (const [i, nb] of add) { m[i] = m[nb]; g.s[i] = Math.max(0, g.s[nb] - 0.12); g.lx[i] = g.lx[nb]; g.ly[i] = g.ly[nb]; g.k[i] = g.k[nb]; }
  }
  // 2) renk
  for (let i = 0; i < w * h; i++) {
    const mat = m[i]; if (!mat) { g.col[i] = null; continue; }
    const x = i % w, y = (i / w) | 0, s = g.s[i], lx = g.lx[i], ly = g.ly[i], k = g.k[i];
    let c = null;
    switch (mat) {
      case M.FUR: case M.FAR: {
        const ss = mat === M.FAR ? s * 0.65 : s;
        if (patterns.furRamp) { c = ramp(patterns.furRamp(lx, ly, k), ss, x, y); break; }
        const orange = patterns.fur ? patterns.fur(lx, ly, k) : false;
        c = ramp(orange ? 'orange' : 'dark', ss, x, y); break;
      }
      case M.HEAD: {
        if (patterns.headRamp) { c = ramp(patterns.headRamp(lx, ly, k), s, x, y); break; }
        const orange = patterns.head ? patterns.head(lx, ly, k) : false; c = ramp(orange ? 'orange' : 'dark', s, x, y); break;
      }
      case M.PAINT: c = ramp(PAINT[k] || 'cream', s, x, y); break;
      case M.RUFF: c = ramp(patterns.ruff ? patterns.ruff(lx, ly, s) : 'orange', Math.min(1, s + 0.12), x, y); break;
      case M.CREAM: c = ramp('cream', s, x, y); break;
      case M.TAIL: c = ramp('tail', s, x, y); break;
      case M.PAWK: c = ramp('paw', s, x, y); break;
      case M.PAWG: c = ramp('orange', Math.min(1, s + 0.1), x, y); break;
      case M.EARIN: c = ramp('ear', s, x, y); break;
      case M.IRIS: c = ramp('iris', s, x, y); break;
      case M.PUPIL: c = '#120b0d'; break;
      case M.SHINE: c = WHITE; break;
      case M.PINK: c = ramp('pink', s, x, y); break;
      case M.BLUSH: c = RAMP.blush[2]; break;
      case M.LINE: c = '#1a1113'; break;
      case M.MOUTH: c = '#3a1f24'; break;
      case M.TONGUE: c = RAMP.pink[2]; break;
      case M.SOLID: c = g.solid[i]; break;
    }
    g.col[i] = c;
  }
  // 3) dış çizgi
  if (opts.outline !== false) {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x; if (m[i]) continue;
      if (g.get(x - 1, y) || g.get(x + 1, y) || g.get(x, y - 1) || g.get(x, y + 1)) g.col[i] = opts.ink ?? INK;
    }
  }
  // 4) bindirmeler
  for (const [x, y, c] of g.fx) if (g.inside(x, y)) g.col[y * w + x] = c;
  return g;
}

/* ---------- tuvale aktarma ---------- */
const hexCache = new Map();
function rgb(hex) {
  let v = hexCache.get(hex);
  if (!v) { const n = parseInt(hex.slice(1), 16); v = [n >> 16 & 255, n >> 8 & 255, n & 255]; hexCache.set(hex, v); }
  return v;
}
export function paint(canvas, g, mode = 'piksel') {
  const ctx = canvas.getContext('2d');
  if (mode === 'karakter') return paintChars(canvas, g);
  if (canvas.width !== g.w || canvas.height !== g.h) { canvas.width = g.w; canvas.height = g.h; }
  const img = ctx.createImageData(g.w, g.h), d = img.data;
  for (let i = 0; i < g.w * g.h; i++) {
    const c = g.col[i]; if (!c) continue;
    const [r, gg, b] = rgb(c); d[i * 4] = r; d[i * 4 + 1] = gg; d[i * 4 + 2] = b; d[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}
const CHARS = ['@', '#', '%', '&', '*', '+', '=', ':', '·'];
function paintChars(canvas, g) {
  const cell = 6;
  if (canvas.width !== g.w * cell) { canvas.width = g.w * cell; canvas.height = g.h * cell; }
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = `700 ${cell + 2}px "Pixelify Sans", monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const c = g.col[y * g.w + x]; if (!c) continue;
    const [r, gg, b] = rgb(c), l = (r * 0.3 + gg * 0.59 + b * 0.11) / 255;
    ctx.fillStyle = c; ctx.fillText(CHARS[Math.min(CHARS.length - 1, Math.floor(l * CHARS.length))], x * cell + cell / 2, y * cell + cell / 2 + 1);
  }
}

/* ---------- küçük simge ızgaraları (kalp, yıldız, ünlem...) ---------- */
export function iconCanvas(rows, palette, scale = 1) {
  const h = rows.length, w = rows[0].length;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (palette[ch]) { ctx.fillStyle = palette[ch]; ctx.fillRect(x, y, 1, 1); } }));
  c.style.width = (w * scale) + 'px'; c.style.height = (h * scale) + 'px';
  return c;
}
