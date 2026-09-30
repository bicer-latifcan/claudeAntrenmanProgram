// Uygulama: takvim, gün ayrıntısı, ilerleme, gökyüzü. Yumak'ı başlatır.
import { AYARLAR, HAREKETLER, ANTRENMANLAR, ISINMA, TAKVIM, NEDEN, KAYNAKLAR, YUMAK_SOZLER } from './program.js';
import { icon, drawHomeItems, hearts, sparkles } from './fx.js';
import { hash, vnoise } from './pixel.js';
import { initPet } from './pet.js';
import { mountAnim } from './tarcin.js';

/* ---------- kayıt ---------- */
const KEY = 'yumak-8-hafta-v1';
const state = load();
function load() {
  const base = { start: AYARLAR.varsayilanBaslangic, done: {}, sets: {}, kg: {}, walk: {}, sound: false };
  try { return { ...base, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return base; }
}
export function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* gizli pencere vb. */ } }
export { state };

/* ---------- tarihler ---------- */
const GUN = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const GUN_K = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const AY = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const AY_K = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const parseDate = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const dayDate = (w, d) => { const t = parseDate(state.start); t.setDate(t.getDate() + w * 7 + d); return t; };
const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
function todayIndex() {
  const s = parseDate(state.start), now = new Date(); now.setHours(0, 0, 0, 0);
  const diff = Math.round((now - s) / 864e5);
  if (diff < 0 || diff >= AYARLAR.haftaSayisi * 7) return null;
  return { w: Math.floor(diff / 7), d: diff % 7 };
}
const key = (w, d) => `h${w + 1}g${d + 1}`;

/* ---------- gün tanımları ---------- */
export function dayInfo(w, d) {
  const g = TAKVIM[w][d];
  switch (g.tur) {
    case 'kuvvet': { const a = ANTRENMANLAR[g.a]; const B = g.a.startsWith('B'); return { ...g, cls: B ? 't-B' : 't-A', icon: 'dumbbell', kisa: `${B ? 'B' : 'A'}${g.a.endsWith('2') ? '+' : ''} · ${a.dk} dk`, baslik: `${a.ad} + ${g.yemek} dk yürüyüş`, aerobik: g.yemek }; }
    case 'yuruyus': return { ...g, cls: 't-yuruyus', icon: 'shoe', kisa: `${g.dk} dk`, baslik: `${g.dk} dk tempolu yürüyüş`, aerobik: g.dk };
    case 'uzun': return { ...g, cls: 't-uzun', icon: 'shoe', kisa: `${g.dk} dk`, baslik: `${g.dk} dk uzun yürüyüş`, aerobik: g.dk };
    case 'aralikli': return { ...g, cls: 't-aralikli', icon: 'bolt', kisa: `${g.dk} dk`, baslik: `${g.dk} dk yürüyüş, içinde ${g.tur_} tur aralıklı tempo`, aerobik: g.dk };
    default: return { ...g, cls: 't-dinlenme', icon: 'cushion', kisa: 'Dinlen', baslik: 'Dinlenme günü', aerobik: 0 };
  }
}
export function describeDay(w, d) { // Yumak'ın takvimde söyledikleri
  const i = dayInfo(w, d), dt = dayDate(w, d), t = todayIndex();
  const when = t && t.w === w && t.d === d ? 'Bugün' : `${GUN[d]} (${dt.getDate()} ${AY[dt.getMonth()]})`;
  if (state.done[key(w, d)]) return `${when}: <b>${i.baslik}</b>. Bunu bitirdin, pati damgasını ben vurdum!`;
  switch (i.tur) {
    case 'kuvvet': return `${when}: <b>${i.baslik}</b>. Tarçın hareketleri gösterecek, ben de set sayacağım.`;
    case 'dinlenme': return `${when}: <b>dinlenme</b>! En sevdiğim gün. Birlikte kestirelim mi?`;
    case 'aralikli': return `${when}: <b>${i.baslik}</b>. 30 sn hızlı, 90 sn yavaş. Ben izlerim.`;
    default: return `${when}: <b>${i.baslik}</b>. Konuşabilecek ama şarkı söyleyemeyecek hızda!`;
  }
}

