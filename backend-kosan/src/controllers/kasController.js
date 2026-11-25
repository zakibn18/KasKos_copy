// src/controllers/kasController.js
const supabase = require('../config/supabase');

exports.getLaporanKas = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('arus_kas')
      .select('*')
      .order('tanggal_transaksi', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ status: 'error', message: error.message });

    const transaksi = data || [];
    const totalPemasukan = transaksi
      .filter((k) => k.jenis === 'pemasukan')
      .reduce((acc, cur) => acc + Number(cur.nominal || 0), 0);

    const totalPengeluaran = transaksi
      .filter((k) => k.jenis === 'pengeluaran')
      .reduce((acc, cur) => acc + Number(cur.nominal || 0), 0);

    res.json({
      status: 'success',
      ringkasan: {
        totalPemasukan,
        totalPengeluaran,
        saldoAkhir: totalPemasukan - totalPengeluaran,
        jumlahTransaksi: transaksi.length
      },
      transaksi
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.tambahKas = async (req, res) => {
  try {
    const { jenis, nominal, tanggal_transaksi, keterangan } = req.body;
    if (!jenis || !nominal || !keterangan) {
      return res.status(400).json({ status: 'error', message: 'Jenis, nominal, dan keterangan transaksi wajib diisi.' });
    }

    const { data, error } = await supabase
      .from('arus_kas')
      .insert([{
        jenis, // 'pemasukan' atau 'pengeluaran'
        nominal: Number(nominal),
        tanggal_transaksi: tanggal_transaksi || new Date().toISOString().split('T')[0],
        keterangan
      }])
      .select()
      .single();

    if (error) return res.status(500).json({ status: 'error', message: error.message });
    res.status(201).json({ status: 'success', message: 'Transaksi arus kas berhasil dicatat', data });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.updateKas = async (req, res) => {
  try {
    const { id } = req.params;
    const { jenis, nominal, tanggal_transaksi, keterangan } = req.body;

    const updateData = {};
    if (jenis) updateData.jenis = jenis;
    if (nominal !== undefined) updateData.nominal = Number(nominal);
    if (tanggal_transaksi) updateData.tanggal_transaksi = tanggal_transaksi;
    if (keterangan) updateData.keterangan = keterangan;

    const { data, error } = await supabase
      .from('arus_kas')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ status: 'error', message: error.message });
    res.status(200).json({ status: 'success', message: 'Transaksi arus kas berhasil diperbarui!', data });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.deleteKas = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('arus_kas').delete().eq('id', id);
    if (error) return res.status(500).json({ status: 'error', message: error.message });
    res.status(200).json({ status: 'success', message: 'Transaksi arus kas berhasil dihapus!' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};
