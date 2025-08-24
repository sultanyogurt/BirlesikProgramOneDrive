# Birleşik Program — OneDrive Senkronlu (JSON/SQLite)

**Fark:** Bu sürüm veriyi `OneDrive/BirlesikProgramData` klasöründeki `db.json` ve `db.sqlite3` dosyalarına yazar.
Böylece A bilgisayarında kaydettiğin veriler, OneDrive senkronize olduğunda B bilgisayarında **aynı** görünür.

## Nasıl kullanılır?
- `Build-Portable-EXE.bat` ile portable .exe üret (Node 18+ gerekir).
- Üretilen `.exe` dosyası çalıştırıldığında:
  - Önce şu yolları dener: `ONE DRIVE` klasörü → yoksa `Belgeler\BirlesikProgramData`
  - Orada `db.json` ve `db.sqlite3` oluşturur ve veriyi yazar.

## HTML tarafında kayıt/içerik güncelleme
HTML/JS içinde şu API'yi kullanabilirsin:
```js
// liste
window.birlesikAPI.list().then(rows => console.log(rows));

// ekle
window.birlesikAPI.add({ tip: 'satis', tutar: 123, aciklama: 'örn' });

// güncelle
window.birlesikAPI.update({ id: '...' , tutar: 999 });

// sil
window.birlesikAPI.remove('...');

// sistem yolları
window.birlesikAPI.sysPaths().then(console.log);
```
Mevcut formlarından veri oluşturup `add(...)` ile yazarsan OneDrive klasörüne dosya düşer.

## config.json ile konum değiştirme
`.exe` ile aynı klasöre `config.json` koyup özel klasör belirleyebilirsin:
```json
{ "dataDir": "D:/Kasalar/BirlesikProgramData" }
```

## Neden bu, tarayıcı sürümünden farklı?
Tarayıcıda `localStorage/IndexedDB` sadece **o makinede** kalır. Electron ile dosyaya yazabildiğimiz için OneDrive/Dropbox
klasörüne kayıt düşürür, böylece tüm cihazlarda görünür.

## Sorun giderme
- B cihazında veri gecikmeli görünürse OneDrive senkronizasyon simgesini kontrol et.
- Aynı dosyayı iki cihaz aynı anda yazarsa çakışma dosyaları oluşabilir; çoğu zaman OneDrive çözer.
