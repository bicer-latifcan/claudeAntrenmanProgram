// ============================================================
//  YUMAK'IN MUTFAĞI — öğün seçenekleri (değişiklikler bu dosyada).
//  Her öğün, gruplardan seçilmiş kalemlerden oluşur. "Değiştir" aynı
//  gruptaki eşdeğerleri gösterir. Ölçüler ev ölçüsü (yemek kaşığı, tatlı kaşığı,
//  su bardağı), kısaltmasız yazılır. Porsiyonlar TÜBER 2022 ve önceki diyetisyen
//  listelerine göre; sakatat yok. Tartı yok; sitede protein yazar, kalori
//  sadece protein çipine dokununca görünür.
//  Alışveriş: [ürün, miktar, birim, reyon]; miktar null ise "var olsun".
// ============================================================

export const REYON = {
  manav: 'Manav', sut: 'Süt ürünleri ve yumurta', kasap: 'Et, tavuk, balık',
  kuru: 'Bakliyat ve kuru gıda', firin: 'Ekmek', kuruyemis: 'Kuruyemiş',
};

const al = (urun, miktar = null, birim = null, reyon = 'manav') => [urun, miktar, birim, reyon];
const Y = (n) => al('Yumurta', n, 'adet', 'sut');

// p: yaklaşık protein (g), k: yaklaşık enerji (kcal). TÜBER 2022 ve USDA ortalamalarından ev ölçüsüne
// çevrildi; ±%15 sapabilir. Hedef (165 cm, 25 yaş, haftada 3 kuvvet + günlük yürüyüş): günde ≈ 1500 kcal
// (harcamanın ≈ 500 altı) ve ≈ 100 g protein. Sırayı bozma: kayıtlı "değiştir" seçimleri sıra numarasıyla tutulur;
// yeni seçenekleri grubun SONUNA ekle.
export const HEDEF = { protein: 100, kcal: 1500 };

// Alışma dönemi: ilk turda hedef birden 1500'e inmesin. İlk haftalarda kartlarda "istersen ekle" önerileri çıkar.
// hafta: program haftası (1'den başlar). ekler: hangi öğünlere öneri gelsin.
export const ALISMA = [
  { haftalar: [1, 2], kcal: 1800, ekler: ['kahvalti', 'ara', 'aksam'], ad: 'Alışma haftası' },
  { haftalar: [3, 4], kcal: 1650, ekler: ['ara', 'aksam'], ad: 'Geçiş haftası' },
];
export const EKLER = { // öğün başına bir küçük ek (≈ 60–120 kcal)
  kahvalti: { ad: '1 ince dilim tam buğday ekmeği', p: 2.5, k: 63, al: [['Tam buğday ekmeği', 1, 'dilim', 'firin']] },
  ara: { ad: '1 meyve ya da 10 badem', p: 1.5, k: 70, al: [['Elma', 1, 'adet', 'manav']] },
  aksam: { ad: '4 yemek kaşığı bulgur pilavı', p: 3, k: 110, al: [['Bulgur (pilavlık)', null, null, 'kuru']] },
};

