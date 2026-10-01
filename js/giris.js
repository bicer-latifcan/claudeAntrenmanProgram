// Kapıdaki Yumak: ilk açılışta şifre ister. Giriş yap ya da yeni şifre oluştur.
// Şifre saklanmaz; bulut.js ondan bir işaretçi kodu türetir (ayrıntı orada).
import * as bulut from './bulut.js';
import { Grid, paint } from './pixel.js';
import * as Y from './yumak-art.js';

// "Güçlü şifre öner" için kolay yazılan, sevimli kelimeler (Türkçe karakter yok: her klavyede rahat)
const KELIME = ['Yumak', 'Dolunay', 'Tarcin', 'Mirilti', 'Patik', 'Kurabiye', 'Yildiz', 'Bulut', 'Kahve', 'Lavanta', 'Pamuk', 'Zeytin',
  'Badem', 'Ceviz', 'Elma', 'Kiraz', 'Nane', 'Simit', 'Lokum', 'Portakal', 'Mandalina', 'Hilal', 'Gokyuzu', 'Yastik', 'Battaniye',
  'Tavsan', 'Sincap', 'Penguen', 'Balina', 'Yunus', 'Kelebek', 'Papatya', 'Lale', 'Menekse', 'Corba', 'Pilav', 'Biskuvi', 'Limon',
  'Ayva', 'Nar', 'Incir', 'Uzum', 'Erik', 'Seftali', 'Kayisi', 'Fistik', 'Findik', 'Kestane', 'Kumsal', 'Deniz', 'Ruzgar', 'Gunes',
  'Yagmur', 'Kar', 'Patates', 'Havuc', 'Brokoli', 'Mercimek', 'Bulgur', 'Yogurt', 'Kefir', 'Dambil', 'Squat', 'Plank'];
const rastgele = (n) => crypto.getRandomValues(new Uint32Array(1))[0] % n;
export const sifreOner = () => `${KELIME[rastgele(KELIME.length)]}-${KELIME[rastgele(KELIME.length)]}-${KELIME[rastgele(KELIME.length)]}-${1000 + rastgele(9000)}`;
export function sifreKontrol(s) {
  const t = String(s).trim();
  if (t.length < 10) return 'En az 10 karakter olsun.';
  const harf = /\p{L}/u.test(t), sayi = /\d/.test(t), isaret = /[^\p{L}\d]/u.test(t);
  if (!harf || (!sayi && !isaret)) return 'Harfin yanında en az bir rakam ya da işaret olsun.';
  if (/^(.)\1+$/.test(t) || /^(1234567890|0123456789|qwertyuiop|sifresifre)/i.test(t)) return 'Bu çok kolay tahmin edilir, başka bir şey dene.';
  return null;
}

function yumakCiz(canvas, st) {
  const g = new Grid(Y.W, Y.H); Y.sit(g, { t: 0.4, look: { x: 0, y: 0 }, ...st }); paint(canvas, g);
}

