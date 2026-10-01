// "Ay nasıl geçti?" hikâyesi: Wrapped tarzı, dokundukça ilerleyen sahneler.
// Bütün sahneler tek bir 9:16 tuvale çizilir; böylece aynı sahneler video olarak da kaydedilebilir.
import { Grid, paint, hash } from './pixel.js';
import * as Y from './yumak-art.js';
import { drawTarcin, TW, TH } from './tarcin.js';
import { icon, drawMoon } from './fx.js';

const LW = 360, LH = 640;           // mantıksal boyut (her şey buna göre çizilir)
const INK = '#3d2a3f', PAPER = '#fffaf3', PINK = '#ff6f98', GREEN = '#1f8a52';
const AY = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const PIX = '"Pixelify Sans", ui-monospace, monospace', BODY = '"Nunito", system-ui, sans-serif';

const kis = (v) => Math.max(0, Math.min(1, v));
const ara = (t, a, b) => kis((t - a) / (b - a));
const eOut = (v) => 1 - Math.pow(1 - kis(v), 3);
const eBack = (v) => { v = kis(v); const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(v - 1, 3) + c1 * Math.pow(v - 1, 2); };
const sayi = (n) => Number(n).toLocaleString('tr-TR', { maximumFractionDigits: 1 });
const tarihOku = (s) => { const [y, m, g] = String(s).split('-').map(Number); return new Date(y, m - 1, g); };
const tarihYaz = (s) => { const d = tarihOku(s); return `${d.getDate()} ${AY[d.getMonth()]}`; };

/* ---------- veri: özetten hikâyeye ---------- */
// o: ozetHesapla çıktısı. ara: tur bitmeden "şimdiye kadar" hikâyesi.
export function hikayeVerisi(o, { tur = 1, ara: araMi = false } = {}) {
  const haftalar = o.haftalar || [];
  let enIyi = null;
  haftalar.forEach((k, i) => { if (!enIyi || k > enIyi.oran) enIyi = { hafta: i + 1, oran: k }; });
  const toplam = araMi && o.gecen != null ? o.gecen : o.toplam;
  return {
    ...o, tur, ara: araMi, haftalar, enIyi, toplamGoster: toplam,
    yuzde: toplam ? Math.round(o.tamam / toplam * 100) : 0,
    dolunay: haftalar.filter((k) => k >= 0.999).length,
    km: Math.round((o.yuruDk || 0) / 60 * 4.5),
    agirlik: (o.agirlik || []).slice(0, 4),
    mutfak: o.mutfak || { kayitliGun: 0, favori: {} },
    tarihler: `${tarihYaz(o.start)} – ${tarihYaz(o.bitis)}`,
  };
}

function mektup(V) {
  const y = V.yuzde, s = [];
  s.push(V.ara ? (y >= 70 ? 'Şimdiye kadar harika gidiyorsun. Takvim pati iziyle doluyor!' : 'Yolun bir kısmını yürüdük bile. Her gün biraz daha güçleniyoruz.')
    : y >= 90 ? 'Bu tur efsaneydi. Takvime baktım, neredeyse her gün pati izi var!'
    : y >= 70 ? 'Bu tur çok güzel geçti. Günlerin çoğunu tamamladın, gururdan tüylerim kabardı.'
    : y >= 40 ? 'Bu turda inişler çıkışlar oldu ama hep geri geldin. Asıl güç bu.'
    : y > 0 ? 'Bu tur biraz uykulu geçti, olsun. Ben de çok uyurum, sonra kalkarım.'
    : 'Bu tur pek işaretleme yapmadık. Yeni tur bizim turumuz olacak!');
  const a = V.agirlik[0];
  if (a && a.fark > 0) s.push(`${a.ad} hareketinde ${sayi(a.fark)} kg artırdın. Tarçın bile şaşırdı.`);
  if (V.rekor >= 5) s.push(`${V.rekor} gün üst üste hiç bırakmadın. Zincirin benim kuyruğumdan uzun.`);
  if (V.yuruDk >= 60) s.push(`${sayi(V.yuruDk)} dakika yürüdün. Ben o sürede en fazla mama kabına kadar yürürüm.`);
  s.push(V.ara ? 'Devam edelim, ben hep buradayım.' : 'Yeni turda da yanındayım. Mrrr.');
  return s.join(' ');
}