export const GRUPLAR = {
  yumurta: [
    { ad: '2 haşlanmış yumurta', p: 12.5, k: 150, al: [Y(2)] },
    { ad: '2 yumurtalı omlet (1 tatlı kaşığı zeytinyağıyla)', p: 12.5, k: 195, al: [Y(2)] },
    { ad: '2 yumurtalı menemen', p: 13, k: 190, al: [Y(2), al('Domates', 1, 'adet'), al('Sivri biber', 2, 'adet')] },
    { ad: 'Lorlu omlet: 2 yumurta + 3 yemek kaşığı lor', p: 18, k: 200, al: [Y(2), al('Lor peyniri', null, null, 'sut')] },
    { ad: 'Sahanda 2 yumurta (1 tatlı kaşığı tereyağıyla)', p: 12.5, k: 185, al: [Y(2)] },
    { ad: '1 haşlanmış yumurta', p: 6.3, k: 75, al: [Y(1)] },
    { ad: '3 yumurtalı menemen', p: 19.5, k: 265, al: [Y(3), al('Domates', 1, 'adet'), al('Sivri biber', 2, 'adet')] },
  ],
  peynir: [
    { ad: '2 kibrit kutusu beyaz peynir (az yağlı)', p: 10.5, k: 135, al: [al('Beyaz peynir (az yağlı)', 2, 'kk', 'sut')] },
    { ad: '1 kibrit kutusu kaşar', p: 8, k: 110, al: [al('Kaşar peyniri', 1, 'kk', 'sut')] },
    { ad: '4 yemek kaşığı lor peyniri', p: 7, k: 60, al: [al('Lor peyniri', null, null, 'sut')] },
    { ad: '2 yemek kaşığı labne', p: 2.5, k: 80, al: [al('Labne', null, null, 'sut')] },
    { ad: '1 kibrit kutusu beyaz peynir (az yağlı)', p: 5.3, k: 68, al: [al('Beyaz peynir (az yağlı)', 1, 'kk', 'sut')] },
    { ad: '1 kibrit kutusu kaşar + 1 kibrit kutusu beyaz peynir', p: 13.3, k: 178, al: [al('Kaşar peyniri', 1, 'kk', 'sut'), al('Beyaz peynir (az yağlı)', 1, 'kk', 'sut')] },
  ],
  ekmek: [
    { ad: '2 ince dilim tam buğday ekmeği', p: 5, k: 125, al: [al('Tam buğday ekmeği', 2, 'dilim', 'firin')] },
    { ad: '2 ince dilim çavdar ekmeği', p: 4.5, k: 120, al: [al('Çavdar ekmeği', 2, 'dilim', 'firin')] },
    { ad: '2 ince dilim köy ekmeği', p: 4.5, k: 130, al: [al('Köy ekmeği', 2, 'dilim', 'firin')] },
    { ad: '2 galeta', p: 2.5, k: 70, al: [al('Galeta', 2, 'adet', 'firin')] },
    { ad: '½ simit (arada bir)', p: 6, k: 170, al: [al('Simit', 0.5, 'adet', 'firin')] },
    { ad: '½ tam buğday lavaş (dürüm)', p: 4, k: 140, al: [al('Tam buğday lavaş', null, null, 'firin')] },
    { ad: '1 ince dilim tam buğday ekmeği', p: 2.5, k: 63, al: [al('Tam buğday ekmeği', 1, 'dilim', 'firin')] },
  ],
  yesillik: [
    { ad: 'Domates, salatalık, 10 dal maydanoz (serbest)', p: 1, k: 25, al: [al('Domates', 1, 'adet'), al('Salatalık', 1, 'adet'), al('Maydanoz')] },
    { ad: 'Salatalık, roka, taze soğan (serbest)', p: 1, k: 20, al: [al('Salatalık', 1, 'adet'), al('Roka'), al('Taze soğan')] },
    { ad: 'Domates, biber, dereotu (serbest)', p: 1, k: 25, al: [al('Domates', 1, 'adet'), al('Sivri biber', 1, 'adet'), al('Dereotu')] },
  ],
  yag: [
    { ad: '7 zeytin', p: 0.3, k: 45, al: [al('Zeytin', null, null, 'kuru')] },
    { ad: '2 ceviz', p: 1.5, k: 60, al: [al('Ceviz', null, null, 'kuruyemis')] },
    { ad: '10 fındık', p: 1.5, k: 65, al: [al('Fındık', null, null, 'kuruyemis')] },
    { ad: '1 tatlı kaşığı tahin', p: 1.3, k: 45, al: [al('Tahin', null, null, 'kuru')] },
  ],
  yulaf: [
    { ad: '3 yemek kaşığı yulaf ezmesi', p: 3.2, k: 90, al: [al('Yulaf ezmesi', null, null, 'kuru')] },
    { ad: '2 yemek kaşığı yulaf ezmesi', p: 2.1, k: 60, al: [al('Yulaf ezmesi', null, null, 'kuru')] },
    { ad: '1 ince dilim tam buğday ekmeği', p: 2.5, k: 63, al: [al('Tam buğday ekmeği', 1, 'dilim', 'firin')] },
  ],
  sut: [
    { ad: '1 kase yoğurt', p: 8, k: 120, al: [al('Yoğurt', null, null, 'sut')] },
    { ad: '1 bardak kefir', p: 7, k: 120, al: [al('Kefir', null, null, 'sut')] },
    { ad: '1 büyük bardak ayran', p: 6, k: 100, al: [al('Ayran', null, null, 'sut')] },
    { ad: '1 su bardağı süt', p: 6.5, k: 125, al: [al('Süt', null, null, 'sut')] },
    { ad: '8 yemek kaşığı süzme yoğurt', p: 15, k: 190, al: [al('Süzme yoğurt', null, null, 'sut')] },
    { ad: '1 büyük bardak kefir', p: 10.5, k: 180, al: [al('Kefir', null, null, 'sut')] },
  ],
  yogurtAz: [
    { ad: '3 yemek kaşığı yoğurt', p: 2, k: 36, al: [al('Yoğurt', null, null, 'sut')] },
    { ad: 'Yarım bardak kefir', p: 3.5, k: 60, al: [al('Kefir', null, null, 'sut')] },
    { ad: '1 küçük ayran', p: 3.5, k: 70, al: [al('Ayran', null, null, 'sut')] },
    { ad: '8 yemek kaşığı süzme yoğurt', p: 15, k: 190, al: [al('Süzme yoğurt', null, null, 'sut')] },
    { ad: '1 kase yoğurt', p: 8, k: 120, al: [al('Yoğurt', null, null, 'sut')] },
  ],
  meyve: [
    { ad: '1 orta boy elma', p: 0.5, k: 72, al: [al('Elma', 1, 'adet')] },
    { ad: '1 armut', p: 0.5, k: 85, al: [al('Armut', 1, 'adet')] },
    { ad: '2 mandalina', p: 1, k: 70, al: [al('Mandalina', 2, 'adet')] },
    { ad: '1 portakal', p: 1.2, k: 65, al: [al('Portakal', 1, 'adet')] },
    { ad: '1 küçük muz', p: 1.1, k: 90, al: [al('Muz', 1, 'adet')] },
    { ad: '1 küçük kase nar tanesi', p: 1, k: 70, al: [al('Nar', null)] },
    { ad: '2 incir', p: 0.8, k: 75, al: [al('İncir', 2, 'adet')] },
    { ad: '12 tane üzüm', p: 0.5, k: 60, al: [al('Üzüm')] },
  ],
  kuruyemis: [
    { ad: '2 ceviz', p: 1.5, k: 60, al: [al('Ceviz', null, null, 'kuruyemis')] },
    { ad: '10 badem', p: 2.5, k: 70, al: [al('Badem', null, null, 'kuruyemis')] },
    { ad: '10 fındık', p: 1.5, k: 65, al: [al('Fındık', null, null, 'kuruyemis')] },
    { ad: '1 yemek kaşığı tuzsuz kabak çekirdeği', p: 3, k: 55, al: [al('Kabak çekirdeği (tuzsuz)', null, null, 'kuruyemis')] },
    { ad: '1 avuç leblebi', p: 6, k: 110, al: [al('Leblebi', null, null, 'kuruyemis')] },
  ],
  protein: [
    { ad: '5 küçük ızgara köfte', p: 25, k: 270, al: [al('Köftelik kıyma', null, null, 'kasap')] },
    { ad: '8 yemek kaşığı tavuk sote (biberli)', p: 30, k: 230, al: [al('Tavuk göğsü', null, null, 'kasap'), al('Sivri biber', 2, 'adet')] },
    { ad: '3 derisiz baget (fırında)', p: 33, k: 250, al: [al('Tavuk baget', 3, 'adet', 'kasap')] },
    { ad: 'Yarım tavuk göğsü, ızgara', p: 35, k: 190, al: [al('Tavuk göğsü', null, null, 'kasap')] },
    { ad: '1 büyük porsiyon balık (2 avuç içi kadar)', p: 34, k: 260, al: [al('Balık (mevsiminde olan)', null, null, 'kasap')] },
    { ad: '5 et şiş', p: 28, k: 230, al: [al('Kuşbaşı et', null, null, 'kasap')] },
    { ad: '3 yumurtalı menemen', p: 19.5, k: 265, al: [Y(3), al('Domates', 1, 'adet'), al('Sivri biber', 2, 'adet')] },
    { ad: '1 büyük kutu ton balığı (160 g, suyu süzülmüş)', p: 26, k: 170, al: [al('Ton balığı konservesi (160 g)', 1, 'adet', 'kuru')] },
  ],
  sebze: [
    { ad: '6 yemek kaşığı zeytinyağlı taze fasulye', p: 2.5, k: 120, al: [al('Taze fasulye')] },
    { ad: '6 yemek kaşığı ıspanak yemeği', p: 4, k: 110, al: [al('Ispanak')] },
    { ad: '6 yemek kaşığı kabak yemeği', p: 2, k: 100, al: [al('Kabak', 2, 'adet')] },
    { ad: '6 yemek kaşığı fırında karışık sebze', p: 2.5, k: 120, al: [al('Kabak', 1, 'adet'), al('Havuç', 1, 'adet'), al('Sivri biber', 2, 'adet')] },
    { ad: '6 yemek kaşığı zeytinyağlı pırasa', p: 2, k: 120, al: [al('Pırasa')] },
    { ad: '6 yemek kaşığı brokoli ya da karnabahar', p: 3, k: 90, al: [al('Brokoli / karnabahar')] },
  ],
  tahil: [
    { ad: '4 yemek kaşığı bulgur pilavı', p: 3, k: 110, al: [al('Bulgur (pilavlık)', null, null, 'kuru')] },
    { ad: '1 kase mercimek çorbası', p: 9, k: 150, al: [al('Kırmızı mercimek', null, null, 'kuru')] },
    { ad: '2 ince dilim tam buğday ekmeği', p: 5, k: 125, al: [al('Tam buğday ekmeği', 2, 'dilim', 'firin')] },
    { ad: '4 yemek kaşığı tam buğday makarna', p: 4, k: 110, al: [al('Tam buğday makarna', null, null, 'kuru')] },
    { ad: '4 yemek kaşığı haşlanmış nohut', p: 6, k: 115, al: [al('Nohut (kuru ya da haşlanmış kavanoz)', null, null, 'kuru')] },
    { ad: '1 ince dilim tam buğday ekmeği', p: 2.5, k: 63, al: [al('Tam buğday ekmeği', 1, 'dilim', 'firin')] },
  ],
  salata: [
    { ad: 'Mevsim salatası + 1 yemek kaşığı zeytinyağı + limon', p: 1.5, k: 120, al: [al('Marul'), al('Domates', 1, 'adet'), al('Salatalık', 1, 'adet'), al('Limon')] },
    { ad: 'Çoban salatası + 1 yemek kaşığı zeytinyağı', p: 1.5, k: 120, al: [al('Domates', 2, 'adet'), al('Salatalık', 1, 'adet'), al('Sivri biber', 1, 'adet')] },
    { ad: 'Roka-domates salatası + 1 yemek kaşığı zeytinyağı', p: 1, k: 110, al: [al('Roka'), al('Domates', 1, 'adet')] },
    { ad: 'Havuçlu lahana salatası + 1 yemek kaşığı zeytinyağı', p: 1.2, k: 115, al: [al('Beyaz lahana'), al('Havuç', 1, 'adet')] },
  ],
  yogurtAksam: [
    { ad: '1 kase yoğurt', p: 8, k: 120, al: [al('Yoğurt', null, null, 'sut')] },
    { ad: '1 kase cacık', p: 6, k: 100, al: [al('Yoğurt', null, null, 'sut'), al('Salatalık', 1, 'adet')] },
    { ad: '1 bardak ayran', p: 5, k: 80, al: [al('Ayran', null, null, 'sut')] },
    { ad: '1 kase süzme yoğurtla cacık', p: 14, k: 160, al: [al('Süzme yoğurt', null, null, 'sut'), al('Salatalık', 1, 'adet')] },
  ],
  baklagil: [
    { ad: '10 yemek kaşığı kuru fasulye yemeği', p: 15, k: 300, al: [al('Kuru fasulye', null, null, 'kuru')] },
    { ad: '10 yemek kaşığı nohut yemeği', p: 15, k: 310, al: [al('Nohut (kuru ya da haşlanmış kavanoz)', null, null, 'kuru')] },
    { ad: '10 yemek kaşığı yeşil mercimek yemeği', p: 16, k: 290, al: [al('Yeşil mercimek', null, null, 'kuru')] },
    { ad: '10 yemek kaşığı zeytinyağlı barbunya', p: 14, k: 300, al: [al('Barbunya', null, null, 'kuru')] },
  ],
  etliSebze: [
    { ad: '10 yemek kaşığı kıymalı taze fasulye', p: 14, k: 230, al: [al('Kıyma (az yağlı)', null, null, 'kasap'), al('Taze fasulye')] },
    { ad: '10 yemek kaşığı kıymalı ıspanak', p: 15, k: 220, al: [al('Kıyma (az yağlı)', null, null, 'kasap'), al('Ispanak')] },
    { ad: '10 yemek kaşığı kıymalı kabak', p: 13, k: 215, al: [al('Kıyma (az yağlı)', null, null, 'kasap'), al('Kabak', 2, 'adet')] },
    { ad: '10 yemek kaşığı etli bezelye', p: 17, k: 260, al: [al('Kuşbaşı et', null, null, 'kasap'), al('Bezelye (dondurulmuş olur)')] },
  ],
  gece: [
    { ad: '1 salatalık + 1 ceviz', p: 1, k: 45, al: [al('Salatalık', 1, 'adet'), al('Ceviz', null, null, 'kuruyemis')] },
    { ad: '1 su bardağı süt', p: 6.5, k: 125, al: [al('Süt', null, null, 'sut')] },
    { ad: '1 küçük kase yoğurt', p: 5, k: 80, al: [al('Yoğurt', null, null, 'sut')] },
    { ad: '5 yemek kaşığı süzme yoğurt + tarçın', p: 9, k: 115, al: [al('Süzme yoğurt', null, null, 'sut')] },
  ],
};

