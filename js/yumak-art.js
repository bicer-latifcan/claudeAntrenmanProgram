// Yumak'ın pozları. Tümü 88x88'lik ızgaraya çizilir (yakın plan yüz hariç).
// Kaplumbağa kabuğu desenli, tombul, kocaman gözlü.
import { M, K, ellipse, tri, limb, tube, px, line, shade, fbm, WHITE, INK } from './pixel.js';

export const W = 88, H = 88, FACE_W = 104, FACE_H = 88;
const GROUND = 83;

/* ---------- desenler ---------- */
function furPattern(lx, ly, kind) {
  if (kind === 2) return Math.sin(ly * 1.2 + lx * 0.5) < 0.55; // kaldırılan kollar: turuncu, ince bantlı
  if (kind === 1) { // bacaklar: hafif çizgili
    return fbm(lx / 4 + 7, ly / 5, 13) > 0.42 && Math.sin(ly * 1.1 + lx * 0.3) < 0.75;
  }
  // iri, yumuşak lekeler; çizgiler sadece yer yer
  let orange = fbm(lx / 10 + 3, ly / 10 + 1, 7) > 0.46;
  const stripe = Math.sin(ly * 0.95 + fbm(lx / 6, ly / 6, 3) * 6 + Math.abs(lx) * 0.1);
  if (orange && stripe > 0.9 && fbm(lx / 7, ly / 7, 44) > 0.45) orange = false;
  if (!orange && Math.abs(lx) < 10 && ly > -6 && fbm(lx / 5, ly / 5, 29) > 0.58) orange = true;
  return orange;
}
function headPattern(lx, ly, kind) {
  const yaw = kind === 1 ? 1 : 0;
  const bx = 0.4 + yaw * (1.5 + (ly + 14) * 0.52);
  const bw = 1.25 + Math.max(0, ly + 14) * 0.15;
  if (ly < 7 && Math.abs(lx - bx) <= bw) return true;              // alındaki turuncu çizgi
  if (ly > 3.2) return fbm(lx / 3.2 + 2, ly / 3.2, 5) < 0.72;        // yanaklar turuncu
  if (ly > -3 && Math.abs(lx - yaw * 6) > 12.5) return fbm(lx / 3, ly / 3, 9) > 0.5;
  return fbm(lx / 2.6, ly / 2.6, 41) > 0.86;                         // maskede ufak turuncu benekler
}
function ruffPattern(lx, ly) {
  // göğüste katmanlı tüy: seyrek, dalgalı krem uçlar
  const v = ly - Math.abs(lx) * 0.55 + Math.sin(lx * 0.9) * 0.8;
  if (Math.abs(lx) < 8 && ly > -5 && ((Math.floor(v) % 5) + 5) % 5 === 0) return 'cream';
  return 'orange';
}
const PAT = { fur: furPattern, head: headPattern, ruff: ruffPattern };

/* ---------- yüz parçaları ---------- */
function eye(g, cx, cy, s, st, xs = 1, side = 0, ho = null) { // side: -1 sol göz, 1 sağ göz
  const mode = st.blink ? 'closed' : (st.eyes || 'open');
  const L = (pts) => pts.forEach(([x, y]) => {
    for (let dy = 0; dy < Math.max(1, Math.round(s * 0.8)); dy++) px(g, Math.round(cx + x * s * xs), Math.round(cy + y * s) + dy, M.LINE);
  });
  if (mode === 'closed') { L([[-3, -0.2], [-2, 0.6], [-1, 1], [0, 1.1], [1, 1], [2, 0.6], [3, -0.2]]); return; }
  if (mode === 'happy') { L([[-3, 1], [-2, 0], [-1, -0.6], [0, -0.9], [1, -0.6], [2, 0], [3, 1]]); return; }
  if (mode === 'squint') { L([[-3, -1], [-1, 0], [1, 1], [-3, 2.4], [-1, 1.8]]); return; } // >
  const look = st.look || { x: 0, y: 0 };
  ellipse(g, cx, cy, 4.3 * s * xs, 4.8 * s, M.IRIS, { ox: cx, oy: cy }, 0);
  if (mode === 'sad' || mode === 'cry') { // üzgün: kocaman parlak göz bebeği, dış köşesi düşük göz kapağı, biriken yaş
    const inn = side ? -side : 1; // gözden yüzün ortasına doğru
    ellipse(g, cx + look.x * s * 0.6 * xs, cy - 0.3 * s, 3.4 * s * xs, 4 * s, M.PUPIL);
    tri(g, cx - inn * 5 * s * xs, cy - 5.7 * s, cx + inn * 1.8 * s * xs, cy - 6 * s, cx - inn * 5 * s * xs, cy - 1.1 * s, M.HEAD, ho || { ox: cx, oy: cy, kind: 0 });
    const r = Math.max(2, Math.round(s * 1.7));
    for (let j = 0; j < r; j++) for (let i = 0; i < r; i++) px(g, Math.round(cx + inn * 0.3 * s * xs) + i, Math.round(cy - 2.7 * s) + j, M.SHINE);
    px(g, Math.round(cx - inn * 1.7 * s * xs), Math.round(cy + 1.5 * s), M.SHINE);
    px(g, Math.round(cx + inn * 1.9 * s * xs), Math.round(cy + 2.3 * s), M.SHINE);
    for (let i = -2; i <= 2; i++) g.overlay(Math.round(cx + i * s * xs), Math.round(cy + 4.6 * s), '#a8dcff');
    if (mode === 'cry') {
      const tx = Math.round(cx - inn * 2.4 * s * xs);
      for (let j = 0; j < Math.round(7 * s); j++) g.overlay(tx - (j > 3 ? inn : 0), Math.round(cy + 5 * s) + j, j % 2 ? '#c8ecff' : '#7cc3f5');
    }
    return;
  }
  if (mode === 'wide') {
    ellipse(g, cx + look.x * s * 0.8, cy + 0.2 * s, 1.5 * s * xs, 2.2 * s, M.PUPIL);
  } else if (mode === 'sleepy') {
    ellipse(g, cx + look.x * s * 0.8 * xs, cy + 0.7 * s, 2.8 * s * xs, 3.2 * s, M.PUPIL);
    ellipse(g, cx, cy - 2.6 * s, 5 * s * xs, 3.2 * s, M.HEAD, { ox: cx, oy: cy - 2.6 * s, kind: 0 }); // ağır göz kapağı
  } else {
    ellipse(g, cx + look.x * s * 0.9 * xs, cy + (0.5 + look.y * 0.5) * s, 3.05 * s * xs, 3.6 * s, M.PUPIL);
  }
  if (mode !== 'sleepy') {
    const r = Math.max(2, Math.round(s * 1.6));
    for (let j = 0; j < r; j++) for (let i = 0; i < r; i++) px(g, Math.round(cx - 1.7 * s * xs) + i + Math.round(look.x * s * 0.5), Math.round(cy - 2.1 * s) + j, M.SHINE);
    px(g, Math.round(cx + 1.4 * s * xs), Math.round(cy + 1.7 * s), M.SHINE);
  }
}
function nose(g, cx, cy, s) {
  tri(g, cx - 2.7 * s, cy - 0.3 * s, cx + 2.7 * s, cy - 0.3 * s, cx, cy + 2.6 * s, M.PINK, {}, 0.1);
  px(g, Math.round(cx - 1.2 * s), Math.round(cy), M.SHINE);
}
function mouth(g, cx, cy, s, st) {
  const m = st.mouth || 'closed';
  if (m === 'open' || m === 'meow') {
    const big = m === 'meow' ? 1.35 : 1;
    ellipse(g, cx, cy + 2 * s, 2.3 * s * big, 1.9 * s * big, M.MOUTH);
    ellipse(g, cx, cy + 2.9 * s * big, 1.5 * s * big, 0.9 * s * big, M.TONGUE);
    return;
  }
  if (m === 'frown') { for (const [x, y] of [[0, 0], [0, 0.8], [-1, 1.3], [-2, 1.9], [-3, 2.6], [1, 1.3], [2, 1.9], [3, 2.6]]) px(g, Math.round(cx + x * s), Math.round(cy + y * s), M.MOUTH); return; }
  if (m === 'tongue') { ellipse(g, cx, cy + 2.6 * s, 1.6 * s, 1.5 * s, M.TONGUE); }
  const pts = [[0, 0], [0, 0.8], [-1, 1.6], [-2, 1.9], [-3, 1.3], [1, 1.6], [2, 1.9], [3, 1.3]];
  for (const [x, y] of pts) px(g, Math.round(cx + x * s), Math.round(cy + y * s), M.MOUTH);
}
function whiskers(g, hx, hy, s, dir = 0) {
  const c = '#fbeee0';
  const sides = dir === 0 ? [-1, 1] : [1];
  for (const sd of sides) {
    const ox = dir === 0 ? 9 : 13, oy = 7.5;
    line(g, hx + sd * ox * s, hy + oy * s, hx + sd * (ox + 15) * s, hy + (oy - 2.5) * s, c);
    line(g, hx + sd * ox * s, hy + (oy + 1.5) * s, hx + sd * (ox + 15) * s, hy + (oy + 2.5) * s, c);
    line(g, hx + sd * ox * s, hy + (oy + 3) * s, hx + sd * (ox + 13) * s, hy + (oy + 6.5) * s, c);
  }
}

