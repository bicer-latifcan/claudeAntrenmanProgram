// Bulut yedeği: Firebase Firestore (REST, ek kütüphane yok).
// projectId ve apiKey boşsa hiçbir şey yapmaz; site sadece tarayıcıda saklar.
// Bu iki bilgi gizli değildir; güvenliği Firestore kuralları sağlar
// (sadece uzun, tahmin edilemez kodu bilen kişi o kaydı okuyup yazabilir).
export const BULUT = {
  projectId: '',
  apiKey: '',
};

const KOD_KEY = 'yumak-bulut-kod';
const KOLEKSIYON = 'ilerleme';
const ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

export const hazir = () => Boolean(BULUT.projectId && BULUT.apiKey);
const adres = (kod) => `https://firestore.googleapis.com/v1/projects/${BULUT.projectId}/databases/(default)/documents/${KOLEKSIYON}/${kod}?key=${BULUT.apiKey}`;

// Kişisel link: ...#kod-XXXX  → kod bu cihaza kaydedilir, adres çubuğundan silinir
export function kodAl() {
  try {
    const m = location.hash.match(/^#kod-([A-Za-z0-9]{24,})$/);
    if (m) { localStorage.setItem(KOD_KEY, m[1]); history.replaceState(null, '', location.pathname + location.search); return m[1]; }
    return localStorage.getItem(KOD_KEY);
  } catch { return null; }
}
export function yeniKod() {
  const b = crypto.getRandomValues(new Uint8Array(28));
  let s = ''; for (const x of b) s += ABC[x % ABC.length];
  try { localStorage.setItem(KOD_KEY, s); } catch { /* yok */ }
  return s;
}
export const kisiselLink = (kod) => `${location.origin}${location.pathname}#kod-${kod}`;

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
