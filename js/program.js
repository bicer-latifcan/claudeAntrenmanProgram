// ============================================================
//  PROGRAM VERİSİ — değişiklikler sadece bu dosyada yapılır.
//  Hareket eklemek/çıkarmak, set-tekrar, günler, video linkleri
//  hepsi burada. Site bu dosyayı okuyup kendini çizer.
//  iPhone widget'ı (widget/yumak-widget.js) da bu dosyayı okur:
//  "export" sözcükleri silinip çalıştırılır, o yüzden buraya import eklenmez.
// ============================================================

export const AYARLAR = {
  varsayilanBaslangic: '2026-10-05', // Pazartesi. Kullanıcı sayfadan değiştirebilir.
  haftaSayisi: 8,
  dinlenmeSn: '60–90',
  aerobikHedef: 150,                 // dk / hafta
};

// Hareket kütüphanesi. `anim`: kaslı kedinin (Tarçın) gösterdiği animasyon.
// `video`: YouTube video kimliği (id), bulunduğunda eklenir.
export const HAREKETLER = {
  // ---------- ısınma ----------
  'yerinde-mars': {
    ad: 'Yerinde marş', sure: '1 dk', anim: 'mars',
    adimlar: ['Dik dur, dizlerini sırayla kalça hizasına kaldır.', 'Kollarını doğal şekilde salla.'],
    ipucu: 'Rahat nefes al, acele yok.', kaslar: 'Isınma',
  },
  'kol-cevirme': {
    ad: 'Kol çevirme', sure: '10 ileri, 10 geri', anim: 'kolcevir',
    adimlar: ['Kollarını yana aç.', 'Küçük dairelerle başla, yavaşça büyüt.', '10 ileri, 10 geri çevir.'],
    ipucu: 'Omuzlarını kulaklarına doğru kaldırma.', kaslar: 'Omuz ısınması',
  },
  'kalca-mentesesi': {
    ad: 'Kalça menteşesi', sure: '10 tekrar', anim: 'mentese',
    adimlar: ['Ellerini kalçana koy, dizlerin hafif bükük.', 'Kalçanı geriye iterek öne eğil.', 'Sırtın düz kalsın, sonra dik dur.'],
    ipucu: 'Kalçanla arkandaki kapıyı kapatıyormuş gibi düşün.', kaslar: 'Kalça, arka bacak',
  },
  'agirliksiz-squat': {
    ad: 'Ağırlıksız squat', sure: '10 tekrar', anim: 'squat',
    adimlar: ['Ayaklar omuz genişliğinde.', 'Sandalyeye oturur gibi aşağı in.', 'Topuklarından iterek kalk.'],
    ipucu: 'Dizlerin ayak uçlarınla aynı yöne baksın.', kaslar: 'Bacak, kalça',
  },
  'kedi-deve': {
    ad: 'Kedi-deve', sure: '8 tekrar', anim: 'kedideve',
    adimlar: ['Dört ayak üstüne gel.', 'Sırtını yavaşça tavana doğru yuvarla.', 'Sonra sırtını çukurlaştır, başını hafif kaldır.'],
    ipucu: 'Nefesle birlikte yavaş hareket et.', kaslar: 'Sırt esnekliği',
  },

  // ---------- kuvvet ----------
  'goblet-squat': {
    ad: 'Goblet squat', anim: 'goblet',
    adimlar: ['Dambılı iki elinle göğsünün önünde dik tut.', 'Ayaklar omuz genişliğinde, parmak uçları hafif dışa.', 'Kalçanı geriye ve aşağı indir, dirseklerin dizlerinin içinden geçsin.', 'Topuklarından iterek kalk.'],
    ipucu: 'Göğsün açık, dizler ayak uçlarıyla aynı yöne.', dikkat: 'Topukların yerden kalkmasın.',
    kaslar: 'Ön bacak, kalça, karın',
  },
  'tek-kol-row': {
    ad: 'Tek kol dambıl row', anim: 'row',
    adimlar: ['Bir elini ve aynı taraftaki dizini sandalyeye koy.', 'Diğer elinle dambılı aşağıda tut, sırtın düz.', 'Dirseğini kalçana doğru çek, kürek kemiğini sık.', 'Yavaşça indir.'],
    ipucu: 'Omzunu kulağına doğru kaldırma.', dikkat: 'Gövdeni döndürme.',
    kaslar: 'Sırt, arka omuz, ön kol',
  },
  'egimli-sinav': {
    ad: 'Eğimli şınav', anim: 'egimlisinav',
    adimlar: ['Ellerini masa ya da tezgâh kenarına omuz genişliğinde koy.', 'Başından topuklarına kadar vücudun düz bir tahta gibi olsun.', 'Göğsünü kenara doğru indir, dirsekler yaklaşık 45°.', 'İterek geri gel.'],
    ipucu: 'Kalçan düşmesin, havaya da kalkmasın.', dikkat: 'Zorlanırsan daha yüksek bir yüzey seç.',
    kaslar: 'Göğüs, omuz, karın',
  },
  'romanian-deadlift': {
    ad: 'Romanian deadlift', anim: 'rdl',
    adimlar: ['Dambılı iki elinle uyluklarının önünde tut, dizler hafif bükük.', 'Kalçanı geriye iterek öne eğil, dambıl bacaklarına yakın kayarak insin.', 'Arka bacaklarında gerilme hissedince dur (genelde diz altı).', 'Kalçanı öne iterek dik dur.'],
    ipucu: 'Sırtın hep düz, bakışın yere.', dikkat: 'Belini yuvarlama.',
    kaslar: 'Arka bacak, kalça, sırt',
  },
  'kalca-koprusu': {
    ad: 'Kalça köprüsü', anim: 'kopru',
    adimlar: ['Sırtüstü yat, dizler bükük, ayaklar kalça genişliğinde.', 'Dambılı kalça kemiklerinin üstünde tut.', 'Topuklarından iterek kalçanı kaldır, en üstte 2 sn sık.', 'Yavaşça indir.'],
    ipucu: 'En üstte omzundan dizine düz bir çizgi olsun.', kaslar: 'Kalça, arka bacak',
  },
  'dead-bug': {
    ad: 'Dead bug', anim: 'deadbug',
    adimlar: ['Sırtüstü yat, kollar tavana, dizler 90°.', 'Belini yere yapıştır.', 'Karşı kol ve bacağı yavaşça uzat, yere değmeden geri getir.', 'Diğer tarafla tekrarla.'],
    ipucu: 'Uzatırken nefes ver.', dikkat: 'Belin yerden kalkarsa hareketi küçült.',
    kaslar: 'Karın, derin core',
  },
  'geriye-lunge': {
    ad: 'Geriye lunge', anim: 'lunge',
    adimlar: ['Dik dur; ilk haftalar ağırlıksız, sonra dambıl göğüste.', 'Bir ayağınla geriye büyük bir adım at.', 'Arka dizini yere yaklaşana kadar indir, ön diz ayak bileğinin üstünde.', 'Ön topuğundan iterek geri gel.'],
    ipucu: 'Denge için duvara ya da sandalyeye tutunabilirsin.', kaslar: 'Ön ve arka bacak, kalça',
  },
  'tek-kol-omuz-press': {
    ad: 'Tek kol omuz press', anim: 'press',
    adimlar: ['Dambılı omuz hizasında tut, avuç içe dönük.', 'Karnını ve kalçanı sık.', 'Dambılı yukarı it, kolun kulağının yanında dursun.', 'Kontrollü indir.'],
    ipucu: 'Hafif başla, belini geriye bükme.', kaslar: 'Omuz, üst sırt, karın',
  },
  'sumo-deadlift': {
    ad: 'Sumo deadlift', anim: 'sumo',
    adimlar: ['Ayaklarını geniş aç, parmak uçları dışa.', 'Dambılı iki elinle bacaklarının arasında, aşağıda tut.', 'Kalçanı geriye ve aşağı indir, sırtın düz.', 'Topuklarından iterek kalk, en üstte kalçanı sık.'],
    ipucu: 'Dizler ayak uçlarıyla aynı yöne.', kaslar: 'Kalça, iç bacak, arka bacak',
  },
  'bolunmus-durus-row': {
    ad: 'Bölünmüş duruşta row', anim: 'splitrow',
    adimlar: ['Bir ayağın önde, bir ayağın arkada dur.', 'Öndeki elinle ön dizine yaslan, gövden öne eğik ve düz.', 'Diğer elinle dirseğini kalçana doğru çekerek dambılı kaldır.', 'Yavaşça indir.'],
    ipucu: 'Gövdeni döndürme.', kaslar: 'Sırt, arka omuz, karın',
  },
  'tek-kol-yerde-press': {
    ad: 'Tek kol yerde press', anim: 'floorpress',
    adimlar: ['Sırtüstü yat, dizler bükük.', 'Dambılı göğsünün yanında tut, üst kolun yerde.', 'Dambılı tavana doğru it.', 'Dirseğin yere hafifçe değene kadar indir.'],
    ipucu: 'Bileğin düz, omzun yerde.', kaslar: 'Göğüs, omuz',
  },
  'bird-dog': {
    ad: 'Bird dog', anim: 'birddog',
    adimlar: ['Dört ayak üstünde; eller omuzların, dizler kalçanın altında.', 'Karşı kol ve bacağını yere paralel uzat.', '2 sn tut, kalçan sabit.', 'Geri getir, diğer taraf.'],
    ipucu: 'Sırtında bir bardak su varmış gibi.', kaslar: 'Karın, sırt, kalça',
  },

  // ---------- 2. aşama ----------
  'bulgar-split-squat': {
    ad: 'Bulgar split squat', anim: 'bulgar',
    adimlar: ['Arka ayağının üstünü sandalyeye ya da kanepeye koy.', 'Ön ayağın yeterince önde olsun.', 'Ön dizini bükerek aşağı in, gövden hafif öne eğik.', 'Ön topuğundan iterek kalk.'],
    ipucu: 'Önce ağırlıksız dene, gerekirse duvara tutun.', kaslar: 'Ön bacak, kalça',
  },
  'diz-ustu-sinav': {
    ad: 'Diz üstü şınav', anim: 'dizsinav',
    adimlar: ['Dizlerin yerde, eller omuz genişliğinde.', 'Dizinden başına düz bir çizgi.', 'Göğsünü yere yaklaştır.', 'İterek kalk.'],
    ipucu: 'Kalçan bükülmesin.', kaslar: 'Göğüs, omuz, karın',
  },
  'tek-bacak-kopru': {
    ad: 'Tek bacak köprü', anim: 'tekkopru',
    adimlar: ['Sırtüstü yat; bir dizin bükük, diğer bacağın düz.', 'Bükük bacağın topuğundan iterek kalçanı kaldır.', 'Kalçan yana düşmesin, üstte 2 sn sık.', 'Yavaşça indir, sonra diğer bacak.'],
    ipucu: 'Zor gelirse iki bacağa geri dön.', kaslar: 'Kalça, arka bacak',
  },

  // ---------- kardiyo ----------
  'tempolu-yuruyus': {
    ad: 'Tempolu yürüyüş', anim: 'yuru',
    adimlar: ['Konuşabilmelisin ama şarkı söyleyememelisin.', 'Kollarını doğal salla, adımların canlı olsun.', 'Düz zeminde başla, zamanla yokuş ekleyebilirsin.'],
    ipucu: 'Yemekten sonraki ilk 30 dk içinde yürümek kan şekerine iyi gelir.', kaslar: 'Kalp, bacaklar',
  },
  'aralikli-yuruyus': {
    ad: 'Aralıklı tempo', anim: 'yuksekdiz',
    adimlar: ['5 dk rahat yürüyerek ısın.', '30 sn tempolu: yokuş, merdiven ya da yüksek diz.', '90 sn yavaş yürü, turu tekrarla.', '5 dk yavaş yürüyerek soğu.'],
    ipucu: 'Efor 10 üzerinden 7–8 olsun, asla sonuna kadar değil.', dikkat: 'Merdivende tırabzana tutun; kendini iyi hissetmiyorsan atla.',
    kaslar: 'Kalp, bacaklar',
  },
};