export function headFront(g, hx, hy, s, st) {
  const o = { ox: hx, oy: hy, sc: s, kind: 0 };
  const P = (x, y) => [hx + x * s, hy + y * s];
  const et = st.earTwitch ? 1.6 : 0, flat = st.earsBack ? 1 : 0;
  // kulaklar
  tri(g, ...P(-18.5, -3), ...P(-15 - et - flat * 6, -21 + flat * 8), ...P(-4, -12.5), M.HEAD, o);
  tri(g, ...P(18.5, -3), ...P(15 + flat * 6, -21 + flat * 8), ...P(4, -12.5), M.HEAD, o);
  if (!flat) {
    tri(g, ...P(-15, -6), ...P(-14 - et, -17), ...P(-8, -11.5), M.EARIN, o);
    tri(g, ...P(15, -6), ...P(14, -17), ...P(8, -11.5), M.EARIN, o);
  }
  // baş ve tombul yanaklar
  ellipse(g, hx, hy, 19 * s, 15.5 * s, M.HEAD, o);
  ellipse(g, ...P(-12, 5), 9 * s, 8 * s, M.HEAD, o);
  ellipse(g, ...P(12, 5), 9 * s, 8 * s, M.HEAD, o);
  for (const sd of [-1, 1]) {
    tri(g, ...P(sd * 19, 3.5), ...P(sd * 24, 7), ...P(sd * 19.5, 9.5), M.HEAD, o);
    tri(g, ...P(sd * 18, 8.5), ...P(sd * 22.5, 12), ...P(sd * 16.5, 12.5), M.HEAD, o);
  }
  // ağız çevresi, allık
  ellipse(g, ...P(-3.6, 8.2), 4.6 * s, 3.3 * s, M.CREAM, o, 0.15);
  ellipse(g, ...P(3.6, 8.2), 4.6 * s, 3.3 * s, M.CREAM, o, 0.15);
  ellipse(g, ...P(0, 11), 3 * s, 2 * s, M.CREAM, o, 0.05);
  ellipse(g, ...P(-12.5, 6), 3 * s, 1.6 * s, M.BLUSH, o);
  ellipse(g, ...P(12.5, 6), 3 * s, 1.6 * s, M.BLUSH, o);
  eye(g, ...P(-7.6, 1), s, st, 1, -1, o);
  eye(g, ...P(7.6, 1), s, st, 1, 1, o);
  nose(g, ...P(0, 5.2), s);
  mouth(g, ...P(0, 7.6), s, st);
  // kulak tüyleri
  for (const sd of [-1, 1]) {
    line(g, hx + sd * 12 * s, hy - 8 * s, hx + sd * 13 * s, hy - 14 * s, '#f1d3c4');
    line(g, hx + sd * 10 * s, hy - 9 * s, hx + sd * 10.5 * s, hy - 13 * s, '#f1d3c4');
  }
  if (st.band) { // pembe ter bandı
    limb(g, ...P(-17, -7.5), ...P(17, -7.5), 1.9 * s, 1.9 * s, M.PAINT, { kind: K.BAND }, 0.1);
    limb(g, ...P(16, -7), ...P(20, -3), 1.1 * s, 0.9 * s, M.PAINT, { kind: K.BAND });
  }
  if (st.shades) { // güneş gözlüğü
    for (const sx of [-7.6, 7.6]) ellipse(g, ...P(sx, 0.8), 5.6 * s, 4.1 * s, M.PAINT, { kind: K.SHADES }, 0.05);
    limb(g, ...P(-2.4, 0), ...P(2.4, 0), 0.9 * s, 0.9 * s, M.PAINT, { kind: K.SHADES });
    for (const sd of [-1, 1]) limb(g, ...P(sd * 13, 0), ...P(sd * 17.5, -2.5), 0.8 * s, 0.8 * s, M.PAINT, { kind: K.SHADES });
    for (const sx of [-10, 5.2]) { px(g, ...P(sx, -1.4), M.SHINE); px(g, ...P(sx + 1, -2.3), M.SHINE); px(g, ...P(sx + 1.2, 1.2), M.SHINE); }
  }
  if (st.chef) { // şef şapkası (Mutfak sekmesinde)
    limb(g, ...P(-9, -13), ...P(9, -13), 2.6 * s, 2.6 * s, M.SOLID, {}, 0, '#efe6ee');
    for (const [x, y, r] of [[-6, -19, 5.4], [6, -19, 5.4], [0, -21.5, 6.2]]) ellipse(g, ...P(x, y), r * s, r * 0.85 * s, M.SOLID, {}, 0, '#fffaf3');
    line(g, ...P(-8, -13.5), ...P(8, -13.5), '#ff9fbd');
  }
  if (st.hat) { // parti şapkası (seri kutlaması)
    tri(g, ...P(-6, -13), ...P(6, -13), ...P(1.5, -25.5), M.PAINT, { kind: K.PINK }, 0.1);
    line(g, ...P(-3.6, -16.4), ...P(4.2, -17.8), '#fff4f8'); line(g, ...P(-1.2, -20.8), ...P(3.2, -21.8), '#fff4f8');
    ellipse(g, ...P(1.5, -26), 2.3 * s, 2.3 * s, M.SOLID, {}, 0, '#ffd84d');
  }
  whiskers(g, hx, hy, s, 0);
}

