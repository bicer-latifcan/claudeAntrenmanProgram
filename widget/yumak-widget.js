// YUMAK_WIDGET — Yumak'la 8 Hafta · iPhone widget'ı (Scriptable uygulaması için)
// Ana ekranda bugünün antrenmanını, haftanın ilerlemesini ve Yumak'ı gösterir; kilit ekranında kısa özet.
// Kişisel link (…#kod-XXXX) ya da izleme linki (…#izle-XXXX) gerekir: betik ilk açılışta sorar,
// widget ayarlarındaki "Parameter" alanına yapıştırılan link de olur. Plan, sitedeki js/program.js'ten okunur.
const SITE = (typeof YUMAK_SITE !== 'undefined' && YUMAK_SITE) || 'https://bicer-latifcan.github.io/claudeAntrenmanProgram/';
const BULUT = { projectId: 'yumak-8-hafta', apiKey: 'AIzaSyCWo2qiv7f5j6mv_V-Pvjw3n26aiMiaojg' };
const RESIM_SURUM = 1;
const KC = 'yumak-widget-link';
const R = {
  ink: '#3d2a3f', inkSoft: '#6f5a73', paper: '#fffaf3', pink: '#ff6f98', pinkDeep: '#e0507c', green: '#2fb56d', lilac: '#8f7ad8',
  sky1: '#c9b8ff', sky2: '#f7c6e0', sky3: '#ffe3cb',
};
const TUR_RENK = { A: '#ffd2ad', B: '#ffc4d8', yuruyus: '#c4f1df', uzun: '#cfe2ff', aralikli: '#fff0a6', dinlenme: '#e4d8ff' };
const GUN = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const GUN_K = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const GUN_B = ['PAZARTESİ', 'SALI', 'ÇARŞAMBA', 'PERŞEMBE', 'CUMA', 'CUMARTESİ', 'PAZAR'];
const AY = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const AY_B = ['OCAK', 'ŞUBAT', 'MART', 'NİSAN', 'MAYIS', 'HAZİRAN', 'TEMMUZ', 'AĞUSTOS', 'EYLÜL', 'EKİM', 'KASIM', 'ARALIK'];
const gunNo = (dt) => (dt.getDay() + 6) % 7; // Pazartesi = 0
const rastgele = (a) => a[Math.floor(Math.random() * a.length)];

/* ---------- hafıza (internet yokken son bilinen durum) ---------- */
const fm = FileManager.local();
const klasor = fm.joinPath(fm.documentsDirectory(), 'yumak-widget');
if (!fm.fileExists(klasor)) fm.createDirectory(klasor, true);
const yol = (ad) => fm.joinPath(klasor, ad);
function oku(ad) { try { return fm.fileExists(yol(ad)) ? fm.readString(yol(ad)) : null; } catch (e) { return null; } }
function yaz(ad, metin) { try { fm.writeString(yol(ad), metin); } catch (e) { /* yer yok */ } }

