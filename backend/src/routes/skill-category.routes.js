const express = require('express');
const router = express.Router();
const skillCategoryController = require('../controllers/skill-category.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Get all skill categories
router.get('/', authenticate, skillCategoryController.getSkillCategories);

// Get skill category by ID
router.get('/:id', authenticate, skillCategoryController.getSkillCategoryById);

// Create new skill category (admin only)
router.post('/', authenticate, skillCategoryController.createSkillCategory);

// Get or create skill category by name (for skill creation)
router.post('/get-or-create', authenticate, skillCategoryController.getOrCreateSkillCategory);

// Update skill category (admin only)
router.put('/:id', authenticate, skillCategoryController.updateSkillCategory);

// Delete skill category (admin only)
router.delete('/:id', authenticate, skillCategoryController.deleteSkillCategory);

module.exports = router;