-- ==============================================================================
-- DOKUMEN DATA DUMMY SISTEM INFORMASI KASKOS (Sesuai database.md)
-- Panduan: Salin dan jalankan seluruh query ini di SQL Editor pada Supabase Dashboard.
-- Script ini menggunakan ON CONFLICT DO NOTHING agar aman dijalankan berulang kali.
-- ==============================================================================

-- 1. DATA TABEL `users`
-- Berisi 1 Pengelola Kos dan 5 Akun Penghuni
INSERT INTO users (id, nama_lengkap, email, password, role, no_telepon, created_at)
VALUES 
    -- Pengelola / Pemilik Kos
    ('a1111111-1111-1111-1111-111111111111', 'Bapak Kos (Pengelola)', 'admin@kos.com', 'rahasiaadmin', 'Pengelola', '081234567890', NOW() - INTERVAL '60 days'),
    -- Penghuni 1
    ('a2222222-2222-2222-2222-222222222221', 'Jovan Razan', 'jovan@mail.com', 'password123', 'Penghuni', '081211112222', NOW() - INTERVAL '50 days'),
    -- Penghuni 2
    ('a2222222-2222-2222-2222-222222222222', 'Admaja Bahari', 'admaja@mail.com', 'password123', 'Penghuni', '081233334444', NOW() - INTERVAL '45 days'),
    -- Penghuni 3
    ('a2222222-2222-2222-2222-222222222223', 'Meilan Ulfia', 'meilan@mail.com', 'password123', 'Penghuni', '081255556666', NOW() - INTERVAL '40 days'),
    -- Penghuni 4
    ('a2222222-2222-2222-2222-222222222224', 'Muhammad Ikhlasul', 'ikhlasul@mail.com', 'password123', 'Penghuni', '081277778888', NOW() - INTERVAL '30 days'),
    -- Penghuni 5
    ('a2222222-2222-2222-2222-222222222225', 'Rafky Ferdiansyah', 'rafky@mail.com', 'password123', 'Penghuni', '081299990000', NOW() - INTERVAL '20 days')
ON CONFLICT (id) DO NOTHING;


-- 2. DATA TABEL `kamar`
-- Berisi daftar kamar kos dengan nomor, tarif, dan status keterisian
INSERT INTO kamar (id, nomor_kamar, tarif_bulanan, status_kamar, created_at)
VALUES 
    ('b1111111-1111-1111-1111-111111111101', '101', 850000, 'Terisi', NOW() - INTERVAL '60 days'),
    ('b1111111-1111-1111-1111-111111111102', '102', 850000, 'Terisi', NOW() - INTERVAL '60 days'),
    ('b1111111-1111-1111-1111-111111111103', '103', 900000, 'Terisi', NOW() - INTERVAL '60 days'),
    ('b1111111-1111-1111-1111-111111111104', '104', 900000, 'Terisi', NOW() - INTERVAL '60 days'),
    ('b1111111-1111-1111-1111-111111111105', '105', 1000000, 'Terisi', NOW() - INTERVAL '60 days'),
    ('b1111111-1111-1111-1111-111111111106', '201', 1200000, 'Tersedia', NOW() - INTERVAL '60 days'),
    ('b1111111-1111-1111-1111-111111111107', '202', 1200000, 'Tersedia', NOW() - INTERVAL '60 days'),
    ('b1111111-1111-1111-1111-111111111108', '203', 1000000, 'Tersedia', NOW() - INTERVAL '60 days')
ON CONFLICT (id) DO NOTHING;


