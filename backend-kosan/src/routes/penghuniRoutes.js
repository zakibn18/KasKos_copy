const express = require('express');
const {
    getPenghuni,
    registerPenghuni,
    getProfilPenghuni,
    toggleStatusPenghuni,
    updatePenghuni,
    updateProfilPenghuni
} = require('../controllers/penghuniController');
const { verifyToken, isPengelola } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/me', verifyToken, getProfilPenghuni);
router.put('/me', verifyToken, updateProfilPenghuni);
router.get('/', verifyToken, isPengelola, getPenghuni);
router.post('/register', verifyToken, isPengelola, registerPenghuni);
router.put('/:id', verifyToken, isPengelola, updatePenghuni);
router.put('/:id/status', verifyToken, isPengelola, toggleStatusPenghuni);

module.exports = router;
