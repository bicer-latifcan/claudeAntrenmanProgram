// Bulut yedeği: Firebase Firestore (REST, ek kütüphane yok).
// projectId ve apiKey boşsa hiçbir şey yapmaz; site sadece tarayıcıda saklar.
// Bu iki bilgi gizli değildir; güvenliği Firestore kuralları sağlar
// (sadece uzun, tahmin edilemez kodu bilen kişi o kaydı okuyup yazabilir).
export const BULUT = {
  projectId: 'yumak-8-hafta',
  apiKey: 'AIzaSyCWo2qiv7f5j6mv_V-Pvjw3n26aiMiaojg',
};

const KOD_KEY = 'yumak-bulut-kod';
const KOLEKSIYON = 'ilerleme';
const ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

export const hazir = () => Boolean(BULUT.projectId && BULUT.apiKey);
const adres = (kod) => `https://firestore.googleapis.com/v1/projects/${BULUT.projectId}/databases/(default)/documents/${KOLEKSIYON}/${kod}?key=${BULUT.apiKey}`;

// Linkler:
//   ...#kod-XXXX   kişisel link: ilerleme bu cihaza bağlanır, her işlem buluta yazılır
//   ...#izle-XXXX  izleme linki: aynı ilerlemeyi salt okunur gösterir, hiçbir şey yazmaz
// Kod cihaza kaydedilir ve adres çubuğundan silinir.
const IZLE_KEY = 'yumak-izle-kod';
export function linkModu() {
  try {
    const m = location.hash.match(/^#(kod|izle)-([A-Za-z0-9]{24,})(?:~(\w+))?$/);
    if (m) {
      history.replaceState(null, '', location.pathname + location.search + (m[3] === 'mutfak' || m[3] === 'arsiv' ? `#${m[3]}` : ''));
      if (m[1] === 'izle') { localStorage.setItem(IZLE_KEY, m[2]); return { kod: m[2], izle: true, yeni: false, sekme: m[3] }; }
      const eski = localStorage.getItem(KOD_KEY);
      localStorage.setItem(KOD_KEY, m[2]); localStorage.removeItem(IZLE_KEY);
      return { kod: m[2], izle: false, yeni: eski !== m[2], sekme: m[3] };   // bu cihazda ilk kez: buluttaki kayıt kazanır
    }
    const iz = localStorage.getItem(IZLE_KEY);
    if (iz) return { kod: iz, izle: true, yeni: false };
    return { kod: localStorage.getItem(KOD_KEY), izle: false, yeni: false };
  } catch { return { kod: null, izle: false, yeni: false }; }
}
export function izlemedenCik() { try { localStorage.removeItem(IZLE_KEY); } catch { /* yok */ } }
export const izlemeLinki = (kod) => `${location.origin}${location.pathname}#izle-${kod}`;
export function yeniKod() {
  const b = crypto.getRandomValues(new Uint8Array(28));
  let s = ''; for (const x of b) s += ABC[x % ABC.length];
  try { localStorage.setItem(KOD_KEY, s); } catch { /* yok */ }
  return s;
}
export const kisiselLink = (kod) => `${location.origin}${location.pathname}#kod-${kod}`;
// yapıştırılan link ya da koddan kodu çıkar (iPhone'da ana ekran uygulaması Safari'den ayrı hafıza kullanır)
export function koduKaydet(metin) {
  const m = String(metin).trim().match(/(?:#(?:kod|izle)-)?([A-Za-z0-9]{24,})\s*$/);
  if (!m) return null;
  try { localStorage.setItem(KOD_KEY, m[1]); localStorage.removeItem(IZLE_KEY); } catch { /* yok */ }
  return m[1];
}

function zamanAsimi(ms) { const c = new AbortController(); setTimeout(() => c.abort(), ms); return c.signal; }

export async function indir(kod) {
  const r = await fetch(adres(kod), { signal: zamanAsimi(6000) });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error('bulut-okuma-' + r.status);
  const j = await r.json();
  return { veri: JSON.parse(j.fields.veri.stringValue), zaman: Number(j.fields.zaman.integerValue) };
}
export async function yukle(kod, veri) {
  const body = { fields: { veri: { stringValue: JSON.stringify(veri) }, zaman: { integerValue: String(veri.zaman || Date.now()) } } };
  const r = await fetch(adres(kod) + '&updateMask.fieldPaths=veri&updateMask.fieldPaths=zaman', {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive: true, signal: zamanAsimi(8000),
  });
  if (!r.ok) throw new Error('bulut-yazma-' + r.status);
}

/* ---------- şifreyle giriş ----------
   Şifre hiçbir yerde saklanmaz. Şifreden PBKDF2 (SHA-256, sabit tuz) ile 28 harflik bir "işaretçi kodu" türetilir.
   Buluttaki işaretçi kaydı ({isaretci: asılKod}) asıl ilerleme kaydını gösterir; böylece eski linkler,
   widget ve izleme linki aynı kayıtla çalışmaya devam eder. Widget aynı hesabı kendi içinde yapar. */
const GIRIS_KEY = 'yumak-giris';
export const GIRIS_TUZ = 'yumak-8-hafta:giris:v1', GIRIS_TEKRAR = 30000;
export async function turet(sifre, tuz = GIRIS_TUZ, tekrar = GIRIS_TEKRAR) {
  const enc = new TextEncoder();
  const anahtar = await crypto.subtle.importKey('raw', enc.encode(String(sifre).normalize('NFC')), 'PBKDF2', false, ['deriveBits']);
  const b = new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(tuz), iterations: tekrar, hash: 'SHA-256' }, anahtar, 256));
  let s = ''; for (let i = 0; i < 28; i++) s += ABC[b[i] % ABC.length];
  return s;
}
export const girisli = () => { try { return localStorage.getItem(GIRIS_KEY) === '1' && !!localStorage.getItem(KOD_KEY); } catch { return false; } };
export const mevcutKod = () => { try { return localStorage.getItem(KOD_KEY); } catch { return null; } };
// şifreyle giriş: işaretçiyi bul, asıl kodu cihaza kaydet
export async function sifreyleGir(sifre) {
  const p = await turet(sifre), c = await indir(p);
  if (!c) return { hata: 'yok' };
  const hedef = (c.veri && c.veri.isaretci) || p;
  localStorage.setItem(KOD_KEY, hedef); localStorage.removeItem(IZLE_KEY); localStorage.setItem(GIRIS_KEY, '1');
  localStorage.setItem('yumak-ilk-baglanti', '1'); // bu cihazda buluttaki kayıt kazansın
  return { kod: hedef };
}
// yeni şifre: mevcut kayda (eski link/cihazdaki kod) ya da yeni bir kayda işaretçi oluştur
export async function sifreOlustur(sifre, hedefKod, ilkVeri) {
  const p = await turet(sifre), varolan = await indir(p);
  if (varolan) { // aynı kayda zaten bağlıysa (ör. ikinci cihaz) sorun yok: giriş yap
    if (hedefKod && varolan.veri && varolan.veri.isaretci === hedefKod) return sifreyleGir(sifre);
    return { hata: 'var' };
  }
  const hedef = hedefKod || yeniKod();
  if (!hedefKod && ilkVeri) await yukle(hedef, { ...ilkVeri, zaman: Date.now() });
  await yukle(p, { isaretci: hedef, zaman: Date.now() });
  localStorage.setItem(KOD_KEY, hedef); localStorage.removeItem(IZLE_KEY); localStorage.setItem(GIRIS_KEY, '1');
  return { kod: hedef };
}
export function cikisYap(anahtarlar = []) {
  for (const k of [KOD_KEY, IZLE_KEY, GIRIS_KEY, 'yumak-ilk-baglanti', 'yumak-uygulama-karsilandi', ...anahtarlar]) try { localStorage.removeItem(k); } catch { /* yok */ }
}