/* ---------- çizim yardımcıları ---------- */
const yGrid = new Grid(Y.W, Y.H), tGrid = new Grid(TW, TH);
let yTuval = null, tTuval = null;
function yumak(c, poz, st, x, y, s) { // x: orta, y: alt kenar
  yTuval ||= document.createElement('canvas');
  Y[poz](yGrid, { t: 0, look: { x: 0, y: 0 }, ...st }); paint(yTuval, yGrid);
  c.drawImage(yTuval, Math.round(x - Y.W * s / 2), Math.round(y - Y.H * s), Y.W * s, Y.H * s);
}
function tarcin(c, anim, t, x, y, s) {
  tTuval ||= document.createElement('canvas');
  drawTarcin(tGrid, anim, t); paint(tTuval, tGrid);
  c.drawImage(tTuval, Math.round(x - TW * s / 2), Math.round(y - TH * s), TW * s, TH * s);
}
const ayOnbellek = new Map();
function ay(c, k, x, y, d, waxing = true) { // x,y: merkez, d: çap
  const kk = Math.round(kis(k) * 20) / 20, key = `${kk}:${waxing}`;
  let m = ayOnbellek.get(key);
  if (!m) { m = document.createElement('canvas'); drawMoon(m, kk, 32, waxing); ayOnbellek.set(key, m); }
  c.drawImage(m, Math.round(x - d / 2), Math.round(y - d / 2), d, d);
}
const ikonlar = new Map();
function ikon(c, ad, x, y, s) { // x,y: merkez
  let i = ikonlar.get(ad); if (!i) { i = icon(ad, 1); ikonlar.set(ad, i); }
  c.drawImage(i, Math.round(x - i.width * s / 2), Math.round(y - i.height * s / 2), i.width * s, i.height * s);
}
// yazı: o.px boyut, o.pix piksel font, o.renk, o.hiza, o.max satır genişliği, o.satir satır yüksekliği, o.golge
function yazi(c, s, x, y, o = {}) {
  const px = o.px || 18;
  c.font = `${o.w || (o.pix ? 700 : 700)} ${px}px ${o.pix ? PIX : BODY}`;
  c.textAlign = o.hiza || 'center'; c.textBaseline = 'alphabetic';
  const satirlar = o.max ? sar(c, s, o.max) : [String(s)], lh = o.satir || px * 1.25;
  satirlar.forEach((l, i) => {
    if (o.golge) { c.fillStyle = o.golge === true ? INK : o.golge; c.fillText(l, x + Math.max(2, px / 16), y + i * lh + Math.max(2, px / 16)); }
    c.fillStyle = o.renk || INK; c.fillText(l, x, y + i * lh);
  });
  return satirlar.length * lh;
}
function sar(c, s, max) {
  const out = []; let line = '';
  for (const w of String(s).split(' ')) { const d = line ? `${line} ${w}` : w; if (c.measureText(d).width > max && line) { out.push(line); line = w; } else line = d; }
  if (line) out.push(line);
  return out;
}
function pop(c, x, y, k, fn) { // ortadan büyüyerek gelsin
  if (k <= 0) return; c.save(); c.translate(x, y); c.scale(k, k); fn(); c.restore();
}
function kutu(c, x, y, w, h, renk = PAPER) {
  c.fillStyle = INK; c.fillRect(x + 5, y + 5, w, h);
  c.fillRect(x - 3, y - 3, w + 6, h + 6);
  c.fillStyle = renk; c.fillRect(x, y, w, h);
}
function gok(c, t, [ust, alt], yildiz) {
  const g = c.createLinearGradient(0, 0, 0, LH); g.addColorStop(0, ust); g.addColorStop(1, alt);
  c.fillStyle = g; c.fillRect(0, 0, LW, LH);
  if (!yildiz) return;
  for (let i = 0; i < 46; i++) {
    const x = Math.floor(hash(i, 3, 9) * LW), y = Math.floor(hash(i, 7, 9) * LH * 0.8);
    const on = Math.sin(t * 2 + i * 1.7) > -0.2, b = hash(i, 5, 2) > 0.8 ? 3 : 2;
    c.fillStyle = on ? 'rgba(255,248,214,.95)' : 'rgba(255,248,214,.35)'; c.fillRect(x, y, b, b);
  }
}
function konfeti(c, t, n = 60) {
  const R = ['#ff6f98', '#ffd84d', '#7c6cff', '#5cc8a8', '#ff9f5a', '#8fd3ff'];
  for (let i = 0; i < n; i++) {
    const x = hash(i, 1, 4) * LW + Math.sin(t * 1.5 + i) * 10, h = 40 + hash(i, 2, 4) * 60;
    const y = ((hash(i, 3, 4) * (LH + 40)) + t * h) % (LH + 40) - 20;
    const w = Math.abs(Math.cos(t * 3 + i)) * 6 + 2;
    c.fillStyle = R[i % R.length]; c.fillRect(Math.round(x), Math.round(y), Math.round(w), 6);
  }
}
const ALEV = [['....r....', '...rr....', '...rrr...', '..rrorr..', '..roorr..', '.rrooorr.', '.rooyoor.', 'rrooyyorr', 'roooyyoor', 'rooyyyoor', '.rooyyor.', '..rrrrr..'],
  ['....r....', '....rr...', '...rrr...', '..rroor..', '..rroor..', '.rrooorr.', '.rooyoor.', 'rrooyyorr', 'rooyyooor', 'rooyyyoor', '.rooyyor.', '..rrrrr..']];
function alev(c, t, x, y, s) { // x: orta, y: alt
  const f = ALEV[Math.floor(t * 6) % 2], R = { r: '#ff5f3d', o: '#ff9f2e', y: '#ffe066' };
  const w = f[0].length, h = f.length;
  f.forEach((row, j) => [...row].forEach((ch, i) => { if (R[ch]) { c.fillStyle = R[ch]; c.fillRect(Math.round(x - w * s / 2 + i * s), Math.round(y - h * s + j * s), s, s); } }));
}
function bardak(c, x, y, dolu) { // x,y: sol üst; 22x30
  c.fillStyle = INK; c.fillRect(x, y, 3, 30); c.fillRect(x + 19, y, 3, 30); c.fillRect(x, y + 27, 22, 3);
  c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(x + 3, y, 16, 27);
  const h = Math.round(25 * kis(dolu));
  c.fillStyle = '#6fc3ff'; c.fillRect(x + 3, y + 27 - h, 16, h);
  if (h > 4) { c.fillStyle = '#dff3ff'; c.fillRect(x + 5, y + 27 - h + 2, 3, Math.max(2, h - 6)); }
}

