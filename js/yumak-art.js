// Yumak'ın pozları. Tümü 88x88'lik ızgaraya çizilir (yakın plan yüz hariç).
// Kaplumbağa kabuğu desenli, tombul, kocaman gözlü.
import { M, ellipse, tri, limb, tube, px, line, shade, fbm, WHITE } from './pixel.js';

export const W = 88, H = 88, FACE_W = 104, FACE_H = 88;
const GROUND = 83;

/* ---------- desenler ---------- */
function furPattern(lx, ly, kind) {
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
function eye(g, cx, cy, s, st, xs = 1) {
  const mode = st.blink ? 'closed' : (st.eyes || 'open');
  const L = (pts) => pts.forEach(([x, y]) => {
    for (let dy = 0; dy < Math.max(1, Math.round(s * 0.8)); dy++) px(g, Math.round(cx + x * s * xs), Math.round(cy + y * s) + dy, M.LINE);
  });
  if (mode === 'closed') { L([[-3, -0.2], [-2, 0.6], [-1, 1], [0, 1.1], [1, 1], [2, 0.6], [3, -0.2]]); return; }
  if (mode === 'happy') { L([[-3, 1], [-2, 0], [-1, -0.6], [0, -0.9], [1, -0.6], [2, 0], [3, 1]]); return; }
  if (mode === 'squint') { L([[-3, -1], [-1, 0], [1, 1], [-3, 2.4], [-1, 1.8]]); return; } // >
  const look = st.look || { x: 0, y: 0 };
  ellipse(g, cx, cy, 4.3 * s * xs, 4.8 * s, M.IRIS, { ox: cx, oy: cy }, 0);
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
  eye(g, ...P(-7.6, 1), s, st);
  eye(g, ...P(7.6, 1), s, st);
  nose(g, ...P(0, 5.2), s);
  mouth(g, ...P(0, 7.6), s, st);
  // kulak tüyleri
  for (const sd of [-1, 1]) {
    line(g, hx + sd * 12 * s, hy - 8 * s, hx + sd * 13 * s, hy - 14 * s, '#f1d3c4');
    line(g, hx + sd * 10 * s, hy - 9 * s, hx + sd * 10.5 * s, hy - 13 * s, '#f1d3c4');
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
  whiskers(g, hx, hy, s, 1);
}

/* ---------- pozlar ---------- */
function paw(g, x, y, ginger, rx = 5.4, ry = 3) {
  ellipse(g, x, y, rx, ry, ginger ? M.PAWG : M.PAWK, {}, 0.05);
}

export function sit(g, st) {
  g.clear();
  const cx = 44, t = st.t || 0;
  const bob = Math.sin(t * 2.4) > 0.3 ? 1 : 0;
  const sw = Math.sin(t * (st.tailFast ? 5 : 1.6));
  tube(g, [60, 80], [88 + sw * 1.5, 82], [80 + sw * 4, 57 + Math.abs(sw) * 2], 6.4, 5.2, M.TAIL);
  ellipse(g, 24, 70, 12.5, 11.5, M.FUR, { ox: cx, oy: 60 });
  ellipse(g, 64, 70, 12.5, 11.5, M.FUR, { ox: cx, oy: 60 });
  paw(g, 19, 81.5, true, 7, 3); paw(g, 69, 81.5, false, 7, 3);
  ellipse(g, cx, 60 + bob * 0.3, 24.5, 22, M.FUR, { ox: cx, oy: 60 });
  ellipse(g, cx, 49, 15, 13, M.RUFF, { ox: cx, oy: 49 });
  // ön bacaklar (biri yalanmak için kalkabilir)
  ellipse(g, cx, 72, 3, 8, M.FAR, { ox: cx, oy: 60 });
  limb(g, 37, 60, 37, 78, 4.5, 4.3, M.FUR, { ox: 37, oy: 60, kind: 1 });
  paw(g, 37, 80.5, false, 5.8, 3.2);
  if (st.groom) {
    limb(g, 51, 60, 48, 44, 4.5, 4.2, M.FUR, { ox: 51, oy: 60, kind: 1 });
    paw(g, 48, 41.5, false, 5, 3.4);
  } else {
    limb(g, 51, 60, 51, 78, 4.5, 4.3, M.FUR, { ox: 51, oy: 60, kind: 1 });
    paw(g, 51, 80.5, false, 5.8, 3.2);
  }
  for (const x of [35, 39]) px(g, x, 82, M.LINE);
  if (!st.groom) for (const x of [49, 53]) px(g, x, 82, M.LINE);
  headFront(g, cx, 29 - bob, 1, st.groom ? { ...st, eyes: 'closed', mouth: 'tongue' } : st);
  if (st.groom) paw(g, 48, 41.5, false, 5, 3.4);
  return shade(g, PAT);
}

export function walk(g, st) {
  g.clear();
  const ph = st.phase || 0, run = !!st.run, t = st.t || 0;
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
  headSide(g, 66, 70, 0.9, { ...st, eyes: 'closed', mouth: 'open' });
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

export const POSES = { sit, walk, jump, scared, dangle, sleep, eat, squat, stretch };
