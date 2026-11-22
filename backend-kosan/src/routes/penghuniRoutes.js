const express = require('express');
const { getPenghuni, registerPenghuni, getProfilPenghuni, toggleStatusPenghuni } = require('../controllers/penghuniController');
const { verifyToken, isPengelola } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/me', verifyToken, getProfilPenghuni);
router.get('/', verifyToken, isPengelola, getPenghuni);
router.post('/register', verifyToken, isPengelola, registerPenghuni);
router.put('/:id/status', verifyToken, isPengelola, toggleStatusPenghuni);

module.exports = router;
