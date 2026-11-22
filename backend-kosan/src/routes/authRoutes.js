const express = require('express');
const { login, register } = require('../controllers/authController');
const router = express.Router();

// Endpoint untuk Login
router.post('/login', login);

// Endpoint untuk Register
router.post('/register', register);

module.exports = router;