-- 3. DATA TABEL `penghuni`
-- Menghubungkan user penghuni dengan kamar yang disewanya
INSERT INTO penghuni (id, user_id, kamar_id, tanggal_masuk, status_aktif, created_at)
VALUES 
    ('c1111111-1111-1111-1111-111111111101', 'a2222222-2222-2222-2222-222222222221', 'b1111111-1111-1111-1111-111111111101', '2026-10-01', true, NOW() - INTERVAL '50 days'),
    ('c1111111-1111-1111-1111-111111111102', 'a2222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111102', '2026-10-05', true, NOW() - INTERVAL '45 days'),
    ('c1111111-1111-1111-1111-111111111103', 'a2222222-2222-2222-2222-222222222223', 'b1111111-1111-1111-1111-111111111103', '2026-10-10', true, NOW() - INTERVAL '40 days'),
    ('c1111111-1111-1111-1111-111111111104', 'a2222222-2222-2222-2222-222222222224', 'b1111111-1111-1111-1111-111111111104', '2026-10-15', true, NOW() - INTERVAL '30 days'),
    ('c1111111-1111-1111-1111-111111111105', 'a2222222-2222-2222-2222-222222222225', 'b1111111-1111-1111-1111-111111111105', '2026-11-01', true, NOW() - INTERVAL '20 days')
ON CONFLICT (id) DO NOTHING;


-- 4. DATA TABEL `tagihan`
-- Berisi berbagai variasi status tagihan:
-- • Lunas (bulan lalu & bulan berjalan yang sudah terbayar)
-- • Belum Bayar
-- • Menunggu Verifikasi Manual
-- • Terlambat / Kena Denda
INSERT INTO tagihan (id, penghuni_id, bulan_tagihan, tahun_tagihan, nominal_dasar, nominal_denda, total_tagihan, tanggal_jatuh_tempo, status_tagihan, created_at)
VALUES 
    -- 1. Tagihan Jovan (Kamar 101) - Bulan Lalu Lunas
    ('d1111111-1111-1111-1111-111111111101', 'c1111111-1111-1111-1111-111111111101', 10, 2026, 850000, 0, 850000, '2026-10-10', 'lunas', '2026-10-01 08:00:00+00'),
    
    -- 2. Tagihan Jovan (Kamar 101) - Bulan Ini Lunas Otomatis via OCR
    ('d1111111-1111-1111-1111-111111111102', 'c1111111-1111-1111-1111-111111111101', 11, 2026, 850000, 0, 850000, '2026-11-10', 'lunas', '2026-11-01 08:00:00+00'),
    
    -- 3. Tagihan Admaja (Kamar 102) - Bulan Ini Menunggu Verifikasi Manual (OCR Meragukan)
    ('d1111111-1111-1111-1111-111111111103', 'c1111111-1111-1111-1111-111111111102', 11, 2026, 850000, 0, 850000, '2026-11-10', 'menunggu_verifikasi', '2026-11-01 08:00:00+00'),
    
    -- 4. Tagihan Meilan (Kamar 103) - Bulan Ini Belum Bayar (Mendekati Jatuh Tempo)
    ('d1111111-1111-1111-1111-111111111104', 'c1111111-1111-1111-1111-111111111103', 11, 2026, 900000, 0, 900000, '2026-11-25', 'belum_bayar', '2026-11-01 08:00:00+00'),
    
    -- 5. Tagihan Ikhlasul (Kamar 104) - Terlambat Bayar + Denda 50.000
    ('d1111111-1111-1111-1111-111111111105', 'c1111111-1111-1111-1111-111111111104', 11, 2026, 900000, 50000, 950000, '2026-11-10', 'belum_bayar', '2026-11-01 08:00:00+00'),
    
    -- 6. Tagihan Rafky (Kamar 105) - Bulan Ini Disetujui Verifikasi Manual
    ('d1111111-1111-1111-1111-111111111106', 'c1111111-1111-1111-1111-111111111105', 11, 2026, 1000000, 0, 1000000, '2026-11-10', 'lunas', '2026-11-01 08:00:00+00'),

    -- 7. Tagihan Jovan (Kamar 101) - Bulan Depan (Desember) Terbit Awal
    ('d1111111-1111-1111-1111-111111111107', 'c1111111-1111-1111-1111-111111111101', 12, 2026, 850000, 0, 850000, '2026-12-10', 'belum_bayar', '2026-11-20 08:00:00+00')