// Nasıl yapılır videoları (YouTube). `bas`: videonun başlayacağı saniye. `dil: 'en'` = İngilizce.
export const VIDEOLAR = {
  'yerinde-mars':        { id: 'u1gmWFvEluM', kanal: 'Margaret Martin (fizyoterapist)', dil: 'en' },
  'kol-cevirme':         { id: '3STTSi_jdHk', kanal: 'Nuffield Health', dil: 'en' },
  'kalca-mentesesi':     { id: 'sinpFajtRPw', kanal: 'Mayo Clinic', dil: 'en' },
  'agirliksiz-squat':    { id: 'EI2kwv_jmMY', kanal: 'Ayşegül Demirsoy' },
  'kedi-deve':           { id: 'A2LIfqxPo9g', kanal: 'Uluğ Bey Tıp Merkezi' },
  'goblet-squat':        { id: 'COtBkaqhcz0', kanal: 'Diren Kartal Fitness' },
  'tek-kol-row':         { id: 'WL5JW73p0xM', kanal: 'Murat Tosun', bas: 75 },
  'egimli-sinav':        { id: 'CULblXrslXA', kanal: 'Murat Çetinkaya' },
  'romanian-deadlift':   { id: 'pj3IoLHzTWo', kanal: 'MACFit' },
  'kalca-koprusu':       { id: 'lXsDFjiiIZU', kanal: 'Ayşegül Demirsoy' },
  'dead-bug':            { id: 'ZBMFwWSuVK0', kanal: 'Murat Tosun' },
  'geriye-lunge':        { id: '8gs7fP1OckY', kanal: 'Egzersiz Rehberim' },
  'tek-kol-omuz-press':  { id: 'NVnyDQqmhPo', kanal: 'Rachel Cosgrove', dil: 'en' },
  'sumo-deadlift':       { id: '_lc3wcr2pbM', kanal: 'MACFit' },
  'bolunmus-durus-row':  { id: 'l94dGK5RsYQ', kanal: 'Functional Effect', dil: 'en' },
  'tek-kol-yerde-press': { id: 'yDoBD0EAd90', kanal: 'Merrick Lincoln (fizyoterapist)', dil: 'en' },
  'bird-dog':            { id: 'SuVqvCvxB2A', kanal: 'MS Platformu (fizyoterapist)' },
  'bulgar-split-squat':  { id: 'IQ5aZwdME8s', kanal: 'MACFit' },
  'diz-ustu-sinav':      { id: 'w4OPX0uFsDs', kanal: 'Reyhan Oksay', bas: 45 },
  'tek-bacak-kopru':     { id: 'GxNyjs_wzwU', kanal: 'Umut Varol' },
  'tempolu-yuruyus':     { id: 'G8g3bCpGq2I', kanal: 'Osman Müftüoğlu' },
  'aralikli-yuruyus':    { id: 'lQrz_Dmu8zI', kanal: 'Dr. Murat İşçi' },
};
for (const [k, v] of Object.entries(VIDEOLAR)) if (HAREKETLER[k]) HAREKETLER[k].video = v;

