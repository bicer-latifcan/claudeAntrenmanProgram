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