export function headSide(g, hx, hy, s, st) {
  const o = { ox: hx, oy: hy, sc: s, kind: 1 };
  const P = (x, y) => [hx + x * s, hy + y * s];
  if (st.earsBack) {
    tri(g, ...P(-16, -4), ...P(-24, -9), ...P(-4, -12), M.HEAD, o);
    tri(g, ...P(0, -13), ...P(-10, -17), ...P(10, -9), M.HEAD, o);
  } else {
    tri(g, ...P(-15, -2), ...P(-11, -19), ...P(-1, -12.5), M.HEAD, o);
    tri(g, ...P(2, -13), ...P(11, -20.5), ...P(16.5, -4), M.HEAD, o);
    tri(g, ...P(4.5, -11.5), ...P(10.5, -16.5), ...P(13.5, -6), M.EARIN, o);
  }
  ellipse(g, hx, hy, 16.5 * s, 14 * s, M.HEAD, o);
  ellipse(g, ...P(-8, 6), 8.5 * s, 7.5 * s, M.HEAD, o);
  tri(g, ...P(-15, 4), ...P(-21, 8.5), ...P(-14.5, 11), M.HEAD, o);
  ellipse(g, ...P(8.5, 8), 5.8 * s, 3.9 * s, M.CREAM, o, 0.15);
  ellipse(g, ...P(3, 9.2), 4 * s, 3 * s, M.CREAM, o, 0.1);
  ellipse(g, ...P(-6, 5.5), 2.8 * s, 1.5 * s, M.BLUSH, o);
  eye(g, ...P(-2.2, 0.8), s, st);
  eye(g, ...P(9.6, 0.8), s, st, 0.72);
  nose(g, ...P(14.2, 5), s * 0.85);
  mouth(g, ...P(12.4, 7.4), s * 0.85, st);
  if (st.band) {
    limb(g, ...P(-15, -6.5), ...P(13, -9), 1.9 * s, 1.9 * s, M.PAINT, { kind: K.BAND }, 0.1);
    limb(g, ...P(-15, -6), ...P(-20, -2.5), 1.1 * s, 0.9 * s, M.PAINT, { kind: K.BAND });
    limb(g, ...P(-15, -6), ...P(-19.5, -8.5), 1.1 * s, 0.9 * s, M.PAINT, { kind: K.BAND });
  }
  if (st.chef) {
    limb(g, ...P(-6, -14), ...P(9, -15), 2.4 * s, 2.4 * s, M.SOLID, {}, 0, '#efe6ee');
    for (const [x, y, r] of [[-3, -20, 5], [7, -20.5, 5], [2, -23, 5.6]]) ellipse(g, ...P(x, y), r * s, r * 0.85 * s, M.SOLID, {}, 0, '#fffaf3');
  }
  whiskers(g, hx, hy, s, 1);
}

/* ---------- pozlar ---------- */
function paw(g, x, y, ginger, rx = 5.4, ry = 3) {
  ellipse(g, x, y, rx, ry, ginger ? M.PAWG : M.PAWK, {}, 0.05);
}

