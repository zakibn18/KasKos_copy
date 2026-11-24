-- 1. Tabel users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_lengkap VARCHAR NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    password VARCHAR NOT NULL,
    role VARCHAR NOT NULL,
    no_telepon VARCHAR,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabel kamar
CREATE TABLE kamar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomor_kamar VARCHAR UNIQUE NOT NULL,
    tarif_bulanan NUMERIC NOT NULL,
    status_kamar VARCHAR NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabel penghuni
CREATE TABLE penghuni (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    kamar_id UUID REFERENCES kamar(id) ON DELETE SET NULL,
    tanggal_masuk DATE NOT NULL,
    status_aktif BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabel tagihan
CREATE TABLE tagihan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    penghuni_id UUID REFERENCES penghuni(id) ON DELETE CASCADE,
    bulan_tagihan INT4 NOT NULL,
    tahun_tagihan INT4 NOT NULL,
    nominal_dasar NUMERIC NOT NULL,
    nominal_denda NUMERIC DEFAULT 0,
    total_tagihan NUMERIC NOT NULL,
    tanggal_jatuh_tempo DATE,
    status_tagihan VARCHAR NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Tabel pembayaran
CREATE TABLE pembayaran (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tagihan_id UUID REFERENCES tagihan(id) ON DELETE CASCADE,
    tanggal_upload TIMESTAMPTZ DEFAULT now(),
    url_bukti_transfer TEXT NOT NULL,
    ocr_nominal_terbaca NUMERIC,
    ocr_tanggal_terbaca DATE,
    status_verifikasi VARCHAR NOT NULL
);

-- 6. Tabel arus_kas
CREATE TABLE arus_kas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jenis VARCHAR NOT NULL,
    nominal NUMERIC NOT NULL,
    tanggal_transaksi DATE NOT NULL,
    keterangan TEXT,
    pembayaran_id UUID REFERENCES pembayaran(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Tabel notifikasi
CREATE TABLE notifikasi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    judul VARCHAR NOT NULL,
    pesan TEXT NOT NULL,
    tipe VARCHAR NOT NULL,
    dibaca BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);