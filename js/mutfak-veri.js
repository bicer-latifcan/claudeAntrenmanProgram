// ============================================================
//  YUMAK'IN MUTFAĞI — öğün seçenekleri (değişiklikler bu dosyada).
//  Her öğün, gruplardan seçilmiş kalemlerden oluşur. "Değiştir" aynı
//  gruptaki eşdeğerleri gösterir. Ölçüler ev ölçüsü (yemek kaşığı, tatlı kaşığı,
//  su bardağı), kısaltmasız yazılır. Porsiyonlar TÜBER 2022 ve önceki diyetisyen
//  listelerine göre; sakatat yok. Kalori ve tartı yok.
//  Alışveriş: [ürün, miktar, birim, reyon]; miktar null ise "var olsun".
// ============================================================

export const REYON = {
  manav: 'Manav', sut: 'Süt ürünleri ve yumurta', kasap: 'Et, tavuk, balık',
  kuru: 'Bakliyat ve kuru gıda', firin: 'Ekmek', kuruyemis: 'Kuruyemiş',
};

const al = (urun, miktar = null, birim = null, reyon = 'manav') => [urun, miktar, birim, reyon];
const Y = (n) => al('Yumurta', n, 'adet', 'sut');

export const GRUPLAR = {
  yumurta: [
    { ad: '2 haşlanmış yumurta', al: [Y(2)] },
    { ad: '2 yumurtalı omlet (1 tatlı kaşığı zeytinyağıyla)', al: [Y(2)] },
    { ad: '2 yumurtalı menemen', al: [Y(2), al('Domates', 1, 'adet'), al('Sivri biber', 2, 'adet')] },
    { ad: 'Lorlu omlet: 1 yumurta + 3 yemek kaşığı lor', al: [Y(1), al('Lor peyniri', null, null, 'sut')] },
    { ad: 'Sahanda 2 yumurta (1 tatlı kaşığı tereyağıyla)', al: [Y(2)] },
    { ad: '1 haşlanmış yumurta', al: [Y(1)] },
  ],
  peynir: [
    { ad: '2 kibrit kutusu beyaz peynir (az yağlı)', al: [al('Beyaz peynir (az yağlı)', 2, 'kk', 'sut')] },
    { ad: '1 kibrit kutusu kaşar', al: [al('Kaşar peyniri', 1, 'kk', 'sut')] },
    { ad: '4 yemek kaşığı lor peyniri', al: [al('Lor peyniri', null, null, 'sut')] },
    { ad: '2 yemek kaşığı labne', al: [al('Labne', null, null, 'sut')] },
  ],
  ekmek: [
    { ad: '2 ince dilim tam buğday ekmeği', al: [al('Tam buğday ekmeği', 2, 'dilim', 'firin')] },
    { ad: '2 ince dilim çavdar ekmeği', al: [al('Çavdar ekmeği', 2, 'dilim', 'firin')] },
    { ad: '2 ince dilim köy ekmeği', al: [al('Köy ekmeği', 2, 'dilim', 'firin')] },
    { ad: '2 galeta', al: [al('Galeta', 2, 'adet', 'firin')] },
    { ad: '½ simit (arada bir)', al: [al('Simit', 0.5, 'adet', 'firin')] },
    { ad: '¼ tam buğday lavaş (dürüm)', al: [al('Tam buğday lavaş', null, null, 'firin')] },
  ],
  yesillik: [
    { ad: 'Domates, salatalık, 10 dal maydanoz (serbest)', al: [al('Domates', 1, 'adet'), al('Salatalık', 1, 'adet'), al('Maydanoz')] },
    { ad: 'Salatalık, roka, taze soğan (serbest)', al: [al('Salatalık', 1, 'adet'), al('Roka'), al('Taze soğan')] },
    { ad: 'Domates, biber, dereotu (serbest)', al: [al('Domates', 1, 'adet'), al('Sivri biber', 1, 'adet'), al('Dereotu')] },
  ],
  yag: [
    { ad: '7 zeytin', al: [al('Zeytin', null, null, 'kuru')] },
    { ad: '2 ceviz', al: [al('Ceviz', null, null, 'kuruyemis')] },
    { ad: '10 fındık', al: [al('Fındık', null, null, 'kuruyemis')] },
    { ad: '1 tatlı kaşığı tahin', al: [al('Tahin', null, null, 'kuru')] },
  ],
  yulaf: [
    { ad: '3 yemek kaşığı yulaf ezmesi', al: [al('Yulaf ezmesi', null, null, 'kuru')] },
    { ad: '2 yemek kaşığı yulaf ezmesi', al: [al('Yulaf ezmesi', null, null, 'kuru')] },
    { ad: '1 ince dilim tam buğday ekmeği', al: [al('Tam buğday ekmeği', 1, 'dilim', 'firin')] },
  ],
  sut: [
    { ad: '1 kase yoğurt', al: [al('Yoğurt', null, null, 'sut')] },
    { ad: '1 bardak kefir', al: [al('Kefir', null, null, 'sut')] },
    { ad: '1 büyük bardak ayran', al: [al('Ayran', null, null, 'sut')] },
    { ad: '1 su bardağı süt', al: [al('Süt', null, null, 'sut')] },
  ],
  yogurtAz: [
    { ad: '3 yemek kaşığı yoğurt', al: [al('Yoğurt', null, null, 'sut')] },
    { ad: 'Yarım bardak kefir', al: [al('Kefir', null, null, 'sut')] },
    { ad: '1 küçük ayran', al: [al('Ayran', null, null, 'sut')] },
  ],
  meyve: [
    { ad: '1 orta boy elma', al: [al('Elma', 1, 'adet')] },
    { ad: '1 armut', al: [al('Armut', 1, 'adet')] },
    { ad: '2 mandalina', al: [al('Mandalina', 2, 'adet')] },
    { ad: '1 portakal', al: [al('Portakal', 1, 'adet')] },
    { ad: '1 küçük muz', al: [al('Muz', 1, 'adet')] },
    { ad: '1 küçük kase nar tanesi', al: [al('Nar', null)] },
    { ad: '2 incir', al: [al('İncir', 2, 'adet')] },
    { ad: '12 tane üzüm', al: [al('Üzüm')] },
  ],
  kuruyemis: [
    { ad: '2 ceviz', al: [al('Ceviz', null, null, 'kuruyemis')] },
    { ad: '10 badem', al: [al('Badem', null, null, 'kuruyemis')] },
    { ad: '10 fındık', al: [al('Fındık', null, null, 'kuruyemis')] },
    { ad: '1 yemek kaşığı tuzsuz kabak çekirdeği', al: [al('Kabak çekirdeği (tuzsuz)', null, null, 'kuruyemis')] },
  ],
  protein: [
    { ad: '3 köfte kadar ızgara köfte', al: [al('Köftelik kıyma', null, null, 'kasap')] },
    { ad: '5 yemek kaşığı tavuk sote (biberli)', al: [al('Tavuk göğsü', null, null, 'kasap'), al('Sivri biber', 2, 'adet')] },
    { ad: '2 derisiz baget (fırında)', al: [al('Tavuk baget', 2, 'adet', 'kasap')] },
    { ad: '1 avuç ızgara tavuk göğsü', al: [al('Tavuk göğsü', null, null, 'kasap')] },
    { ad: '1 porsiyon balık (avuç içi kadar)', al: [al('Balık (mevsiminde olan)', null, null, 'kasap')] },
    { ad: '4 et şiş', al: [al('Kuşbaşı et', null, null, 'kasap')] },
    { ad: '2 yumurtalı menemen', al: [Y(2), al('Domates', 1, 'adet'), al('Sivri biber', 2, 'adet')] },
    { ad: '1 kutu ton balığı (suyu süzülmüş)', al: [al('Ton balığı konservesi', 1, 'adet', 'kuru')] },
  ],
  sebze: [
    { ad: '6 yemek kaşığı zeytinyağlı taze fasulye', al: [al('Taze fasulye')] },
    { ad: '6 yemek kaşığı ıspanak yemeği', al: [al('Ispanak')] },
    { ad: '6 yemek kaşığı kabak yemeği', al: [al('Kabak', 2, 'adet')] },
    { ad: '6 yemek kaşığı fırında karışık sebze', al: [al('Kabak', 1, 'adet'), al('Havuç', 1, 'adet'), al('Sivri biber', 2, 'adet')] },
    { ad: '6 yemek kaşığı zeytinyağlı pırasa', al: [al('Pırasa')] },
    { ad: '6 yemek kaşığı brokoli ya da karnabahar', al: [al('Brokoli / karnabahar')] },
  ],
  tahil: [
    { ad: '4 yemek kaşığı bulgur pilavı', al: [al('Bulgur (pilavlık)', null, null, 'kuru')] },
    { ad: '1 kase mercimek çorbası', al: [al('Kırmızı mercimek', null, null, 'kuru')] },
    { ad: '2 ince dilim tam buğday ekmeği', al: [al('Tam buğday ekmeği', 2, 'dilim', 'firin')] },
    { ad: '4 yemek kaşığı tam buğday makarna', al: [al('Tam buğday makarna', null, null, 'kuru')] },
    { ad: '4 yemek kaşığı haşlanmış nohut', al: [al('Nohut (kuru ya da haşlanmış kavanoz)', null, null, 'kuru')] },
  ],
  salata: [
    { ad: 'Mevsim salatası + 1 yemek kaşığı zeytinyağı + limon', al: [al('Marul'), al('Domates', 1, 'adet'), al('Salatalık', 1, 'adet'), al('Limon')] },
    { ad: 'Çoban salatası + 1 yemek kaşığı zeytinyağı', al: [al('Domates', 2, 'adet'), al('Salatalık', 1, 'adet'), al('Sivri biber', 1, 'adet')] },
    { ad: 'Roka-domates salatası + 1 yemek kaşığı zeytinyağı', al: [al('Roka'), al('Domates', 1, 'adet')] },
    { ad: 'Havuçlu lahana salatası + 1 yemek kaşığı zeytinyağı', al: [al('Beyaz lahana'), al('Havuç', 1, 'adet')] },
  ],
  yogurtAksam: [
    { ad: '3 yemek kaşığı yoğurt', al: [al('Yoğurt', null, null, 'sut')] },
    { ad: '1 kase cacık', al: [al('Yoğurt', null, null, 'sut'), al('Salatalık', 1, 'adet')] },
    { ad: '1 bardak ayran', al: [al('Ayran', null, null, 'sut')] },
  ],
  baklagil: [
    { ad: '8 yemek kaşığı kuru fasulye yemeği', al: [al('Kuru fasulye', null, null, 'kuru')] },
    { ad: '8 yemek kaşığı nohut yemeği', al: [al('Nohut (kuru ya da haşlanmış kavanoz)', null, null, 'kuru')] },
    { ad: '8 yemek kaşığı yeşil mercimek yemeği', al: [al('Yeşil mercimek', null, null, 'kuru')] },
    { ad: '8 yemek kaşığı zeytinyağlı barbunya', al: [al('Barbunya', null, null, 'kuru')] },
  ],
  etliSebze: [
    { ad: '8 yemek kaşığı kıymalı taze fasulye', al: [al('Kıyma (az yağlı)', null, null, 'kasap'), al('Taze fasulye')] },
    { ad: '8 yemek kaşığı kıymalı ıspanak', al: [al('Kıyma (az yağlı)', null, null, 'kasap'), al('Ispanak')] },
    { ad: '8 yemek kaşığı kıymalı kabak', al: [al('Kıyma (az yağlı)', null, null, 'kasap'), al('Kabak', 2, 'adet')] },
    { ad: '8 yemek kaşığı etli bezelye', al: [al('Kuşbaşı et', null, null, 'kasap'), al('Bezelye (dondurulmuş olur)')] },
  ],
  gece: [
    { ad: '1 salatalık + 1 ceviz', al: [al('Salatalık', 1, 'adet'), al('Ceviz', null, null, 'kuruyemis')] },
    { ad: '1 su bardağı süt', al: [al('Süt', null, null, 'sut')] },
    { ad: '1 küçük kase yoğurt', al: [al('Yoğurt', null, null, 'sut')] },
  ],
};

