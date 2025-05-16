const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate, isAdmin } = require('../middlewares/auth.middleware');

// All admin routes require authentication and admin role
router.use(authenticate, isAdmin);

// User management
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Credit management
router.get('/credits', adminController.getCredits);
router.get('/credits/export', adminController.exportCredits);

module.exports = router;