// Önerilen başlangıç ağırlıkları (tek ayarlanabilir dambıl, en fazla 12 kg).
// Doğru ağırlık: setin sonunda "2–3 tekrar daha yapabilirdim" dedirten ağırlık.
// kg: null → ağırlıksız hareket.
export const AGIRLIKLAR = {
  'goblet-squat':        { kg: '6–8 kg' },
  'tek-kol-row':         { kg: '6–8 kg' },
  'egimli-sinav':        { kg: null },
  'romanian-deadlift':   { kg: '6–10 kg' },
  'kalca-koprusu':       { kg: '6–10 kg', not: 'Dambıl kalçanın üstünde. Zor gelirse önce ağırlıksız.' },
  'dead-bug':            { kg: null },
  'geriye-lunge':        { kg: '4–6 kg', not: 'İlk 2 hafta ağırlıksız, sonra dambıl göğüste.' },
  'tek-kol-omuz-press':  { kg: '3–5 kg' },
  'sumo-deadlift':       { kg: '8–10 kg' },
  'bolunmus-durus-row':  { kg: '6–8 kg' },
  'tek-kol-yerde-press': { kg: '4–6 kg' },
  'bird-dog':            { kg: null },
  'bulgar-split-squat':  { kg: '4–6 kg', not: 'Önce ağırlıksız dene.' },
  'diz-ustu-sinav':      { kg: null },
  'tek-bacak-kopru':     { kg: null },
};
export const DAMBIL_MAKS = 12;
for (const [k, v] of Object.entries(AGIRLIKLAR)) if (HAREKETLER[k]) HAREKETLER[k].agirlik = v;

