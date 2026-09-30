// Piksel simgeler ve uçuşan efektler (kalp, yıldız, ünlem...)
import { iconCanvas, Grid, M, limb, line, shade, paint } from './pixel.js';

// Koca yeşil tik: kalın piksel çizgi, koyu yeşil kenar, beyaz çıkartma çerçevesi
let checkCache = null;
export function checkCanvas(size = 48) {
  if (!checkCache) {
    const g = new Grid(20, 17);
    limb(g, 4, 9, 8, 13, 2.2, 2.2, M.SOLID, {}, 0, '#3cc97c');
    limb(g, 8, 13, 16, 4, 2.2, 2.2, M.SOLID, {}, 0, '#3cc97c');
    line(g, 4, 8, 7, 11, '#b8f5d3'); line(g, 8, 11, 15, 3, '#b8f5d3');
    shade(g, {}, { fluff: false, ink: '#1c5e3b' });
    // beyaz çıkartma kenarı: dış çizginin bir piksel dışı
    const ring = [];
    for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
      const i = y * g.w + x; if (g.col[i]) continue;
      const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const X = x + dx, Y = y + dy; return X >= 0 && Y >= 0 && X < g.w && Y < g.h && g.col[Y * g.w + X] === '#1c5e3b'; });
      if (nb) ring.push(i);
    }
    for (const i of ring) g.col[i] = '#fffaf3';
    checkCache = g;
  }
  const c = document.createElement('canvas'); c.className = 'pix check-icon';
  paint(c, checkCache);
  c.style.width = size + 'px'; c.style.height = 'auto';
  return c;
}

