const supabase = require('../config/supabase');

const getKamar = async (req, res) => {
    try {
        let query = supabase.from('kamar').select('*').order('nomor_kamar', { ascending: true });
        
        // Filter jika frontend hanya meminta kamar dengan status tertentu
        if (req.query.status) {
            query = query.eq('status_kamar', req.query.status);
        }

        const { data, error } = await query;
        if (error) throw error;

        res.status(200).json({ status: 'success', data });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

const createKamar = async (req, res) => {
    const { nomor_kamar, tarif_bulanan, status_kamar } = req.body;
    try {
        if (!nomor_kamar || !tarif_bulanan) {
            return res.status(400).json({ status: 'error', message: 'Nomor kamar dan tarif bulanan wajib diisi.' });
        }

        const { data, error } = await supabase
            .from('kamar')
            .insert([{
                nomor_kamar,
                tarif_bulanan: Number(tarif_bulanan),
                status_kamar: status_kamar || 'Tersedia'
            }])
            .select();
            
        if (error) throw error;
        res.status(201).json({ status: 'success', message: 'Kamar berhasil ditambahkan', data: data[0] });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

const deleteKamar = async (req, res) => {
    const { id } = req.params;
    try {
        const { error } = await supabase.from('kamar').delete().eq('id', id);
        if (error) throw error;
        res.status(200).json({ status: 'success', message: 'Kamar berhasil dihapus' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

const updateKamar = async (req, res) => {
    const { id } = req.params;
    const { nomor_kamar, tarif_bulanan, status_kamar } = req.body;
    try {
        if (!nomor_kamar || !tarif_bulanan) {
            return res.status(400).json({ status: 'error', message: 'Nomor kamar dan tarif bulanan wajib diisi.' });
        }

        const { data, error } = await supabase
            .from('kamar')
            .update({
                nomor_kamar,
                tarif_bulanan: Number(tarif_bulanan),
                status_kamar: status_kamar || 'Tersedia'
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.status(200).json({ status: 'success', message: 'Data kamar berhasil diperbarui', data });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

module.exports = { getKamar, createKamar, deleteKamar, updateKamar };