// Antrenmanlar (A/B: 1–4. hafta, A2/B2: 5–8. hafta)
export const ANTRENMANLAR = {
  A: {
    ad: 'Kuvvet A', dk: 40,
    liste: [
      { h: 'goblet-squat', set: 3, tekrar: '10–12' },
      { h: 'tek-kol-row', set: 3, tekrar: '10–12', not: 'her kol' },
      { h: 'egimli-sinav', set: 3, tekrar: '8–12' },
      { h: 'romanian-deadlift', set: 3, tekrar: '10–12' },
      { h: 'kalca-koprusu', set: 2, tekrar: '12–15' },
      { h: 'dead-bug', set: 2, tekrar: '6–8', not: 'her taraf' },
    ],
  },
  B: {
    ad: 'Kuvvet B', dk: 40,
    liste: [
      { h: 'geriye-lunge', set: 3, tekrar: '8–10', not: 'her bacak · ilk haftalar 2 set' },
      { h: 'tek-kol-omuz-press', set: 3, tekrar: '8–10', not: 'her kol' },
      { h: 'sumo-deadlift', set: 3, tekrar: '10–12' },
      { h: 'bolunmus-durus-row', set: 3, tekrar: '10–12', not: 'her kol' },
      { h: 'tek-kol-yerde-press', set: 3, tekrar: '10', not: 'her kol' },
      { h: 'bird-dog', set: 2, tekrar: '8', not: 'her taraf' },
    ],
  },
  A2: {
    ad: 'Kuvvet A+', dk: 45,
    liste: [
      { h: 'goblet-squat', set: 3, tekrar: '10–12' },
      { h: 'tek-kol-row', set: 3, tekrar: '10–12', not: 'her kol' },
      { h: 'egimli-sinav', set: 3, tekrar: '8–12', not: 'daha alçak bir yüzey; kolaylaşınca diz üstü şınav', alternatif: 'diz-ustu-sinav' },
      { h: 'romanian-deadlift', set: 3, tekrar: '10–12' },
      { h: 'tek-bacak-kopru', set: 3, tekrar: '10–12', not: 'her bacak' },
      { h: 'dead-bug', set: 3, tekrar: '6–8', not: 'her taraf' },
    ],
  },
  B2: {
    ad: 'Kuvvet B+', dk: 45,
    liste: [
      { h: 'bulgar-split-squat', set: 3, tekrar: '8–10', not: 'her bacak' },
      { h: 'tek-kol-omuz-press', set: 3, tekrar: '8–10', not: 'her kol' },
      { h: 'sumo-deadlift', set: 3, tekrar: '10–12' },
      { h: 'bolunmus-durus-row', set: 3, tekrar: '10–12', not: 'her kol' },
      { h: 'tek-kol-yerde-press', set: 3, tekrar: '10', not: 'her kol' },
      { h: 'bird-dog', set: 3, tekrar: '8', not: 'her taraf' },
    ],
  },
};

export const ISINMA = ['yerinde-mars', 'kol-cevirme', 'kalca-mentesesi', 'agirliksiz-squat', 'kedi-deve'];

// Gün türleri:
//  { tur: 'kuvvet', a: 'A', yemek: 10 }  → kuvvet + yemekten sonra 10 dk yürüyüş
//  { tur: 'yuruyus', dk: 20 }            → tempolu yürüyüş
//  { tur: 'uzun', dk: 30 }               → cumartesi uzun yürüyüş
//  { tur: 'aralikli', dk: 35, tur_: 4 }   → yürüyüşün içinde aralıklı tempo
//  { tur: 'dinlenme' }
const K = (a) => ({ tur: 'kuvvet', a, yemek: 10 });
const Y = (dk) => ({ tur: 'yuruyus', dk });
const U = (dk) => ({ tur: 'uzun', dk });
const AR = (dk, tur_) => ({ tur: 'aralikli', dk, tur_ });
const D = { tur: 'dinlenme' };