ON CONFLICT (id) DO NOTHING;


-- 5. DATA TABEL `pembayaran`
-- Mencatat pengunggahan bukti transfer, hasil pembacaan OCR, dan status verifikasi
INSERT INTO pembayaran (id, tagihan_id, tanggal_upload, url_bukti_transfer, ocr_nominal_terbaca, ocr_tanggal_terbaca, status_verifikasi, ocr_nama_pengirim)
VALUES 
    -- Pembayaran 1: Tagihan Jovan 10/2026 (Lunas)
    ('e1111111-1111-1111-1111-111111111101', 'd1111111-1111-1111-1111-111111111101', '2026-10-04 14:20:00+00', 'https://placehold.co/600x800/1e293b/ffffff.png?text=Bukti+Transfer+Jovan+Okt', 850000, '2026-10-04', 'valid_otomatis', 'JOVAN RAZAN'),

    -- Pembayaran 2: Tagihan Jovan 11/2026 (Valid Otomatis via OCR karena nominal cocok)
    ('e1111111-1111-1111-1111-111111111102', 'd1111111-1111-1111-1111-111111111102', '2026-11-05 10:15:00+00', 'https://placehold.co/600x800/1e293b/ffffff.png?text=Bukti+Transfer+Jovan+Nov', 850000, '2026-11-05', 'valid_otomatis', 'JOVAN RAZAN P'),

    -- Pembayaran 3: Tagihan Admaja 11/2026 (Butuh Pengecekan Manual, OCR membaca nominal kurang jelas / transfer split)
    ('e1111111-1111-1111-1111-111111111103', 'd1111111-1111-1111-1111-111111111103', '2026-11-08 16:30:00+00', 'https://placehold.co/600x800/1e293b/ffffff.png?text=Bukti+Transfer+Admaja+Nov', 800000, '2026-11-08', 'butuh_pengecekan_manual', 'ADMAJA BAHARI'),

    -- Pembayaran 4: Tagihan Rafky 11/2026 (Disetujui Manual oleh Pengelola)
    ('e1111111-1111-1111-1111-111111111104', 'd1111111-1111-1111-1111-111111111106', '2026-11-07 11:00:00+00', 'https://placehold.co/600x800/1e293b/ffffff.png?text=Bukti+Transfer+Rafky+Nov', 1000000, '2026-11-07', 'valid_manual', 'RAFKY F')
ON CONFLICT (id) DO NOTHING;


-- 6. DATA TABEL `arus_kas`
-- Mencatat seluruh pemasukan (dari tagihan lunas) dan pengeluaran operasional kos
INSERT INTO arus_kas (id, jenis, nominal, tanggal_transaksi, keterangan, pembayaran_id, created_at)
VALUES 
    -- Pemasukan Sewa Kos
    ('f1111111-1111-1111-1111-111111111101', 'pemasukan', 850000, '2026-10-04', 'Pembayaran sewa kos Jovan Razan (10/2026) - OCR Otomatis', 'e1111111-1111-1111-1111-111111111101', '2026-10-04 14:21:00+00'),
    ('f1111111-1111-1111-1111-111111111102', 'pemasukan', 850000, '2026-11-05', 'Pembayaran sewa kos Jovan Razan (11/2026) - OCR Otomatis', 'e1111111-1111-1111-1111-111111111102', '2026-11-05 10:16:00+00'),
    ('f1111111-1111-1111-1111-111111111103', 'pemasukan', 1000000, '2026-11-07', 'Pembayaran sewa kos Rafky Ferdiansyah (11/2026) - Verifikasi Manual', 'e1111111-1111-1111-1111-111111111104', '2026-11-07 11:30:00+00'),

    -- Pengeluaran Operasional Kos
    ('f1111111-1111-1111-1111-111111111104', 'pengeluaran', 350000, '2026-10-15', 'Pembayaran langganan WiFi Indihome Kos (Oktober 2026)', NULL, '2026-10-15 09:00:00+00'),
    ('f1111111-1111-1111-1111-111111111105', 'pengeluaran', 200000, '2026-10-25', 'Jasa kebersihan area bersama dan angkut sampah bulanan', NULL, '2026-10-25 10:00:00+00'),
    ('f1111111-1111-1111-1111-111111111106', 'pengeluaran', 350000, '2026-11-12', 'Pembayaran langganan WiFi Indihome Kos (November 2026)', NULL, '2026-11-12 09:30:00+00'),
    ('f1111111-1111-1111-1111-111111111107', 'pengeluaran', 120000, '2026-11-18', 'Perbaikan keran air dan penggantian lampu lorong lantai 1', NULL, '2026-11-18 15:00:00+00')