// mod: 'giris' | 'olustur'. eskiKod: bu cihazdaki eski bağlantı (varsa, verileri taşınır). veri: ilk kayıt için yerel ilerleme.
export function kapiyiAc({ mod = 'giris', eskiKod = null, veri = null, sonra }) {
  const dlg = document.createElement('dialog');
  dlg.className = 'sheet small kapi';
  dlg.setAttribute('aria-labelledby', 'kapiBaslik');
  dlg.addEventListener('cancel', (e) => e.preventDefault()); // şifresiz kapanmasın
  let mesgul = false, oneri = null;

  function ciz(mesaj = '', tur = '') {
    const olustur = mod === 'olustur';
    const yazilan = [dlg.querySelector('#kapiSifre')?.value || '', dlg.querySelector('#kapiSifre2')?.value || '', dlg.querySelector('#kapiEski')?.value || ''];
    const tasima = olustur && eskiKod;
    dlg.innerHTML = `<form class="sheet-inner kapi-ic" novalidate>
      <canvas class="pix kapi-yumak" width="88" height="88" aria-hidden="true"></canvas>
      <div>
        <p class="eyebrow">Yumak'la 8 Hafta</p>
        <h2 id="kapiBaslik">${olustur ? 'Bir şifre belirleyelim' : 'Yumak kapıda: şifre?'}</h2>
        <p class="muted">${tasima ? 'Artık şifreyle giriş var! Bir şifre belirle; bu cihazdaki ilerlemen, widget ve izleme linki aynen kalır. Sonra her cihazdan bu şifreyle girersin.'
          : olustur ? 'İlk kez mi geldin? Bir şifre belirle; ilerlemen buluta yedeklenir ve her cihazdan bu şifreyle girersin. Başka bir cihazda ilerlemen varsa şifreyi önce orada oluştur, burada sonra giriş yap.'
          : 'Şifreni yaz, ilerlemen buluttan gelsin. Bir kez girmen yeter; çıkış yapana kadar hatırlanırsın.'}</p>
      </div>
      <label class="field">Şifre
        <span class="kapi-satir"><input type="password" id="kapiSifre" autocomplete="${olustur ? 'new-password' : 'current-password'}" autocapitalize="off" spellcheck="false" required>
        <button type="button" class="pbtn small ghost" id="kapiGoster" aria-label="Şifreyi göster">göster</button></span>
      </label>
      ${olustur ? `<label class="field">Şifre (tekrar)<input type="password" id="kapiSifre2" autocomplete="new-password" autocapitalize="off" spellcheck="false" required></label>
      <div class="row-end kapi-oneri"><button type="button" class="pbtn small" id="kapiOner">Güçlü şifre öner</button><span class="muted" id="kapiOneriNot">${oneri ? 'Bunu bir yere not et! Unutursan geri getiremem.' : 'En az 10 karakter; harf ve rakam karışık.'}</span></div>
      ${eskiKod ? '' : `<details class="kapi-eski"><summary>Şifremi unuttum / eski bağlantı linkim var</summary>
        <p class="muted">Eski kişisel linkini (…#kod-…) yapıştırırsan yeni şifre o kayda bağlanır; ilerleme kaybolmaz.</p>
        <input type="text" id="kapiEski" placeholder="Eski linki yapıştır" autocapitalize="off" spellcheck="false"></details>`}` : ''}
      ${olustur && bulut.adminAnahtari() ? '<p class="muted kapi-not">İlerlemen, site sahibinin panelinde de görünür (sadece görüntüleme).</p>' : ''}
      <p class="kapi-mesaj ${tur}" role="status">${mesaj}</p>
      <div class="row-end">
        <button type="button" class="pbtn ghost small" id="kapiDegis">${olustur ? 'Zaten şifrem var, giriş yap' : 'İlk kez mi? Şifre oluştur'}</button>
        <button type="submit" class="pbtn primary" id="kapiTamam">${olustur ? 'Şifreyi oluştur' : 'Giriş yap'}</button>
      </div>
    </form>`;
    yumakCiz(dlg.querySelector('.kapi-yumak'), tur === 'hata' ? { eyes: 'sad', earsBack: true, mouth: 'frown' } : tur === 'ok' ? { eyes: 'happy', mouth: 'open', paws: 'wave' } : { prop: 'clipboard' });
    const f = dlg.querySelector('form'), s1 = dlg.querySelector('#kapiSifre'), s2 = dlg.querySelector('#kapiSifre2');
    s1.value = yazilan[0]; if (s2) s2.value = yazilan[1]; // hata mesajında yazılanlar silinmesin
    if (oneri) { s1.type = 'text'; if (s2) s2.type = 'text'; } // önerilen şifre görünsün ki not edilsin
    const es = dlg.querySelector('#kapiEski'); if (es && yazilan[2]) { es.value = yazilan[2]; es.closest('details').open = true; }
    dlg.querySelector('#kapiGoster').onclick = () => { const g = s1.type === 'password'; s1.type = g ? 'text' : 'password'; if (s2) s2.type = s1.type; };
    dlg.querySelector('#kapiDegis').onclick = () => { if (mesgul) return; mod = olustur ? 'giris' : 'olustur'; if (oneri) { oneri = null; s1.value = ''; } ciz(); };
    const on = dlg.querySelector('#kapiOner'); if (on) on.onclick = () => { oneri = sifreOner(); s1.value = oneri; if (s2) s2.value = oneri; ciz(); };
    f.onsubmit = async (e) => {
      e.preventDefault(); if (mesgul) return;
      const sifre = s1.value.trim();
      if (!navigator.onLine) return ciz('İnternet yok gibi görünüyor. Bağlanınca tekrar dene.', 'hata');
      if (olustur) {
        const sorun = sifreKontrol(sifre); if (sorun) return ciz(sorun, 'hata');
        if (s2.value.trim() !== sifre) return ciz('İki şifre aynı değil.', 'hata');
      } else if (!sifre) return ciz('Şifreyi yazmayı unuttun.', 'hata');
      let hedef = eskiKod;
      const eski = dlg.querySelector('#kapiEski')?.value.trim();
      if (olustur && !hedef && eski) {
        const m = eski.match(/(?:#(?:kod|izle)-)?([A-Za-z0-9]{24,})\s*$/);
        if (!m) return ciz('Eski link okunamadı. Tamamını yapıştırdığından emin ol.', 'hata');
        if (!(await bulut.indir(m[1]).catch(() => null))) return ciz('Bu eski linkte kayıt bulamadım.', 'hata');
        hedef = m[1];
      }
      mesgul = true; dlg.querySelector('#kapiTamam').disabled = true;
      dlg.querySelector('.kapi-mesaj').textContent = 'Yumak kontrol ediyor…';
      try {
        const r = olustur ? await bulut.sifreOlustur(sifre, hedef, veri) : await bulut.sifreyleGir(sifre);
        mesgul = false;
        if (r.hata === 'yok') return ciz('Bu şifreyle bir kayıt bulamadım. Harfleri kontrol et ya da "Şifre oluştur"a geç.', 'hata');
        if (r.hata === 'var') return ciz('Bu şifre zaten kullanılıyor. "Giriş yap"a geçip aynı şifreyle gir.', 'hata');
        ciz(olustur ? 'Şifre hazır! Bir daha sormayacağım, çıkış yapana kadar.' : 'Hoş geldin! Mrrr.', 'ok');
        setTimeout(() => { dlg.close(); dlg.remove(); sonra?.(); }, 900);
      } catch {
        mesgul = false; ciz('Buluta ulaşamadım. İnternetini kontrol edip tekrar dene.', 'hata');
      }
    };
    setTimeout(() => s1.focus(), 50);
  }
  ciz();
  document.body.append(dlg);
  dlg.showModal();
  return dlg;
}