// Öğün seçenekleri: kalem = [grup, varsayılan seçenek]. dk = hazırlama süresi (yaklaşık).
// spor: antrenman günü ara öğününde öne çıkar (protein içeriyor).
export const OGUNLER = {
  kahvalti: {
    ad: 'Kahvaltı', saat: '11:00–12:30', ikon: 'gunes',
    secenekler: {
      klasik: { ad: 'Klasik kahvaltı', dk: 10, kalem: [['yumurta', 0], ['peynir', 0], ['ekmek', 0], ['yesillik', 0], ['yag', 0]] },
      menemen: { ad: 'Menemenli kahvaltı', dk: 12, kalem: [['yumurta', 2], ['ekmek', 2], ['yesillik', 1], ['yag', 1]] },
      yulaf: { ad: 'Yoğurtlu yulaf kasesi', dk: 3, not: 'Pişirmek yok: karıştır, üstüne tarçın serp.', kalem: [['sut', 0], ['yulaf', 0], ['meyve', 4], ['kuruyemis', 0]] },
      tost: { ad: 'Peynirli tost', dk: 7, kalem: [['ekmek', 0], ['peynir', 1], ['yesillik', 0], ['sut', 2]] },
      lorlu: { ad: 'Lorlu omlet', dk: 10, kalem: [['yumurta', 3], ['ekmek', 1], ['yesillik', 2], ['yag', 0]] },
      simit: { ad: 'Hafta sonu simitli', dk: 5, kalem: [['ekmek', 4], ['peynir', 0], ['yumurta', 5], ['yesillik', 0]] },
    },
  },
  ara: {
    ad: 'Ara öğün', saat: '15:30–16:00', ikon: 'elma',
    secenekler: {
      meyveYogurt: { ad: 'Meyve + yoğurt + kuruyemiş', dk: 2, kalem: [['meyve', 0], ['yogurtAz', 0], ['kuruyemis', 0]] },
      sandvic: { ad: 'Tam buğday sandviç', dk: 5, spor: true, kalem: [['ekmek', 0], ['peynir', 0], ['yesillik', 0]] },
      kefir: { ad: 'Kefir + meyve', dk: 1, kalem: [['sut', 1], ['meyve', 2]] },
      yulafKase: { ad: 'Yoğurt + yulaf', dk: 2, spor: true, not: 'Tarçın serpebilirsin.', kalem: [['sut', 0], ['yulaf', 1]] },
      badem: { ad: 'Meyve + bir avuç badem', dk: 1, kalem: [['meyve', 1], ['kuruyemis', 1]] },
      durum: { ad: 'Lorlu dürüm', dk: 4, spor: true, kalem: [['ekmek', 5], ['peynir', 2], ['yesillik', 1]] },
      yumurtali: { ad: 'Haşlanmış yumurta + galeta', dk: 2, spor: true, kalem: [['yumurta', 5], ['ekmek', 3], ['yesillik', 0]] },
    },
  },
  aksam: {
    ad: 'Akşam yemeği', saat: '19:30–20:00', ikon: 'tencere',
    secenekler: {
      kofte: { ad: 'Izgara köfte tabağı', dk: 25, kalem: [['protein', 0], ['sebze', 0], ['tahil', 0], ['salata', 0], ['yogurtAksam', 0]] },
      tavuk: { ad: 'Tavuk sote', dk: 20, kalem: [['protein', 1], ['tahil', 0], ['salata', 1], ['yogurtAksam', 0]] },
      balik: { ad: 'Balık akşamı', dk: 20, not: 'Haftada 2 balık iyi gelir.', kalem: [['protein', 4], ['salata', 2], ['tahil', 2]] },
      mercimek: { ad: 'Mercimek çorbası + sebze', dk: 30, kalem: [['tahil', 1], ['sebze', 1], ['salata', 0], ['yogurtAksam', 0]] },
      fasulye: { ad: 'Kuru baklagil akşamı', dk: 15, not: 'Bulgurla birlikte tam protein. Haşlanmış kavanoz baklagil süreyi kısaltır.', kalem: [['baklagil', 0], ['tahil', 0], ['salata', 1], ['yogurtAksam', 1]] },
      menemenAksam: { ad: 'Pratik menemen akşamı', dk: 12, kalem: [['protein', 6], ['salata', 0], ['tahil', 2], ['yogurtAksam', 0]] },
      baget: { ad: 'Fırında baget + sebze', dk: 35, not: 'Fırın çalışırken sen dinlen.', kalem: [['protein', 2], ['sebze', 3], ['yogurtAksam', 0]] },
      etliSebze: { ad: 'Kıymalı sebze yemeği', dk: 30, kalem: [['etliSebze', 0], ['tahil', 2], ['yogurtAksam', 0]] },
      tonSalata: { ad: 'Ton balıklı salata', dk: 5, kalem: [['protein', 7], ['salata', 0], ['tahil', 4]] },
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
  { b: 'Her öğünde protein', t: 'Yumurta, peynir, yoğurt, tavuk, köfte, balık ya da baklagil. Tok tutar, dambılla çalışan kaslarını besler.' },
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
