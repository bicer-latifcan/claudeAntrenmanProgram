// Uygulama: takvim, gün ayrıntısı, ilerleme, gökyüzü. Yumak'ı başlatır.
import { AYARLAR, HAREKETLER, ANTRENMANLAR, ISINMA, TAKVIM, NEDEN, KAYNAKLAR, YUMAK_SOZLER, ETKINLIK_SOZLER, DAMBIL_MAKS } from './program.js';
import { icon, drawHomeItems, hearts, sparkles, checkCanvas, drawMoon } from './fx.js';
import { hash, vnoise } from './pixel.js';
import { initPet } from './pet.js';
import { initMutfak } from './mutfak.js';
import { initOzet } from './ozet.js';
import { initArsiv } from './arsiv.js';
import { mountAnim } from './tarcin.js';
import * as bulut from './bulut.js';

/* ---------- kayıt: tarayıcıda + (kuruluysa) bulutta ---------- */
const KEY = 'yumak-8-hafta-v1';
const LINK = bulut.linkModu();
const IZLE = LINK.izle;          // izleme modu: buluttaki ilerlemeyi gösterir, hiçbir şey kaydetmez
// ana ekrana eklenmiş uygulama olarak mı açıldı? (iPhone'da hafızası Safari'den ayrıdır)
const UYGULAMA = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const state = load();
function load() {
  const base = { start: AYARLAR.varsayilanBaslangic, done: {}, sets: {}, kg: {}, kgGun: {}, walk: {}, mutfak: {}, arsiv: [], ozetGoruldu: null, sound: false, zaman: 0 };
  if (IZLE) return base;         // izlerken bu cihazın kendi kaydına dokunma
  try { return { ...base, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return base; }
}
const writeLocal = () => { if (IZLE) return; try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* gizli pencere vb. */ } };
let bulutKod = LINK.kod, ilkBaglanti = LINK.yeni, bulutDurum = '', bulutSaat = null, bulutZamanlayici = 0;
try { if (localStorage.getItem('yumak-ilk-baglanti') === '1') { ilkBaglanti = true; localStorage.removeItem('yumak-ilk-baglanti'); } } catch { /* yok */ }
// şifreyle giriş: izleme modu dışında, giriş yapılmamışsa kapıda Yumak şifre sorar
const GIRIS_GEREK = !IZLE && bulut.hazir() && !bulut.girisli();
export function save() {
  if (IZLE) return;
  state.zaman = Date.now(); writeLocal();
  if (bulut.hazir() && bulutKod) { clearTimeout(bulutZamanlayici); bulutZamanlayici = setTimeout(bulutaYaz, 1500); }
}
async function bulutaYaz() {
  if (IZLE || !bulut.hazir() || !bulutKod) return;
  try { await bulut.yukle(bulutKod, state); bulutDurum = 'ok'; bulutSaat = new Date(); }
  catch { bulutDurum = 'hata'; }
  renderCloud();
}
addEventListener('online', () => { if (bulutDurum === 'hata') bulutaYaz(); }); // internet gelince bekleyen yedeği gönder
async function buluttanOku() {
  if (!bulut.hazir() || !bulutKod) return false;
  try {
    const c = await bulut.indir(bulutKod);
    // izlerken ve bu cihazdaki ilk bağlantıda buluttaki kayıt kazanır; sonra en yenisi kazanır
    if (c && (IZLE || ilkBaglanti || c.zaman > (state.zaman || 0))) {
      const degisti = c.zaman !== state.zaman;
      for (const k of ['start', 'done', 'sets', 'kg', 'kgGun', 'walk', 'mutfak', 'arsiv', 'ozetGoruldu', 'sound', 'pet', 'zaman']) if (k in c.veri) state[k] = c.veri[k];
      writeLocal(); ilkBaglanti = false; bulutDurum = 'ok'; bulutSaat = new Date(c.zaman); return degisti;
    }
    ilkBaglanti = false;
    if (IZLE) { bulutDurum = c ? 'ok' : 'bos'; return false; }
    await bulut.yukle(bulutKod, state); bulutDurum = 'ok'; bulutSaat = new Date();
  } catch { bulutDurum = 'hata'; }
  return false;
}
addEventListener('pagehide', () => { if (bulutZamanlayici) { clearTimeout(bulutZamanlayici); bulutaYaz(); } });
// tarayıcıdan "bu veriyi kendiliğinden silme" iste (bir kez, gerçek kullanım başlayınca)
function kaliciIste() { try { navigator.storage?.persisted?.().then(p => { if (!p) navigator.storage.persist(); }); } catch { /* desteklenmiyor */ } }
export { state };

