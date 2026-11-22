const supabase = require('../config/supabase');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper untuk mencoba model Gemini yang tersedia
async function generateAIResponse(prompt) {
  const modelsToTry = ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];
  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      lastError = err;
      console.warn(`Gagal memanggil model ${modelName}:`, err.message);
    }
  }
  throw lastError || new Error('Semua model AI sedang sibuk atau tidak tersedia.');
}

exports.askAssistant = async (req, res) => {
  try {
    const optionId = Number(req.body.optionId);
    const userId = req.user.id;
    const userRole = (req.user.role || '').toLowerCase();
    const isPengelola = ['pengelola', 'pemilik', 'admin'].includes(userRole);

    if (![1, 2, 3, 4, 5, 6, 7, 8].includes(optionId)) {
      return res.status(400).json({ message: 'Pilihan pertanyaan tidak valid. Silakan pilih opsi 1 - 8.' });
    }

    if ((optionId === 6 || optionId === 7) && !isPengelola) {
      return res.status(403).json({ message: 'Opsi 6 dan 7 adalah fitur khusus Pengelola kos.' });
    }

    // Ambil detail penghuni jika user adalah penghuni
    let penghuniData = null;
    if (!isPengelola) {
      const { data: p } = await supabase
        .from('penghuni')
        .select('id, user_id, kamar(nomor_kamar, tarif_bulanan)')
        .eq('user_id', userId)
        .single();
      penghuniData = p;
    }

    let contextData = {};
    let pertanyaanTeks = '';

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextMonthYear = currentMonth === 12 ? currentYear + 1 : currentYear;

    switch (optionId) {
      case 1:
        pertanyaanTeks = 'Cek tagihan bulan ini dan bulan depan';
        {
          let q = supabase
            .from('tagihan')
            .select('bulan_tagihan, tahun_tagihan, nominal_dasar, nominal_denda, total_tagihan, status_tagihan, tanggal_jatuh_tempo, penghuni(users(nama_lengkap), kamar(nomor_kamar))')
            .order('tahun_tagihan', { ascending: true })
            .order('bulan_tagihan', { ascending: true });

          if (!isPengelola && penghuniData) {
            q = q.eq('penghuni_id', penghuniData.id);
          }

          const { data: allTagihan } = await q;
          // Filter atau sertakan konteks bulan ini dan bulan depan
          contextData = {
            periode_sekarang: `${currentMonth}/${currentYear}`,
            periode_depan: `${nextMonth}/${nextMonthYear}`,
            daftar_tagihan: allTagihan || []
          };
        }
        break;

      case 2:
        pertanyaanTeks = 'Cek tanggal jatuh tempo';
        {
          let q = supabase
            .from('tagihan')
            .select('bulan_tagihan, tahun_tagihan, total_tagihan, tanggal_jatuh_tempo, status_tagihan, penghuni(users(nama_lengkap), kamar(nomor_kamar))')
            .neq('status_tagihan', 'lunas')
            .order('tanggal_jatuh_tempo', { ascending: true });

          if (!isPengelola && penghuniData) {
            q = q.eq('penghuni_id', penghuniData.id);
          }

          const { data: unpaid } = await q;
          contextData = {
            tanggal_hari_ini: currentDate.toISOString().split('T')[0],
            tagihan_belum_lunas: unpaid || []
          };
        }
        break;

      case 3:
        pertanyaanTeks = 'Cek status pembayaran';
        {
          let q = supabase
            .from('tagihan')
            .select('bulan_tagihan, tahun_tagihan, nominal_dasar, nominal_denda, total_tagihan, status_tagihan, tanggal_jatuh_tempo, penghuni(users(nama_lengkap), kamar(nomor_kamar))')
            .order('tahun_tagihan', { ascending: false })
            .order('bulan_tagihan', { ascending: false });

          if (!isPengelola && penghuniData) {
            q = q.eq('penghuni_id', penghuniData.id);
          }

          const { data: statusTagihan } = await q;
          contextData = {
            status_tagihan: statusTagihan || []
          };
        }
        break;

      case 4:
        pertanyaanTeks = 'Riwayat pembayaran';
        {
          const { data: bayar } = await supabase
            .from('pembayaran')
            .select('id, tanggal_upload, ocr_nominal_terbaca, ocr_tanggal_terbaca, ocr_nama_pengirim, status_verifikasi, tagihan(bulan_tagihan, tahun_tagihan, total_tagihan, penghuni_id, penghuni(users(nama_lengkap), kamar(nomor_kamar)))')
            .order('tanggal_upload', { ascending: false });

          let filtered = bayar || [];
          if (!isPengelola && penghuniData) {
            filtered = filtered.filter(b => b.tagihan?.penghuni_id === penghuniData.id);
          }
          contextData = { riwayat_pembayaran: filtered };
        }
        break;

      case 5:
        pertanyaanTeks = 'Cara upload bukti transfer';
        contextData = {
          panduan_upload: [
            '1. Buka menu Tagihan Saya pada dashboard penghuni.',
            '2. Cari tagihan bulan berjalan yang berstatus "belum_bayar" atau "ditolak".',
            '3. Klik tombol "Unggah Bukti", lalu pilih foto bukti transfer bank/e-wallet yang jernih dan terbaca.',
            '4. Sistem OCR berbasis AI akan langsung memindai nominal, tanggal, dan nama pengirim bukti transfer Anda.',
            '5. Jika nominal tepat sesuai dengan total tagihan, pembayaran otomatis diverifikasi LUNAS.',
            '6. Jika nominal atau foto meragukan, pembayaran akan masuk status "Menunggu Verifikasi" untuk diperiksa manual oleh pengelola kos.'
          ]
        };
        break;

      case 6:
        pertanyaanTeks = 'Rangkuman kas bulanan';
        {
          const { data: kasList } = await supabase
            .from('arus_kas')
            .select('*')
            .order('tanggal_transaksi', { ascending: false });

          const transaksi = kasList || [];
          const totalPemasukan = transaksi
            .filter(t => t.jenis === 'pemasukan')
            .reduce((sum, t) => sum + Number(t.nominal || 0), 0);
          const totalPengeluaran = transaksi
            .filter(t => t.jenis === 'pengeluaran')
            .reduce((sum, t) => sum + Number(t.nominal || 0), 0);
          const saldo = totalPemasukan - totalPengeluaran;

          contextData = {
            ringkasan_kas: {
              total_pemasukan: totalPemasukan,
              total_pengeluaran: totalPengeluaran,
              saldo_akhir: saldo,
              jumlah_transaksi: transaksi.length
            },
            transaksi_terbaru: transaksi.slice(0, 10)
          };
        }
        break;

      case 7:
        pertanyaanTeks = 'Daftar penghuni yang menunggak';
        {
          const { data: tunggakan } = await supabase
            .from('tagihan')
            .select('bulan_tagihan, tahun_tagihan, total_tagihan, tanggal_jatuh_tempo, status_tagihan, penghuni(users(nama_lengkap, no_telepon), kamar(nomor_kamar))')
            .neq('status_tagihan', 'lunas')
            .order('tanggal_jatuh_tempo', { ascending: true });

          contextData = {
            total_penunggak: (tunggakan || []).length,
            daftar_penunggak: (tunggakan || []).map(t => ({
              nama: t.penghuni?.users?.nama_lengkap || 'Penghuni',
              telepon: t.penghuni?.users?.no_telepon || '-',
              kamar: t.penghuni?.kamar?.nomor_kamar || '-',
              periode: `${t.bulan_tagihan}/${t.tahun_tagihan}`,
              total: t.total_tagihan,
              jatuh_tempo: t.tanggal_jatuh_tempo,
              status: t.status_tagihan
            }))
          };
        }
        break;

      case 8:
        pertanyaanTeks = 'Cara menggunakan fitur aplikasi lainnya';
        contextData = {
          panduan_fitur: isPengelola
            ? [
                '• Manajemen Kamar: Tambah nomor kamar baru, atur tarif bulanan sewa, dan pantau status kamar (Tersedia/Terisi).',
                '• Data Penghuni: Daftarkan akun penghuni baru dan hubungkan langsung dengan kamar yang tersedia.',
                '• Manajemen Tagihan: Terbitkan tagihan bulanan untuk penghuni dengan denda dan tanggal jatuh tempo.',
                '• Verifikasi Pembayaran: Tinjau bukti transfer penghuni yang membutuhkan pengecekan manual, lalu setujui atau tolak.',
                '• Laporan Arus Kas: Catat pemasukan dan pengeluaran operasional kos, serta pantau saldo kas realtime.',
                '• Asisten AI: Akses ringkasan kas cepat dan daftar penunggak cukup dengan satu klik opsi.'
              ]
            : [
                '• Dashboard Utama: Pantau ringkasan tagihan bulanan Anda, tanggal jatuh tempo, dan peringatan denda.',
                '• Tagihan Saya: Lihat rincian tagihan bulan ini dan bulan depan, serta unggah bukti bayar dengan verifikasi OCR cerdas.',
                '• Riwayat Pembayaran: Cek daftar pembayaran terdahulu dan bukti status verifikasinya.',
                '• Profil Penghuni: Lihat informasi akun, kontak, dan nomor kamar yang Anda tempati.',
                '• Asisten AI: Gunakan asisten virtual untuk mengecek tagihan, jatuh tempo, riwayat, atau petunjuk penggunaan secara instan tanpa perlu mengetik.'
              ]
        };
        break;
    }

    const prompt = `Kamu adalah Asisten Virtual Sistem Informasi Pengelolaan Kas dan Tagihan Kos (KasKos).
Tugasmu: Menjawab pertanyaan pengguna dengan ramah, rapi, profesional, dan akurat dalam bahasa Indonesia berdasarkan data JSON yang disediakan.
Peran Pengguna: ${isPengelola ? 'Pengelola / Pemilik Kos' : 'Penghuni Kos'}
Topik/Pertanyaan: "${pertanyaanTeks}"
Data Sistem (JSON):
${JSON.stringify(contextData, null, 2)}

Petunjuk Tambahan:
- Format jawaban dengan poin-poin atau paragraf yang rapi dan mudah dibaca (gunakan nominal mata uang Rupiah contoh Rp 850.000).
- JANGAN mengarang data atau angka yang tidak ada dalam JSON. Jika data kosong (misalnya tidak ada tunggakan), sampaikan dengan ramah bahwa tidak ada tagihan tertunggak.
- Jangan sebutkan kata "JSON" ke pengguna; bicaralah layaknya staf pengelola kos yang sigap dan sopan.`;

    const jawaban = await generateAIResponse(prompt);
    res.json({ status: 'success', pertanyaan: pertanyaanTeks, jawaban });
  } catch (err) {
    console.error('AI Error:', err);
    res.status(500).json({ error: err.message || 'Gagal memproses asisten AI' });
  }
};
