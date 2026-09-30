// Tarçın: hareketleri gösteren kaslı, turuncu tekir kedi.
// Yandan görünüm (sağa bakar). Pozlar anahtar karelerle tanımlanır; dirsek/diz ters kinematikle bulunur.
import { Grid, M, ellipse, tri, limb, tube, rect, px, line, shade, paint, INK } from './pixel.js';

export const TW = 80, TH = 80;
const GROUND = 72;                 // ayak tabanı hizası
const L = { torso: 17, ua: 10, fa: 9.5, th: 12.5, sh: 12.5 };
const D2R = Math.PI / 180;
const lerp = (a, b, k) => a + (b - a) * k;
const lerpP = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
const ease = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

const PAT = {
  furRamp: (lx, ly, k) => (k === 1 && ((Math.floor(Math.hypot(lx, ly)) + 1) % 5 === 0)) ? 'tabby' : 'ginger',
  headRamp: (lx, ly) => (ly < -2.5 && Math.abs(lx + 0.5) < 3.5 && (Math.round(lx + 10) % 2 === 0)) ? 'tabby' : 'ginger',
};

/* ---------- ters kinematik ---------- */
function ik(root, target, l1, l2, bend) {
  const dx = target[0] - root[0], dy = target[1] - root[1];
  const a = Math.atan2(dy, dx);
  const d = Math.min(Math.max(Math.hypot(dx, dy), Math.abs(l1 - l2) + 0.1), l1 + l2 - 0.05);
  const A = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))));
  const ang = a + bend * A;
  return [[root[0] + Math.cos(ang) * l1, root[1] + Math.sin(ang) * l1], [root[0] + Math.cos(a) * d, root[1] + Math.sin(a) * d]];
}

/* ---------- pozu iskelete çevir ---------- */
function skeleton(p) {
  const th = (p.torso || 0) * D2R;
  const up = [Math.sin(th), -Math.cos(th)], fw = [Math.cos(th), Math.sin(th)];
  const hip = p.hip, sh = [hip[0] + up[0] * L.torso, hip[1] + up[1] * L.torso];
  const hdDeg = p.headDir != null ? p.headDir : (p.torso || 0) + (p.head || 0);
  const hd = hdDeg * D2R, hup = [Math.sin(hd), -Math.cos(hd)];
  const head = [sh[0] + hup[0] * 8.6, sh[1] + hup[1] * 8.6];
  const T = (v) => {
    if (v[0] === 'c') return [sh[0] + fw[0] * v[1] - up[0] * v[2], sh[1] + fw[1] * v[1] - up[1] * v[2]];
    if (v[0] === 'h') return [hip[0] + v[1], hip[1] + v[2]];
    return v;
  };
  const arm = (hand, bend) => ik(sh, T(hand), L.ua, L.fa, bend);
  const leg = (foot, knee, bend) => {
    if (knee) { const k = T(knee), f = T(foot), d = Math.hypot(f[0] - k[0], f[1] - k[1]) || 1; return [k, [k[0] + (f[0] - k[0]) / d * L.sh, k[1] + (f[1] - k[1]) / d * L.sh]]; }
    return ik(hip, T(foot), L.th, L.sh, bend);
  };
  const [eN, hN] = arm(p.hn, p.eN ?? 1), [eF, hF] = arm(p.hf, p.eF ?? 1);
  const [kN, fN] = leg(p.fn, p.kneeN, p.kN ?? -1), [kF, fF] = leg(p.ff, p.kneeF, p.kF ?? -1);
  return { hip, sh, head, hd, up, fw, eN, hN, eF, hF, kN, fN, kF, fF, toeN: p.toeN ?? 0, toeF: p.toeF ?? 0, arch: p.arch || 0, db: p.db || null, prop: p.prop || null, expr: p.expr || null };
}
function mix(a, b, k) {
  const o = { ...a };
  for (const key of ['hip', 'sh', 'head', 'eN', 'hN', 'eF', 'hF', 'kN', 'fN', 'kF', 'fF', 'up', 'fw']) o[key] = lerpP(a[key], b[key], k);
  for (const key of ['hd', 'toeN', 'toeF', 'arch']) o[key] = lerp(a[key], b[key], k);
  if (k > 0.5) { o.db = b.db; o.prop = b.prop; o.expr = b.expr; }
  return o;
}

