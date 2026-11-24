## Table `users`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `nama_lengkap` | `varchar` |  |
| `email` | `varchar` |  Unique |
| `password` | `varchar` |  |
| `role` | `varchar` |  |
| `no_telepon` | `varchar` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `kamar`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `nomor_kamar` | `varchar` |  Unique |
| `tarif_bulanan` | `numeric` |  |
| `status_kamar` | `varchar` |  |
| `created_at` | `timestamptz` |  Nullable |

## Table `penghuni`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` |  Nullable |
| `kamar_id` | `uuid` |  Nullable |
| `tanggal_masuk` | `date` |  |
| `status_aktif` | `bool` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `tagihan`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `penghuni_id` | `uuid` |  Nullable |
| `bulan_tagihan` | `int4` |  |
| `tahun_tagihan` | `int4` |  |
| `nominal_dasar` | `numeric` |  |
| `nominal_denda` | `numeric` |  Nullable |
| `total_tagihan` | `numeric` |  |
| `tanggal_jatuh_tempo` | `date` |  Nullable |
| `status_tagihan` | `varchar` |  |
| `created_at` | `timestamptz` |  Nullable |

## Table `pembayaran`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `tagihan_id` | `uuid` |  Nullable |
| `tanggal_upload` | `timestamptz` |  Nullable |
| `url_bukti_transfer` | `text` |  |
| `ocr_nominal_terbaca` | `numeric` |  Nullable |
| `ocr_tanggal_terbaca` | `date` |  Nullable |
| `status_verifikasi` | `varchar` |  |
| `ocr_nama_pengirim` | `varchar` |  Nullable |

## Table `arus_kas`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `jenis` | `varchar` |  |
| `nominal` | `numeric` |  |
| `tanggal_transaksi` | `date` |  |
| `keterangan` | `text` |  Nullable |
| `pembayaran_id` | `uuid` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `notifikasi`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` |  Nullable |
| `judul` | `varchar` |  |
| `pesan` | `text` |  |
| `tipe` | `varchar` |  |
| `dibaca` | `bool` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