// sit: st.paws = 'down' | 'groom' | 'chest' | 'together' | 'wave' | 'tap' | 'hold' | 'wipe'; st.headDy (baş eğme)
//      st.prop = 'clipboard' | 'fish' | 'bottle' | 'towel' | 'box'
export function sit(g, st) {
  g.clear();
  const cx = 44, t = st.t || 0;
  const bob = Math.sin(t * 2.4) > 0.3 ? 1 : 0;
  const sw = Math.sin(t * (st.tailFast ? 5 : 1.6));
  const paws = st.paws || (st.groom ? 'groom' : 'down');
  tube(g, [60, 80], [88 + sw * 1.5, 82], [80 + sw * 4, 57 + Math.abs(sw) * 2], 6.4, 5.2, M.TAIL);
  ellipse(g, 24, 70, 12.5, 11.5, M.FUR, { ox: cx, oy: 60 });
  ellipse(g, 64, 70, 12.5, 11.5, M.FUR, { ox: cx, oy: 60 });
  paw(g, 19, 81.5, true, 7, 3); paw(g, 69, 81.5, false, 7, 3);
  ellipse(g, cx, 60 + bob * 0.3, 24.5, 22, M.FUR, { ox: cx, oy: 60 });
  ellipse(g, cx, 49, 15, 13, M.RUFF, { ox: cx, oy: 49 });
  if (st.prop === 'towel') {
    limb(g, 27, 46, 61, 46, 3.3, 3.3, M.PAINT, { kind: K.TOP }, 0.05);
    limb(g, 33, 46, 32, 61, 2.9, 2.7, M.PAINT, { kind: K.TOP });
    limb(g, 55, 46, 56, 61, 2.9, 2.7, M.PAINT, { kind: K.TOP });
    line(g, 31, 58, 34, 58, '#ff7fa3'); line(g, 54, 58, 57, 58, '#ff7fa3');
  }
  // ön bacaklar
  ellipse(g, cx, 72, 3, 8, M.FAR, { ox: cx, oy: 60 });
  const leftUp = ['chest', 'together'].includes(paws) || st.prop === 'clipboard';
  const rightUp = paws !== 'down' || st.prop === 'clipboard';
  if (!leftUp) { limb(g, 37, 60, 37, 78, 4.5, 4.3, M.FUR, { ox: 37, oy: 60, kind: 1 }); paw(g, 37, 80.5, false, 5.8, 3.2); for (const x of [35, 39]) px(g, x, 82, M.LINE); }
  if (!rightUp) { limb(g, 51, 60, 51, 78, 4.5, 4.3, M.FUR, { ox: 51, oy: 60, kind: 1 }); paw(g, 51, 80.5, false, 5.8, 3.2); for (const x of [49, 53]) px(g, x, 82, M.LINE); }
  // kaldırılan patiler: [omuz, pati]
  let L = null, R = null;
  if (st.prop === 'clipboard') { L = [[37, 60], [37.5, 55]]; R = [[51, 60], [50.5, 55]]; }
  else if (paws === 'chest') { L = [[37, 60], [40, 47.5]]; R = [[51, 60], [48, 47.5]]; }
  else if (paws === 'together') { L = [[37, 60], [41.8, 47]]; R = [[51, 60], [46.2, 47]]; }
  else if (paws === 'groom') R = [[51, 60], [48, 42]];
  else if (paws === 'hold') R = [[51, 60], [49.5, 45.5]];
  else if (paws === 'wave') R = [[51, 58], [60 + Math.sin(t * 9) * 2.2, 38]];
  else if (paws === 'tap') R = [[51, 60], [65 + (st.tapK || 0) * 4, 70 - (st.tapK || 0) * 3]];
  else if (paws === 'wipe') R = [[51, 58], [53 + Math.sin(t * 14) * 3, 27]];
  for (const a of [L, R]) if (a) {
    limb(g, a[0][0], a[0][1], a[1][0], a[1][1] + 1.5, 5.5, 5.2, M.SOLID, {}, 0, INK);
    limb(g, a[0][0], a[0][1], a[1][0], a[1][1] + 1.5, 4.5, 4.2, M.FUR, { ox: a[0][0], oy: a[0][1], kind: 2 }, 0.08);
  }
  if (st.prop === 'clipboard') clipboard(g, 44, 52);
  const face = paws === 'groom' ? { ...st, eyes: 'closed', mouth: 'tongue' } : st;
  headFront(g, cx, 29 - bob + (st.headDy || 0), 1, face);
  if (st.prop === 'fish') fish(g, 43, 42.5);
  if (st.prop === 'bottle') bottle(g, 51, 50, 46.5, 38);
  for (const a of [L, R]) if (a) { ellipse(g, a[1][0], a[1][1], 5.6, 4.3, M.SOLID, {}, 0, INK); paw(g, a[1][0], a[1][1], true, 4.6, 3.3); }
  if (st.prop === 'box') box(g);
  return shade(g, PAT);
}

