const express = require('express');
const router = express.Router();
const { lineLogin, registerUser, logout } = require('../controllers/auth.controller');
const { authenticate, isAdmin } = require('../middlewares/auth.middleware');

// Line login
router.post('/line', lineLogin);

// Logout endpoint
router.post('/logout', logout);

// Register user (admin only)
router.post('/register', authenticate, isAdmin, registerUser);

module.exports = router;