/* ---------- bağlantı: kişisel ya da izleme linki ---------- */
function linkAyikla(metin) {
  const s = String(metin || '').trim();
  const m = s.match(/#(kod|izle)-([A-Za-z0-9]{24,})\s*$/) || s.match(/^()([A-Za-z0-9]{24,})$/);
  return m ? { kod: m[2], izle: m[1] === 'izle' } : null;
}
async function linkSor() {
  const a = new Alert();
  a.title = 'Yumak widget\'ı';
  a.message = 'Kişisel linkini (…#kod-…) yapıştır. Sadece izlemek için izleme linki (…#izle-…) de olur.\n\nLink sitede: Başlangıç → Bulut yedeği → Kişisel linki kopyala.';
  let pano = '';
  try { pano = Pasteboard.pasteString() || ''; } catch (e) { /* pano boş */ }
  a.addTextField('Linki yapıştır', linkAyikla(pano) ? pano : '');
  a.addAction('Kaydet');
  a.addCancelAction('Vazgeç');
  if (await a.presentAlert() !== 0) return null;
  const v = a.textFieldValue(0), b = linkAyikla(v);
  if (b) Keychain.set(KC, v.trim());
  else { const h = new Alert(); h.title = 'Bu link okunamadı'; h.message = 'Linkin tamamını yapıştırdığından emin ol.'; h.addAction('Tamam'); await h.presentAlert(); }
  return b;
}
function kayitliBaglanti() {
  return linkAyikla(typeof args !== 'undefined' ? args.widgetParameter : null) || (Keychain.contains(KC) ? linkAyikla(Keychain.get(KC)) : null);
}

/* ---------- veri: bulut kaydı + plan + görseller ---------- */
async function durumGetir(kod) {
  const url = `https://firestore.googleapis.com/v1/projects/${BULUT.projectId}/databases/(default)/documents/ilerleme/${kod}?key=${BULUT.apiKey}`;
  try {
    const r = new Request(url); r.timeoutInterval = 12;
    const j = await r.loadJSON();
    const kodu = r.response ? r.response.statusCode : 0;
    if (kodu === 200 && j && j.fields && j.fields.veri) {
      const veri = JSON.parse(j.fields.veri.stringValue);
      yaz('durum.json', JSON.stringify({ veri, alindi: Date.now() }));
      return { veri, taze: true };
    }
    if (kodu === 404) return { veri: null, taze: true, yok: true };
  } catch (e) { /* internet yok */ }
  try { const c = JSON.parse(oku('durum.json')); return { veri: c.veri, taze: false, alindi: c.alindi }; } catch (e) { return { veri: null, taze: false }; }
}
async function planGetir() {
  let src = null;
  try {
    const r = new Request(SITE + 'js/program.js'); r.timeoutInterval = 12;
    const s = await r.loadString();
    if (r.response && r.response.statusCode === 200 && s.includes('TAKVIM')) { src = s; yaz('program.js', s); }
  } catch (e) { /* internet yok */ }
  if (!src) src = oku('program.js');
  if (!src) return null;
  try { return new Function(src.replace(/^export\s+/gm, '') + '\nreturn { AYARLAR, TAKVIM, ANTRENMANLAR, YUMAK_SOZLER };')(); }
  catch (e) { return null; }
}
async function resim(ad) {
  const p = yol(`${ad}-v${RESIM_SURUM}.png`);
  try { if (fm.fileExists(p)) return fm.readImage(p); } catch (e) { /* bozuk */ }
  try { const r = new Request(`${SITE}widget/${ad}.png?v=${RESIM_SURUM}`); r.timeoutInterval = 12; const img = await r.loadImage(); fm.writeImage(p, img); return img; }
  catch (e) { return null; }
}

/* ---------- bugünün bilgisi ---------- */
function gunBilgi(plan, w, d) {
  const g = plan.TAKVIM[w][d];
  switch (g.tur) {
    case 'kuvvet': {
      const a = plan.ANTRENMANLAR[g.a] || { ad: 'Kuvvet', dk: 40 }, B = String(g.a).startsWith('B');
      return { tur: 'kuvvet', renk: B ? 'B' : 'A', baslik: a.ad, alt: `+ ${g.yemek} dk yürüyüş`, kisa: `${B ? 'B' : 'A'}${String(g.a).endsWith('2') ? '+' : ''} · ${a.dk} dk`, resim: 'kuvvet' };
    }
    case 'yuruyus': return { tur: 'yuruyus', renk: 'yuruyus', baslik: `${g.dk} dk yürüyüş`, alt: 'Tempolu yürüyüş', kisa: `${g.dk} dk yürüyüş`, resim: 'yuruyus' };
    case 'uzun': return { tur: 'uzun', renk: 'uzun', baslik: `${g.dk} dk uzun yürüyüş`, alt: 'Rahat, keyifli tempo', kisa: `${g.dk} dk uzun`, resim: 'yuruyus' };
    case 'aralikli': return { tur: 'aralikli', renk: 'aralikli', baslik: `${g.dk} dk aralıklı`, alt: `${g.tur_} tur hızlı-yavaş`, kisa: `${g.dk} dk aralıklı`, resim: 'aralikli' };
    default: return { tur: 'dinlenme', renk: 'dinlenme', baslik: 'Dinlenme günü', alt: 'Kaslar dinlenirken güçlenir', kisa: 'Dinlenme', resim: 'dinlenme' };
  }
}
function soz(plan, anahtar, sakaSans = 0.3) {
  const S = (plan && plan.YUMAK_SOZLER) || {};
  let havuz = S[anahtar] || [];
  if (Math.random() < sakaSans) havuz = havuz.concat(S.sakalar || []);
  const temiz = havuz.map((s) => s.replace(/<[^>]+>/g, '')).filter((s) => s.length <= 96);
  return temiz.length ? rastgele(temiz) : 'Mrrr!';
}
async function modelKur(baglanti) {
  const simdi = (typeof YUMAK_TARIH !== 'undefined' && YUMAK_TARIH) ? new Date(YUMAK_TARIH) : new Date();
  const bugun = new Date(simdi); bugun.setHours(0, 0, 0, 0);
  if (!baglanti) return { durum: 'bagla', resim: 'bekle', ust: 'YUMAK', baslik: 'Bağlan', alt: 'Betiği Scriptable\'da bir kez aç', soz: 'Linkini yapıştır, ilerlemen buraya gelsin!', satir: 'Yumak: linki bağla', hafta: [], simdi };
  const [plan, durum] = await Promise.all([planGetir(), durumGetir(baglanti.kod)]);
  if (!plan) return { durum: 'yok', resim: 'dinlenme', ust: 'YUMAK', baslik: 'İnternet bekleniyor', alt: 'Bağlanınca kendiliğinden yenilenir', soz: 'Zzz… internet gelince uyanırım.', satir: 'Yumak internet bekliyor', hafta: [], simdi };
  const veri = durum.veri || {};
  const bas = String(veri.start || plan.AYARLAR.varsayilanBaslangic).split('-').map(Number);
  const basTarih = new Date(bas[0], bas[1] - 1, bas[2]);
  const fark = Math.round((bugun - basTarih) / 864e5), toplamGun = plan.AYARLAR.haftaSayisi * 7;
  const done = veri.done || {};
  let tamamSay = 0, gunSay = 0;
  for (let w = 0; w < plan.AYARLAR.haftaSayisi; w++) for (let d = 0; d < 7; d++) {
    if (plan.TAKVIM[w][d].tur === 'dinlenme') continue;
    gunSay++; if (done[`h${w + 1}g${d + 1}`]) tamamSay++;
  }
  const haftaKur = (w, bugunD) => [...Array(7)].map((_, d) => {
    const b = gunBilgi(plan, w, d), dt = new Date(basTarih); dt.setDate(dt.getDate() + w * 7 + d);
    return { ...b, d, tarih: dt, tamam: !!done[`h${w + 1}g${d + 1}`], bugun: d === bugunD, gecmis: d < bugunD, gelecek: d > bugunD };
  });
  const ortak = { simdi, izle: baglanti.izle, taze: durum.taze, bulutYok: durum.yok, tamamSay, gunSay };
  if (fark < 0) {
    const kalan = -fark;
    return { ...ortak, durum: 'once', resim: 'bekle', ust: 'PROGRAM BAŞLIYOR', baslik: `${basTarih.getDate()} ${AY[basTarih.getMonth()]} ${GUN[gunNo(basTarih)]}`,
      alt: kalan === 1 ? 'Yarın başlıyoruz!' : `${kalan} gün kaldı`, soz: soz(plan, 'selam', 0.4), satir: kalan === 1 ? 'Program yarın başlıyor' : `Programa ${kalan} gün`,
      hafta: haftaKur(0, -1), haftaNo: 1, renk: 'A' };
  }
  if (fark >= toplamGun) {
    return { ...ortak, durum: 'bitti', resim: 'bitti', ust: '8 HAFTA TAMAM', baslik: 'Dolunay!', alt: `${tamamSay}/${gunSay} gün tamamlandı`, soz: soz(plan, 'tamam', 0),
      satir: 'Dolunay! 8 hafta tamam', hafta: haftaKur(plan.AYARLAR.haftaSayisi - 1, 7), haftaNo: plan.AYARLAR.haftaSayisi, renk: 'dinlenme' };
  }
  const w = Math.floor(fark / 7), d = fark % 7, b = gunBilgi(plan, w, d), tamam = !!done[`h${w + 1}g${d + 1}`];
  const anahtar = tamam ? 'tamam' : { kuvvet: 'gunKuvvet', yuruyus: 'gunYuruyus', uzun: 'gunUzun', aralikli: 'gunAralikli', dinlenme: 'gunDinlenme' }[b.tur];
  return {
    ...ortak, durum: 'surec', bilgi: b, tamam, haftaNo: w + 1, renk: b.renk,
    resim: tamam ? 'tamam' : b.resim,
    ust: `BUGÜN · ${GUN_B[gunNo(bugun)]} ${bugun.getDate()} ${AY_B[bugun.getMonth()]}`,
    baslik: tamam && b.tur !== 'dinlenme' ? 'Bugün tamam!' : b.baslik,
    alt: tamam && b.tur !== 'dinlenme' ? b.kisa + ' ✓' : b.alt,
    soz: soz(plan, anahtar, tamam ? 0 : 0.3),
    satir: tamam ? 'Bugün tamam! ✓' : `Bugün: ${b.kisa}`,
    hafta: haftaKur(w, d),
  };
}

/* ---------- çizim yardımcıları ---------- */
const renk = (hex, a = 1) => new Color(hex, a);
function arkaPlan(w) {
  const g = new LinearGradient();
  g.colors = [renk(R.sky1), renk(R.sky2), renk(R.sky3)];
  g.locations = [0, 0.55, 1];
  g.startPoint = new Point(0, 0); g.endPoint = new Point(0, 1);
  w.backgroundGradient = g;
}
function yazi(st, metin, font, hex, satir = 1, kucul = 0.7) {
  const t = st.addText(metin); t.font = font; t.textColor = renk(hex); t.lineLimit = satir; t.minimumScaleFactor = kucul;
  return t;
}
function sembol(st, ad, boy, hex, a = 1) {
  const s = SFSymbol.named(ad) || SFSymbol.named('circle');
  s.applyFont(Font.boldSystemFont(boy));
  const im = st.addImage(s.image); im.imageSize = new Size(boy, boy); im.tintColor = renk(hex, a);
  return im;
}
function noktalar(st, hafta, boy) {
  const row = st.addStack(); row.layoutHorizontally(); row.centerAlignContent(); row.spacing = Math.round(boy * 0.3);
  for (const g of hafta) {
    if (g.tamam) sembol(row, 'checkmark.circle.fill', boy, R.green);
    else if (g.bugun) sembol(row, 'largecircle.fill.circle', boy, R.pinkDeep);
    else if (g.tur === 'dinlenme') sembol(row, 'moon.fill', boy, R.lilac, g.gelecek ? 0.55 : 0.9);
    else sembol(row, 'circle', boy, R.ink, g.gecmis ? 0.3 : 0.45);
  }
  return row;
}
function cip(st, metin, bg, font) { // takvimdeki renkli gün kutusu gibi küçük etiket
  const c = st.addStack(); c.backgroundColor = renk(bg); c.cornerRadius = 7; c.borderWidth = 2; c.borderColor = renk(R.ink); c.setPadding(2, 7, 2, 7);
  yazi(c, metin, font, R.ink, 1, 0.6);
  return c;
}
function balon(st, metin, boy, satir = 2) {
  const b = st.addStack(); b.backgroundColor = renk(R.paper); b.cornerRadius = 10; b.borderWidth = 2; b.borderColor = renk(R.ink); b.setPadding(4, 8, 4, 8);
  yazi(b, metin, Font.semiboldRoundedSystemFont(boy), R.ink, satir, 0.75);
  return b;
}

/* ---------- boyutlar ---------- */
async function kucuk(m) {
  const w = new ListWidget(); arkaPlan(w); w.setPadding(10, 12, 10, 12);
  const ust = w.addStack(); ust.layoutHorizontally(); ust.centerAlignContent();
  yazi(ust, m.durum === 'surec' ? 'BUGÜN' : m.ust, Font.heavyRoundedSystemFont(10), R.inkSoft, 1, 0.6);
  ust.addSpacer();
  if (m.haftaNo) cip(ust, `H${m.haftaNo}`, TUR_RENK[m.renk] || R.paper, Font.heavyRoundedSystemFont(9));
  w.addSpacer(2);
  const orta = w.addStack(); orta.layoutHorizontally(); orta.addSpacer();
  const img = await resim(m.resim); if (img) { const i = orta.addImage(img); i.imageSize = new Size(72, 72); }
  orta.addSpacer();
  w.addSpacer(2);
  const t = yazi(w, m.baslik, Font.heavyRoundedSystemFont(14), R.ink, 1, 0.55); t.centerAlignText();
  if (m.hafta.length) { w.addSpacer(4); const dz = w.addStack(); dz.layoutHorizontally(); dz.addSpacer(); noktalar(dz, m.hafta, 10); dz.addSpacer(); }
  else { const a = yazi(w, m.alt, Font.semiboldRoundedSystemFont(10), R.inkSoft, 2, 0.7); a.centerAlignText(); }
  return w;
}
async function ortaBoy(m, buyuk = false) {
  const w = new ListWidget(); arkaPlan(w); w.setPadding(12, 12, 12, 14);
  const satir = w.addStack(); satir.layoutHorizontally(); satir.centerAlignContent();
  const img = await resim(m.resim);
  if (img) { const i = satir.addImage(img); i.imageSize = new Size(buyuk ? 122 : 112, buyuk ? 122 : 112); }
  satir.addSpacer(8);
  const sag = satir.addStack(); sag.layoutVertically();
  yazi(sag, m.ust, Font.heavyRoundedSystemFont(10), R.inkSoft, 1, 0.6);
  sag.addSpacer(3);
  cip(sag, m.baslik, TUR_RENK[m.renk] || R.paper, Font.heavyRoundedSystemFont(16));
  sag.addSpacer(3);
  yazi(sag, m.alt, Font.semiboldRoundedSystemFont(12), R.ink, 1, 0.7);
  if (m.hafta.length) { sag.addSpacer(5); const nr = sag.addStack(); nr.layoutHorizontally(); nr.centerAlignContent(); noktalar(nr, m.hafta, 12); nr.addSpacer(6); yazi(nr, `H${m.haftaNo}`, Font.heavyRoundedSystemFont(11), R.inkSoft); }
  sag.addSpacer(6);
  balon(sag, m.soz, 11);
  satir.addSpacer();
  if (buyuk && m.hafta.length) {
    w.addSpacer(10);
    const liste = w.addStack(); liste.layoutVertically(); liste.spacing = 4;
    for (const g of m.hafta) {
      const r = liste.addStack(); r.layoutHorizontally(); r.centerAlignContent(); r.spacing = 6;
      r.backgroundColor = renk(g.bugun ? R.paper : TUR_RENK[g.renk], g.bugun ? 1 : 0.85); r.cornerRadius = 8; r.setPadding(4, 8, 4, 8);
      if (g.bugun) { r.borderWidth = 2; r.borderColor = renk(R.pinkDeep); }
      yazi(r, `${GUN_K[gunNo(g.tarih)]} ${g.tarih.getDate()}`, Font.heavyRoundedSystemFont(11), R.ink, 1, 0.7);
      yazi(r, g.kisa, Font.semiboldRoundedSystemFont(11), R.ink, 1, 0.7);
      r.addSpacer();
      if (g.tamam) sembol(r, 'checkmark.circle.fill', 13, R.green);
      else if (g.tur === 'dinlenme') sembol(r, 'moon.fill', 12, R.lilac);
      else if (g.bugun) sembol(r, 'largecircle.fill.circle', 13, R.pinkDeep);
    }
    w.addSpacer();
    yazi(w, `Toplam: ${m.tamamSay}/${m.gunSay} gün${m.izle ? ' · izleme' : ''}`, Font.semiboldRoundedSystemFont(10), R.inkSoft, 1, 0.7);
  }
  return w;
}
function kilitDikdortgen(m) {
  const w = new ListWidget(); w.addAccessoryWidgetBackground = true; w.setPadding(4, 8, 4, 8);
  const ust = w.addStack(); ust.layoutHorizontally(); ust.centerAlignContent(); ust.spacing = 4;
  const s = SFSymbol.named('pawprint.fill'); s.applyFont(Font.boldSystemFont(11)); const si = ust.addImage(s.image); si.imageSize = new Size(11, 11);
  const u = ust.addText(m.haftaNo ? `Yumak · H${m.haftaNo}` : 'Yumak'); u.font = Font.boldRoundedSystemFont(11);
  const b = w.addText(m.baslik); b.font = Font.heavyRoundedSystemFont(15); b.lineLimit = 1; b.minimumScaleFactor = 0.6;
  const a = w.addText(m.durum === 'surec' ? `${m.alt} · ${m.tamamSay}/${m.gunSay}` : m.alt); a.font = Font.mediumRoundedSystemFont(11); a.lineLimit = 1; a.minimumScaleFactor = 0.7;
  return w;
}
function kilitSatir(m) {
  const w = new ListWidget();
  const s = SFSymbol.named('pawprint.fill'); w.addImage(s.image);
  w.addText(m.satir);
  return w;
}
function kilitDaire(m) {
  const w = new ListWidget(); w.addAccessoryWidgetBackground = true;
  const s = SFSymbol.named(m.tamam ? 'checkmark' : 'pawprint.fill'); s.applyFont(Font.boldSystemFont(16));
  const st = w.addStack(); st.layoutHorizontally(); st.addSpacer(); const im = st.addImage(s.image); im.imageSize = new Size(16, 16); st.addSpacer();
  const t = w.addText(m.gunSay ? `${m.tamamSay}/${m.gunSay}` : '–'); t.font = Font.heavyRoundedSystemFont(12); t.centerAlignText(); t.minimumScaleFactor = 0.6;
  return w;
}
async function ciz(boy, m, baglanti) {
  let w;
  if (boy === 'small') w = await kucuk(m);
  else if (boy === 'large' || boy === 'extraLarge') w = await ortaBoy(m, true);
  else if (boy === 'accessoryRectangular') w = kilitDikdortgen(m);
  else if (boy === 'accessoryInline') w = kilitSatir(m);
  else if (boy === 'accessoryCircular') w = kilitDaire(m);
  else w = await ortaBoy(m);
  w.url = baglanti ? `${SITE}#${baglanti.izle ? 'izle' : 'kod'}-${baglanti.kod}` : SITE;
  const geceYarisi = new Date(m.simdi); geceYarisi.setHours(24, 1, 0, 0);
  w.refreshAfterDate = new Date(Math.min(Date.now() + 30 * 60e3, geceYarisi.getTime()));
  return w;
}

/* ---------- çalıştır ---------- */
let baglanti = kayitliBaglanti();
if (config.runsInWidget) {
  const m = await modelKur(baglanti);
  Script.setWidget(await ciz(config.widgetFamily || 'medium', m, baglanti));
} else {
  if (!baglanti) baglanti = await linkSor();
  const a = new Alert();
  a.title = 'Yumak widget\'ı 🐾';
  a.message = baglanti ? (baglanti.izle ? 'İzleme linkiyle bağlı (sadece okur).' : 'Kişisel linkle bağlı.') + '\n\nAna ekrana eklemek için: boş bir yere basılı tut → + → Scriptable → boyut seç → widget\'a basılı tut → Widget\'ı Düzenle → Script: bu betik.' : 'Henüz bağlı değil.';
  a.addAction('Orta boy önizle'); a.addAction('Küçük önizle'); a.addAction('Büyük önizle'); a.addAction('Linki değiştir');
  a.addCancelAction('Kapat');
  const i = await a.presentAlert();
  if (i === 3) { const yeni = await linkSor(); if (yeni) baglanti = yeni; }
  if (i >= 0 && i <= 2) {
    const boy = ['medium', 'small', 'large'][i], m = await modelKur(baglanti), w = await ciz(boy, m, baglanti);
    if (boy === 'small') await w.presentSmall(); else if (boy === 'large') await w.presentLarge(); else await w.presentMedium();
  }
}
Script.complete();