/* ---------- sahneler ---------- */
// her sahne: sure (sn, ilerleme çubuğu ve video için), ciz(c, t, V)
const KAPAK = { sure: 3.6, ciz(c, t, V) {
  gok(c, t, ['#241a3d', '#6b4fa3'], true);
  const r = eOut(ara(t, 0, 1.6)), ayY = 580 - r * 110;
  const g = c.createRadialGradient(180, ayY, 40, 180, ayY, 210); g.addColorStop(0, 'rgba(255,240,180,.45)'); g.addColorStop(1, 'rgba(255,240,180,0)');
  c.fillStyle = g; c.fillRect(0, 0, LW, LH);
  ay(c, 1, 180, ayY, 230);
  yumak(c, 'sit', { t, eyes: t > 1.2 ? 'happy' : undefined, paws: t > 1.6 && Math.sin(t * 4) > -0.6 ? 'wave' : 'down' }, 180, ayY - 100, 1.4);
  const k = eBack(ara(t, 0.25, 0.85));
  yazi(c, `${V.tur}. TUR · ${V.tarihler.toLocaleUpperCase('tr-TR')}`, 180, 82, { px: 13, pix: true, renk: '#e4d8ff' });
  pop(c, 180, 134, k, () => { yazi(c, V.ara ? 'Şimdiye kadar' : 'Ay nasıl', 0, 0, { px: 46, pix: true, renk: PAPER, golge: PINK }); yazi(c, V.ara ? 'nasıl gidiyor?' : 'geçti?', 0, 52, { px: 46, pix: true, renk: PAPER, golge: PINK }); });
  if (t > 1.8) { c.globalAlpha = 0.55 + Math.sin(t * 4) * 0.35; yazi(c, 'dokun, başlayalım ›', 180, 618, { px: 14, pix: true, renk: '#ffe3cb' }); c.globalAlpha = 1; }
} };

const AYLAR = { sure: 4.6, ciz(c, t, V) {
  gok(c, t, ['#c9b8ff', '#f7c6e0']);
  yazi(c, '8 hafta, 8 ay', 180, 112, { px: 36, pix: true, renk: INK, golge: PAPER });
  yazi(c, 'Her hafta bir ayı doldurdun.', 180, 146, { px: 17 });
  V.haftalar.forEach((k, i) => {
    const x = 60 + (i % 4) * 80, y = 250 + Math.floor(i / 4) * 116, a = 0.5 + i * 0.28;
    const dol = k * eOut(ara(t, a, a + 0.7)), s = dol >= 0.999 && k >= 0.999 ? 1 + Math.max(0, Math.sin(ara(t, a + 0.7, a + 1.1) * Math.PI)) * 0.18 : 1;
    if (t < a) c.globalAlpha = 0.45;
    ay(c, dol, x, y, 64 * s); c.globalAlpha = 1;
    yazi(c, `H${i + 1}`, x, y + 52, { px: 14, w: 800 });
  });
  const k = eBack(ara(t, 3.0, 3.5));
  pop(c, 180, 506, k, () => yazi(c, V.dolunay ? `${V.dolunay} dolunay!` : `En dolgun ay: ${V.enIyi?.hafta || 1}. hafta`, 0, 0, { px: 34, w: 800, renk: PINK, golge: INK }));
  yumak(c, 'sit', { t, eyes: 'happy', look: { x: -1, y: -1 } }, 300, 640, 1.1);
} };

const GUNLER = { sure: 4.8, ciz(c, t, V) {
  gok(c, t, ['#ffe3cb', '#ffb3c9']);
  const n = Math.round(V.tamam * eOut(ara(t, 0.3, 2.0)));
  yazi(c, V.ara ? 'Şimdiye kadar' : '8 haftada', 180, 92, { px: 18, pix: true });
  pop(c, 180, 200, eBack(ara(t, 0.1, 0.5)), () => yazi(c, String(n), 0, 0, { px: 108, w: 800, renk: PAPER, golge: INK }));
  yazi(c, `/ ${V.toplamGoster} gün tamamladın`, 180, 240, { px: 19 });
  pop(c, 290, 132, eBack(ara(t, 2.1, 2.5)), () => { c.rotate(0.12); kutu(c, -34, -20, 68, 34, '#fff0a6'); yazi(c, `%${V.yuzde}`, 0, 8, { px: 21, w: 800 }); });
  const g = V.gunler || '', cell = 26, gap = 5, x0 = (LW - (7 * cell + 6 * gap)) / 2, y0 = 290;
  for (let i = 0; i < 56; i++) {
    const x = x0 + (i % 7) * (cell + gap), y = y0 + Math.floor(i / 7) * (cell + gap), ch = g[i];
    const gor = ara(t, 0.3 + i * 0.03, 0.45 + i * 0.03);
    if (gor <= 0) continue;
    c.globalAlpha = gor;
    if (ch === 'd') ay(c, 0.35, x + cell / 2, y + cell / 2, 16);
    else if (ch === 'x') { c.fillStyle = INK; c.fillRect(x - 2, y - 2, cell + 4, cell + 4); c.fillRect(x + 2, y + 2, cell + 2, cell + 2); c.fillStyle = '#fff0a6'; c.fillRect(x, y, cell, cell); ikon(c, 'paw', x + cell / 2, y + cell / 2, 2); }
    else { c.fillStyle = 'rgba(61,42,63,.5)'; c.fillRect(x, y, cell, cell); c.fillStyle = 'rgba(255,250,243,.85)'; c.fillRect(x + 2, y + 2, cell - 4, cell - 4); }
    c.globalAlpha = 1;
  }
  yazi(c, '🐾 = tamamlanan gün   ☾ = dinlenme', 180, 560, { px: 13, renk: '#6f5a73' });
} };