const K = '#3d2a3f';
export const ICONS = {
  heart: { p: { k: K, r: '#ff5f8f', l: '#ffb3c9' }, g: [
    '.kk.kk.',
    'krlkrrk',
    'krrrrrk',
    'krrrrrk',
    '.krrrk.',
    '..krk..',
    '...k...'] },
  sparkle: { p: { y: '#ffd84d', w: '#fff8d6' }, g: [
    '...y...',
    '...y...',
    '..ywy..',
    'yywwwyy',
    '..ywy..',
    '...y...',
    '...y...'] },
  bang: { p: { k: K, r: '#ff5f8f' }, g: [
    'kkk',
    'krk',
    'krk',
    'krk',
    'krk',
    'kkk',
    '...',
    'kkk',
    'krk',
    'kkk'] },
  question: { p: { k: K, b: '#7c6cff' }, g: [
    '.kkkk.',
    'kbbbbk',
    'kbkkbk',
    '.k.kbk',
    '..kbk.',
    '..kbk.',
    '..kk..',
    '..kk..',
    '..kbk.',
    '..kk..'] },
  note: { p: { k: K, v: '#8a6cff' }, g: [
    '..kkkk',
    '..kvvk',
    '..k..k',
    '..k..k',
    'kkk.kk',
    'kvk.kv',
    'kkk.kk'] },
  z: { p: { k: K, w: '#fffaf3' }, g: [
    'kkkkk',
    'kwwwk',
    'kkkwk',
    '.kwk.',
    'kwkkk',
    'kwwwk',
    'kkkkk'] },
  anger: { p: { r: '#ff4d6d' }, g: [
    'r.r.r',
    '.r.r.',
    'rr.rr',
    '.r.r.',
    'r.r.r'] },
  sweat: { p: { k: K, b: '#8fd3ff', w: '#e9f8ff' }, g: [
    '..k..',
    '.kbk.',
    'kbwbk',
    'kbbbk',
    '.kkk.'] },
  paw: { p: { k: K, p: '#ff7fa3' }, g: [
    '.kk..kk.',
    'kppkkppk',
    'kppkkppk',
    '.kk..kk.',
    '..kkkk..',
    '.kppppk.',
    'kppppppk',
    'kppppppk',
    '.kkkkkk.'] },
  kibble: { p: { k: '#6b3b25', o: '#c9793d' }, g: ['.o.', 'ooo', '.k.'] },
  drop: { p: { b: '#6fc3ff', w: '#dff3ff' }, g: ['.b.', 'bwb', 'bbb'] },
  sand: { p: { s: '#e8cf93' }, g: ['ss', 's.'] },
  dust: { p: { w: '#fffaf3', k: K }, g: ['.kk.', 'kwwk', 'kwwk', '.kk.'] },
  // takvim simgeleri (16x16)
  dumbbell: { p: { k: K, g: '#8f8ba3', l: '#d6d2e6', h: '#5d586f' }, g: [
    '................',
    '................',
    '................',
    '.kk..........kk.',
    'kgkk........kkgk',
    'kglk........klgk',
    'kglkkkkkkkkkklgk',
    'kglhhhhhhhhhhlgk',
    'kglkkkkkkkkkklgk',
    'kglk........klgk',
    'kggk........kggk',
    '.kkk........kkk.',
    '................',
    '................',
    '................',
    '................'] },
  shoe: { p: { k: K, p: '#ff8fb3', w: '#fffaf3', m: '#8fd4bc' }, g: [
    '................',
    '................',
    '................',
    '.....kkkk.......',
    '....kppppk......',
    '....kpwpwk......',
    '....kppppkkk....',
    '...kpppppppkk...',
    '..kpppppppppkk..',
    '.kppppppppppppk.',
    '.kwwwwwwwwwwwwk.',
    '.kmmmmmmmmmmmmk.',
    '..kkkkkkkkkkkk..',
    '................',
    '................',
    '................'] },
  bolt: { p: { k: K, y: '#ffd84d' }, g: [
    '................',
    '.........kkk....',
    '........kyyk....',
    '.......kyyk.....',
    '......kyyk......',
    '.....kyyyykkk...',
    '....kyyyyyyyk...',
    '...kkkkyyyyk....',
    '......kyyyk.....',
    '.....kyyyk......',
    '.....kyyk.......',
    '....kyyk........',
    '....kyk.........',
    '....kk..........',
    '................',
    '................'] },
  cushion: { p: { k: K, l: '#c7b3ff', d: '#9e86f0', w: '#fffaf3' }, g: [
    '................',
    '................',
    '................',
    '................',
    '.....kkkkkk.....',
    '...kkllllllkk...',
    '..klllwlllllk...',
    '.kllllllllllllk.',
    '.klllllllllldlk.',
    '.kdllllllllddlk.',
    '..kdddddddddk...',
    '...kkkkkkkkk....',
    '................',
    '................',
    '................',
    '................'] },
  // Yumak'ın oyuncakları ve efektleri
  yarn: { p: { k: K, p: '#e988b7', l: '#ffd9ea', d: '#cc6299' }, g: [
    '..kkkkk..',
    '.kplpppk.',
    'kppplpplk',
    'kpllpplpk',
    'klppllppk',
    'kpplppllk',
    'kplpplpdk',
    '.kdpplpk.',
    '..kkkkk..'] },
  cup: { p: { k: K, w: '#fffaf3', r: '#ff5f8f', g: '#e8d9ce' }, g: [
    '.kkkkkk...',
    'kwwwwwwk..',
    'kwrwrwwkk.',
    'kwrrrwwk.k',
    'kwwrwwwk.k',
    'kwwwwwwkk.',
    'kgwwwwgk..',
    '.kkkkkk...'] },
  bone: { p: { k: K, w: '#fffaf3' }, g: [
    'k..k.k.k.kk.',
    'kk.k.k.kkwwk',
    'kkkkkkkkwkwk',
    'kk.k.k.kkwwk',
    'k..k.k.k.kk.'] },
  speed: { p: { s: '#b9a6c6' }, g: [
    'sssss...',
    '........',
    '..ssssss',
    '........',
    '.ssss...'] },
  check: { p: { k: '#1c5e3b', g: '#3cc97c' }, g: [
    '.....kk',
    '....kgk',
    'k..kgk.',
    'kkkgk..',
    '.kgk...',
    '..k....'] },
};

// Efektler hangi katmana eklensin? Gün penceresi açıkken (modal) onun içine, yoksa sayfaya.
let root = null;
export function fxRoot(el) { root = el || null; }
const host = () => root || document.body;

export function icon(name, scale = 3) { const d = ICONS[name]; return iconCanvas(d.g, d.p, scale); }

