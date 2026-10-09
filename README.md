# Harga Dolar, Emas & Saham

Aplikasi web untuk memantau:

- **Kurs USD/IDR** (gratis)
- **Harga Emas** Logam Mulia Indonesia (gratis)
- **Saham IDX** via **Invezgo API** (butuh API Key)

## Cara Pakai

### 1. Dapatkan API Key Invezgo (gratis)

1. Buka [https://invezgo.com](https://invezgo.com) dan daftar / login
2. Pilih paket (ada trial / free tier)
3. Masuk ke **Settings → API** → buat API Key
4. Salin key-nya

### 2. Jalankan Aplikasi

- Buka `index.html` di browser, **atau**
- Aktifkan GitHub Pages:
  1. Repo → Settings → Pages
  2. Source: branch `main`, folder `/ (root)`
  3. Akses: `https://amosmarbun86-droid.github.io/harga-dolar-emas-saham/`

### 3. Masukkan API Key

Di halaman aplikasi, tempel API Key Invezgo → klik **Simpan**.  
Key disimpan di `localStorage` browser (tidak dikirim ke server manapun selain Invezgo).

## Endpoint yang dipakai

| Data | Sumber |
|------|--------|
| USD/IDR | [currency-api](https://github.com/fawazahmed0/currency-api) |
| Emas | [logam-mulia-api](https://github.com/iamutaki/logam-mulia-api) |
| Saham | Invezgo `GET /analysis/intraday-data/{code}?market=RG` & batch |

## Saham yang ditampilkan

BBCA, BBRI, BMRI, TLKM, ASII, GOTO

## Catatan

- Jangan commit API Key ke repository publik.
- Jika muncul error 401 → key salah / belum aktif.
- Error 402 → paket belum cukup / trial habis.
- Error 429 → rate limit, tunggu sebentar.

## Lisensi

MIT