const ZINCIR = { sure: 4.2, ciz(c, t, V) {
  gok(c, t, ['#3b1f3f', '#c2335f'], true);
  yazi(c, 'En uzun zincirin', 180, 104, { px: 30, pix: true, renk: PAPER, golge: INK });
  const k = eOut(ara(t, 0.2, 1.4));
  alev(c, t, 180, 330, Math.round(9 + k * 7));
  const n = Math.round(V.rekor * eOut(ara(t, 0.5, 1.8)));
  pop(c, 180, 430, eBack(ara(t, 0.4, 0.8)), () => yazi(c, `${n} gün`, 0, 0, { px: 66, w: 800, renk: '#ffe066', golge: INK }));
  yazi(c, 'üst üste hiç bırakmadın!', 180, 468, { px: 19, renk: PAPER });
  const s = V.rekor >= 14 ? 'İki haftayı aşan bir seri. Ateş gibisin!' : V.rekor >= 7 ? 'Bir haftayı aşkın kesintisiz. Alev alev!' : 'Her uzun zincir bir halkayla başlar.';
  if (t > 1.8) yazi(c, s, 180, 506, { px: 16, renk: '#ffd2ad', max: 300 });
  yumak(c, 'sit', { t, shades: true, eyes: 'happy' }, 290, 640, 1.2);
} };

const KUVVET = { sure: 4.8, ciz(c, t, V) {
  gok(c, t, ['#c4f1df', '#8fd3ff']);
  yazi(c, 'Kuvvet zamanı', 180, 100, { px: 34, pix: true, renk: INK, golge: PAPER });
  const n = Math.round(V.kuvvet * eOut(ara(t, 0.3, 1.6)));
  yazi(c, `${n} / ${V.kuvvetTop} kuvvet günü`, 180, 136, { px: 19 });
  c.fillStyle = 'rgba(61,42,63,.18)'; c.fillRect(70, 452, 220, 8);
  tarcin(c, 'goblet', t, 180, 460, 3.2);
  const s = Math.round(V.setSay * eOut(ara(t, 0.8, 2.4)));
  pop(c, 180, 536, eBack(ara(t, 0.8, 1.2)), () => yazi(c, `${s} set`, 0, 0, { px: 54, w: 800, renk: PINK, golge: INK }));
  if (t > 2.2) yazi(c, 'Her sete bir pati alkışı!', 180, 574, { px: 17 });
} };

const AGIRLIK = { sure: 4.8, ciz(c, t, V) {
  gok(c, t, ['#fff0a6', '#ffc4d8']);
  yazi(c, 'Güçlendin!', 180, 100, { px: 40, pix: true, renk: INK, golge: PAPER });
  yazi(c, 'İlk ve son ağırlıkların', 180, 132, { px: 17 });
  const enCok = Math.max(...V.agirlik.map((a) => a.max || a.son), 1);
  V.agirlik.forEach((a, i) => {
    const y = 176 + i * 74, bas = 0.4 + i * 0.35, k = eOut(ara(t, bas, bas + 1.1)), simdi = a.ilk + (a.son - a.ilk) * k;
    yazi(c, a.ad, 32, y, { px: 16, hiza: 'left', max: 230 });
    if (a.fark > 0) pop(c, 300, y - 6, eBack(ara(t, bas + 1.1, bas + 1.4)), () => { kutu(c, -28, -14, 56, 24, '#c4f1df'); yazi(c, `+${sayi(a.fark)} kg`, 0, 5, { px: 15, w: 800, renk: GREEN }); });
    c.fillStyle = INK; c.fillRect(29, y + 11, 302, 28);
    c.fillStyle = PAPER; c.fillRect(32, y + 14, 296, 22);
    const w0 = 296 * (a.ilk / enCok), w1 = 296 * simdi / enCok;
    c.fillStyle = '#ffc4d8'; c.fillRect(32, y + 14, w1, 22);
    c.fillStyle = PINK; c.fillRect(32, y + 14, Math.min(w0, w1), 22);
    yazi(c, `${sayi(a.ilk)} → ${sayi(Math.round(simdi * 2) / 2)} kg`, 40, y + 31, { px: 14, hiza: 'left', w: 800 });
  });
  const u = t % 3.2, up = u < 0.9 ? eOut(u / 0.9) : u < 2.3 ? 1 : 1 - eOut((u - 2.3) / 0.9), py = 62 - 49 * up;
  yumak(c, 'stand', { t, prop: 'barbell', pawL: [28, py], pawR: [60, py], squat: 0.45 * (1 - up), eyes: up > 0.95 ? 'happy' : 'squint', mouth: 'open' }, 180, 640, 1.6);
} };

const YURUYUS = { sure: 4.8, ciz(c, t, V) {
  gok(c, t, ['#cfe2ff', '#c4f1df']);
  yazi(c, 'Yürüdükçe yürüdün', 180, 100, { px: 30, pix: true, renk: INK, golge: PAPER });
  const n = Math.round(V.yuruDk * eOut(ara(t, 0.3, 2.0)));
  pop(c, 180, 220, eBack(ara(t, 0.2, 0.6)), () => yazi(c, sayi(n), 0, 0, { px: 92, w: 800, renk: PAPER, golge: INK }));
  yazi(c, 'dakika yürüyüş', 180, 256, { px: 19 });
  if (t > 1.6) yazi(c, `≈ ${sayi(V.km)} km yol`, 180, 304, { px: 26, w: 800, renk: PINK });
  if (t > 2.2 && V.yemekYuru) yazi(c, `Yemekten sonra ${V.yemekYuru} kez yürüdün.`, 180, 338, { px: 17 });
  c.fillStyle = '#8fd4bc'; c.fillRect(0, 548, LW, 92); c.fillStyle = '#c4f0dc'; c.fillRect(0, 556, LW, 84);
  for (let i = 0; i < 9; i++) { const x = ((i * 47 - t * 60) % 400 + 400) % 400 - 20; c.fillStyle = '#5cb85c'; c.fillRect(x, 548, 4, -8); c.fillRect(x + 5, 548, 4, -5); }
  yumak(c, 'walk', { t, phase: t * 7, eyes: 'happy' }, 180 + Math.sin(t * 0.8) * 30, 566, 1.5);
} };