// Uçuşan küçük efekt: ekranda (x,y) noktasından başlar
export function burst(name, x, y, { dx = 0, dy = -46, dur = 1100, scale = 3, delay = 0, spin = 0, fade = true } = {}) {
  const c = icon(name, scale); c.className = 'fx pix';
  const w = parseFloat(c.style.width), h = parseFloat(c.style.height);
  c.style.left = (x - w / 2) + 'px'; c.style.top = (y - h / 2) + 'px';
  host().appendChild(c);
  const steps = Math.max(4, Math.round(dur / 90));
  const a = c.animate([
    { transform: 'translate(0,0) scale(.6)', opacity: 0 },
    { transform: `translate(${dx * 0.3}px,${dy * 0.3}px) scale(1) rotate(${spin * 0.3}deg)`, opacity: 1, offset: 0.2 },
    { transform: `translate(${dx}px,${dy}px) scale(1) rotate(${spin}deg)`, opacity: fade ? 0 : 1 },
  ], { duration: dur, delay, easing: `steps(${steps})`, fill: 'backwards' });
  a.onfinish = () => c.remove();
  return c;
}
// Uçan piksel yazı: tekrar sayısı, "Priiit!", "Ommm"...
export function floatText(text, x, y, { dy = -34, dur = 1100, delay = 0, color } = {}) {
  const s = document.createElement('span'); s.className = 'fx fx-text'; s.textContent = text;
  if (color) s.style.color = color;
  s.style.left = Math.max(46, Math.min(innerWidth - 46, x)) + 'px'; s.style.top = y + 'px';
  host().appendChild(s);
  const a = s.animate([
    { transform: 'translate(-50%,-50%) scale(.4)', opacity: 0 },
    { transform: `translate(-50%,calc(-50% + ${dy * 0.35}px)) scale(1.18)`, opacity: 1, offset: 0.22 },
    { transform: `translate(-50%,calc(-50% + ${dy * 0.65}px)) scale(1)`, opacity: 1, offset: 0.7 },
    { transform: `translate(-50%,calc(-50% + ${dy}px)) scale(.92)`, opacity: 0 },
  ], { duration: dur, delay, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'backwards' });
  a.onfinish = () => s.remove();
}
export function hearts(x, y, n = 3) {
  for (let i = 0; i < n; i++) burst('heart', x + (i - (n - 1) / 2) * 16, y, { dx: (i - (n - 1) / 2) * 10, dy: -50 - i * 8, delay: i * 120 });
}
export function sparkles(x, y, n = 4) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    burst('sparkle', x, y, { dx: Math.cos(a) * 46, dy: Math.sin(a) * 36 - 12, delay: i * 70, dur: 900 });
  }
}

// Ev eşyaları (yatak, mama, su, kum kabı) — küçük tuvallere çizilir
export function drawHomeItems({ food, water, litter }) {
  const put = (id, draw) => { const c = document.querySelector(`#${id} canvas`); const ctx = c.getContext('2d'); ctx.clearRect(0, 0, c.width, c.height); draw(ctx, c.width, c.height); c.style.width = (c.width * 3) + 'px'; c.style.height = (c.height * 3) + 'px'; };
  const R = (ctx, x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(x, y, w, h); };
  put('bedItem', (ctx) => { // minder
    R(ctx, 2, 6, 28, 8, K); R(ctx, 3, 7, 26, 6, '#c7b3ff'); R(ctx, 3, 11, 26, 2, '#9e86f0'); R(ctx, 5, 4, 22, 3, K); R(ctx, 6, 5, 20, 2, '#e4d8ff'); R(ctx, 8, 8, 3, 1, '#fffaf3');
  });
  const bowl = (ctx, fill, fillCol, rim) => {
    R(ctx, 1, 5, 18, 1, K); R(ctx, 2, 6, 16, 5, K); R(ctx, 3, 6, 14, 4, rim); R(ctx, 4, 10, 12, 1, K);
    if (fill > 0) { const h = Math.max(1, Math.round(fill * 3)); R(ctx, 3, 6 - h + 1, 14, h, fillCol); }
  };
  put('foodItem', (ctx) => { bowl(ctx, food, '#b86a35', '#ff9fbd'); if (food > 0) { R(ctx, 5, 4, 2, 1, '#8a4a22'); R(ctx, 10, 3, 2, 1, '#d98a4b'); R(ctx, 13, 4, 2, 1, '#8a4a22'); } });
  put('waterItem', (ctx) => { bowl(ctx, water, '#7cc8ff', '#9fe3cf'); if (water > 0) R(ctx, 6, 6 - Math.round(water * 3) + 1, 3, 1, '#e3f5ff'); });
  put('litterItem', (ctx) => {
    R(ctx, 1, 4, 30, 10, K); R(ctx, 2, 5, 28, 8, '#ffd2ad'); R(ctx, 2, 5, 28, 2, '#e8cf93');
    for (let i = 0; i < 8; i++) R(ctx, 3 + i * 3.4, 5 + (i % 2), 1, 1, '#caa966');
    if (litter > 0.5) { R(ctx, 12, 3, 4, 2, '#8a6a4a'); }
    R(ctx, 4, 9, 24, 1, '#f2b88c');
  });
}
