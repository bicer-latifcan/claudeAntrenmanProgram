// Yumak'ın beyni: dolaşır, zıplar, konuşur, kaçar, enseden tutulur, yer, içer, uyur, idman yapar.
import { Grid, paint } from './pixel.js';
import * as Y from './yumak-art.js';
import { burst, hearts, sparkles, icon, floatText, fxRoot } from './fx.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const mix = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
const wave = (t, per) => t <= 0 ? 0 : (1 - Math.cos((t / per) * Math.PI * 2)) / 2; // 0 → 1 → 0
const sstep = (a, b, t) => { const k = clamp((t - a) / (b - a), 0, 1); return k * k * (3 - 2 * k); };
const TAU = Math.PI * 2;
const E = {
  inOut: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  outBack: t => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  in: t => t * t * t,
  out: t => 1 - Math.pow(1 - t, 3),
};
const FEET = 84; // ızgarada ayakların hizası
const FLIP = new Set(['walk', 'jump', 'eat', 'squat', 'stretch', 'scared', 'plank']); // yandan çizilen pozlar
const HEAD = { sleep: 36, plank: 46, stretch: 44, eat: 44 }; // konuşma balonu için başın yüksekliği
const SQ = { crouch: 0.14, air: -0.07, fall: -0.06, run: 0.04, zoomies: 0.05, pet: 0.04 }; // durumlara göre basılma/esneme
const FOLLOW = ['sit', 'walk', 'groom', 'pet', 'stretch', 'beg', 'celebrate', 'act'];
const GROUNDED = [...FOLLOW, 'eat', 'drink', 'squat', 'dig', 'sleep'];

