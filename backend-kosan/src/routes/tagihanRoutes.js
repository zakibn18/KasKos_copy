// src/routes/tagihanRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken, isPengelola } = require('../middleware/authMiddleware');
const tagihanController = require('../controllers/tagihanController');

router.get('/', verifyToken, tagihanController.getTagihan);
router.post('/', verifyToken, isPengelola, tagihanController.createTagihan);
router.put('/:id', verifyToken, isPengelola, tagihanController.updateTagihan);
router.delete('/:id', verifyToken, isPengelola, tagihanController.deleteTagihan);
module.exports = router;