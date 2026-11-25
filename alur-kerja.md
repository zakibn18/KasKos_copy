# Alur Kerja Sistem Informasi KasKos
### Sistem Informasi Pengelolaan Kas dan Tagihan Kos Terintegrasi Asisten AI dan Verifikasi OCR

Dokumen ini menjelaskan alur kerja (*business process flow*), arsitektur alur data, interaksi antar komponen, dan siklus hidup data pada aplikasi **KasKos**.

---

## 📑 Daftar Isi
1. [Gambaran Umum Arsitektur](#1-gambaran-umum-arsitektur)
2. [Matriks Peran dan Hak Akses](#2-matriks-peran-dan-hak-akses)
3. [Alur Otentikasi dan Keamanan Akun](#3-alur-otentikasi-dan-keamanan-akun)
4. [Alur Manajemen Kamar dan Penghuni](#4-alur-manajemen-kamar-dan-penghuni)
5. [Alur Siklus Tagihan dan Pengingat Jatuh Tempo](#5-alur-siklus-tagihan-dan-pengingat-jatuh-tempo)
6. [Alur Verifikasi Pembayaran OCR Cerdas (Core Flow)](#6-alur-verifikasi-pembayaran-ocr-cerdas-core-flow)
7. [Alur Verifikasi Manual oleh Pengelola](#7-alur-verifikasi-manual-oleh-pengelola)
8. [Alur Laporan Arus Kas Operasional](#8-alur-laporan-arus-kas-operasional)
9. [Alur Asisten Virtual Berbasis AI (8 Opsi)](#9-alur-asisten-virtual-berbasis-ai-8-opsi)

---

## 1. Gambaran Umum Arsitektur

Aplikasi KasKos dibangun menggunakan arsitektur **Client-Server RESTful**:

```mermaid
flowchart TD
    subgraph Client["Frontend (Browser)"]
        UI_Admin["Dashboard Pengelola (dashboard-pengelola.html)"]
        UI_User["Dashboard Penghuni (dashboard-penghuni.html)"]
        UI_Login["Halaman Login (index.html)"]
    end

    subgraph Server["Backend API (Node.js & Express)"]
        AuthMid["Auth Middleware (JWT Verify & Role Guard)"]
        Controllers["Controllers (Tagihan, Pembayaran, Kas, Kamar, Penghuni, AI)"]
    end

    subgraph External["Layanan Cloud & Database"]
        SupaDB[("Supabase PostgreSQL (Database)")]
        SupaStorage["Supabase Storage Bucket (bukti-transfer)"]
        GeminiAI["Google Gemini API (OCR Vision & Generative AI)"]
    end

    UI_Login -->|"Kirim Kredensial"| AuthMid
    UI_Admin -->|"Request API + JWT"| AuthMid
    UI_User -->|"Request API + JWT"| AuthMid
    AuthMid --> Controllers

    Controllers -->|"Query CRUD & Relasi"| SupaDB
    Controllers -->|"Upload File Foto Bukti"| SupaStorage
    Controllers -->|"Analisis Bukti & Prompt Chat"| GeminiAI
```

---

## 2. Matriks Peran dan Hak Akses

Sistem membedakan dua hak akses (*role*) utama:

| Modul / Fitur | Pengelola / Pemilik Kos | Penghuni Kos |
| :--- | :---: | :---: |
| **Login ke Sistem** | Ya | Ya |
| **Pendaftaran Akun Baru** | Mendaftarkan Penghuni Baru | Tidak (Dibuatkan oleh Pengelola) |
| **Dashboard Utama** | Saldo Kas, Total Penunggak, Status Kamar | Ringkasan Tagihan, Batas Tempo, Status Kamar |
| **Manajemen Kamar (CRUD)** | Penuh (Tambah, Edit, Hapus) | Tidak Ada |
| **Manajemen Penghuni** | Penuh (Pindah Kamar, Edit, Nonaktifkan) | Edit Profil Mandiri (Nama, HP, Password) |
| **Penerbitan & Edit Tagihan** | Penuh (Buat, Edit, Hapus) | Tidak Ada |
| **Melihat Tagihan** | Seluruh Tagihan Semua Penghuni | Hanya Tagihan Milik Sendiri |
| **Upload Bukti Bayar (OCR)** | Tidak (Hanya Meninjau) | Ya (Untuk Tagihan Milik Sendiri) |
| **Verifikasi Manual Pembayaran** | Ya (Setujui / Tolak Bukti) | Tidak Ada |
| **Laporan Arus Kas (CRUD)** | Penuh (Catat, Edit, Hapus Pemasukan/Pengeluaran) | Tidak Ada |
| **Asisten AI (Opsi 1-5, 8)** | Ya (Data Global) | Ya (Data Pribadi) |
| **Asisten AI (Opsi 6 & 7)** | Ya (Kas & Daftar Penunggak) | Ditolak (403 Forbidden) |

---

## 3. Alur Otentikasi dan Keamanan Akun

Untuk mencegah pembuatan akun ilegal oleh pihak luar, registrasi publik dinonaktifkan.

```mermaid
sequenceDiagram
    autonumber
    actor User as Pengguna (Pengelola / Penghuni)
    participant Front as Frontend (index.html)
    participant Back as Backend (/api/auth/login)
    participant DB as Supabase (Tabel users)

    User->>Front: Input Email dan Password
    Front->>Back: POST /api/auth/login {email, password}
    Back->>DB: Query user berdasarkan email
    DB-->>Back: Data user (id, password, role)
    
    alt Password Salah / User Tidak Ditemukan
        Back-->>Front: 401 Unauthorized ("Email atau password salah")
        Front-->>User: Tampilkan pesan error
    else Kredensial Valid
        Back->>Back: Generate JWT Token (payload: id, email, role)
        Back-->>Front: 200 OK {token, user}
        Front->>Front: Simpan token & userKos ke localStorage
        alt Role == Pengelola / Pemilik
            Front-->>User: Redirect ke dashboard-pengelola.html
        else Role == Penghuni
            Front-->>User: Redirect ke dashboard-penghuni.html
        end
    end
```

---

## 4. Alur Manajemen Kamar dan Penghuni

Pendaftaran penghuni langsung mengaitkan akun dengan kamar yang berstatus **Tersedia**:

```mermaid
flowchart TD
    Start["Pengelola Buka Menu Data Penghuni"] --> Form["Klik + Daftarkan Penghuni"]
    Form --> Input["Isi Nama, Email, Password, HP, & Pilih Kamar Tersedia"]
    Input --> Submit["Kirim POST /api/penghuni/register"]
    
    Submit --> Step1["1. Buat record di tabel users (role: Penghuni)"]
    Step1 --> Step2["2. Buat record di tabel penghuni (user_id, kamar_id, status_aktif: true)"]
    Step2 --> Step3["3. Update status kamar di tabel kamar menjadi 'Terisi'"]
    Step3 --> Finish["Selesai: Penghuni langsung aktif & dapat login"]

    subgraph EditPenghuni["Fitur Edit / Pindah Kamar"]
        OpenEdit["Pengelola Edit Data Penghuni"] --> ChangeRoom{"Pindah Kamar?"}
        ChangeRoom -- "Ya" --> RoomOld["Kamar Lama: Ubah status jadi 'Tersedia'"]
        RoomOld --> RoomNew["Kamar Baru: Ubah status jadi 'Terisi'"]
        RoomNew --> SaveP["Simpan perubahan data penghuni"]
        ChangeRoom -- "Tidak" --> SaveP
    end
```

---

## 5. Alur Siklus Tagihan dan Pengingat Jatuh Tempo

```mermaid
stateDiagram-v2
    [*] --> belum_bayar : Tagihan Diterbitkan Pengelola
    
    belum_bayar --> menunggu_verifikasi : Penghuni Upload Bukti (Nominal Meragukan)
    belum_bayar --> lunas : Penghuni Upload Bukti (Nominal OCR Cocok)
    
    menunggu_verifikasi --> lunas : Disetujui Pengelola
    menunggu_verifikasi --> ditolak : Ditolak Pengelola
    
    ditolak --> menunggu_verifikasi : Penghuni Upload Ulang Bukti
    ditolak --> lunas : Penghuni Upload Ulang (OCR Cocok)
    
    lunas --> [*]
```

### Mekanisme Pengingat Jatuh Tempo Otomatis:
Setiap kali penghuni membuka dashboard, sistem menghitung selisih hari antara hari ini dan `tanggal_jatuh_tempo`:
- **Terlambat (`diffDays < 0`)**: Muncul banner merah tanda keterlambatan pembayaran dan denda.
- **Hari H (`diffDays == 0`)**: Muncul peringatan bahwa hari ini adalah batas akhir pembayaran.
- **Mendekati Tempo (`0 < diffDays <= 3`)**: Muncul banner kuning pengingat batas pembayaran.

---

## 6. Alur Verifikasi Pembayaran OCR Cerdas (Core Flow)

Alur verifikasi bukti transfer otomatis menggunakan Google Gemini Vision:

```mermaid
sequenceDiagram
    autonumber
    actor Penghuni as Penghuni Kos
    participant Front as Dashboard Penghuni
    participant Back as Backend (/api/pembayaran/upload)
    participant Storage as Supabase Storage (bukti-transfer)
    participant Gemini as Gemini Vision API
    participant DB as Supabase DB (pembayaran, tagihan, arus_kas, notifikasi)

    Penghuni->>Front: Pilih Tagihan Belum Lunas & Unggah Foto Bukti Transfer
    Front->>Back: POST FormData (tagihan_id, file gambar) + Bearer Token
    Back->>Storage: Upload file foto (bukti-[timestamp].[ext])
    Storage-->>Back: Public URL foto bukti transfer
    
    Back->>Gemini: Kirim Buffer Gambar + Prompt Ekstraksi OCR
    Note over Gemini: Membaca nominal, tanggal transfer,<br/>dan nama pengirim dalam JSON murni
    Gemini-->>Back: {nominal: 850000, tanggal: "2026-11-25", nama_pengirim: "..."}
    
    Back->>Back: Cocokkan nominal terbaca vs total_tagihan
    
    alt Nominal Cocok Persis (Valid Otomatis)
        Back->>DB: 1. Simpan pembayaran (status: valid_otomatis)
        Back->>DB: 2. Update tagihan (status: lunas)
        Back->>DB: 3. Insert arus_kas (jenis: pemasukan)
        Back->>DB: 4. Buat notifikasi lunas untuk penghuni
        Back-->>Front: 201 OK {is_valid_otomatis: true, message: "Lunas Otomatis"}
        Front-->>Penghuni: Tampilkan hasil ekstraksi OCR & badge LUNAS
    else Nominal Tidak Cocok / Gambar Buram
        Back->>DB: 1. Simpan pembayaran (status: butuh_pengecekan_manual)
        Back->>DB: 2. Update tagihan (status: menunggu_verifikasi)
        Back->>DB: 3. Buat notifikasi menunggu verifikasi
        Back-->>Front: 201 OK {is_valid_otomatis: false, message: "Menunggu Verifikasi Manual"}
        Front-->>Penghuni: Tampilkan peringatan bahwa bukti diteruskan ke pengelola
    end
```

---

## 7. Alur Verifikasi Manual oleh Pengelola

Untuk pembayaran yang statusnya `butuh_pengecekan_manual` atau `menunggu_verifikasi`:

```mermaid
flowchart TD
    A["Pengelola Buka Menu 'Verifikasi Pembayaran'"] --> B["Sistem Menampilkan Tabel Pembayaran Masuk"]
    B --> C["Pengelola Klik 'Lihat Bukti' (Modal Gambar)"]
    C --> D{"Keputusan Pengelola"}
    
    D -- "Persetujuan" --> E["Klik Tombol 'Setujui'"]
    E --> E1["Update status_verifikasi = 'valid_manual'"]
    E1 --> E2["Update status_tagihan = 'lunas'"]
    E2 --> E3["Otomatis Insert ke arus_kas (Pemasukan)"]
    E3 --> E4["Kirim Notifikasi Pembayaran Disetujui ke Penghuni"]
    
    D -- "Penolakan" --> F["Klik Tombol 'Tolak' + Isi Catatan Alasan"]
    F --> F1["Update status_verifikasi = 'ditolak'"]
    F1 --> F2["Update status_tagihan = 'ditolak'"]
    F2 --> F3["Kirim Notifikasi Pembayaran Ditolak ke Penghuni"]
```

---

## 8. Alur Laporan Arus Kas Operasional

Sistem arus kas memastikan transparansi keuangan kos:

```mermaid
flowchart LR
    subgraph SumberPemasukan["Pemasukan (Kredit)"]
        OCR_In["Verifikasi OCR Otomatis"] --> KasTable[("Tabel arus_kas")]
        Manual_In["Verifikasi Manual Pengelola"] --> KasTable
        Direct_In["Pemasukan Lain (Manual Pengelola)"] --> KasTable
    end

    subgraph SumberPengeluaran["Pengeluaran (Debit)"]
        Op1["Listrik & Token Air"] --> KasTable
        Op2["Biaya Internet / WiFi"] --> KasTable
        Op3["Kebersihan & Sampah"] --> KasTable
        Op4["Perbaikan & Maintenance"] --> KasTable
    end

    KasTable --> Calc["Kalkulasi Real-Time di Backend"]
    Calc --> Out1["Total Pemasukan"]
    Calc --> Out2["Total Pengeluaran"]
    Calc --> Out3["Saldo Akhir Kas (Pemasukan - Pengeluaran)"]
```

---

## 9. Alur Asisten Virtual Berbasis AI (8 Opsi)

Sesuai ruang lingkup, pengguna tidak mengetik bebas, melainkan memilih salah satu dari 8 opsi yang telah diprogram:

```mermaid
sequenceDiagram
    autonumber
    actor User as Pengguna (Penghuni / Pengelola)
    participant Front as Frontend (Tab Asisten AI)
    participant Back as Backend (/api/ai/ask)
    participant DB as Supabase DB
    participant Gemini as Gemini AI (Generative Language)

    User->>Front: Klik salah satu dari 8 tombol opsi pertanyaan
    Front->>Back: POST /api/ai/ask {optionId: 1..8} + Bearer Token
    
    Back->>Back: Validasi role pengguna
    alt Opsi 6 atau 7 Dipilih oleh Penghuni
        Back-->>Front: 403 Forbidden ("Fitur khusus pengelola kos")
        Front-->>User: Tampilkan pesan akses ditolak
    else Opsi Diizinkan
        Back->>DB: Query data kontekstual sesuai opsi & hak akses pengguna
        DB-->>Back: Hasil data JSON (tagihan, kas, atau tunggakan)
        
        Back->>Gemini: Kirim Prompt Sistem + Data JSON Terbaru
        Note over Gemini: AI merumuskan jawaban ringkas, akurat,<br/>dan ramah dalam Bahasa Indonesia
        Gemini-->>Back: Teks jawaban natural bahasa Indonesia
        
        Back-->>Front: 200 OK {pertanyaan, jawaban}
        Front-->>User: Render jawaban di response bubble chat box
    end
```

### Rincian Data Kontekstual per Opsi:
1. **Opsi 1 (Cek tagihan bulan ini dan depan)**: Mengambil data tagihan periode berjalan dan bulan berikutnya.
2. **Opsi 2 (Cek tanggal jatuh tempo)**: Memfilter tagihan yang berstatus belum lunas beserta tanggal jatuh tempo.
3. **Opsi 3 (Cek status pembayaran)**: Mengambil seluruh status tagihan (`lunas`, `menunggu_verifikasi`, `belum_bayar`).
4. **Opsi 4 (Riwayat pembayaran)**: Mengambil log pembayaran terdahulu dari tabel `pembayaran`.
5. **Opsi 5 (Cara upload bukti transfer)**: Memberikan panduan langkah demi langkah penggunaan fitur OCR.
6. **Opsi 6 (Rangkuman kas bulanan)**: *(Khusus Pengelola)* Mengambil total saldo, pemasukan, pengeluaran, dan 10 transaksi kas terakhir.
7. **Opsi 7 (Daftar penghuni yang menunggak)**: *(Khusus Pengelola)* Mengambil daftar nama penghuni, nomor kamar, nominal, dan batas tempo tagihan yang belum lunas.
8. **Opsi 8 (Cara menggunakan fitur lainnya)**: Memberikan panduan penggunaan menu-menu dashboard sesuai role masing-masing.