/* ---------- ay çizimi (evre k: 0 yeni ay → 1 dolunay) ---------- */
export function drawMoon(canvas, k, size = 16, waxing = true) {
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d'), img = ctx.createImageData(size, size), r = size / 2 - 1.2, c = size / 2;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const dx = (x + 0.5 - c) / r, dy = (y + 0.5 - c) / r, dd = dx * dx + dy * dy;
    let col = null;
    if (dd <= 1) {
      const tx = Math.sqrt(1 - dy * dy), p = dx / (tx || 1);
      const lit = waxing ? p > 1 - 2 * k : p < -(1 - 2 * k);
      const crater = vnoise(x / (size / 12), y / (size / 12), 41) > 0.68;
      col = lit ? (crater ? [243, 223, 162] : [255, 244, 201]) : (crater ? [156, 142, 206] : [172, 158, 219]);
    } else if (dd <= (1 + 2.4 / r)) col = [61, 42, 63];
    if (col) { const i = (y * size + x) * 4; img.data.set([...col, 255], i); }
  }
  ctx.putImageData(img, 0, 0);
}
function skyMoon() {
  const jd = Date.now() / 864e5 + 2440587.5;
  const phase = ((jd - 2451550.1) / 29.530588853) % 1, k = (1 - Math.cos(2 * Math.PI * phase)) / 2;
  drawMoon(document.getElementById('moon'), k, 40, phase < 0.5);
  document.getElementById('moonChip').textContent = `Bu gece ay %${Math.round(k * 100)} dolu`;
}
function stars() {
  const c = document.getElementById('stars');
  const w = Math.ceil(innerWidth / 6), h = Math.ceil(innerHeight / 6);
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const draw = (t) => {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < 80; i++) {
      const x = Math.floor(hash(i, 1, 5) * w), y = Math.floor(hash(i, 2, 5) * h * 0.7);
      const on = Math.sin(t / 700 + i) > 0.55;
      ctx.globalAlpha = on ? 1 : 0.5; ctx.fillStyle = i % 5 === 0 ? '#fff1b8' : '#ffffff';
      ctx.fillRect(x, y, 1, 1);
      if (i % 11 === 0 && on) { ctx.fillRect(x - 1, y, 3, 1); ctx.fillRect(x, y - 1, 1, 3); }
    }
    ctx.globalAlpha = 1;
  };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) draw(0);
  else { const loop = (t) => { draw(t); setTimeout(() => requestAnimationFrame(loop), 450); }; requestAnimationFrame(loop); }
}