// Öğün seçenekleri: kalem = [grup, varsayılan seçenek]. dk = hazırlama süresi (yaklaşık).
// spor: antrenman günü ara öğününde öne çıkar. neden: kartta "Neden bu?" satırı.
export const OGUNLER = {
  kahvalti: {
    ad: 'Kahvaltı', saat: '11:00–12:30', ikon: 'gunes',
    secenekler: {
      klasik: { ad: 'Klasik kahvaltı', dk: 10, kalem: [['yumurta', 0], ['peynir', 0], ['ekmek', 0], ['yesillik', 0], ['yag', 0]],
        neden: '2 yumurta ve peynir öğlene kadar tok tutar. Tam buğday ekmeğinin lifi kan şekerini yavaş yükseltir; zeytin iyi yağ.' },
      menemen: { ad: 'Menemenli kahvaltı', dk: 12, kalem: [['yumurta', 6], ['ekmek', 2], ['yesillik', 1], ['yag', 0], ['peynir', 4]],
        neden: '3 yumurta ve peynir proteini getirir; domates ve biber günün ilk sebzesi olur. Köy ekmeği beyaz ekmekten daha lifli.' },
      yulaf: { ad: 'Yoğurtlu yulaf kasesi', dk: 3, not: 'Pişirmek yok: karıştır, üstüne tarçın serp. Yumurtayı önceden haşlayıp dolapta tutabilirsin.', kalem: [['sut', 4], ['yulaf', 0], ['meyve', 5], ['kuruyemis', 0], ['yumurta', 5]],
        neden: 'Süzme yoğurtta normal yoğurdun iki katı protein var. Yulafın lifi tokluğu uzatıp şekeri dengeler; tatlı isteğini meyve ve tarçın karşılar.' },
      tost: { ad: 'Peynirli tost', dk: 7, kalem: [['ekmek', 0], ['peynir', 5], ['yesillik', 0], ['sut', 2], ['yumurta', 5]],
        neden: 'Kaşar, beyaz peynir ve yanındaki yumurta proteini 30 gramın üstüne çıkarır. Tam buğday ekmeği beyaz tosttan daha uzun tok tutar.' },
      lorlu: { ad: 'Lorlu omlet', dk: 10, kalem: [['yumurta', 3], ['ekmek', 1], ['yesillik', 2], ['yag', 0], ['peynir', 4]],
        neden: 'Lor az yağlı ve proteinli; omlete katınca az kaloriyle çok tokluk verir. Çavdar ekmeği kan şekerini yavaş yükseltir.' },
      simit: { ad: 'Hafta sonu simitli', dk: 5, kalem: [['ekmek', 4], ['peynir', 0], ['yumurta', 0], ['yesillik', 0]],
        neden: 'Hafta sonu keyfi de olsun: yarım simit yeter. Yanındaki 2 yumurta ve peynir, simidin şekeri hızlı yükseltmesini frenler.' },
    },
  },
  ara: {
    ad: 'Ara öğün', saat: '15:30–16:00', ikon: 'elma',
    secenekler: {
      meyveYogurt: { ad: 'Meyve + süzme yoğurt + ceviz', dk: 2, kalem: [['meyve', 0], ['yogurtAz', 3], ['kuruyemis', 0]],
        neden: 'Meyve tek başına çabuk acıktırır. Süzme yoğurt ve ceviz eklenince akşam yemeğine kadar rahat dayanırsın.' },
      sandvic: { ad: 'Tam buğday sandviç + ayran', dk: 5, spor: true, kalem: [['ekmek', 0], ['peynir', 0], ['yesillik', 0], ['yogurtAz', 2]],
        neden: 'Antrenman günü için ideal: peynirden protein, ekmekten enerji. Kasların toparlanması için yaklaşık 20 gram protein.' },
      kefir: { ad: 'Kefir + meyve + leblebi', dk: 1, kalem: [['sut', 5], ['meyve', 2], ['kuruyemis', 4]],
        neden: 'Kefir hem protein hem probiyotik; leblebi bitkisel protein ve lif verir. Pişirmek yok, çantada taşınır.' },
      yulafKase: { ad: 'Süzme yoğurt + yulaf + badem', dk: 2, spor: true, not: 'Tarçın serpebilirsin.', kalem: [['sut', 4], ['yulaf', 1], ['kuruyemis', 1]],
        neden: 'Antrenmandan sonra iyi gelir: süzme yoğurdun proteini kası onarır, yulaf harcanan enerjiyi yerine koyar.' },
      badem: { ad: 'Leblebi + ayran + yumurta', dk: 1, kalem: [['kuruyemis', 4], ['sut', 2], ['yumurta', 5]],
        neden: 'En pratik protein üçlüsü: leblebi, ayran ve bir haşlanmış yumurta. Canın meyve isterse yanına bir tane ekle.' },
      durum: { ad: 'Lorlu yumurtalı dürüm', dk: 5, spor: true, kalem: [['ekmek', 5], ['peynir', 2], ['yesillik', 1], ['yumurta', 5]],
        neden: 'Lor ve yumurta yaklaşık 18 gram protein; dürüm olunca dışarıda da rahat yenir.' },
      yumurtali: { ad: '2 yumurta + galeta + ayran', dk: 2, spor: true, kalem: [['yumurta', 0], ['ekmek', 3], ['yesillik', 0], ['yogurtAz', 2]],
        neden: 'İki yumurta ve ayran yaklaşık 20 gram protein. Galeta çıtırlık isteğini az kaloriyle karşılar.' },
    },
  },
  aksam: {
    ad: 'Akşam yemeği', saat: '19:30–20:00', ikon: 'tencere',
    secenekler: {
      kofte: { ad: 'Izgara köfte tabağı', dk: 25, kalem: [['protein', 0], ['sebze', 0], ['tahil', 0], ['salata', 0], ['yogurtAksam', 0]],
        neden: 'Köfte ve yoğurt günün en büyük protein öğününü oluşturur. Bulgur lifli; tabağın yarısını sebze ve salata doldurur.' },
      tavuk: { ad: 'Tavuk sote', dk: 20, kalem: [['protein', 1], ['tahil', 0], ['salata', 1], ['yogurtAksam', 0]],
        neden: 'Tavuk en yağsız protein. Tabak dengesi: yarısı sebze, çeyreği protein, çeyreği tahıl.' },
      balik: { ad: 'Balık akşamı', dk: 20, not: 'Haftada 2 balık iyi gelir.', kalem: [['protein', 4], ['salata', 2], ['tahil', 2]],
        neden: 'Balık omega-3 kaynağı; PMOS’ta yüksek olabilen trigliseridi düşürmeye yardım eder. Haftada iki kez öneriliyor.' },
      mercimek: { ad: 'Mercimek çorbası + ızgara tavuk', dk: 30, kalem: [['tahil', 1], ['protein', 3], ['salata', 0], ['yogurtAksam', 0]],
        neden: 'Mercimek çorbası lif ve bitkisel protein verir ama tek başına az kalır; yanına ızgara tavuk gelince akşam tamamlanır.' },
      fasulye: { ad: 'Kuru baklagil akşamı', dk: 15, not: 'Haşlanmış kavanoz baklagil süreyi kısaltır.', kalem: [['baklagil', 0], ['tahil', 0], ['salata', 1], ['yogurtAksam', 3]],
        neden: 'Baklagiller insülin direncine en iyi gelen besinlerden. Bulgurla birlikte tam protein olur; süzme yoğurtlu cacık proteini tamamlar.' },
      menemenAksam: { ad: 'Pratik menemen akşamı', dk: 12, kalem: [['protein', 6], ['salata', 0], ['tahil', 2], ['yogurtAksam', 0]],
        neden: 'Yorgun akşamlar için 12 dakikalık çözüm. 3 yumurta ve bir kase yoğurtla protein yerini bulur.' },
      baget: { ad: 'Fırında baget + sebze', dk: 35, not: 'Fırın çalışırken sen dinlen.', kalem: [['protein', 2], ['sebze', 3], ['yogurtAksam', 0], ['tahil', 0]],
        neden: 'Derisiz baget ekonomik ve doyurucu; fırında piştiği için ekstra yağ gerekmez.' },
      etliSebze: { ad: 'Kıymalı sebze yemeği', dk: 30, kalem: [['etliSebze', 0], ['tahil', 2], ['yogurtAksam', 3], ['salata', 0]],
        neden: 'Klasik ev yemeği: sebze ve kıyma bir arada. Süzme yoğurtlu cacık proteini 30 gramın üstüne çıkarır.' },
      tonSalata: { ad: 'Ton balıklı salata', dk: 5, kalem: [['protein', 7], ['salata', 0], ['tahil', 4], ['yumurta', 5]],
        neden: 'Beş dakikada akşam yemeği: ton balığı ve yumurta proteini taşır, nohut lif ekler.' },
    },
  },
};