const MUTFAK = { sure: 4.8, ciz(c, t, V) {
  const m = V.mutfak;
  gok(c, t, ['#ffd2ad', '#ff9fbf']);
  yazi(c, 'Mutfakta da', 180, 96, { px: 32, pix: true, renk: INK, golge: PAPER });
  yazi(c, 'harikaydın', 180, 134, { px: 32, pix: true, renk: INK, golge: PAPER });
  for (let i = 0; i < 8; i++) bardak(c, 42 + i * 36, 180, kis(m.suOrt - i) * eOut(ara(t, 0.3 + i * 0.18, 0.6 + i * 0.18)));
  yazi(c, `günde ortalama ${sayi(m.suOrt)} bardak su`, 180, 240, { px: 17 });
  const satir = [['Her öğünde protein', m.proteinTam], ['Şekerli içecek yok', m.sekersiz], ['3 porsiyon sebze', m.sebze3], ['8 bardak su', m.su8]]
    .filter(([, n]) => n > 0).slice(0, 3).map(([a, n]) => [a, `${n} gün`]); // sıfırları gösterme
  const ad = { kahvalti: 'kahvaltın', ara: 'ara öğünün', aksam: 'akşam yemeğin' };
  const fav = Object.entries(m.favori || {})[0];
  satir.forEach(([a, b], i) => {
    const k = eOut(ara(t, 1.4 + i * 0.3, 1.8 + i * 0.3)); if (k <= 0) return;
    c.globalAlpha = k; kutu(c, 34, 268 + i * 52, 292, 38); yazi(c, a, 46, 293 + i * 52, { px: 16, hiza: 'left' }); yazi(c, b, 314, 293 + i * 52, { px: 18, w: 800, hiza: 'right', renk: PINK }); c.globalAlpha = 1;
  });
  if (fav && t > 2.6) yazi(c, `Favori ${ad[fav[0]] || 'öğünün'}: ${fav[1].ad}`, 180, 448, { px: 17, max: 300, w: 800 });
  yumak(c, 'sit', { t, chef: true, eyes: 'happy' }, 180, 640, 1.2);
} };

const ENIYI = { sure: 4.2, ciz(c, t, V) {
  gok(c, t, ['#241a3d', '#4b3480'], true);
  yazi(c, 'En parlak haftan', 180, 110, { px: 32, pix: true, renk: PAPER, golge: PINK });
  const k = eOut(ara(t, 0.2, 1.4)), d = 150 + k * 60;
  const g = c.createRadialGradient(180, 300, 30, 180, 300, 200 * k + 40); g.addColorStop(0, 'rgba(255,240,180,.6)'); g.addColorStop(1, 'rgba(255,240,180,0)');
  c.fillStyle = g; c.fillRect(0, 0, LW, LH);
  ay(c, V.enIyi.oran * k, 180, 300, d);
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + t * 0.6, r = 130 + Math.sin(t * 3 + i) * 10; if (k > 0.8) ikon(c, 'sparkle', 180 + Math.cos(a) * r, 300 + Math.sin(a) * r, 3); }
  pop(c, 180, 480, eBack(ara(t, 1.2, 1.6)), () => yazi(c, `${V.enIyi.hafta}. hafta`, 0, 0, { px: 50, w: 900, renk: '#ffe066', golge: INK }));
  if (t > 1.7) yazi(c, `%${Math.round(V.enIyi.oran * 100)} tamamlandı`, 180, 520, { px: 19, renk: PAPER });
  yumak(c, 'sit', { t, look: { x: -1, y: -1 }, eyes: k > 0.9 ? 'happy' : undefined }, 70, 640, 1.0);
} };

const MEKTUP = { sure: 6.5, ciz(c, t, V) {
  gok(c, t, ['#e4d8ff', '#c9b8ff']);
  kutu(c, 28, 70, 304, 400);
  yazi(c, 'Yumak’tan mektup', 180, 108, { px: 22, pix: true, renk: PINK });
  c.fillStyle = '#e8d9ce'; for (let y = 140; y < 450; y += 28) c.fillRect(44, y + 8, 272, 2);
  const metin = mektup(V), n = Math.floor(Math.max(0, t - 0.4) * 45);
  yazi(c, metin.slice(0, n), 46, 146, { px: 16, hiza: 'left', max: 268, satir: 28 });
  if (n >= metin.length) { yazi(c, 'Pati izleriyle, Yumak', 290, 450, { px: 16, pix: true, hiza: 'right' }); ikon(c, 'paw', 308, 444, 2.5); }
  yumak(c, 'sit', { t, prop: 'clipboard', eyes: n >= metin.length ? 'happy' : undefined }, 90, 640, 1.3);
} };

const SON = { sure: 3, son: true, ciz(c, t, V) {
  gok(c, t, ['#ff8fb3', '#ffd2ad']);
  konfeti(c, t);
  pop(c, 180, 104, eBack(ara(t, 0.1, 0.6)), () => yazi(c, V.ara ? 'Devam!' : `${V.tur}. tur tamam!`, 0, 0, { px: 40, pix: true, renk: PAPER, golge: INK }));
  yazi(c, V.ara ? 'Ay dolmaya devam ediyor.' : 'Dolunay gibi parladın.', 180, 140, { px: 18 });
  const hop = Math.abs(Math.sin(t * 4)) * 26;
  yumak(c, 'sit', { t, hat: true, eyes: 'happy', mouth: 'open', paws: Math.sin(t * 2) > 0 ? 'wave' : 'down' }, 180, 380 - hop, 2);
  c.fillStyle = 'rgba(61,42,63,.18)'; c.fillRect(180 - 60 + hop, 384, 120 - hop * 2, 6);
} };

