const supabase = require('../config/supabase');

// Pengelola: Buat tagihan bulanan
exports.createTagihan = async (req, res) => {
  try {
    const {
      penghuni_id,
      bulan_tagihan,
      tahun_tagihan,
      nominal_dasar,
      nominal_denda,
      tanggal_jatuh_tempo
    } = req.body;

    if (!penghuni_id || !bulan_tagihan || !tahun_tagihan || !nominal_dasar || !tanggal_jatuh_tempo) {
      return res.status(400).json({ status: 'error', message: 'Semua field wajib diisi (penghuni, bulan, tahun, nominal, tanggal jatuh tempo).' });
    }

    const denda = Number(nominal_denda || 0);
    const nominal = Number(nominal_dasar);
    const total_tagihan = nominal + denda;

    const { data: tagihan, error } = await supabase
      .from('tagihan')
      .insert([{
        penghuni_id,
        bulan_tagihan: Number(bulan_tagihan),
        tahun_tagihan: Number(tahun_tagihan),
        nominal_dasar: nominal,
        nominal_denda: denda,
        total_tagihan,
        tanggal_jatuh_tempo,
        status_tagihan: 'belum_bayar'
      }])
      .select('*, penghuni(user_id, users(nama_lengkap))')
      .single();

    if (error) return res.status(500).json({ status: 'error', message: error.message });

    // Buat notifikasi otomatis untuk penghuni terkait
    if (tagihan.penghuni?.user_id) {
      await supabase.from('notifikasi').insert([{
        user_id: tagihan.penghuni.user_id,
        judul: `Tagihan Kos Periode ${bulan_tagihan}/${tahun_tagihan}`,
        pesan: `Tagihan kos periode ${bulan_tagihan}/${tahun_tagihan} sebesar Rp ${total_tagihan.toLocaleString('id-ID')} telah diterbitkan. Batas pembayaran tanggal ${tanggal_jatuh_tempo}.`,
        tipe: 'tagihan_baru'
      }]);
    }

    res.status(201).json({ status: 'success', message: 'Tagihan berhasil dibuat!', data: tagihan });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// Ambil data tagihan (Pengelola: semua | Penghuni: miliknya sendiri) + pengingat jatuh tempo
exports.getTagihan = async (req, res) => {
  try {
    const userRole = (req.user?.role || '').toLowerCase();
    const isPengelola = ['pengelola', 'pemilik', 'admin'].includes(userRole);

    let query = supabase
      .from('tagihan')
      .select(`
        *,
        penghuni (
          id,
          user_id,
          users ( nama_lengkap, email, no_telepon ),
          kamar ( nomor_kamar, tarif_bulanan )
        )
      `)
      .order('tahun_tagihan', { ascending: false })
      .order('bulan_tagihan', { ascending: false });

    // Jika penghuni, cari dulu penghuni.id berdasarkan req.user.id
    if (!isPengelola) {
      const { data: dataPenghuni } = await supabase
        .from('penghuni')
        .select('id')
        .eq('user_id', req.user.id)
        .single();

      if (!dataPenghuni) return res.json({ status: 'success', data: [] });
      query = query.eq('penghuni_id', dataPenghuni.id);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ status: 'error', message: error.message });

    // Hitung pengingat jatuh tempo otomatis
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const enrichedData = (data || []).map((item) => {
      let reminder = null;
      let isOverdue = false;

      if (item.status_tagihan !== 'lunas' && item.tanggal_jatuh_tempo) {
        const dueDate = new Date(item.tanggal_jatuh_tempo);
        dueDate.setHours(0, 0, 0, 0);
        const diffDays = Math.round((dueDate - today) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          isOverdue = true;
          reminder = `Terlambat ${Math.abs(diffDays)} hari dari batas jatuh tempo (${item.tanggal_jatuh_tempo})! Harap segera lakukan pembayaran.`;
        } else if (diffDays === 0) {
          reminder = `Perhatian: Hari ini adalah batas jatuh tempo pembayaran (${item.tanggal_jatuh_tempo})!`;
        } else if (diffDays <= 3) {
          reminder = `Pengingat: Tagihan akan jatuh tempo dalam ${diffDays} hari (${item.tanggal_jatuh_tempo}).`;
        }
      }
      return { ...item, reminder, isOverdue };
    });

    res.json({ status: 'success', data: enrichedData });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// Pengelola: Edit Tagihan
exports.updateTagihan = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      bulan_tagihan,
      tahun_tagihan,
      nominal_dasar,
      nominal_denda,
      tanggal_jatuh_tempo,
      status_tagihan
    } = req.body;

    const denda = Number(nominal_denda || 0);
    const nominal = Number(nominal_dasar);
    const total_tagihan = nominal + denda;

    const updateData = {
      total_tagihan
    };
    if (bulan_tagihan !== undefined) updateData.bulan_tagihan = Number(bulan_tagihan);
    if (tahun_tagihan !== undefined) updateData.tahun_tagihan = Number(tahun_tagihan);
    if (nominal_dasar !== undefined) updateData.nominal_dasar = nominal;
    if (nominal_denda !== undefined) updateData.nominal_denda = denda;
    if (tanggal_jatuh_tempo !== undefined) updateData.tanggal_jatuh_tempo = tanggal_jatuh_tempo;
    if (status_tagihan !== undefined) updateData.status_tagihan = status_tagihan;

    const { data, error } = await supabase
      .from('tagihan')
      .update(updateData)
      .eq('id', id)
      .select('*, penghuni(*, users(*), kamar(*))')
      .single();

    if (error) return res.status(500).json({ status: 'error', message: error.message });
    res.status(200).json({ status: 'success', message: 'Tagihan berhasil diperbarui!', data });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// Pengelola: Hapus Tagihan
exports.deleteTagihan = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('tagihan').delete().eq('id', id);
    if (error) return res.status(500).json({ status: 'error', message: error.message });
    res.status(200).json({ status: 'success', message: 'Tagihan berhasil dihapus!' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};