// Haftanın günlerine göre gösterilen seçenekler (Pazartesi = 0). İki haftalık döngü.
// Hafta içi 2, hafta sonu 3 seçenek. Balık Salı ve Cuma; baklagil haftada 3–4 kez.
export const DONGU = {
  kahvalti: [
    [['klasik', 'yulaf'], ['menemen', 'tost'], ['lorlu', 'yulaf'], ['klasik', 'tost'], ['menemen', 'yulaf'], ['simit', 'klasik', 'menemen'], ['lorlu', 'menemen', 'simit']],
    [['tost', 'klasik'], ['yulaf', 'lorlu'], ['menemen', 'klasik'], ['yulaf', 'lorlu'], ['tost', 'klasik'], ['klasik', 'menemen', 'simit'], ['simit', 'yulaf', 'lorlu']],
  ],
  ara: [
    [['meyveYogurt', 'sandvic'], ['kefir', 'badem'], ['meyveYogurt', 'durum'], ['yulafKase', 'badem'], ['meyveYogurt', 'yumurtali'], ['kefir', 'sandvic', 'badem'], ['meyveYogurt', 'yulafKase', 'durum']],
    [['badem', 'yulafKase'], ['meyveYogurt', 'sandvic'], ['kefir', 'yumurtali'], ['meyveYogurt', 'durum'], ['badem', 'sandvic'], ['meyveYogurt', 'kefir', 'yumurtali'], ['yulafKase', 'badem', 'sandvic']],
  ],
  aksam: [
    [['kofte', 'mercimek'], ['balik', 'tavuk'], ['fasulye', 'baget'], ['etliSebze', 'tonSalata'], ['balik', 'menemenAksam'], ['kofte', 'fasulye', 'tavuk'], ['mercimek', 'baget', 'etliSebze']],
    [['tavuk', 'fasulye'], ['balik', 'etliSebze'], ['mercimek', 'kofte'], ['baget', 'menemenAksam'], ['balik', 'tonSalata'], ['fasulye', 'kofte', 'baget'], ['tavuk', 'mercimek', 'etliSebze']],
  ],
};