const KAPANIS = { sure: 3.5, ciz(c, t, V) {
  SON.ciz(c, t, V);
  kutu(c, 40, 420, 280, 120);
  yazi(c, `${V.tamam} gün · ${V.rekor} gün zincir`, 180, 462, { px: 19, w: 800 });
  yazi(c, `${sayi(V.yuruDk)} dk yürüyüş · ${V.setSay} set`, 180, 492, { px: 19, w: 800 });
  yazi(c, 'Yumak’la 8 Hafta', 180, 524, { px: 14, renk: '#6f5a73' });
  V.haftalar.forEach((k, i) => ay(c, k, 54 + i * 36, 590, 26));
} };

// paylaşım kartı (tek resim)
const KART = { sure: 1, ciz(c, t, V) {
  gok(c, 3, ['#241a3d', '#6b4fa3'], true);
  yazi(c, `${V.tur}. TUR · ${V.tarihler.toLocaleUpperCase('tr-TR')}`, 180, 58, { px: 13, pix: true, renk: '#e4d8ff' });
  yazi(c, 'Ay nasıl geçti?', 180, 100, { px: 38, pix: true, renk: PAPER, golge: PINK });
  V.haftalar.forEach((k, i) => ay(c, k, 54 + i * 36, 146, 30));
  const st = [[`${V.tamam}/${V.toplamGoster}`, 'gün tamam'], [`${V.rekor}`, 'gün zincir'], [sayi(V.yuruDk), 'dk yürüyüş'], [String(V.setSay), 'set']];
  st.forEach(([a, b], i) => { const x = 34 + (i % 2) * 152, y = 186 + Math.floor(i / 2) * 96; kutu(c, x, y, 140, 80); yazi(c, a, x + 70, y + 44, { px: 32, w: 800 }); yazi(c, b, x + 70, y + 66, { px: 14, renk: '#6f5a73' }); });
  const a = V.agirlik[0];
  if (a && a.fark > 0) yazi(c, `${a.ad}: ${sayi(a.ilk)} → ${sayi(a.son)} kg`, 180, 412, { px: 17, renk: '#ffe066', w: 800 });
  yumak(c, 'sit', { t: 0.4, hat: true, eyes: 'happy', mouth: 'open' }, 180, 610, 1.9);
  yazi(c, 'Yumak’la 8 Hafta', 180, 630, { px: 12, pix: true, renk: '#e4d8ff' });
} };

function sahneListesi(V, video) {
  const L = [KAPAK, AYLAR, GUNLER];
  if (V.rekor > 0) L.push(ZINCIR);
  if (V.kuvvet > 0 || V.setSay > 0) L.push(KUVVET);
  if (V.agirlik.length) L.push(AGIRLIK);
  if (V.yuruDk > 0) L.push(YURUYUS);
  if (V.mutfak.kayitliGun) L.push(MUTFAK);
  if (V.enIyi && V.enIyi.oran > 0) L.push(ENIYI);
  L.push(MEKTUP, video ? KAPANIS : SON);
  return L;
}

// bir kare: ilerleme çubuğu + sahne
function kareCiz(c, S, sahneler, i, t, V) {
  c.setTransform(S, 0, 0, S, 0, 0); c.imageSmoothingEnabled = false;
  sahneler[i].ciz(c, t, V);
  const n = sahneler.length, gap = 4, w = (LW - 24 - gap * (n - 1)) / n;
  for (let j = 0; j < n; j++) {
    const x = 12 + j * (w + gap);
    c.fillStyle = 'rgba(61,42,63,.22)'; c.fillRect(x, 12, w, 4); c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(x, 12, w, 4);
    const k = j < i ? 1 : j > i ? 0 : kis(t / sahneler[i].sure);
    c.fillStyle = PAPER; c.fillRect(x, 12, w * k, 4);
  }
}
const fontlar = () => Promise.all([`700 40px ${PIX}`, `700 18px ${BODY}`, `800 18px ${BODY}`].map((f) => document.fonts?.load(f).catch(() => null)));

