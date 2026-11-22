const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const notifikasiController = require('../controllers/notifikasiController');

router.get('/', verifyToken, notifikasiController.getNotifikasi);
router.put('/:id/baca', verifyToken, notifikasiController.tandaiDibaca);

module.exports = router;