# KasKos — Sistem Informasi Pengelolaan Kas dan Tagihan Kos

**KasKos** adalah sistem informasi berbasis web untuk mengelola data kamar, penghuni, tagihan bulanan, verifikasi pembayaran, dan laporan arus kas kos secara terpusat, akurat, dan transparan. Sistem ini terintegrasi dengan **Verifikasi OCR (Optical Character Recognition)** untuk membaca bukti transfer secara otomatis serta **Asisten Virtual berbasis AI** menggunakan Google Gemini API.

---

## 👥 Tim Pelaksana Proyek (Kelompok 4)

| No | Nama | NIM | Peran |
|----|------|-----|-------|
| 1 | Jovan Razan Praditya | 20240140230 | Project Manager |
| 2 | Muhammad Ikhlasul | 20240140234 | System Analyst |
| 3 | Admaja Bahari | 20230140052 | UI/UX Designer |
| 4 | Tara Dwi Mahendra | 20240140144 | Backend Developer |
| 5 | Meilan Ulfia Nurfari`ah | 20240140129 | Frontend Developer |
| 6 | Zaky Ibnu Sofyan | 20240140206 | AI Integration Engineer |
| 7 | Rafky Ferdiansyah | 20240140247 | Quality Assurance / Tester |

---

## ✨ Fitur Utama

### 1. Modul Penghuni
- **Login & Hak Akses**: Penghuni hanya dapat mengakses data tagihan, pembayaran, notifikasi, dan profil miliknya sendiri.
- **Dashboard Ringkasan**: Menampilkan tagihan bulan ini, tanggal jatuh tempo, status pembayaran, nomor kamar, serta **banner pengingat jatuh tempo otomatis** (mendekati tempo atau terlambat).
- **Tagihan Bulan Ini & Bulan Depan**: Rincian tarif dasar, denda, total tagihan, dan status pembayaran.
- **Upload Bukti Transfer & Verifikasi OCR AI**: Mengunggah foto bukti transfer; sistem membaca nominal, tanggal, dan nama pengirim secara otomatis:
  - Jika nominal cocok dengan total tagihan ➔ status otomatis **Lunas (`valid_otomatis`)** dan tercatat di arus kas.
  - Jika hasil pembacaan meragukan/tidak cocok ➔ diteruskan ke antrean **Pengecekan Manual** oleh pengelola.
- **Riwayat Pembayaran**: Daftar seluruh pembayaran beserta hasil ekstraksi OCR, status verifikasi, dan pratinjau foto bukti transfer.
- **Asisten Virtual AI**: Menjawab pertanyaan berdasarkan data sistem menggunakan 8 opsi terstruktur.
- **Profil Penghuni**: Melihat informasi kamar dan memperbarui data profil (nama, nomor telepon, dan password).

### 2. Modul Pengelola
- **Dashboard Ringkasan**: Ringkasan saldo kas, total pemasukan, total pengeluaran, jumlah tagihan menunggak, rasio kamar terisi, dan tagihan bulan berjalan.
- **Manajemen Kamar**: Tambah, edit (nomor kamar, tarif bulanan, status), dan hapus kamar.
- **Data Penghuni**: Daftarkan akun penghuni baru sekaligus penempatan kamar, edit data penghuni (termasuk pindah kamar yang otomatis menyinkronkan status kamar), serta aktif/nonaktifkan penghuni.
- **Manajemen Tagihan**: Terbitkan tagihan bulanan (nominal dasar otomatis terisi sesuai tarif kamar + pengaturan denda & jatuh tempo), serta edit/hapus tagihan.
- **Verifikasi Pembayaran**: Meninjau foto bukti transfer dan hasil bacaan OCR penghuni, lalu menyetujui atau menolak pembayaran secara manual.
- **Laporan Arus Kas**: Ringkasan pemasukan, pengeluaran, dan saldo akhir, serta pencatatan, edit, dan penghapusan transaksi arus kas operasional.
- **Asisten Virtual AI Pengelola**: Akses penuh ke seluruh 8 opsi termasuk **Rangkuman kas bulanan** dan **Daftar penghuni yang menunggak**.

### 3. Asisten Virtual AI (8 Opsi Terstruktur)
Pengguna memilih salah satu dari 8 opsi yang tersedia (tanpa input pertanyaan bebas):
1. Cek tagihan bulan ini dan bulan depan
2. Cek tanggal jatuh tempo
3. Cek status pembayaran
4. Riwayat pembayaran
5. Cara upload bukti transfer *(panduan)*
6. Rangkuman kas bulanan *(khusus pengelola)*
7. Daftar penghuni yang menunggak *(khusus pengelola)*
8. Cara menggunakan fitur aplikasi lainnya *(panduan)*

### 4. Keamanan Sistem
- Autentikasi menggunakan **JSON Web Token (JWT)** dengan pembagian hak akses berbasis role (`Pengelola` & `Penghuni`).
- Pendaftaran publik (`register`) dinonaktifkan agar tidak ada pihak luar yang membuat akun pengelola secara ilegal. Akun penghuni didaftarkan langsung oleh pengelola melalui dashboard.

---

## 🛠️ Teknologi yang Digunakan

- **Backend**: Node.js, Express.js v5, `jsonwebtoken`, `multer`, `cors`, `dotenv`
- **Database & Storage**: Supabase (`@supabase/supabase-js` — PostgreSQL & Storage Bucket `bukti-transfer`)
- **AI & OCR**: Google Gemini API (`@google/generative-ai`)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (disajikan secara statis melalui Express atau langsung melalui browser)

---

## 📁 Struktur Proyek

```text
KasKos/
├── backend-kosan/
│   ├── src/
│   │   ├── config/
│   │   │   └── supabase.js           # Konfigurasi klien Supabase
│   │   ├── controllers/
│   │   │   ├── aiController.js       # Logika 8 opsi Asisten Virtual AI
│   │   │   ├── authController.js     # Login & proteksi registrasi
│   │   │   ├── kamarController.js    # CRUD kamar
│   │   │   ├── kasController.js      # Laporan & CRUD arus kas
│   │   │   ├── notifikasiController.js
│   │   │   ├── pembayaranController.js # Upload bukti, OCR Gemini, verifikasi manual
│   │   │   ├── penghuniController.js # CRUD penghuni & profil mandiri
│   │   │   └── tagihanController.js  # CRUD tagihan & pengingat jatuh tempo
│   │   ├── middleware/
│   │   │   └── authMiddleware.js     # Verifikasi JWT & cek role pengelola
│   │   ├── routes/                   # Definisi endpoint API
│   │   └── app.js                    # Entry point server Express
│   ├── .env                          # Variabel environment (tidak di-commit)
│   └── package.json
├── frontend-kosan/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── auth.js                   # Logika login & penyimpanan token
│   │   ├── dashboard.js              # Logika SPA Dashboard Pengelola
│   │   ├── dashboard-penghuni.js     # Logika SPA Dashboard Penghuni
│   │   └── ui.js                     # Utilitas ikon, toast, dan helper UI
│   ├── index.html                    # Halaman Login
│   ├── register.html                 # Halaman info penutupan registrasi publik
│   ├── dashboard-pengelola.html      # Halaman Dashboard Pengelola
│   └── dashboard-penghuni.html       # Halaman Dashboard Penghuni
├── database.md                       # Dokumentasi skema tabel Supabase
├── DataDummy.sql                     # Query SQL pengisian data dummy
├── kos.md                            # Dokumen spesifikasi & ruang lingkup proyek
└── README.md
```

---

## 🚀 Cara Instalasi & Menjalankan

### 1. Prasyarat
- **Node.js** (v18+ direkomendasikan)
- Proyek **Supabase** dengan tabel sesuai [database.md](database.md) (`users`, `kamar`, `penghuni`, `tagihan`, `pembayaran`, `arus_kas`, `notifikasi`) serta Storage Bucket bernama `bukti-transfer`
- **Gemini API Key** dari Google AI Studio

### 2. Instalasi Dependensi Backend
```bash
cd backend-kosan
npm install
```

### 3. Konfigurasi Environment (`.env`)
Buat atau sesuaikan file `backend-kosan/.env` dengan konfigurasi berikut:
```env
PORT=5000
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_service_or_secret_key
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key
```

### 4. Mengisi Data Dummy (Opsional)
Salin isi file [DataDummy.sql](DataDummy.sql) dan jalankan di **SQL Editor** pada dashboard Supabase Anda untuk mengisi data awal (kamar, pengelola, penghuni, tagihan, pembayaran, arus kas, dan notifikasi).

### 5. Menjalankan Server
```bash
cd backend-kosan
npm start
```
Untuk mode pengembangan dengan auto-reload:
```bash
npm run dev
```

Setelah server berjalan, buka browser dan akses:
- **Aplikasi Web**: `http://localhost:5000`
- **Cek Status API**: `http://localhost:5000/api/test`

