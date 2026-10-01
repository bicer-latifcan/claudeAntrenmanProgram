// Yumak'ın Mutfağı: günün öğün seçenekleri, "değiştir", küçük kontrol listesi, alışveriş listesi, notlar.
import { GRUPLAR, OGUNLER, DONGU, REYON, ILKELER, MITLER, TAKVIYELER, HEDEF, ALISMA, EKLER, ETIKET, DENGE, BESIN_KAYNAK, PMOS } from './mutfak-veri.js';
import { AYARLAR, TAKVIM } from './program.js';
import { hearts, sparkles, icon } from './fx.js';

const GUN = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const AY = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const SIRA = ['kahvalti', 'ara', 'aksam'];
const HARF = ['A', 'B', 'C', 'D'];
const SU_HEDEF = 8, SEBZE_HEDEF = 3, MEYVE_HEDEF = 2;
const TUR_AD = { kuvvet: 'Kuvvet günü', yuruyus: 'Yürüyüş günü', uzun: 'Uzun yürüyüş günü', aralikli: 'Aralıklı tempo günü', dinlenme: 'Dinlenme günü' };

export const isoTarih = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const gunNo = (d) => (d.getDay() + 6) % 7; // Pazartesi = 0
const gunEkle = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const bugun = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const ikonHtml = (ad, olcek = 3, cls = '') => { const c = icon(ad, olcek); c.className = `pix ${cls}`; c.setAttribute('aria-hidden', 'true'); return c.outerHTML.replace('<canvas', `<canvas data-ikon="${ad}" data-olcek="${olcek}"`); };

