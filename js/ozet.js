// "Ay nasıl geçti?": tur sonu özeti ve arşiv. Program bitince açılır; "Yeni tura başla" turu arşive koyar.
import { AYARLAR, TAKVIM, HAREKETLER } from './program.js';
import { OGUNLER } from './mutfak-veri.js';
import { hearts, sparkles } from './fx.js';
import { Grid, paint } from './pixel.js';
import * as Y from './yumak-art.js';

const AY = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const isoTarih = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const tarihOku = (s) => { const [y, m, g] = String(s).split('-').map(Number); return new Date(y, m - 1, g); };
const gunEkle = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const tarihYaz = (d) => `${d.getDate()} ${AY[d.getMonth()]}`;
const sayi = (n) => n.toLocaleString('tr-TR', { maximumFractionDigits: 1 });

// bir turun özetini hesapla: t = { start, done, sets, kgGun, walk, mutfak }
export function ozetHesapla(t) {
  const N = AYARLAR.haftaSayisi * 7, done = t.done || {}, walk = t.walk || {};
  const anahtar = (i) => `h${Math.floor(i / 7) + 1}g${(i % 7) + 1}`, gun = (i) => TAKVIM[Math.floor(i / 7)][i % 7];
  let tamam = 0, toplam = 0, kuvvet = 0, kuvvetTop = 0, yuruDk = 0, yemekYuru = 0;
  const haftalar = [];
  for (let w = 0; w < AYARLAR.haftaSayisi; w++) {
    let wt = 0, wtop = 0;
    for (let d = 0; d < 7; d++) {
      const i = w * 7 + d, g = gun(i), k = anahtar(i);
      if (walk[k]) yemekYuru++;
      if (g.tur === 'dinlenme') continue;
      toplam++; wtop++;
      if (g.tur === 'kuvvet') kuvvetTop++;
      if (!done[k]) continue;
      tamam++; wt++;
      if (g.tur === 'kuvvet') { kuvvet++; if (walk[k]) yuruDk += g.yemek; } else yuruDk += g.dk;
    }
    haftalar.push(wtop ? wt / wtop : 0);
  }
  // en uzun zincir (dinlenme günleri zinciri uzatır, zincirde en az bir gerçek gün olmalı)
  let rekor = 0, zincir = 0, gercek = 0;
  for (let i = 0; i < N; i++) {
    const ok = done[anahtar(i)] || gun(i).tur === 'dinlenme';
    if (ok) { zincir++; if (done[anahtar(i)]) gercek++; if (gercek) rekor = Math.max(rekor, zincir); } else { zincir = 0; gercek = 0; }
  }
  const setSay = Object.values(t.sets || {}).reduce((a, arr) => a + (Array.isArray(arr) ? arr.filter(Boolean).length : 0), 0);
  // ağırlık gelişimi: her hareketin ilk ve son kaydı
  const kg = {};
  for (let i = 0; i < N; i++) for (const [k, v] of Object.entries(t.kgGun || {})) {
    if (!k.startsWith(anahtar(i) + ':') || v == null || v === '') continue;
    const h = k.split(':')[1], x = kg[h] || (kg[h] = { ilk: +v, son: +v, max: +v });
    x.son = +v; x.max = Math.max(x.max, +v);
  }
  const agirlik = Object.entries(kg).map(([h, x]) => ({ ad: HAREKETLER[h]?.ad || h, ...x, fark: x.son - x.ilk }))
    .sort((a, b) => b.fark - a.fark || b.max - a.max).slice(0, 6);
  // mutfak: program günlerindeki küçük liste ve öğün seçimleri
  const bas = tarihOku(t.start), K = t.mutfak?.kontrol || {}, G = t.mutfak?.gun || {};
  let kayitliGun = 0, suTop = 0, su8 = 0, sebze3 = 0, proteinTam = 0, sekersiz = 0;
  const secim = { kahvalti: {}, ara: {}, aksam: {} };
  for (let i = 0; i < N; i++) {
    const iso = isoTarih(gunEkle(bas, i)), k = K[iso];
    if (k) {
      kayitliGun++; suTop += k.su || 0; if ((k.su || 0) >= 8) su8++; if ((k.sebze || 0) >= 3) sebze3++;
      if (Array.isArray(k.protein) && k.protein.every(Boolean)) proteinTam++; if (k.seker) sekersiz++;
    }
    for (const [o, id] of Object.entries(G[iso]?.sec || {})) if (secim[o]) secim[o][id] = (secim[o][id] || 0) + 1;
  }
  const favori = {};
  for (const [o, say] of Object.entries(secim)) {
    const en = Object.entries(say).sort((a, b) => b[1] - a[1])[0];
    if (en) favori[o] = { ad: OGUNLER[o].secenekler[en[0]]?.ad || en[0], kez: en[1] };
  }
  return {
    start: t.start, bitis: isoTarih(gunEkle(bas, N - 1)), tamam, toplam, kuvvet, kuvvetTop, yuruDk, yemekYuru, rekor, setSay, haftalar, agirlik,
    mutfak: { kayitliGun, suOrt: kayitliGun ? suTop / kayitliGun : 0, su8, sebze3, proteinTam, sekersiz, favori },
  };
}

