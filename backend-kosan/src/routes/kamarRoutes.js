const express = require('express');
const { getKamar, createKamar, deleteKamar } = require('../controllers/kamarController');
const { verifyToken, isPengelola } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', getKamar);
router.post('/', verifyToken, isPengelola, createKamar);
router.delete('/:id', verifyToken, isPengelola, deleteKamar);

module.exports = router;