/* ---------- çizim ---------- */
function border(g, a, b, r0, r1) { limb(g, a[0], a[1], b[0], b[1], r0 + 1, r1 + 1, M.SOLID, {}, 0, INK); }
function drawArm(g, s, e, h, far) {
  const mat = far ? M.FAR : M.FUR;
  const mid = lerpP(s, e, 0.45);
  border(g, s, e, 3.6, 3); border(g, e, h, 2.9, 2.5);
  limb(g, s[0], s[1], mid[0], mid[1], 3.5, 3.9, mat, { kind: 1 }, far ? -0.1 : 0.05);    // omuz + pazu
  limb(g, mid[0], mid[1], e[0], e[1], 3.9, 2.9, mat, { kind: 1 }, far ? -0.1 : 0.05);
  limb(g, e[0], e[1], h[0], h[1], 2.9, 2.4, mat, { kind: 1 }, far ? -0.12 : 0);
  ellipse(g, h[0], h[1], 2.7, 2.7, M.PAINT, { kind: far ? 11 : 10 }, far ? -0.1 : 0.1);   // pati
}
function drawLeg(g, hip, k, f, toe, far) {
  const mat = far ? M.FAR : M.FUR;
  const mid = lerpP(hip, k, 0.55);
  border(g, hip, k, 4.9, 3.8); border(g, k, f, 3.6, 2.6);
  limb(g, hip[0], hip[1], mid[0], mid[1], 4.9, 4.6, M.PAINT, { kind: 2 }, far ? -0.15 : 0);   // şort
  limb(g, mid[0], mid[1], k[0], k[1], 4.3, 3.6, mat, { kind: 1 }, far ? -0.1 : 0.05);
  const calf = lerpP(k, f, 0.3);
  limb(g, k[0], k[1], calf[0], calf[1], 3.5, 3.7, mat, { kind: 1 }, far ? -0.1 : 0.05);
  limb(g, calf[0], calf[1], f[0], f[1], 3.7, 2.5, mat, { kind: 1 }, far ? -0.1 : 0.05);
  const a = toe * D2R, tip = [f[0] + Math.cos(a) * 5, f[1] + Math.sin(a) * 5];
  limb(g, f[0] - Math.cos(a) * 0.8, f[1] - Math.sin(a) * 0.8, tip[0], tip[1], 2.6, 2.3, M.PAINT, { kind: 3 }, far ? -0.2 : 0.1);  // ayakkabı
  limb(g, f[0] + Math.sin(a) * 2, f[1] + Math.cos(a) * 2 - 0.3, tip[0] + Math.sin(a) * 1.8, tip[1] + Math.cos(a) * 1.8, 0.8, 0.8, M.PAINT, { kind: 4 });  // pembe taban
}
function drawTorso(g, S) {
  const { hip, sh, up, fw, arch } = S;
  const waist = lerpP(hip, sh, 0.34);
  if (arch) {
    const mid = [lerp(hip[0], sh[0], 0.5) - fw[0] * arch * 5, lerp(hip[1], sh[1], 0.5) - fw[1] * arch * 5];
    tube(g, [hip[0] - 1, hip[1]], mid, sh, 6.6, 8.6, M.SOLID, {}, 0, INK); // çerçeve
    tube(g, hip, mid, sh, 5.4, 7.4, M.PAINT, { kind: 1 });
    ellipse(g, hip[0], hip[1], 5.4, 5.2, M.PAINT, { kind: 2 });
  } else {
    limb(g, hip[0], hip[1], sh[0], sh[1], 6.4, 8.6, M.SOLID, {}, 0, INK);
    limb(g, hip[0], hip[1], waist[0], waist[1], 5.3, 5.3, M.PAINT, { kind: 2 });
    limb(g, waist[0], waist[1], sh[0], sh[1], 5.2, 7.5, M.PAINT, { kind: 1 });
    // göğüs kası
    ellipse(g, sh[0] - up[0] * 3.6 + fw[0] * 3.2, sh[1] - up[1] * 3.6 + fw[1] * 3.2, 4.6, 4.2, M.PAINT, { kind: 1 }, 0.12);
  }
  // boyun
  limb(g, sh[0], sh[1], sh[0] + up[0] * 4, sh[1] + up[1] * 4, 2.9, 2.9, M.FUR, { kind: 0 });
  // kuyruk
  const tb = [hip[0] - fw[0] * 3 + up[0] * 1, hip[1] - fw[1] * 3 + up[1] * 1];
  tube(g, tb, [tb[0] - fw[0] * 9 - up[0] * 2, tb[1] - fw[1] * 9 - up[1] * 2], [tb[0] - fw[0] * 10 + up[0] * 9, tb[1] - fw[1] * 10 + up[1] * 9], 2.3, 1.8, M.FUR, { kind: 1 });
}
function drawHead(g, c, hd, expr) {
  const cs = Math.cos(hd), sn = Math.sin(hd);
  const P = (x, y) => [c[0] + x * cs - y * sn, c[1] + x * sn + y * cs];
  const o = { ox: c[0], oy: c[1] };
  tri(g, ...P(-5.6, -3.2), ...P(-3.6, -11.5), ...P(0.4, -5.4), M.HEAD, o);
  tri(g, ...P(-0.4, -5.6), ...P(3.4, -12), ...P(5.6, -3.8), M.HEAD, o);
  tri(g, ...P(1.2, -6), ...P(3.3, -10), ...P(4.4, -5), M.EARIN, o);
  ellipse(g, c[0], c[1], 7.3, 6.9, M.HEAD, o);
  tri(g, ...P(-6.2, 0.6), ...P(-9.6, 2.8), ...P(-5.6, 4.6), M.HEAD, o);
  const mz = P(5.4, 2.4); ellipse(g, mz[0], mz[1], 3.7, 2.9, M.CREAM, o, 0.15);
  const n = P(8.6, 0.6); px(g, n[0], n[1], M.PINK); px(g, n[0] - 1, n[1], M.PINK);
  // bandana
  const b0 = P(-7, -3.4), b1 = P(6.2, -4.4);
  limb(g, b0[0], b0[1], b1[0], b1[1], 1.25, 1.25, M.PAINT, { kind: 4 });
  const t0 = P(-7.2, -3), t1 = P(-10.5, -1.2), t2 = P(-10.4, 0.8);
  limb(g, t0[0], t0[1], t1[0], t1[1], 0.8, 0.7, M.PAINT, { kind: 4 }); limb(g, t0[0], t0[1], t2[0], t2[1], 0.8, 0.7, M.PAINT, { kind: 4 });
  // göz: kendinden emin, yarı kapalı
  const e = P(2.7, -0.6);
  if (expr === 'strain') { px(g, e[0] - 1, e[1], M.LINE); px(g, e[0], e[1] + 0.6, M.LINE); px(g, e[0] + 1, e[1], M.LINE); }
  else { ellipse(g, e[0], e[1], 1.3, 1.6, M.PUPIL); px(g, e[0] - 0.6, e[1] - 0.9, M.SHINE); const br = P(1.2, -2.9), br2 = P(4.4, -3.1); line(g, br[0], br[1], br2[0], br2[1], '#7a3f1f'); }
  const m0 = P(5.6, 4.6), m1 = P(7.6, 4.2); line(g, m0[0], m0[1], m1[0], m1[1], '#5a2a20');
  const w0 = P(8, 2.6), w1 = P(13, 1.6), w2 = P(13, 4.2); line(g, w0[0], w0[1], w1[0], w1[1], '#fff4ea'); line(g, w0[0], w0[1] + 0.8, w2[0], w2[1], '#fff4ea');
}
function drawDumbbell(g, S) {
  if (!S.db) return;
  const [kind, where] = S.db.split('@');
  let c = where === 'f' ? S.hF : where === 'hip' ? [S.hip[0] + S.up[0] * 1 + S.fw[0] * 4.5, S.hip[1] + S.up[1] * 1 + S.fw[1] * 4.5] : S.hN;
  if (kind === 'end') {
    ellipse(g, c[0], c[1], 3.7, 3.7, M.SOLID, {}, 0, INK);
    ellipse(g, c[0], c[1], 3, 3, M.PAINT, { kind: 5 }, 0.1);
    ellipse(g, c[0], c[1], 1.1, 1.1, M.PAINT, { kind: 5 }, -0.3);
  } else if (kind === 'vert' || kind === 'hang') {
    if (kind === 'hang') c = [c[0], c[1] + 5];
    limb(g, c[0], c[1] - 5, c[0], c[1] + 5, 1.1, 1.1, M.PAINT, { kind: 5 }, -0.1);
    for (const dy of [-6, 6]) { ellipse(g, c[0], c[1] + dy, 4.8, 2.7, M.SOLID, {}, 0, INK); ellipse(g, c[0], c[1] + dy, 4, 2, M.PAINT, { kind: 5 }, 0.1); }
  }
}
function drawProp(g, prop) {
  if (!prop) return;
  const box = (x, y, w, h, kind, bias = 0) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) g.put(x + i, y + j, M.PAINT, 0.55 + bias - j * 0.03, { kind }); };
  if (prop === 'mat') box(4, GROUND - 1, 72, 3, 7, 0.1);
  if (prop === 'bench') { box(24, 57, 34, 3, 6, 0.2); box(26, 60, 3, GROUND - 60, 6, -0.1); box(53, 60, 3, GROUND - 60, 6, -0.1); }
  if (prop === 'benchL') { box(2, 57, 22, 3, 6, 0.2); box(4, 60, 3, GROUND - 60, 6, -0.1); box(19, 60, 3, GROUND - 60, 6, -0.1); }
  if (prop === 'table') { box(50, 51, 28, 3, 6, 0.2); box(53, 54, 3, GROUND - 54, 6, -0.1); box(73, 54, 3, GROUND - 54, 6, -0.1); }
}
function render(g, S) {
  g.clear();
  // gölge
  for (let x = -12; x <= 12; x++) g.put(S.hip[0] + x, GROUND + 1, M.SOLID, 0.5, null, '#cbbfe0');
  drawProp(g, S.prop);
  const farDb = S.db && S.db.endsWith('@f');
  drawArm(g, S.sh, S.eF, S.hF, true);
  if (farDb) drawDumbbell(g, S);
  drawLeg(g, S.hip, S.kF, S.fF, S.toeF, true);
  drawTorso(g, S);
  drawHead(g, S.head, S.hd, S.expr);
  drawLeg(g, S.hip, S.kN, S.fN, S.toeN, false);
  drawArm(g, S.sh, S.eN, S.hN, false);
  if (!farDb) drawDumbbell(g, S);
  return shade(g, PAT, { fluffAmount: 0.03 });
}