// Yumak'ın beslenme notları: araştırma raporundan (diyet-arastirma.md) kısa, suçlamayan dil
export const ILKELER = [
  { b: 'Tek bir "PMOS diyeti" yok', t: 'Uluslararası kılavuz hiçbir diyetin diğerinden üstün olmadığını söylüyor. En iyi diyet, sürdürebildiğin diyet.' },
  { b: 'Lifli karbonhidrat', t: 'Beyaz ekmek ve pirinç yerine çoğunlukla bulgur, köy, çavdar ya da tam buğday ekmeği. Haftada birkaç kez mercimek, nohut, fasulye.' },
  { b: 'Her öğünde protein', t: 'Günde yaklaşık 100 gram: ana öğünlerde 30–40, ara öğünde 15–20 gram. Tok tutar, dambılla çalışan kaslarını korur. Kartlardaki sayılar bunu gösterir.' },
  { b: 'Hafif bir açık, aç bırakmayan', t: 'Menüler günde yaklaşık 1500 kcal’ye göre ayarlı: harcadığından biraz az. Çok düşük kalori acıktırır ve kas kaybettirir; bu yüzden porsiyonlar doyurucu.' },
  { b: 'Sebze ve zeytinyağı', t: 'Tabağın yarısı sebze, üstüne bir kaşık zeytinyağı. Türk mutfağı bunu zaten çok iyi yapıyor.' },
  { b: 'Şekerli içecek yerine su', t: 'En güçlü kanıt bu değişikliğin. Meyve suyu yerine meyvenin kendisi; çaya şeker yerine tarçın.' },
  { b: 'Yemekten sonra 10 dakika yürü', t: 'Kısa yürüyüşler yemek sonrası şekeri belirgin şekilde düşürüyor. Programındaki yürüyüşler tam bunun için.' },
  { b: 'Kaçamak olur, sorun yok', t: 'Yasak listesi yok. Bir öğün planın dışına çıktıysa sonrakiyle devam. Kediler geçmişe takılmaz.' },
];

