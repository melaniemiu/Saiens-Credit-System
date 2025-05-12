const express = require('express');
const router = express.Router();
const {
  getCurrentUser,
  getUsers,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/user.controller');
const { authenticate, isAdmin } = require('../middlewares/auth.middleware');

// Apply authentication middleware to all routes
router.use(authenticate);

// Get current user profile
router.get('/me', getCurrentUser);

// Get list of users (for giving credit)
router.get('/list', getUsers);

// Admin routes
// Get all users
router.get('/all', isAdmin, getAllUsers);

// Create user
router.post('/', isAdmin, createUser);

// Update user
router.put('/:id', isAdmin, updateUser);

// Delete user (soft delete)
router.delete('/:id', isAdmin, deleteUser);

module.exports = router;