export const TAKVIM = [
  /* 1 */ [K('A'), Y(20), K('B'), Y(20), K('A'), U(30), D],
  /* 2 */ [K('B'), Y(25), K('A'), Y(25), K('B'), U(35), D],
  /* 3 */ [K('A'), Y(30), K('B'), Y(30), K('A'), U(40), D],
  /* 4 */ [K('B'), Y(30), K('A'), Y(35), K('B'), U(45), D],
  /* 5 */ [K('A2'), Y(35), K('B2'), Y(35), K('A2'), U(50), D],
  /* 6 */ [K('B2'), Y(35), K('A2'), AR(35, '4'), K('B2'), U(50), D],
  /* 7 */ [K('A2'), Y(40), K('B2'), AR(35, '6'), K('A2'), U(50), D],
  /* 8 */ [K('B2'), Y(40), K('A2'), AR(40, '6–8'), K('B2'), U(50), D],
];

// "Neden bu program?" bölümü — sade, göze sokmadan.
export const NEDEN = [
  { baslik: 'Hareket, insülinle barıştırır', metin: 'Kaslar kandaki şekerin en büyük kullanıcısı. Düzenli hareket insülin duyarlılığını artırır; bu fayda kilo değişmese bile gelir.' },
  { baslik: 'Haftada 150 dakika', metin: 'Kılavuzun hedefi haftada en az 150 dk orta tempolu hareket. Program 5. haftada bu hedefe kademeli olarak ulaşır.' },
  { baslik: 'Kuvvet + yürüyüş', metin: 'Haftada 3 gün tüm vücut kuvvet çalışması, arada yürüyüş. İkisi birlikte en iyi sonucu veriyor.' },
  { baslik: 'Yemekten sonra 10 dakika', metin: 'Yemekten sonraki ilk 30 dakika içinde kısa bir yürüyüş kan şekerini dengelemeye yardım eder.' },
  { baslik: 'Tartı her şey değil', metin: 'Kaldırdığın ağırlık, enerjin, uykun ve bel ölçün de ilerlemenin işareti.' },
  { baslik: 'Yorgunsan hafiflet', metin: 'Kötü hissettiğin gün set sayısını azalt ya da sadece yürü. Düzenli devam etmek tek bir antrenmandan daha önemli.' },
];

