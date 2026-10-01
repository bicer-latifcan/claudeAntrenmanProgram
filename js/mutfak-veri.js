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

// p: yaklaşık protein (g), k: yaklaşık enerji (kcal), gr: ölçünün gram karşılığı (ekranda parantez içinde).
// Değerler TÜBER 2022 ve USDA ortalamalarından ev ölçüsüne çevrildi; ±%15 sapabilir. Hedef (165 cm, 25 yaş,
// haftada 3 kuvvet + günlük yürüyüş): günde ≈ 1500 kcal (harcamanın ≈ 500 altı) ve ≈ 100 g protein.
// Alışveriş: [ürün, miktar, birim (g, ml, adet, demet), reyon]; aynı ürün hep aynı birimle yazılır (toplanabilsin).
// Sırayı bozma: kayıtlı "değiştir" seçimleri sıra numarasıyla tutulur; yeni seçenekleri grubun SONUNA ekle.
export const HEDEF = { protein: 100, kcal: 1500 };

// Alışma dönemi: ilk turda hedef birden 1500'e inmesin. İlk haftalarda kartlarda "istersen ekle" önerileri çıkar.
export const ALISMA = [
  { haftalar: [1, 2], kcal: 1800, ekler: ['kahvalti', 'ara', 'aksam'], ad: 'Alışma haftası' },
  { haftalar: [3, 4], kcal: 1650, ekler: ['ara', 'aksam'], ad: 'Geçiş haftası' },
];
export const EKLER = { // öğün başına bir küçük ek (≈ 60–120 kcal)
  kahvalti: { ad: '1 ince dilim tam buğday ekmeği', gr: '≈ 25 g', p: 2.5, k: 63, al: [['Tam buğday ekmeği', 25, 'g', 'firin']] },
  ara: { ad: '1 meyve ya da 10 badem', gr: 'meyve ≈ 150 g, badem ≈ 12 g', p: 1.5, k: 70, al: [['Elma', 1, 'adet', 'manav']] },
  aksam: { ad: '4 yemek kaşığı bulgur pilavı', gr: '≈ 80 g pişmiş', p: 3, k: 110, al: [['Bulgur (pilavlık)', 30, 'g', 'kuru']] },
};

const G = (urun, g, reyon = 'manav') => al(urun, g, 'g', reyon);
const ML = (urun, ml, reyon = 'sut') => al(urun, ml, 'ml', reyon);
const A = (urun, n, reyon = 'manav') => al(urun, n, 'adet', reyon);
const DM = (urun, n = 0.25) => al(urun, n, 'demet');

