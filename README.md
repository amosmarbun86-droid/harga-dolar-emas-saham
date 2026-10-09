# Harga Dolar, Emas & Saham

Aplikasi web sederhana untuk memantau:

- **Kurs USD/IDR** (Dolar Amerika terhadap Rupiah)
- **Harga Emas** (Logam Mulia / Antam di Indonesia)
- **Saham Populer IDX** (BBCA, BBRI, BMRI, TLKM, ASII, GOTO)

## Fitur

- Tampilan modern & responsif (mobile-friendly)
- Tombol **Perbarui Data** manual
- Auto-refresh setiap 5 menit
- Sumber data dari API publik gratis (tanpa API key)

## Cara Menjalankan

### Lokal
Cukup buka file `index.html` di browser, atau pakai live server:

```bash
npx serve .
```

### GitHub Pages
1. Buka repository ini di GitHub
2. Settings → Pages
3. Source: Deploy from branch `main` / folder `/ (root)`
4. Simpan, lalu akses `https://amosmarbun86-droid.github.io/harga-dolar-emas-saham/`

## Sumber Data

| Data | Sumber |
|------|--------|
| Kurs USD/IDR | [currency-api](https://github.com/fawazahmed0/currency-api) (jsDelivr) |
| Harga Emas | [logam-mulia-api](https://github.com/iamutaki/logam-mulia-api) |
| Saham IDX | Yahoo Finance (unofficial chart endpoint) |

> **Catatan**: Data saham dari Yahoo Finance kadang terblokir CORS di browser atau rate-limit. Untuk produksi disarankan pakai API berbayar (Invezgo, Alpha Vantage, dll).

## Struktur File

```
├── index.html   # Halaman utama
├── style.css    # Styling
├── app.js       # Logic fetch & tampilan
└── README.md
```

## Lisensi

MIT – silakan dipakai & dimodifikasi bebas.
