// src/routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const aiController = require('../controllers/aiController');

router.post('/ask', verifyToken, aiController.askAssistant);
module.exports = router;