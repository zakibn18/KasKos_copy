const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// 1. Import semua routes
const authRoutes = require('./routes/authRoutes');
const kamarRoutes = require('./routes/kamarRoutes');
const penghuniRoutes = require('./routes/penghuniRoutes');
const tagihanRoutes = require('./routes/tagihanRoutes');
const pembayaranRoutes = require('./routes/pembayaranRoutes');
const kasRoutes = require('./routes/kasRoutes');
const aiRoutes = require('./routes/aiRoutes');
const notifikasiRoutes = require('./routes/notifikasiRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend secara statis
app.use(express.static(path.join(__dirname, '../../frontend-kosan')));

// 2. Daftarkan semua endpoint API
app.use('/api/auth', authRoutes);
app.use('/api/kamar', kamarRoutes);
app.use('/api/penghuni', penghuniRoutes);
app.use('/api/tagihan', tagihanRoutes);
app.use('/api/pembayaran', pembayaranRoutes);
app.use('/api/kas', kasRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifikasi', notifikasiRoutes);

app.get('/api/test', (req, res) => {
    res.status(200).json({ status: 'success', message: 'API Sistem Kos-kosan Berjalan Normal!' });
});

// Jalankan server jika dieksekusi langsung
if (require.main === module) {
    if (process.env.NODE_ENV !== 'production') {
        app.listen(PORT, () => {
            console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
        });
    }
}

module.exports = app;