/* ---------- etkileşimli oynatıcı ---------- */
// son: { secenekler: [{ etiket, alt, tarih }], secili, sec(tarih) } — son sahnede yeni tur sorusu (varsa)
// sonaGelince(): son sahneye ilk gelişte bir kez çağrılır (arşivleme burada olur)
export async function hikayeAc(V, { son = null, sonaGelince = null, dosyaAdi = 'yumak-hikaye', basla = null } = {}) {
  await fontlar();
  const sahneler = sahneListesi(V, false);
  const kok = document.createElement('div');
  kok.className = 'hikaye'; kok.setAttribute('role', 'dialog'); kok.setAttribute('aria-modal', 'true'); kok.setAttribute('aria-label', 'Ay nasıl geçti? hikâyesi');
  kok.innerHTML = `<div class="hk-kutu"><canvas class="hk-tuval" aria-hidden="true"></canvas>
    <button type="button" class="hk-kapat" aria-label="Kapat">✕</button>
    <div class="hk-alt" hidden></div><p class="hk-sr" aria-live="polite"></p></div>`;
  document.body.append(kok); document.body.classList.add('hk-acik');
  const tuval = kok.querySelector('canvas'), ctx = tuval.getContext('2d'), alt = kok.querySelector('.hk-alt'), sr = kok.querySelector('.hk-sr');
  let i = 0, bas = performance.now(), raf = 0, bitti = false, sonaGeldi = false, kayit = null;
  const boyut = () => { const r = tuval.getBoundingClientRect(), d = Math.min(3, devicePixelRatio || 1); tuval.width = Math.round(r.width * d); tuval.height = Math.round(r.height * d); };
  boyut(); addEventListener('resize', boyut);
  const git = (n) => {
    if (kayit) return;
    i = Math.max(0, Math.min(sahneler.length - 1, n)); bas = performance.now();
    sr.textContent = `${i + 1}. sahne / ${sahneler.length}`;
    if (sahneler[i].son) { if (!sonaGeldi) { sonaGeldi = true; sonaGelince?.(); } altCiz(); } else alt.hidden = true;
  };
  function altCiz(mesaj = '') {
    alt.hidden = false;
    const s = son && son.secenekler?.length;
    alt.innerHTML = `${s ? `<p class="hk-soru">Yeni tur ne zaman başlasın?</p>
      <div class="hk-secenek">${son.secenekler.map((o) => `<button type="button" class="pbtn small${o.tarih === son.secili ? ' primary' : ''}" data-tarih="${o.tarih}"><b>${o.etiket}</b><span>${o.alt}</span></button>`).join('')}</div>` : ''}
      <div class="hk-indir"><button type="button" class="pbtn small" data-indir="video">Videoyu indir</button><button type="button" class="pbtn small" data-indir="resim">Resim indir</button><button type="button" class="pbtn small ghost" data-kapat>Kapat</button></div>
      <p class="hk-mesaj" role="status">${mesaj}</p>`;
  }
  alt.addEventListener('click', async (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.tarih) { son.secili = b.dataset.tarih; son.sec(b.dataset.tarih); const o = son.secenekler.find((x) => x.tarih === b.dataset.tarih); altCiz(`Tamam! Yeni tur ${o.alt} başlıyor.`); return; }
    if ('kapat' in b.dataset) return kapat();
    if (b.dataset.indir === 'resim') { const blob = await resimYap(V); const r = await kaydet(blob, `${dosyaAdi}.png`); altCiz(r === 'indirildi' ? 'Resim indirildi.' : r === 'paylasildi' ? 'Resim kaydedildi.' : ''); return; }
    if (b.dataset.indir === 'video') {
      if (!videoDestekli()) { altCiz('Bu tarayıcı video kaydedemiyor; resim olarak indirebilirsin.'); return; }
      kayit = { iptal: false }; cancelAnimationFrame(raf);
      alt.innerHTML = '<p class="hk-soru">Video hazırlanıyor… <b class="hk-yuzde">%0</b></p><p class="hk-mesaj">Yaklaşık 1 dakika sürer; ekranı açık tut.</p><div class="hk-indir"><button type="button" class="pbtn small ghost" data-vazgec>Vazgeç</button></div>';
      alt.querySelector('[data-vazgec]').onclick = () => { if (kayit) kayit.iptal = true; };
      try {
        const blob = await videoYap(V, { sinyal: kayit, ilerleme: (k) => { const y = alt.querySelector('.hk-yuzde'); if (y) y.textContent = `%${Math.round(k * 100)}`; },
          ayna: (kaynak) => { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = true; ctx.drawImage(kaynak, 0, 0, tuval.width, tuval.height); } });
        kayit = null; ciz();
        const ad = `${dosyaAdi}.${blob.type.includes('mp4') ? 'mp4' : 'webm'}`;
        alt.innerHTML = `<p class="hk-soru">Video hazır! 🎬</p><div class="hk-indir"><button type="button" class="pbtn small primary" data-kaydet>Videoyu kaydet</button><button type="button" class="pbtn small ghost" data-geri>Geri</button></div><p class="hk-mesaj" role="status"></p>`;
        alt.querySelector('[data-kaydet]').onclick = async () => { const r = await kaydet(blob, ad); alt.querySelector('.hk-mesaj').textContent = r === 'indirildi' ? 'Video indirildi.' : r === 'paylasildi' ? 'Video kaydedildi.' : ''; };
        alt.querySelector('[data-geri]').onclick = () => altCiz();
      } catch { kayit = null; ciz(); altCiz('Video yarıda kaldı. Tekrar deneyebilirsin.'); }
    }
  });
  const dokun = (e) => {
    if (kayit || bitti) return;
    const r = tuval.getBoundingClientRect(), x = (e.clientX - r.left) / r.width;
    if (sahneler[i].son && x >= 1 / 3) return; // son sahnede sağ taraf butonlara ait
    git(x < 1 / 3 ? i - 1 : i + 1);
  };
  tuval.addEventListener('click', dokun);
  const tus = (e) => { if (e.key === 'Escape') kapat(); else if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); git(i + 1); } else if (e.key === 'ArrowLeft') git(i - 1); };
  addEventListener('keydown', tus);
  kok.querySelector('.hk-kapat').onclick = () => kapat();
  function ciz() {
    if (bitti) return;
    if (!kayit) kareCiz(ctx, tuval.width / LW, sahneler, i, (performance.now() - bas) / 1000, V);
    raf = requestAnimationFrame(ciz);
  }
  function kapat() {
    if (kayit) kayit.iptal = true;
    bitti = true; cancelAnimationFrame(raf); removeEventListener('resize', boyut); removeEventListener('keydown', tus);
    kok.remove(); document.body.classList.remove('hk-acik');
  }
  git(basla === 'video' ? sahneler.length - 1 : 0); ciz();
  kok.querySelector('.hk-kapat').focus({ preventScroll: true });
  if (basla === 'video') alt.querySelector('[data-indir="video"]')?.click(); // arşivden "videoyu indir": doğrudan kayda geç
  return { kapat };
}

/* ---------- video ve resim ---------- */
const videoTipi = () => typeof MediaRecorder === 'undefined' ? null
  : ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'].find((t) => { try { return MediaRecorder.isTypeSupported(t); } catch { return false; } }) || null;