/* ---------- tarihler ---------- */
const GUN = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const GUN_K = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
// gün adı tarihin kendisinden gelir: program hangi gün başlarsa takvim o günden başlar
const gunAdi = (dt) => GUN[(dt.getDay() + 6) % 7];
const gunKisa = (dt) => GUN_K[(dt.getDay() + 6) % 7];
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
  const when = t && t.w === w && t.d === d ? 'Bugün' : `${gunAdi(dt)} (${dt.getDate()} ${AY[dt.getMonth()]})`;
  if (state.done[key(w, d)]) return `${when}: <b>${i.baslik}</b>. Bunu bitirdin, pati damgasını ben vurdum!`;
  switch (i.tur) {
    case 'kuvvet': return `${when}: <b>${i.baslik}</b>. Tarçın hareketleri gösterecek, ben de set sayacağım.`;
    case 'dinlenme': return `${when}: <b>dinlenme</b>! En sevdiğim gün. Birlikte kestirelim mi?`;
    case 'aralikli': return `${when}: <b>${i.baslik}</b>. 30 sn hızlı, 90 sn yavaş. Ben izlerim.`;
    default: return `${when}: <b>${i.baslik}</b>. Konuşabilecek ama şarkı söyleyemeyecek hızda!`;
  }
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
      ? `<span class="t-label">Program ${s.getDate()} ${AY[s.getMonth()]} ${gunAdi(s)} başlıyor</span><span class="t-title">Isınmaya hazır mısın?</span><div class="row"><button class="pbtn primary" data-open="0,0">İlk günü aç</button></div>`
      : `<span class="t-label">${state.arsiv?.length ? `${state.arsiv.length + 1}. tur · ` : ''}8 hafta tamamlandı</span><span class="t-title">Dolunay! Tebrikler.</span><div class="row"><button class="pbtn primary" data-hikaye="tur">▶ Ay nasıl geçti? Hikâyeni izle</button></div>`;
  } else {
    const i = dayInfo(t.w, t.d), dt = dayDate(t.w, t.d), done = state.done[key(t.w, t.d)];
    el.className = `today ${i.cls}`;
    el.innerHTML = `<span class="t-label">Bugün · ${gunAdi(dt)} ${dt.getDate()} ${AY[dt.getMonth()]} · Hafta ${t.w + 1}</span>
      <span class="t-title">${i.baslik}</span>
      <div class="row"><button class="pbtn primary" data-open="${t.w},${t.d}">${i.tur === 'dinlenme' ? 'Dinlenme gününü aç' : 'Antrenmanı aç'}</button>${done ? '<span class="chip done-chip" id="todayDone">Bugün tamam!</span>' : ''}</div>`;
    if (done) document.getElementById('todayDone').prepend(checkCanvas(26));
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
      b.setAttribute('aria-label', `Hafta ${w + 1}, ${gunAdi(dt)} ${dt.getDate()} ${AY[dt.getMonth()]}: ${i.baslik}${state.done[k] ? ', tamamlandı' : ''}`);
      const top = document.createElement('span'); top.className = 'd-top';
      top.innerHTML = `<span>${gunKisa(dt)}</span><span class="d-date">${dt.getDate()} ${AY_K[dt.getMonth()]}</span>`;
      const ic = icon(i.icon, 2); ic.classList.add('d-icon'); ic.style.width = ''; ic.style.height = '';
      const lb = document.createElement('span'); lb.className = 'd-label'; lb.textContent = i.kisa;
      b.append(top, ic, lb);
      if (state.done[k]) { const ck = checkCanvas(62); ck.classList.add('stamp'); if (justDone === k) ck.classList.add('pop'); b.append(ck); }
      b.addEventListener('click', () => openDay(w, d));
      row.append(b);
    }
    cal.append(row);
  }
  justDone = null;
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
// bu hareket için daha önceki bir günde yazılan en son ağırlık
function lastKg(h, dayK) {
  const [, w, d] = dayK.match(/h(\d+)g(\d+)/).map(Number);
  for (let i = (w - 1) * 7 + (d - 1) - 1; i >= 0; i--) {
    const v = state.kgGun[`h${Math.floor(i / 7) + 1}g${(i % 7) + 1}:${h}`];
    if (v != null && v !== '') return v;
  }
  return state.arsiv?.length ? (state.kg?.[h] ?? null) : null; // yeni turda: önceki turun son ağırlığı
}
function exCard(item, dayK, idx, compact = false) {
  const h = HAREKETLER[item.h], ag = h.agirlik;
  const sets = item.set ? Array.from({ length: item.set }, (_, s) => {
    const on = state.sets[`${dayK}:${item.h}`]?.[s];
    return `<button type="button" class="setbox" data-set="${item.h}" data-i="${s}" aria-pressed="${on ? 'true' : 'false'}" aria-label="${s + 1}. set">${s + 1}</button>`;
  }).join('') : '';
  const weighted = item.set && ag && ag.kg;
  const today = state.kgGun[`${dayK}:${item.h}`], prev = weighted ? lastKg(item.h, dayK) : null;
  const top = String(item.tekrar).split('–').pop();
  const kgInput = weighted ? `<label class="kg-field">Bugün kaç kg?
      <input class="kg" type="number" min="0" max="${DAMBIL_MAKS}" step="0.5" inputmode="decimal" data-kg="${item.h}" value="${today ?? ''}" placeholder="${prev ?? ag.kg.split('–')[0]}" aria-label="${h.ad} için bugün kullandığın ağırlık (kg)">
    </label>` : '';
  const doseChips = item.set
    ? `<span class="chip strong">${item.set} set</span><span class="chip strong">${item.tekrar} tekrar</span>${item.not ? `<span class="chip">${item.not}</span>` : ''}`
      + (weighted ? `<span class="chip kg-chip">Önerilen: ${ag.kg}</span>` : `<span class="chip">Ağırlıksız</span>`)
    : ((item.sure || h.sure) ? `<span class="chip strong">${item.sure || h.sure}</span>` : '');
  return `<article class="ex${compact ? ' compact' : ''}">
    <div class="stage"><canvas class="pix" data-anim="${h.anim}" width="80" height="80" aria-label="${h.ad} animasyonu" role="img"></canvas></div>
    <div>
      <h3>${idx != null ? `${idx}. ` : ''}${h.ad}</h3>
      <div class="dose">${doseChips}<span class="chip">${h.kaslar}</span></div>
      <ol>${h.adimlar.map(a => `<li>${a}</li>`).join('')}</ol>
      <span class="tip">İpucu: ${h.ipucu}</span>
      ${h.dikkat ? `<p class="warn">Dikkat: ${h.dikkat}</p>` : ''}
      ${ag?.not ? `<p class="warn soft">Ağırlık: ${ag.not}</p>` : ''}
      ${item.set ? `<div class="tracker">
        <p class="tr-help">Her seti bitirince kutusuna dokun.${weighted ? ' Kullandığın ağırlığı yaz; bir dahaki sefere burada görürsün.' : ''}</p>
        <div class="sets"><span>Setler:</span>${sets}${kgInput}</div>
        ${weighted ? `<p class="tr-last" data-last="${item.h}">${prev != null
          ? `Geçen sefer: <b>${prev} kg</b>. Tüm setlerde ${top} tekrara ulaştıysan bugün biraz artırabilirsin.`
          : `İlk kez yapıyorsun: ${ag.kg} ile başla, setin sonunda 2–3 tekrar daha yapabilecek gibi olmalısın.`}</p>` : ''}
      </div>` : ''}
      ${compact ? (h.video ? `<div class="video"><a href="https://www.youtube.com/watch?v=${h.video.id}${h.video.bas ? `&t=${h.video.bas}s` : ''}" target="_blank" rel="noopener">Videoyu YouTube'da izle${h.video.dil === 'en' ? ' (İngilizce)' : ''}</a></div>` : '') : videoBlock(h)}
    </div>
  </article>`;
}
function openDay(w, d) {
  const i = dayInfo(w, d), dt = dayDate(w, d), k = key(w, d); openKey = k;
  document.getElementById('dayEyebrow').textContent = `Hafta ${w + 1} · ${gunAdi(dt)} ${dt.getDate()} ${AY[dt.getMonth()]}`;
  document.getElementById('dayTitle').textContent = i.baslik;
  let html = '';
  if (i.tur === 'kuvvet') {
    const a = ANTRENMANLAR[i.a];
    html += `<p>Önce 5 dk ısın, sonra hareketleri sırayla yap. Setler arası ${AYARLAR.dinlenmeSn} sn dinlen. Her setin sonunda "2–3 tekrar daha yapabilirdim" demelisin.</p>`;
    html += `<h3 class="sec-title">Isınma · 5 dk</h3><div class="ex-list">${ISINMA.map(h => exCard({ h }, k, null, true)).join('')}</div>`;
    html += `<h3 class="sec-title">${a.ad} · yaklaşık ${a.dk} dk</h3><div class="ex-list">${a.liste.map((it, n) => exCard(it, k, n + 1)).join('')}</div>`;
    html += `<h3 class="sec-title">Yemekten sonra · ${i.yemek} dk</h3><div class="ex-list">${exCard({ h: 'tempolu-yuruyus', sure: `${i.yemek} dk` }, k, null, true)}</div>
      <label class="check"><input type="checkbox" data-walk="${k}" ${state.walk[k] ? 'checked' : ''}> Yemekten sonra ${i.yemek} dk yürüdüm</label>`;
  } else if (i.tur === 'dinlenme') {
    html += `<p>Bugün dinlen. İstersen hafif esneme ya da kısa, sakin bir yürüyüş yapabilirsin. Kaslar dinlenirken güçlenir.</p>
      <div class="ex-list">${exCard({ h: 'kedi-deve' }, k, null, true)}${exCard({ h: 'yerinde-mars' }, k, null, true)}</div>`;
  } else {
    const h = i.tur === 'aralikli' ? 'aralikli-yuruyus' : 'tempolu-yuruyus';
    html += `<p>${i.tur === 'aralikli' ? `Yürüyüşün ortasında ${i.tur_} tur yap: 30 sn tempolu, 90 sn yavaş.` : `Toplam ${i.dk} dk. Bölebilirsin: en az 10 dakikalık parçalar da sayılır.`}</p>`;
    html += `<div class="ex-list">${exCard({ h, sure: `${i.dk} dk` }, k, null)}</div>`;
  }
  html += `<div class="done-row"><button type="button" class="done-btn" id="dayDone" aria-pressed="${state.done[k] ? 'true' : 'false'}"></button><button type="button" class="pbtn small" id="dayClose2">Takvime dön</button></div>`;
  const body = document.getElementById('dayBody'); body.innerHTML = html;
  body.querySelectorAll('canvas[data-anim]').forEach(c => mountAnim(c, c.dataset.anim));
  syncDoneBtn();
  if (!sheet.open) sheet.showModal();
  sheet.scrollTop = 0;
  window.dispatchEvent(new CustomEvent('yumak', { detail: { type: 'day-open', w, d } }));
}
function syncDoneBtn() {
  const b = document.getElementById('dayDone'); if (!b) return;
  const done = !!state.done[openKey];
  b.setAttribute('aria-pressed', done ? 'true' : 'false');
  b.innerHTML = '';
  if (done) { b.append(checkCanvas(40), Object.assign(document.createElement('span'), { innerHTML: 'Tamamlandı!<small>Geri almak için tekrar dokun</small>' })); }
  else b.append(Object.assign(document.createElement('span'), { textContent: 'Bugünü bitirdim!' }));
}
let justDone = null;
sheet.addEventListener('click', (e) => {
  const yt = e.target.closest('.lite-yt');
  if (yt) { // kapak resmini gerçek oynatıcıyla değiştir (üstünde buton kalmasın)
    const frame = document.createElement('div'); frame.className = 'yt-frame';
    const f = document.createElement('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${yt.dataset.yt}?autoplay=1&rel=0&playsinline=1${+yt.dataset.start ? `&start=${yt.dataset.start}` : ''}`;
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'; f.allowFullscreen = true; f.title = yt.getAttribute('aria-label');
    frame.append(f); yt.replaceWith(frame); return;
  }
  if (IZLE && e.target.closest('#dayDone, .setbox')) return; // izlerken değiştirme yok
  const db = e.target.closest('#dayDone');
  if (db) {
    const now = !state.done[openKey]; state.done[openKey] = now; save(); syncDoneBtn();
    if (now) {
      kaliciIste(); justDone = openKey;
      const r = db.getBoundingClientRect(); sparkles(r.left + 30, r.top + 10, 6); hearts(r.left + r.width / 2, r.top, 3);
      window.dispatchEvent(new CustomEvent('yumak', { detail: { type: 'day-done' } }));
    }
    renderCalendar(); renderHero();
    return;
  }
  const sb = e.target.closest('.setbox');
  if (sb) {
    const sk = `${openKey}:${sb.dataset.set}`, arr = state.sets[sk] || [];
    arr[+sb.dataset.i] = !arr[+sb.dataset.i]; state.sets[sk] = arr; save();
    sb.setAttribute('aria-pressed', arr[+sb.dataset.i] ? 'true' : 'false');
    if (arr[+sb.dataset.i]) { kaliciIste(); const r = sb.getBoundingClientRect(); hearts(r.left + r.width / 2, r.top, 1); window.dispatchEvent(new CustomEvent('yumak', { detail: { type: 'set-done' } })); }
    return;
  }
  if (e.target.id === 'dayClose2') sheet.close();
  if (e.target === sheet) sheet.close(); // arka plana tıklayınca kapat
});
sheet.addEventListener('change', (e) => {
  const el = e.target;
  if (IZLE) return;
  if (el.dataset.kg) { // 0–12 kg arası, yarım kiloluk adımlar
    const k = `${openKey}:${el.dataset.kg}`, note = el.closest('.tracker')?.querySelector('.tr-last');
    let v = parseFloat(String(el.value).replace(',', '.'));
    if (Number.isNaN(v)) { delete state.kgGun[k]; el.value = ''; save(); return; }
    let msg = '';
    if (v > DAMBIL_MAKS) { v = DAMBIL_MAKS; msg = `Dambılın en fazla ${DAMBIL_MAKS} kg, ${DAMBIL_MAKS} olarak yazdım.`; }
    if (v < 0) v = 0;
    v = Math.round(v * 2) / 2; el.value = v;
    state.kgGun[k] = v; state.kg[el.dataset.kg] = v; save();
    if (note) note.innerHTML = msg || `Kaydedildi: <b>${v} kg</b>. Bir dahaki sefere burada görünecek.`;
  }
  if (el.dataset.walk) { state.walk[el.dataset.walk] = el.checked; save(); }
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
  if (v && !IZLE) { state.start = v; save(); renderAll(); }
});
document.getElementById('resetBtn').addEventListener('click', () => {
  const b = document.getElementById('resetBtn');
  if (IZLE) return;
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
  if (IZLE) return;
  try {
    const data = JSON.parse(decodeURIComponent(escape(atob(document.getElementById('backupInput').value.trim()))));
    if (!data || typeof data !== 'object' || !data.start) throw new Error('bad');
    for (const k of ['start', 'done', 'sets', 'kg', 'kgGun', 'walk', 'mutfak', 'arsiv', 'sound', 'pet']) if (k in data) state[k] = data[k];
    save(); msg('Yüklendi! Sayfa yenileniyor…'); setTimeout(() => location.reload(), 900);
  } catch { msg('Bu kod okunamadı. Tamamını kopyaladığından emin ol.'); }
});

