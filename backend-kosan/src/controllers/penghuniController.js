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

const updatePenghuni = async (req, res) => {
    const { id } = req.params;
    const { nama_lengkap, no_telepon, kamar_id, tanggal_masuk, status_aktif } = req.body;

    try {
        // 1. Ambil data penghuni saat ini
        const { data: currentPenghuni, error: fetchErr } = await supabase
            .from('penghuni')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchErr || !currentPenghuni) {
            return res.status(404).json({ status: 'error', message: 'Data penghuni tidak ditemukan.' });
        }

        // 2. Update data users jika nama_lengkap atau no_telepon diubah
        if (nama_lengkap || no_telepon !== undefined) {
            const userUpdate = {};
            if (nama_lengkap) userUpdate.nama_lengkap = nama_lengkap;
            if (no_telepon !== undefined) userUpdate.no_telepon = no_telepon;

            await supabase
                .from('users')
                .update(userUpdate)
                .eq('id', currentPenghuni.user_id);
        }

        // 3. Jika kamar berpindah, perbarui status kamar lama dan baru
        if (kamar_id && kamar_id !== currentPenghuni.kamar_id) {
            // Kamar lama jadi Tersedia
            if (currentPenghuni.kamar_id) {
                await supabase
                    .from('kamar')
                    .update({ status_kamar: 'Tersedia' })
                    .eq('id', currentPenghuni.kamar_id);
            }
            // Kamar baru jadi Terisi
            await supabase
                .from('kamar')
                .update({ status_kamar: 'Terisi' })
                .eq('id', kamar_id);
        }

        // 4. Update tabel penghuni
        const penghuniUpdate = {};
        if (kamar_id) penghuniUpdate.kamar_id = kamar_id;
        if (tanggal_masuk) penghuniUpdate.tanggal_masuk = tanggal_masuk;
        if (status_aktif !== undefined) penghuniUpdate.status_aktif = status_aktif;

        const { data: updatedPenghuni, error: updateErr } = await supabase
            .from('penghuni')
            .update(penghuniUpdate)
            .eq('id', id)
            .select('*, users(*), kamar(*)')
            .single();

        if (updateErr) throw updateErr;

        res.status(200).json({ status: 'success', message: 'Data penghuni berhasil diperbarui!', data: updatedPenghuni });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

const updateProfilPenghuni = async (req, res) => {
    try {
        const userId = req.user.id;
        const { nama_lengkap, no_telepon, password } = req.body;

        const updateData = {};
        if (nama_lengkap) updateData.nama_lengkap = nama_lengkap;
        if (no_telepon !== undefined) updateData.no_telepon = no_telepon;
        if (password && password.trim() !== '') updateData.password = password;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ status: 'error', message: 'Tidak ada data yang diubah.' });
        }

        const { data, error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', userId)
            .select('id, nama_lengkap, email, no_telepon, role')
            .single();

        if (error) throw error;

        res.status(200).json({ status: 'success', message: 'Profil Anda berhasil diperbarui!', data });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

module.exports = {
    getPenghuni,
    registerPenghuni,
    getProfilPenghuni,
    toggleStatusPenghuni,
    updatePenghuni,
    updateProfilPenghuni
};
