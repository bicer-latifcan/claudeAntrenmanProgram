// Yumak'ın Mutfağı: günün öğün seçenekleri, "değiştir", küçük kontrol listesi, alışveriş listesi, notlar.
import { GRUPLAR, OGUNLER, DONGU, REYON, ILKELER, MITLER, TAKVIYELER } from './mutfak-veri.js';
import { AYARLAR, TAKVIM } from './program.js';
import { hearts, sparkles, icon } from './fx.js';

const GUN = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const AY = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const SIRA = ['kahvalti', 'ara', 'aksam'];
const HARF = ['A', 'B', 'C'];
const SU_HEDEF = 8, SEBZE_HEDEF = 3;
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
  let secili = bugun(), acikDegis = null;
  const acikMit = new Set();

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
    return f < 0 || f >= AYARLAR.haftaSayisi * 7 ? null : TAKVIM[Math.floor(f / 7)][f % 7];
  }
  const kayit = (d) => M.gun[isoTarih(d)];
  const kayitYaz = (d) => (M.gun[isoTarih(d)] ||= { sec: {}, deg: {}, ofs: {} });
  function gosterilen(ogun, d) {
    let liste = [...DONGU[ogun][haftaTipi(d)][gunNo(d)]];
    const S = OGUNLER[ogun].secenekler;
    if (ogun === 'ara' && programGunu(d)?.tur === 'kuvvet') { // antrenman günü: proteinli seçenekler önde
      const spor = Object.keys(S).filter((id) => S[id].spor);
      if (!liste.some((id) => S[id].spor)) liste[0] = spor[gunNo(d) % spor.length];
      liste.sort((a, b) => (S[b].spor ? 1 : 0) - (S[a].spor ? 1 : 0));
    }
    const ofs = kayit(d)?.ofs?.[ogun] || 0;
    if (!ofs) return liste;
    const havuz = [...liste, ...Object.keys(S).filter((id) => !liste.includes(id))];
    return liste.map((_, i) => havuz[(ofs * liste.length + i) % havuz.length]);
  }
  const secilen = (ogun, d) => kayit(d)?.sec?.[ogun] || gosterilen(ogun, d)[0];
  function kalemler(ogun, id, d) {
    const deg = kayit(d)?.deg || {};
    return OGUNLER[ogun].secenekler[id].kalem.map(([grup, v], s) => {
      const alt = deg[`${ogun}.${id}.${s}`] ?? v, g = GRUPLAR[grup][alt] || GRUPLAR[grup][v];
      return { grup, alt, ad: g.ad, al: g.al };
    });
  }
  const geceKalem = (d) => GRUPLAR.gece[kayit(d)?.deg?.gece ?? 0];

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
    </section>`;
  }
  function ogunKart(ogun, d) {
    const O = OGUNLER[ogun], ids = gosterilen(ogun, d), sec = kayit(d)?.sec?.[ogun];
    const kuvvet = ogun === 'ara' && programGunu(d)?.tur === 'kuvvet';
    const gece = ogun === 'aksam' ? `<div class="m-gece"><span class="m-gece-bas">Gece acıkırsan:</span>${kalemSatir({ ad: geceKalem(d).ad, alt: kayit(d)?.deg?.gece ?? 0 }, 'gece', 'gece:gece:0')}</div>` : '';
    return `<article class="card m-ogun" data-platform="card" data-ogun="${ogun}">
      <header class="m-ogun-bas">${ikonHtml(O.ikon, 3, 'm-ogun-ikon')}<h2>${O.ad}</h2><span class="m-saat">${O.saat}</span></header>
      ${kuvvet ? '<p class="m-ipucu">Antrenman günü: proteinli seçenekler önde.</p>' : ''}
      <div class="m-secenekler">${ids.map((id, i) => secenekKart(ogun, id, i, sec === id, d, !!sec && ids.includes(sec) && sec !== id)).join('')}</div>
      ${gece}
      <button type="button" class="m-baska" data-baska="${ogun}">${ids.length > 2 ? 'Hiçbiri olmadı mı?' : 'İkisi de olmadı mı?'} Başka göster ↻</button>
    </article>`;
  }
  function kalemSatir(k, grup, anahtar) {
    const acik = acikDegis === anahtar;
    const [, , s] = anahtar.split(':');
    const altlar = acik ? `<div class="m-altlar">${GRUPLAR[grup].map((g, i) => (i === k.alt ? '' : `<button type="button" class="m-alt" data-alt="${anahtar}:${i}">${g.ad}</button>`)).join('')}</div>` : '';
    return `<span class="m-kalem"><span class="m-kalem-ad">${k.ad}</span><button type="button" class="m-degis${acik ? ' on' : ''}" data-degis="${anahtar}" aria-expanded="${acik}" aria-label="${k.ad}: değiştir">${acik ? 'kapat' : 'değiştir'}</button></span>${altlar}`;
  }
  function secenekKart(ogun, id, i, on, d, kucuk = false) { // kucuk: başka bir seçenek seçildiyse sadece başlık
    const S = OGUNLER[ogun].secenekler[id];
    const satirlar = kalemler(ogun, id, d).map((k, s) => `<li>${kalemSatir(k, k.grup, `${ogun}:${id}:${s}`)}</li>`).join('');
    return `<div class="m-sec${on ? ' on' : ''}${kucuk ? ' kucuk' : ''}">
      <button type="button" class="m-sec-bas" data-sec="${ogun}:${id}" aria-pressed="${on}">
        <span class="m-harf">${HARF[i]}</span><span class="m-sec-ad">${S.ad}</span><span class="m-dk">${S.dk} dk</span>
        <span class="m-tik">${on ? 'Seçildi ✓ (bırakmak için dokun)' : kucuk ? 'Buna geç' : 'Bunu seç'}</span>
      </button>
      ${kucuk ? '' : `<ul class="m-kalemler">${satirlar}</ul>${S.not ? `<p class="m-not">${S.not}</p>` : ''}`}
    </div>`;
  }
  function kontrolKart(d) {
    const k = M.kontrol[isoTarih(d)] || {}, su = k.su || 0, sebze = k.sebze || 0, pr = k.protein || [false, false, false];
    const hedefler = [su >= SU_HEDEF, sebze >= SEBZE_HEDEF, pr.every(Boolean), !!k.seker, !!k.yuru];
    const n = hedefler.filter(Boolean).length;
    const yorum = n === 5 ? 'Beşte beş! Bugün mutfağın yıldızısın. Mrrr.' : n >= 3 ? 'Az kaldı! Bir iki küçük şey daha.' : n >= 1 ? 'Güzel başladık. Bir bardak su daha?' : 'Liste boş duruyor. İlk bardak suyla başlayalım mı?';
    const bardak = Array.from({ length: SU_HEDEF }, (_, i) => `<button type="button" class="m-ikon-btn${i < su ? ' dolu' : ''}" data-su="${i + 1}" aria-label="${i + 1}. bardak">${ikonHtml('bardak', 3)}</button>`).join('');
    const yaprak = Array.from({ length: SEBZE_HEDEF }, (_, i) => `<button type="button" class="m-ikon-btn${i < sebze ? ' dolu' : ''}" data-sebze="${i + 1}" aria-label="${i + 1}. kez sebze">${ikonHtml('yaprak', 3)}</button>`).join('');
    const pro = ['Kahvaltı', 'Ara öğün', 'Akşam'].map((ad, i) => `<button type="button" class="m-tog${pr[i] ? ' on' : ''}" data-protein="${i}" aria-pressed="${!!pr[i]}">${ikonHtml('yumurtaI', 2)}${ad}</button>`).join('');
    return `<section class="card m-kontrol" data-platform="card">
      <h2 class="h-small">Bugünün küçük listesi</h2>
      <div class="m-k-satir"><span class="m-k-ad">Su</span><span class="m-ikonlar">${bardak}</span><span class="m-k-say">${su}/${SU_HEDEF} bardak</span></div>
      <div class="m-k-satir"><span class="m-k-ad">Sebze</span><span class="m-ikonlar">${yaprak}</span><span class="m-k-say">${sebze}/${SEBZE_HEDEF} kez</span></div>
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
      for (const ogun of SIRA) for (const k of kalemler(ogun, secilen(ogun, d), d)) for (const [urun, mik, birim, reyon] of k.al) {
        const u = urunler.get(urun) || { reyon, mik: 0, birim, ogun: 0 };
        u.ogun++; if (mik != null) { u.mik += mik; u.birim = birim; }
        urunler.set(urun, u);
      }
    }
    return urunler;
  }
  const miktarYazi = (u) => u.birim === 'adet' ? `${Math.ceil(u.mik)} adet` : u.birim === 'dilim' ? `${u.mik} dilim` : u.birim === 'kk' ? `${u.mik} kibrit kutusu (~${u.mik * 30} g)` : `${u.ogun} öğünde`;
  function listeKart() {
    const d0 = bugun(), anahtar = isoTarih(d0), tikli = M.liste[anahtar] || {}, urunler = alisveris(d0);
    const gruplar = Object.entries(REYON).map(([r, ad]) => {
      const satir = [...urunler].filter(([, u]) => u.reyon === r).sort((a, b) => a[0].localeCompare(b[0], 'tr'));
      if (!satir.length) return '';
      return `<div class="m-reyon"><h3>${ad}</h3><ul>${satir.map(([urun, u]) => `<li><label class="m-liste-satir${tikli[urun] ? ' tikli' : ''}"><input type="checkbox" data-tik="${urun}"${tikli[urun] ? ' checked' : ''}><span>${urun}</span><span class="m-miktar">${miktarYazi(u)}</span></label></li>`).join('')}</ul></div>`;
    }).join('');
    return `<section class="card m-liste" data-platform="card">
      <div class="m-liste-bas">
        <div><h2 class="h-small">Alışveriş listesi</h2><p class="muted">Bugünden itibaren 7 gün, seçtiğin öğünlere göre. Seçmediğin günlerde ilk seçenek sayıldı.</p></div>
        <div class="row-end"><button type="button" class="pbtn small" data-kopyala>Listeyi kopyala</button><button type="button" class="pbtn small ghost" data-temizle>Tikleri temizle</button></div>
      </div>
      <div class="m-reyonlar">${gruplar}</div>
      <p class="muted m-hep">Evde hep olsun: zeytinyağı, limon, tarçın, karabiber, kimyon, pul biber, yeşil çay, nane çayı.</p>
    </section>`;
  }
  function notlarKart() {
    return `<section class="card m-notlar" data-platform="card">
      <h2 class="h-small">Yumak'ın beslenme notları</h2>
      <div class="m-ilkeler">${ILKELER.map((x) => `<div class="m-ilke"><b>${x.b}</b><p>${x.t}</p></div>`).join('')}</div>
      <h3 class="m-alt-baslik">Mit mi, gerçek mi?</h3>
      <div class="m-mitler">${MITLER.map((x, i) => `<button type="button" class="m-mit${acikMit.has(i) ? ' acik' : ''}" data-mit="${i}" aria-expanded="${acikMit.has(i)}">
        <span class="m-mit-s">"${x.s}"</span>${acikMit.has(i) ? `<span class="m-mit-c ${x.c === 'Gerçek' ? 'g' : 'm'}">${x.c}</span><span class="m-mit-t">${x.t}</span>` : '<span class="m-mit-ipucu">Dokun, Yumak söylesin</span>'}</button>`).join('')}</div>
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
      + `<div class="m-alt-izgara">${kontrolKart(d)}${listeKart()}</div>`
      + notlarKart();
    for (const c of kok.querySelectorAll('canvas[data-ikon]')) { // outerHTML ile kopyalanan tuvaller boş gelir: yeniden çiz
      const yeni = icon(c.dataset.ikon, +c.dataset.olcek); yeni.className = c.className; yeni.setAttribute('aria-hidden', 'true'); c.replaceWith(yeni);
    }
  }

  /* ---------- kayıt ---------- */
  function kaydet() {
    const sinir = isoTarih(gunEkle(bugun(), -60)), listeSinir = isoTarih(gunEkle(bugun(), -14));
    for (const k of Object.keys(M.gun)) if (k < sinir) delete M.gun[k];
    for (const k of Object.keys(M.kontrol)) if (k < sinir) delete M.kontrol[k];
    for (const k of Object.keys(M.liste)) if (k < listeSinir) delete M.liste[k];
    save();
  }
  const yumakSoylesin = (metin) => window.dispatchEvent(new CustomEvent('yumak', { detail: { type: 'konus', metin } }));

  /* ---------- etkileşim ---------- */
  kok.addEventListener('click', (e) => {
    const b = e.target.closest('button, input'); if (!b) return;
    const ds = b.dataset, d = secili, r = b.getBoundingClientRect();
    if (ds.gun != null) { const n = +ds.gun; secili = n === 0 ? bugun() : gunEkle(secili, n); acikDegis = null; ciz(); return; }
    if (ds.mit != null) { const i = +ds.mit; if (acikMit.has(i)) acikMit.delete(i); else acikMit.add(i); ciz(); return; }
    if (ds.degis) { acikDegis = acikDegis === ds.degis ? null : ds.degis; ciz(); return; }
    if (ds.kopyala != null) { listeKopyala(b); return; }
    if (izle) return; // izleme modunda hiçbir şey değişmez
    if (ds.sec) {
      const [ogun, id] = ds.sec.split(':'), k = kayitYaz(d);
      if (k.sec[ogun] === id) delete k.sec[ogun]; else { k.sec[ogun] = id; sparkles(r.left + r.width / 2, r.top + 10, 4); }
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
    if (ds.sebze) { const n = +ds.sebze; kk.sebze = (kk.sebze || 0) === n ? n - 1 : n; if (kk.sebze >= SEBZE_HEDEF) sparkles(r.left, r.top, 4); kaydet(); ciz(); return; }
    if (ds.protein != null) { const i = +ds.protein; kk.protein = kk.protein || [false, false, false]; kk.protein[i] = !kk.protein[i]; kaydet(); ciz(); return; }
    if (ds.tog) { kk[ds.tog] = !kk[ds.tog]; if (kk[ds.tog]) sparkles(r.left + r.width / 2, r.top, 3); kaydet(); ciz(); return; }
    if (ds.temizle != null) { delete M.liste[isoTarih(bugun())]; kaydet(); ciz(); return; }
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