export const GRUPLAR = {
  yumurta: [
    { ad: '2 haşlanmış yumurta', p: 12.5, k: 150, al: [Y(2)] },
    { ad: '2 yumurtalı omlet (1 tatlı kaşığı zeytinyağıyla)', gr: 'yağ ≈ 5 ml', p: 12.5, k: 195, al: [Y(2)] },
    { ad: '2 yumurtalı menemen', gr: '1 domates ≈ 150 g', p: 13, k: 190, al: [Y(2), A('Domates', 1), A('Sivri biber', 2)] },
    { ad: 'Lorlu omlet: 2 yumurta + 3 yemek kaşığı lor', gr: 'lor ≈ 45 g', p: 18, k: 200, al: [Y(2), G('Lor peyniri', 45, 'sut')] },
    { ad: 'Sahanda 2 yumurta (1 tatlı kaşığı tereyağıyla)', gr: 'tereyağı ≈ 5 g', p: 12.5, k: 185, al: [Y(2)] },
    { ad: '1 haşlanmış yumurta', p: 6.3, k: 75, al: [Y(1)] },
    { ad: '3 yumurtalı menemen', gr: '1 domates ≈ 150 g', p: 19.5, k: 265, al: [Y(3), A('Domates', 1), A('Sivri biber', 2)] },
  ],
  peynir: [
    { ad: '2 kibrit kutusu beyaz peynir (az yağlı)', gr: '≈ 60 g', p: 10.5, k: 135, al: [G('Beyaz peynir (az yağlı)', 60, 'sut')] },
    { ad: '1 kibrit kutusu kaşar', gr: '≈ 30 g', p: 8, k: 110, al: [G('Kaşar peyniri', 30, 'sut')] },
    { ad: '4 yemek kaşığı lor peyniri', gr: '≈ 60 g', p: 7, k: 60, al: [G('Lor peyniri', 60, 'sut')] },
    { ad: '2 yemek kaşığı labne', gr: '≈ 40 g', p: 2.5, k: 80, al: [G('Labne', 40, 'sut')] },
    { ad: '1 kibrit kutusu beyaz peynir (az yağlı)', gr: '≈ 30 g', p: 5.3, k: 68, al: [G('Beyaz peynir (az yağlı)', 30, 'sut')] },
    { ad: '1 kibrit kutusu kaşar + 1 kibrit kutusu beyaz peynir', gr: '≈ 30 g + 30 g', p: 13.3, k: 178, al: [G('Kaşar peyniri', 30, 'sut'), G('Beyaz peynir (az yağlı)', 30, 'sut')] },
  ],
  ekmek: [
    { ad: '2 ince dilim tam buğday ekmeği', gr: '≈ 50 g', p: 5, k: 125, al: [G('Tam buğday ekmeği', 50, 'firin')] },
    { ad: '2 ince dilim çavdar ekmeği', gr: '≈ 50 g', p: 4.5, k: 120, al: [G('Çavdar ekmeği', 50, 'firin')] },
    { ad: '2 ince dilim köy ekmeği', gr: '≈ 50 g', p: 4.5, k: 130, al: [G('Köy ekmeği', 50, 'firin')] },
    { ad: '2 galeta', gr: '≈ 20 g', p: 2.5, k: 70, al: [A('Galeta', 2, 'firin')] },
    { ad: '½ simit (arada bir)', gr: '≈ 60 g', p: 6, k: 170, al: [A('Simit', 0.5, 'firin')] },
    { ad: '½ tam buğday lavaş (dürüm)', gr: '≈ 35 g', p: 4, k: 140, al: [A('Tam buğday lavaş', 0.5, 'firin')] },
    { ad: '1 ince dilim tam buğday ekmeği', gr: '≈ 25 g', p: 2.5, k: 63, al: [G('Tam buğday ekmeği', 25, 'firin')] },
  ],
  yesillik: [
    { ad: 'Domates, salatalık, 10 dal maydanoz (serbest)', gr: '≈ 150 g', p: 1, k: 25, al: [A('Domates', 1), A('Salatalık', 1), DM('Maydanoz')] },
    { ad: 'Salatalık, roka, taze soğan (serbest)', gr: '≈ 150 g', p: 1, k: 20, al: [A('Salatalık', 1), DM('Roka'), DM('Taze soğan')] },
    { ad: 'Domates, biber, dereotu (serbest)', gr: '≈ 150 g', p: 1, k: 25, al: [A('Domates', 1), A('Sivri biber', 1), DM('Dereotu')] },
  ],
  yag: [
    { ad: '7 zeytin', gr: '≈ 20 g', p: 0.3, k: 45, al: [G('Zeytin', 20, 'kuru')] },
    { ad: '2 ceviz', gr: '≈ 10 g ceviz içi', p: 1.5, k: 60, al: [G('Ceviz içi', 10, 'kuruyemis')] },
    { ad: '10 fındık', gr: '≈ 12 g', p: 1.5, k: 65, al: [G('Fındık', 12, 'kuruyemis')] },
    { ad: '1 tatlı kaşığı tahin', gr: '≈ 7 g', p: 1.3, k: 45, al: [G('Tahin', 7, 'kuru')] },
  ],
  yulaf: [
    { ad: '3 yemek kaşığı yulaf ezmesi', gr: '≈ 25 g', p: 3.2, k: 90, al: [G('Yulaf ezmesi', 25, 'kuru')] },
    { ad: '2 yemek kaşığı yulaf ezmesi', gr: '≈ 15 g', p: 2.1, k: 60, al: [G('Yulaf ezmesi', 15, 'kuru')] },
    { ad: '1 ince dilim tam buğday ekmeği', gr: '≈ 25 g', p: 2.5, k: 63, al: [G('Tam buğday ekmeği', 25, 'firin')] },
  ],
  sut: [
    { ad: '1 kase yoğurt', gr: '≈ 200 g', p: 8, k: 120, al: [G('Yoğurt', 200, 'sut')] },
    { ad: '1 bardak kefir', gr: '≈ 200 ml', p: 7, k: 120, al: [ML('Kefir', 200)] },
    { ad: '1 büyük bardak ayran', gr: '≈ 300 ml', p: 6, k: 100, al: [ML('Ayran', 300)] },
    { ad: '1 su bardağı süt', gr: '≈ 200 ml', p: 6.5, k: 125, al: [ML('Süt', 200)] },
    { ad: '8 yemek kaşığı süzme yoğurt', gr: '≈ 160 g', p: 15, k: 190, al: [G('Süzme yoğurt', 160, 'sut')] },
    { ad: '1 büyük bardak kefir', gr: '≈ 300 ml', p: 10.5, k: 180, al: [ML('Kefir', 300)] },
  ],
  yogurtAz: [
    { ad: '3 yemek kaşığı yoğurt', gr: '≈ 60 g', p: 2, k: 36, al: [G('Yoğurt', 60, 'sut')] },
    { ad: 'Yarım bardak kefir', gr: '≈ 100 ml', p: 3.5, k: 60, al: [ML('Kefir', 100)] },
    { ad: '1 küçük ayran', gr: '≈ 200 ml', p: 3.5, k: 70, al: [ML('Ayran', 200)] },
    { ad: '8 yemek kaşığı süzme yoğurt', gr: '≈ 160 g', p: 15, k: 190, al: [G('Süzme yoğurt', 160, 'sut')] },
    { ad: '1 kase yoğurt', gr: '≈ 200 g', p: 8, k: 120, al: [G('Yoğurt', 200, 'sut')] },
  ],
  meyve: [
    { ad: '1 orta boy elma', gr: '≈ 150 g', p: 0.5, k: 72, al: [A('Elma', 1)] },
    { ad: '1 armut', gr: '≈ 150 g', p: 0.5, k: 85, al: [A('Armut', 1)] },
    { ad: '2 mandalina', gr: '≈ 150 g', p: 1, k: 70, al: [A('Mandalina', 2)] },
    { ad: '1 portakal', gr: '≈ 150 g', p: 1.2, k: 65, al: [A('Portakal', 1)] },
    { ad: '1 küçük muz', gr: '≈ 100 g', p: 1.1, k: 90, al: [A('Muz', 1)] },
    { ad: '1 küçük kase nar tanesi', gr: '≈ 100 g', p: 1, k: 70, al: [A('Nar', 0.5)] },
    { ad: '2 incir', gr: '≈ 100 g', p: 0.8, k: 75, al: [A('İncir', 2)] },
    { ad: '12 tane üzüm', gr: '≈ 80 g', p: 0.5, k: 60, al: [G('Üzüm', 80)] },
  ],
  kuruyemis: [
    { ad: '2 ceviz', gr: '≈ 10 g ceviz içi', p: 1.5, k: 60, al: [G('Ceviz içi', 10, 'kuruyemis')] },
    { ad: '10 badem', gr: '≈ 12 g', p: 2.5, k: 70, al: [G('Badem', 12, 'kuruyemis')] },
    { ad: '10 fındık', gr: '≈ 12 g', p: 1.5, k: 65, al: [G('Fındık', 12, 'kuruyemis')] },
    { ad: '1 yemek kaşığı tuzsuz kabak çekirdeği', gr: '≈ 10 g', p: 3, k: 55, al: [G('Kabak çekirdeği (tuzsuz)', 10, 'kuruyemis')] },
    { ad: '1 avuç leblebi', gr: '≈ 30 g', p: 6, k: 110, al: [G('Leblebi', 30, 'kuruyemis')] },
  ],
  protein: [
    { ad: '5 küçük ızgara köfte', gr: '≈ 125 g pişmiş; çiğ kıyma ≈ 150 g', p: 25, k: 270, al: [G('Köftelik kıyma', 150, 'kasap')] },
    { ad: '150 g tavuk sote (biberli)', gr: 'çiğ tavuk göğsü ≈ 150 g', p: 34, k: 240, al: [G('Tavuk göğsü', 150, 'kasap'), A('Sivri biber', 2)] },
    { ad: '3 derisiz baget (fırında)', gr: '≈ 180 g et; kemikli çiğ ≈ 350 g', p: 33, k: 250, al: [A('Tavuk baget', 3, 'kasap')] },
    { ad: 'Yarım tavuk göğsü, ızgara', gr: '≈ 120 g pişmiş; çiğ ≈ 160 g', p: 35, k: 190, al: [G('Tavuk göğsü', 160, 'kasap')] },
    { ad: '1 büyük porsiyon balık (levrek, çipura…)', gr: '≈ 180 g pişmiş; 400 g’lık 1 balık', p: 34, k: 260, al: [A('Balık (400 g’lık levrek, çipura ya da mevsiminde olan)', 1, 'kasap')] },
    { ad: '5 et şiş', gr: '≈ 130 g pişmiş; çiğ kuşbaşı ≈ 170 g', p: 28, k: 230, al: [G('Kuşbaşı et (yağsız)', 170, 'kasap')] },
    { ad: '3 yumurtalı menemen', gr: '1 domates ≈ 150 g', p: 19.5, k: 265, al: [Y(3), A('Domates', 1), A('Sivri biber', 2)] },
    { ad: '1 büyük kutu ton balığı, suyu süzülmüş', gr: '160 g’lık kutu', p: 26, k: 170, al: [A('Ton balığı konservesi (160 g)', 1, 'kuru')] },
    { ad: '150 g tavuk şiş', gr: 'çiğ tavuk göğsü ≈ 180 g', p: 42, k: 260, al: [G('Tavuk göğsü', 180, 'kasap')] },
    { ad: '1 kase tavuklu nohut', gr: '≈ 300 g: 100 g tavuk + 6 yemek kaşığı nohut', p: 32, k: 380, al: [G('Tavuk göğsü', 120, 'kasap'), G('Nohut (kuru ağırlık)', 50, 'kuru'), A('Domates', 1)] },
    { ad: '2 yumurtalı çılbır (süzme yoğurtla)', gr: 'süzme yoğurt ≈ 150 g, tereyağı ≈ 5 g', p: 26, k: 330, al: [Y(2), G('Süzme yoğurt', 150, 'sut')] },
    { ad: '150 g fırında somon', gr: 'çiğ fileto ≈ 170 g', p: 31, k: 310, al: [G('Somon fileto', 170, 'kasap')] },
    { ad: '150 g mantarlı et sote', gr: 'çiğ yağsız dana kuşbaşı ≈ 150 g + 150 g mantar', p: 35, k: 300, al: [G('Kuşbaşı et (yağsız)', 150, 'kasap'), G('Mantar', 150)] },
    { ad: 'Fırında hamsi ya da sardalya', gr: '≈ 150 g pişmiş; çiğ ≈ 250 g', p: 30, k: 300, al: [G('Hamsi ya da sardalya', 250, 'kasap')] },
  ],
  sebze: [
    { ad: '6 yemek kaşığı zeytinyağlı taze fasulye', gr: '≈ 150 g', p: 2.5, k: 120, al: [G('Taze fasulye', 150)] },
    { ad: '6 yemek kaşığı ıspanak yemeği', gr: '≈ 150 g; çiğ ıspanak ≈ 250 g', p: 4, k: 110, al: [G('Ispanak', 250)] },
    { ad: '6 yemek kaşığı kabak yemeği', gr: '≈ 150 g', p: 2, k: 100, al: [A('Kabak', 1)] },
    { ad: '6 yemek kaşığı fırında karışık sebze', gr: '≈ 150 g', p: 2.5, k: 120, al: [A('Kabak', 1), A('Havuç', 1), A('Sivri biber', 2)] },
    { ad: '6 yemek kaşığı zeytinyağlı pırasa', gr: '≈ 150 g', p: 2, k: 120, al: [G('Pırasa', 200)] },
    { ad: '6 yemek kaşığı brokoli ya da karnabahar', gr: '≈ 150 g', p: 3, k: 90, al: [G('Brokoli / karnabahar', 150)] },
    { ad: '6 yemek kaşığı közlenmiş patlıcan ve biber', gr: '≈ 150 g', p: 2, k: 90, al: [A('Patlıcan', 1), A('Sivri biber', 2)] },
    { ad: '6 yemek kaşığı mantar sote', gr: '≈ 150 g', p: 4, k: 90, al: [G('Mantar', 200)] },
  ],
  tahil: [
    { ad: '4 yemek kaşığı bulgur pilavı', gr: '≈ 80 g pişmiş; 30 g kuru', p: 3, k: 110, al: [G('Bulgur (pilavlık)', 30, 'kuru')] },
    { ad: '1 kase mercimek çorbası', gr: '≈ 250 ml; 30 g kuru mercimek', p: 9, k: 150, al: [G('Kırmızı mercimek', 30, 'kuru')] },
    { ad: '2 ince dilim tam buğday ekmeği', gr: '≈ 50 g', p: 5, k: 125, al: [G('Tam buğday ekmeği', 50, 'firin')] },
    { ad: '4 yemek kaşığı tam buğday makarna', gr: '≈ 80 g pişmiş; 30 g kuru', p: 4, k: 110, al: [G('Tam buğday makarna', 30, 'kuru')] },
    { ad: '4 yemek kaşığı haşlanmış nohut', gr: '≈ 70 g; 25 g kuru', p: 6, k: 115, al: [G('Nohut (kuru ağırlık)', 25, 'kuru')] },
    { ad: '1 ince dilim tam buğday ekmeği', gr: '≈ 25 g', p: 2.5, k: 63, al: [G('Tam buğday ekmeği', 25, 'firin')] },
    { ad: '5 yemek kaşığı kısır', gr: '≈ 100 g; 30 g kuru köftelik bulgur', p: 3.5, k: 160, al: [G('Köftelik bulgur', 30, 'kuru'), DM('Maydanoz'), A('Domates', 1)] },
  ],
  salata: [
    { ad: 'Mevsim salatası + 1 yemek kaşığı zeytinyağı + limon', gr: '1 kase ≈ 150 g, yağ ≈ 10 ml', p: 1.5, k: 120, al: [A('Marul', 0.25), A('Domates', 1), A('Salatalık', 1), A('Limon', 0.5)] },
    { ad: 'Çoban salatası + 1 yemek kaşığı zeytinyağı', gr: '1 kase ≈ 200 g, yağ ≈ 10 ml', p: 1.5, k: 120, al: [A('Domates', 2), A('Salatalık', 1), A('Sivri biber', 1)] },
    { ad: 'Roka-domates salatası + 1 yemek kaşığı zeytinyağı', gr: '1 kase ≈ 120 g, yağ ≈ 10 ml', p: 1, k: 110, al: [DM('Roka', 0.5), A('Domates', 1)] },
    { ad: 'Havuçlu lahana salatası + 1 yemek kaşığı zeytinyağı', gr: '1 kase ≈ 150 g, yağ ≈ 10 ml', p: 1.2, k: 115, al: [G('Beyaz lahana', 120), A('Havuç', 1)] },
  ],
  yogurtAksam: [
    { ad: '1 kase yoğurt', gr: '≈ 200 g', p: 8, k: 120, al: [G('Yoğurt', 200, 'sut')] },
    { ad: '1 kase cacık', gr: '≈ 200 g', p: 6, k: 100, al: [G('Yoğurt', 150, 'sut'), A('Salatalık', 1)] },
    { ad: '1 bardak ayran', gr: '≈ 200 ml', p: 5, k: 80, al: [ML('Ayran', 200)] },
    { ad: '1 kase süzme yoğurtla cacık', gr: '≈ 200 g', p: 14, k: 160, al: [G('Süzme yoğurt', 150, 'sut'), A('Salatalık', 1)] },
  ],
  baklagil: [
    { ad: '10 yemek kaşığı kuru fasulye yemeği', gr: '≈ 250 g; 60 g kuru fasulye', p: 15, k: 300, al: [G('Kuru fasulye', 60, 'kuru')] },
    { ad: '10 yemek kaşığı nohut yemeği', gr: '≈ 250 g; 60 g kuru nohut', p: 15, k: 310, al: [G('Nohut (kuru ağırlık)', 60, 'kuru')] },
    { ad: '10 yemek kaşığı yeşil mercimek yemeği', gr: '≈ 250 g; 60 g kuru mercimek', p: 16, k: 290, al: [G('Yeşil mercimek', 60, 'kuru')] },
    { ad: '10 yemek kaşığı zeytinyağlı barbunya', gr: '≈ 250 g; 60 g kuru barbunya', p: 14, k: 300, al: [G('Barbunya', 60, 'kuru')] },
  ],
  etliSebze: [
    { ad: '10 yemek kaşığı kıymalı taze fasulye', gr: '≈ 250 g; 50 g kıyma', p: 14, k: 230, al: [G('Kıyma (az yağlı)', 50, 'kasap'), G('Taze fasulye', 200)] },
    { ad: '10 yemek kaşığı kıymalı ıspanak', gr: '≈ 250 g; 50 g kıyma', p: 15, k: 220, al: [G('Kıyma (az yağlı)', 50, 'kasap'), G('Ispanak', 300)] },
    { ad: '10 yemek kaşığı kıymalı kabak', gr: '≈ 250 g; 50 g kıyma', p: 13, k: 215, al: [G('Kıyma (az yağlı)', 50, 'kasap'), A('Kabak', 2)] },
    { ad: '10 yemek kaşığı etli bezelye', gr: '≈ 250 g; 60 g et', p: 17, k: 260, al: [G('Kuşbaşı et (yağsız)', 60, 'kasap'), G('Bezelye (dondurulmuş olur)', 150)] },
    { ad: '10 yemek kaşığı tavuklu türlü', gr: '≈ 250 g; 80 g tavuk', p: 20, k: 230, al: [G('Tavuk göğsü', 80, 'kasap'), A('Kabak', 1), A('Patlıcan', 1), A('Domates', 1), A('Sivri biber', 1)] },
  ],
  gece: [
    { ad: '1 salatalık + 1 ceviz', gr: 'ceviz içi ≈ 5 g', p: 1, k: 45, al: [A('Salatalık', 1), G('Ceviz içi', 5, 'kuruyemis')] },
    { ad: '1 su bardağı süt', gr: '≈ 200 ml', p: 6.5, k: 125, al: [ML('Süt', 200)] },
    { ad: '1 küçük kase yoğurt', gr: '≈ 150 g', p: 5, k: 80, al: [G('Yoğurt', 150, 'sut')] },
    { ad: '5 yemek kaşığı süzme yoğurt + tarçın', gr: '≈ 100 g', p: 9, k: 115, al: [G('Süzme yoğurt', 100, 'sut')] },
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
        neden: 'Köfte ve yoğurt bol protein verir. Bulgur lifli; tabağın yarısını sebze ve salata doldurur.' },
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
      etliSebze: { ad: 'Tavuklu türlü', dk: 35, not: 'Kıymalı sebze yemeği istersen "değiştir"den seçebilirsin.', kalem: [['etliSebze', 4], ['tahil', 2], ['yogurtAksam', 3], ['salata', 0]],
        neden: 'Türlü tek tencerede bol sebze demek. Tavuk ve süzme yoğurtlu cacıkla protein 40 grama çıkar.' },
      tonSalata: { ad: 'Ton balıklı salata', dk: 5, kalem: [['protein', 7], ['salata', 0], ['tahil', 4], ['yumurta', 5]],
        neden: 'Beş dakikada akşam yemeği: ton balığı ve yumurta proteini taşır, nohut lif ekler.' },
      tavukSis: { ad: 'Tavuk şiş + közlenmiş sebze', dk: 25, not: 'Tavuğu sabahtan yoğurt, salça ve baharatla marine edersen çok yumuşak olur.', kalem: [['protein', 8], ['sebze', 6], ['tahil', 0], ['yogurtAksam', 2]],
        neden: 'Izgara tavuk yağsız ve çok proteinli; közlenmiş patlıcan ve biber lif verir, kalorisi düşük.' },
      nohutluTavuk: { ad: 'Tavuklu nohut', dk: 30, not: 'Haşlanmış kavanoz nohutla yarım saatte biter.', kalem: [['protein', 9], ['salata', 1], ['yogurtAksam', 0]],
        neden: 'Nohut hem lif hem bitkisel protein; tavukla birleşince tek tencerede tam bir akşam olur. Baklagil insülin direncine iyi gelir.' },
      cilbir: { ad: 'Çılbır akşamı', dk: 15, kalem: [['protein', 10], ['tahil', 2], ['salata', 0]],
        neden: 'Yumurta ve süzme yoğurt birlikte yaklaşık 26 gram protein; 15 dakikada hazır. Tam buğday ekmeği şekeri yavaş yükseltir.' },
      somon: { ad: 'Fırında somon + brokoli', dk: 25, kalem: [['protein', 11], ['sebze', 5], ['tahil', 0]],
        neden: 'Somon omega-3 bakımından en zengin balıklardan; PMOS’ta trigliserit ve iltihaplanmaya iyi gelir. Brokoli lif ekler.' },
      etSote: { ad: 'Mantarlı et sote', dk: 25, kalem: [['protein', 12], ['tahil', 0], ['salata', 2], ['yogurtAksam', 2]],
        neden: 'Yağsız kırmızı et demir ve B12 sağlar; haftada bir iki kez yeter. Mantar hacim katar, kaloriyi artırmaz.' },
      kisirTavuk: { ad: 'Izgara tavuk + kısır', dk: 20, kalem: [['protein', 3], ['tahil', 6], ['salata', 2], ['yogurtAksam', 2]],
        neden: 'Kısır bulgur sayesinde lifli; ızgara tavukla protein tamamlanır. Soğuk da yenir, ertesi gün çantaya da olur.' },
      tonMakarna: { ad: 'Ton balıklı makarna salatası', dk: 15, kalem: [['protein', 7], ['tahil', 3], ['salata', 0], ['yogurtAksam', 2]],
        neden: 'Tam buğday makarna beyaz makarnaya göre şekeri daha yavaş yükseltir; ton balığı pratik protein.' },
      hamsi: { ad: 'Fırında hamsi / sardalya', dk: 25, kalem: [['protein', 13], ['salata', 3], ['tahil', 2]],
        neden: 'Hamsi ve sardalya ucuz omega-3 kaynakları; kılçığıyla yenen sardalya kalsiyum da verir.' },
    },
  },
};