/* ---------- aksesuarlar ---------- */
function dumbbell(g, x, y, vert = false) {
  const a = vert ? [x, y - 5.4] : [x - 5.4, y], b = vert ? [x, y + 5.4] : [x + 5.4, y];
  limb(g, a[0], a[1], b[0], b[1], 1.1, 1.1, M.PAINT, { kind: K.METAL }, 0.1);
  for (const p of [a, b]) ellipse(g, p[0], p[1], vert ? 4.3 : 2.9, vert ? 2.9 : 4.3, M.PAINT, { kind: K.PINK }, 0.12);
}
function barbell(g, pL, pR) {
  const y = (pL[1] + pR[1]) / 2, x0 = pL[0] - 9, x1 = pR[0] + 9;
  limb(g, x0, y, x1, y, 1.1, 1.1, M.PAINT, { kind: K.METAL }, 0.1);
  for (const x of [x0, x1]) { // plakalar: iki yumak
    ellipse(g, x, y, 6.2, 6.2, M.PAINT, { kind: K.YARN }, 0.05);
    line(g, x - 4, y - 3, x + 3, y + 4, '#ffe3f0'); line(g, x - 4, y + 3, x + 4, y - 3, '#b44d82'); line(g, x - 5, y, x + 5, y + 1, '#ffe3f0');
  }
}
function whistle(g, x, y) {
  ellipse(g, x + 2, y - 2, 5.2, 3.6, M.SOLID, {}, 0, INK);
  ellipse(g, x + 2, y - 2, 4.2, 2.7, M.PAINT, { kind: K.METAL }, 0.35);
  limb(g, x + 5.5, y - 3, x + 8, y - 4, 1.3, 1.3, M.PAINT, { kind: K.METAL }, 0.2);
  px(g, x + 1, y - 3.5, M.SHINE); px(g, x + 2, y - 3.5, M.SHINE);
}
function clipboard(g, x, y) {
  for (let j = -9; j <= 9; j++) for (let i = -7; i <= 7; i++) g.put(x + i, y + j, M.PAINT, 0.55 - j * 0.01, { kind: K.WOOD });
  for (let j = -6; j <= 8; j++) for (let i = -5; i <= 5; i++) g.put(x + i, y + j, M.PAINT, 0.85, { kind: K.CREAM });
  for (let i = -3; i <= 3; i++) { g.put(x + i, y - 9, M.PAINT, 0.7, { kind: K.METAL }); g.put(x + i, y - 8, M.PAINT, 0.45, { kind: K.METAL }); }
  for (const r of [-3, 0, 3, 6]) line(g, x - 4, y + r, x + (r === 6 ? 1 : 4), y + r, '#8d7a86');
  line(g, x + 2, y + 5, x + 4, y + 7, '#ff5f8f');
}
function fish(g, x, y) {
  ellipse(g, x, y, 7.2, 3.2, M.PAINT, { kind: K.FISH }, 0.12);
  tri(g, x + 6, y, x + 11, y - 4, x + 11, y + 4, M.PAINT, { kind: K.FISH });
  px(g, x - 4, y - 1, M.PUPIL); line(g, x - 1, y - 2, x + 3, y - 2, '#e6f1fb');
}
function bottle(g, x0, y0, x1, y1) {
  limb(g, x0, y0, x1, y1, 2.8, 2.5, M.PAINT, { kind: K.WATER }, 0.1);
  const dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy);
  limb(g, x1, y1, x1 + dx / d * 2.5, y1 + dy / d * 2.5, 1.6, 1.6, M.PAINT, { kind: K.PINK });
  line(g, x0 - 1, y0 - 2, x1 - 1, y1 + 2, '#e9f7ff');
}
function box(g) {
  for (let y = 63; y <= 84; y++) for (let x = 16; x <= 72; x++) g.put(x, y, M.PAINT, 0.62 - (y - 63) * 0.012, { kind: K.CARD });
  tri(g, 16, 63, 22, 55, 34, 63, M.PAINT, { kind: K.CARD }, 0.12);
  tri(g, 54, 63, 66, 55, 72, 63, M.PAINT, { kind: K.CARD }, -0.08);
  for (let y = 63; y <= 84; y++) for (let x = 40; x <= 48; x++) g.put(x, y, M.PAINT, 0.9, { kind: K.CARD });
  line(g, 16, 64, 72, 64, '#8a5a2c');
}
function rope(g, pL, pR, ph) {
  const v = Math.cos(ph * Math.PI * 2);
  const cy = (pL[1] + pR[1]) / 2 + (v > 0 ? -v * 112 : -v * 48);
  const cx = (pL[0] + pR[0]) / 2;
  for (let i = 0; i <= 48; i++) {
    const t = i / 48, a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t;
    const x = a * pL[0] + b * cx + c * pR[0], y = a * pL[1] + b * cy + c * pR[1];
    g.overlay(x, y, '#ff5f8f'); g.overlay(x, y + 1, '#c23f6b');
  }
}
function hoop(g, cx, cy, ph, part) {
  const ox = Math.sin(ph * Math.PI * 2) * 3.5, oy = Math.cos(ph * Math.PI * 2) * 1.2;
  for (let a = 0; a < Math.PI * 2; a += 0.012) {
    const s = Math.sin(a); if ((part === 'back') !== (s < 0)) continue;
    const x = cx + ox + Math.cos(a) * 23, y = cy + oy + s * 5.5;
    const col = (Math.floor(a / 0.26) % 2) ? '#ff5f8f' : '#fff4f8';
    g.put(x, y, M.SOLID, 0.6, null, col); g.put(x, y + 1, M.SOLID, 0.6, null, col);
  }
}

// ayakta duruş (arka ayakları üstünde): antrenman pozları için
// st.pawL/pawR: pati hedefleri, st.elbowL/elbowR: dirsek (isteğe bağlı), st.squat 0..1, st.sway -1..1
// st.prop: 'db' | 'db2' | 'barbell' | 'whistle', st.rope (faz), st.hoop (faz), st.flex
export function stand(g, st) {
  g.clear();
  const t = st.t || 0, q = st.squat || 0, sway = st.sway || 0;
  const cx = 44 + sway * 2.2, dy = q * 7;
  const bob = Math.sin(t * 2.6) > 0.3 ? 1 : 0;
  const O = (p) => [p[0] + sway * 2.2, p[1] + dy];
  if (st.hoop != null) hoop(g, cx, 60 + dy, st.hoop, 'back');
  const sw = Math.sin(t * 2.2);
  tube(g, [cx + 8, 72], [cx + 26 + sw * 2, 77], [cx + 22 + sw * 5, 56 + Math.abs(sw) * 2], 5.6, 4.6, M.TAIL);
  for (const [sx, gi] of [[-1, true], [1, false]]) {
    const hip = [cx + sx * 9, 67 + dy], knee = [cx + sx * (10.5 + q * 5), 72 + dy * 0.6];
    ellipse(g, hip[0], hip[1], 8.6, 8.6, M.FUR, { ox: cx, oy: 60 });
    limb(g, knee[0], knee[1], cx + sx * (9.5 + q * 3), 80.5, 4.3, 3.9, M.FUR, { kind: 1 });
    paw(g, cx + sx * (10.5 + q * 3), 81.6, gi, 5.6, 2.6);
  }
  ellipse(g, cx, 57 + dy, 19, 16.5, M.FUR, { ox: cx, oy: 57 }); // tombul göbek
  ellipse(g, cx, 63 + dy, 10, 8.5, M.CREAM, { ox: cx, oy: 63 }, 0.12);
  ellipse(g, cx, 46 + dy, 13, 8.5, M.RUFF, { ox: cx, oy: 46 });
  const shL = [cx - 13, 49 + dy], shR = [cx + 13, 49 + dy];
  const pL = st.pawL ? O(st.pawL) : [cx - 14, 63 + dy], pR = st.pawR ? O(st.pawR) : [cx + 14, 63 + dy];
  const edge = (a, b, r0, r1) => limb(g, a[0], a[1], b[0], b[1], r0 + 1, r1 + 1, M.SOLID, {}, 0, INK);
  const arm = (sh, el, p) => { // koyu çerçeveli kol: gövdeden ayrı okunsun
    if (el) {
      edge(sh, el, 4.3, 3.9); edge(el, p, 3.9, 3.4);
      limb(g, sh[0], sh[1], el[0], el[1], 4.3, 3.9, M.FUR, { kind: 2 }, 0.08);
      if (st.flex) { const m = [(sh[0] + el[0]) / 2, (sh[1] + el[1]) / 2 - 2.4]; ellipse(g, m[0], m[1], 4.6, 3.6, M.SOLID, {}, 0, INK); ellipse(g, m[0], m[1], 3.8, 2.9, M.FUR, { kind: 2 }, 0.25); }
      limb(g, el[0], el[1], p[0], p[1], 3.9, 3.4, M.FUR, { kind: 2 }, 0.08);
    } else { edge(sh, p, 4.3, 3.6); limb(g, sh[0], sh[1], p[0], p[1], 4.3, 3.6, M.FUR, { kind: 2 }, 0.08); }
  };
  if (st.prop === 'barbell') barbell(g, pL, pR);
  arm(shL, st.elbowL ? O(st.elbowL) : null, pL); arm(shR, st.elbowR ? O(st.elbowR) : null, pR);
  headFront(g, cx + sway * 0.6, 28 + dy - bob * 0.5 + (st.headDy || 0), 0.94, st);
  if (st.prop === 'db') dumbbell(g, pR[0], pR[1], st.dbVert);
  if (st.prop === 'db2') { dumbbell(g, pL[0], pL[1], st.dbVert); dumbbell(g, pR[0], pR[1], st.dbVert); }
  if (st.prop === 'whistle') { line(g, cx - 6, 44 + dy, pR[0] - 2, pR[1] + 2, '#ff5f8f'); line(g, cx + 6, 44 + dy, pR[0] + 1, pR[1] + 2, '#ff5f8f'); whistle(g, pR[0], pR[1]); }
  for (const p of [pL, pR]) { ellipse(g, p[0], p[1], 4.9, 4.3, M.SOLID, {}, 0, INK); paw(g, p[0], p[1], true, 3.9, 3.3); }
  if (st.prop === 'whistle') whistle(g, pR[0], pR[1]);
  if (st.rope != null) rope(g, pL, pR, st.rope);
  if (st.hoop != null) hoop(g, cx, 60 + dy, st.hoop, 'front');
  return shade(g, PAT);
}

