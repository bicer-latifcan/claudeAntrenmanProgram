// YUMAK_WIDGET — Yumak'la 8 Hafta · iPhone widget'ı (Scriptable uygulaması için)
// Ana ekranda bugünün antrenmanını, haftanın ilerlemesini ve Yumak'ı gösterir; kilit ekranında kısa özet.
// Kişisel link (…#kod-XXXX) ya da izleme linki (…#izle-XXXX) gerekir: betik ilk açılışta sorar,
// widget ayarlarındaki "Parameter" alanına yapıştırılan link de olur. Plan, sitedeki js/program.js'ten okunur.
const SITE = (typeof YUMAK_SITE !== 'undefined' && YUMAK_SITE) || 'https://bicer-latifcan.github.io/claudeAntrenmanProgram/';
const BULUT = { projectId: 'yumak-8-hafta', apiKey: 'AIzaSyCWo2qiv7f5j6mv_V-Pvjw3n26aiMiaojg' };
const RESIM_SURUM = 2;
const KC = 'yumak-widget-link';
const R = {
  ink: '#3d2a3f', inkSoft: '#6f5a73', paper: '#fffaf3', pink: '#ff6f98', pinkDeep: '#e0507c', green: '#2fb56d', lilac: '#8f7ad8',
  flame: '#ff8a3d', flameDeep: '#e0622a',
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

/* ---------- şifreden kod: sitedekiyle aynı hesap (PBKDF2-HMAC-SHA256, 30.000 tekrar, sabit tuz) ---------- */
// Scriptable'da WebCrypto yok; küçük bir SHA-256 burada. Sonuç cihazda saklanır, bir kez hesaplanır.
const KABC = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
const GIRIS_TUZ = 'yumak-8-hafta:giris:v1', GIRIS_TEKRAR = 30000;
const K256 = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
const H0 = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
const W = new Array(64);
function sikistir(h, blok) { // h: 8 kelimelik durum (yerinde güncellenir), blok: 64 bayt
  for (let i = 0; i < 16; i++) W[i] = (blok[i * 4] << 24) | (blok[i * 4 + 1] << 16) | (blok[i * 4 + 2] << 8) | blok[i * 4 + 3];
  for (let i = 16; i < 64; i++) {
    const x = W[i - 15], y = W[i - 2];
    const s0 = ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3);
    const s1 = ((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10);
    W[i] = (W[i - 16] + s0 + W[i - 7] + s1) | 0;
  }
  let a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], k = h[7];
  for (let i = 0; i < 64; i++) {
    const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
    const t1 = (k + S1 + ((e & f) ^ (~e & g)) + K256[i] + W[i]) | 0;
    const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
    const t2 = (S0 + ((a & b) ^ (a & c) ^ (b & c))) | 0;
    k = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
  }
  h[0] = (h[0] + a) | 0; h[1] = (h[1] + b) | 0; h[2] = (h[2] + c) | 0; h[3] = (h[3] + d) | 0;
  h[4] = (h[4] + e) | 0; h[5] = (h[5] + f) | 0; h[6] = (h[6] + g) | 0; h[7] = (h[7] + k) | 0;
}
const baytlar = (str) => { const u = unescape(encodeURIComponent(str)); const o = []; for (let i = 0; i < u.length; i++) o.push(u.charCodeAt(i)); return o; };
const kelimeBayt = (h) => { const o = []; for (const w of h) o.push((w >>> 24) & 255, (w >>> 16) & 255, (w >>> 8) & 255, w & 255); return o; };
function sha256(msg) { // tam SHA-256 (uzun anahtarlar için)
  const h = H0.slice(), b = msg.slice(), uz = msg.length * 8;
  b.push(0x80); while (b.length % 64 !== 56) b.push(0);
  for (let i = 7; i >= 0; i--) b.push(Math.floor(uz / Math.pow(2, i * 8)) & 255);
  for (let i = 0; i < b.length; i += 64) sikistir(h, b.slice(i, i + 64));
  return kelimeBayt(h);
}
function tekBlok(durum, msg, toplamBayt) { // önceden işlenmiş 64 baytın ardından tek bloğa sığan mesaj
  const h = durum.slice(), b = msg.slice(), uz = toplamBayt * 8;
  b.push(0x80); while (b.length < 56) b.push(0);
  for (let i = 7; i >= 0; i--) b.push(Math.floor(uz / Math.pow(2, i * 8)) & 255);
  sikistir(h, b);
  return kelimeBayt(h);
}
function sifredenKod(sifre) {
  let anahtar = baytlar(String(sifre).trim().normalize('NFC'));
  if (anahtar.length > 64) anahtar = sha256(anahtar);
  const ic = H0.slice(), dis = H0.slice(), ip = [], op = [];
  for (let i = 0; i < 64; i++) { const k = anahtar[i] || 0; ip.push(k ^ 0x36); op.push(k ^ 0x5c); }
  sikistir(ic, ip); sikistir(dis, op);
  const hmac = (msg) => tekBlok(dis, tekBlok(ic, msg, 64 + msg.length), 96);
  let u = hmac(baytlar(GIRIS_TUZ).concat([0, 0, 0, 1]));
  const t = u.slice();
  for (let j = 1; j < GIRIS_TEKRAR; j++) { u = hmac(u); for (let i = 0; i < 32; i++) t[i] ^= u[i]; }
  let s = ''; for (let i = 0; i < 28; i++) s += KABC[t[i] % KABC.length];
  return s;
}
async function sifreylBagla(sifre) { // işaretçi kaydını oku, asıl kodu bul
  const p = sifredenKod(sifre);
  const r = new Request(`https://firestore.googleapis.com/v1/projects/${BULUT.projectId}/databases/(default)/documents/ilerleme/${p}?key=${BULUT.apiKey}`);
  r.timeoutInterval = 12;
  const j = await r.loadJSON();
  if (!r.response || r.response.statusCode !== 200 || !j.fields) return null;
  const veri = JSON.parse(j.fields.veri.stringValue);
  return veri.isaretci || p;
}