/* ---------- tanıtım: bugün + haftalık aylar ---------- */
function weekProgress(w) {
  let done = 0, total = 0, aero = 0, aeroPlan = 0;
  for (let d = 0; d < 7; d++) {
    const i = dayInfo(w, d); aeroPlan += i.aerobik;
    if (i.tur === 'dinlenme') continue;
    total++; if (state.done[key(w, d)]) { done++; aero += i.aerobik; }
  }
  return { done, total, k: total ? done / total : 0, aero, aeroPlan };
}
function renderHero() {
  const t = todayIndex(), el = document.getElementById('today');
  if (!t) {
    const s = parseDate(state.start), before = new Date() < s;
    el.className = 'today t-dinlenme';
    el.innerHTML = before
      ? `<span class="t-label">Program ${s.getDate()} ${AY[s.getMonth()]} ${GUN[0]} başlıyor</span><span class="t-title">Isınmaya hazır mısın?</span><div class="row"><button class="pbtn primary" data-open="0,0">İlk günü aç</button></div>`
      : `<span class="t-label">8 hafta tamamlandı</span><span class="t-title">Dolunay! Tebrikler.</span><div class="row"><button class="pbtn" id="restart">Yeni tarihle başla</button></div>`;
  } else {
    const i = dayInfo(t.w, t.d), dt = dayDate(t.w, t.d), done = state.done[key(t.w, t.d)];
    el.className = `today ${i.cls}`;
    el.innerHTML = `<span class="t-label">Bugün · ${GUN[t.d]} ${dt.getDate()} ${AY[dt.getMonth()]} · Hafta ${t.w + 1}</span>
      <span class="t-title">${i.baslik}</span>
      <div class="row"><button class="pbtn primary" data-open="${t.w},${t.d}">${i.tur === 'dinlenme' ? 'Dinlenme gününü aç' : 'Antrenmanı aç'}</button>${done ? '<span class="chip">Tamamlandı ✓</span>' : ''}</div>`;
  }
  const moons = document.getElementById('moons'); moons.innerHTML = '';
  for (let w = 0; w < AYARLAR.haftaSayisi; w++) {
    const p = weekProgress(w), b = document.createElement('button');
    b.type = 'button'; b.className = 'moon-item' + (t && t.w === w ? ' now' : '');
    b.setAttribute('aria-label', `Hafta ${w + 1}: ${p.done}/${p.total} gün tamam. Takvimde göster.`);
    const c = document.createElement('canvas'); c.className = 'pix'; drawMoon(c, p.k, 16);
    b.append(c, document.createTextNode(`H${w + 1}`));
    b.addEventListener('click', () => document.getElementById(`hafta-${w + 1}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    moons.append(b);
  }
  const wk = t ? t.w : 0, p = weekProgress(wk);
  const pct = Math.min(100, Math.round(p.aero / AYARLAR.aerobikHedef * 100));
  document.getElementById('weekMeter').innerHTML = `<span>Hafta ${wk + 1} hareket: ${p.aero} / ${p.aeroPlan} dk (hedef ${AYARLAR.aerobikHedef})</span><div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><i style="width:${pct}%"></i></div>`;
}

/* ---------- takvim ---------- */
function renderCalendar() {
  const cal = document.getElementById('calendar'); cal.innerHTML = '';
  const t = todayIndex(), now = new Date(); now.setHours(0, 0, 0, 0);
  for (let w = 0; w < AYARLAR.haftaSayisi; w++) {
    const row = document.createElement('div'); row.className = 'week'; row.id = `hafta-${w + 1}`;
    const p = weekProgress(w), lab = document.createElement('div'); lab.className = 'week-label';
    const mc = document.createElement('canvas'); mc.className = 'pix'; drawMoon(mc, p.k, 16);
    lab.append(mc, Object.assign(document.createElement('span'), { textContent: `Hafta ${w + 1}` }), Object.assign(document.createElement('small'), { textContent: w < 4 ? '1. aşama' : '2. aşama' }));
    row.append(lab);
    for (let d = 0; d < 7; d++) {
      const i = dayInfo(w, d), dt = dayDate(w, d), k = key(w, d);
      const b = document.createElement('button'); b.type = 'button';
      b.className = `day ${i.cls}` + (t && t.w === w && t.d === d ? ' is-today' : '') + (state.done[k] ? ' is-done' : '') + (dt < now ? ' is-past' : '');
      b.dataset.w = w; b.dataset.d = d; b.dataset.platform = 'day';
      b.setAttribute('aria-label', `Hafta ${w + 1}, ${GUN[d]} ${dt.getDate()} ${AY[dt.getMonth()]}: ${i.baslik}${state.done[k] ? ', tamamlandı' : ''}`);
      const top = document.createElement('span'); top.className = 'd-top';
      top.innerHTML = `<span>${GUN_K[d]}</span><span class="d-date">${dt.getDate()} ${AY_K[dt.getMonth()]}</span>`;
      const ic = icon(i.icon, 2); ic.classList.add('d-icon'); ic.style.width = ''; ic.style.height = '';
      const lb = document.createElement('span'); lb.className = 'd-label'; lb.textContent = i.kisa;
      b.append(top, ic, lb);
      if (state.done[k]) { const st = icon('paw', 3); st.classList.add('stamp'); st.style.width = ''; st.style.height = ''; b.append(st); }
      b.addEventListener('click', () => openDay(w, d));
      row.append(b);
    }
    cal.append(row);
  }
}

/* ---------- gün ayrıntısı ---------- */
const sheet = document.getElementById('daySheet');
let openKey = null;
function videoBlock(h) {
  const v = h.video;
  if (!v) return '';
  const t = v.bas ? `&t=${v.bas}s` : '';
  return `<div class="video"><button type="button" class="lite-yt" data-yt="${v.id}" data-start="${v.bas || 0}" aria-label="${h.ad} videosunu oynat" style="background-image:url('https://i.ytimg.com/vi/${v.id}/hqdefault.jpg')"></button>
    <a href="https://www.youtube.com/watch?v=${v.id}${t}" target="_blank" rel="noopener">YouTube'da aç · ${v.kanal || ''}${v.dil === 'en' ? ' (İngilizce)' : ''}</a></div>`;
}
function exCard(item, dayK, idx, compact = false) {
  const h = HAREKETLER[item.h];
  const sets = item.set ? Array.from({ length: item.set }, (_, s) => {
    const on = state.sets[`${dayK}:${item.h}`]?.[s];
    return `<button type="button" class="setbox" data-set="${item.h}" data-i="${s}" aria-pressed="${on ? 'true' : 'false'}" aria-label="Set ${s + 1}">${s + 1}</button>`;
  }).join('') : '';
  const kg = item.set ? `<label>kg <input class="kg" type="number" min="0" max="12" step="0.5" inputmode="decimal" data-kg="${item.h}" value="${state.kg[item.h] ?? ''}" aria-label="${h.ad} için kullandığın ağırlık"></label>` : '';
  return `<article class="ex${compact ? ' compact' : ''}">
    <div class="stage"><canvas class="pix" data-anim="${h.anim}" width="80" height="80" aria-label="${h.ad} animasyonu" role="img"></canvas></div>
    <div>
      <h3>${idx != null ? `${idx}. ` : ''}${h.ad}</h3>
      <div class="dose">${item.set ? `<span class="chip">${item.set} × ${item.tekrar}</span>` : `<span class="chip">${h.sure || ''}</span>`}${item.not ? `<span class="chip">${item.not}</span>` : ''}<span class="chip">${h.kaslar}</span></div>
      <ol>${h.adimlar.map(a => `<li>${a}</li>`).join('')}</ol>
      <span class="tip">İpucu: ${h.ipucu}</span>
      ${h.dikkat ? `<p class="warn">Dikkat: ${h.dikkat}</p>` : ''}
      ${item.set ? `<div class="sets"><span>Setler:</span>${sets}${kg}</div>` : ''}
      ${compact ? (h.video ? `<div class="video"><a href="https://www.youtube.com/watch?v=${h.video.id}${h.video.bas ? `&t=${h.video.bas}s` : ''}" target="_blank" rel="noopener">Videoyu YouTube'da izle${h.video.dil === 'en' ? ' (İngilizce)' : ''}</a></div>` : '') : videoBlock(h)}
    </div>
  </article>`;
}
function openDay(w, d) {
  const i = dayInfo(w, d), dt = dayDate(w, d), k = key(w, d); openKey = k;
  document.getElementById('dayEyebrow').textContent = `Hafta ${w + 1} · ${GUN[d]} ${dt.getDate()} ${AY[dt.getMonth()]}`;
  document.getElementById('dayTitle').textContent = i.baslik;
  let html = '';
  if (i.tur === 'kuvvet') {
    const a = ANTRENMANLAR[i.a];
    html += `<p>Önce 5 dk ısın, sonra hareketleri sırayla yap. Setler arası ${AYARLAR.dinlenmeSn} sn dinlen. Her setin sonunda "2–3 tekrar daha yapabilirdim" demelisin.</p>`;
    html += `<h3 class="sec-title">Isınma · 5 dk</h3><div class="ex-list">${ISINMA.map(h => exCard({ h }, k, null, true)).join('')}</div>`;
    html += `<h3 class="sec-title">${a.ad} · yaklaşık ${a.dk} dk</h3><div class="ex-list">${a.liste.map((it, n) => exCard(it, k, n + 1)).join('')}</div>`;
    html += `<h3 class="sec-title">Yemekten sonra · ${i.yemek} dk</h3><div class="ex-list">${exCard({ h: 'tempolu-yuruyus' }, k, null, true)}</div>
      <label class="check"><input type="checkbox" data-walk="${k}" ${state.walk[k] ? 'checked' : ''}> Yemekten sonra ${i.yemek} dk yürüdüm</label>`;
  } else if (i.tur === 'dinlenme') {
    html += `<p>Bugün dinlen. İstersen hafif esneme ya da kısa, sakin bir yürüyüş yapabilirsin. Kaslar dinlenirken güçlenir.</p>
      <div class="ex-list">${exCard({ h: 'kedi-deve' }, k, null, true)}${exCard({ h: 'yerinde-mars' }, k, null, true)}</div>`;
  } else {
    const h = i.tur === 'aralikli' ? 'aralikli-yuruyus' : 'tempolu-yuruyus';
    html += `<p>${i.tur === 'aralikli' ? `Yürüyüşün ortasında ${i.tur_} tur yap: 30 sn tempolu, 90 sn yavaş.` : `Toplam ${i.dk} dk. Bölebilirsin: en az 10 dakikalık parçalar da sayılır.`}</p>`;
    html += `<div class="ex-list">${exCard({ h }, k, null)}</div>`;
  }
  html += `<div class="done-row"><label class="check"><input type="checkbox" id="dayDone" ${state.done[k] ? 'checked' : ''}> Bu günü tamamladım</label><button type="button" class="pbtn small" id="dayClose2">Takvime dön</button></div>`;
  const body = document.getElementById('dayBody'); body.innerHTML = html;
  body.querySelectorAll('canvas[data-anim]').forEach(c => mountAnim(c, c.dataset.anim));
  if (!sheet.open) sheet.showModal();
  sheet.scrollTop = 0;
  window.dispatchEvent(new CustomEvent('yumak', { detail: { type: 'day-open', w, d } }));
}
sheet.addEventListener('click', (e) => {
  const yt = e.target.closest('.lite-yt');
  if (yt && !yt.querySelector('iframe')) {
    const f = document.createElement('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${yt.dataset.yt}?autoplay=1&rel=0&playsinline=1${+yt.dataset.start ? `&start=${yt.dataset.start}` : ''}`;
    f.allow = 'autoplay; encrypted-media; picture-in-picture'; f.allowFullscreen = true; f.title = yt.getAttribute('aria-label');
    yt.append(f); return;
  }
  const sb = e.target.closest('.setbox');
  if (sb) {
    const sk = `${openKey}:${sb.dataset.set}`, arr = state.sets[sk] || [];
    arr[+sb.dataset.i] = !arr[+sb.dataset.i]; state.sets[sk] = arr; save();
    sb.setAttribute('aria-pressed', arr[+sb.dataset.i] ? 'true' : 'false');
    if (arr[+sb.dataset.i]) { const r = sb.getBoundingClientRect(); hearts(r.left + r.width / 2, r.top, 1); window.dispatchEvent(new CustomEvent('yumak', { detail: { type: 'set-done' } })); }
    return;
  }
  if (e.target.id === 'dayClose2') sheet.close();
  if (e.target === sheet) sheet.close(); // arka plana tıklayınca kapat
});
sheet.addEventListener('change', (e) => {
  const el = e.target;
  if (el.dataset.kg) { state.kg[el.dataset.kg] = el.value; save(); }
  if (el.dataset.walk) { state.walk[el.dataset.walk] = el.checked; save(); }
  if (el.id === 'dayDone') {
    state.done[openKey] = el.checked; save();
    if (el.checked) {
      const r = el.getBoundingClientRect(); sparkles(r.left + 12, r.top); hearts(r.left + 60, r.top, 3);
      window.dispatchEvent(new CustomEvent('yumak', { detail: { type: 'day-done' } }));
    }
    renderCalendar(); renderHero();
  }
});
document.getElementById('dayClose').addEventListener('click', () => sheet.close());
sheet.addEventListener('close', () => { document.getElementById('dayBody').innerHTML = ''; window.dispatchEvent(new CustomEvent('yumak', { detail: { type: 'day-close' } })); });

/* ---------- neden ---------- */
function renderWhy() {
  document.getElementById('why').innerHTML = NEDEN.map(n => `<div class="why-item"><h3>${n.baslik}</h3><p>${n.metin}</p></div>`).join('');
  document.getElementById('sources').innerHTML = KAYNAKLAR.map(k => `<li><a href="${k.url}" target="_blank" rel="noopener">${k.ad}</a></li>`).join('');
}

/* ---------- ayarlar ---------- */
const setSheet = document.getElementById('settingsSheet');
document.getElementById('settingsBtn').addEventListener('click', () => { document.getElementById('startInput').value = state.start; setSheet.showModal(); });
document.getElementById('saveStart').addEventListener('click', (e) => {
  const v = document.getElementById('startInput').value;
  if (v) { state.start = v; save(); renderAll(); }
});
document.getElementById('resetBtn').addEventListener('click', () => {
  const b = document.getElementById('resetBtn');
  if (b.dataset.sure !== '1') { b.dataset.sure = '1'; b.textContent = 'Emin misin? Tekrar tıkla'; return; }
  state.done = {}; state.sets = {}; state.walk = {}; save(); b.dataset.sure = ''; b.textContent = 'İlerlemeyi sıfırla'; setSheet.close(); renderAll();
});
// yedek kodu: ilerlemeyi başka cihaza taşımak için (sunucu gerekmez)
const msg = (t) => { document.getElementById('backupMsg').textContent = t; };
document.getElementById('copyBackup').addEventListener('click', async () => {
  const code = btoa(unescape(encodeURIComponent(JSON.stringify(state))));
  const ta = document.getElementById('backupInput'); ta.value = code;
  try { await navigator.clipboard.writeText(code); msg('Kopyalandı!'); } catch { ta.select(); msg('Kodu seçtim, kopyalayabilirsin.'); }
});
document.getElementById('loadBackup').addEventListener('click', () => {
  try {
    const data = JSON.parse(decodeURIComponent(escape(atob(document.getElementById('backupInput').value.trim()))));
    if (!data || typeof data !== 'object' || !data.start) throw new Error('bad');
    for (const k of ['start', 'done', 'sets', 'kg', 'walk', 'sound', 'pet']) if (k in data) state[k] = data[k];
    save(); msg('Yüklendi! Sayfa yenileniyor…'); setTimeout(() => location.reload(), 900);
  } catch { msg('Bu kod okunamadı. Tamamını kopyaladığından emin ol.'); }
});

document.addEventListener('click', (e) => {
  const o = e.target.closest('[data-open]'); if (o) { const [w, d] = o.dataset.open.split(',').map(Number); openDay(w, d); }
  if (e.target.id === 'restart') document.getElementById('settingsBtn').click();
});

/* ---------- ses ---------- */
const soundBtn = document.getElementById('soundBtn');
function syncSound() { soundBtn.textContent = state.sound ? 'Ses açık' : 'Ses kapalı'; soundBtn.setAttribute('aria-pressed', state.sound ? 'true' : 'false'); }
soundBtn.addEventListener('click', () => { state.sound = !state.sound; save(); syncSound(); window.dispatchEvent(new CustomEvent('yumak', { detail: { type: 'sound', on: state.sound } })); });

/* ---------- başlat ---------- */
function renderAll() { renderHero(); renderCalendar(); }
function brand() { const c = document.getElementById('brandIcon'), i = icon('paw', 1); c.getContext('2d').drawImage(i, 4, 3); }
renderWhy(); renderAll(); skyMoon(); stars(); brand(); syncSound();
addEventListener('resize', () => stars());
initPet({ state, save, describeDay, sozler: YUMAK_SOZLER, drawHomeItems, todayIndex, dayInfo });
