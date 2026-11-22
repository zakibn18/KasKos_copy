// src/controllers/notifikasiController.js
const supabase = require('../config/supabase');

exports.getNotifikasi = async (req, res) => {
  const { data, error } = await supabase
    .from('notifikasi')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

exports.tandaiDibaca = async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('notifikasi')
    .update({ dibaca: true })
    .eq('id', id)
    .eq('user_id', req.user.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Notifikasi ditandai dibaca' });
};