/* ---------- bağlantı: şifre, kişisel ya da izleme linki ---------- */
function linkAyikla(metin) {
  const s = String(metin || '').trim();
  const m = s.match(/#(kod|izle)-([A-Za-z0-9]{24,})\s*$/) || s.match(/^()([A-Za-z0-9]{24,})$/);
  return m ? { kod: m[2], izle: m[1] === 'izle' } : null;
}
async function linkSor() {
  const a = new Alert();
  a.title = 'Yumak widget\'ı';
  a.message = 'Sitedeki giriş şifreni yaz. (Eski kişisel link ya da sadece izlemek için izleme linki de olur.)';
  let pano = '';
  try { pano = Pasteboard.pasteString() || ''; } catch (e) { /* pano boş */ }
  a.addSecureTextField('Şifre ya da link', linkAyikla(pano) ? pano : '');
  a.addAction('Kaydet');
  a.addCancelAction('Vazgeç');
  if (await a.presentAlert() !== 0) return null;
  const v = a.textFieldValue(0).trim();
  let b = v.includes('#') ? linkAyikla(v) : null; // link mi?
  if (!b && v.length >= 10) { // şifre: sitedekiyle aynı hesapla kodu bul (birkaç saniye sürebilir)
    try { const kod = await sifreylBagla(v); if (kod) b = { kod, izle: false }; } catch (e) { /* internet yok */ }
    if (b) Keychain.set(KC, `#kod-${b.kod}`);
  }
  if (!b && (b = linkAyikla(v))) Keychain.set(KC, v); // eski usul: çıplak kod
  if (!b) { const h = new Alert(); h.title = 'Bağlanamadım'; h.message = 'Şifre yanlış olabilir ya da internet yok. Sitedeki şifreyle aynı olmalı.'; h.addAction('Tamam'); await h.presentAlert(); }
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
// her ruh hâlinin birkaç pozu var: widget her yenilendiğinde biri seçilir (widget'lar hareket edemiyor, Yumak böyle canlı kalır)
const VARYANT = {
  uzgun: ['uzgun', 'uzgun2', 'uzgun3', 'uzgun4'],
  dram: ['dram', 'dram2', 'dram3'],
  tamam: ['tamam', 'tamam2', 'tamam3', 'tamam5', 'bitti'],
  parti: ['parti', 'parti2'],
  dinlenme: ['dinlenme', 'dinlenme2', 'dinlenme3'],
  bekle: ['bekle', 'bekle2'],
};
async function resim(ad) {
  if (VARYANT[ad]) ad = rastgele(VARYANT[ad]);
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
function soz(plan, anahtar, sakaSans = 0.3, degis = {}) {
  const S = (plan && plan.YUMAK_SOZLER) || {};
  let havuz = [].concat(...[].concat(anahtar).map((k) => S[k] || []));
  if (Math.random() < sakaSans) havuz = havuz.concat(S.sakalar || []);
  const temiz = havuz.map((s) => s.replace(/<[^>]+>/g, '')).filter((s) => s.length <= 96);
  const sec = temiz.length ? rastgele(temiz) : 'Mrrr!';
  return sec.replace(/\{(\w)\}/g, (_, k) => (k in degis ? degis[k] : ''));
}
// seri: art arda tamamlanan günler. Dinlenme günleri zinciri bozmaz, uzatır; ama zincirde en az bir gerçek gün olmalı.
// Bugün henüz yapılmadıysa zincir kopmuş sayılmaz (gün bitmedi): seri dünden geriye sayılır.
function seriHesapla(plan, done, fark) {
  const N = plan.AYARLAR.haftaSayisi * 7;
  const dinlenme = (i) => plan.TAKVIM[Math.floor(i / 7)][i % 7].tur === 'dinlenme';
  const yapti = (i) => !!done[`h${Math.floor(i / 7) + 1}g${(i % 7) + 1}`];
  const ok = (i) => i >= 0 && i < N && (yapti(i) || dinlenme(i));
  const zincir = (son) => { let n = 0, gercek = 0; for (let i = son; ok(i); i--) { n++; if (yapti(i)) gercek++; } return gercek ? n : 0; };
  if (fark < 0) return { seri: 0, rekor: 0, bugunTamam: false, kirik: false };
  const bitti = fark >= N, bugunTamam = !bitti && ok(fark);
  const seri = bitti ? zincir(N - 1) : zincir(bugunTamam ? fark : fark - 1);
  let rekor = 0;
  for (let i = 0; i <= Math.min(fark, N - 1); i++) { if (!bitti && i === fark && !bugunTamam) break; rekor = Math.max(rekor, zincir(i)); }
  let gecmis = false;
  for (let i = 0; i < Math.min(fark, N); i++) if (yapti(i)) { gecmis = true; break; }
  return { seri, rekor, bugunTamam, kirik: !bugunTamam && seri === 0 && gecmis };
}
async function modelKur(baglanti) {
  const simdi = (typeof YUMAK_TARIH !== 'undefined' && YUMAK_TARIH) ? new Date(YUMAK_TARIH) : new Date();
  const bugun = new Date(simdi); bugun.setHours(0, 0, 0, 0);
  if (!baglanti) return { durum: 'bagla', resim: 'bekle', ust: 'YUMAK', baslik: 'Bağlan', alt: 'Betiği Scriptable\'da bir kez aç', soz: 'Şifreni yaz, ilerlemen buraya gelsin!', satir: 'Yumak: şifreyle bağlan', hafta: [], simdi };
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
  const SR = seriHesapla(plan, done, fark);
  const ortak = { simdi, izle: baglanti.izle, taze: durum.taze, bulutYok: durum.yok, tamamSay, gunSay, seri: SR.seri, rekor: SR.rekor, seriYandi: SR.bugunTamam && SR.seri > 0, veri, plan, basTarih };
  if (fark < 0) {
    const kalan = -fark;
    return { ...ortak, durum: 'once', resim: 'bekle', ust: 'PROGRAM BAŞLIYOR', baslik: `${basTarih.getDate()} ${AY[basTarih.getMonth()]} ${GUN[gunNo(basTarih)]}`,
      alt: kalan === 1 ? 'Yarın başlıyoruz!' : `${kalan} gün kaldı`, soz: soz(plan, 'selam', 0.4), satir: kalan === 1 ? 'Program yarın başlıyor' : `Programa ${kalan} gün`,
      hafta: haftaKur(0, -1), haftaNo: 1, renk: 'A' };
  }
  if (fark >= toplamGun) {
    return { ...ortak, durum: 'bitti', resim: 'bitti', ust: '8 HAFTA TAMAM', baslik: 'Dolunay!', alt: `${tamamSay}/${gunSay} gün · en uzun zincir ${SR.rekor}`,
      soz: SR.rekor >= 56 && plan.YUMAK_SOZLER.seriRekor ? plan.YUMAK_SOZLER.seriRekor[56] : soz(plan, 'seriBitti', 0, { n: SR.rekor }),
      seriYandi: SR.rekor > 0, seri: SR.rekor, seriKisa: `En uzun zincir: ${SR.rekor}`,
      satir: 'Dolunay! 8 hafta tamam', hafta: haftaKur(plan.AYARLAR.haftaSayisi - 1, 7), haftaNo: plan.AYARLAR.haftaSayisi, renk: 'dinlenme' };
  }
  const w = Math.floor(fark / 7), d = fark % 7, b = gunBilgi(plan, w, d), tamam = !!done[`h${w + 1}g${d + 1}`];
  const dinlenme = b.tur === 'dinlenme', n = SR.seri, aksam = simdi.getHours() >= 18, degis = { n, m: n + 1 };
  const kutlama = SR.bugunTamam && n > 0 && plan.YUMAK_SOZLER && plan.YUMAK_SOZLER.seriRekor && plan.YUMAK_SOZLER.seriRekor[n];
  // Yumak'ın hâli: yapılana kadar üzgün (akşam dramatik), yapınca mutlu, eşiklerde parti
  let resimAd, sozu, kisa;
  if (kutlama) { resimAd = 'parti'; sozu = kutlama; kisa = `${n} gün! Parti!`; }
  else if (dinlenme) { resimAd = 'dinlenme'; sozu = n > 0 ? soz(plan, 'seriDinlenme', 0, degis) : soz(plan, 'seriDinlenmeYeni', 0); kisa = n > 0 ? `Dinlen, zincir ${n}` : 'Dinlen, yarın başla'; }
  else if (tamam) { resimAd = 'tamam'; sozu = soz(plan, 'seriTamam', 0, degis); kisa = `${n} gündür! Mırr`; }
  else if (n > 0) {
    const turHavuz = b.tur === 'kuvvet' ? 'seriBekliyorKuvvet' : ['yuruyus', 'uzun', 'aralikli'].includes(b.tur) ? 'seriBekliyorYuruyus' : null;
    resimAd = aksam ? 'dram' : 'uzgun';
    sozu = soz(plan, aksam ? 'seriAksam' : ['seriBekliyor', turHavuz].filter(Boolean), 0, degis);
    kisa = `Yaparsan ${n + 1}! 🥺`;
  }
  else if (SR.kirik) { resimAd = 'uzgun'; sozu = soz(plan, b.tur === 'kuvvet' ? ['seriKirildi', 'seriBekliyorKuvvet'] : 'seriKirildi', 0, degis); kisa = 'Yeniden başla!'; }
  else { resimAd = 'uzgun'; sozu = soz(plan, 'seriIlk', 0); kisa = 'İlk halkayı tak!'; }
  return {
    ...ortak, durum: 'surec', bilgi: b, tamam, haftaNo: w + 1, renk: b.renk,
    resim: resimAd, seriKisa: kisa,
    ust: `BUGÜN · ${GUN_B[gunNo(bugun)]} ${bugun.getDate()} ${AY_B[bugun.getMonth()]}`,
    baslik: tamam && !dinlenme ? 'Bugün tamam!' : b.baslik,
    alt: tamam && !dinlenme ? b.kisa + ' ✓' : b.alt,
    soz: sozu,
    satir: tamam && !dinlenme ? 'Bugün tamam!' : `Bugün: ${b.kisa}`,
    hafta: haftaKur(w, d),
  };
}

/* ---------- bildirimler: Yumak'ın ağzından (Scriptable yerel bildirimleri) ---------- */
const BKC = 'yumak-bildirim';
const B_VARSAYILAN = { su: true, antrenman: true, yemek: true, zincir: true };
const B_AD = {
  su: 'Su hatırlatmaları (10:30, 13:30, 16:30, 19:00)',
  antrenman: 'Antrenman günü sabahı (09:30)',
  yemek: 'Yemekten sonra yürüyüş (20:15)',
  zincir: 'Zincir tehlikede (21:00, gün işaretlenmediyse)',
};
const SU_SAAT = [[10, 30], [13, 30], [16, 30], [19, 0]];
function bAyar() {
  try { return { ...B_VARSAYILAN, ...(Keychain.contains(BKC) ? JSON.parse(Keychain.get(BKC)) : {}) }; } catch (e) { return { ...B_VARSAYILAN }; }
}
const isoGun = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
async function bildirimleriKur(m, baglanti) {
  if (!baglanti || baglanti.izle || !m.plan || !m.basTarih) return; // izleme linkinde bildirim yok
  const A = bAyar(), S = m.plan.YUMAK_SOZLER || {}, simdi = m.simdi, veri = m.veri || {};
  const N = m.plan.AYARLAR.haftaSayisi * 7;
  const anda = (gunOfs, h, dk) => { const d = new Date(simdi); d.setDate(d.getDate() + gunOfs); d.setHours(h, dk, 0, 0); return d; };
  const indeks = (d) => { const g = new Date(d); g.setHours(0, 0, 0, 0); return Math.round((g - m.basTarih) / 864e5); };
  const tur = (d) => { const f = indeks(d); return f < 0 || f >= N ? null : m.plan.TAKVIM[Math.floor(f / 7)][f % 7].tur; };
  const yapildi = (d) => { const f = indeks(d); return !!(veri.done || {})[`h${Math.floor(f / 7) + 1}g${(f % 7) + 1}`]; };
  const sec = (liste, yedek) => rastgele(liste && liste.length ? liste : [yedek]);
  const link = (sekme) => `${SITE}#kod-${baglanti.kod}${sekme ? '~' + sekme : ''}`;
  async function kur(id, acik, tarih, metin, sekme) {
    try {
      if (!acik || !tarih || !metin) { await Notification.removePending([id]); return; }
      const n = new Notification();
      n.identifier = id; n.threadIdentifier = 'yumak'; n.title = 'Yumak 🐾'; n.body = metin; n.openURL = link(sekme);
      n.setTriggerDate(tarih);
      await n.schedule(); // aynı kimlikle yeniden planlanınca eskisinin yerine geçer
    } catch (e) { /* bildirim izni yoksa sessizce geç */ }
  }
  // su: bugünün kalan saatleri; o saate kadar yeterli bardak işaretlendiyse o saat atlanır
  const bugunSu = ((veri.mutfak && veri.mutfak.kontrol && veri.mutfak.kontrol[isoGun(simdi)]) || {}).su || 0;
  for (let i = 0; i < SU_SAAT.length; i++) {
    const [h, dk] = SU_SAAT[i], t = anda(0, h, dk);
    await kur(`yumak-su-${i}`, A.su, t > simdi && bugunSu < (i + 1) * 2 ? t : anda(1, h, dk), sec(S.bildirimSu, 'Su içtin mi? 💧'), 'mutfak');
  }
  // antrenman günü sabahı
  const sabahOfs = anda(0, 9, 30) > simdi ? 0 : 1, sabahTur = tur(anda(sabahOfs, 12, 0));
  const sabahMetin = sabahTur === 'kuvvet' ? sec(S.bildirimKuvvet, 'Bugün kuvvet günü! 💪') : ['yuruyus', 'uzun', 'aralikli'].includes(sabahTur) ? sec(S.bildirimYuruyus, 'Bugün yürüyüş günü!') : null;
  await kur('yumak-antrenman', A.antrenman, sabahMetin ? anda(sabahOfs, 9, 30) : null, sabahMetin);
  // yemekten sonra yürüyüş
  const yT = anda(0, 20, 15);
  await kur('yumak-yemek', A.yemek, yT > simdi ? yT : anda(1, 20, 15), sec(S.bildirimYemek, 'Yemekten sonra 10 dakika yürüyelim mi?'));
  // zincir tehlikede: bugün işaretlenmediyse 21:00; işaretlendiyse yarına (yarın dinlenme değilse)
  const zT = anda(0, 21, 0), bt = tur(simdi), yt = tur(anda(1, 12, 0));
  const zTarih = zT > simdi && bt && bt !== 'dinlenme' && !yapildi(simdi) ? zT : (yt && yt !== 'dinlenme' ? anda(1, 21, 0) : null);
  await kur('yumak-zincir', A.zincir, zTarih, sec(S.bildirimZincir, 'Zincir tehlikede 🥺').replace(/\{n\}/g, m.seri || 0));
}
async function bildirimMenusu() {
  const A = bAyar(), anahtarlar = Object.keys(B_AD);
  for (;;) {
    const a = new Alert();
    a.title = 'Yumak bildirimleri';
    a.message = 'Açmak ya da kapatmak için dokun.';
    for (const k of anahtarlar) a.addAction(`${A[k] ? '✅' : '⬜️'} ${B_AD[k]}`);
    a.addCancelAction('Bitti');
    const i = await a.presentSheet();
    if (i < 0) break;
    A[anahtarlar[i]] = !A[anahtarlar[i]];
    Keychain.set(BKC, JSON.stringify(A));
  }
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
function alev(st, m, boy) { // seri: bugün tamamsa turuncu yanar, değilse gri bekler
  const a = st.addStack(); a.layoutHorizontally(); a.centerAlignContent(); a.spacing = 2;
  sembol(a, 'flame.fill', boy, m.seriYandi ? R.flame : R.ink, m.seriYandi ? 1 : 0.3);
  yazi(a, String(m.seri || 0), Font.heavyRoundedSystemFont(boy), m.seriYandi ? R.flameDeep : R.inkSoft, 1, 0.7);
  return a;
}
const seriVar = (m) => m.durum === 'surec' || m.durum === 'bitti';
function balon(st, metin, boy, satir = 2) {
  const b = st.addStack(); b.backgroundColor = renk(R.paper); b.cornerRadius = 10; b.borderWidth = 2; b.borderColor = renk(R.ink); b.setPadding(4, 8, 4, 8);
  yazi(b, metin, Font.semiboldRoundedSystemFont(boy), R.ink, satir, 0.75);
  return b;
}

/* ---------- boyutlar ---------- */
async function kucuk(m) {
  const w = new ListWidget(); arkaPlan(w); w.setPadding(10, 12, 10, 12);
  const ust = w.addStack(); ust.layoutHorizontally(); ust.centerAlignContent();
  if (seriVar(m)) alev(ust, m, 14); else yazi(ust, m.ust, Font.heavyRoundedSystemFont(10), R.inkSoft, 1, 0.6);
  ust.addSpacer();
  if (m.haftaNo) cip(ust, `H${m.haftaNo}`, TUR_RENK[m.renk] || R.paper, Font.heavyRoundedSystemFont(9));
  w.addSpacer(2);
  const orta = w.addStack(); orta.layoutHorizontally(); orta.addSpacer();
  const img = await resim(m.resim); if (img) { const i = orta.addImage(img); i.imageSize = new Size(72, 72); }
  orta.addSpacer();
  w.addSpacer(2);
  const t = yazi(w, m.baslik, Font.heavyRoundedSystemFont(14), R.ink, 1, 0.55); t.centerAlignText();
  if (seriVar(m)) { w.addSpacer(2); const k = yazi(w, m.seriKisa, Font.heavyRoundedSystemFont(11), m.seriYandi ? R.flameDeep : R.pinkDeep, 1, 0.6); k.centerAlignText(); }
  else if (m.hafta.length) { w.addSpacer(4); const dz = w.addStack(); dz.layoutHorizontally(); dz.addSpacer(); noktalar(dz, m.hafta, 10); dz.addSpacer(); }
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
  const bas = sag.addStack(); bas.layoutHorizontally(); bas.centerAlignContent();
  cip(bas, m.baslik, TUR_RENK[m.renk] || R.paper, Font.heavyRoundedSystemFont(16));
  if (seriVar(m)) { bas.addSpacer(7); alev(bas, m, 16); }
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
    yazi(w, `Zincir: ${m.seri || 0} gün · Rekor: ${m.rekor || 0} · Toplam: ${m.tamamSay}/${m.gunSay}${m.izle ? ' · izleme' : ''}`, Font.semiboldRoundedSystemFont(10), R.inkSoft, 1, 0.7);
  }
  return w;
}
function kilitDikdortgen(m) {
  const w = new ListWidget(); w.addAccessoryWidgetBackground = true; w.setPadding(4, 8, 4, 8);
  const ust = w.addStack(); ust.layoutHorizontally(); ust.centerAlignContent(); ust.spacing = 4;
  const s = SFSymbol.named(seriVar(m) ? 'flame.fill' : 'pawprint.fill'); s.applyFont(Font.boldSystemFont(11)); const si = ust.addImage(s.image); si.imageSize = new Size(11, 11);
  const u = ust.addText(seriVar(m) ? `${m.seri || 0} gün zincir` : 'Yumak'); u.font = Font.boldRoundedSystemFont(11);
  const b = w.addText(m.baslik); b.font = Font.heavyRoundedSystemFont(15); b.lineLimit = 1; b.minimumScaleFactor = 0.6;
  const a = w.addText(m.durum === 'surec' ? `${m.seriKisa} · ${m.tamamSay}/${m.gunSay}` : m.alt); a.font = Font.mediumRoundedSystemFont(11); a.lineLimit = 1; a.minimumScaleFactor = 0.7;
  return w;
}
function kilitSatir(m) {
  const w = new ListWidget();
  const s = SFSymbol.named(seriVar(m) ? 'flame.fill' : 'pawprint.fill'); w.addImage(s.image);
  w.addText(seriVar(m) ? `${m.seri || 0} · ${m.satir}` : m.satir);
  return w;
}
function kilitDaire(m) {
  const w = new ListWidget(); w.addAccessoryWidgetBackground = true;
  const s = SFSymbol.named(seriVar(m) ? 'flame.fill' : 'pawprint.fill'); s.applyFont(Font.boldSystemFont(16));
  const st = w.addStack(); st.layoutHorizontally(); st.addSpacer(); const im = st.addImage(s.image); im.imageSize = new Size(16, 16); st.addSpacer();
  const t = w.addText(seriVar(m) ? String(m.seri || 0) : '–'); t.font = Font.heavyRoundedSystemFont(16); t.centerAlignText(); t.minimumScaleFactor = 0.6;
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
  const aralik = m.durum === 'surec' && !m.seriYandi && !m.tamam ? 20 : 45;
  w.refreshAfterDate = new Date(Math.min(Date.now() + aralik * 60e3, geceYarisi.getTime()));
  return w;
}

/* ---------- çalıştır ---------- */
let baglanti = kayitliBaglanti();
if (config.runsInWidget) {
  const m = await modelKur(baglanti);
  Script.setWidget(await ciz(config.widgetFamily || 'medium', m, baglanti));
  await bildirimleriKur(m, baglanti);
} else {
  if (!baglanti) baglanti = await linkSor();
  const a = new Alert();
  a.title = 'Yumak widget\'ı 🐾';
  a.message = baglanti ? (baglanti.izle ? 'İzleme linkiyle bağlı (sadece okur).' : 'Kişisel linkle bağlı.') + '\n\nAna ekrana eklemek için: boş bir yere basılı tut → + → Scriptable → boyut seç → widget\'a basılı tut → Widget\'ı Düzenle → Script: bu betik.' : 'Henüz bağlı değil.';
  a.addAction('Orta boy önizle'); a.addAction('Küçük önizle'); a.addAction('Büyük önizle'); a.addAction('Şifre / bağlantı değiştir'); a.addAction('Bildirimler');
  a.addCancelAction('Kapat');
  const i = await a.presentAlert();
  if (i === 3) { const yeni = await linkSor(); if (yeni) baglanti = yeni; }
  if (i === 4) await bildirimMenusu();
  if (baglanti) await bildirimleriKur(await modelKur(baglanti), baglanti); // ilk seferde bildirim izni burada sorulur
  if (i >= 0 && i <= 2) {
    const boy = ['medium', 'small', 'large'][i], m = await modelKur(baglanti), w = await ciz(boy, m, baglanti);
    if (boy === 'small') await w.presentSmall(); else if (boy === 'large') await w.presentLarge(); else await w.presentMedium();
  }
}
Script.complete();
