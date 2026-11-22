const supabase = require('../config/supabase');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function parseReceiptWithAI(imagePart) {
  const modelsToTry = ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];
  const prompt = `Kamu adalah sistem OCR khusus pembaca bukti transfer bank dan e-wallet di Indonesia.
Tolong ekstrak informasi dari gambar bukti transfer ini dan kembalikan HANYA format JSON murni tanpa kutip markdown atau blok kode:
{
  "nominal": number atau null,
  "tanggal": "YYYY-MM-DD" atau null,
  "nama_pengirim": string atau null
}
Catatan:
- "nominal" harus angka bulat murni tanpa titik atau koma (contoh: 800000, 1500000). Jika tidak terbaca dengan jelas, isi null.
- "tanggal" gunakan format YYYY-MM-DD. Jika tidak terbaca, isi null.
- "nama_pengirim" nama pengirim yang tertera pada bukti transfer, isi null jika tidak ada.`;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent([prompt, imagePart]);
      const text = result.response.text().replace(/```json|```/gi, '').trim();
      return JSON.parse(text);
    } catch (err) {
      console.warn(`Gagal OCR dengan model ${modelName}:`, err.message);
    }
  }
  return { nominal: null, tanggal: null, nama_pengirim: null };
}

exports.uploadBuktiBayar = async (req, res) => {
  try {
    const { tagihan_id } = req.body;
    const file = req.file;
    if (!tagihan_id) return res.status(400).json({ message: 'ID tagihan wajib disertakan.' });
    if (!file) return res.status(400).json({ message: 'File foto bukti transfer wajib diunggah.' });

    // 1. Ambil detail tagihan & relasi penghuni
    const { data: tagihan, error: tagihanErr } = await supabase
      .from('tagihan')
      .select('*, penghuni(id, user_id, users(nama_lengkap))')
      .eq('id', tagihan_id)
      .single();

    if (tagihanErr || !tagihan) {
      return res.status(404).json({ message: 'Tagihan tidak ditemukan dalam sistem.' });
    }

    // 2. Upload file ke Supabase Storage (fallback ke data URL jika bucket belum dibuat)
    let url_bukti_transfer = '';
    const fileExt = file.originalname.split('.').pop() || 'jpg';
    const fileName = `bukti-${Date.now()}-${Math.round(Math.random() * 1e5)}.${fileExt}`;

    try {
      const { error: uploadErr } = await supabase.storage
        .from('bukti-transfer')
        .upload(fileName, file.buffer, { contentType: file.mimetype, upsert: true });

      if (!uploadErr) {
        const { data: publicUrlData } = supabase.storage.from('bukti-transfer').getPublicUrl(fileName);
        url_bukti_transfer = publicUrlData?.publicUrl || '';
      }
    } catch (storageErr) {
      console.warn('Storage upload warning:', storageErr.message);
    }

    // Jika bucket storage tidak tersedia, simpan base64 data URI sebagai fallback agar bukti tetap bisa dilihat
    if (!url_bukti_transfer) {
      url_bukti_transfer = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    }

    // 3. Ekstraksi OCR via Gemini Vision
    const imagePart = {
      inlineData: {
        data: file.buffer.toString('base64'),
        mimeType: file.mimetype
      }
    };

    let ocrResult = { nominal: null, tanggal: null, nama_pengirim: null };
    try {
      ocrResult = await parseReceiptWithAI(imagePart);
    } catch (e) {
      console.error('OCR parsing error:', e);
    }

    // 4. Pencocokan nominal OCR dengan total_tagihan
    const tagihanTotal = Number(tagihan.total_tagihan);
    const nominalTerbaca = ocrResult.nominal ? Number(ocrResult.nominal) : null;
    const isMatch = nominalTerbaca !== null && nominalTerbaca === tagihanTotal;

    const status_verifikasi = isMatch ? 'valid_otomatis' : 'butuh_pengecekan_manual';
    const status_tagihan = isMatch ? 'lunas' : 'menunggu_verifikasi';

    // 5. Simpan ke tabel pembayaran
    const { data: pembayaran, error: payErr } = await supabase
      .from('pembayaran')
      .insert([{
        tagihan_id,
        url_bukti_transfer,
        ocr_nominal_terbaca: nominalTerbaca,
        ocr_tanggal_terbaca: ocrResult.tanggal || null,
        ocr_nama_pengirim: ocrResult.nama_pengirim || null,
        status_verifikasi
      }])
      .select()
      .single();

    if (payErr) return res.status(500).json({ error: payErr.message });

    // 6. Update status_tagihan
    await supabase.from('tagihan').update({ status_tagihan }).eq('id', tagihan_id);

    const namaPenghuni = tagihan.penghuni?.users?.nama_lengkap || 'Penghuni';

    // 7. Jika valid otomatis, catat ke arus_kas & kirim notifikasi
    if (isMatch) {
      await supabase.from('arus_kas').insert([{
        jenis: 'pemasukan',
        nominal: tagihanTotal,
        tanggal_transaksi: new Date().toISOString().split('T')[0],
        keterangan: `Pembayaran kos ${namaPenghuni} (${tagihan.bulan_tagihan}/${tagihan.tahun_tagihan}) - OCR Otomatis`,
        pembayaran_id: pembayaran.id
      }]);

      if (tagihan.penghuni?.user_id) {
        await supabase.from('notifikasi').insert([{
          user_id: tagihan.penghuni.user_id,
          judul: 'Pembayaran Terverifikasi Otomatis',
          pesan: `Bukti transfer tagihan ${tagihan.bulan_tagihan}/${tagihan.tahun_tagihan} sebesar Rp ${tagihanTotal.toLocaleString('id-ID')} telah berhasil diverifikasi otomatis oleh OCR.`,
          tipe: 'pembayaran_lunas'
        }]);
      }
    } else {
      // Jika butuh pengecekan manual
      if (tagihan.penghuni?.user_id) {
        await supabase.from('notifikasi').insert([{
          user_id: tagihan.penghuni.user_id,
          judul: 'Bukti Transfer Sedang Diverifikasi',
          pesan: `Bukti transfer Anda telah diterima dan sedang menunggu verifikasi manual dari pengelola.`,
          tipe: 'menunggu_verifikasi'
        }]);
      }
    }

    res.status(201).json({
      status: 'success',
      is_valid_otomatis: isMatch,
      message: isMatch
        ? `Pembayaran berhasil diverifikasi otomatis oleh OCR! Nominal Rp ${tagihanTotal.toLocaleString('id-ID')} sesuai.`
        : `Bukti berhasil diunggah. Nominal terbaca (${nominalTerbaca ? 'Rp ' + nominalTerbaca.toLocaleString('id-ID') : 'tidak terbaca jelas'}) belum cocok otomatis, diteruskan ke verifikasi manual pengelola.`,
      ocr_data: {
        nominal_terbaca: nominalTerbaca,
        nominal_tagihan: tagihanTotal,
        tanggal: ocrResult.tanggal,
        nama_pengirim: ocrResult.nama_pengirim
      },
      pembayaran
    });
  } catch (err) {
    console.error('Upload pembayaran error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Pengelola: Verifikasi Manual Pembayaran
exports.verifikasiManual = async (req, res) => {
  try {
    const { id } = req.params;
    const { status_verifikasi, catatan_admin } = req.body; // 'disetujui' atau 'ditolak'

    const { data: bayar, error } = await supabase
      .from('pembayaran')
      .select('*, tagihan(*, penghuni(user_id, users(nama_lengkap)))')
      .eq('id', id)
      .single();

    if (error || !bayar) return res.status(404).json({ message: 'Data pembayaran tidak ditemukan' });

    const isApproved = status_verifikasi === 'disetujui';

    await supabase.from('pembayaran').update({
      status_verifikasi: isApproved ? 'valid_manual' : 'ditolak'
    }).eq('id', id);

    await supabase.from('tagihan').update({
      status_tagihan: isApproved ? 'lunas' : 'ditolak'
    }).eq('id', bayar.tagihan_id);

    const namaPenghuni = bayar.tagihan?.penghuni?.users?.nama_lengkap || 'Penghuni';

    if (isApproved) {
      await supabase.from('arus_kas').insert([{
        jenis: 'pemasukan',
        nominal: Number(bayar.tagihan.total_tagihan),
        tanggal_transaksi: new Date().toISOString().split('T')[0],
        keterangan: `Pembayaran kos ${namaPenghuni} (${bayar.tagihan.bulan_tagihan}/${bayar.tagihan.tahun_tagihan}) - Verifikasi Manual Disetujui`,
        pembayaran_id: bayar.id
      }]);
    }

    if (bayar.tagihan?.penghuni?.user_id) {
      await supabase.from('notifikasi').insert([{
        user_id: bayar.tagihan.penghuni.user_id,
        judul: isApproved ? 'Pembayaran Disetujui' : 'Pembayaran Ditolak',
        pesan: isApproved
          ? `Pembayaran tagihan periode ${bayar.tagihan.bulan_tagihan}/${bayar.tagihan.tahun_tagihan} telah disetujui pengelola kos.`
          : `Bukti transfer tagihan ${bayar.tagihan.bulan_tagihan}/${bayar.tagihan.tahun_tagihan} ditolak pengelola.${catatan_admin ? ' Catatan: ' + catatan_admin : ' Silakan unggah bukti transfer yang valid.'}`,
        tipe: 'verifikasi_manual'
      }]);
    }

    res.json({
      status: 'success',
      message: `Pembayaran berhasil ${isApproved ? 'disetujui dan ditandai lunas' : 'ditolak'}!`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Riwayat Pembayaran (Pengelola melihat semua, Penghuni hanya miliknya)
exports.getRiwayatPembayaran = async (req, res) => {
  try {
    const userRole = (req.user?.role || '').toLowerCase();
    const isPengelola = ['pengelola', 'pemilik', 'admin'].includes(userRole);

    const { data, error } = await supabase
      .from('pembayaran')
      .select(`
        *,
        tagihan (
          id,
          bulan_tagihan,
          tahun_tagihan,
          nominal_dasar,
          nominal_denda,
          total_tagihan,
          status_tagihan,
          tanggal_jatuh_tempo,
          penghuni (
            id,
            user_id,
            users ( nama_lengkap, email, no_telepon ),
            kamar ( nomor_kamar )
          )
        )
      `)
      .order('tanggal_upload', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    const filtered = !isPengelola
      ? (data || []).filter((p) => p.tagihan?.penghuni?.user_id === req.user.id)
      : (data || []);

    res.json({ status: 'success', data: filtered });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
