# Yumak'la 8 Hafta

Tek dambılla evde yapılan 8 haftalık antrenman programı. Koç: Yumak (tombul, kaplumbağa kabuğu desenli bir kedi). Hareketleri Tarçın gösteriyor.

Site: https://bicer-latifcan.github.io/claudeAntrenmanProgram/

## Neler var

- 8 haftalık takvim. Bir güne tıklayınca ısınma, hareketler, set takibi ve "nasıl yapılır" videoları açılır.
- Yumak sayfada yaşar:
  - dolaşır, takvim günlerine zıplayıp o günü anlatır
  - tıklayınca kaçar, basılı tutup sürükleyince enseden sallanır
  - mama, su ve kum kabı ister
- İlerleme bu tarayıcıda saklanır. Başka cihaza taşımak için "Başlangıç" penceresindeki yedek kodu kullanılır.

## Programı değiştirmek

Bütün plan tek dosyada durur: `js/program.js`.

- `TAKVIM`: günler
- `ANTRENMANLAR`: set ve tekrar sayıları
- `HAREKETLER`: açıklamalar
- `VIDEOLAR`: YouTube videoları

## Dosyalar

- `js/pixel.js`: piksel çizim motoru
- `js/yumak-art.js`: Yumak'ın pozları
- `js/pet.js`: Yumak'ın davranışları
- `js/tarcin.js`: hareketleri gösteren kaslı kedi ve animasyonları
- `js/app.js`: takvim, gün ayrıntısı, ilerleme

Kurulum ya da derleme adımı yok. Klasörü herhangi bir statik sunucuda açmak yeterli.