// Haftanın günlerine göre gösterilen seçenekler (Pazartesi = 0). İki haftalık döngü.
// Hafta içi 2, hafta sonu 3 seçenek. Balık Salı ve Cuma; baklagil haftada 2–3 kez.
export const DONGU = {
  kahvalti: [
    [['klasik', 'yulaf'], ['menemen', 'tost'], ['lorlu', 'yulaf'], ['klasik', 'tost'], ['menemen', 'yulaf'], ['simit', 'klasik', 'menemen'], ['lorlu', 'menemen', 'simit']],
    [['tost', 'klasik'], ['yulaf', 'lorlu'], ['menemen', 'klasik'], ['yulaf', 'lorlu'], ['tost', 'klasik'], ['klasik', 'menemen', 'simit'], ['simit', 'yulaf', 'lorlu']],
  ],
  ara: [
    [['meyveYogurt', 'sandvic'], ['kefir', 'badem'], ['meyveYogurt', 'durum'], ['yulafKase', 'badem'], ['meyveYogurt', 'yumurtali'], ['kefir', 'sandvic', 'badem'], ['meyveYogurt', 'yulafKase', 'durum']],
    [['badem', 'yulafKase'], ['meyveYogurt', 'sandvic'], ['kefir', 'yumurtali'], ['meyveYogurt', 'durum'], ['badem', 'sandvic'], ['meyveYogurt', 'kefir', 'yumurtali'], ['yulafKase', 'badem', 'sandvic']],
  ],
  aksam: [ // balık Salı ve Cuma; köfte 2 haftada 2 kez (kıymalı yemekler "değiştir"de)
    [['tavuk', 'mercimek'], ['balik', 'cilbir'], ['nohutluTavuk', 'baget'], ['etliSebze', 'tonSalata'], ['somon', 'tavukSis'], ['kisirTavuk', 'fasulye', 'kofte'], ['etSote', 'menemenAksam', 'tonMakarna']],
    [['tavukSis', 'fasulye'], ['hamsi', 'etliSebze'], ['mercimek', 'kisirTavuk'], ['baget', 'cilbir'], ['somon', 'tonSalata'], ['nohutluTavuk', 'tavuk', 'kofte'], ['etSote', 'fasulye', 'menemenAksam']],
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

// Haftalık denge: serbest seçimde de hafta bütününde gerekenler yensin.
// ETIKET: hangi kalem hangi gruba sayılır (grup → sıra no → etiket). Akşamlar bir günde bir kez sayılır.
export const ETIKET = {
  protein: { 0: 'kirmizi', 1: 'tavuk', 2: 'tavuk', 3: 'tavuk', 4: 'balik', 5: 'kirmizi', 6: 'yumurta', 7: 'balik', 8: 'tavuk', 9: ['tavuk', 'baklagil'], 10: 'yumurta', 11: 'balik', 12: 'kirmizi', 13: 'balik' },
  baklagil: { 0: 'baklagil', 1: 'baklagil', 2: 'baklagil', 3: 'baklagil' },
  tahil: { 1: 'baklagil' }, // mercimek çorbası
  etliSebze: { 0: 'kirmizi', 1: 'kirmizi', 2: 'kirmizi', 3: 'kirmizi', 4: 'tavuk' },
};
// min/maks: haftalık hedef (Pazartesi–Pazar). Eksik kalırsa haftanın sonuna doğru o yemek menüye kendiliğinden gelir.
export const DENGE = [
  { e: 'balik', ad: 'Balık', min: 2, metin: 'haftada 2', neden: 'Omega-3: PMOS’ta yüksek olabilen trigliseridi düşürür, iltihaplanmayı azaltır.' },
  { e: 'baklagil', ad: 'Baklagil', min: 2, metin: 'haftada 2–3', neden: 'Lif, magnezyum ve folat: insülin direncine en iyi gelen besin grubu.' },
  { e: 'kirmizi', ad: 'Kırmızı et', min: 1, maks: 2, metin: 'haftada 1–2', neden: 'Demir, B12 ve çinkonun en kolay emilen kaynağı; fazlası gerekmez.' },
  { e: 'tavuk', ad: 'Tavuk', bilgi: true, neden: 'Yağsız protein; her gün olabilir ama balık ve baklagilin yerini tutmaz.' },
];
// Vitamin ve mineraller nereden geliyor (notlar bölümünde)
export const BESIN_KAYNAK = [
  { b: 'Kalsiyum', t: 'Her gün peynir, yoğurt, süzme yoğurt, ayran ya da kefir (günde 3 porsiyon süt ürünü menüde var).' },
  { b: 'Demir', t: 'Haftada 1–2 kırmızı et, baklagil, ıspanak, kabak çekirdeği. Yanına limon ya da biber (C vitamini) emilimi artırır.' },
  { b: 'B12', t: 'Yumurta, süt ürünleri, et, tavuk, balık: menüde her gün var.' },
  { b: 'Omega-3', t: 'Haftada 2 balık (somon, hamsi, sardalya en zengini) ve ceviz.' },
  { b: 'D vitamini', t: 'Balık ve yumurtada biraz var ama yemekle yetmez; güneş ve gerekirse kan değerine göre takviye.' },
  { b: 'Lif', t: 'Bulgur, baklagil, tam buğday ve çavdar ekmeği, sebze, meyve. Günde 25 gramı geçmek kan şekerini dengeler.' },
  { b: 'Folat ve magnezyum', t: 'Baklagil, yeşil yapraklılar (ıspanak, roka, maydanoz), kuruyemiş, tam tahıl.' },
  { b: 'C vitamini', t: 'Meyve, biber, domates, limonlu salata: her gün.' },
  { b: 'İyot', t: 'İyotlu tuz, süt ürünleri, yumurta, balık.' },
];