export const MITLER = [
  { s: 'Gluteni kesmek PMOS\'a iyi gelir.', c: 'Mit', t: 'Çölyak yoksa bunu destekleyen bir çalışma yok. Tam tahıllı ekmek senin dostun.' },
  { s: 'Süt ürünlerini bırakmak gerekir.', c: 'Mit', t: 'Kanıt yok. Yoğurt, kefir, ayran gönül rahatlığıyla.' },
  { s: 'Kahve yasak.', c: 'Mit', t: 'Kanıt yok. Ölçülü (günde 3–4 fincana kadar) içilebilir.' },
  { s: 'Detoks suları, sirkeli su ödem atar.', c: 'Mit', t: 'Dayanağı yok. Bol su ve sebze, en iyi "detoks".' },
  { s: 'Şekerli içecekleri azaltmak fark eder.', c: 'Gerçek', t: 'Kanıtı en güçlü değişikliklerden biri. Çay şekeri de buna dahil.' },
  { s: 'Baklagil ve tam tahıl insüline iyi gelir.', c: 'Gerçek', t: 'Düşük glisemik indeksli, lifli beslenme insülin direncini azaltıyor.' },
  { s: 'Kilo vermeden fayda olmaz.', c: 'Mit', t: 'Kılavuz açıkça söylüyor: kilo değişmese de sağlıklı beslenme ve hareketin faydası var.' },
];

export const TAKVIYELER = [
  { b: 'İnositol', t: 'Metabolik değerlerde küçük fayda olabilir; adet, tüylenme ve kiloya etkisi belirsiz. Kullanıyorsan doktorunla konuş.' },
  { b: 'D vitamini', t: 'Eksiklik varsa tedavi edilir. İnsülin direncini düzelttiğine dair güvenilir kanıt yok.' },
  { b: 'Omega-3', t: 'Haftada 2 porsiyon balık en kolay yolu.' },
  { b: 'Tarçın, nane çayı, yeşil çay', t: 'Yemekte baharat, demlenmiş çay olarak keyifle. Kapsül ve yüksek doz değil.' },
  { b: 'B12 (metformin kullanıyorsan)', t: 'Uzun süreli metformin B12\'yi düşürebilir. Yorgunluk ya da karıncalanma olursa ölçtür.' },
];