export function initMutfak({ state, save, izle }) {
  const kok = document.getElementById('sayfaMutfak');
  const M = state.mutfak || (state.mutfak = {});
  for (const k of ['gun', 'kontrol', 'liste']) if (!M[k] || typeof M[k] !== 'object') M[k] = {};
  let secili = bugun(), acikDegis = null, dengeUyari = null; // dengeUyari: { anahtar, metin } — ikinci dokunuşta yine de seçer
  const acikMit = new Set(), acikKcal = new Set(); // kalori gizli: protein çipine dokununca görünür

  /* ---------- hesaplar ---------- */
  function haftaTipi(d) { // iki haftalık döngü: ISO hafta numarası tek mi çift mi
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
    const hafta = Math.ceil(((t - Date.UTC(t.getUTCFullYear(), 0, 1)) / 864e5 + 1) / 7);
    return hafta % 2;
  }
  function programGunu(d) {
    const [y, m, g] = String(state.start).split('-').map(Number), bas = new Date(y, m - 1, g);
    const f = Math.round((d - bas) / 864e5);
    return f < 0 || f >= AYARLAR.haftaSayisi * 7 ? null : { ...TAKVIM[Math.floor(f / 7)][f % 7], hafta: Math.floor(f / 7) + 1 };
  }
  // alışma dönemi: sadece ilk turda, ilk haftalarda hedef yavaş yavaş 1500'e iner ("istersen ekle" önerileri)
  function alisma(d) {
    if (state.arsiv?.length) return null;
    const pg = programGunu(d); if (!pg) return null;
    return ALISMA.find((a) => a.haftalar.includes(pg.hafta)) || null;
  }
  const ekVar = (ogun, d) => !!(alisma(d)?.ekler.includes(ogun) && kayit(d)?.ek?.[ogun]);
  const kayit = (d) => M.gun[isoTarih(d)];
  const kayitYaz = (d) => { const k = (M.gun[isoTarih(d)] ||= { sec: {}, deg: {}, ofs: {} }); k.ek ||= {}; return k; };
  function gosterilen(ogun, d) {
    let liste = [...DONGU[ogun][haftaTipi(d)][gunNo(d)]];
    const S = OGUNLER[ogun].secenekler;
    if (ogun === 'ara' && programGunu(d)?.tur === 'kuvvet') { // antrenman günü: proteinli seçenekler önde
      const spor = Object.keys(S).filter((id) => S[id].spor);
      if (!liste.some((id) => S[id].spor)) liste[0] = spor[gunNo(d) % spor.length];
      liste.sort((a, b) => (S[b].spor ? 1 : 0) - (S[a].spor ? 1 : 0));
    }
    const ofs = kayit(d)?.ofs?.[ogun] || 0;
    const korunan = new Set();
    if (ogun === 'aksam' && !ofs) { // haftalık denge: eksik kalan grup varsa ve boş akşam azaldıysa, o yemek menüde olsun
      const acil = dengeAcil(d);
      const isine = (id) => acil.some((D) => secenekEtiket(id).has(D.e));
      for (const D of acil) {
        const var_ = liste.findIndex((id) => secenekEtiket(id).has(D.e));
        if (var_ >= 0) { korunan.add(var_); continue; }
        const aday = Object.keys(S).filter((id) => secenekEtiket(id).has(D.e) && !liste.includes(id));
        if (!aday.length) continue;
        let yer = -1; // sondan başla; başka bir eksiği karşılayan seçeneğin üstüne yazma
        for (let i = liste.length - 1; i >= 0; i--) if (!korunan.has(i) && !isine(liste[i])) { yer = i; break; }
        if (yer < 0) { liste.push(aday[gunNo(d) % aday.length]); korunan.add(liste.length - 1); } // yer yoksa bir seçenek daha
        else { liste[yer] = aday[gunNo(d) % aday.length]; korunan.add(yer); }
      }
    }
    if (!ofs) { // aynı gün tekrar olmasın: kahvaltıda yumurta seçildiyse ara öğün ve akşamda yumurtalı seçenek çıkmasın ("Başka göster" hepsini açar)
      const yasak = gunAnaSet(d, ogun), secim = kayit(d)?.sec?.[ogun];
      if (yasak.size) {
        const cakisir = (id) => (S[id].ana || []).some((a) => yasak.has(a));
        const kullanilan = new Set(liste);
        liste = liste.map((id, i) => {
          if (id === secim || korunan.has(i) || !cakisir(id)) return id;
          const aday = Object.keys(S).filter((x) => !cakisir(x) && !kullanilan.has(x));
          const spor = aday.filter((x) => S[x].spor);
          const sec = (S[id].spor && spor.length ? spor : aday)[(gunNo(d) + i) % Math.max(1, (S[id].spor && spor.length ? spor : aday).length)];
          if (!sec) return id;
          kullanilan.add(sec); return sec;
        });
      }
      return liste;
    }
    const havuz = [...liste, ...Object.keys(S).filter((id) => !liste.includes(id))];
    return liste.map((_, i) => havuz[(ofs * liste.length + i) % havuz.length]);
  }
  function kalemler(ogun, id, d) {
    const deg = kayit(d)?.deg || {};
    return OGUNLER[ogun].secenekler[id].kalem.map(([grup, v], s) => {
      const alt = deg[`${ogun}.${id}.${s}`] ?? v, g = GRUPLAR[grup][alt] || GRUPLAR[grup][v];
      return { grup, alt, ad: g.ad, gr: g.gr, al: g.al, p: g.p || 0, k: g.k || 0 };
    });
  }
  const geceKalem = (d) => GRUPLAR.gece[kayit(d)?.deg?.gece ?? 3];
  // haftalık denge: bir akşam yemeği hangi gruplara sayılır (değiştirilen kalemlerle)
  const etiketleri = (grup, alt) => { const e = ETIKET[grup]?.[alt]; return e ? [].concat(e) : []; };
  const secenekEtiket = (id, d = null) => (!OGUNLER.aksam.secenekler[id] ? new Set() : new Set((d ? kalemler('aksam', id, d) : OGUNLER.aksam.secenekler[id].kalem.map(([grup, alt]) => ({ grup, alt })))
    .flatMap((k) => etiketleri(k.grup, k.alt))));
  const haftaGunleri = (d) => { const pzt = gunEkle(d, -gunNo(d)); return Array.from({ length: 7 }, (_, i) => gunEkle(pzt, i)); };
  function haftaSay(d, haric = null) { // bu hafta seçilen akşamlarda hangi gruptan kaç gün
    const say = {};
    for (const g of haftaGunleri(d)) {
      if (haric && isoTarih(g) === isoTarih(haric)) continue;
      const id = kayit(g)?.sec?.aksam; if (!id || !OGUNLER.aksam.secenekler[id]) continue;
      for (const e of secenekEtiket(id, g)) say[e] = (say[e] || 0) + 1;
    }
    return say;
  }
  const listeYaz = (a) => (a.length > 1 ? `${a.slice(0, -1).join(', ')} ve ${a[a.length - 1]}` : a[0] || ''); // "a, b ve c"
  const TEKRAR = ['yumurta', 'peynir']; // aynı gün iki öğünde olmasın (yoğurt tekrar edebilir: günde 3 süt ürünü iyi)
  function gunAnaSet(d, haric) { // o gün diğer öğünlerde seçilenlerin ana malzemesi
    const set = new Set();
    for (const o of SIRA) {
      if (o === haric) continue;
      const id = kayit(d)?.sec?.[o], S = id && OGUNLER[o].secenekler[id];
      if (S) for (const a of S.ana || []) if (TEKRAR.includes(a)) set.add(a);
    }
    return set;
  }
  const bosAksam = (d, haric = null) => haftaGunleri(d).filter((g) => (!haric || isoTarih(g) !== isoTarih(haric)) && !OGUNLER.aksam.secenekler[kayit(g)?.sec?.aksam]);
  const eksikSay = (say) => DENGE.filter((D) => D.min).reduce((a, D) => a + Math.max(0, D.min - (say[D.e] || 0)), 0);
  function dengeAcil(d) { // eksikler, bu gün dışındaki boş akşamlara artık sığmıyorsa: bu günün menüsüne gelsin
    const say = haftaSay(d, d), eksik = eksikSay(say);
    if (!eksik || eksik < bosAksam(d, d).length) return [];
    return DENGE.filter((D) => D.min && (D.min - (say[D.e] || 0)) > 0);
  }
  // bu akşam seçilirse haftanın dengesi hâlâ kurulabilir mi? (sorun yoksa null)
  function dengeSorun(id, d) {
    const say = haftaSay(d, d), etiket = secenekEtiket(id, d);
    const katki = DENGE.some((D) => D.min && (say[D.e] || 0) < D.min && etiket.has(D.e)); // eksik bir grubu karşılıyor mu
    for (const e of etiket) say[e] = (say[e] || 0) + 1;
    const fazla = DENGE.find((D) => D.maks && (say[D.e] || 0) > D.maks);
    if (fazla) return `Bu seçimle bu hafta ${say[fazla.e]} akşam ${fazla.ad.toLowerCase()} olur; haftada ${fazla.metin} yeter.`;
    if (katki) return null; // eksiği kapatan seçim her zaman serbest
    const eksik = DENGE.filter((D) => D.min && (say[D.e] || 0) < D.min), bos = bosAksam(d, d).length;
    if (eksikSay(say) > bos) return `Bu seçimden sonra bu hafta ${bos ? `sadece ${bos} boş akşam kalıyor ama` : 'boş akşam kalmıyor ama'} ${listeYaz(eksik.map((D) => `${D.min - (say[D.e] || 0)} ${D.ad.toLowerCase()}`))} eksik.`;
    return null;
  }
  // yaklaşık besin değeri: seçenek (değiştirilen kalemlerle) ve günün seçilen öğünleri
  const besin = (ogun, id, d) => kalemler(ogun, id, d).reduce((a, k) => ({ p: a.p + k.p, k: a.k + k.k }), { p: 0, k: 0 });
  function gunBesin(d) {
    const sec = kayit(d)?.sec || {}; let p = 0, k = 0, n = 0;
    for (const o of SIRA) {
      if (sec[o] && OGUNLER[o].secenekler[sec[o]]) { const b = besin(o, sec[o], d); p += b.p; k += b.k; n++; }
      if (ekVar(o, d)) { p += EKLER[o].p; k += EKLER[o].k; }
    }
    if (kayit(d)?.geceYedi) { const g = geceKalem(d); p += g.p || 0; k += g.k || 0; }
    return { p: Math.round(p), k: Math.round(k / 10) * 10, n };
  }
  const yuvarla = (v) => Math.round(v), kcalYuvarla = (v) => Math.round(v / 10) * 10;
  function besinCip(anahtar, p, k, ek = '') { // protein yazar; dokununca (ya da üstüne gelince) kalori de görünür
    const acik = acikKcal.has(anahtar);
    return `<button type="button" class="m-besin${acik ? ' acik' : ''}" data-kcal="${anahtar}" data-ipucu="≈ ${kcalYuvarla(k)} kcal" aria-pressed="${acik}" title="Kaloriyi görmek için dokun">≈ ${yuvarla(p)} g protein${ek}${acik ? ` · ${kcalYuvarla(k)} kcal` : ''}</button>`;
  }

  /* ---------- çizim ---------- */
  function tarihBaslik(d) {
    const fark = Math.round((d - bugun()) / 864e5);
    const on = fark === 0 ? 'Bugün' : fark === 1 ? 'Yarın' : fark === -1 ? 'Dün' : GUN[gunNo(d)];
    return `${on} · ${fark === 0 || Math.abs(fark) === 1 ? GUN[gunNo(d)] + ' ' : ''}${d.getDate()} ${AY[d.getMonth()]}`;
  }
  function basKart(d) {
    const pg = programGunu(d), tur = pg?.tur;
    const ipucu = tur === 'kuvvet' ? 'Antrenmandan sonraki öğünde protein olsun. Akşam yemeğinden sonra 10 dakika yürüyüş programda.'
      : tur === 'dinlenme' ? 'Dinlenme günü: öğünler aynı, acele yok. Kısa bir yürüyüş yine iyi gelir.'
      : tur ? 'Yürüyüş günü: yürüyüşü yemekten sonraya koyarsan şekere de iyi gelir.' : 'Her gün aynı ilke: lifli karbonhidrat, her öğünde protein, bol sebze.';
    return `<section class="card m-bas" data-platform="card">
      <div class="m-bas-ust">
        <div>
          <p class="eyebrow">Yumak'ın Mutfağı</p>
          <h1>Bugün ne yesek?</h1>
        </div>
        <div class="m-tarih" role="group" aria-label="Gün seç">
          <button type="button" class="pbtn small" data-gun="-1" aria-label="Önceki gün">◀</button>
          <button type="button" class="pbtn small m-tarih-ad" data-gun="0" title="Bugüne dön">${tarihBaslik(d)}</button>
          <button type="button" class="pbtn small" data-gun="1" aria-label="Sonraki gün">▶</button>
        </div>
      </div>
      <p class="lede">Her öğünde ${gunNo(d) >= 5 ? '3' : '2'} kolay seçenek var; birini seç. Bir yiyecek evde yoksa ya da canın istemiyorsa yanındaki <b>değiştir</b>e bas, yerine eşdeğeri gelsin.</p>
      <div class="m-gun">${tur ? `<span class="chip strong ${tur === 'kuvvet' ? 't-A' : 't-' + tur}">${TUR_AD[tur]}</span>` : ''}<span class="m-gun-ipucu">${ipucu}</span></div>
      ${gunCubuk(d)}
    </section>`;
  }
  function gunCubuk(d) {
    const g = gunBesin(d), a = alisma(d), hedefK = a ? a.kcal : HEDEF.kcal, acik = acikKcal.has('gun');
    const oran = Math.min(1, g.p / HEDEF.protein);
    return `<div class="m-besin-gun">
      <div class="m-besin-ust"><span class="m-besin-baslik">Günün proteini</span>
        <button type="button" class="m-besin${acik ? ' acik' : ''}" data-kcal="gun" data-ipucu="≈ ${g.k} / ${hedefK} kcal" aria-pressed="${acik}" title="Kaloriyi görmek için dokun">≈ ${g.p} / ${HEDEF.protein} g${acik ? ` · ${g.k} / ${hedefK} kcal` : ''}</button></div>
      <div class="m-cubuk" role="progressbar" aria-label="Günün proteini" aria-valuemin="0" aria-valuemax="${HEDEF.protein}" aria-valuenow="${g.p}"><span style="width:${Math.round(oran * 100)}%"></span></div>
      <p class="m-besin-not">${g.n ? (g.p >= HEDEF.protein * 0.9 ? 'Protein hedefi tamam! Kasların teşekkür ediyor.' : 'Seçtiğin öğünlere göre. Öğün seçtikçe dolar.') : 'Öğün seçtikçe dolar. Hedef günde yaklaşık 100 gram.'}${a ? ` <b>${a.ad}:</b> hedef yavaş yavaş iniyor; kartlarda "istersen ekle" önerileri var.` : ''}</p>
    </div>`;
  }
  function ogunKart(ogun, d) {
    const O = OGUNLER[ogun], ids = gosterilen(ogun, d), sec = kayit(d)?.sec?.[ogun];
    const kuvvet = ogun === 'ara' && programGunu(d)?.tur === 'kuvvet';
    const gk = geceKalem(d);
    const gece = ogun === 'aksam' ? `<div class="m-gece"><span class="m-gece-bas">Gece acıkırsan <span class="m-gece-p">(≈ ${yuvarla(gk.p)} g protein)</span>:</span>${kalemSatir({ ad: gk.ad, gr: gk.gr, alt: kayit(d)?.deg?.gece ?? 3 }, 'gece', 'gece:gece:0')}<button type="button" class="m-tog m-gece-tog${kayit(d)?.geceYedi ? ' on' : ''}" data-geceyedi aria-pressed="${!!kayit(d)?.geceYedi}">Yedim (günün toplamına say)</button></div>` : '';
    const a = alisma(d), ekOn = a?.ekler.includes(ogun) ? !!kayit(d)?.ek?.[ogun] : null;
    const ek = ekOn == null ? '' : `<div class="m-ek"><span class="m-ek-bas">${a.ad}, istersen ekle:</span>
      <button type="button" class="m-tog${ekOn ? ' on' : ''}" data-ek="${ogun}" aria-pressed="${ekOn}">+ ${EKLER[ogun].ad} <span class="m-gr">(${EKLER[ogun].gr})</span></button></div>`;
    return `<article class="card m-ogun" data-platform="card" data-ogun="${ogun}">
      <header class="m-ogun-bas">${ikonHtml(O.ikon, 3, 'm-ogun-ikon')}<h2>${O.ad}</h2><span class="m-saat">${O.saat}</span></header>
      ${kuvvet ? '<p class="m-ipucu">Antrenman günü: proteinli seçenekler önde.</p>' : ''}
      <div class="m-secenekler">${ids.map((id, i) => secenekKart(ogun, id, i, sec === id, d, !!sec && ids.includes(sec) && sec !== id)).join('')}</div>
      ${ek}
      ${gece}
      <button type="button" class="m-baska" data-baska="${ogun}">${ids.length > 2 ? 'Hiçbiri olmadı mı?' : 'İkisi de olmadı mı?'} Başka göster ↻</button>
    </article>`;
  }
  function kalemSatir(k, grup, anahtar) {
    const acik = acikDegis === anahtar;
    const [, , s] = anahtar.split(':');
    const altlar = acik ? `<div class="m-altlar">${GRUPLAR[grup].map((g, i) => (i === k.alt ? '' : `<button type="button" class="m-alt" data-alt="${anahtar}:${i}">${g.ad}${g.gr ? ` <span class="m-gr">(${g.gr})</span>` : ''}${g.p != null ? ` <span class="m-alt-p">${yuvarla(g.p)} g protein</span>` : ''}</button>`)).join('')}</div>` : '';
    return `<span class="m-kalem"><span class="m-kalem-ad">${k.ad}${k.gr ? ` <span class="m-gr">(${k.gr})</span>` : ''}</span><button type="button" class="m-degis${acik ? ' on' : ''}" data-degis="${anahtar}" aria-expanded="${acik}" aria-label="${k.ad}: değiştir">${acik ? 'kapat' : 'değiştir'}</button></span>${altlar}`;
  }
  function secenekKart(ogun, id, i, on, d, kucuk = false) { // kucuk: başka bir seçenek seçildiyse sadece başlık
    const S = OGUNLER[ogun].secenekler[id];
    const uyari = dengeUyari?.anahtar === `${isoTarih(d)}:${ogun}:${id}` ? dengeUyari.metin : '';
    const satirlar = kalemler(ogun, id, d).map((k, s) => `<li>${kalemSatir(k, k.grup, `${ogun}:${id}:${s}`)}</li>`).join('');
    return `<div class="m-sec${on ? ' on' : ''}${kucuk ? ' kucuk' : ''}">
      <button type="button" class="m-sec-bas" data-sec="${ogun}:${id}" aria-pressed="${on}">
        <span class="m-harf">${HARF[i]}</span><span class="m-sec-ad">${S.ad}</span><span class="m-dk">${S.dk} dk</span>
        <span class="m-tik">${on ? 'Seçildi ✓ (bırakmak için dokun)' : uyari ? 'Yine de seç' : kucuk ? 'Buna geç' : 'Bunu seç'}</span>
      </button>
      ${uyari ? `<p class="m-denge-dur"><b>Haftalık denge:</b> ${uyari} Başka bir seçenek seç ya da yine de seçmek için başlığa tekrar dokun.</p>` : ''}
      ${kucuk ? '' : `<div class="m-sec-besin">${(() => { const b = besin(ogun, id, d); return besinCip(`${ogun}:${id}`, b.p, b.k); })()}${ogun === 'aksam' ? dengeRozet(id, d) : ''}</div>
      <ul class="m-kalemler">${satirlar}</ul>${S.not ? `<p class="m-not">${S.not}</p>` : ''}${S.neden ? `<p class="m-neden"><b>Neden bu?</b> ${S.neden}</p>` : ''}`}
    </div>`;
  }
  function dengeRozet(id, d) {
    const acil = dengeAcil(d).filter((D) => secenekEtiket(id, d).has(D.e));
    return acil.length ? `<span class="m-denge-rozet">Haftalık denge: bu hafta ${acil.map((D) => D.ad.toLowerCase()).join(' ve ')} eksik</span>` : '';
  }
  function dengeKart(d) {
    const say = haftaSay(d), hafta = haftaGunleri(d), secili = hafta.filter((g) => OGUNLER.aksam.secenekler[kayit(g)?.sec?.aksam]).length;
    const satir = DENGE.map((D) => {
      const n = say[D.e] || 0;
      if (D.bilgi) return `<li class="m-denge-satir bilgi"><span class="m-denge-ad">${D.ad}</span><span class="m-denge-say">${n} akşam</span><span class="m-denge-neden">${D.neden}</span></li>`;
      const tamam = n >= D.min && (!D.maks || n <= D.maks), fazla = D.maks && n > D.maks;
      const nokta = Array.from({ length: Math.max(D.maks || D.min, n) }, (_, i) => `<i class="${i < n ? (fazla && i >= D.maks ? 'fazla' : 'dolu') : ''}"></i>`).join('');
      return `<li class="m-denge-satir${tamam ? ' tamam' : ''}${fazla ? ' fazla' : ''}"><span class="m-denge-ad">${D.ad}</span><span class="m-denge-nokta" aria-hidden="true">${nokta}</span>
        <span class="m-denge-say">${n} / ${D.metin}${tamam ? ' ✓' : ''}</span><span class="m-denge-neden">${D.neden}</span></li>`;
    }).join('');
    const eksik = DENGE.filter((D) => D.min && (say[D.e] || 0) < D.min), fazla = DENGE.filter((D) => D.maks && (say[D.e] || 0) > D.maks);
    const bos = bosAksam(d), eksikMetin = listeYaz(eksik.map((D) => `${D.min - (say[D.e] || 0)} ${D.ad.toLowerCase()}`));
    const gunAdi = (g) => `<button type="button" class="m-gun-link" data-gotur="${isoTarih(g)}">${GUN[gunNo(g)]}</button>`;
    const degisecek = hafta.filter((g) => { const id = kayit(g)?.sec?.aksam; return id && OGUNLER.aksam.secenekler[id] && ![...secenekEtiket(id, g)].some((e) => eksik.some((D) => D.e === e)); });
    const yorum = !secili ? 'Akşam yemeği seçtikçe burada sayılır. Haftada 2 balık, 2–3 baklagil ve 1–2 kırmızı et hedefi var; dengeyi bozan bir seçim yaparsan seni uyarırım.'
      : fazla.length ? `Bu hafta ${fazla.map((D) => D.ad.toLowerCase()).join(', ')} fazla oldu. Şu günlerden birini değiştir: ${hafta.filter((g) => [...secenekEtiket(kayit(g)?.sec?.aksam || '', g)].some((e) => fazla.some((D) => D.e === e))).map(gunAdi).join(', ')}.`
      : eksik.length && !bos.length ? `<b>Bu hafta dengesiz:</b> ${eksikMetin} eksik ve boş akşam kalmadı. Şu günlerden birinin akşamını değiştir: ${degisecek.map(gunAdi).join(', ')}.`
      : eksik.length ? `Bu hafta ${eksikMetin} daha lazım. Boş ${bos.length} akşamın var (${bos.map(gunAdi).join(', ')}); yer daraldıkça bu yemekleri o günlerin menüsüne rozetle koyuyorum.`
      : 'Bu haftanın dengesi tamam! Balık, baklagil, et: hepsi yerinde. Mrrr.';
    return `<section class="card m-denge" data-platform="card">
      <div class="m-denge-bas"><h2 class="h-small">Haftalık denge</h2><span class="muted">${tarihKisa(hafta[0])} – ${tarihKisa(hafta[6])} · seçilen ${secili}/7 akşam</span></div>
      <ul class="m-denge-liste">${satir}</ul>
      <p class="m-yorum"><b>Yumak:</b> ${yorum}</p>
    </section>`;
  }
  const tarihKisa = (d) => `${d.getDate()} ${AY[d.getMonth()]}`;
  function kontrolKart(d) {
    const k = M.kontrol[isoTarih(d)] || {}, su = k.su || 0, sebze = k.sebze || 0, meyve = k.meyve || 0, pr = k.protein || [false, false, false];
    const hedefler = [su >= SU_HEDEF, sebze >= SEBZE_HEDEF, meyve >= MEYVE_HEDEF, pr.every(Boolean), !!k.seker, !!k.yuru];
    const n = hedefler.filter(Boolean).length;
    const yorum = n === hedefler.length ? 'Hepsi tamam! Bugün mutfağın yıldızısın. Mrrr.' : n >= 3 ? 'Az kaldı! Bir iki küçük şey daha.' : n >= 1 ? 'Güzel başladık. Bir bardak su daha?' : 'Liste boş duruyor. İlk bardak suyla başlayalım mı?';
    const bardak = Array.from({ length: SU_HEDEF }, (_, i) => `<button type="button" class="m-ikon-btn${i < su ? ' dolu' : ''}" data-su="${i + 1}" aria-label="${i + 1}. bardak">${ikonHtml('bardak', 3)}</button>`).join('');
    const yaprak = Array.from({ length: SEBZE_HEDEF }, (_, i) => `<button type="button" class="m-ikon-btn${i < sebze ? ' dolu' : ''}" data-sebze="${i + 1}" aria-label="${i + 1}. kez sebze">${ikonHtml('yaprak', 3)}</button>`).join('');
    const elma = Array.from({ length: MEYVE_HEDEF + 1 }, (_, i) => `<button type="button" class="m-ikon-btn${i < meyve ? ' dolu' : ''}" data-meyve="${i + 1}" aria-label="${i + 1}. meyve">${ikonHtml('elma', 3)}</button>`).join('');
    const pro = ['Kahvaltı', 'Ara öğün', 'Akşam'].map((ad, i) => `<button type="button" class="m-tog${pr[i] ? ' on' : ''}" data-protein="${i}" aria-pressed="${!!pr[i]}">${ikonHtml('yumurtaI', 2)}${ad}</button>`).join('');
    return `<section class="card m-kontrol" data-platform="card">
      <h2 class="h-small">Bugünün küçük listesi</h2>
      <div class="m-k-satir"><span class="m-k-ad">Su</span><span class="m-ikonlar">${bardak}</span><span class="m-k-say">${su}/${SU_HEDEF} bardak</span></div>
      <p class="m-k-not">1 su bardağı ≈ 200 ml. Hedef 8–10 bardak ≈ 1,6–2 litre (antrenman ve sıcak günlerde 10); şu an ≈ ${ondalik(su * 0.2)} L. Çay ve kahve buna dahil değil.</p>
      <div class="m-k-satir"><span class="m-k-ad">Sebze</span><span class="m-ikonlar">${yaprak}</span><span class="m-k-say">${sebze}/${SEBZE_HEDEF} kez</span></div>
      <p class="m-k-not">1 kez = 1 porsiyon sebze (≈ 150 g). Örnek: kahvaltıdaki domates-salatalık tabağı, akşamki 1 kase salata, 6 yemek kaşığı sebze yemeği (taze fasulye, ıspanak, brokoli…) ya da sebzeli çorba. Üçü bir günde = tamam.</p>
      <div class="m-k-satir"><span class="m-k-ad">Meyve</span><span class="m-ikonlar">${elma}</span><span class="m-k-say">${meyve}/${MEYVE_HEDEF}–3 porsiyon</span></div>
      <p class="m-k-not">1 porsiyon = 1 orta elma, armut ya da portakal, 2 mandalina, 1 küçük muz ya da 1 küçük kase nar, çilek, üzüm (≈ 150 g). Meyve suyu sayılmaz.</p>
      <div class="m-k-satir"><span class="m-k-ad">Protein</span><span class="m-togs">${pro}</span></div>
      <div class="m-k-satir m-k-iki">
        <button type="button" class="m-tog${k.seker ? ' on' : ''}" data-tog="seker" aria-pressed="${!!k.seker}">Şekerli içecek içmedim</button>
        <button type="button" class="m-tog${k.yuru ? ' on' : ''}" data-tog="yuru" aria-pressed="${!!k.yuru}">Yemekten sonra 10 dk yürüdüm</button>
      </div>
      <p class="m-yorum"><b>Yumak:</b> ${yorum}</p>
    </section>`;
  }
  function alisveris(d0) {
    const urunler = new Map();
    for (let i = 0; i < 7; i++) {
      const d = gunEkle(d0, i);
      for (const ogun of SIRA) { // sadece seçilen öğünler (seçilmeyen gün listeye girmez)
        const id = kayit(d)?.sec?.[ogun];
        if (!id || !OGUNLER[ogun].secenekler[id]) continue;
        for (const k of [...kalemler(ogun, id, d), ...(ekVar(ogun, d) ? [EKLER[ogun]] : [])]) for (const [urun, mik, birim, reyon] of k.al) {
        const ad = urunler.has(urun) && urunler.get(urun).birim && birim && urunler.get(urun).birim !== birim ? `${urun} (${birim})` : urun;
        const u = urunler.get(ad) || { reyon, mik: 0, birim, ogun: 0 };
        u.ogun++; if (mik != null) { u.mik += mik; u.birim = birim; }
        urunler.set(ad, u);
        }
      }
    }
    return urunler;
  }
  const ondalik = (v) => v.toLocaleString('tr-TR', { maximumFractionDigits: 1 });
  function miktarYazi(u) { // toplam: gram, mililitre, adet ya da demet
    if (!u.mik) return `${u.ogun} öğünde`;
    if (u.birim === 'g') return u.mik >= 1000 ? `${ondalik(Math.round(u.mik / 50) * 50 / 1000)} kg` : `${Math.round(u.mik / 10) * 10} g`;
    if (u.birim === 'ml') return u.mik >= 1000 ? `${ondalik(Math.round(u.mik / 100) * 100 / 1000)} L` : `${Math.round(u.mik / 10) * 10} ml`;
    if (u.birim === 'demet') return `${Math.max(1, Math.ceil(u.mik))} demet`;
    return `${Math.ceil(u.mik)} adet`;
  }
  function listeKapsam(d0) { // listeye giren günler ve yarım seçilmiş günler için uyarı
    const OGUN_AD = { kahvalti: 'kahvaltı', ara: 'ara öğün', aksam: 'akşam yemeği' };
    const ad = (d, i) => (i === 0 ? `Bugün (${GUN[gunNo(d)]})` : i === 1 ? `Yarın (${GUN[gunNo(d)]})` : `${GUN[gunNo(d)]} ${d.getDate()} ${AY[d.getMonth()]}`);
    const gunler = Array.from({ length: 7 }, (_, i) => {
      const d = gunEkle(d0, i), sec = SIRA.filter((o) => { const id = kayit(d)?.sec?.[o]; return id && OGUNLER[o].secenekler[id]; });
      return { d, i, sec, eksik: SIRA.filter((o) => !sec.includes(o)) };
    });
    const dolu = gunler.filter((g) => g.sec.length), yarim = dolu.filter((g) => g.eksik.length), hic = gunler.filter((g) => !g.sec.length);
    const gunBtn = (g) => `<button type="button" class="m-gun-link" data-gotur="${isoTarih(g.d)}">${ad(g.d, g.i)}</button>`;
    const son = gunEkle(d0, 6);
    const kapsam = `<p class="m-liste-kapsam">Bugünün öğünleri dahil 7 gün: <b>${d0.getDate()} ${AY[d0.getMonth()]} – ${son.getDate()} ${AY[son.getMonth()]}</b>.${dolu.length ? ` Listede ${dolu.length} günün seçimleri var: ${dolu.map(gunBtn).join(', ')}.` : ''}</p>`;
    // denge: bu 7 günde seçilen akşamlar
    const say = {}; let tavukG = 0, aksamN = 0;
    for (const g of gunler) {
      const id = kayit(g.d)?.sec?.aksam; if (!OGUNLER.aksam.secenekler[id]) continue;
      aksamN++;
      for (const e of secenekEtiket(id, g.d)) say[e] = (say[e] || 0) + 1;
      for (const k of kalemler('aksam', id, g.d)) for (const [urun, mik, birim] of k.al) if (/^Tavuk/.test(urun) && birim === 'g') tavukG += mik;
    }
    const sorunlar = [];
    if (aksamN >= 4) {
      for (const D of DENGE) if (D.min && (say[D.e] || 0) < D.min) sorunlar.push(`${D.ad.toLowerCase()} ${say[D.e] || 0} (hedef ${D.metin})`);
      for (const D of DENGE) if (D.maks && (say[D.e] || 0) > D.maks) sorunlar.push(`${D.ad.toLowerCase()} ${say[D.e]} (en fazla ${D.maks})`);
    }
    const tavukN = say.tavuk || 0;
    const denge = sorunlar.length ? `<div class="m-liste-denge" role="status"><b>Dengesiz liste:</b> seçilen ${aksamN} akşamda ${sorunlar.join(', ')}${tavukN >= 4 ? `; ${tavukN} akşam tavuk${tavukG ? ` (≈ ${tavukG >= 1000 ? `${ondalik(tavukG / 1000)} kg` : `${Math.round(tavukG / 10) * 10} g`})` : ''}` : ''}. Birkaç tavuk akşamını balık ya da baklagille değiştir; Haftalık denge kartı yardım eder.</div>` : '';
    const uyari = yarim.length || hic.length ? `<ul class="m-liste-uyari" role="status">${yarim.map((g) => `<li><b>Dikkat:</b> ${gunBtn(g)} için ${g.eksik.map((o) => OGUN_AD[o]).join(' ve ')} seçilmedi; listede ${g.eksik.length > 1 ? 'bunlar' : 'bu'} yok.</li>`).join('')}${hic.length && dolu.length ? `<li><b>Hiç seçim yok:</b> ${hic.map(gunBtn).join(', ')}. Bu günlerin malzemesi listede değil.</li>` : ''}</ul>` : '';
    return kapsam + denge + uyari;
  }
  function listeKart() {
    const d0 = bugun(), anahtar = isoTarih(d0), tikli = M.liste[anahtar] || {}, urunler = alisveris(d0);
    const gruplar = Object.entries(REYON).map(([r, ad]) => {
      const satir = [...urunler].filter(([, u]) => u.reyon === r).sort((a, b) => a[0].localeCompare(b[0], 'tr'));
      if (!satir.length) return '';
      return `<div class="m-reyon"><h3>${ad}</h3><ul>${satir.map(([urun, u]) => `<li><label class="m-liste-satir${tikli[urun] ? ' tikli' : ''}"><input type="checkbox" data-tik="${urun}"${tikli[urun] ? ' checked' : ''}><span>${urun}</span><span class="m-miktar">${miktarYazi(u)}</span></label></li>`).join('')}</ul></div>`;
    }).join('');
    return `<section class="card m-liste" data-platform="card">
      <div class="m-liste-bas">
        <div><h2 class="h-small">Alışveriş listesi</h2><p class="muted">Sadece seçtiğin öğünler sayılır. Et, tavuk ve balık çiğ ağırlıkla; bulgur, mercimek, nohut ve makarna kuru ağırlıkla yazılı.</p></div>
        <div class="row-end"><button type="button" class="pbtn small" data-kopyala>Listeyi kopyala</button><button type="button" class="pbtn small ghost" data-temizle>Tikleri temizle</button><button type="button" class="pbtn small ghost" data-secimsil>Seçimleri temizle</button></div>
      </div>
      ${listeKapsam(d0)}
      ${urunler.size ? `<div class="m-reyonlar">${gruplar}</div>` : '<p class="m-liste-bos">Henüz öğün seçmedin. Önümüzdeki günlerde "Bunu seç"e bastıkça liste kendiliğinden dolar; günleri üstteki oklarla değiştirebilirsin.</p>'}
      <p class="muted m-hep">Evde hep olsun: zeytinyağı, limon, tarçın, karabiber, kimyon, pul biber, yeşil çay, nane çayı.</p>
    </section>`;
  }
  function pmosKart() {
    return `<details class="card m-pmos" data-platform="card">
      <summary><span class="eyebrow">Neden bu menü?</span><span class="h-small m-pmos-baslik">PMOS ve bu menü</span><span class="m-pmos-ok" aria-hidden="true">▼</span></summary>
      <p class="lede-kucuk">${PMOS.giris}</p>
      ${PMOS.bolumler.map((b) => `<h3 class="m-alt-baslik">${b.baslik}</h3>${b.metin ? `<p>${b.metin}</p>` : ''}${b.liste ? `<ul class="m-pmos-liste">${b.liste.map(([k, t]) => `<li><b>${k}</b> ${t}</li>`).join('')}</ul>` : ''}`).join('')}
    </details>`;
  }
  function notlarKart() {
    return `<section class="card m-notlar" data-platform="card">
      <h2 class="h-small">Yumak'ın beslenme notları</h2>
      <div class="m-ilkeler">${ILKELER.map((x) => `<div class="m-ilke"><b>${x.b}</b><p>${x.t}</p></div>`).join('')}</div>
      <h3 class="m-alt-baslik">Vitaminler ve mineraller nereden geliyor?</h3>
      <ul class="m-kaynak">${BESIN_KAYNAK.map((x) => `<li><b>${x.b}:</b> ${x.t}</li>`).join('')}</ul>
      <h3 class="m-alt-baslik">Mit mi, gerçek mi?</h3>
      <div class="m-mitler">${MITLER.map((x, i) => `<button type="button" class="m-mit${acikMit.has(i) ? ' acik' : ''}" data-mit="${i}" aria-expanded="${acikMit.has(i)}">
        <span class="m-mit-s">"${x.s}"</span>${acikMit.has(i) ? `<span class="m-mit-c ${x.c === 'Gerçek' ? 'g' : x.c === 'Kısmen' ? 'k' : 'm'}">${x.c}</span><span class="m-mit-t">${x.t}</span>` : '<span class="m-mit-ipucu">Dokun, Yumak söylesin</span>'}</button>`).join('')}</div>
      <details class="sources"><summary>Takviyeler hakkında</summary><ul class="m-takviye">${TAKVIYELER.map((x) => `<li><b>${x.b}:</b> ${x.t}</li>`).join('')}</ul></details>
      <details class="sources"><summary>Kaynaklar</summary><ul>
        <li><a href="https://academic.oup.com/jcem/article/108/10/2447/7242360" target="_blank" rel="noopener">2023 Uluslararası Kanıta Dayalı PCOS Kılavuzu (JCEM)</a></li>
        <li><a href="https://hsgm.saglik.gov.tr/depo/birimler/saglikli-beslenme-ve-hareketli-hayat-db/Dokumanlar/Rehberler/Turkiye_Beslenme_Rehber_TUBER_2022_min.pdf" target="_blank" rel="noopener">Türkiye Beslenme Rehberi (TÜBER 2022)</a></li>
        <li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC9841505/" target="_blank" rel="noopener">Cowan ve ark. 2023: PCOS'ta yaşam tarzı yönetimi</a></li>
        <li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC10885527/" target="_blank" rel="noopener">Juhász ve ark. 2024: PCOS'ta diyetlerin karşılaştırması</a></li>
      </ul></details>
    </section>`;
  }

  function ciz() {
    const d = secili;
    kok.innerHTML = basKart(d)
      + `<div class="m-ogunler">${SIRA.map((o) => ogunKart(o, d)).join('')}</div>`
      + dengeKart(d)
      + `<div class="m-alt-izgara">${kontrolKart(d)}${listeKart()}</div>`
      + notlarKart()
      + pmosKart();
    for (const c of kok.querySelectorAll('canvas[data-ikon]')) { // outerHTML ile kopyalanan tuvaller boş gelir: yeniden çiz
      const yeni = icon(c.dataset.ikon, +c.dataset.olcek); yeni.className = c.className; yeni.setAttribute('aria-hidden', 'true'); c.replaceWith(yeni);
    }
  }

  /* ---------- kayıt ---------- */
  function kaydet() {
    // eski öğün seçimleri 60 günde, alışveriş tikleri 2 haftada silinir; günlük liste geçmişi 400 gün saklanır (bir yıl rahat sığar)
    const sinir = isoTarih(gunEkle(bugun(), -60)), kontrolSinir = isoTarih(gunEkle(bugun(), -400)), listeSinir = isoTarih(gunEkle(bugun(), -14));
    for (const k of Object.keys(M.gun)) if (k < sinir) delete M.gun[k];
    for (const k of Object.keys(M.kontrol)) if (k < kontrolSinir) delete M.kontrol[k];
    for (const k of Object.keys(M.liste)) if (k < listeSinir) delete M.liste[k];
    save();
  }
  const yumakSoylesin = (metin) => window.dispatchEvent(new CustomEvent('yumak', { detail: { type: 'konus', metin } }));

  /* ---------- etkileşim ---------- */
  kok.addEventListener('click', (e) => {
    const b = e.target.closest('button, input'); if (!b) return;
    const ds = b.dataset, d = secili, r = b.getBoundingClientRect();
    if (ds.gun != null) { const n = +ds.gun; secili = n === 0 ? bugun() : gunEkle(secili, n); acikDegis = null; dengeUyari = null; ciz(); return; }
    if (ds.gotur) { const [y, m, g] = ds.gotur.split('-').map(Number); secili = new Date(y, m - 1, g); acikDegis = null; ciz(); kok.scrollIntoView({ block: 'start' }); return; }
    if (ds.mit != null) { const i = +ds.mit; if (acikMit.has(i)) acikMit.delete(i); else acikMit.add(i); ciz(); return; }
    if (ds.degis) { acikDegis = acikDegis === ds.degis ? null : ds.degis; ciz(); return; }
    if (ds.kopyala != null) { listeKopyala(b); return; }
    if (ds.kcal) { if (acikKcal.has(ds.kcal)) acikKcal.delete(ds.kcal); else acikKcal.add(ds.kcal); ciz(); return; }
    if (izle) return; // izleme modunda hiçbir şey değişmez
    if (ds.geceyedi != null) { const k = kayitYaz(d); k.geceYedi = !k.geceYedi; kaydet(); ciz(); return; }
    if (ds.ek) { const k = kayitYaz(d); k.ek[ds.ek] = !k.ek[ds.ek]; if (k.ek[ds.ek]) sparkles(r.left + r.width / 2, r.top, 3); kaydet(); ciz(); return; }
    if (ds.sec) {
      const [ogun, id] = ds.sec.split(':'), anahtar = `${isoTarih(d)}:${ogun}:${id}`;
      if (kayit(d)?.sec?.[ogun] !== id && ogun === 'aksam') { // haftalık denge kontrolü
        const sorun = dengeSorun(id, d);
        if (sorun && dengeUyari?.anahtar !== anahtar) { dengeUyari = { anahtar, metin: sorun }; ciz(); yumakSoylesin('Dur bir saniye! Bu seçim haftanın dengesini bozuyor, kartta yazdım.'); return; }
      }
      dengeUyari = null;
      const k = kayitYaz(d);
      if (k.sec[ogun] === id) delete k.sec[ogun]; else {
        k.sec[ogun] = id; sparkles(r.left + r.width / 2, r.top + 10, 4);
        if (ogun === 'aksam' && (haftaSay(d).tavuk || 0) >= 5) yumakSoylesin('Bu hafta tavuk çok sevildi! Kalan günlerde bir balık ya da baklagil iyi gelir.');
      }
      kaydet(); ciz(); return;
    }
    if (ds.alt) {
      const [ogun, id, s, i] = ds.alt.split(':'), k = kayitYaz(d);
      if (ogun === 'gece') k.deg.gece = +i; else k.deg[`${ogun}.${id}.${s}`] = +i;
      acikDegis = null; kaydet(); ciz(); return;
    }
    if (ds.baska) { const k = kayitYaz(d); k.ofs[ds.baska] = (k.ofs[ds.baska] || 0) + 1; acikDegis = null; kaydet(); ciz(); return; }
    const kk = (M.kontrol[isoTarih(d)] ||= {});
    if (ds.su) {
      const n = +ds.su; kk.su = (kk.su || 0) === n ? n - 1 : n;
      if (kk.su >= SU_HEDEF && n === SU_HEDEF) { hearts(r.left, r.top, 3); yumakSoylesin('8 bardak! Sen bir su perisisin. Ben de bir kap içtim, kutlama olsun.'); }
      kaydet(); ciz(); return;
    }
    if (ds.meyve) { const n = +ds.meyve; kk.meyve = (kk.meyve || 0) === n ? n - 1 : n; if (kk.meyve >= MEYVE_HEDEF) sparkles(r.left, r.top, 4); kaydet(); ciz(); return; }
    if (ds.sebze) { const n = +ds.sebze; kk.sebze = (kk.sebze || 0) === n ? n - 1 : n; if (kk.sebze >= SEBZE_HEDEF) sparkles(r.left, r.top, 4); kaydet(); ciz(); return; }
    if (ds.protein != null) { const i = +ds.protein; kk.protein = kk.protein || [false, false, false]; kk.protein[i] = !kk.protein[i]; kaydet(); ciz(); return; }
    if (ds.tog) { kk[ds.tog] = !kk[ds.tog]; if (kk[ds.tog]) sparkles(r.left + r.width / 2, r.top, 3); kaydet(); ciz(); return; }
    if (ds.temizle != null) { delete M.liste[isoTarih(bugun())]; kaydet(); ciz(); return; }
    if (ds.secimsil != null) { // bugünden itibaren 7 günün öğün seçimleri ve değişiklikleri silinir (geçmiş günler kalır)
      if (b.dataset.emin !== '1') { b.dataset.emin = '1'; b.textContent = 'Emin misin? 7 günün seçimleri silinecek'; return; }
      for (let i = 0; i < 7; i++) delete M.gun[isoTarih(gunEkle(bugun(), i))];
      kaydet(); ciz(); yumakSoylesin('Tertemiz! Bu haftayı baştan seçebilirsin.'); return;
    }
    if (ds.tik) { const a = isoTarih(bugun()), l = (M.liste[a] ||= {}); if (b.checked) l[ds.tik] = true; else delete l[ds.tik]; kaydet(); b.closest('.m-liste-satir').classList.toggle('tikli', b.checked); }
  });
  async function listeKopyala(btn) {
    const urunler = alisveris(bugun());
    const metin = ['Alışveriş listesi (Yumak\'ın Mutfağı)'].concat(Object.entries(REYON).flatMap(([r, ad]) => {
      const s = [...urunler].filter(([, u]) => u.reyon === r).sort((a, b) => a[0].localeCompare(b[0], 'tr'));
      return s.length ? ['', ad.toUpperCase(), ...s.map(([urun, u]) => `- ${urun} (${miktarYazi(u)})`)] : [];
    })).join('\n');
    try { await navigator.clipboard.writeText(metin); btn.textContent = 'Kopyalandı!'; }
    catch { btn.textContent = 'Kopyalanamadı'; }
    setTimeout(() => { btn.textContent = 'Listeyi kopyala'; }, 2200);
  }

  return { ciz, git: (d) => { secili = d || bugun(); acikDegis = null; ciz(); } };
}
