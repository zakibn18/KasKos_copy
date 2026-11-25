Sistem Informasi Pengelolaan Kas dan
Tagihan Kos Terintegrasi Asisten AI dan Verifikasi OCR
ANGGOTA KELOMPOK 4 :
Jovan Razan Praditya 20240140230
Muhammad Ikhlasul 20240140234
Admaja Bahari 20230140052
Tara Dwi Mahendra 20240140144
Meilan Ulfia Nurfari`ah 20240140129
Zaky Ibnu Sofyan 20240140206
Rafky Ferdiansyah 20240140247

1. LATAR BELAKANG
Usaha kos-kosan merupakan salah satu usaha yang banyak dijalankan secara mandiri dengan
pengelolaan sederhana. Pada praktiknya, pencatatan tagihan bulanan, status pembayaran, dan
kas masih banyak dilakukan secara manual, baik melalui buku catatan, aplikasi lembar kerja,
maupun pesan singkat. Cara ini rentan menimbulkan kesalahan pencatatan, keterlambatan
penagihan, tunggakan yang terlewat, dan laporan kas yang kurang transparan.
Pembayaran oleh penghuni umumnya dilakukan melalui transfer, kemudian bukti transfer
dikirim kepada pengelola melalui aplikasi pesan. Pengelola harus memeriksa nominal dan
tanggal pada setiap bukti secara manual, lalu mencocokkannya dengan catatan tagihan. Proses
ini memakan waktu dan berpotensi menimbulkan kesalahan, terutama ketika jumlah penghuni
bertambah. Di sisi lain, penghuni sering harus bertanya langsung kepada pengelola untuk
mengetahui jumlah tagihan, tanggal jatuh tempo, atau status pembayarannya.
Berdasarkan permasalahan tersebut, diperlukan sistem informasi berbasis web yang mengelola
data penghuni, tagihan, pembayaran, dan laporan kas secara terpusat. Untuk meningkatkan
kemudahan penggunaan, sistem ini diintegrasikan dengan asisten virtual berbasis kecerdasan
buatan (AI) yang menyusun jawaban atas pertanyaan yang sering diajukan dari data pada
sistem, serta teknologi Optical Character Recognition (OCR) untuk membaca bukti transfer
secara otomatis dan mencocokkannya dengan tagihan.
Proyek ini termasuk proyek teknologi informasi karena bersifat sementara, memiliki batas
waktu, dan menghasilkan produk yang unik. Pengembangannya melibatkan integrasi beberapa
komponen (database, aplikasi web, dan layanan AI) serta keterbatasan sumber daya berupa
waktu, anggaran, dan keahlian tim. Karena itu, proyek ini memerlukan perencanaan yang
terstruktur agar dapat berjalan sesuai rencana.
2. TUJUAN PROYEK
Tujuan Umum
Merancang sistem informasi berbasis web yang membantu pengelola kos mengelola tagihan
dan kas secara terpusat, akurat, dan transparan, serta memudahkan penghuni memperoleh
informasi tagihan dan pembayaran.
Tujuan Khusus
1. Menyediakan pengelolaan data penghuni, kamar, tagihan bulanan, dan status
pembayaran dalam satu sistem terpusat.
2. Menyediakan pengingat jatuh tempo pembayaran secara otomatis kepada penghuni.
3. Menyediakan laporan kas berisi pemasukan dan pengeluaran yang dapat diakses
pengelola kapan saja.

4. Menyediakan asisten virtual berbasis AI yang menjawab pertanyaan penghuni dan
pengelola melalui pilihan pertanyaan yang telah ditentukan.
5. Menyediakan verifikasi bukti transfer otomatis menggunakan OCR untuk mengurangi
pemeriksaan manual dan risiko salah catat.
6. Menerapkan pembagian hak akses agar penghuni hanya dapat melihat data miliknya
sendiri, sedangkan pengelola dapat melihat seluruh data.
3. RUANG LINGKUP (SCOPE)
A. Lingkup yang Dikerjakan (In Scope)
1. Platform: sistem berbasis web, dengan tahap yang dikerjakan adalah perancangan
sistem.
2. Pengguna: pengelola/pemilik kos dan penghuni kos.
3. Modul untuk penghuni:
• Login
• Dashboard (ringkasan tagihan, jatuh tempo, dan status bayar)
• Tagihan bulan ini dan bulan depan
• Upload bukti transfer dengan verifikasi OCR
• Riwayat pembayaran
• Asisten virtual
• Profil
4. Modul untuk pengelola:
• Dashboard (ringkasan kas, jumlah penunggak, dan tagihan bulan berjalan)
• Pengelolaan data penghuni dan kamar
• Pengelolaan tagihan (pembuatan tagihan bulanan, pengaturan tarif dan denda)
• Verifikasi pembayaran (termasuk pengecekan manual)
• Laporan kas (pemasukan, pengeluaran, dan rangkuman bulanan)
• Asisten virtual dengan opsi khusus pengelola
5. Pengingat jatuh tempo: notifikasi otomatis berdasarkan tanggal jatuh tempo tagihan.
6. Asisten virtual berbasis AI: pengguna tidak mengetik pertanyaan, tetapi memilih dari
8 opsi berikut:
1. Cek tagihan bulan ini dan bulan depan
2. Cek tanggal jatuh tempo
3. Cek status pembayaran
4. Riwayat pembayaran

5. Cara upload bukti transfer
6. Rangkuman kas bulanan (khusus pengelola)
7. Daftar penghuni yang menunggak (khusus pengelola)
8. Cara menggunakan fitur aplikasi lainnya
Alur kerjanya : Pengguna memilih opsi, sistem mengambil data dari database sesuai
hak akses, layanan AI (misalnya Gemini API) menyusun jawaban dalam bahasa natural,
kemudian jawaban ditampilkan.
- Opsi 5 dan 8 berupa panduan penggunaan.
7. Verifikasi bukti transfer dengan OCR: penghuni mengunggah foto bukti transfer,
sistem membaca nominal, tanggal, dan nama pengirim, lalu mencocokkannya dengan
tagihan. Apabila hasil pembacaan meragukan, bukti diarahkan ke pengecekan manual
oleh pengelola.
8. Hak akses: penghuni hanya dapat melihat data miliknya sendiri, sedangkan pengelola
dapat melihat seluruh data.
B. Di Luar Lingkup (Out of Scope)
1. Pembayaran online otomatis (payment gateway).
2. Aplikasi mobile (Android/iOS).
3. Pelatihan model AI dari nol; sistem hanya memanfaatkan layanan AI yang sudah
tersedia.
4. Input pertanyaan bebas (mengetik) pada asisten virtual.
5. Pertanyaan di luar 8 opsi yang ditentukan.
6. Pengelolaan aspek lain di luar tagihan dan kas, seperti kontrak sewa, perawatan kamar,
dan inventaris.

4.  STRUKTUR ORGANISASI PROYEK
Pihak yang Terlibat (Stakeholder)
•  Pemilik/pengelola kos sebagai klien
Penghuni kos sebagai pengguna akhir
Tim Pelaksana Proyek
| No  | Nama  | Peran  |     | Tanggung Jawab  |
| --- | ----- | ------ | --- | --------------- |
1  Jovan Razan Praditya  Project Manager  Mengatur perencanaan, jadwal,
koordinasi tim, dan komunikasi dengan
stakeholder
2  Muhammad Ikhlasul  System Analyst  Menganalisis kebutuhan pengguna dan
menyusun spesifikasi sistem
3  Admaja Bahari  UI/UX Designer  Merancang tampilan dan alur pengalaman
pengguna
4  Tara Dwi Mahendra  Backend  Merancang database, logika sistem, dan
|                  |     | Developer  | hak akses                    |     |
| ---------------- | --- | ---------- | ---------------------------- | --- |
| 5  Meilan Ulfia  |     | Frontend   | Membangun antarmuka halaman  |     |
| Nurfari`ah       |     | Developer  | penghuni dan pengelola       |     |
6  Zaky Ibnu Sofyan  AI Integration  Mengintegrasikan asisten virtual dan
|     |     | Engineer  | OCR dengan layanan AI  |     |
| --- | --- | --------- | ---------------------- | --- |
7  Rafky Ferdiansyah  Quality  Menguji fungsi sistem dan memastikan
|     |     | Assurance/Tester  | kualitas hasil  |     |
| --- | --- | ----------------- | --------------- | --- |