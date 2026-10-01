// Arşiv sekmesi: biten turların "Ay nasıl geçti?" hikâyeleri. İzle, video ya da resim olarak indir.
import { Grid, paint } from './pixel.js';
import * as Y from './yumak-art.js';
import { drawMoon } from './fx.js';
import { videoDestekli } from './hikaye.js';

const AY = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const tarihOku = (s) => { const [y, m, g] = String(s).split('-').map(Number); return new Date(y, m - 1, g); };
const tarihYaz = (s) => { const d = tarihOku(s); return `${d.getDate()} ${AY[d.getMonth()]}`; };
const ekAl = (s) => ['ta', 'ta', 'ta', 'da', 'ta', 'da', 'da', 'ta', 'de', 'de', 'da', 'ta'][tarihOku(s).getMonth()]; // Ocak'ta, Eylül'de…

export function initArsiv({ state, ozet, izle }) {
  const kok = document.getElementById('sayfaArsiv');
  const aylar = (h) => `<div class="ar-aylar">${h.map((k) => `<canvas class="pix" data-ay="${k}"></canvas>`).join('')}</div>`;
  const dugmeler = (kaynak) => `<div class="row-end ar-dugme">
    <button type="button" class="pbtn primary small" data-hk="${kaynak}" data-islem="izle">▶ İzle</button>
    ${videoDestekli() ? `<button type="button" class="pbtn small" data-hk="${kaynak}" data-islem="video">Videoyu indir</button>` : ''}
    <button type="button" class="pbtn small" data-hk="${kaynak}" data-islem="resim">Resim indir</button></div>`;

  function ciz() {
    const a = state.arsiv || [], bitti = ozet.bittiMi(), simdi = ozet.veri(bitti ? 'tur' : 'ara');
    const bugun = new Date(); bugun.setHours(0, 0, 0, 0);
    const basladi = tarihOku(state.start) <= bugun;
    kok.innerHTML = `
      <section class="card ar-bas">
        <div><p class="eyebrow">Arşiv</p><h2>Turların hikâyesi</h2>
        <p class="muted">Her 8 hafta bitince "Ay nasıl geçti?" hikâyesi gelir. Sonuna kadar izleyince tur buraya kaydedilir ve yeni tur başlar.</p></div>
        <canvas class="pix ar-yumak" width="88" height="88" aria-hidden="true"></canvas>
      </section>
      ${bitti ? `<section class="card ar-kart ar-hazir">
        <p class="eyebrow">${simdi.tur}. tur · bitti</p><h3>Hikâyen hazır!</h3>
        <p class="muted">${simdi.tarihler}. Ay nasıl geçti, birlikte bakalım.${izle ? '' : ' İzleyince tur arşive kaydedilir.'}</p>
        ${aylar(simdi.haftalar)}
        <div class="row-end ar-dugme"><button type="button" class="pbtn primary" data-hk="tur" data-islem="izle">▶ Hikâyeyi izle</button></div>
      </section>` : basladi ? `<section class="card ar-kart">
        <p class="eyebrow">${simdi.tur}. tur · devam ediyor</p><h3>${simdi.tarihler}</h3>
        ${aylar(simdi.haftalar)}
        <p class="ar-sayi"><b>${simdi.tamam}/${simdi.toplamGoster}</b> gün tamam${simdi.rekor ? ` · en uzun zincir <b>${simdi.rekor}</b> gün` : ''}</p>
        <p class="muted ar-ipucu">"Ay nasıl geçti?" hikâyesi 8 hafta bitince açılır; o zamana kadar özete bakabilirsin.</p>
        <div class="row-end ar-dugme"><button type="button" class="pbtn primary small" data-hk="ara" data-islem="izle">Şimdiye kadarki özet</button></div>
      </section>` : `<section class="card ar-kart">
        <p class="eyebrow">${simdi.tur}. tur · yakında</p><h3>${tarihYaz(state.start)}'${ekAl(state.start)} başlıyor</h3>
        <p class="muted">Takvim o gün sıfırdan başlar. Hazırlan, Yumak ısınıyor!</p>
      </section>`}
      ${a.length ? `<h2 class="ar-baslik">Biten turlar</h2>` : ''}
      ${a.map((t, i) => ({ t, i })).reverse().map(({ t, i }) => {
        const o = t.ozet, y = o.toplam ? Math.round(o.tamam / o.toplam * 100) : 0;
        return `<section class="card ar-kart">
          <div class="ar-ust"><div><p class="eyebrow">${t.tur}. tur</p><h3>${tarihYaz(o.start)} – ${tarihYaz(o.bitis)}</h3></div><b class="ar-yuzde">%${y}</b></div>
          ${aylar(o.haftalar || [])}
          <p class="ar-sayi"><b>${o.tamam}/${o.toplam}</b> gün · <b>${o.rekor}</b> gün zincir · <b>${Math.round(o.yuruDk)}</b> dk yürüyüş</p>
          ${dugmeler(i)}
        </section>`;
      }).join('')}
      ${a.length ? '' : '<p class="muted ar-bos">Henüz biten tur yok. İlk tur bitince hikâyesi burada duracak.</p>'}`;
    for (const c of kok.querySelectorAll('canvas[data-ay]')) drawMoon(c, +c.dataset.ay, 16);
    const g = new Grid(Y.W, Y.H);
    if (a.length || bitti) Y.sit(g, { t: 0.4, look: { x: 0, y: 0 }, eyes: 'happy', hat: true });
    else Y.sleep(g, { t: 0.4 });
    paint(kok.querySelector('.ar-yumak'), g);
  }
  kok.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-hk]'); if (!b) return;
    const k = b.dataset.hk, kaynak = k === 'tur' || k === 'ara' ? k : +k;
    if (b.dataset.islem === 'izle') ozet.oynat(kaynak);
    else if (b.dataset.islem === 'video') ozet.oynat(kaynak, { basla: 'video' });
    else if (b.dataset.islem === 'resim') { const eski = b.textContent; b.textContent = 'Hazırlanıyor…'; await ozet.resim(kaynak); b.textContent = eski; }
  });
  return { ciz };
}
