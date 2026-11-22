const supabase = require('../config/supabase');

const getPenghuni = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('penghuni')
            .select(`
                id,
                user_id,
                kamar_id,
                tanggal_masuk,
                status_aktif,
                users ( id, nama_lengkap, email, no_telepon, role ),
                kamar ( id, nomor_kamar, tarif_bulanan, status_kamar )
            `)
            .order('tanggal_masuk', { ascending: false });

        if (error) throw error;
        res.status(200).json({ status: 'success', data });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

const registerPenghuni = async (req, res) => {
    const { nama_lengkap, email, password, no_telepon, kamar_id } = req.body;

    try {
        if (!nama_lengkap || !email || !password || !kamar_id) {
            return res.status(400).json({ status: 'error', message: 'Semua field (nama, email, password, kamar) wajib diisi!' });
        }

        // 1. Simpan ke tabel users
        const { data: userData, error: userError } = await supabase
            .from('users')
            .insert([{ nama_lengkap, email, password, role: 'Penghuni', no_telepon }])
            .select()
            .single();

        if (userError) throw userError;

        // 2. Simpan ke tabel penghuni menggunakan ID dari user yang baru dibuat
        const { data: penghuniData, error: penghuniError } = await supabase
            .from('penghuni')
            .insert([{
                user_id: userData.id,
                kamar_id: kamar_id,
                tanggal_masuk: new Date().toISOString().split('T')[0],
                status_aktif: true
            }])
            .select()
            .single();

        if (penghuniError) throw penghuniError;

        // 3. Ubah status kamar menjadi Terisi
        await supabase
            .from('kamar')
            .update({ status_kamar: 'Terisi' })
            .eq('id', kamar_id);

        res.status(201).json({ status: 'success', message: 'Penghuni berhasil didaftarkan!', data: penghuniData });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

const getProfilPenghuni = async (req, res) => {
    try {
        const userId = req.user.id;
        const { data, error } = await supabase
            .from('penghuni')
            .select(`
                id,
                tanggal_masuk,
                status_aktif,
                users ( nama_lengkap, email, no_telepon, role ),
                kamar ( nomor_kamar, tarif_bulanan, status_kamar )
            `)
            .eq('user_id', userId)
            .single();

        if (error || !data) {
            return res.status(404).json({ status: 'error', message: 'Profil penghuni belum terhubung dengan kamar.' });
        }

        res.status(200).json({ status: 'success', data });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

const toggleStatusPenghuni = async (req, res) => {
    try {
        const { id } = req.params;
        const { status_aktif } = req.body;

        const { data, error } = await supabase
            .from('penghuni')
            .update({ status_aktif })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.status(200).json({ status: 'success', message: `Status penghuni berhasil diperbarui!`, data });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

module.exports = { getPenghuni, registerPenghuni, getProfilPenghuni, toggleStatusPenghuni };