export const videoDestekli = () => !!(videoTipi() && HTMLCanvasElement.prototype.captureStream);

export async function videoYap(V, { ilerleme, ayna, sinyal } = {}) {
  await fontlar();
  const c = document.createElement('canvas'); c.width = 720; c.height = 1280;
  const ctx = c.getContext('2d'), S = c.width / LW, sahneler = sahneListesi(V, true), PAY = 0.5;
  const sureler = sahneler.map((s) => s.sure + PAY), toplam = sureler.reduce((a, b) => a + b, 0);
  kareCiz(ctx, S, sahneler, 0, 0, V);
  const tip = videoTipi(), rec = new MediaRecorder(c.captureStream(30), { mimeType: tip, videoBitsPerSecond: 5e6 });
  const parca = []; rec.ondataavailable = (e) => { if (e.data.size) parca.push(e.data); };
  const durdu = new Promise((r) => { rec.onstop = r; });
  rec.start(500);
  const t0 = performance.now();
  try {
    await new Promise((res, rej) => {
      const kare = (now) => {
        if (sinyal?.iptal || document.hidden) return rej(new Error('iptal'));
        const g = (now - t0) / 1000;
        if (g >= toplam) return res();
        let a = 0, i = 0; while (i < sahneler.length - 1 && g >= a + sureler[i]) { a += sureler[i]; i++; }
        kareCiz(ctx, S, sahneler, i, g - a, V);
        ayna?.(c); ilerleme?.(g / toplam);
        requestAnimationFrame(kare);
      };
      requestAnimationFrame(kare);
    });
  } finally { rec.stop(); await durdu; }
  return new Blob(parca, { type: tip.split(';')[0] });
}

export async function resimYap(V) {
  await fontlar();
  const c = document.createElement('canvas'); c.width = 1080; c.height = 1920;
  const ctx = c.getContext('2d'); ctx.setTransform(3, 0, 0, 3, 0, 0); ctx.imageSmoothingEnabled = false;
  KART.ciz(ctx, 0, V);
  return new Promise((r) => c.toBlob(r, 'image/png'));
}

// telefonda paylaş menüsü (Fotoğraflara kaydet), bilgisayarda doğrudan indir
export async function kaydet(blob, ad) {
  const dosya = new File([blob], ad, { type: blob.type });
  if (matchMedia('(pointer: coarse)').matches && navigator.canShare?.({ files: [dosya] })) {
    try { await navigator.share({ files: [dosya], title: ad }); return 'paylasildi'; } catch (e) { if (e.name === 'AbortError') return 'iptal'; }
  }
  const u = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = u; a.download = ad; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 60000);
  return 'indirildi';
}

// bir sonraki yeni ay (Meeus, Astronomical Algorithms bölüm 49; ana düzeltme terimleri, hata birkaç dakika)
function sonrakiYeniAy(g) {
  const r = Math.PI / 180, jdBugun = g.getTime() / 864e5 + 2440587.5;
  for (let k = Math.floor((jdBugun - 2451550.09766) / 29.530588861); ; k++) {
    const T = k / 1236.85, E = 1 - 0.002516 * T;
    const M = (2.5534 + 29.1053567 * k) * r, Mp = (201.5643 + 385.81693528 * k) * r, F = (160.7108 + 390.67050284 * k) * r, Om = (124.7746 - 1.56375588 * k) * r;
    const jde = 2451550.09766 + 29.530588861 * k + 0.00015437 * T * T
      - 0.4072 * Math.sin(Mp) + 0.17241 * E * Math.sin(M) + 0.01608 * Math.sin(2 * Mp) + 0.01039 * Math.sin(2 * F)
      + 0.00739 * E * Math.sin(Mp - M) - 0.00514 * E * Math.sin(Mp + M) + 0.00208 * E * E * Math.sin(2 * M)
      - 0.00111 * Math.sin(Mp - 2 * F) - 0.00057 * Math.sin(Mp + 2 * F) + 0.00056 * E * Math.sin(2 * Mp + M)
      - 0.00042 * Math.sin(3 * Mp) + 0.00042 * E * Math.sin(M + 2 * F) + 0.00038 * E * Math.sin(M - 2 * F) - 0.00017 * Math.sin(Om);
    const d = new Date((jde - 2440587.5) * 864e5 - 69e3); d.setHours(0, 0, 0, 0); // TT → UTC, yerel güne yuvarla
    if (d > g) return d;
  }
}
// yeni tur başlangıç seçenekleri: yeni ay, pazartesi, bugün
export function baslangicSecenekleri(bugun = new Date()) {
  const g = new Date(bugun); g.setHours(0, 0, 0, 0);
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const EK = ["Ocak'ta", "Şubat'ta", "Mart'ta", "Nisan'da", "Mayıs'ta", "Haziran'da", "Temmuz'da", "Ağustos'ta", "Eylül'de", "Ekim'de", "Kasım'da", "Aralık'ta"];
  const yaz = (d) => `${d.getDate()} ${EK[d.getMonth()]}`;
  const yeniAy = sonrakiYeniAy(g);
  const pzt = new Date(g); pzt.setDate(g.getDate() + ((8 - g.getDay()) % 7 || 7));
  const kalan = Math.round((yeniAy - g) / 864e5);
  return [
    { etiket: '🌑 Yeni ayla', alt: yaz(yeniAy), tarih: iso(yeniAy), not: `${kalan} gün sonra` },
    { etiket: 'Pazartesi', alt: yaz(pzt), tarih: iso(pzt) },
    { etiket: 'Hemen', alt: 'bugün', tarih: iso(g) },
  ];
}