// plank / şınav: yandan, gövde düz; st.down 0..1 (şınavda iniş), st.tremble
export function plank(g, st) {
  g.clear();
  const d = st.down || 0, tr = st.tremble && (Math.floor((st.t || 0) * 22) % 2) ? 1 : 0;
  const by = 66 + d * 4 - tr, bx = 40;
  limb(g, 22, by + 1, 7, 80, 3.9, 3.4, M.FAR, { kind: 1 }); paw(g, 6, 81.6, false, 4.4, 2.2);
  limb(g, 24, by + 2, 10, 80.5, 4.1, 3.6, M.FUR, { kind: 1 }); paw(g, 9, 82, true, 4.6, 2.3);
  tube(g, [18, by - 2], [7, by - 9], [11, by - 24 + tr], 5, 4, M.TAIL);
  ellipse(g, bx, by, 22, 9.6, M.FUR, { ox: bx, oy: by });
  limb(g, 53, by + 2, 55, 79.5, 4, 3.6, M.FAR, { kind: 1 }); paw(g, 56, 81.4, false, 4.6, 2.4);
  limb(g, 57, by + 2, 60, 79.5, 4.2, 3.8, M.FUR, { kind: 1 }); paw(g, 61, 81.6, false, 4.8, 2.5);
  ellipse(g, 57, by + 1, 7.5, 7.5, M.RUFF, { ox: 57, oy: by + 1 });
  headSide(g, 66, by - 12 + d * 2, 0.95, st);
  return shade(g, PAT);
}

// koşu bandı (yürüme pozunun altına): ph = bant fazı; ekran ve direk kedinin arkasında kalır
function treadmill(g, ph) {
  limb(g, 79, 83, 82, 54, 1.5, 1.5, M.PAINT, { kind: K.LILAC }, 0.1);
  for (let y = 47; y <= 53; y++) for (let x = 78; x <= 86; x++) g.put(x, y, M.PAINT, y === 47 ? 0.85 : 0.5, { kind: K.LILAC });
  for (let y = 49; y <= 51; y++) for (let x = 80; x <= 84; x++) g.put(x, y, M.PAINT, (x + Math.floor(ph * 3)) % 3 ? 0.55 : 0.9, { kind: K.PINK });
  for (let x = 3; x <= 85; x++) {
    g.put(x, 84, M.PAINT, 0.78, { kind: K.LILAC });
    g.put(x, 85, M.PAINT, (x + Math.floor(ph * 10)) % 5 ? 0.3 : 0.85, { kind: K.SHADES });
    g.put(x, 86, M.PAINT, 0.35, { kind: K.LILAC });
  }
}

export function walk(g, st) {
  g.clear();
  const ph = st.phase || 0, run = !!st.run, t = st.t || 0;
  if (st.belt != null) treadmill(g, st.belt);
  const amp = run ? 7 : 4.2;
  const bob = run ? Math.round(Math.abs(Math.sin(ph)) * 2) : (Math.sin(ph * 2) > 0 ? 1 : 0);
  const by = (run ? 61 : 59) - bob, bx = 40;
  const leg = (hx, phi, mat, ginger) => {
    const sw = Math.sin(phi) * amp;
    const lift = Math.max(0, Math.cos(phi)) * (run ? 4 : 2.6);
    const fx = hx + sw, fy = GROUND - lift;
    limb(g, hx, by + 7, fx, fy - 2.5, 4.1, 3.7, mat, { ox: hx, oy: by, kind: 1 });
    paw(g, fx + 1, fy, ginger, 4.8, 2.6);
  };
  leg(26, ph + Math.PI, M.FAR, false); leg(55, ph, M.FAR, false);
  const wag = Math.sin(t * 3) * 2;
  if (run) tube(g, [19, by - 4], [6, by - 5], [-2, by - 9 + wag], 5.4, 4.4, M.TAIL);
  else tube(g, [19, by - 5], [3, by - 6 + wag], [10 + wag, by - 30], 5.6, 4.6, M.TAIL);
  ellipse(g, bx, by, run ? 25 : 23, run ? 13.5 : 15.5, M.FUR, { ox: bx, oy: by });
  leg(30, ph, M.FUR, true); leg(59, ph + Math.PI, M.FUR, false);
  ellipse(g, 58, by + 1, 8.5, 9, M.RUFF, { ox: 58, oy: by + 1 });
  headSide(g, 63, by - 17 + (run ? 4 : 0), 1, { ...st, earsBack: run || st.earsBack });
  return shade(g, PAT);
}

