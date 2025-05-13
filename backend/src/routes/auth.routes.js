const express = require('express');
const router = express.Router();
const { lineLogin, registerUser, logout, bindEmployeeId } = require('../controllers/auth.controller');
const { authenticate, isAdmin } = require('../middlewares/auth.middleware');

// Line login
router.post('/line', lineLogin);

// Logout endpoint
router.post('/logout', logout);

// Bind employee ID to LINE user ID
router.post('/bind-employee', bindEmployeeId);

// Register user (admin only)
router.post('/register', authenticate, isAdmin, registerUser);

module.exports = router;