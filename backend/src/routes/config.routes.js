const express = require('express');
const router = express.Router();
const configController = require('../controllers/config.controller');
const { authenticate, isAdmin } = require('../middlewares/auth.middleware');

// Public routes (no authentication required)
// Get configuration value by key - accessible to frontend
router.get('/public/:key', configController.getConfigValue);

// Protected routes (require authentication)
router.use(authenticate);

// Get single configuration by key (with full details)
router.get('/:key', configController.getConfigByKey);

// Admin-only routes (require admin role)
router.use(isAdmin);

// Get all configurations with filtering and pagination
router.get('/', configController.getConfigs);

// Get all configuration categories
router.get('/meta/categories', configController.getCategories);

// Create new configuration
router.post('/', configController.createConfig);

// Update configuration by key
router.put('/:key', configController.updateConfig);

// Delete configuration by key
router.delete('/:key', configController.deleteConfig);

// Bulk update configurations
router.post('/bulk', configController.bulkUpdateConfigs);

module.exports = router;