// zıplama: phase 0 çömelme, 1 havada, 2 iniş
export function jump(g, st) {
  g.clear();
  const p = st.jumpPhase ?? 1;
  if (p === 1) {
    const by = 54, bx = 42;
    tube(g, [18, by - 2], [6, by - 4], [-1, by - 12], 5.2, 4.2, M.TAIL);
    limb(g, 28, by + 6, 12, by + 16, 4, 3.6, M.FAR, { kind: 1 }); paw(g, 11, by + 17, false, 4.4, 2.6);
    limb(g, 56, by + 4, 72, by + 8, 4, 3.6, M.FAR, { kind: 1 }); paw(g, 74, by + 9, false, 4.4, 2.6);
    ellipse(g, bx, by, 25, 13, M.FUR, { ox: bx, oy: by });
    limb(g, 30, by + 7, 16, by + 19, 4.1, 3.7, M.FUR, { kind: 1 }); paw(g, 15, by + 20, true, 4.6, 2.6);
    limb(g, 58, by + 5, 76, by + 11, 4.1, 3.7, M.FUR, { kind: 1 }); paw(g, 78, by + 12, false, 4.6, 2.6);
    ellipse(g, 60, by + 1, 8, 8, M.RUFF, { ox: 60, oy: by + 1 });
    headSide(g, 66, by - 14, 1, { ...st, eyes: st.eyes || 'open', earsBack: true });
  } else {
    const squash = p === 0 ? 1 : 0.6;
    const by = 66 + squash * 1, bx = 40;
    tube(g, [18, by - 3], [4, by - 6], [8, by - 24], 5.6, 4.6, M.TAIL);
    for (const [x, mat, gi] of [[26, M.FAR, false], [55, M.FAR, false], [30, M.FUR, true], [59, M.FUR, false]]) {
      limb(g, x, by + 4, x + 2, GROUND - 2, 4.2, 3.9, mat, { kind: 1 }); paw(g, x + 3, GROUND, gi, 5, 2.6);
    }
    ellipse(g, bx, by, 25 + squash, 13.5 - squash, M.FUR, { ox: bx, oy: by });
    ellipse(g, 58, by + 1, 8.5, 8, M.RUFF, { ox: 58, oy: by + 1 });
    headSide(g, 63, by - 14, 1, { ...st, earsBack: p === 0 });
  }
  return shade(g, PAT);
}

export function scared(g, st) {
  g.clear();
  const tr = (Math.floor((st.t || 0) * 24) % 2);
  const by = 50 - tr, bx = 40;
  tube(g, [18, by - 2], [10, by - 18], [16, by - 36], 8, 6.8, M.TAIL, {}, 0.05);
  for (let i = 0; i < 7; i++) {
    const y = by - 6 - i * 4.4, x = 14 + Math.sin(i) * 2;
    tri(g, x - 8, y, x - 12, y - 3, x - 6, y - 4, M.TAIL); tri(g, x + 7, y, x + 12, y - 3, x + 6, y - 4, M.TAIL);
  }
  for (const [x, mat, gi] of [[25, M.FAR, false], [56, M.FAR, false], [29, M.FUR, true], [60, M.FUR, false]]) {
    limb(g, x, by + 6, x + (mat === M.FAR ? 1 : 0), GROUND - 3, 3.8, 3.4, mat, { kind: 1 }); paw(g, x + 1, GROUND - 1, gi, 4.4, 2.4);
  }
  ellipse(g, bx, by, 23, 15, M.FUR, { ox: bx, oy: by });
  ellipse(g, bx - 2, by - 8, 17, 11, M.FUR, { ox: bx, oy: by });
  for (let i = 0; i < 9; i++) { // kabarmış sırt tüyleri
    const a = Math.PI * (0.12 + i * 0.095), x = bx - 2 - Math.cos(a) * 17, y = by - 8 - Math.sin(a) * 11;
    tri(g, x - 2.5, y + 1, x + Math.cos(a) * -3, y - 5, x + 2.5, y + 1, M.FUR, { ox: bx, oy: by });
  }
  ellipse(g, 58, by + 2, 8.5, 9, M.RUFF, { ox: 58, oy: by + 2 });
  headSide(g, 62, by - 12, 1, { ...st, eyes: 'wide', mouth: 'meow' });
  return shade(g, PAT, { fluffAmount: 0.32 });
}

export function dangle(g, st) {
  g.clear();
  const sw = st.swing || 0, cx = 44;
  tube(g, [cx + 5, 70], [cx + 10 - sw * 8, 80], [cx + 4 - sw * 14, 87], 5.2, 4.2, M.TAIL);
  limb(g, cx - 9, 64, cx - 10 - sw * 3, 79, 4.4, 4, M.FUR, { kind: 1 }); paw(g, cx - 10 - sw * 3, 81, true, 5, 3);
  limb(g, cx + 9, 64, cx + 10 - sw * 3, 79, 4.4, 4, M.FUR, { kind: 1 }); paw(g, cx + 10 - sw * 3, 81, false, 5, 3);
  ellipse(g, cx, 57, 15.5, 17.5, M.FUR, { ox: cx, oy: 57 });
  ellipse(g, cx, 45, 11.5, 8.5, M.RUFF, { ox: cx, oy: 45 });
  limb(g, cx - 7, 46, cx - 8 - sw * 1.5, 58, 3.8, 3.5, M.FUR, { kind: 1 }); paw(g, cx - 8 - sw * 1.5, 60, false, 4.4, 2.8);
  limb(g, cx + 7, 46, cx + 8 - sw * 1.5, 58, 3.8, 3.5, M.FUR, { kind: 1 }); paw(g, cx + 8 - sw * 1.5, 60, false, 4.4, 2.8);
  headFront(g, cx, 25, 0.95, st);
  return shade(g, PAT);
}

