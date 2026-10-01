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
      history.replaceState(null, '', location.pathname + location.search + (m[3] === 'mutfak' ? '#mutfak' : ''));
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
export async function turet(sifre) {
  const enc = new TextEncoder();
  const anahtar = await crypto.subtle.importKey('raw', enc.encode(String(sifre).normalize('NFC')), 'PBKDF2', false, ['deriveBits']);
  const b = new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(GIRIS_TUZ), iterations: GIRIS_TEKRAR, hash: 'SHA-256' }, anahtar, 256));
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
