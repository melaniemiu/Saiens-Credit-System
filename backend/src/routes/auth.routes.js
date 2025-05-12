const express = require('express');
const router = express.Router();
const { lineLogin, registerUser } = require('../controllers/auth.controller');
const { authenticate, isAdmin } = require('../middlewares/auth.middleware');

// Line login
router.post('/line', lineLogin);

// Register user (admin only)
router.post('/register', authenticate, isAdmin, registerUser);

module.exports = router;