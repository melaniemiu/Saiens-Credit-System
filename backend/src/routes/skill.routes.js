const express = require('express');
const router = express.Router();
const skillController = require('../controllers/skill.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// All skill routes require authentication
router.use(authenticate);

// Get user's skill progress
router.get('/user', skillController.getUserSkills);

// Get skills available for user's job
router.get('/job', skillController.getJobSkills);

// Get suggested skills (next job level)
router.get('/suggested', skillController.getSuggestedSkills);

// Get skill statistics
router.get('/stats', skillController.getSkillStats);

// Update user skill progress
router.put('/:skillId/progress', skillController.updateUserSkill);

module.exports = router;