export function sleep(g, st) {
  g.clear();
  const br = Math.sin((st.t || 0) * 1.3);
  tube(g, [18, 76], [12, 88], [54, 84], 5.6, 4.6, M.TAIL);
  ellipse(g, 40, 71 - br * 0.6, 26, 13.5 + br * 0.6, M.FUR, { ox: 40, oy: 71 });
  ellipse(g, 61, 75, 8, 6, M.RUFF, { ox: 61, oy: 75 });
  headFront(g, 60, 64, 0.8, { ...st, eyes: 'closed', mouth: 'closed' });
  paw(g, 67, 80, false, 5, 2.6);
  return shade(g, PAT);
}

// yemek / su: başı öne ve aşağı eğik
export function eat(g, st) {
  g.clear();
  const chomp = Math.sin((st.t || 0) * (st.drink ? 14 : 11)) > 0;
  const by = 63, bx = 38;
  tube(g, [17, by - 4], [2, by - 6], [9, by - 28], 5.6, 4.6, M.TAIL);
  for (const [x, mat, gi] of [[24, M.FAR, false], [52, M.FAR, false], [28, M.FUR, true], [56, M.FUR, false]]) {
    limb(g, x, by + 5, x + 1, GROUND - 2, 4.2, 3.9, mat, { kind: 1 }); paw(g, x + 2, GROUND, gi, 5, 2.6);
  }
  ellipse(g, bx, by, 23, 14.5, M.FUR, { ox: bx, oy: by });
  ellipse(g, 57, by + 3, 8, 8, M.RUFF, { ox: 57, oy: by + 3 });
  const hy = 64 + (chomp ? 1 : 0);
  headSide(g, 66, hy, 0.95, { ...st, eyes: 'happy', mouth: st.drink ? (chomp ? 'tongue' : 'closed') : (chomp ? 'open' : 'closed') });
  return shade(g, PAT);
}

// kum kabı: çömelme (kaş çatık) ve eşeleme
export function squat(g, st) {
  g.clear();
  const dig = !!st.dig, k = Math.sin((st.t || 0) * 16);
  const by = 64, bx = 42;
  tube(g, [20, by - 8], [8, by - 20], [14, by - 34], 5.4, 4.4, M.TAIL);
  ellipse(g, 26, by + 8, 12, 10, M.FUR, { ox: bx, oy: by });
  paw(g, 22, GROUND, true, 6, 2.8);
  ellipse(g, bx, by - 2, 19, 17, M.FUR, { ox: bx, oy: by });
  ellipse(g, 54, by + 1, 8, 9, M.RUFF, { ox: 54, oy: by + 1 });
  if (dig) {
    limb(g, 56, by + 6, 64 + k * 5, GROUND - 3, 4, 3.6, M.FUR, { kind: 1 }); paw(g, 65 + k * 5, GROUND - 1, false, 4.8, 2.6);
    limb(g, 50, by + 8, 50, GROUND - 2, 4, 3.6, M.FAR, { kind: 1 }); paw(g, 51, GROUND, false, 4.8, 2.6);
  } else {
    limb(g, 50, by + 6, 52, GROUND - 2, 4, 3.6, M.FAR, { kind: 1 }); paw(g, 53, GROUND, false, 4.8, 2.6);
    limb(g, 56, by + 6, 58, GROUND - 2, 4, 3.6, M.FUR, { kind: 1 }); paw(g, 59, GROUND, false, 4.8, 2.6);
  }
  headSide(g, 58, by - 20, 1, { ...st, eyes: dig ? 'open' : 'squint', mouth: 'closed' });
  return shade(g, PAT);
}

// esneme: ön bacaklar ileride, kalça yukarıda (ısınmaya örnek!)
export function stretch(g, st) {
  g.clear();
  const by = 62;
  tube(g, [18, by - 12], [8, by - 26], [16, by - 42], 5.4, 4.4, M.TAIL);
  limb(g, 22, by - 4, 22, GROUND - 2, 4.3, 4, M.FAR, { kind: 1 }); paw(g, 23, GROUND, false, 5, 2.6);
  limb(g, 27, by - 4, 27, GROUND - 2, 4.3, 4, M.FUR, { kind: 1 }); paw(g, 28, GROUND, true, 5, 2.6);
  ellipse(g, 36, by - 4, 19, 12, M.FUR, { ox: 36, oy: by - 4 });
  ellipse(g, 52, by + 6, 13, 9, M.FUR, { ox: 36, oy: by - 4 });
  limb(g, 58, by + 10, 76, GROUND - 1, 4, 3.6, M.FAR, { kind: 1 }); paw(g, 78, GROUND, false, 5, 2.6);
  limb(g, 60, by + 12, 81, GROUND - 1, 4.1, 3.7, M.FUR, { kind: 1 }); paw(g, 83, GROUND, false, 5, 2.6);
  headSide(g, 66, 70, 0.9, { ...st, eyes: st.eyes || 'closed', mouth: st.mouth || 'open' });
  return shade(g, PAT);
}

// yakın plan yüz: ekrana yaklaşınca
export function face(g, st) {
  g.clear();
  headFront(g, 52, 50, 2.15, st);
  if (st.boop > 0) {
    const py = 96 - st.boop * 28, bx = 24;
    ellipse(g, bx, py + 8, 14, 13, M.PAWK, { ox: bx, oy: py });
    ellipse(g, bx, py + 11, 6.5, 5, M.PINK, {}, 0.1);
    for (const [dx, dy] of [[-9, 1], [-3.2, -4], [3.2, -4], [9, 1]]) ellipse(g, bx + dx, py + dy, 3, 2.8, M.PINK, {}, 0.15);
  }
  return shade(g, PAT, { fluffAmount: 0.14 });
}

export const POSES = { sit, walk, jump, scared, dangle, sleep, eat, squat, stretch, stand, plank };
