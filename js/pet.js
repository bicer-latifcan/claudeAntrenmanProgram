// Yumak'ın beyni: dolaşır, zıplar, konuşur, kaçar, enseden tutulur, yer, içer, uyur.
import { Grid, paint } from './pixel.js';
import * as Y from './yumak-art.js';
import { burst, hearts, sparkles } from './fx.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const E = {
  inOut: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  outBack: t => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  in: t => t * t * t,
};
const FEET = 84; // ızgarada ayakların hizası

export function initPet(app) {
  const layer = document.getElementById('petLayer');
  const cv = document.getElementById('yumak');
  const faceCv = document.getElementById('yumakFace');
  const bubble = document.getElementById('bubble');
  const sheet = document.getElementById('daySheet');
  const grid = new Grid(Y.W, Y.H), fgrid = new Grid(Y.FACE_W, Y.FACE_H);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const S = app.sozler;
  const need = app.state.pet || (app.state.pet = { food: 0.7, water: 0.8, litter: 0, hunger: 0.2, thirst: 0.15, potty: 0.05 });

  const pointer = { x: -999, y: -999 };
  const cat = {
    x: innerWidth * 0.22, y: 0, dir: 1, dy: 0, scale: 1, alpha: 1,
    surf: null, off: 0, state: 'sit', st: 0, next: 4, t: 0,
    pose: 'sit', ps: {}, blink: false, blinkT: 2, earT: 0,
    jump: null, vx: 0, vy: 0, swing: 0, target: 0, after: null,
    talking: false, lastInput: performance.now(), peekCd: 25, faceY: 110, flip: false,
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
    return [cat.x, cat.y + cat.dy - (cat.pose === 'sleep' ? 36 : 70) * s];
  }
  function placeBubble() {
    if (!bubble.classList.contains('on')) return;
    const [ax, ay] = headPt(), bw = bubble.offsetWidth, bh = bubble.offsetHeight;
    let left = clamp(ax - 46, 10, innerWidth - bw - 10);
    let top = ay - bh - 16, side = false;
    if (top < 8) { // üstte yer yoksa yanına
      side = true; top = clamp(ay + 10, 8, innerHeight - bh - 8);
      left = ax - bw - 70 > 10 ? ax - bw - 70 : Math.min(innerWidth - bw - 10, ax + 70);
    }
    bubble.style.left = left + 'px'; bubble.style.top = top + 'px';
    bubble.classList.toggle('side', side); bubble.classList.remove('below');
    bubble.style.setProperty('--tail', clamp(ax - left - 6, 14, bw - 26) + 'px');
  }

  /* ---------- durum makinesi ---------- */
  function set(s, pose, ps = {}) { cat.state = s; cat.st = 0; if (pose) { cat.pose = pose; cat.ps = ps; } cat.forceDraw = true; }
  function sit(next = rnd(3, 7)) { set('sit', 'sit', {}); cat.next = next; cat.dy = 0; }
  const busy = () => !['sit', 'walk'].includes(cat.state);

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
    } else if (Math.random() < 0.6) say(pick(S.tavsiye), 5200);
  }

  function pickNext() {
    const idle = (performance.now() - cat.lastInput) / 1000;
    if (reduce) { if (Math.random() < 0.4) say(pick(S.tavsiye), 5200); sit(rnd(8, 14)); return; }
    // ihtiyaçlar
    if (!sheet.open && !cat.surf) {
      if (need.potty > 0.9) return goLitter();
      if (need.hunger > 0.78) return goBowl('food');
      if (need.thirst > 0.78) return goBowl('water');
    } else if (need.hunger > 0.9 || need.potty > 0.95) { return jumpTo(null, clamp(cat.x, 60, innerWidth - 60)); }
    const r = Math.random();
    if (idle > 50 && r < 0.35 && !sheet.open) return goBed();
    if (r < 0.26) { const [a, b] = surfRange(cat.surf); return walkTo(rnd(a, b)); }
    if (r < 0.5) {
      const ps = platforms().filter(p => !cat.surf || p.el !== cat.surf.el);
      if (ps.length) {
        const today = ps.find(p => p.el.classList?.contains('is-today'));
        const p = (today && Math.random() < 0.45) ? today : pick(ps);
        const x = clamp(p.r.left + p.r.width / 2 + rnd(-20, 20), p.r.left + 16, p.r.right - 16);
        if (Math.abs(surfY({ el: p.el }) - cat.y) < 560) return jumpTo({ el: p.el }, x);
      }
      if (cat.surf) return jumpTo(null, clamp(cat.x + rnd(-120, 120), 60, innerWidth - 60));
    }
    if (r < 0.64) { say(pick(S.tavsiye), 5200); return sit(rnd(6, 9)); }
    if (r < 0.74) { set('groom', 'sit', { groom: true }); return; }
    if (r < 0.8) { set('stretch', 'stretch', {}); return; }
    if (r < 0.9 && !cat.surf && !sheet.open && cat.peekCd <= 0) return startPeek();
    sit();
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
    set('startle', 'scared', {});
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
      sheet.append(layer, bubble);
      if (!reduce && ['sit', 'walk', 'groom', 'pet'].includes(cat.state)) setTimeout(() => {
        const r = sheet.getBoundingClientRect(); if (r.top > 40) jumpTo({ el: sheet }, clamp(r.right - 90, r.left + 40, r.right - 40));
      }, 420);
    }
    if (d.type === 'day-close') {
      app.currentDay = null; document.body.append(layer, bubble);
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
    // üzerinde durduğu kart kaydıysa onunla birlikte hareket et
    if (cat.surf && ['sit', 'walk', 'groom', 'pet', 'stretch', 'beg', 'celebrate'].includes(s)) {
      if (!surfValid(cat.surf)) { cat.surf = null; set('fall', 'jump', { jumpPhase: 1 }); cat.vy = 0; cat.vx = 0; return; }
      cat.y = surfY(cat.surf);
      const r = cat.surf.el.getBoundingClientRect(); cat.x = clamp(r.left + cat.off, r.left + 6, r.right - 6);
    } else if (!cat.surf && ['sit', 'walk', 'groom', 'pet', 'stretch', 'beg', 'celebrate', 'eat', 'drink', 'squat', 'dig', 'sleep'].includes(s)) {
      cat.y = floorY();
    }
    switch (s) {
      case 'sit':
        cat.ps = { ...cat.ps, mouth: cat.talking && Math.sin(cat.t * 20) > 0 ? 'open' : 'closed' };
        if (cat.st > cat.next) pickNext();
        break;
      case 'groom': if (cat.st > 2.4) sit(); break;
      case 'stretch': if (cat.st > 1.6) sit(); break;
      case 'celebrate':
        cat.dy = -Math.abs(Math.sin(cat.st * 7)) * 22;
        if (cat.st % 0.5 < dt) sparkles(cat.x, cat.y - 80, 3);
        if (cat.st > 1.5) { cat.dy = 0; hearts(cat.x, cat.y - 110, 3); sit(); }
        break;
      case 'walk': {
        cat.ps.phase = (cat.ps.phase || 0) + dt * (cat.fast ? 17 : 9);
        cat.x += (cat.fast ? 190 : 70) * sc * dt * cat.dir;
        if ((cat.dir > 0 && cat.x >= cat.target) || (cat.dir < 0 && cat.x <= cat.target)) {
          cat.x = cat.target; if (cat.surf) cat.off = cat.x - cat.surf.el.getBoundingClientRect().left;
          const f = cat.after; cat.after = null; sit(); if (f) f();
        } else if (cat.surf) cat.off = cat.x - cat.surf.el.getBoundingClientRect().left;
        break; }
      case 'crouch': if (cat.st > 0.18) set('air', 'jump', { jumpPhase: 1 }); break;
      case 'air': {
        const j = cat.jump, k = Math.min(1, cat.st / j.T), y1 = surfY(j.surf);
        cat.x = j.x0 + (j.x1 - j.x0) * k;
        cat.y = j.y0 + (y1 - j.y0) * k - j.h * 4 * k * (1 - k);
        if (k >= 1) {
          if (j.surf && !surfValid(j.surf)) { cat.surf = null; set('fall', 'jump', { jumpPhase: 1 }); cat.vy = 0; cat.vx = 0; break; }
          cat.surf = j.surf; if (cat.surf) cat.off = cat.x - cat.surf.el.getBoundingClientRect().left;
          set('land', 'jump', { jumpPhase: 2 });
        }
        break; }
      case 'land': if (cat.st > 0.16) arrive(); break;
      case 'held': {
        const tx = pointer.x, ty = pointer.y + 62 * sc;
        const vx = (tx - cat.x) / Math.max(dt, 0.001);
        cat.vx = cat.vx * 0.7 + vx * 0.3; cat.x = tx; cat.y = ty;
        cat.swing += (clamp(-cat.vx / 700, -1, 1) - cat.swing) * Math.min(1, dt * 7);
        cat.ps = { swing: cat.swing, eyes: cat.st < 0.7 ? 'wide' : 'sleepy', mouth: cat.st < 0.7 ? 'meow' : 'closed' };
        cat.forceDraw = true;
        break; }
      case 'fall': {
        const prev = cat.y; cat.vy += 2600 * dt; cat.y += cat.vy * dt; cat.x = clamp(cat.x + cat.vx * dt, 40, innerWidth - 40); cat.vx *= 1 - dt * 1.5;
        let landed = null;
        if (cat.vy > 0) for (const p of platforms()) { const top = p.r.top + 2; if (prev <= top && cat.y >= top && cat.x > p.r.left + 10 && cat.x < p.r.right - 10) { landed = { el: p.el }; cat.y = top; break; } }
        if (!landed && cat.y >= floorY()) { cat.y = floorY(); landed = 'floor'; }
        if (landed) {
          cat.surf = landed === 'floor' ? null : landed; if (cat.surf) cat.off = cat.x - cat.surf.el.getBoundingClientRect().left;
          set('landed', 'jump', { jumpPhase: 2 });
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
        if (cat.st > cat.next && !press) { cat.alpha = 1; cat.dir = cat.x < 0 ? 1 : -1; cat.x = cat.dir > 0 ? -50 * sc : innerWidth + 50 * sc; cat.y = floorY(); cat.surf = null; walkTo(rnd(90, innerWidth - 90), () => { if (Math.random() < 0.5) hearts(cat.x, cat.y - 110, 2); say(pick(['Ben geldim!', 'Özledin mi?', 'Neyse, barıştık.']), 2000); }); }
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
        if (cat.x < 70 || cat.x > innerWidth - 70) { cat.dir *= -1; cat.x = clamp(cat.x, 70, innerWidth - 70); cat.zc = (cat.zc || 0) + 1; }
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
    }
  }

  function draw() {
    const [hx, hy] = [cat.x, cat.y - 60 * scale()];
    const look = { x: Math.abs(pointer.x - hx) < 60 ? 0 : (pointer.x < hx ? -1 : 1), y: pointer.y > hy + 60 ? 1 : 0 };
    const st = { t: cat.t, blink: cat.blink, look, earTwitch: cat.earT > 0, ...cat.ps };
    const fn = { sit: Y.sit, walk: Y.walk, jump: Y.jump, scared: Y.scared, dangle: Y.dangle, sleep: Y.sleep, eat: Y.eat, squat: Y.squat, stretch: Y.stretch }[cat.pose] || Y.sit;
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
    cat.flip = ['walk', 'jump'].includes(cat.pose) && cat.dir < 0 || (['eat', 'squat', 'stretch', 'scared'].includes(cat.pose) && cat.dir < 0);
    cv.style.transform = `translate(${cat.x - w / 2}px, ${cat.y - FEET * sc + cat.dy}px) scale(${cat.scale}) scaleX(${cat.flip ? -1 : 1})`;
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
    acc += dt; if (acc > 1 / 14 || cat.forceDraw) { acc = 0; cat.forceDraw = false; draw(); }
    place(); placeBubble();
    requestAnimationFrame(loop);
  }
  setInterval(() => app.save(), 8000);
  addEventListener('resize', () => { cat.x = clamp(cat.x, 40, innerWidth - 40); if (!cat.surf) cat.y = floorY(); });

  refreshItems();
  requestAnimationFrame(loop);
  setTimeout(() => say(pick(S.selam), 4200), 900);
  // geliştirme için: ?debug ile davranışları elle tetikle
  if (location.search.includes('debug')) window.__yumak = { cat, need, set, sit, jumpTo, walkTo, platforms, startPeek, goBowl, goLitter, goBed, clicked, say, startHold, release, pointer };
}