export const KAYNAKLAR = [
  { ad: 'Uluslararası kılavuz (2023)', url: 'https://academic.oup.com/jcem/article/108/10/2447/7242360' },
  { ad: 'Yeni ad: PMOS (The Lancet, 2026)', url: 'https://pubmed.ncbi.nlm.nih.gov/42119588/' },
  { ad: 'Egzersiz ve insülin direnci (2026)', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12870144/' },
  { ad: 'Yemek sonrası yürüyüş (2023)', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10036272/' },
  { ad: 'DSÖ hareket kılavuzu (2020)', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7719906/' },
];

// Yumak'ın söyledikleri
export const YUMAK_SOZLER = {
  selam: ['Merhaba! Ben <b>Yumak</b>. Programı ben hazırladım, uyumadığım zamanlarda.', 'Mrrr! Bugün ne yapıyoruz bakalım?', 'Geldin! Ben de tam seni bekliyordum. Yalan, uyuyordum.'],
  // saate göre selam
  sabah: ['Günaydın! Ben uyandım sayılır. <b>Esniyorum</b> ama uyandım.', 'Sabah sabah enerji! Benimki öğlene kadar yüklenir.', 'Günaydın! Kahvaltıdan sonra <b>10 dakika yürüyüş</b>, anlaştık mı?'],
  ogle: ['Tünaydın! Öğle yemeğinden sonra kısa bir yürüyüşe ne dersin?', 'Öğlen oldu. Ben ikinci uykumdayım, sen devam et.', 'Günün ortası! Bir bardak su iç, sonra bana haber ver.'],
  aksam: ['İyi akşamlar! Bugün ne yaptık, anlat bakalım.', 'Akşam yemeğinden sonra 10 dakika yürürsen <b>sana bir mırıltı borçluyum</b>.', 'Akşam oldu, ben en aktif saatlerimdeyim. Zoomies geliyor!'],
  gece: ['Gece yarısı antrenmanı mı? Ben olsam uyurdum... ki uyuyorum.', 'Geç oldu. Uyku da antrenmanın parçası, <b>iyi uyu</b>.', 'Ay ışığı güzel bu gece. Yarın devam ederiz, tamam mı?'],
  tavsiye: [
    'Yemekten sonra <b>10 dakika yürü</b>. Ben yemekten sonra 10 saat uyuyorum ama herkesin tarzı farklı.',
    'Squat\'ta <b>dizlerin ayak uçlarınla aynı yöne</b> baksın. Benim dizlerim hep kıvrık, beni örnek alma.',
    'Setler arası <b>60–90 saniye</b> dinlen. Dinlenme konusunda uzmanım, bana güven.',
    'Tartı her şeyi anlatmaz. <b>Kaldırdığın ağırlık artıyorsa</b> kazanıyorsun.',
    'Bugün yorgunsan <b>seti azalt ya da sadece yürü</b>. Tembellik değil, akıllılık.',
    'Seti <b>2–3 tekrar daha yapabilecekken</b> bitir. Kediler asla kendini tüketmez.',
    'Su iç! Ben musluktan içiyorum, sen <b>bardak</b> kullan lütfen.',
    'Saatte bir kalk, <b>birkaç dakika gerin</b>. Bak ben nasıl geriniyorum... mrrrr.',
    'Hareketi yavaş yap: <b>inerken 2–3 saniye</b>. Acele eden kedi yumağı karıştırır.',
    'Nefesini tutma! <b>Kaldırırken nefes ver</b>, indirirken al.',
    'Tüm setlerde üst tekrar sayısına ulaştıysan <b>ağırlığı biraz artır</b>. Ben mama porsiyonunu artırıyorum mesela.',
    'Isınmayı atlama. Ben bile uyanınca <b>önce gerinirim</b>.',
    'Sırtın düz olsun! Kambur sadece <b>korkunca</b> yapılır, bak bana.',
    'Uyku kas yapar. Ben günde 16 saat <b>kas yapıyorum</b>.',
    'Bir günü kaçırdın mı? Sorun yok. <b>Kaldığın yerden devam</b>, kediler geçmişe takılmaz.',
    'Yürürken konuşabiliyor ama şarkı söyleyemiyorsan <b>tempo tam kıvamında</b>.',
    'Ağırlık seçerken: setin sonunda <b>"2–3 tane daha yapardım"</b> diyebilmelisin.',
    'Bel ölçün, enerjin, uykun... Hepsi ilerlemenin işareti. <b>Sadece tartıya bakma</b>.',
  ],
  sakalar: [
    'Kediler neden spor salonuna gitmez? Çünkü <b>zaten her yere yatarak</b> geliyorlar.',
    'Hocam, bugün kardiyo var mı? Var: <b>mama kabına koşmak</b>.',
    'En sevdiğim egzersiz: <b>Yumak kaldırma</b>. Yani kendimi kanepeden kaldırmak.',
    'Pilates mi yoga mı? Ben <b>"patiles"</b> yapıyorum.',
    'Dün 3 set uyudum, her set 4 saat. <b>Rekor!</b>',
    'Bana "kilolu" diyorlar. Hayır, ben <b>ekstra yumuşak</b> modeldeyim.',
    'Protein tozu mu? Ben <b>balık kılçığı</b> tozundan yanayım.',
    'Koşu bandı gördüm, üstünde uyudum. <b>Hareketli yatak</b> sandım.',
    'Bugün bacak günü mü? <b>Dört bacağım var</b>, iki kat yorulurum.',
    'Plank rekorum: <b>kanepede 6 saat</b>. Yatay plank da sayılır.',
    'Soğuk duş mu? <b>Asla.</b> Ben kendimi dil ile yıkarım.',
    'Motivasyon sözü: "Bugünün miskinliği yarının şekerlemesidir." <b>- Yumak, 2026</b>',
    'Fit kedi mi? Ben <b>fit-lemeyen</b> kediyim. Ama sen fit ol!',
    'Isınma turunu yaptım: <b>bir kere gerindim</b>.',
    'Hocamız dedi ki: "Dinlenme günleri de önemli." Ben o <b>hocayım</b>.',
    'Ter atmak mı? Kediler terlemez, <b>parlar</b>.',
    'Kaç kalori yaktın? Ben <b>yandım</b>, güneşin altında yatıyordum.',
    'Bir kedinin en ağır antrenmanı: <b>pazartesi sabahı uyanmak</b>.',
    'Squat yaparken bana bakma, <b>gülersin</b>.',
    'Koçluk belgem var mı? Var: <b>patimle bastım</b>.',
  ],
  dusunce: [
    'Bugün kaç kuş saydım biliyor musun? Sıfır. Çünkü <b>uyuyordum</b>.',
    'Acaba ay da bir yumak mı? Hep yuvarlak, hep yukarıda...',
    'Kuyruğum neden hep beni takip ediyor? <b>Şüpheli</b>.',
    'Bazen ekranın öbür tarafında kimin olduğunu düşünüyorum. Sen misin? <b>Merhaba!</b>',
    'Mama kabımın dibi görünüyor. Bu bir <b>kriz</b>.',
    'Kutu gördüm, girmedim. <b>Kendimle gurur duyuyorum</b>. Yalan, girdim.',
    'Bir gün buradaki bütün düğmelere basacağım.',
    'Tarçın çok kaslı. Bence <b>benden gizli</b> mama yiyor.',
    'Takvimdeki günler çok renkli. Hangisinin üstünde uyusam?',
    'Kırmızı nokta avcısı olmak istiyordum. Sonra koç oldum.',
    'Yatmak mı, uzanmak mı? Büyük sorular.',
    'Pencereden bakınca dünya hep daha ilginç.',
  ],
  // bugünün türüne göre (takvimle)
  gunKuvvet: ['Bugün <b>kuvvet günü</b>! Tarçın hazır, ben de moral desteğiyim.', 'Dambılı hazırla! Bugün kaslar konuşacak.', 'Kuvvet günü: ben ısınmayı izlerim, sen yap. Anlaşma böyle.'],
  gunYuruyus: ['Bugün <b>yürüyüş günü</b>! Konuşabileceğin tempoda, şarkı söyleyemeyeceğin kadar hızlı.', 'Yürüyüşe çık, dönünce bana anlat. Ben pencereden izlerim.'],
  gunUzun: ['Bugün <b>uzun yürüyüş</b> var! Güzel bir müzik aç, rahat ayakkabı giy.', 'Uzun yürüyüş günü! Ben bu kadar yürüsem 3 gün uyurum.'],
  gunAralikli: ['Bugün <b>aralıklı tempo</b>: 30 saniye hızlı, 90 saniye yavaş. Kovalamaca gibi!', 'Aralıklı gün! Hızlı kısım benim mama saatine koşuşum gibi.'],
  gunDinlenme: ['Bugün <b>dinlenme günü</b>! Benim uzmanlık alanım.', 'Dinlenme günü: kaslar dinlenirken güçlenir. Ben de güçleniyorum. Zzz.', 'Bugün yorulmak yasak, <b>koç emri</b>.'],
  // ilerlemeye göre ({n} = tamamlanan gün)
  ilerleme0: ['Henüz hiç gün işaretlemedik. İlk günü birlikte yapalım mı?'],
  ilerleme1: ['{n} gün tamam! Başlangıç yaptık, bu en zor kısımdı.', 'İlk adımlar atıldı: {n} gün. Pati çakalım!'],
  ilerleme2: ['{n} gün tamamladın! Ben bu kadar düzenli uyuyamıyorum bile.', '{n} gün oldu. Ay dolmaya başladı, görüyor musun?'],
  ilerleme3: ['{n} gün! Artık resmen <b>sporcu</b>sun. Ben de resmen koçum.', 'Vay! {n} gün. Tarçın bile kıskanıyor.'],
  kacis: ['Hey! <b>Dokunmak yok!</b>', 'Mrrr... <b>kaçtım!</b>', 'Pati kanunu: <b>önce izin iste!</b>', 'Yakalayamazsın!', 'Iyy, parmak!', 'Kaçış antrenmanı! <b>Kardiyo sayılır.</b>', 'Beni korkuttun! Kalp atışım 200 oldu, bu da egzersiz.'],
  tutuldu: ['Beni bırak... <b>lütfen</b>.', 'Ayaklarım yere değmiyor!', 'Bu hiç onurlu değil.', 'Tamam, biraz seviyorum bunu.', 'Ben uçuyor muyum? Uçuyorum!', 'Enseden tutmak mı? Annem de böyle yapardı.'],
  birakildi: ['Hmph!', 'Bir daha yapma.', 'Neyse, affettim.', 'İnişim 10 üzerinden 10.', 'Kediler hep ayak üstü düşer. Bak!'],
  sevildi: ['Mrrrrr...', 'Daha, daha!', 'Tam kulağımın arkası!', 'Motor çalıştı: <b>mrrr mrrr</b>.', 'Sen en iyi öğrencimsin.'],
  yaklas: ['Tık tık! <b>Bugün ne çalışıyoruz?</b>', 'Ekranın öbür tarafından set sayıyorum. <b>Bir, iki...</b>', 'Burnum cama yapıştı. <b>Hadi, ısınma zamanı!</b>', 'Yakından bakınca daha tatlıyım, değil mi?', 'Buradan her şeyi görüyorum. Özellikle atladığın setleri.'],
  ac: ['Mama kabım boş... <b>mama?</b>', 'Karnım guruldadı. Duydun mu?', 'Koçunu besle ki koçun seni çalıştırsın.'],
  susuz: ['Su kabım boş, <b>su verir misin?</b>', 'Susadım! Sen de bir bardak iç, beraber içelim.'],
  mama: ['Mmm! Hayatımın en güzel maması.', 'Nom nom nom.', 'Antrenman sonrası beslenme: <b>tamamlandı</b>.'],
  kum: ['Bakma! Özel anım.', '...', 'Oh be.'],
  uyku: ['zzz... dinlenme de antrenmanın parçası...', 'zzz... bir set daha... zzz...', 'Beş dakika daha... zzz...'],
  tamam: ['Harika! Bugünü bitirdin, pati damgasını vurdum!', 'İşte bu! Ben gurur duyuyorum, sen de duy.', 'Bir gün daha tamam! Ay biraz daha doldu.', 'Tebrikler! Bugün kendine bir mırıltı hak ettin.'],
};

// Yumak'ın etkinlikleri: her birinin başında ve ortasında söylediği şakalar
export const ETKINLIK_SOZLER = {
  curl: ['Pazu günü! Bir... iki... <b>bu dambıl benden ağır!</b>', 'Bak ne kaslar! Tüylerin altında bir yerdeler.', 'Curl! Dirsek sabit, pati yukarı.'],
  press: ['Omuz press! <b>Belini bükme</b>, benim gibi dimdik.', 'Yukarııı! Tavana değecek gibiyim.', 'Dambıl kulağımın yanında, doğru mu yapıyorum?'],
  barbell: ['Bu halter <b>iki yumak</b> ağırlığında!', 'Hıııık! Rekor denemesi!', 'Kaldırdım! ...Birisi fotoğraf çekti mi?'],
  squat: ['Squat mı? Ben buna <b>kum kabı pozisyonu</b> diyorum.', 'İn, kalk, in, kalk! Dizler ayak uçlarıyla aynı yöne.', 'Kalçayı geriye! Sandalyeye oturur gibi.'],
  pushup: ['Pati şınavı! Bir... iki... <b>tamam bu kadar</b>.', 'Göğüs yere, burun yere... burnum kaşındı.', 'Şınav! Kediler için ekstra zor, bıyıklarım yere değiyor.'],
  plank: ['Plank! 3... 2... 1... <b>bitti mi?</b>', 'Karın sıkı, sırt düz. Titriyorum ama havalıyım.', 'Plank rekorum 5 saniye. Bugün 6 deniyorum!'],
  jumprope: ['İp atlama! <b>Zıp zıp</b>, tüylerim havalanıyor.', 'Hop hop hop! Kalbim tık tık tık.', 'İpe takılmazsam alkış istiyorum.'],
  hula: ['Hula hoop! <b>Kalçalarım</b> hiç bu kadar çalışmamıştı.', 'Dön dön dön... başım dönmüyor, hoop dönüyor.', 'Bel çevresi antrenmanı! Benim belim nerede?'],
  treadmill: ['Koşuyorum ama <b>hiçbir yere gitmiyorum</b>. Tıpkı hayat gibi.', 'Tempo! Konuşabiliyorum, demek ki doğru hızdayım.', 'Ter bandımı taktım, artık ciddiyim.'],
  armcircles: ['Pati çevirme! <b>10 ileri, 10 geri</b>.', 'Omuzlar ısınıyor, pervane oldum!', 'Isınma şart! Benim patiler hazır.'],
  dance: ['Ritmi hisset! <b>Kalçalar sağa, kalçalar sola.</b>', 'Dans da kardiyo! Bu benim en sevdiğim antrenman.', 'Tempo tempo! Kuyruğum da dans ediyor.'],
  flex: ['Bak bu kasa! ...Tüyün altında, <b>eminim oradalar</b>.', 'Kas gösterisi! Tarçın, ayağını denk al.', 'Pazu mu bu, yoksa mama mı? Pazu diyelim.'],
  yoga: ['Kediler yogayı icat etti, sadece <b>patent almadık</b>.', 'Aşağı bakan kedi pozu. Orijinali benim.', 'Nefes al... ver... mrrr.'],
  meditate: ['Ommmm... <b>İçimdeki huzur</b>, dışımdaki tüy.', 'Meditasyon: düşünmeden durmak. Benim her günüm.', 'Zihin sakin, mama kabı dolu. Aydınlandım.'],
  whistle: ['<b>Priiit!</b> Set başlasın!', 'Düdük çaldı! Isınma bitti, hareketler başlıyor.', 'Priiit! Dinlenme bitti, bir set daha.'],
  clipboard: ['Bugünkü notum: <b>10 üzerinden 11</b>.', 'Planı kontrol ediyorum... Hmm, benim uyku saatim yazmıyor.', 'Not aldım: "Harika gidiyor." İmza: Yumak.'],
  water: ['<b>Su molası!</b> Sen de bir bardak iç.', 'Gluk gluk. Su içmek de antrenmanın parçası.', 'Hidrasyon! Kedi dilinde: şapur şupur.'],
  towel: ['Ter mi? Hayır, <b>tüylerim parlıyor</b>.', 'Havlumu aldım, profesyonel görünüyorum değil mi?', 'Sıkı antrenman! Havlu şart.'],
  sunglasses: ['Havalı koç modu: <b>açık</b>.', 'Gözlük taktım, çünkü geleceğin parlak.', 'Koç olmak havalı iş.'],
  tailchase: ['Kuyruğum! Bugün <b>yakalayacağım</b>!', 'Dön dön dön... bu da kardiyo sayılır!', 'Neredeyse yakalıyordum... başım döndü.'],
  yarnball: ['Yumak! Benim adım da Yumak, <b>kafam karıştı</b>.', 'Popo sallama: av öncesi ısınma.', 'Hop! Yakaladım... kaçtı!'],
  box: ['Bir kutu gördüm. <b>Girmem gerekiyordu</b>. Kurallar böyle.', 'Kutuya sığdım, demek ki formdayım!', 'Burası benim ofisim.'],
  knockcup: ['Yerçekimi testi... <b>hâlâ çalışıyor</b>.', 'Bardak kendi düştü. Ben sadece patiyle dokundum.', 'Bilim adına! Pıt.'],
  yawn: ['Esnemek de <b>egzersiz</b>... değil mi?', 'Çene kasları çalıştı. Bugünlük yeter.', 'Hıaaaaaav... pardon.'],
  fish: ['Antrenman sonrası protein: <b>balık</b>. Bilim böyle diyor.', 'Nom! Kas yapımı için şart.', 'Balık, en iyi spor içeceği. Yiyeceği. Neyse.'],
};