/* ---------- admin paneli için kayıt defteri ----------
   Şifreyle giren her cihaz, kendi kodunu ortak bir deftere ŞİFRELİ olarak ekler. Defteri sadece admin
   şifresiyle açılan özel anahtar çözebilir; defteri okuyan biri kodları göremez. Admin paneli kayıtları
   sadece okur. Biri defteri bozsa bile her cihaz günde bir kez kendi kaydını kontrol edip geri ekler. */
// Admin panelinin kurulumda verdiği açık anahtar (gizli değildir). Boşken kimse kaydedilmez.
export const ADMIN_ANAHTAR = null;
const YEREL = typeof location !== 'undefined' && /^(127\.0\.0\.1|localhost)$/.test(location.hostname);
export const DEFTER = YEREL ? 'TestDefteriYumakAyHiXa2345PQ' : 'KayitDefteriYumakAyHiXa2345P';
export function adminAnahtari() { // yerelde denemek için test anahtarı kullanılabilir
  if (ADMIN_ANAHTAR) return ADMIN_ANAHTAR;
  if (!YEREL) return null;
  try { return JSON.parse(localStorage.getItem('yumak-test-admin-anahtar') || 'null'); } catch { return null; }
}
export const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
export const b64Oku = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
export async function defterOku() {
  const r = await fetch(adres(DEFTER), { cache: 'no-store', signal: zamanAsimi(8000) });
  if (r.status === 404) return { liste: [], guncel: null };
  if (!r.ok) throw new Error('defter-okuma-' + r.status);
  const j = await r.json();
  let liste = [];
  try { liste = JSON.parse(j.fields.veri.stringValue).kayitlar || []; } catch { /* bozuk defter: baştan */ }
  return { liste: Array.isArray(liste) ? liste : [], guncel: j.updateTime };
}
async function defterYaz(liste, guncel) { // aynı anda yazan olursa (updateTime değişmişse) reddedilir
  const body = { fields: { veri: { stringValue: JSON.stringify({ kayitlar: liste }) }, zaman: { integerValue: String(Date.now()) } } };
  const on = guncel ? `&currentDocument.updateTime=${encodeURIComponent(guncel)}` : '&currentDocument.exists=false';
  const r = await fetch(adres(DEFTER) + '&updateMask.fieldPaths=veri&updateMask.fieldPaths=zaman' + on, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: zamanAsimi(8000),
  });
  if (!r.ok) throw new Error('defter-yazma-' + r.status);
}
async function sifrele(pub, nesne) { // ECDH (P-256) ile tek kullanımlık anahtar + AES-GCM
  const pk = await crypto.subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', x: pub.x, y: pub.y, ext: true }, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const gecici = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey']);
  const k = await crypto.subtle.deriveKey({ name: 'ECDH', public: pk }, gecici.privateKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const c = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, new TextEncoder().encode(JSON.stringify(nesne)));
  return { e: b64(await crypto.subtle.exportKey('raw', gecici.publicKey)), iv: b64(iv), c: b64(c) };
}
function cihazAdi() {
  const u = navigator.userAgent, uyg = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const ad = /iPhone/.test(u) ? 'iPhone' : /iPad/.test(u) ? 'iPad' : /Android/.test(u) ? 'Android' : /Macintosh/.test(u) ? 'Mac' : /Windows/.test(u) ? 'Windows' : 'Diğer';
  return uyg ? `${ad} (uygulama)` : ad;
}
// giriş yapmış cihaz: deftere kayıtlı mı bak, değilse ekle (günde en fazla bir kez kontrol)
export async function kaydol(kod) {
  const pub = adminAnahtari(); if (!pub || !kod || !hazir()) return;
  let yerel = null; try { yerel = JSON.parse(localStorage.getItem('yumak-kayit') || 'null'); } catch { /* yok */ }
  const gun = new Date().toDateString(), ayni = yerel && yerel.kod === kod && yerel.anahtar === pub.x;
  if (ayni && yerel.kontrol === gun) return;
  for (let deneme = 0; deneme < 3; deneme++) {
    const d = await defterOku();
    if (ayni && d.liste.some((k) => k && k.id === yerel.id)) { localStorage.setItem('yumak-kayit', JSON.stringify({ ...yerel, kontrol: gun })); return; }
    const id = b64(crypto.getRandomValues(new Uint8Array(9))), t = ayni ? yerel.t : Date.now();
    d.liste.push({ id, ...(await sifrele(pub, { kod, t, cihaz: cihazAdi() })) });
    try { await defterYaz(d.liste, d.guncel); } catch { continue; } // biri aynı anda yazdıysa tekrar oku
    localStorage.setItem('yumak-kayit', JSON.stringify({ id, kod, anahtar: pub.x, kontrol: gun, t }));
    return;
  }
}
