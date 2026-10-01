// "Ay nasıl geçti?": tur sonu özeti ve arşiv. Tur bitince hikâye açılır; sonuna gelinince tur
// kendiliğinden arşive kaydedilir ve takvim sıfırlanır (yeni başlangıç son sahnede sorulur).
import { AYARLAR, TAKVIM, HAREKETLER } from './program.js';
import { OGUNLER } from './mutfak-veri.js';
import { hikayeVerisi, hikayeAc, resimYap, kaydet, baslangicSecenekleri } from './hikaye.js';

const isoTarih = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const tarihOku = (s) => { const [y, m, g] = String(s).split('-').map(Number); return new Date(y, m - 1, g); };
const gunEkle = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

// bir turun özetini hesapla: t = { start, done, sets, kgGun, walk, mutfak }
// t.bugun: turun kaçıncı günündeyiz (ara özet için; geçen gün sayısı buna göre)
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
    gunler: gunlerDizisi(done), gecen: t.bugun == null ? null : gecenSay(t.bugun),
    start: t.start, bitis: isoTarih(gunEkle(bas, N - 1)), tamam, toplam, kuvvet, kuvvetTop, yuruDk, yemekYuru, rekor, setSay, haftalar, agirlik,
    mutfak: { kayitliGun, suOrt: kayitliGun ? suTop / kayitliGun : 0, su8, sebze3, proteinTam, sekersiz, favori },
  };
}

// 56 günlük harita: x = tamamlandı, d = dinlenme, o = yapılmadı (hikâyedeki takvim için)
export function gunlerDizisi(done = {}) {
  let s = '';
  for (let i = 0; i < AYARLAR.haftaSayisi * 7; i++) s += TAKVIM[Math.floor(i / 7)][i % 7].tur === 'dinlenme' ? 'd' : done[`h${Math.floor(i / 7) + 1}g${(i % 7) + 1}`] ? 'x' : 'o';
  return s;
}
function gecenSay(bugun) { // bugüne kadar (bugün dahil) dinlenme olmayan gün sayısı
  let n = 0; for (let i = 0; i <= Math.min(bugun, AYARLAR.haftaSayisi * 7 - 1); i++) if (TAKVIM[Math.floor(i / 7)][i % 7].tur !== 'dinlenme') n++;
  return n;
}

export function initOzet({ state, save, renderAll, izle }) {
  const N = AYARLAR.haftaSayisi * 7;
  const bugun0 = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const bittiMi = () => bugun0() >= gunEkle(tarihOku(state.start), N);
  const turVerisi = () => ({ start: state.start, done: state.done, sets: state.sets, kgGun: state.kgGun, walk: state.walk, mutfak: state.mutfak });
  const siradaki = () => (state.arsiv?.length || 0) + 1;

  // hikâyenin sonuna gelindi: turu arşive koy, takvimi sıfırla. Varsayılan başlangıç yeni ay; son sahnede değiştirilebilir.
  function arsivle(baslangic) {
    if (izle || !bittiMi()) return;
    const tur = siradaki();
    state.arsiv.push({ tur, ozet: ozetHesapla(turVerisi()), start: state.start, done: state.done, sets: state.sets, kgGun: state.kgGun, walk: state.walk });
    state.done = {}; state.sets = {}; state.kgGun = {}; state.walk = {}; state.start = baslangic; state.ozetGoruldu = null;
    save(); renderAll();
  }
  function veri(kaynak) {
    if (kaynak === 'tur') return hikayeVerisi(ozetHesapla(turVerisi()), { tur: siradaki() });
    if (kaynak === 'ara') return hikayeVerisi(ozetHesapla({ ...turVerisi(), bugun: Math.floor((bugun0() - tarihOku(state.start)) / 864e5) }), { tur: siradaki(), ara: true });
    const a = state.arsiv[kaynak]; if (!a) return null;
    return hikayeVerisi({ ...a.ozet, gunler: a.ozet.gunler || gunlerDizisi(a.done) }, { tur: a.tur });
  }
  const dosya = (kaynak) => `yumak-${kaynak === 'tur' || kaynak === 'ara' ? siradaki() : state.arsiv[kaynak]?.tur}-tur${kaynak === 'ara' ? '-simdiye-kadar' : ''}`;

  // kaynak: 'tur' (biten tur), 'ara' (şimdiye kadar), sayı (arşivdeki tur). basla: 'video' → doğrudan videoya
  function oynat(kaynak, { basla } = {}) {
    if (kaynak === 'tur' && !bittiMi()) kaynak = 'ara';
    const V = veri(kaynak); if (!V) return;
    let son = null, sonaGelince = null;
    if (kaynak === 'tur' && !izle) {
      const sec = baslangicSecenekleri();
      son = { secenekler: sec, secili: sec[0].tarih, sec: (tarih) => { state.start = tarih; save(); renderAll(); } };
      sonaGelince = () => arsivle(sec[0].tarih);
    }
    return hikayeAc(V, { son, sonaGelince, dosyaAdi: dosya(kaynak), basla });
  }
  return {
    bittiMi, veri,
    oynat,
    async resim(kaynak) { const V = veri(kaynak); if (V) return kaydet(await resimYap(V), `${dosya(kaynak)}.png`); },
    // tur bittiyse hikâyeyi kendiliğinden aç (izlenip arşivlenene kadar günde bir kez)
    bittiyse() {
      if (izle || !bittiMi()) return;
      const g = isoTarih(new Date()); if (state.ozetGoruldu === g) return;
      state.ozetGoruldu = g; save();
      oynat('tur');
    },
  };
}
