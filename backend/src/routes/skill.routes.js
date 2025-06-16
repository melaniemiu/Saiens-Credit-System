const express = require('express');
const router = express.Router();
const skillController = require('../controllers/skill.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// All skill routes require authentication
router.use(authenticate);

// User skill routes
router.get('/user', skillController.getUserSkills);
router.get('/job', skillController.getJobSkills);
router.get('/suggested', skillController.getSuggestedSkills);
router.get('/stats', skillController.getSkillStats);
router.put('/:skillId/progress', skillController.updateUserSkill);

module.exports = router;