document.addEventListener('click', (e) => {
  const o = e.target.closest('[data-open]'); if (o) { const [w, d] = o.dataset.open.split(',').map(Number); openDay(w, d); }
  if (e.target.closest('[data-hikaye]')) ozet.oynat('tur');
});

/* ---------- ses ---------- */
const soundBtn = document.getElementById('soundBtn');
function syncSound() { soundBtn.textContent = state.sound ? 'Ses açık' : 'Ses kapalı'; soundBtn.setAttribute('aria-pressed', state.sound ? 'true' : 'false'); }
soundBtn.addEventListener('click', () => { state.sound = !state.sound; save(); syncSound(); window.dispatchEvent(new CustomEvent('yumak', { detail: { type: 'sound', on: state.sound } })); });

/* ---------- bulut bölümü (başlangıç penceresinde) ---------- */
function renderCloud() {
  const st = document.getElementById('cloudStatus'), act = document.getElementById('cloudActions');
  if (!st) return;
  act.innerHTML = '';
  const btn = (text, fn, primary) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'pbtn small' + (primary ? ' primary' : ''); b.textContent = text; b.addEventListener('click', fn); act.append(b); return b; };
  if (!bulut.hazir()) { st.textContent = 'Henüz kurulmadı. İlerleme şimdilik sadece bu tarayıcıda saklanıyor.'; return; }
  if (IZLE) {
    st.textContent = 'İzleme modundasın: ilerleme buluttan okunuyor, bu cihazda hiçbir şey değiştirilmiyor.';
    btn('İzlemeden çık', () => { bulut.izlemedenCik(); location.reload(); });
    return;
  }
  if (!bulutKod || !bulut.girisli()) {
    st.textContent = 'Giriş yapılmadı. Şifrenle girince ilerlemen buluta yedeklenir.';
    btn('Şifreyle giriş', () => kapiyiGoster(), true);
    return;
  }
  const saat = bulutSaat ? `${String(bulutSaat.getHours()).padStart(2, '0')}:${String(bulutSaat.getMinutes()).padStart(2, '0')}` : '';
  st.textContent = bulutDurum === 'hata' ? 'Şifreyle giriş yapıldı, ama son yedek gönderilemedi (internet yok olabilir). İnternet gelince kendisi tekrar gönderir; istersen aşağıdan elle de gönderebilirsin.'
    : `Şifreyle giriş yapıldı ✓ Her değişiklik birkaç saniye içinde kendiliğinden yedeklenir${saat ? ` (son yedek: ${saat})` : ''}. Başka bir cihazdan da aynı şifreyle girebilirsin.`;
  btn('İzleme linkini kopyala', async (e) => {
    const link = bulut.izlemeLinki(bulutKod);
    try { await navigator.clipboard.writeText(link); e.target.textContent = 'Kopyalandı!'; }
    catch { document.getElementById('backupInput').value = link; e.target.textContent = 'Link aşağıda'; }
  });
  if (bulutDurum === 'hata') btn('Tekrar dene', () => bulutaYaz(), true); // normalde gerek yok: yedek kendiliğinden gider
  const cikis = btn('Çıkış yap', async () => {
    if (cikis.dataset.emin !== '1') { cikis.dataset.emin = '1'; cikis.textContent = 'Emin misin? Tekrar dokun'; return; }
    cikis.textContent = 'Yedekleniyor…'; clearTimeout(bulutZamanlayici);
    await bulutaYaz(); // son değişiklikler buluta gitsin
    bulut.cikisYap([KEY]); // bu cihazdaki ilerleme silinir; bulutta kalır
    location.reload();
  });
  cikis.classList.add('ghost');
}
function kapiyiGoster() {
  import('./giris.js').then((g) => g.kapiyiAc({ mod: bulutKod ? 'olustur' : 'giris', eskiKod: bulutKod || null, veri: state, sonra: () => location.reload() }));
}
if (GIRIS_GEREK) kapiyiGoster();

