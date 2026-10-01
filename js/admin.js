// Admin paneli: kullanıcıların durumunu SADECE GÖRÜNTÜLER. Hiçbir kullanıcı kaydına yazmaz.
// Admin şifresi saklanmaz: şifreden kasa kodu ve kasa anahtarı türetilir; kasada (şifreli) özel anahtar durur.
// Özel anahtar, sitenin kayıt defterindeki şifreli kodları çözer.
import * as bulut from './bulut.js';
import { AYARLAR, TAKVIM, ANTRENMANLAR } from './program.js';
import { OGUNLER } from './mutfak-veri.js';
import { ozetHesapla } from './ozet.js';
import { hikayeVerisi, hikayeAc } from './hikaye.js';
import { drawMoon } from './fx.js';
import { Grid, paint } from './pixel.js';
import * as Y from './yumak-art.js';
import { sifreKontrol, sifreOner } from './giris.js';

const KASA_TUZ = 'yumak-admin:kasa:v1', ANAHTAR_TUZ = 'yumak-admin:anahtar:v1', TEKRAR = 150000;
const AY = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const N = AYARLAR.haftaSayisi * 7;
const kok = document.getElementById('panel');
const tarihOku = (s) => { const [y, m, g] = String(s).split('-').map(Number); return new Date(y, m - 1, g); };
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const tarihYaz = (d) => `${d.getDate()} ${AY[d.getMonth()]}`;
const kac = (ms) => { const dk = Math.round((Date.now() - ms) / 60000); return dk < 1 ? 'az önce' : dk < 60 ? `${dk} dk önce` : dk < 1440 ? `${Math.round(dk / 60)} saat önce` : `${Math.round(dk / 1440)} gün önce`; };
const kacEk = (dt) => `${tarihYaz(dt)} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
const kacir = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- oturum: özel anahtar bu cihazda (IndexedDB, dışarı aktarılamaz) ---------- */
function db() { return new Promise((res, rej) => { const r = indexedDB.open('yumak-admin', 1); r.onupgradeneeded = () => r.result.createObjectStore('o'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
async function oturum(deger) {
  const d = await db();
  return new Promise((res, rej) => {
    const tx = d.transaction('o', deger === undefined ? 'readonly' : 'readwrite'), st = tx.objectStore('o');
    const r = deger === undefined ? st.get('oturum') : deger === null ? st.delete('oturum') : st.put(deger, 'oturum');
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
}
async function aesAnahtar(sifre) {
  const enc = new TextEncoder();
  const k = await crypto.subtle.importKey('raw', enc.encode(String(sifre).normalize('NFC')), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: enc.encode(ANAHTAR_TUZ), iterations: TEKRAR, hash: 'SHA-256' }, k, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function kur(sifre) {
  const kasa = await bulut.turet(sifre, KASA_TUZ, TEKRAR);
  if (await bulut.indir(kasa)) return { hata: 'var' };
  const cift = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey']);
  const pub = await crypto.subtle.exportKey('jwk', cift.publicKey), priv = await crypto.subtle.exportKey('jwk', cift.privateKey);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const c = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await aesAnahtar(sifre), new TextEncoder().encode(JSON.stringify(priv)));
  await bulut.yukle(kasa, { admin: 1, pub: { x: pub.x, y: pub.y }, iv: bulut.b64(iv), c: bulut.b64(c), zaman: Date.now() });
  return gir(sifre);
}
async function gir(sifre) {
  const kasa = await bulut.turet(sifre, KASA_TUZ, TEKRAR), k = await bulut.indir(kasa);
  if (!k || !k.veri.admin) return { hata: 'yok' };
  let priv;
  try { priv = JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bulut.b64Oku(k.veri.iv) }, await aesAnahtar(sifre), bulut.b64Oku(k.veri.c)))); } catch { return { hata: 'yok' }; }
  const anahtar = await crypto.subtle.importKey('jwk', priv, { name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveKey']);
  await oturum({ anahtar, pub: k.veri.pub });
  return { ok: true };
}
async function coz(anahtar, k) {
  const e = await crypto.subtle.importKey('raw', bulut.b64Oku(k.e), { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const a = await crypto.subtle.deriveKey({ name: 'ECDH', public: e }, anahtar, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bulut.b64Oku(k.iv) }, a, bulut.b64Oku(k.c))));
}
const kurulumAnahtari = (pub) => `yumak-anahtar:${pub.x}.${pub.y}`;

/* ---------- giriş ekranı ---------- */
function girisCiz(mod = 'giris', mesaj = '', tur = '') {
  const kurulum = mod === 'kur';
  kok.innerHTML = `<section class="card ad-giris">
    <canvas class="pix ad-yumak" width="88" height="88" aria-hidden="true"></canvas>
    <p class="eyebrow">Yumak'la 8 Hafta</p>
    <h1>${kurulum ? 'Admin paneli kurulumu' : 'Admin paneli'}</h1>
    <p class="muted">${kurulum ? 'Sadece senin bileceğin güçlü bir admin şifresi belirle. Bu şifre kullanıcıların şifresinden ayrıdır ve hiçbir yerde saklanmaz; unutulursa geri getirilemez.' : 'Admin şifrenle gir. Panel kullanıcıların durumunu sadece gösterir; hiçbir şeyi değiştirmez.'}</p>
    <form class="ad-form" novalidate>
      <label class="field">Admin şifresi<input type="password" id="adSifre" autocomplete="${kurulum ? 'new-password' : 'current-password'}" autocapitalize="off" spellcheck="false"></label>
      ${kurulum ? `<label class="field">Şifre (tekrar)<input type="password" id="adSifre2" autocomplete="new-password" autocapitalize="off" spellcheck="false"></label>
      <div class="row-end ad-oneri"><button type="button" class="pbtn small" id="adOner">Güçlü şifre öner</button></div>` : ''}
      <p class="kapi-mesaj ${tur}" role="status">${mesaj}</p>
      <div class="row-end"><button type="button" class="pbtn small ghost" id="adDegis">${kurulum ? 'Zaten kurdum, giriş yap' : 'İlk kez mi? Kurulum'}</button><button type="submit" class="pbtn primary" id="adTamam">${kurulum ? 'Kur' : 'Giriş'}</button></div>
    </form></section>`;
  const g = new Grid(Y.W, Y.H); Y.sit(g, { t: 0.4, look: { x: 0, y: 0 }, prop: 'clipboard', ...(tur === 'hata' ? { eyes: 'sad', mouth: 'frown' } : {}) }); paint(kok.querySelector('.ad-yumak'), g);
  const s1 = kok.querySelector('#adSifre'), s2 = kok.querySelector('#adSifre2');
  kok.querySelector('#adDegis').onclick = () => girisCiz(kurulum ? 'giris' : 'kur');
  const on = kok.querySelector('#adOner'); if (on) on.onclick = () => { const o = sifreOner(); s1.value = o; s2.value = o; s1.type = s2.type = 'text'; };
  kok.querySelector('form').onsubmit = async (e) => {
    e.preventDefault();
    const sifre = s1.value.trim();
    if (kurulum) { const sorun = sifreKontrol(sifre); if (sorun) return girisCiz(mod, sorun, 'hata'); if (s2.value.trim() !== sifre) return girisCiz(mod, 'İki şifre aynı değil.', 'hata'); }
    else if (!sifre) return girisCiz(mod, 'Şifreyi yazmayı unuttun.', 'hata');
    kok.querySelector('#adTamam').disabled = true; kok.querySelector('.kapi-mesaj').textContent = 'Yumak kasayı açıyor…';
    try {
      const r = kurulum ? await kur(sifre) : await gir(sifre);
      if (r.hata === 'var') return girisCiz('giris', 'Bu şifreyle zaten bir panel kurulmuş. Giriş yap.', 'hata');
      if (r.hata === 'yok') return girisCiz(mod, 'Şifre yanlış ya da panel henüz kurulmamış.', 'hata');
      panel();
    } catch { girisCiz(mod, 'Buluta ulaşamadım. İnterneti kontrol edip tekrar dene.', 'hata'); }
  };
  setTimeout(() => s1.focus(), 50);
}

/* ---------- panel ---------- */
let yenileZaman = 0, sonVeri = [];
async function panel() {
  const o = await oturum().catch(() => null);
  if (!o) return girisCiz();
  const acik = bulut.ADMIN_ANAHTAR && bulut.ADMIN_ANAHTAR.x === o.pub.x, yerelTest = !bulut.ADMIN_ANAHTAR && bulut.adminAnahtari()?.x === o.pub.x;
  kok.innerHTML = `<header class="ad-bas">
      <div><p class="eyebrow">Yumak'la 8 Hafta</p><h1>Admin paneli</h1><p class="muted">Sadece görüntüleme · <span id="adSaat">yükleniyor…</span></p></div>
      <div class="row-end"><button type="button" class="pbtn small" id="adYenile">Yenile</button><button type="button" class="pbtn small ghost" id="adCikis">Çıkış</button></div>
    </header>
    ${acik || yerelTest ? '' : `<section class="card ad-uyari"><h2>Son adım: kayıt henüz kapalı</h2>
      <p>Kullanıcıların bu panele kendiliğinden gelmesi için aşağıdaki anahtarı Claude'a gönder; siteye eklenince kayıt açılır. Bu anahtar gizli değildir, panelin kilidini açmaz.</p>
      <code class="ad-anahtar">${kurulumAnahtari(o.pub)}</code>
      <div class="row-end"><button type="button" class="pbtn small primary" id="adKopya">Anahtarı kopyala</button></div></section>`}
    <div id="adListe" class="ad-liste"><p class="muted">Kayıtlar okunuyor…</p></div>`;
  kok.querySelector('#adYenile').onclick = () => yukleListe(o);
  kok.querySelector('#adCikis').onclick = async () => { await oturum(null); girisCiz(); };
  const kp = kok.querySelector('#adKopya'); if (kp) kp.onclick = async () => { try { await navigator.clipboard.writeText(kurulumAnahtari(o.pub)); kp.textContent = 'Kopyalandı!'; } catch { kp.textContent = 'Seçip kopyala'; } };
  await yukleListe(o);
  clearInterval(yenileZaman); yenileZaman = setInterval(() => { if (!document.hidden) yukleListe(o); }, 60000);
}
async function yukleListe(o) {
  const liste = kok.querySelector('#adListe'); if (!liste) return;
  try {
    const d = await bulut.defterOku(), kisiler = new Map();
    for (const k of d.liste) { // aynı kişinin birden çok cihazı tek kartta
      let x; try { x = await coz(o.anahtar, k); } catch { continue; } // bu anahtarla açılmayan kayıt: geç
      if (!x?.kod) continue;
      const v = kisiler.get(x.kod);
      if (v) { v.cihazlar.add(x.cihaz); v.t = Math.min(v.t, x.t); } else kisiler.set(x.kod, { kod: x.kod, t: x.t, cihazlar: new Set([x.cihaz]) });
    }
    const veriler = await Promise.all([...kisiler.values()].map(async (k) => ({ ...k, c: await bulut.indir(k.kod).catch(() => undefined) })));
    veriler.sort((a, b) => (b.c?.zaman || 0) - (a.c?.zaman || 0));
    sonVeri = veriler;
    liste.innerHTML = veriler.length ? veriler.map((v, i) => kart(v, i)).join('') : '<section class="card"><h2>Henüz kimse yok</h2><p class="muted">Kullanıcılar siteye şifreyle girdiğinde burada görünür.</p></section>';
    for (const c of liste.querySelectorAll('canvas[data-ay]')) drawMoon(c, +c.dataset.ay, 16);
    kok.querySelector('#adSaat').textContent = `${veriler.length} kullanıcı · ${kacEk(new Date())} itibarıyla, dakikada bir yenilenir`;
  } catch { liste.innerHTML = '<section class="card"><p>Kayıtlar okunamadı (internet?). Birazdan tekrar denenecek.</p></section>'; }
}
kok.addEventListener('click', (e) => {
  const b = e.target.closest('[data-izle]'); if (!b) return;
  const [i, a] = b.dataset.izle.split(':').map(Number), v = sonVeri[i]?.c?.veri; if (!v) return;
  const t = v.arsiv?.[a];
  if (t) hikayeAc(hikayeVerisi({ ...t.ozet }, { tur: t.tur }), { dosyaAdi: `yumak-${t.tur}-tur` });
  else hikayeAc(hikayeVerisi(ozetHesapla({ ...v, bugun: gunNo(v) }), { tur: (v.arsiv?.length || 0) + 1, ara: true }), { dosyaAdi: 'yumak-simdiye-kadar' });
});

function gunNo(v) { const b = new Date(); b.setHours(0, 0, 0, 0); return Math.floor((b - tarihOku(v.start)) / 864e5); }
const anahtar = (i) => `h${Math.floor(i / 7) + 1}g${(i % 7) + 1}`, gunu = (i) => TAKVIM[Math.floor(i / 7)][i % 7];
function gunAd(g) {
  if (g.tur === 'kuvvet') { const a = ANTRENMANLAR[g.a]; return `${a?.ad || 'Kuvvet'} + ${g.yemek} dk yürüyüş`; }
  return { yuruyus: `${g.dk} dk tempolu yürüyüş`, uzun: `${g.dk} dk uzun yürüyüş`, aralikli: `${g.dk} dk aralıklı yürüyüş` }[g.tur] || 'Dinlenme günü';
}
function zincir(v, bugun) { // bugünden geriye: tamamlanan ya da dinlenme günleri (bugün henüz yapılmadıysa zinciri bozmaz)
  let n = 0;
  for (let i = Math.min(bugun, N - 1); i >= 0; i--) {
    const ok = v.done?.[anahtar(i)] || gunu(i).tur === 'dinlenme';
    if (ok) n++; else if (i === bugun) continue; else break;
  }
  return n;
}
function kart(k, idx) {
  const v = k.c?.veri;
  const ust = `<div class="ad-kisi"><div><p class="eyebrow">Kullanıcı ${idx + 1}</p>
    <h2>${v ? `Son hareket: ${kac(k.c.zaman)}` : 'Kayıt boş'}</h2><p class="muted">${kacir([...k.cihazlar].join(', '))} · kayıt ${tarihYaz(new Date(k.t))}${v ? ` · son yedek ${kacEk(new Date(k.c.zaman))}` : ''}</p></div></div>`;
  if (!v) return `<section class="card ad-kart">${ust}</section>`;
  const b = gunNo(v), tur = (v.arsiv?.length || 0) + 1, o = ozetHesapla({ ...v, bugun: b });
  const bas = tarihOku(v.start), bit = new Date(bas); bit.setDate(bas.getDate() + N - 1);
  let durum;
  if (b < 0) durum = `${tur}. tur ${tarihYaz(bas)} günü başlıyor (${-b} gün sonra)`;
  else if (b >= N) durum = `${tur}. tur bitti (${tarihYaz(bit)}). Hikâyeyi izleyince arşivlenecek.`;
  else { const g = gunu(b), yapildi = v.done?.[anahtar(b)]; durum = `${tur}. tur · Hafta ${Math.floor(b / 7) + 1}, gün ${(b % 7) + 1} · Bugün: ${gunAd(g)} ${g.tur === 'dinlenme' ? '' : yapildi ? '<b class="ad-ok">✓ yapıldı</b>' : '<b class="ad-bekle">henüz değil</b>'}`; }
  const gecen = o.gecen ?? 0, yuzde = gecen ? Math.round(o.tamam / gecen * 100) : 0;
  // 8 haftalık mini takvim
  let takvim = '<div class="ad-takvim" aria-label="8 haftalık takvim">';
  for (let i = 0; i < N; i++) {
    const g = gunu(i), d = v.done?.[anahtar(i)], c = g.tur === 'dinlenme' ? 'd' : d ? 'x' : i < b ? 'k' : 'b';
    takvim += `<span class="ad-g ad-${c}${i === b ? ' ad-bugun' : ''}" title="H${Math.floor(i / 7) + 1} G${(i % 7) + 1}: ${gunAd(g)}${d ? ' ✓' : ''}"></span>`;
  }
  takvim += '</div>';
  // mutfak bugün
  const bi = iso(new Date()), m = v.mutfak || {}, kt = m.kontrol?.[bi], sec = m.gun?.[bi]?.sec || {};
  const ogun = Object.entries(sec).map(([og, id]) => `${OGUNLER[og]?.ad || og}: ${kacir(OGUNLER[og]?.secenekler?.[id]?.ad || id)}`);
  const mutfak = kt || ogun.length ? `<ul class="ad-mini">
      ${kt ? `<li>💧 Su <b>${kt.su || 0}/8</b></li><li>🥦 Sebze <b>${kt.sebze || 0}/3</b></li><li>🥚 Protein <b>${(kt.protein || []).map((p) => (p ? '✓' : '·')).join(' ') || '·'}</b></li><li>🥤 Şekerli içecek yok <b>${kt.seker ? '✓' : '·'}</b></li><li>🚶 Yürüyüş <b>${kt.yuru ? '✓' : '·'}</b></li>` : ''}
    </ul>${ogun.length ? `<p class="ad-kucuk">${ogun.join(' · ')}</p>` : ''}` : '<p class="ad-kucuk muted">Bugün mutfakta işaretleme yok.</p>';
  const agir = o.agirlik.length ? `<ul class="ad-agir">${o.agirlik.map((a) => `<li><span>${kacir(a.ad)}</span><b>${a.ilk} → ${a.son} kg${a.fark > 0 ? ` <em>+${a.fark}</em>` : ''}</b></li>`).join('')}</ul>` : '<p class="ad-kucuk muted">Bu turda ağırlık kaydı yok.</p>';
  const turlar = (v.arsiv || []).map((t, a) => { const y = t.ozet.toplam ? Math.round(t.ozet.tamam / t.ozet.toplam * 100) : 0; return `<li><span>${t.tur}. tur · ${tarihYaz(tarihOku(t.ozet.start))}–${tarihYaz(tarihOku(t.ozet.bitis))} · %${y}</span><button type="button" class="pbtn small" data-izle="${idx}:${a}">▶ Hikâye</button></li>`; }).join('');
  return `<section class="card ad-kart">${ust}
    <p class="ad-durum">${durum}</p>
    <div class="ad-sayilar"><div><b>${o.tamam}/${gecen}</b><span>geçen günden tamam (%${yuzde})</span></div><div><b>${b >= 0 && b < N ? zincir(v, b) : 0}</b><span>gün güncel zincir</span></div><div><b>${o.rekor}</b><span>gün en uzun zincir</span></div><div><b>${Math.round(o.yuruDk)}</b><span>dk yürüyüş</span></div></div>
    <div class="ad-aylar">${o.haftalar.map((h) => `<canvas class="pix" data-ay="${h}"></canvas>`).join('')}</div>
    ${takvim}
    <div class="ad-iki"><div><h3>Mutfak · bugün</h3>${mutfak}</div><div><h3>Ağırlıklar (bu tur)</h3>${agir}</div></div>
    <div><h3>Turlar</h3><ul class="ad-turlar">${turlar}${b >= 0 ? `<li><span>${tur}. tur · şimdiye kadar</span><button type="button" class="pbtn small" data-izle="${idx}:-1">▶ Hikâye</button></li>` : ''}</ul></div>
  </section>`;
}

panel();