/* ---------- hareketler ---------- */
const STAND = { hip: [38, 46.5], torso: 3, head: -3, hn: [41.5, 58], hf: [36.5, 58], fn: [41.5, GROUND], ff: [36, GROUND], eN: 1, eF: 1, kN: -1, kF: -1 };
const onHips = { hn: ['h', 3.2, -1.5], hf: ['h', 1, -1.5], eN: 1, eF: 1 };
const K = (frames) => ({ frames });   // [süre(sn), poz] listesi: her poza geçiş süresi

export const ANIMS = {
  goblet: K([
    [0.6, { ...STAND, torso: 5, hn: ['c', 6.5, 4], hf: ['c', 5.5, 5], db: 'vert@n' }],
    [1.3, { ...STAND, hip: [31, 57.5], torso: 31, head: -22, hn: ['c', 6.5, 4], hf: ['c', 5.5, 5], db: 'vert@n' }],
    [0.4, 'hold'],
    [1.0, 0],
  ]),
  squat: K([
    [0.5, { ...STAND }],
    [1.2, { ...STAND, hip: [31, 57.5], torso: 30, head: -22, hn: ['c', 13, 1], hf: ['c', 12, 2] }],
    [0.3, 'hold'],
    [1.0, 0],
  ]),
  rdl: K([
    [0.5, { ...STAND, hn: [42, 57.5], hf: [41, 57.5], db: 'end@n' }],
    [1.4, { ...STAND, hip: [32.5, 48.5], torso: 72, head: 12, hn: [49.5, 63], hf: [48.5, 63], db: 'end@n' }],
    [0.3, 'hold'],
    [1.1, 0],
  ]),
  mentese: K([
    [0.4, { ...STAND, ...onHips }],
    [1.1, { ...STAND, ...onHips, hip: [33, 48], torso: 58, head: 10 }],
    [0.3, 'hold'],
    [0.9, 0],
  ]),
  row: K([
    [0.5, { hip: [33, 50.5], torso: 83, head: 18, hn: [50, 64], hf: [51, 57.2], eN: 1, eF: 1, fn: [26, GROUND], kN: -1, kneeF: [44, 56.5], ff: [32, 56.5], toeF: 180, db: 'end@n', prop: 'bench' }],
    [0.9, { hip: [33, 50.5], torso: 83, head: 18, hn: [42, 53], hf: [51, 57.2], eN: 1, eF: 1, fn: [26, GROUND], kN: -1, kneeF: [44, 56.5], ff: [32, 56.5], toeF: 180, db: 'end@n', prop: 'bench', expr: 'strain' }],
    [0.4, 'hold'],
    [1.0, 0],
  ]),
  egimlisinav: K([
    [0.5, { hip: [30.5, 51.4], torso: 38.5, head: -5, hn: [56, 50.5], hf: [55, 50.5], eN: 1, eF: 1, fn: [15, GROUND], ff: [14, GROUND], toeN: -55, toeF: -55, prop: 'table' }],
    [1.2, { hip: [36.2, 57.8], torso: 58, head: -8, hn: [56, 50.5], hf: [55, 50.5], eN: 1, eF: 1, fn: [15, GROUND], ff: [14, GROUND], toeN: -55, toeF: -55, prop: 'table' }],
    [0.3, 'hold'],
    [1.0, 0],
  ]),
  dizsinav: K([
    [0.5, { hip: [31, 61], torso: 62, head: -6, hn: [52.5, GROUND], hf: [51.5, GROUND], eN: 1, eF: 1, kneeN: [23, 69.5], fn: [13, 62], kneeF: [22, 69.5], ff: [12, 62], toeN: 200, toeF: 200 }],
    [1.2, { hip: [35, 66], torso: 78, head: -4, hn: [52.5, GROUND], hf: [51.5, GROUND], eN: 1, eF: 1, kneeN: [23, 69.5], fn: [13, 62], kneeF: [22, 69.5], ff: [12, 62], toeN: 200, toeF: 200 }],
    [0.3, 'hold'],
    [1.0, 0],
  ]),
  kopru: K([
    [0.6, { hip: [36, 66], torso: -86, headDir: -90, hn: [29, 69.5], hf: [27, 69.5], eN: -1, eF: -1, fn: [50, GROUND], ff: [48, GROUND], db: 'end@hip', prop: 'mat' }],
    [1.1, { hip: [37, 56], torso: -117, headDir: -90, hn: [29, 69.5], hf: [27, 69.5], eN: -1, eF: -1, fn: [50, GROUND], ff: [48, GROUND], db: 'end@hip', prop: 'mat', expr: 'strain' }],
    [1.0, 'hold'],
    [1.0, 0],
  ]),
  tekkopru: K([
    [0.6, { hip: [36, 66], torso: -86, headDir: -90, hn: [29, 69.5], hf: [27, 69.5], eN: -1, eF: -1, fn: [58, 58], ff: [48, GROUND], prop: 'mat' }],
    [1.1, { hip: [37, 56], torso: -117, headDir: -90, hn: [29, 69.5], hf: [27, 69.5], eN: -1, eF: -1, fn: [60, 47], ff: [48, GROUND], prop: 'mat', expr: 'strain' }],
    [1.0, 'hold'],
    [1.0, 0],
  ]),
  deadbug: K([
    [0.6, { hip: [42, 66.5], torso: -90, headDir: -90, hn: [26, 48], hf: [24, 48], eN: 1, eF: 1, kneeN: [42, 54], fn: [55, 54], kneeF: [41, 54], ff: [54, 54], prop: 'mat' }],
    [1.1, { hip: [42, 66.5], torso: -90, headDir: -90, hn: [8, 62], hf: [24, 48], eN: 1, eF: 1, kneeN: [42, 54], fn: [55, 54], ff: [66, 62], kF: 1, prop: 'mat' }],
    [0.4, 'hold'],
    [1.0, 0],
    [1.1, { hip: [42, 66.5], torso: -90, headDir: -90, hn: [26, 48], hf: [8, 62], eN: 1, eF: 1, fn: [66, 62], kN: 1, kneeF: [41, 54], ff: [54, 54], prop: 'mat' }],
    [0.4, 'hold'],
    [1.0, 0],
  ]),
  lunge: K([
    [0.5, { ...STAND, ...onHips }],
    [1.2, { ...STAND, ...onHips, hip: [37, 57.5], torso: 6, ff: [44, GROUND], kF: -1, fn: [17, GROUND], kneeN: [27, 68.5], toeN: -30 }],
    [0.3, 'hold'],
    [1.0, 0],
  ]),
  press: K([
    [0.5, { ...STAND, hn: ['c', 3.5, -1], hf: ['h', 1, -1.5], eN: 1, db: 'end@n' }],
    [1.0, { ...STAND, hn: ['c', 1, -18.8], hf: ['h', 1, -1.5], eN: 1, db: 'end@n' }],
    [0.4, 'hold'],
    [1.0, 0],
  ]),
  sumo: K([
    [0.5, { ...STAND, hn: [43.5, 56], hf: [42.5, 56], fn: [44, GROUND], ff: [33, GROUND], db: 'hang@n' }],
    [1.3, { ...STAND, hip: [33, 57], torso: 36, head: -22, hn: [45.5, 62.5], hf: [44.5, 62.5], fn: [44, GROUND], ff: [33, GROUND], db: 'hang@n' }],
    [0.3, 'hold'],
    [1.1, 0],
  ]),
  splitrow: K([
    [0.5, { hip: [34, 51], torso: 55, head: 20, hn: [48, 64.5], hf: [45, 58.5], eN: 1, eF: 1, fn: [47, GROUND], ff: [24, GROUND], kN: -1, kF: -1, db: 'end@n' }],
    [0.9, { hip: [34, 51], torso: 55, head: 20, hn: [40, 55], hf: [45, 58.5], eN: 1, eF: 1, fn: [47, GROUND], ff: [24, GROUND], kN: -1, kF: -1, db: 'end@n', expr: 'strain' }],
    [0.4, 'hold'],
    [1.0, 0],
  ]),
  floorpress: K([
    [0.6, { hip: [44, 66.5], torso: -90, headDir: -90, hn: [24, 60], hf: [19, 69.5], eN: -1, eF: -1, kneeN: [51, 57.5], fn: [57, GROUND], kneeF: [50, 57.5], ff: [56, GROUND], db: 'end@n', prop: 'mat' }],
    [1.0, { hip: [44, 66.5], torso: -90, headDir: -90, hn: [27.5, 48], hf: [19, 69.5], eN: -1, eF: -1, kneeN: [51, 57.5], fn: [57, GROUND], kneeF: [50, 57.5], ff: [56, GROUND], db: 'end@n', prop: 'mat' }],
    [0.4, 'hold'],
    [1.1, 0],
  ]),
  birddog: K([
    [0.6, { hip: [30, 55], torso: 90, headDir: 72, hn: [48, GROUND], hf: [46, GROUND], eN: 1, eF: 1, kneeN: [31, 69.5], fn: [19, GROUND], kneeF: [30, 69.5], ff: [18, GROUND], toeN: 180, toeF: 180, prop: 'mat' }],
    [1.1, { hip: [30, 55], torso: 90, headDir: 76, hn: [67, 52], hf: [46, GROUND], eN: 1, eF: 1, kneeN: [31, 69.5], fn: [19, GROUND], ff: [6, 54], kF: 1, toeN: 180, toeF: 180, prop: 'mat' }],
    [0.8, 'hold'],
    [1.0, 0],
    [1.1, { hip: [30, 55], torso: 90, headDir: 76, hn: [48, GROUND], hf: [67, 52], eN: 1, eF: 1, fn: [6, 54], kN: 1, kneeF: [30, 69.5], ff: [18, GROUND], toeN: 180, toeF: 180, prop: 'mat' }],
    [0.8, 'hold'],
    [1.0, 0],
  ]),
  bulgar: K([
    [0.5, { ...STAND, ...onHips, hip: [37, 46.5], fn: [47, GROUND], ff: [13, 55.5], kF: 1, toeF: 180, prop: 'benchL' }],
    [1.2, { ...STAND, ...onHips, hip: [34, 58], torso: 14, fn: [47, GROUND], ff: [13, 55.5], kF: 1, toeF: 180, prop: 'benchL' }],
    [0.3, 'hold'],
    [1.0, 0],
  ]),
  kedideve: K([
    [0.6, { hip: [30, 55], torso: 90, headDir: 90, hn: [48, GROUND], hf: [46, GROUND], eN: 1, eF: 1, kneeN: [31, 69.5], fn: [19, GROUND], kneeF: [30, 69.5], ff: [18, GROUND], toeN: 180, toeF: 180, prop: 'mat' }],
    [1.3, { hip: [30, 55], torso: 90, headDir: 125, arch: 1, hn: [48, GROUND], hf: [46, GROUND], eN: 1, eF: 1, kneeN: [31, 69.5], fn: [19, GROUND], kneeF: [30, 69.5], ff: [18, GROUND], toeN: 180, toeF: 180, prop: 'mat' }],
    [0.3, 'hold'],
    [1.3, { hip: [30, 55], torso: 90, headDir: 55, arch: -0.8, hn: [48, GROUND], hf: [46, GROUND], eN: 1, eF: 1, kneeN: [31, 69.5], fn: [19, GROUND], kneeF: [30, 69.5], ff: [18, GROUND], toeN: 180, toeF: 180, prop: 'mat' }],
    [0.3, 'hold'],
  ]),
  // yürüyüş türleri: yordamsal
  mars: { proc: (t) => { const f = t * 3.2, a = Math.max(0, Math.sin(f)), b = Math.max(0, -Math.sin(f));
    return { ...STAND, fn: [41.5 + a * 4, GROUND - a * 11], ff: [36 - b * 1 + b * 4, GROUND - b * 11], hn: ['c', Math.sin(f + Math.PI) * 6, 16], hf: ['c', Math.sin(f) * 6, 16] }; } },
  yuru: { proc: (t) => { const f = t * 4.2, s = Math.sin(f), c = Math.cos(f);
    return { ...STAND, torso: 5, hip: [38, 46.5 - Math.abs(c) * 0.8], fn: [38 + s * 7, GROUND - Math.max(0, c) * 3.5], ff: [38 - s * 7, GROUND - Math.max(0, -c) * 3.5], hn: ['c', -s * 6, 16], hf: ['c', s * 6, 16] }; } },
  yuksekdiz: { proc: (t) => { const f = t * 6.5, a = Math.max(0, Math.sin(f)), b = Math.max(0, -Math.sin(f));
    return { ...STAND, torso: 6, hip: [38, 46 - (a + b) * 1.2], fn: [41 + a * 6, GROUND - a * 15], ff: [36 + b * 6, GROUND - b * 15], hn: ['c', 3 + Math.sin(f + Math.PI) * 7, 11], hf: ['c', 3 + Math.sin(f) * 7, 11], eN: 1, eF: 1 }; } },
  kolcevir: { proc: (t) => { const f = t * 3; return { ...STAND, hn: ['c', Math.cos(f) * 17, Math.sin(f) * 17], hf: ['c', Math.cos(f + 0.3) * 16, Math.sin(f + 0.3) * 16] }; } },
};