/* ---------- izleme modu: üstte şerit, değiştiren her şey kapalı ---------- */
function renderIzle() {
  const bar = document.getElementById('izleBar'); if (!bar) return;
  bar.hidden = !IZLE; if (!IZLE) return;
  document.body.classList.add('izle');
  const s = bulutSaat ? `${String(bulutSaat.getHours()).padStart(2, '0')}:${String(bulutSaat.getMinutes()).padStart(2, '0')}` : '';
  const msg = bulutDurum === 'hata' ? 'Buluta ulaşılamadı, internetini kontrol et.'
    : bulutDurum === 'bos' ? 'Henüz buluta kaydedilmiş bir ilerleme yok.'
    : `Son hareket: ${bulutSaat ? `${bulutSaat.getDate()} ${AY[bulutSaat.getMonth()]} ${s}` : '—'}`;
  document.getElementById('izleText').textContent = msg;
}

/* ---------- başlat ---------- */
function renderAll() { renderHero(); renderCalendar(); if (mutfak && sekme === 'mutfak') mutfak.ciz(); if (arsiv && sekme === 'arsiv') arsiv.ciz(); }

/* ---------- sekmeler: Program / Mutfak / Arşiv ---------- */
let mutfak = null, arsiv = null, sekme = 'program';
const SEKMELER = { program: 'sayfaProgram', mutfak: 'sayfaMutfak', arsiv: 'sayfaArsiv' };
const hashSekme = () => (location.hash === '#mutfak' ? 'mutfak' : location.hash === '#arsiv' ? 'arsiv' : 'program');
const ozet = initOzet({ state, save, renderAll: () => renderAll(), izle: IZLE });
function sekmeAc(ad, gecmis = true) {
  sekme = SEKMELER[ad] ? ad : 'program';
  for (const [k, id] of Object.entries(SEKMELER)) document.getElementById(id).hidden = k !== sekme;
  for (const b of document.querySelectorAll('.tab')) { const on = b.dataset.sekme === sekme; b.classList.toggle('on', on); if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); }
  if (sekme === 'mutfak') { mutfak ||= initMutfak({ state, save, izle: IZLE }); mutfak.ciz(); }
  if (sekme === 'arsiv') { arsiv ||= initArsiv({ state, ozet, izle: IZLE }); arsiv.ciz(); }
  if (gecmis && hashSekme() !== sekme) history.pushState(null, '', sekme === 'program' ? location.pathname + location.search : `#${sekme}`);
  scrollTo({ top: 0 });
  window.dispatchEvent(new CustomEvent('yumak', { detail: { type: 'sekme', ad: sekme } }));
}
for (const b of document.querySelectorAll('.tab')) b.addEventListener('click', () => sekmeAc(b.dataset.sekme));
addEventListener('popstate', () => sekmeAc(hashSekme(), false));
function tabIkonlari() {
  for (const [id, ad] of [['tabProgram', 'dumbbell'], ['tabMutfak', 'kase']]) { const c = document.getElementById(id), i = icon(ad, 1); c.width = i.width; c.height = i.height; c.getContext('2d').drawImage(i, 0, 0); }
  drawMoon(document.getElementById('tabArsiv'), 0.7, 16);
}
function brand() { const c = document.getElementById('brandIcon'), i = icon('paw', 1); c.getContext('2d').drawImage(i, 4, 3); }
renderWhy(); renderAll(); skyMoon(); stars(); brand(); tabIkonlari(); syncSound(); renderCloud();
if (SEKMELER[LINK.sekme] || hashSekme() !== 'program') sekmeAc(SEKMELER[LINK.sekme] ? LINK.sekme : hashSekme(), false);
addEventListener('resize', () => stars());
document.getElementById('settingsBtn').addEventListener('click', renderCloud);
(async () => {
  if (await buluttanOku()) { renderAll(); syncSound(); }
  renderCloud(); renderIzle();
  if (!IZLE && bulut.girisli()) bulut.kaydol(bulutKod).catch(() => {}); // admin panelinin defterine (şifreli) kayıt
  // Yumak'ın mama/su durumu sık kaydedilir: sadece tarayıcıya (buluta gerçek ilerleme gider)
  initPet({ state, save: writeLocal, describeDay, sozler: YUMAK_SOZLER, etkinlik: ETKINLIK_SOZLER, drawHomeItems, todayIndex, dayInfo, sefMi: () => sekme === 'mutfak' });
  if (!GIRIS_GEREK) ozet.bittiyse(); // tur bittiyse hikâyeyi kendiliğinden aç (izlenene kadar günde bir kez)
  if (IZLE) setInterval(async () => { if (await buluttanOku()) renderAll(); renderIzle(); }, 60000);
})();
document.getElementById('izleRefresh')?.addEventListener('click', async (e) => { e.target.textContent = 'Yenileniyor…'; if (await buluttanOku()) renderAll(); renderIzle(); e.target.textContent = 'Yenile'; });
document.getElementById('izleExit')?.addEventListener('click', () => { bulut.izlemedenCik(); location.reload(); });
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  // uygulama arka planda günlerce açık kalabilir: öne gelince yeni sürüm var mı bak, varsa bir sonraki dönüşte yükle
  const vardi = !!navigator.serviceWorker.controller;
  let yeniSurum = false, sonKontrol = Date.now();
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (vardi) yeniSurum = true; });
  navigator.serviceWorker.register('sw.js').then((reg) => {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') return;
      if (yeniSurum && !document.querySelector('dialog[open]')) { location.reload(); return; }
      if (Date.now() - sonKontrol > 30 * 60e3) { sonKontrol = Date.now(); reg.update().catch(() => {}); }
    });
  }).catch(() => {});
}
if (UYGULAMA) kaliciIste();
