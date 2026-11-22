// src/routes/kasRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken, isPengelola } = require('../middleware/authMiddleware');
const kasController = require('../controllers/kasController');

router.get('/', verifyToken, isPengelola, kasController.getLaporanKas);
router.post('/', verifyToken, isPengelola, kasController.tambahKas);
module.exports = router;