// animasyonun t anındaki iskeleti
const cache = new Map();
function frames(key) {
  if (cache.has(key)) return cache.get(key);
  const a = ANIMS[key]; if (!a || !a.frames) return null;
  const out = []; let prev = null, t = 0;
  for (const [dur, p] of a.frames) {
    const sk = p === 'hold' ? prev : (p === 0 ? out[0].sk : skeleton(p));
    t += dur; out.push({ t, sk }); prev = sk;
  }
  cache.set(key, out); return out;
}
export function poseAt(key, t) {
  const a = ANIMS[key]; if (!a) return skeleton(STAND);
  if (a.proc) return skeleton(a.proc(t));
  const fr = frames(key), total = fr[fr.length - 1].t, tt = t % total;
  let i = fr.findIndex(f => f.t >= tt); if (i < 0) i = fr.length - 1;
  const b = fr[i], A = i === 0 ? fr[fr.length - 1] : fr[i - 1];
  const start = i === 0 ? 0 : A.t, k = ease(Math.min(1, (tt - start) / Math.max(0.001, b.t - start)));
  return mix(A.sk, b.sk, k);
}
export function drawTarcin(g, key, t) { return render(g, poseAt(key, t)); }

/* ---------- oynatıcı ---------- */
const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
export function mountAnim(canvas, key) {
  if (!ANIMS[key]) return;
  const g = new Grid(TW, TH);
  const t0 = performance.now() - Math.random() * 400;
  const draw = (t) => { drawTarcin(g, key, t); paint(canvas, g); };
  draw(reduce ? 1.2 : 0);
  if (reduce) return;
  let visible = false, raf = 0, last = 0;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(tick); });
  io.observe(canvas);
  function tick(now) {
    raf = 0;
    if (!canvas.isConnected) { io.disconnect(); return; }
    if (!visible) return;
    if (now - last > 83) { last = now; draw((now - t0) / 1000); }
    raf = requestAnimationFrame(tick);
  }
}