ON CONFLICT (id) DO NOTHING;


-- 7. DATA TABEL `notifikasi`
-- Notifikasi otomatis untuk penghuni mengenai tagihan, jatuh tempo, dan status pembayaran
INSERT INTO notifikasi (id, user_id, judul, pesan, tipe, dibaca, created_at)
VALUES 
    -- Notifikasi untuk Jovan
    ('71111111-1111-1111-1111-111111111101', 'a2222222-2222-2222-2222-222222222221', 'Tagihan Kos Periode 11/2026', 'Tagihan kos periode 11/2026 sebesar Rp 850.000 telah diterbitkan. Batas pembayaran tanggal 2026-11-10.', 'tagihan_baru', true, '2026-11-01 08:05:00+00'),
    ('71111111-1111-1111-1111-111111111102', 'a2222222-2222-2222-2222-222222222221', 'Pembayaran Terverifikasi Otomatis', 'Bukti transfer tagihan 11/2026 sebesar Rp 850.000 telah berhasil diverifikasi otomatis oleh OCR.', 'pembayaran_lunas', true, '2026-11-05 10:16:00+00'),

    -- Notifikasi untuk Admaja
    ('71111111-1111-1111-1111-111111111103', 'a2222222-2222-2222-2222-222222222222', 'Bukti Transfer Sedang Diverifikasi', 'Bukti transfer Anda telah diterima dan sedang menunggu verifikasi manual dari pengelola.', 'menunggu_verifikasi', false, '2026-11-08 16:31:00+00'),

    -- Notifikasi untuk Meilan (Pengingat Jatuh Tempo)
    ('71111111-1111-1111-1111-111111111104', 'a2222222-2222-2222-2222-222222222223', 'Pengingat Batas Pembayaran', 'Tagihan kos bulan 11/2026 sebesar Rp 900.000 akan jatuh tempo pada 2026-11-25. Segera lakukan pembayaran.', 'pengingat_jatuh_tempo', false, '2026-11-20 09:00:00+00'),

    -- Notifikasi untuk Ikhlasul (Keterlambatan)
    ('71111111-1111-1111-1111-111111111105', 'a2222222-2222-2222-2222-222222222224', 'Tagihan Terlambat & Dikenakan Denda', 'Tagihan kos Anda telah melewati jatuh tempo (2026-11-10) dan dikenakan denda Rp 50.000. Total tagihan menjadi Rp 950.000.', 'tagihan_terlambat', false, '2026-11-11 08:00:00+00'),

    -- Notifikasi untuk Rafky
    ('71111111-1111-1111-1111-111111111106', 'a2222222-2222-2222-2222-222222222225', 'Pembayaran Disetujui', 'Pembayaran tagihan periode 11/2026 telah disetujui pengelola kos.', 'verifikasi_manual', true, '2026-11-07 11:31:00+00')
ON CONFLICT (id) DO NOTHING;