function yorum(o) {
  const y = o.toplam ? o.tamam / o.toplam : 0;
  if (y >= 0.9) return 'Efsane bir tur! Sekiz ayın sekizi de doldu, ben de gururdan doldum. Mrrr.';
  if (y >= 0.7) return 'Harika geçti! Çoğu günü tamamladın; kaslar da, ben de çok mutluyuz.';
  if (y >= 0.4) return 'Güzel bir tur. Her tamamlanan gün bir kazanç; ikinci turda daha da parlarız.';
  if (y > 0) return 'Başladın ve devam ettin, en önemlisi bu. Yeni tur seni bekliyor, ben de yanındayım.';
  return 'Bu tur pek işaretleme yapılmamış. Olsun! Yeni bir başlangıç her zaman mümkün.';
}

export function initOzet({ state, save, drawMoon, renderAll, izle }) {
  const dlg = document.getElementById('ozetSheet'), govde = document.getElementById('ozetBody');
  state.arsiv ||= [];

  function ciz(o, { baslik, arsivde, araOzet }) {
    const yuzde = o.toplam ? Math.round(o.tamam / o.toplam * 100) : 0, m = o.mutfak;
    const kutu = (deger, ad) => `<div class="oz-kutu"><b>${deger}</b><span>${ad}</span></div>`;
    govde.innerHTML = `
      <div class="oz-bas"><div>
        <p class="eyebrow">${baslik}</p>
        <h2 id="ozetTitle">${araOzet ? 'Şimdiye kadar nasıl gidiyor?' : 'Ay nasıl geçti?'}</h2>
        <p class="muted">${tarihYaz(tarihOku(o.start))} – ${tarihYaz(tarihOku(o.bitis))}</p>
      </div><canvas class="pix oz-yumak" width="88" height="88" aria-hidden="true"></canvas></div>
      <div class="oz-aylar" aria-label="Haftalık aylar">${o.haftalar.map((k, i) => `<span class="oz-ay"><canvas class="pix" data-ay="${k}"></canvas><small>H${i + 1}</small></span>`).join('')}</div>
      <div class="oz-izgara">
        ${kutu(`${o.tamam}/${o.toplam}`, `gün tamamlandı (%${yuzde})`)}
        ${kutu(`🔥 ${o.rekor}`, 'günlük en uzun zincir')}
        ${kutu(`${o.kuvvet}/${o.kuvvetTop}`, 'kuvvet günü')}
        ${kutu(sayi(o.yuruDk), 'dakika yürüyüş')}
        ${kutu(o.setSay, 'set')}
        ${kutu(o.yemekYuru, 'yemek sonrası yürüyüş')}
      </div>
      ${o.agirlik.length ? `<h3 class="oz-alt">Ağırlıklar</h3><ul class="oz-liste">${o.agirlik.map((a) => `<li><span>${a.ad}</span><b>${sayi(a.ilk)} → ${sayi(a.son)} kg${a.fark > 0 ? ` <em>+${sayi(a.fark)}</em>` : ''}</b></li>`).join('')}</ul>` : ''}
      ${m.kayitliGun ? `<h3 class="oz-alt">Mutfak</h3><ul class="oz-liste">
        <li><span>Ortalama su</span><b>${sayi(m.suOrt)} bardak/gün</b></li>
        <li><span>8 bardak su içilen gün</span><b>${m.su8}</b></li>
        <li><span>Sebze hedefi tutan gün</span><b>${m.sebze3}</b></li>
        <li><span>Her öğünde protein</span><b>${m.proteinTam} gün</b></li>
        <li><span>Şekerli içecek içilmeyen gün</span><b>${m.sekersiz}</b></li>
        ${Object.entries(m.favori).map(([og, f]) => `<li><span>En sevilen ${og === 'kahvalti' ? 'kahvaltı' : og === 'ara' ? 'ara öğün' : 'akşam yemeği'}</span><b>${f.ad} (${f.kez} kez)</b></li>`).join('')}
      </ul>` : ''}
      <p class="oz-yorum"><b>Yumak:</b> ${yorum(o)}</p>
      ${!arsivde && !araOzet && !izle ? `<div class="oz-yeni">
        <h3 class="oz-alt">Yeni tur</h3>
        <p class="muted">Bu tur arşive kaydedilir (özetini ayarlardan her zaman açabilirsin), takvim yeni tarihten sıfırdan başlar. Son kullandığın ağırlıklar hatırlanır.</p>
        <label class="field">Yeni başlangıç<input type="date" id="ozetTarih" value="${isoTarih(sonrakiPazartesi())}"></label>
      </div>` : ''}
      <div class="row-end">
        ${!arsivde && !araOzet && !izle ? '<button type="button" class="pbtn primary" id="ozetYeni">Arşivle ve yeni tura başla</button>' : ''}
        <button type="button" class="pbtn" id="ozetKapat">Kapat</button>
      </div>`;
    for (const c of govde.querySelectorAll('canvas[data-ay]')) drawMoon(c, +c.dataset.ay, 16);
    { // tur bitti: parti şapkalı Yumak; ara özet: el sallayan Yumak
      const g = new Grid(Y.W, Y.H), iyi = o.toplam && o.tamam / o.toplam >= 0.4;
      Y.sit(g, { t: 0.4, look: { x: 0, y: 0 }, eyes: 'happy', mouth: 'open', hat: !araOzet && iyi, paws: araOzet ? 'wave' : undefined });
      paint(govde.querySelector('.oz-yumak'), g);
    }
    govde.querySelector('#ozetKapat').onclick = () => dlg.close();
    const yeni = govde.querySelector('#ozetYeni');
    if (yeni) yeni.onclick = () => {
      if (yeni.dataset.emin !== '1') { yeni.dataset.emin = '1'; yeni.textContent = 'Emin misin? Tekrar dokun'; return; }
      yeniTur(govde.querySelector('#ozetTarih').value);
    };
  }
  // açınca en üstten başlasın (tarih kutusu odak alıp aşağı kaydırmasın)
  function goster() {
    if (!dlg.open) dlg.showModal();
    const h = govde.querySelector('h2'); h.tabIndex = -1; h.focus({ preventScroll: true });
    govde.scrollTop = 0; dlg.scrollTop = 0;
  }
  function sonrakiPazartesi() { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7)); return d; }
  const turVerisi = () => ({ start: state.start, done: state.done, sets: state.sets, kgGun: state.kgGun, walk: state.walk, mutfak: state.mutfak });

  function yeniTur(tarih) {
    if (izle || !/^\d{4}-\d{2}-\d{2}$/.test(tarih || '')) return;
    const o = ozetHesapla(turVerisi());
    state.arsiv.push({ tur: state.arsiv.length + 1, ozet: o, start: state.start, done: state.done, sets: state.sets, kgGun: state.kgGun, walk: state.walk });
    state.done = {}; state.sets = {}; state.kgGun = {}; state.walk = {}; state.start = tarih; state.ozetGoruldu = null;
    save(); dlg.close(); renderAll();
    const r = document.getElementById('today')?.getBoundingClientRect();
    if (r) { hearts(r.left + r.width / 2, r.top + 20, 3); sparkles(r.left + 40, r.top + 20, 6); }
  }
  return {
    // tur bittiyse özeti göster (her tur için bir kez kendiliğinden)
    bittiyse() {
      const bitis = gunEkle(tarihOku(state.start), AYARLAR.haftaSayisi * 7), bugun = new Date(); bugun.setHours(0, 0, 0, 0);
      if (bugun < bitis || izle || state.ozetGoruldu === state.start) return;
      state.ozetGoruldu = state.start; save();
      this.ac();
    },
    ac() { ciz(ozetHesapla(turVerisi()), { baslik: `${state.arsiv.length + 1}. tur` }); goster(); },
    ara() { ciz(ozetHesapla(turVerisi()), { baslik: `${state.arsiv.length + 1}. tur · ara özet`, araOzet: true }); goster(); },
    arsiv(i) { const a = state.arsiv[i]; if (!a) return; ciz(a.ozet, { baslik: `${a.tur}. tur · arşiv`, arsivde: true }); goster(); },
  };
}