### Kredensial Demo (Jika Menggunakan `DataDummy.sql`)
- **Pengelola**: `admin@kos.com` / `rahasiaadmin`
- **Penghuni**: `jovan@mail.com` / `password123` (atau `admaja@mail.com`, `meilan@mail.com`, `ikhlasul@mail.com`, `rafky@mail.com`)

---

## 📡 Ringkasan Endpoint API

| Modul | Method & Endpoint | Akses | Keterangan |
|-------|-------------------|-------|------------|
| **Auth** | `POST /api/auth/login` | Publik | Login dan menghasilkan token JWT |
| **Kamar** | `GET /api/kamar` | Publik | Daftar kamar (mendukung filter `?status=`) |
| **Kamar** | `POST /api/kamar`, `PUT /api/kamar/:id`, `DELETE /api/kamar/:id` | Pengelola | Tambah, edit, dan hapus kamar |
| **Penghuni** | `GET /api/penghuni/me`, `PUT /api/penghuni/me` | Penghuni | Lihat & edit profil diri |
| **Penghuni** | `GET /api/penghuni`, `POST /api/penghuni/register`, `PUT /api/penghuni/:id`, `PUT /api/penghuni/:id/status` | Pengelola | Kelola data & status penghuni |
| **Tagihan** | `GET /api/tagihan` | Auth | Tagihan (Pengelola: semua, Penghuni: milik sendiri) |
| **Tagihan** | `POST /api/tagihan`, `PUT /api/tagihan/:id`, `DELETE /api/tagihan/:id` | Pengelola | Buat, edit, dan hapus tagihan |
| **Pembayaran** | `GET /api/pembayaran` | Auth | Riwayat pembayaran & status verifikasi |
| **Pembayaran** | `POST /api/pembayaran/upload` | Auth | Upload foto bukti transfer + verifikasi OCR |
| **Pembayaran** | `PUT /api/pembayaran/verifikasi/:id` | Pengelola | Setujui / tolak pembayaran secara manual |
| **Arus Kas** | `GET /api/kas`, `POST /api/kas`, `PUT /api/kas/:id`, `DELETE /api/kas/:id` | Pengelola | Laporan & pengelolaan transaksi kas |
| **Asisten AI** | `POST /api/ai/ask` | Auth | Tanya asisten virtual berdasarkan `optionId` (1–8) |
| **Notifikasi** | `GET /api/notifikasi`, `PUT /api/notifikasi/:id/baca` | Auth | Daftar notifikasi & tandai sudah dibaca |
