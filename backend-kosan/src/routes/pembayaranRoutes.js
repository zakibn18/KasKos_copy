// src/routes/pembayaranRoutes.js
const express = require('express');
const multer = require('multer');
const router = express.Router();
const { verifyToken, isPengelola } = require('../middleware/authMiddleware');
const pembayaranController = require('../controllers/pembayaranController');

const upload = multer({ storage: multer.memoryStorage() });
router.get('/', verifyToken, pembayaranController.getRiwayatPembayaran);
router.post('/upload', verifyToken, upload.single('bukti'), pembayaranController.uploadBuktiBayar);
router.put('/verifikasi/:id', verifyToken, isPengelola, pembayaranController.verifikasiManual);
module.exports = router;