export function initPet(app) {
  const layer = document.getElementById('petLayer');
  const cv = document.getElementById('yumak');
  const faceCv = document.getElementById('yumakFace');
  const bubble = document.getElementById('bubble');
  const sheet = document.getElementById('daySheet');
  const grid = new Grid(Y.W, Y.H), fgrid = new Grid(Y.FACE_W, Y.FACE_H);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const S = app.sozler, L = app.etkinlik || {};
  const need = app.state.pet || (app.state.pet = { food: 0.7, water: 0.8, litter: 0, hunger: 0.2, thirst: 0.15, potty: 0.05 });

  const pointer = { x: -999, y: -999 };
  const cat = {
    x: innerWidth * 0.22, y: 0, dir: 1, dy: 0, scale: 1, alpha: 1,
    surf: null, off: 0, state: 'sit', st: 0, next: 4, t: 0,
    pose: 'sit', ps: {}, blink: false, blinkT: 2, earT: 0,
    jump: null, vx: 0, vy: 0, swing: 0, target: 0, after: null,
    talking: false, lastInput: performance.now(), peekCd: 25, faceY: 110, flip: false,
    // akıcılık: yaylı basılma/esneme, eğim, küçük kaydırma, dönme
    sq: 0, sqv: 0, sqT: 0, tilt: 0, tiltT: 0, lean: 0, pivot: 30, ox: 0, spinX: 1,
    act: null, micro: null,
  };
  const scale = () => cv.offsetWidth / Y.W;
  const floorY = () => innerHeight - 8;
  cat.y = floorY();

  /* ---------- yüzeyler ---------- */
  function platforms() {
    const out = [], fy = floorY();
    if (sheet.open) {
      const r = sheet.getBoundingClientRect();
      if (r.top > 100) out.push({ el: sheet, r });
      return out;
    }
    for (const el of document.querySelectorAll('main [data-platform]')) {
      const r = el.getBoundingClientRect(), day = el.dataset.platform === 'day';
      if (r.width < (day ? 28 : 80)) continue;
      if (r.top < 70 || r.top > fy - 110) continue;
      out.push({ el, r });
    }
    return out;
  }
  const surfY = (s) => s ? s.el.getBoundingClientRect().top + 2 : floorY();
  const surfRange = (s) => { if (!s) return [50, innerWidth - 50]; const r = s.el.getBoundingClientRect(); return [r.left + 14, r.right - 14]; };
  function surfValid(s) {
    if (!s) return true;
    if (!s.el.isConnected || (s.el === sheet && !sheet.open)) return false;
    const r = s.el.getBoundingClientRect();
    return r.width > 0 && r.top > 40 && r.top < floorY() - 70;
  }
  function itemX(id) { const r = document.getElementById(id).getBoundingClientRect(); return r.left + r.width / 2; }

  /* ---------- konuşma ---------- */
  let audio = null, soundOn = !!app.state.sound;
  function ac() { if (!audio) try { audio = new (window.AudioContext || window.webkitAudioContext)(); } catch { soundOn = false; } return audio; }
  function blip(ch) {
    if (!soundOn || !/[a-zçğıöşü]/i.test(ch) || !ac()) return;
    const t = audio.currentTime, o = audio.createOscillator(), g = audio.createGain();
    const f = 560 + (ch.toLowerCase().charCodeAt(0) % 12) * 36;
    o.type = 'triangle'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 1.3, t + 0.05);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    o.connect(g).connect(audio.destination); o.start(t); o.stop(t + 0.08);
  }
  function toot() { // düdük: titreşimli ince ses
    if (!soundOn || !ac()) return;
    const t = audio.currentTime, o = audio.createOscillator(), g = audio.createGain(), l = audio.createOscillator(), lg = audio.createGain();
    o.type = 'sine'; o.frequency.value = 2300; l.frequency.value = 38; lg.gain.value = 140; l.connect(lg).connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.02); g.gain.setValueAtTime(0.05, t + 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
    o.connect(g).connect(audio.destination); o.start(t); l.start(t); o.stop(t + 0.45); l.stop(t + 0.45);
  }
  let purrNode = null;
  function purr(on) {
    if (!soundOn || !ac()) return;
    if (on && !purrNode) {
      const n = audio.createBufferSource(), buf = audio.createBuffer(1, audio.sampleRate * 2, audio.sampleRate), d = buf.getChannelData(0);
      let last = 0; for (let i = 0; i < d.length; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
      n.buffer = buf; n.loop = true;
      const lp = audio.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380;
      const g = audio.createGain(); g.gain.value = 0;
      const lfo = audio.createOscillator(), lg = audio.createGain(); lfo.frequency.value = 25; lg.gain.value = 0.35;
      lfo.connect(lg).connect(g.gain);
      n.connect(lp).connect(g).connect(audio.destination); n.start(); lfo.start();
      g.gain.setTargetAtTime(0.4, audio.currentTime, 0.2);
      purrNode = { n, lfo, g };
    } else if (!on && purrNode) {
      const p = purrNode; purrNode = null; p.g.gain.setTargetAtTime(0, audio.currentTime, 0.15);
      setTimeout(() => { p.n.stop(); p.lfo.stop(); }, 600);
    }
  }
  let sayTimer = 0, sayIv = 0, anchor = 'cat';
  function say(html, ms = 3600, where = 'cat') {
    clearInterval(sayIv); clearTimeout(sayTimer);
    anchor = where; bubble.classList.add('on'); cat.talking = true;
    const tokens = html.match(/<[^>]+>|[^<]/g) || []; let i = 0;
    bubble.innerHTML = '';
    sayIv = setInterval(() => {
      if (i >= tokens.length) { clearInterval(sayIv); cat.talking = false; sayTimer = setTimeout(() => bubble.classList.remove('on'), ms); return; }
      let chunk = tokens[i++]; while (chunk.startsWith('<') && i < tokens.length) chunk += tokens[i++];
      bubble.innerHTML = tokens.slice(0, i).join(''); blip(chunk.slice(-1));
    }, 28);
  }
  function hush() { clearInterval(sayIv); clearTimeout(sayTimer); cat.talking = false; bubble.classList.remove('on'); }
  function headPt() {
    const s = scale() * cat.scale;
    if (anchor === 'face') { const r = faceCv.getBoundingClientRect(); return [r.left + r.width * 0.5, r.top + 8]; }
    return [cat.x + cat.ox, cat.y + cat.dy - (HEAD[cat.pose] ?? 70) * s];
  }
  let bubbleMax = '';
  function placeBubble() {
    if (!bubble.classList.contains('on')) return;
    const [ax, ay] = headPt(), half = 40 * scale() * cat.scale + 8;
    let bw = bubble.offsetWidth, bh = bubble.offsetHeight;
    const side = ay - bh - 16 < 8; // üstte yer yoksa yanına
    // dar ekranda (ör. telefonda gün penceresinin üstünde) balon yandaki boşluğa sığsın, yüzü kapatmasın
    const roomL = ax - half - 10, roomR = innerWidth - ax - half - 10, onLeft = roomL >= roomR, room = Math.max(roomL, roomR);
    const max = side && room >= 150 && room < Math.min(320, innerWidth * 0.8) ? Math.floor(room) + 'px' : '';
    if (max !== bubbleMax) { bubbleMax = max; bubble.style.maxWidth = max; bw = bubble.offsetWidth; bh = bubble.offsetHeight; }
    let left = clamp(ax - 46, 10, innerWidth - bw - 10), top = ay - bh - 16;
    if (side) { top = clamp(ay + 10, 8, innerHeight - bh - 8); left = clamp(onLeft ? ax - half - bw : ax + half, 10, innerWidth - bw - 10); }
    bubble.style.left = left + 'px'; bubble.style.top = top + 'px';
    bubble.classList.toggle('side', side); bubble.classList.remove('below');
    bubble.style.setProperty('--tail', clamp(ax - left - 6, 14, bw - 26) + 'px');
  }

  // aynı cümleyi üst üste söylemesin
  const recentLines = [];
  function fresh(arr) {
    let l = pick(arr);
    for (let i = 0; i < 6 && recentLines.includes(l); i++) l = pick(arr);
    recentLines.unshift(l); recentLines.length = Math.min(recentLines.length, 30);
    return l;
  }
  const timeKey = () => { const h = new Date().getHours(); return h < 5 ? 'gece' : h < 11 ? 'sabah' : h < 17 ? 'ogle' : h < 22 ? 'aksam' : 'gece'; };
  const DAY_KEY = { kuvvet: 'gunKuvvet', yuruyus: 'gunYuruyus', uzun: 'gunUzun', aralikli: 'gunAralikli', dinlenme: 'gunDinlenme' };
  function progressLine() {
    const n = Object.values(app.state.done || {}).filter(Boolean).length;
    const lv = n === 0 ? 0 : n < 8 ? 1 : n < 24 ? 2 : 3;
    return fresh(S['ilerleme' + lv]).replaceAll('{n}', n);
  }
  function todayLine() {
    const ti = app.todayIndex(); if (!ti) return null;
    const k = DAY_KEY[app.dayInfo(ti.w, ti.d).tur];
    return k && S[k] ? fresh(S[k]) : null;
  }
  function chatter() { // tavsiye, şaka, düşünce, ilerleme, saat, bugünün günü
    const r = Math.random();
    if (r < 0.28) return fresh(S.tavsiye);
    if (r < 0.56) return fresh(S.sakalar);
    if (r < 0.72) return fresh(S.dusunce);
    if (r < 0.82) return progressLine();
    if (r < 0.9) return fresh(S[timeKey()]);
    return todayLine() || fresh(S.sakalar);
  }

  /* ---------- durum makinesi ---------- */
  function set(s, pose, ps = {}) { if (cat.act && s !== 'act') stopAct(); cat.state = s; cat.st = 0; if (pose) { cat.pose = pose; cat.ps = ps; } cat.forceDraw = true; }
  function sit(next = rnd(3, 7)) { set('sit', 'sit', {}); cat.next = next; cat.dy = 0; }
  const busy = () => !['sit', 'walk'].includes(cat.state);
  function puff() { const s = scale(); for (const k of [-1, 1]) burst('dust', cat.x + k * 24 * s, cat.y - 4, { dx: k * 22, dy: -8, dur: 420 }); }

  function walkTo(x, then, fast = false) { const [a, b] = surfRange(cat.surf); cat.target = clamp(x, a, b); cat.dir = cat.target > cat.x ? 1 : -1; cat.after = then || null; cat.fast = fast; set('walk', 'walk', { phase: 0, run: fast }); }
  function jumpTo(surf, x, then) {
    const y1 = surfY(surf), up = cat.y - y1;
    cat.jump = { x0: cat.x, y0: cat.y, x1: x, surf, T: 0.42 + Math.abs(x - cat.x) / 1800 + Math.abs(up) / 2600, h: up > 0 ? up * 0.55 + 46 : 34 };
    cat.dir = x >= cat.x ? 1 : -1; cat.after = then || null;
    set('crouch', 'jump', { jumpPhase: 0 });
  }
  function arrive() {
    const s = cat.surf; sit(rnd(5, 9));
    if (cat.after) { const f = cat.after; cat.after = null; f(); return; }
    if (!s) return;
    if (s.el.dataset.platform === 'day') {
      const w = +s.el.dataset.w, d = +s.el.dataset.d;
      say(app.describeDay(w, d), 4200);
      if (s.el.classList.contains('is-done')) hearts(cat.x, cat.y - 90, 2);
      else if (!s.el.classList.contains('is-today')) burst('question', cat.x + 26, cat.y - 110, { dy: -24, dur: 900 });
    } else if (s.el === sheet) {
      const o = app.currentDay; if (o) say(app.describeDay(o.w, o.d), 4200);
    } else if (Math.random() < 0.6) say(chatter(), 5200);
  }

  function pickNext() {
    const idle = (performance.now() - cat.lastInput) / 1000;
    if (reduce) { if (Math.random() < 0.4) say(chatter(), 5200); sit(rnd(8, 14)); return; }
    // ihtiyaçlar
    if (!sheet.open && !cat.surf) {
      if (need.potty > 0.9) return goLitter();
      if (need.hunger > 0.78) return goBowl('food');
      if (need.thirst > 0.78) return goBowl('water');
    } else if (need.hunger > 0.9 || need.potty > 0.95) { return jumpTo(null, clamp(cat.x, 60, innerWidth - 60)); }
    const r = Math.random();
    if (idle > 50 && r < 0.3 && !sheet.open) return goBed();
    if (r < 0.2) { const [a, b] = surfRange(cat.surf); return walkTo(rnd(a, b)); }
    if (r < 0.38) {
      const ps = platforms().filter(p => !cat.surf || p.el !== cat.surf.el);
      if (ps.length) {
        const today = ps.find(p => p.el.classList?.contains('is-today'));
        const p = (today && Math.random() < 0.45) ? today : pick(ps);
        const x = clamp(p.r.left + p.r.width / 2 + rnd(-20, 20), p.r.left + 16, p.r.right - 16);
        if (Math.abs(surfY({ el: p.el }) - cat.y) < 560) return jumpTo({ el: p.el }, x);
      }
      if (cat.surf) return jumpTo(null, clamp(cat.x + rnd(-120, 120), 60, innerWidth - 60));
    }
    if (r < 0.72 && startAct(chooseAct())) return;
    if (r < 0.84) { say(chatter(), 5200); return sit(rnd(6, 9)); }
    if (r < 0.89) { set('groom', 'sit', { groom: true }); return; }
    if (r < 0.92) { set('stretch', 'stretch', {}); return; }
    if (r < 0.97 && !cat.surf && !sheet.open && cat.peekCd <= 0) return startPeek();
    sit();
  }

  // otururken küçük canlılıklar: yavaş göz kırpma, etrafa bakma, kuyruk, kulak
  function idle() {
    const now = cat.t;
    if (!cat.micro || now > cat.micro.until) {
      const kinds = ['blink', 'tail', 'ear', 'none', 'none'];
      if (performance.now() - cat.lastInput > 3000) kinds.push('look', 'look');
      const k = pick(kinds), len = k === 'look' ? rnd(1, 1.8) : rnd(0.7, 1.3);
      cat.micro = { k, on: now + len, until: now + len + rnd(1.2, 3.5), d: Math.random() < 0.5 ? -1 : 1 };
      if (k === 'ear') cat.earT = 0.25;
    }
    const m = cat.micro, on = now < m.on, ps = {};
    if (on && m.k === 'blink') ps.eyes = 'happy';
    if (on && m.k === 'look') ps.look = { x: m.d, y: 0 };
    if (on && m.k === 'tail') ps.tailFast = true;
    ps.mouth = cat.talking && Math.sin(cat.t * 20) > 0 ? 'open' : 'closed';
    cat.ps = ps;
  }

  /* ---------- ev işleri ---------- */
  function goBowl(kind, fast = false) {
    const x = itemX(kind === 'food' ? 'foodItem' : 'waterItem') - 60;
    walkTo(x, () => {
      cat.dir = 1;
      const lvl = kind === 'food' ? need.food : need.water;
      if (lvl > 0.1) { set(kind === 'food' ? 'eat' : 'drink', 'eat', { drink: kind === 'water' }); cat.bowl = kind; }
      else { set('beg', 'sit', { mouth: 'meow' }); cat.bowl = kind; burst('bang', cat.x + 30, cat.y - 130, { dy: -20, dur: 900 }); say(pick(kind === 'food' ? S.ac : S.susuz), 4000); }
    }, fast);
  }
  function goLitter() { walkTo(itemX('litterItem') - 10, () => { cat.dir = 1; set('squat', 'squat', {}); say(pick(S.kum), 2200); }); }
  function goBed() { walkTo(itemX('bedItem'), () => { set('sleep', 'sleep', {}); say(pick(S.uyku), 2600); }); }
  function refreshItems() { app.drawHomeItems(need); document.getElementById('foodNeed').textContent = need.food < 0.1 ? '!' : ''; document.getElementById('waterNeed').textContent = need.water < 0.1 ? '!' : ''; }
  document.getElementById('foodItem').addEventListener('click', (e) => {
    need.food = 1; refreshItems(); const r = e.currentTarget.getBoundingClientRect(); sparkles(r.left + r.width / 2, r.top);
    for (let i = 0; i < 6; i++) burst('kibble', r.left + r.width / 2 + rnd(-10, 10), r.top - 20, { dy: 18, dx: rnd(-8, 8), delay: i * 60, dur: 500, fade: false });
    if (cat.state === 'beg' && cat.bowl === 'food') set('eat', 'eat', {});
    else if (!busy() && !sheet.open) {
      burst('bang', cat.x + 20, cat.y - 130, { dy: -20 }); say('Mama mı dedin?!', 1400);
      if (cat.surf) jumpTo(null, clamp(cat.x, 60, innerWidth - 60), () => goBowl('food', true)); else goBowl('food', true);
    }
  });
  document.getElementById('waterItem').addEventListener('click', (e) => {
    need.water = 1; refreshItems(); const r = e.currentTarget.getBoundingClientRect(); sparkles(r.left + r.width / 2, r.top);
    for (let i = 0; i < 4; i++) burst('drop', r.left + r.width / 2 + rnd(-8, 8), r.top - 18, { dy: 16, delay: i * 70, dur: 450, fade: false });
    if (cat.state === 'beg' && cat.bowl === 'water') set('drink', 'eat', { drink: true });
  });
  document.getElementById('litterItem').addEventListener('click', (e) => {
    const r = e.currentTarget.getBoundingClientRect(); need.litter = 0; refreshItems(); sparkles(r.left + r.width / 2, r.top, 5);
    if (!busy() && !cat.surf) say('Tertemiz! Teşekkürler.', 2400);
  });
  document.getElementById('bedItem').addEventListener('click', () => { if (!busy() || cat.state === 'sit') { if (cat.surf) jumpTo(null, itemX('bedItem'), goBed); else goBed(); } });

  /* ---------- etkinlikler: Yumak da idman yapar, şaka yapar ---------- */
  const REST_L = [30, 63], REST_R = [58, 63];   // ayakta dururken patiler
  const ELB_L = [30.5, 56], ELB_R = [57.5, 56]; // düz kolun ortası (dirsek)
  function at(gx, gy) { // ızgara (88x88) noktası → ekran
    const s = scale() * cat.scale, f = FLIP.has(cat.pose) && cat.dir < 0 ? -1 : 1;
    return [cat.x + cat.ox + (gx - 44) * s * f, cat.y + cat.dy + (gy - FEET) * s];
  }
  const fxAt = (name, gx, gy, o) => { const [x, y] = at(gx, gy); burst(name, x, y, o); };
  const txtAt = (text, gx, gy, o) => { const [x, y] = at(gx, gy); floatText(text, x, y, o); };
  const once = (a, key, cond) => { if (cond && !a[key]) { a[key] = 1; return true; } return false; };
  const every = (a, key, per, t) => { if (t >= (a[key] ?? 0)) { a[key] = t + per; return true; } return false; };
  const fade = (a, t, d = 0.3) => sstep(0, d, t) * (1 - sstep(a.T - d, a.T, t)); // giriş/çıkış yumuşak
  function track(keys, t) { // anahtar karelerden yumuşak geçiş: [[zaman, değerler...], ...]
    if (t <= keys[0][0]) return keys[0].slice(1);
    for (let i = 1; i < keys.length; i++) if (t < keys[i][0]) {
      const a = keys[i - 1], b = keys[i], k = E.inOut((t - a[0]) / (b[0] - a[0]));
      return a.slice(1).map((v, j) => lerp(v, b[j + 1], k));
    }
    return keys[keys.length - 1].slice(1);
  }
  function reps(a, u, per, max, gx = 80, gy = 24) { // tekrar sayacı
    const n = Math.min(max, Math.floor((u - per / 2) / per) + 1);
    if (n > a.n) { a.n = n; txtAt(String(n), gx, gy, { dy: -30 }); if (n === max) fxAt('sparkle', gx, gy - 12, { dy: -30, dur: 800 }); }
  }
  function prop(name) { // elle yönetilen eşya (yumak, bardak)
    const c = icon(name, 3); c.className = 'prop pix';
    (sheet.open ? sheet : document.body).appendChild(c);
    cat.act.props.push(c); return c;
  }
  function putProp(c, x, y, rot = 0, op = 1) {
    const w = parseFloat(c.style.width), h = parseFloat(c.style.height);
    c.style.transform = `translate(${x - w / 2}px, ${y - h}px) rotate(${rot}deg)`; c.style.opacity = op;
  }

  // her etkinlik: tags (bağlam), pose, T (süre), tick(a, t, dt) → poz ayarları
  const ACTS = {
    curl: { tags: ['guc'], pose: 'stand', T: 5.8, tick(a, t) {
      const u = t - 0.4, k = E.inOut(wave(u, 1.7)), top = k > 0.75; reps(a, u, 1.7, 3);
      return { prop: 'db', elbowR: [59, 60], pawR: mix([60, 69], [52, 47], k), look: { x: 1, y: 0 }, eyes: top ? 'squint' : 'open', mouth: top ? 'open' : undefined };
    } },
    press: { tags: ['guc'], pose: 'stand', T: 5.8, tick(a, t) {
      const u = t - 0.5, k = E.inOut(wave(u, 1.8)), f = fade(a, t, 0.4), top = k > 0.8; reps(a, u, 1.8, 3, 10);
      return { prop: 'db', pawR: mix(REST_R, mix([61, 38], [58, 12], k), f), elbowR: mix(ELB_R, mix([66, 50], [59, 31], k), f), eyes: top ? 'squint' : 'open', mouth: top ? 'open' : undefined };
    } },
    barbell: { tags: ['guc'], pose: 'stand', T: 6.2, tick(a, t) {
      const [py, sq] = track([[0, 62, 0.7], [0.9, 62, 0.7], [1.6, 45, 0.15], [2.3, 13, 0], [4.4, 13, 0], [5.1, 45, 0.1], [5.9, 62, 0.4], [6.2, 63, 0]], t);
      const hold = t > 2.3 && t < 4.4;
      if (hold && every(a, 'sw', 0.45, t)) fxAt('sweat', rnd(28, 60), 18, { dx: rnd(-34, 34), dy: -22, dur: 700 });
      if (once(a, 'yay', t > 3.1)) { sparkles(...at(44, 6), 5); txtAt('Rekor!', 80, 22, { dy: -30, dur: 1300 }); }
      return { prop: 'barbell', pawL: [28, py], pawR: [60, py], squat: sq, sway: hold ? Math.sin(t * 11) * 0.35 : 0, eyes: hold && t > 3.1 ? 'happy' : 'squint', mouth: 'open' };
    } },
    squat: { tags: ['guc'], pose: 'stand', T: 6, tick(a, t) {
      const u = t - 0.4, k = E.inOut(wave(u, 1.8)); reps(a, u, 1.8, 3);
      return { squat: k, pawL: mix(REST_L, [33, 45], k), pawR: mix(REST_R, [55, 45], k), eyes: k > 0.8 ? 'squint' : 'open', mouth: k > 0.8 ? 'open' : undefined };
    } },
    pushup: { tags: ['guc'], pose: 'plank', T: 5.6, tick(a, t) {
      const u = t - 0.4, k = E.inOut(wave(u, 1.35)), flop = t > a.T - 0.6;
      if (!flop) reps(a, u, 1.35, 3, 72, 36);
      if (once(a, 'of', flop)) { txtAt('Of!', 72, 40, { dy: -24 }); cat.sqv += 2.5; }
      return { down: flop ? 1 : k, eyes: flop ? 'closed' : 'squint', mouth: flop || k > 0.7 ? 'open' : 'closed' };
    } },
    plank: { tags: ['guc'], pose: 'plank', T: 6.2, tick(a, t) {
      for (const [tt, n] of [[2.2, '3'], [3.3, '2'], [4.4, '1']]) if (once(a, 'c' + n, t > tt)) txtAt(n, 72, 34, { dy: -28 });
      if (t > 3 && t < 5.4 && every(a, 'sw', 0.6, t)) fxAt('sweat', 70, 44, { dx: rnd(-10, 24), dy: -24, dur: 700 });
      const done = t > 5.4;
      if (once(a, 'fin', done)) { txtAt('Bitti!', 72, 30, { dy: -28, dur: 1300 }); cat.sqv += 2.5; }
      return { tremble: t > 1.4 && !done, down: done ? 1 : 0, eyes: done ? 'closed' : t > 3 ? 'squint' : 'open', mouth: t > 4 ? 'open' : 'closed' };
    } },
    jumprope: { tags: ['kardiyo'], pose: 'stand', T: 5.1, tick(a, t) {
      const ph = Math.max(0, t - 0.3) * 1.25, f = ph % 1;
      let h = 0; if (ph > 0.3 && f > 0.3 && f < 0.72) { const u = (f - 0.3) / 0.42; h = 4 * u * (1 - u); }
      cat.dy = -h * 9 * scale();
      if (a.air && !h) { cat.sqv += 2; fxAt('dust', 30, 85, { dx: -14, dy: -6, dur: 380 }); fxAt('dust', 58, 85, { dx: 14, dy: -6, dur: 380 }); }
      a.air = h > 0;
      const w = Math.cos(ph * TAU) * 1.3, v = Math.sin(ph * TAU) * 1.3;
      return { rope: ph, pawL: [27 + w, 62 + v], pawR: [61 - w, 62 + v], eyes: 'happy', mouth: h > 0.2 ? 'open' : undefined };
    } },
    hula: { tags: ['kardiyo'], pose: 'stand', T: 5.4, tick(a, t) {
      const ph = t * 1.5, f = fade(a, t, 0.3);
      if (every(a, 'sp', 1.1, t)) fxAt('sparkle', 44 + rnd(-34, 34), 56, { dy: -30, dur: 800 });
      return { hoop: ph, sway: Math.sin(ph * TAU) * 0.8 * f, pawL: mix(REST_L, [24, 38 + Math.sin(t * 5) * 2], f), pawR: mix(REST_R, [64, 38 + Math.cos(t * 5) * 2], f), eyes: 'happy', mouth: Math.sin(t * 3) > 0 ? 'open' : undefined };
    } },
    treadmill: { tags: ['kardiyo'], pose: 'walk', T: 5.4, tick(a, t, dt) {
      cat.dy = -3 * scale(); // bant yüzeyin üstünde dursun
      const sp = sstep(0, 0.9, t) * (1 - sstep(a.T - 0.7, a.T, t));
      a.ph = (a.ph || 0) + dt * (5 + sp * 13);
      a.belt = (a.belt || 0) + dt * (0.6 + sp * 2.6);
      if (sp > 0.6 && every(a, 'du', 0.22, t)) fxAt('dust', 4, 84, { dx: -24, dy: -6, dur: 400 });
      if (sp > 0.6 && every(a, 'sl', 0.5, t)) fxAt('speed', 2, 56, { dx: -28, dy: 0, dur: 420 });
      return { run: sp > 0.55, band: true, phase: a.ph, belt: a.belt, mouth: sp > 0.55 && Math.sin(t * 10) > 0 ? 'open' : undefined };
    } },
    armcircles: { tags: ['guc'], pose: 'stand', T: 4.8, tick(a, t) {
      const h = a.T / 2, ang = TAU * 1.2 * (t < h ? t : 2 * h - t), f = fade(a, t, 0.35);
      if (once(a, 'rev', t > h)) txtAt('Geri!', 82, 24, { dy: -28 });
      return { pawL: mix(REST_L, [22 + Math.cos(ang) * 5, 45 + Math.sin(ang) * 5], f), pawR: mix(REST_R, [66 - Math.cos(ang) * 5, 45 + Math.sin(ang) * 5], f), eyes: 'happy' };
    } },
    dance: { tags: ['kardiyo'], pose: 'stand', T: 5.8, tick(a, t) {
      const beat = 0.55, b = t / beat, i = Math.floor(b), u = sstep(0, 0.42, b - i), f = fade(a, t, 0.25);
      const A = [-0.8, [24, 22], [62, 58]], B = [0.8, [26, 58], [64, 22]], [p, q] = i % 2 ? [A, B] : [B, A];
      if (i !== a.i) { a.i = i; if (i > 0 && t < a.T - 0.3) { cat.sqv += 1.4; fxAt('note', i % 2 ? 76 : 12, 30, { dx: i % 2 ? 18 : -18, dy: -36, dur: 900 }); } }
      cat.dy = -Math.sin(u * Math.PI) * 4 * scale() * f;
      return { sway: lerp(p[0], q[0], u) * f, pawL: mix(REST_L, mix(p[1], q[1], u), f), pawR: mix(REST_R, mix(p[2], q[2], u), f), eyes: 'happy', mouth: 'open' };
    } },
    flex: { tags: ['guc'], pose: 'stand', T: 4.6, tick(a, t) {
      const k = fade(a, t, 0.45), pump = t > 0.5 && t < a.T - 0.5 ? Math.sin((t - 0.5) * 7) : 0;
      if (once(a, 's1', t > 0.6)) { fxAt('sparkle', 16, 36, { dx: -20, dy: -24, dur: 800 }); fxAt('sparkle', 72, 36, { dx: 20, dy: -24, dur: 800 }); }
      if (once(a, 's2', t > 2.6)) sparkles(...at(44, 30), 5);
      return { flex: k > 0.6, elbowL: mix(ELB_L, [22, 44], k), elbowR: mix(ELB_R, [66, 44], k), pawL: mix(REST_L, [26, 30 + pump * 1.4], k), pawR: mix(REST_R, [62, 30 + pump * 1.4], k), eyes: pump > 0.3 ? 'squint' : 'happy', mouth: pump > 0.3 ? 'open' : undefined };
    } },
    yoga: { tags: ['sakin'], pose: 'stretch', T: 5.8, tick(a, t) {
      if (t < 2.6) { if (every(a, 'sp', 1, t)) fxAt('sparkle', 44 + rnd(-30, 30), 60, { dy: -26, dur: 800 }); return { eyes: 'closed', mouth: 'closed' }; }
      if (cat.pose !== 'stand') { cat.pose = 'stand'; cat.sqv -= 2.2; sparkles(...at(44, 14), 4); }
      const k = sstep(2.6, 3.1, t) * (1 - sstep(a.T - 0.35, a.T, t));
      return { eyes: 'closed', mouth: 'closed', sway: Math.sin(t * 1.4) * 0.3, elbowL: mix(ELB_L, [30, 30], k), elbowR: mix(ELB_R, [58, 30], k), pawL: mix(REST_L, [41.5, 13], k), pawR: mix(REST_R, [46.5, 13], k) };
    } },
    meditate: { tags: ['sakin'], pose: 'sit', T: 6.2, tick(a, t) {
      const lev = sstep(0.4, 1.4, t) * (1 - sstep(a.T - 0.9, a.T - 0.1, t));
      cat.dy = -lev * (16 + Math.sin(t * 2.2) * 3) * scale();
      if (lev > 0.5 && every(a, 'sp', 0.8, t)) fxAt('sparkle', 44 + rnd(-36, 36), 64 + rnd(-10, 10), { dy: -24, dur: 900 });
      if (once(a, 'o1', t > 1.7)) txtAt('Ommm', 84, 30, { dy: -26, dur: 1500, color: '#a792e6' });
      if (once(a, 'o2', t > 3.9)) txtAt('Ommm', 84, 30, { dy: -26, dur: 1500, color: '#a792e6' });
      if (once(a, 'down', t > a.T - 0.15)) cat.sqv += 2;
      return { paws: 'together', eyes: 'closed', mouth: 'closed' };
    } },
    whistle: { tags: ['koc'], pose: 'stand', T: 4, sayAt: 1.25, tick(a, t) {
      const up = fade(a, t, 0.45), blow = (t > 0.7 && t < 1.2) || (t > 2.4 && t < 2.9);
      if (once(a, 'b1', t > 0.7)) { toot(); txtAt('Priiit!', 82, 24, { dy: -28 }); }
      if (once(a, 'b2', t > 2.4)) { toot(); txtAt('Priit!', 82, 24, { dy: -28 }); }
      const point = sstep(1.3, 1.6, t) * (1 - sstep(2.1, 2.4, t));
      return { prop: 'whistle', elbowR: mix(ELB_R, [60, 56], up), pawR: mix(REST_R, [50, 38], up), pawL: mix(REST_L, [14, 36], point), eyes: blow ? 'closed' : 'open', mouth: 'closed' };
    } },
    clipboard: { tags: ['koc'], pose: 'sit', T: 4.8, tick(a, t) {
      for (const tt of [1.5, 2.3, 3.1]) if (once(a, 'k' + tt, t > tt)) fxAt('check', 50, 50, { dx: 24, dy: -30, dur: 800 });
      const done = t > a.T - 0.9;
      return { prop: 'clipboard', eyes: done ? 'happy' : 'sleepy', look: { x: 0, y: 1 }, headDy: !done && t % 1.1 < 0.25 ? 1 : 0 };
    } },
    water: { tags: ['koc', 'sakin'], pose: 'sit', T: 4, tick(a, t) {
      const drink = t > 0.35 && t < 3;
      if (drink && every(a, 'd', 0.45, t)) fxAt('drop', 48, 38, { dx: rnd(-6, 16), dy: 22, dur: 500 });
      if (once(a, 'ah', t > 3)) { txtAt('Ahh!', 80, 26, { dy: -26 }); need.thirst = Math.max(0, need.thirst - 0.4); }
      return { paws: 'hold', prop: 'bottle', eyes: drink ? 'closed' : 'happy', mouth: drink ? (Math.sin(t * 12) > 0 ? 'tongue' : 'closed') : 'open' };
    } },
    towel: { tags: ['koc'], pose: 'sit', T: 4.6, tick(a, t) {
      const wipe = t > 0.3 && t % 1.5 < 0.8;
      if (every(a, 'sw', 0.5, t)) fxAt('sweat', 44 + rnd(-18, 18), 18, { dx: rnd(-40, 40), dy: -24, dur: 700 });
      return { prop: 'towel', band: true, paws: wipe ? 'wipe' : 'down', eyes: wipe ? 'closed' : 'happy' };
    } },
    sunglasses: { tags: ['koc'], pose: 'sit', T: 4.6, tick(a, t) {
      const on = t > 0.6 && t < a.T - 0.4;
      if (once(a, 'g', t > 0.6)) sparkles(...at(44, 28), 4);
      if (on && t > 1 && every(a, 'gl', 1.3, t)) fxAt('sparkle', 37, 26, { dy: -6, dur: 500, scale: 2 });
      return { shades: on, paws: !on ? 'wipe' : t < 2.9 ? 'wave' : 'down', eyes: 'happy', mouth: on && t < 2.9 ? 'open' : undefined };
    } },
    tailchase: { tags: ['kardiyo', 'oyun'], pose: 'walk', T: 5.4, tick(a, t, dt) {
      if (t < 3.4) { // kendi etrafında döner: yatay ölçek cos(açı) ile
        const sp = sstep(0, 0.6, t);
        if (t < 2.8) a.th = (a.th || 0) + dt * TAU * (0.3 + sp * 1.9);
        else { a.tgt ??= Math.ceil(a.th / TAU) * TAU; a.th += (a.tgt - a.th) * Math.min(1, dt * 7); }
        cat.spinX = Math.cos(a.th);
        a.ph = (a.ph || 0) + dt * 18;
        if (sp > 0.5 && t < 2.8 && every(a, 'd', 0.15, t)) fxAt('dust', 44 + rnd(-30, 30), 85, { dx: rnd(-30, 30), dy: -10, dur: 420 });
        return { run: true, phase: a.ph, eyes: 'wide', mouth: 'open', tailFast: true };
      }
      if (cat.pose !== 'sit') { cat.pose = 'sit'; cat.spinX = 1; cat.sqv += 2.6; }
      cat.pivot = 4; cat.lean = Math.sin(t * 8) * 7 * (1 - sstep(3.4, a.T, t)); // başı döndü: sallanır
      if (every(a, 'st', 0.3, t)) { const g = t * 6; fxAt('sparkle', 44 + Math.cos(g) * 22, 10 + Math.sin(g) * 5, { dx: -Math.sin(g) * 18, dy: -4, dur: 500, scale: 2 }); }
      return { eyes: 'squint', mouth: 'open' };
    } },
    yarnball: { tags: ['oyun'], floor: true, pose: 'sit', T: 4.8, sayAt: 0.1, start(a) {
      a.d = cat.x < innerWidth / 2 ? 1 : -1; cat.dir = a.d;
      a.ball = prop('yarn'); a.x0 = cat.x; a.bx = cat.x + a.d * 70 * scale();
      putProp(a.ball, a.bx + a.d * 150 * scale(), floorY(), 0, 0);
    }, tick(a, t) {
      const s = scale(), d = a.d, y = floorY();
      if (t < 0.7) { const k = E.out(t / 0.7); putProp(a.ball, a.bx + d * (1 - k) * 150 * s, y, -d * (1 - k) * 600); return { eyes: 'wide', look: { x: d, y: 1 } }; }
      if (t < 2) { cat.pose = 'jump'; putProp(a.ball, a.bx, y); cat.ox = t > 1 ? Math.sin(t * 34) * 0.9 * s : 0; return { jumpPhase: 0, eyes: 'wide' }; }
      if (t < 2.45) { // hamle!
        cat.ox = 0; cat.pose = 'jump';
        const k = (t - 2) / 0.45;
        cat.x = lerp(a.x0, a.bx - d * 30 * s, E.inOut(k)); cat.dy = -Math.sin(k * Math.PI) * 24 * s;
        cat.lean = (k < 0.5 ? -10 : 8) * d;
        return { jumpPhase: 1, eyes: 'wide', mouth: 'open' };
      }
      if (once(a, 'hit', true)) { cat.dy = 0; cat.lean = 0; cat.sqv += 3; puff(); a.kick = t; }
      const k = Math.min(1, (t - a.kick) / 0.9);
      putProp(a.ball, a.bx + d * E.out(k) * 170 * s, y, d * k * 720, 1 - sstep(0.65, 1, k));
      if (t - a.kick < 0.25) return { jumpPhase: 2 };
      cat.pose = 'sit';
      if (once(a, 'h', true)) hearts(...at(44, 8), 2);
      return { eyes: 'happy', look: { x: d, y: 0 } };
    } },
    box: { tags: ['sakin', 'oyun'], pose: 'sit', T: 4.8, start() { for (const k of [-1, 1]) fxAt('dust', 44 + k * 30, 80, { dx: k * 24, dy: -12, dur: 450 }); cat.sqv += 2.5; }, tick(a, t) {
      if (once(a, 'h', t > 1.8)) hearts(...at(44, 8), 2);
      return { prop: 'box', eyes: t % 2.2 < 1.4 ? 'happy' : 'open', tailFast: true, earTwitch: t % 1.6 < 0.2 };
    } },
    knockcup: { tags: ['oyun'], pose: 'sit', T: 5.2, sayAt: -1, start(a) { a.cup = prop('cup'); a.rot = 0; a.rv = 0; }, tick(a, t, dt) {
      let tapK = 0;
      for (const [t0, amp] of [[0.8, 0.45], [1.6, 0.5], [2.4, 1]]) { const u = (t - t0) / 0.3; if (u > 0 && u < 1) tapK = Math.max(tapK, Math.sin(u * Math.PI) * amp); }
      if (t < 2.55) { // bardak patinin yanında; dokununca sallanır
        const [x, y] = at(79, FEET);
        let wob = 0; for (const t0 of [0.95, 1.75]) { const u = t - t0; if (u > 0 && u < 0.5) wob = Math.sin(u * 30) * 10 * (1 - u / 0.5); }
        a.cx = x; a.cy = y; putProp(a.cup, x, y, wob);
      } else { // pıt! düşer
        if (once(a, 'push', true)) { a.vx = 150 * scale() / 1.75; a.vy = -150; a.rv = 420; }
        a.vy += 1500 * dt; a.cx += a.vx * dt; a.cy += a.vy * dt; a.rot += a.rv * dt;
        if (a.cy >= floorY()) {
          a.cy = floorY();
          if (once(a, 'bonk', true)) { a.vy = -a.vy * 0.3; a.vx *= 0.5; a.rv *= 0.35; burst('dust', a.cx, a.cy - 6, { dy: -10, dur: 400 }); }
          else { a.vy = 0; a.vx *= 0.92; a.rv *= 0.9; }
        }
        putProp(a.cup, a.cx, a.cy, a.rot, 1 - sstep(4.2, 4.9, t));
      }
      if (once(a, 'said', t > 2.8)) say(fresh(L.knockcup), 3000);
      return { paws: tapK > 0.02 ? 'tap' : 'down', tapK, eyes: t > 2.7 ? 'happy' : 'open', look: t < 2.7 ? { x: 1, y: 1 } : { x: 0, y: 0 } };
    } },
    yawn: { tags: ['sakin'], pose: 'sit', T: 3.4, sayAt: 1.6, tick(a, t) {
      if (once(a, 's', t > 0.4)) cat.sqv -= 3.2;
      const [eyes, mouth] = t < 0.4 ? ['squint', 'open'] : t < 1.5 ? ['closed', 'meow'] : t < 1.9 ? ['happy', 'tongue'] : ['sleepy', undefined];
      return { eyes, mouth, earTwitch: t > 0.4 && t < 1.5 };
    } },
    fish: { tags: ['sakin'], pose: 'sit', T: 5, start() { sparkles(...at(44, 42), 4); }, tick(a, t) {
      if (t < 3) {
        if (t > 0.4 && every(a, 'c', 0.45, t)) fxAt('kibble', 44 + rnd(-6, 6), 48, { dx: rnd(-14, 14), dy: 24, dur: 500 });
        return { paws: 'chest', prop: 'fish', eyes: 'happy', mouth: Math.sin(t * 14) > 0 ? 'open' : 'closed' };
      }
      if (once(a, 'b', true)) { fxAt('bone', 44, 62, { dy: 16, dur: 1400 }); need.hunger = Math.max(0, need.hunger - 0.3); hearts(...at(44, 6), 2); cat.sqv += 1.5; }
      return { eyes: 'happy', mouth: Math.sin(t * 6) > 0.3 ? 'tongue' : 'closed' };
    } },
  };
  // hangi gün türünde hangi etkinlikler öne çıksın
  const DAY_TAGS = { kuvvet: ['guc', 'koc'], yuruyus: ['kardiyo', 'koc'], uzun: ['kardiyo', 'koc'], aralikli: ['kardiyo', 'koc'], dinlenme: ['sakin'] };
  const recentActs = [];
  function dayCtx() { // üstünde durduğu gün ya da açık gün penceresi
    const el = cat.surf?.el;
    if (el === sheet && app.currentDay) return app.dayInfo(app.currentDay.w, app.currentDay.d).tur;
    if (el?.dataset?.platform === 'day') return app.dayInfo(+el.dataset.w, +el.dataset.d).tur;
    return null;
  }
  function chooseAct() {
    const floor = !cat.surf && !sheet.open;
    let ids = Object.keys(ACTS).filter(id => floor || !ACTS[id].floor);
    const tur = dayCtx();
    if (tur && Math.random() < 0.8) { const tags = DAY_TAGS[tur] || [], f = ids.filter(id => ACTS[id].tags.some(t => tags.includes(t))); if (f.length) ids = f; }
    const fr = ids.filter(id => !recentActs.includes(id));
    return pick(fr.length ? fr : ids);
  }
  function startAct(id) {
    const def = ACTS[id]; if (!def) return false;
    stopAct(); hush();
    set('act', def.pose, {});
    const sayAt = def.sayAt ?? 0.15;
    const a = cat.act = { id, def, T: def.T, n: 0, props: [], sayAt: L[id] && sayAt >= 0 ? sayAt : null };
    cat.sqv -= 1.6; // poz değişirken küçük bir "pıt"
    def.start?.(a);
    recentActs.unshift(id); recentActs.length = Math.min(recentActs.length, 10);
    return true;
  }
  function stopAct() {
    const a = cat.act; if (!a) return;
    cat.act = null;
    for (const p of a.props) { const an = p.animate([{ opacity: p.style.opacity || 1 }, { opacity: 0 }], { duration: 220, fill: 'forwards' }); an.onfinish = () => p.remove(); }
    cat.dy = 0; cat.ox = 0; cat.spinX = 1; cat.lean = 0;
  }

  /* ---------- tıklama / tutma / sevme ---------- */
  function hit(px, py) {
    if (cat.alpha < 0.5 || cat.state === 'away') return false;
    const r = cv.getBoundingClientRect();
    if (px < r.left || px > r.right || py < r.top || py > r.bottom) return false;
    let bx = Math.floor((px - r.left) / r.width * Y.W), by = Math.floor((py - r.top) / r.height * Y.H);
    if (cat.flip) bx = Y.W - 1 - bx;
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
      const x = bx + dx, y = by + dy; if (x >= 0 && y >= 0 && x < Y.W && y < Y.H && grid.col[y * Y.W + x]) return true;
    }
    return false;
  }
  function hitFace(px, py) { if (!['face', 'zoom'].includes(cat.state)) return false; const r = faceCv.getBoundingClientRect(); return px > r.left && px < r.right && py > r.top + r.height * 0.1 && py < r.bottom; }
  let press = null, swallow = false, lp = 0;
  function down(e) {
    if (e.button > 0) return;
    const face = hitFace(e.clientX, e.clientY);
    if (!face && !hit(e.clientX, e.clientY)) return;
    e.preventDefault(); e.stopPropagation(); swallow = true;
    press = { x: e.clientX, y: e.clientY, face, moved: false };
    cat.lastInput = performance.now();
    if (!face && e.pointerType !== 'mouse') lp = setTimeout(() => { if (press && !press.moved) startPet(); }, 520);
  }
  function move(e) {
    pointer.x = e.clientX; pointer.y = e.clientY; cat.lastInput = performance.now();
    if (press && !press.face && !press.moved && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 7) {
      press.moved = true; clearTimeout(lp); if (cat.state === 'pet') endPet(); startHold();
    }
    if (!press && e.pointerType === 'mouse') hoverPet(e);
  }
  function up(e) {
    if (!press) return;
    clearTimeout(lp); e.preventDefault(); e.stopPropagation();
    if (cat.state === 'held') release();
    else if (cat.state === 'pet') endPet();
    else if (press.face) faceFlee();
    else if (!press.moved) clicked();
    press = null; setTimeout(() => { swallow = false; }, 350);
  }
  window.addEventListener('pointerdown', down, { capture: true });
  window.addEventListener('pointermove', move, { capture: true });
  window.addEventListener('pointerup', up, { capture: true });
  window.addEventListener('click', (e) => { if (swallow) { e.preventDefault(); e.stopPropagation(); swallow = false; } }, { capture: true });
  window.addEventListener('touchstart', (e) => { const t = e.touches[0]; if (t && (hit(t.clientX, t.clientY) || hitFace(t.clientX, t.clientY))) e.preventDefault(); }, { capture: true, passive: false });
  window.addEventListener('touchmove', (e) => { if (press) e.preventDefault(); }, { capture: true, passive: false });

  let hoverT = 0, hoverLast = 0;
  function hoverPet(e) {
    if (busy() && cat.state !== 'pet') { hoverT = 0; return; }
    if (hit(e.clientX, e.clientY)) {
      const now = performance.now(); hoverT += Math.min(120, now - hoverLast); hoverLast = now;
      if (hoverT > 900 && cat.state !== 'pet') startPet();
    } else { hoverT = 0; if (cat.state === 'pet') endPet(); }
  }
  function startPet() { if (cat.state === 'held') return; set('pet', 'sit', { eyes: 'happy' }); say(pick(S.sevildi), 2200); purr(true); }
  function endPet() { purr(false); hoverT = 0; hearts(cat.x, cat.y - 100 * scale() / 2, 2); sit(rnd(3, 6)); }

  function clicked() {
    if (cat.state === 'pet') return endPet();
    hush();
    const mode = Math.random();
    say(pick(S.kacis), 1500);
    burst('bang', cat.x + 24, cat.y - 140 * scale() / 2, { dy: -26, dur: 800, scale: 4 });
    cat.fleeMode = cat.surf || sheet.open ? (mode < 0.5 ? 'up' : 'down') : (mode < 0.65 ? 'run' : 'up');
    cat.dir = pointer.x < cat.x ? 1 : -1;
    set('startle', 'scared', {}); cat.sqv -= 3;
  }
  function startHold() {
    hush(); purr(false);
    set('held', 'dangle', { swing: 0, eyes: 'wide', mouth: 'meow' }); cat.surf = null;
    burst('bang', cat.x + 30, cat.y - 150, { dy: -20, dur: 700, scale: 3 });
    setTimeout(() => { if (cat.state === 'held') say(pick(S.tutuldu), 1800); }, 350);
  }
  function release() { set('fall', 'jump', { jumpPhase: 1, eyes: 'wide' }); cat.vy = -80; cat.vx = clamp(cat.vx, -900, 900) * 0.35; }
  function faceFlee() { burst('bang', innerWidth / 2 + 60, innerHeight - 260, { dy: -24, scale: 4 }); say(pick(S.kacis), 1200, 'face'); set('faceflee'); }

  /* ---------- yaklaşma (yakın plan) ---------- */
  function startPeek() { cat.peekCd = 70; walkTo(innerWidth / 2, () => set('zoom', 'sit', {})); }

  /* ---------- olaylar ---------- */
  window.addEventListener('yumak', (e) => {
    const d = e.detail;
    if (d.type === 'day-open') {
      app.currentDay = { w: d.w, d: d.d };
      sheet.append(layer, bubble); fxRoot(sheet);
      for (const p of cat.act?.props || []) sheet.append(p);
      if (!reduce && ['sit', 'walk', 'groom', 'pet', 'act'].includes(cat.state)) setTimeout(() => {
        const r = sheet.getBoundingClientRect(); if (r.top > 40) jumpTo({ el: sheet }, clamp(r.right - 90, r.left + 40, r.right - 40));
      }, 420);
    }
    if (d.type === 'day-close') {
      app.currentDay = null; document.body.append(layer, bubble); fxRoot(null);
      for (const p of cat.act?.props || []) document.body.append(p);
      if (cat.surf?.el === sheet || cat.jump?.surf?.el === sheet) { cat.surf = null; set('fall', 'jump', { jumpPhase: 1 }); cat.vy = 0; cat.vx = 0; }
    }
    if (d.type === 'day-done') { set('celebrate', 'sit', { eyes: 'happy', mouth: 'open' }); say(pick(S.tamam), 3600); }
    if (d.type === 'set-done' && Math.random() < 0.3 && !busy()) say(pick(['Bir set daha bitti!', 'Harika gidiyorsun.', 'Sayıyorum: tamam!']), 1600);
    if (d.type === 'sound') { soundOn = d.on; if (d.on) ac(); else purr(false); }
  });

  /* ---------- ana döngü ---------- */
  let last = performance.now(), acc = 0, dustT = 0, zT = 0;
  function think(dt) {
    const s = cat.state, sc = scale();
    cat.sqT = SQ[s] ?? 0; cat.pivot = s === 'held' ? 62 : 30; cat.tiltT = cat.lean;
    // üzerinde durduğu kart kaydıysa onunla birlikte hareket et
    if (cat.surf && FOLLOW.includes(s)) {
      if (!surfValid(cat.surf)) { cat.surf = null; set('fall', 'jump', { jumpPhase: 1 }); cat.vy = 0; cat.vx = 0; return; }
      cat.y = surfY(cat.surf);
      const r = cat.surf.el.getBoundingClientRect(); cat.x = clamp(r.left + cat.off, r.left + 6, r.right - 6);
    } else if (!cat.surf && GROUNDED.includes(s)) {
      cat.y = floorY();
    }
    switch (s) {
      case 'sit':
        idle();
        if (cat.st > cat.next) pickNext();
        break;
      case 'groom': if (cat.st > 2.4) sit(); break;
      case 'stretch': if (cat.st > 1.6) sit(); break;
      case 'celebrate': {
        cat.dy = -Math.abs(Math.sin(cat.st * 7)) * 22;
        const hop = Math.floor(cat.st * 7 / Math.PI); if (hop !== cat.hop) { cat.hop = hop; if (hop > 0) cat.sqv += 2.2; }
        if (cat.st % 0.5 < dt) sparkles(cat.x, cat.y - 80, 3);
        if (cat.st > 1.5) { cat.dy = 0; hearts(cat.x, cat.y - 110, 3); sit(); }
        break; }
      case 'walk': {
        // yumuşak kalkış ve duruş
        const dist = Math.abs(cat.target - cat.x), ease = Math.min(1, 0.25 + cat.st / 0.35) * clamp(dist / (22 * sc) + 0.25, 0.35, 1);
        cat.ps.phase = (cat.ps.phase || 0) + dt * (cat.fast ? 17 : 9) * ease;
        cat.x += (cat.fast ? 190 : 70) * sc * ease * dt * cat.dir;
        if ((cat.dir > 0 && cat.x >= cat.target) || (cat.dir < 0 && cat.x <= cat.target)) {
          cat.x = cat.target; if (cat.surf) cat.off = cat.x - cat.surf.el.getBoundingClientRect().left;
          const f = cat.after; cat.after = null; sit(); if (f) f();
        } else if (cat.surf) cat.off = cat.x - cat.surf.el.getBoundingClientRect().left;
        break; }
      case 'crouch': if (cat.st > 0.18) { set('air', 'jump', { jumpPhase: 1 }); cat.sqv -= 2.4; } break;
      case 'air': {
        const j = cat.jump, k = Math.min(1, cat.st / j.T), y1 = surfY(j.surf);
        cat.x = j.x0 + (j.x1 - j.x0) * k;
        cat.y = j.y0 + (y1 - j.y0) * k - j.h * 4 * k * (1 - k);
        // yükselirken burun yukarı, inerken aşağı
        const vy = ((y1 - j.y0) - j.h * 4 * (1 - 2 * k)) / j.T, vx = Math.abs(j.x1 - j.x0) / j.T;
        cat.tiltT = clamp(Math.atan2(vy, Math.max(vx, 260 * sc)) * 57.3 * 0.55, -16, 16) * cat.dir;
        if (k >= 1) {
          if (j.surf && !surfValid(j.surf)) { cat.surf = null; set('fall', 'jump', { jumpPhase: 1 }); cat.vy = 0; cat.vx = 0; break; }
          cat.surf = j.surf; if (cat.surf) cat.off = cat.x - cat.surf.el.getBoundingClientRect().left;
          set('land', 'jump', { jumpPhase: 2 }); cat.sqv += 3; puff();
        }
        break; }
      case 'land': if (cat.st > 0.16) arrive(); break;
      case 'held': {
        const tx = pointer.x, ty = pointer.y + 62 * sc;
        const vx = (tx - cat.x) / Math.max(dt, 0.001);
        cat.vx = cat.vx * 0.7 + vx * 0.3; cat.x = tx; cat.y = ty;
        cat.swing += (clamp(-cat.vx / 700, -1, 1) - cat.swing) * Math.min(1, dt * 7);
        cat.tiltT = -cat.swing * 7; // enseden sarkarken sarkaç gibi
        cat.ps = { swing: cat.swing, eyes: cat.st < 0.7 ? 'wide' : 'sleepy', mouth: cat.st < 0.7 ? 'meow' : 'closed' };
        cat.forceDraw = true;
        break; }
      case 'fall': {
        const prev = cat.y; cat.vy += 2600 * dt; cat.y += cat.vy * dt; cat.x = clamp(cat.x + cat.vx * dt, 40, innerWidth - 40); cat.vx *= 1 - dt * 1.5;
        cat.tiltT = clamp(Math.atan2(cat.vy, 420) * 57.3 * 0.35, -14, 14) * cat.dir;
        let landed = null;
        if (cat.vy > 0) for (const p of platforms()) { const top = p.r.top + 2; if (prev <= top && cat.y >= top && cat.x > p.r.left + 10 && cat.x < p.r.right - 10) { landed = { el: p.el }; cat.y = top; break; } }
        if (!landed && cat.y >= floorY()) { cat.y = floorY(); landed = 'floor'; }
        if (landed) {
          cat.surf = landed === 'floor' ? null : landed; if (cat.surf) cat.off = cat.x - cat.surf.el.getBoundingClientRect().left;
          set('landed', 'jump', { jumpPhase: 2 }); cat.sqv += 3.4; puff();
        }
        break; }
      case 'landed':
        if (cat.st > 0.2 && !cat.saidLand) { cat.saidLand = true; say(pick(S.birakildi), 1800); burst('anger', cat.x + 30, cat.y - 140 * sc / 2, { dy: -10, dur: 900, scale: 4, fade: true }); }
        if (cat.st > 0.9) { cat.saidLand = false; set('groom', 'sit', { groom: true }); }
        break;
      case 'startle':
        cat.dy = -Math.sin(Math.min(1, cat.st / 0.38) * Math.PI) * 34 * sc / 2;
        if (cat.st > 0.6) {
          cat.dy = 0;
          if (cat.fleeMode === 'run') set('run', 'walk', { run: true, phase: 0 });
          else if (cat.fleeMode === 'up') {
            const ps = platforms().filter(p => !cat.surf || p.el !== cat.surf.el).sort((a, b) => Math.abs(b.r.left - pointer.x) - Math.abs(a.r.left - pointer.x));
            if (ps.length) { const p = ps[0]; jumpTo({ el: p.el }, clamp(p.r.left + p.r.width / 2, p.r.left + 16, p.r.right - 16), () => say('Buradan yakalayamazsın!', 1800)); }
            else set('run', 'walk', { run: true, phase: 0 });
          } else jumpTo(null, clamp(cat.x + cat.dir * 160, 60, innerWidth - 60), () => set('run', 'walk', { run: true, phase: 0 }));
        }
        break;
      case 'run': {
        cat.ps.phase = (cat.ps.phase || 0) + dt * 19; cat.surf = null;
        cat.x += 300 * sc * dt * cat.dir;
        dustT += dt; if (dustT > 0.09) { dustT = 0; burst('dust', cat.x - cat.dir * 50 * sc / 2, cat.y - 8, { dx: -cat.dir * 20, dy: -8, dur: 420, scale: 3 }); }
        if (cat.x < -80 * sc || cat.x > innerWidth + 80 * sc) { set('away'); cat.next = rnd(2.2, 4.5); }
        break; }
      case 'away':
        cat.alpha = 0;
        if (cat.st > cat.next && !press) { cat.alpha = 1; cat.dir = cat.x < 0 ? 1 : -1; cat.x = cat.dir > 0 ? -50 * sc : innerWidth + 50 * sc; cat.y = floorY(); cat.surf = null; walkTo(rnd(90, innerWidth - 90), () => { if (Math.random() < 0.5) hearts(cat.x, cat.y - 110, 2); say(pick(['Ben geldim!', 'Özledin mi?', 'Neyse, barıştık.', 'Kaçış antrenmanı tamamlandı.']), 2000); }); }
        break;
      case 'zoom': {
        const k = Math.min(1, cat.st / 0.95);
        cat.scale = 1 + 1.7 * E.inOut(k); cat.alpha = k < 0.72 ? 1 : 1 - (k - 0.72) / 0.28;
        cat.faceY = 110 - 104 * E.outBack(clamp((cat.st - 0.55) / 0.75, 0, 1));
        if (cat.st > 1.3) { set('face'); say(pick(S.yaklas), 2600, 'face'); }
        break; }
      case 'face':
        cat.faceY = 6 + Math.sin(cat.t * 2) * 1.2;
        if (cat.st > 5.4) set('unzoom');
        break;
      case 'faceflee': case 'unzoom': {
        const dur = s === 'faceflee' ? 0.28 : 0.55, k = Math.min(1, cat.st / dur);
        cat.faceY = 6 + 110 * E.in(k);
        if (s === 'unzoom') { cat.scale = 1; cat.alpha = k; }
        if (k >= 1) { if (s === 'faceflee') { cat.scale = 1; cat.x = innerWidth / 2; set('away'); cat.next = rnd(2, 3.5); } else sit(); }
        break; }
      case 'eat': case 'drink': {
        cat.ps = { drink: s === 'drink' };
        const k = s === 'eat' ? 'food' : 'water';
        need[k] = Math.max(0, need[k] - dt * 0.05);
        if (s === 'eat') need.hunger = Math.max(0, need.hunger - dt * 0.3); else need.thirst = Math.max(0, need.thirst - dt * 0.3);
        if (cat.st > 4.2) { refreshItems(); hearts(cat.x + 20, cat.y - 90, 3); say(s === 'eat' ? pick(S.mama) : 'Ohh, su gibisi yok.', 2400); sit(); }
        break; }
      case 'beg':
        if (cat.st > 7) { burst('bang', cat.x + 30, cat.y - 130, { dy: -20, dur: 900 }); say(pick(cat.bowl === 'food' ? S.ac : S.susuz), 3400); cat.st = 0; }
        if ((cat.bowl === 'food' ? need.food : need.water) > 0.1) set(cat.bowl === 'food' ? 'eat' : 'drink', 'eat', { drink: cat.bowl === 'water' });
        break;
      case 'squat':
        if (cat.st > 2.8) set('dig', 'squat', { dig: true });
        break;
      case 'dig':
        zT += dt; if (zT > 0.12) { zT = 0; burst('sand', cat.x + 40, cat.y - 10, { dx: rnd(10, 40), dy: -rnd(10, 30), dur: 500, scale: 3 }); }
        if (cat.st > 1.6) { need.potty = 0; need.litter = 1; refreshItems(); say('Zoomies!!', 1400); burst('bang', cat.x, cat.y - 130, { scale: 4 }); set('zoomies', 'walk', { run: true, phase: 0 }); cat.dir = -1; cat.zc = 0; }
        break;
      case 'zoomies': {
        cat.ps.phase = (cat.ps.phase || 0) + dt * 20;
        cat.x += 360 * sc * dt * cat.dir;
        dustT += dt; if (dustT > 0.08) { dustT = 0; burst('dust', cat.x - cat.dir * 50 * sc / 2, cat.y - 8, { dx: -cat.dir * 20, dy: -8, dur: 420 }); }
        if (cat.x < 70 || cat.x > innerWidth - 70) { cat.dir *= -1; cat.x = clamp(cat.x, 70, innerWidth - 70); cat.zc = (cat.zc || 0) + 1; cat.sqv += 2.4; }
        if (cat.zc >= 3) { hearts(cat.x, cat.y - 100, 2); sit(); }
        break; }
      case 'sleep':
        zT += dt; if (zT > 1.3) { zT = 0; burst('z', cat.x + 36, cat.y - 60, { dx: 22, dy: -50, dur: 2000, scale: 3 }); }
        if (cat.st > 38) set('stretch', 'stretch', {});
        break;
      case 'pet':
        if (cat.st % 0.7 < dt) hearts(cat.x + rnd(-20, 20), cat.y - 120 * sc / 2, 1);
        if (cat.st > 6) endPet();
        break;
      case 'act': {
        const a = cat.act; if (!a) { sit(); break; }
        if (a.sayAt != null && cat.st >= a.sayAt) { a.sayAt = null; say(fresh(L[a.id]), 3400); }
        const ps = a.def.tick(a, cat.st, dt) || {};
        if (ps.mouth === undefined) ps.mouth = cat.talking && Math.sin(cat.t * 20) > 0 ? 'open' : 'closed';
        cat.ps = ps;
        if (cat.st >= a.T) { stopAct(); cat.sqv += 1.8; sit(rnd(3, 6)); }
        break; }
    }
  }

  function draw() {
    const [hx, hy] = [cat.x, cat.y - 60 * scale()];
    const look = { x: Math.abs(pointer.x - hx) < 60 ? 0 : (pointer.x < hx ? -1 : 1), y: pointer.y > hy + 60 ? 1 : 0 };
    const st = { t: cat.t, blink: cat.blink, look, earTwitch: cat.earT > 0, ...cat.ps };
    const fn = Y.POSES[cat.pose] || Y.sit;
    if (cat.pose === 'sit' && cat.state === 'pet') st.eyes = 'happy';
    fn(grid, st);
    paint(cv, grid);
    if (['zoom', 'face', 'faceflee', 'unzoom'].includes(cat.state)) {
      const r = faceCv.getBoundingClientRect(), fx = r.left + r.width / 2, fy = r.top + r.height * 0.55;
      const flook = { x: Math.abs(pointer.x - fx) < 120 ? 0 : (pointer.x < fx ? -1 : 1), y: pointer.y < fy - 160 ? -1 : (pointer.y > fy + 60 ? 1 : 0) };
      const bt = cat.state === 'face' ? cat.st - 1.4 : -1;
      const boop = bt > 0 && bt < 1.8 ? (bt < 0.25 ? bt / 0.25 : bt > 1.5 ? (1.8 - bt) / 0.3 : 1) : 0;
      Y.face(fgrid, { t: cat.t, blink: cat.blink, look: flook, eyes: cat.state === 'face' && cat.st > 3.6 ? 'happy' : undefined, mouth: cat.talking && Math.sin(cat.t * 20) > 0 ? 'open' : 'closed', boop });
      paint(faceCv, fgrid);
    }
  }
  function place() {
    const sc = scale(), w = Y.W * sc;
    cat.flip = FLIP.has(cat.pose) && cat.dir < 0;
    // ayak hizası merkezli: basılma/esneme ve eğim (eğim gövdenin ortasından)
    const sx = (1 + cat.sq) * (cat.flip ? -1 : 1) * cat.spinX, sy = 1 - cat.sq, pv = cat.pivot * sc;
    cv.style.transform = `translate(${cat.x + cat.ox - w / 2}px, ${cat.y - FEET * sc + cat.dy}px) scale(${cat.scale}) translateY(${-pv}px) rotate(${cat.tilt.toFixed(2)}deg) translateY(${pv}px) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;
    cv.style.opacity = cat.alpha;
    faceCv.style.transform = `translate(-50%, ${cat.faceY}%)`;
  }
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    cat.t += dt; cat.st += dt; cat.peekCd -= dt;
    cat.blinkT -= dt; if (cat.blinkT < 0) { cat.blink = !cat.blink; cat.blinkT = cat.blink ? 0.14 : rnd(2, 5.5); cat.forceDraw = true; }
    cat.earT -= dt; if (cat.earT < -rnd(3, 8)) { cat.earT = 0.2; }
    need.hunger = Math.min(1, need.hunger + dt / 420); need.thirst = Math.min(1, need.thirst + dt / 360); need.potty = Math.min(1, need.potty + dt / 720);
    think(dt);
    // yay: jöle gibi esneyip toparlanır; eğim yumuşakça hedefe gider
    cat.sqv += (-(cat.sq - cat.sqT) * 240 - cat.sqv * 15) * dt;
    cat.sq = clamp(cat.sq + cat.sqv * dt, -0.22, 0.24);
    cat.tilt += (cat.tiltT - cat.tilt) * Math.min(1, dt * 12);
    acc += dt; if (acc > 1 / 20 || cat.forceDraw) { acc = 0; cat.forceDraw = false; draw(); }
    place(); placeBubble();
    requestAnimationFrame(loop);
  }
  setInterval(() => app.save(), 8000);
  addEventListener('resize', () => { cat.x = clamp(cat.x, 40, innerWidth - 40); if (!cat.surf) cat.y = floorY(); });

  refreshItems();
  requestAnimationFrame(loop);
  setTimeout(() => say(fresh(Math.random() < 0.5 ? S.selam : S[timeKey()]), 4200), 900);
  // geliştirme için: ?debug ile davranışları elle tetikle
  if (location.search.includes('debug')) window.__yumak = { cat, need, set, sit, jumpTo, walkTo, platforms, startPeek, goBowl, goLitter, goBed, clicked, say, startHold, release, pointer, startAct, stopAct, acts: Object.keys(ACTS), chatter };
}
